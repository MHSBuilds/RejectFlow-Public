import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendRejectionEmail } from '@/lib/resend';
import { getAuthUser } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    // Validate Supabase admin client is available
    if (!supabaseAdmin) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not configured');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase service role key' }, 
        { status: 500 }
      );
    }

    // Get current user from NextAuth session
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { draft_id, job_title, contact_info } = await request.json();

    if (!draft_id) {
      return NextResponse.json({ error: 'Missing draft_id' }, { status: 400 });
    }

    // Get draft with candidate info
    const { data: draft, error: fetchError } = await supabaseAdmin!
      .from('rejection_emails')
      .select(`
        *,
        candidates (
          full_name,
          email,
          position
        )
      `)
      .eq('id', draft_id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    if (draft.status !== 'approved') {
      return NextResponse.json({ error: 'Draft must be approved before sending' }, { status: 400 });
    }

    // FIRST: Ensure user exists in users table before incrementing usage
    // This ensures usage is tracked under the same ID as candidates
    let dbUserId = user.id;
    
    // First, try to find user by email (handles ID mismatch cases)
    const { data: userByEmail } = await supabaseAdmin!
      .from('users')
      .select('id, email')
      .eq('email', user.email!)
      .maybeSingle();
    
    if (userByEmail) {
      if (userByEmail.id !== user.id) {
        console.log(`[Send Email] User ID mismatch. Session: ${user.id}, DB: ${userByEmail.id}. Using DB user ID.`);
      }
      dbUserId = userByEmail.id;
    } else {
      // User doesn't exist in users table, create them
      console.log(`[Send Email] User not found in users table, creating new user...`);
      const { data: newUser, error: createUserError } = await supabaseAdmin!
        .from('users')
        .insert({
          id: user.id, // Use session ID as primary key
          email: user.email!,
          full_name: user.name || user.email?.split('@')[0] || 'User',
          provider: 'google',
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createUserError) {
        // If duplicate email error, fetch the existing user
        if (createUserError.code === '23505') {
          const { data: existingUser } = await supabaseAdmin!
            .from('users')
            .select('id')
            .eq('email', user.email!)
            .maybeSingle();
          
          if (existingUser) {
            dbUserId = existingUser.id;
            console.log(`[Send Email] Using existing user ID after conflict: ${dbUserId}`);
          } else {
            console.error('[Send Email] Failed to create/find user:', createUserError);
            return NextResponse.json({ 
              error: 'Failed to create user account',
              details: createUserError.message 
            }, { status: 500 });
          }
        } else {
          console.error('[Send Email] Failed to create user:', createUserError);
          return NextResponse.json({ 
            error: 'Failed to create user account',
            details: createUserError.message 
          }, { status: 500 });
        }
      } else if (newUser) {
        dbUserId = newUser.id;
        console.log(`[Send Email] Created new user: ${dbUserId}`);
      }
    }

    // Check usage limits - use YYYY-MM-DD format for consistency
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    const monthKey = currentMonth.toISOString().slice(0, 10); // Format: YYYY-MM-DD

    // Use dbUserId for usage check (consistent with candidates)
    const { data: usage, error: usageFetchError } = await supabaseAdmin!
      .from('user_usage')
      .select('*')
      .eq('user_id', dbUserId)
      .eq('month', monthKey)
      .maybeSingle();
    
    if (usageFetchError && usageFetchError.code !== 'PGRST116') {
      console.error('[Send Email] Error fetching usage:', usageFetchError);
    }

    // Get user profile with subscription tier and signature info
    // Only select columns that exist in the table (job_title, contact_info come from request body for Free tier)
    let profile: { sender_name?: string; company_name?: string; subscription_tier?: string } | null = null;
    
    const { data: profileData, error: profileError } = await supabaseAdmin!
      .from('user_profiles')
      .select('sender_name, company_name, subscription_tier')
      .eq('user_id', dbUserId)
      .maybeSingle();
    
    if (profileData) {
      profile = profileData;
    }

    // Debug logging for profile and company name
    console.log('Profile fetch result:', {
      hasProfile: !!profile,
      profileError: profileError?.message || null,
      sessionUserId: user.id,
      dbUserId: dbUserId,
      userEmail: user.email,
      companyName: profile?.company_name || '(not set)',
      companyNameLength: profile?.company_name?.length || 0,
      senderName: profile?.sender_name || '(not set)'
    });

    const subscriptionTier = profile?.subscription_tier || 'free';

    // Set limit based on subscription tier
    let emailLimit: number;
    switch (subscriptionTier) {
      case 'starter':
        emailLimit = 50;
        break;
      case 'professional':
        emailLimit = 250;
        break;
      case 'enterprise':
        emailLimit = 999999; // Effectively unlimited
        break;
      default:
        emailLimit = 10; // Free tier
    }

    const emailsSent = usage?.emails_sent || 0;

    // Bypass usage limit for testing account
    const TEST_EMAIL = 'hassaan.sajjad@gmail.com';
    const isTestAccount = user.email?.toLowerCase() === TEST_EMAIL.toLowerCase();

    if (!isTestAccount && emailsSent >= emailLimit) {
      return NextResponse.json({ 
        error: 'Monthly email limit reached',
        details: `You have reached your ${subscriptionTier} plan limit of ${emailLimit} emails per month. ${subscriptionTier === 'free' ? 'Upgrade to send more.' : 'Contact support to increase your limit.'}`,
        limit: emailLimit,
        used: emailsSent,
        upgradeUrl: '/pricing'
      }, { status: 403 });
    }

    // Extract name from email if no profile
    const extractName = (email: string) => {
      const name = email.split('@')[0];
      return name.split('.').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' ');
    };

    const senderName = profile?.sender_name || extractName(user.email || '');
    const companyName = profile?.company_name || '';
    
    // For free tier: signature comes from request body (localStorage on client)
    // job_title and contact_info are not stored in DB for free tier
    const jobTitle = job_title || '';
    const contactInfo = contact_info || '';
    
    // Log signature fields for debugging
    console.log('Email signature fields:', {
      senderName,
      companyName,
      companyNameLength: companyName?.length || 0,
      companyNameTrimmed: companyName?.trim() || '(empty)',
      subscriptionTier,
      profileCompanyName: profile?.company_name,
      jobTitle,
      contactInfo,
      willShowSignature: !!(senderName || jobTitle || companyName || contactInfo)
    });

    // Send email using default sender (free tier only - paid tiers use HR Portal API)
    const subject = `Update on your application for ${draft.candidates.position}`;
    const result = await sendRejectionEmail(
      draft.candidates.email,
      subject,
      draft.draft_content,
      draft.candidates.full_name,
      user.email || '',  // Reply-to address
      senderName,  // Display name
      companyName,  // Company name (optional)
      jobTitle,     // Job title (optional)
      contactInfo   // Contact info (optional)
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Update draft status
    const { error: updateError } = await supabaseAdmin!
      .from('rejection_emails')
      .update({ 
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', draft_id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update draft status' }, { status: 500 });
    }

    // Fetch updated draft with full details (candidate and feedback) for response
    const { data: updatedDraft, error: fetchUpdatedError } = await supabaseAdmin!
      .from('rejection_emails')
      .select(`
        *,
        candidates (
          full_name,
          email,
          position
        ),
        interview_feedback (
          rating,
          notes,
          rejection_reasons,
          areas_for_improvement
        )
      `)
      .eq('id', draft_id)
      .single();

    if (fetchUpdatedError) {
      return NextResponse.json({ error: 'Failed to fetch updated draft' }, { status: 500 });
    }

    // Transform the data to match DraftWithDetails type
    const transformedDraft = {
      ...updatedDraft,
      candidate: Array.isArray(updatedDraft.candidates) ? updatedDraft.candidates[0] : updatedDraft.candidates,
      feedback: Array.isArray(updatedDraft.interview_feedback) ? updatedDraft.interview_feedback[0] : updatedDraft.interview_feedback,
    };
    
    // Remove the original plural fields
    delete transformedDraft.candidates;
    delete transformedDraft.interview_feedback;

    // Increment usage counter - use dbUserId for consistency with candidates
    const newEmailsSent = emailsSent + 1;
    console.log('[Send Email] Incrementing usage:', {
      dbUserId,
      monthKey,
      currentEmailsSent: emailsSent,
      newEmailsSent,
      userEmail: user.email
    });
    
    const { data: usageUpdate, error: usageUpdateError } = await supabaseAdmin!
      .from('user_usage')
      .upsert({
        user_id: dbUserId,
        month: monthKey,
        emails_sent: newEmailsSent
      }, {
        onConflict: 'user_id,month'
      });
    
    if (usageUpdateError) {
      console.error('[Send Email] Error incrementing usage:', usageUpdateError);
    } else {
      console.log('[Send Email] Usage incremented successfully:', {
        dbUserId,
        monthKey,
        emails_sent: newEmailsSent
      });
    }

    return NextResponse.json({ 
      draft: transformedDraft,
      messageId: result.messageId 
    });

  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}



