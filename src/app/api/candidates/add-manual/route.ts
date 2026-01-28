import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateRejectionEmail } from '@/lib/openai';
import { getAuthUser } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    console.log('Add manual candidate API called');
    
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

    // Ensure user exists in users table before inserting candidate
    // First check by email (more reliable), then by ID
    console.log(`[Add Manual] Checking user: id=${user.id}, email=${user.email}`);
    
    let dbUserId = user.id;
    
    // First, try to find user by email (handles ID mismatch cases)
    const { data: userByEmail } = await supabaseAdmin!
      .from('users')
      .select('id, email')
      .eq('email', user.email!)
      .single();

    if (userByEmail) {
      console.log(`[Add Manual] Found user by email: ${userByEmail.id}`);
      dbUserId = userByEmail.id;
    } else {
      // User doesn't exist, create them
      console.log(`[Add Manual] User not found, creating new user...`);
      const { data: newUser, error: createUserError } = await supabaseAdmin!
        .from('users')
        .insert({
          email: user.email,
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
            .single();
          
          if (existingUser) {
            dbUserId = existingUser.id;
            console.log(`[Add Manual] Using existing user ID after conflict: ${dbUserId}`);
          }
        } else {
          console.error('[Add Manual] Failed to create user:', createUserError);
          return NextResponse.json({ 
            error: 'Failed to create user account',
            details: createUserError.message 
          }, { status: 500 });
        }
      } else if (newUser) {
        dbUserId = newUser.id;
        console.log(`[Add Manual] Created new user: ${dbUserId}`);
      }
    }

    // Parse request body
    const formData = await request.json();
    const { 
      full_name, 
      email, 
      position, 
      rating, 
      notes, 
      rejection_reasons, 
      areas_for_improvement 
    } = formData;

    console.log(`Creating candidate: ${full_name} (${email}) for position: ${position}`);

    // Validate required fields
    if (!full_name || !email || !position) {
      return NextResponse.json({ 
        error: 'Missing required fields: full_name, email, and position are required' 
      }, { status: 400 });
    }

    // Validate rejection reasons
    if (!rejection_reasons || rejection_reasons.length === 0) {
      return NextResponse.json({ 
        error: 'At least one rejection reason is required' 
      }, { status: 400 });
    }

    // Insert candidate with user_id (using dbUserId which is verified to exist)
    console.log(`[Add Manual] Inserting candidate with user_id: ${dbUserId}`);
    const { data: candidate, error: candidateError } = await supabaseAdmin
      .from('candidates')
      .insert({
        full_name,
        email,
        position,
        user_id: dbUserId
      })
      .select()
      .single();

    if (candidateError) {
      console.error('Candidate insert error:', candidateError);
      
      // Check for duplicate email error
      if (candidateError.code === '23505' && candidateError.message.includes('candidates_user_email_unique')) {
        return NextResponse.json({ 
          error: `You already have a candidate with email "${email}" for this position` 
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to create candidate: ' + candidateError.message 
      }, { status: 500 });
    }

    console.log(`Candidate created with ID: ${candidate.id}`);

    // Insert interview feedback
    const { data: feedback, error: feedbackError } = await supabaseAdmin
      .from('interview_feedback')
      .insert({
        candidate_id: candidate.id,
        interviewer_name: 'HR Team',
        rating: rating || 5,
        notes: notes || '',
        rejection_reasons: rejection_reasons || [],
        areas_for_improvement: areas_for_improvement || []
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('Feedback insert error:', feedbackError);
      // Clean up candidate if feedback fails
      await supabaseAdmin
        .from('candidates')
        .delete()
        .eq('id', candidate.id);
      
      return NextResponse.json({ 
        error: 'Failed to create interview feedback: ' + feedbackError.message 
      }, { status: 500 });
    }

    console.log(`Feedback created with ID: ${feedback.id}`);

    // Auto-generate draft email
    try {
      console.log('Auto-generating draft email...');
      
      // Ensure arrays are properly formatted
      const rejectionReasons = Array.isArray(rejection_reasons) 
        ? rejection_reasons 
        : (rejection_reasons ? [rejection_reasons] : []);
      
      const areasForImprovement = Array.isArray(areas_for_improvement)
        ? areas_for_improvement
        : (areas_for_improvement ? [areas_for_improvement] : []);

      // Get user profile to fetch company name
      const { data: profile } = await supabaseAdmin!
        .from('user_profiles')
        .select('company_name')
        .eq('user_id', user.id)
        .single();

      const companyName = profile?.company_name || '';

      // Generate email using OpenAI
      const draftContent = await generateRejectionEmail(
        full_name,
        position,
        rating || 5,
        notes || '',
        rejectionReasons,
        areasForImprovement,
        companyName
      );

      // Save draft to database
      const { data: draft, error: draftError } = await supabaseAdmin
        .from('rejection_emails')
        .insert({
          candidate_id: candidate.id,
          feedback_id: feedback.id,
          draft_content: draftContent,
          status: 'draft',
          version: 1
        })
        .select()
        .single();

      if (draftError) {
        console.error('Draft generation error (non-fatal):', draftError);
        // Don't fail the request if draft generation fails
      } else {
        console.log(`Draft generated successfully with ID: ${draft.id}`);
      }
    } catch (draftError) {
      console.error('Error generating draft (non-fatal):', draftError);
      // Don't fail the request if draft generation fails
    }

    return NextResponse.json({
      success: true,
      message: 'Candidate added successfully. Draft email generated.',
      candidate: {
        id: candidate.id,
        full_name: candidate.full_name,
        email: candidate.email,
        position: candidate.position
      },
      feedback: {
        id: feedback.id
      }
    });

  } catch (error) {
    console.error('Add manual candidate error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}


