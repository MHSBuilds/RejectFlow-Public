import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Get authenticated user from NextAuth session
    const user = await getAuthUser(request);
    
    if (!user) {
      console.error('[Usage API] No authenticated user found');
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Please sign in to check usage'
      }, { status: 401 });
    }

    // Look up the correct database user ID by email
    // This ensures we query usage under the same ID used for candidates
    let dbUserId = user.id;
    const { data: userByEmail } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', user.email!)
      .maybeSingle();
    
    if (userByEmail) {
      if (userByEmail.id !== user.id) {
        console.log(`[Usage Check] User ID mismatch. Session: ${user.id}, DB: ${userByEmail.id}. Using DB user ID.`);
      }
      dbUserId = userByEmail.id;
    }

    // Get current month usage - use YYYY-MM-DD format to match send-email route
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    const monthKey = currentMonth.toISOString().slice(0, 10); // Format: YYYY-MM-DD

    // Use dbUserId for usage query (consistent with send-email route)
    console.log('[Usage Check] Querying usage:', {
      sessionUserId: user.id,
      dbUserId,
      userEmail: user.email,
      monthKey
    });
    
    const { data: usage, error: usageError } = await supabaseAdmin
      .from('user_usage')
      .select('*')
      .eq('user_id', dbUserId)
      .eq('month', monthKey)
      .maybeSingle();

    if (usageError && usageError.code !== 'PGRST116') {
      console.error('[Usage Check] Error fetching usage:', usageError);
      return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 });
    }
    
    console.log('[Usage Check] Usage result:', {
      dbUserId,
      monthKey,
      usageFound: !!usage,
      emailsSent: usage?.emails_sent || 0
    });

    // Fetch user profile with subscription tier (use dbUserId)
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('subscription_tier')
      .eq('user_id', dbUserId)
      .maybeSingle();

    const subscriptionTier = profile?.subscription_tier || 'free';

    // Set limit based on subscription tier
    let limit: number;
    switch (subscriptionTier) {
      case 'starter':
        limit = 50;
        break;
      case 'professional':
        limit = 250;
        break;
      case 'enterprise':
        limit = 999999; // Effectively unlimited
        break;
      default:
        limit = 10; // Free tier
    }

    const emailsSent = usage?.emails_sent || 0;
    const emailsGenerated = usage?.emails_generated || 0;
    const apiCalls = usage?.api_calls || 0;

    // For free tier, show email limits. For paid tiers, show API limits
    let displayLimit: number;
    let displayUsed: number;
    let displayRemaining: number;
    let canUse: boolean;

    // Bypass usage limit for testing account
    const TEST_EMAIL = 'hassaan.sajjad@gmail.com';
    const isTestAccount = user.email?.toLowerCase() === TEST_EMAIL.toLowerCase();

    if (subscriptionTier === 'free') {
      displayLimit = limit;
      displayUsed = emailsSent;
      displayRemaining = isTestAccount ? 999999 : Math.max(0, limit - emailsSent);
      canUse = isTestAccount || emailsSent < limit;
    } else {
      // For paid tiers, show API call limits
      switch (subscriptionTier) {
        case 'starter':
          displayLimit = 100;
          break;
        case 'professional':
          displayLimit = 500;
          break;
        case 'enterprise':
          displayLimit = 999999;
          break;
        default:
          displayLimit = 0;
      }
      displayUsed = apiCalls;
      displayRemaining = Math.max(0, displayLimit - apiCalls);
      canUse = apiCalls < displayLimit;
    }

    return NextResponse.json({
      emailsSent,
      emailsGenerated,
      apiCalls,
      limit: displayLimit,
      used: displayUsed,
      remaining: displayRemaining,
      canSend: canUse,
      resetDate: getNextMonthDate(),
      subscriptionTier,
      usageType: subscriptionTier === 'free' ? 'emails' : 'api_calls'
    });
  } catch (error) {
    console.error('Usage check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getNextMonthDate() {
  const next = new Date();
  next.setMonth(next.getMonth() + 1);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next.toISOString();
}


