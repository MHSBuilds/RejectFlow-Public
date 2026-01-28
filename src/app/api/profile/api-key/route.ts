import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { randomBytes } from 'crypto';
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

    // Get user profile to check subscription tier
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('subscription_tier, hr_portal_api_key')
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    // Check if user has a paid plan
    const subscriptionTier = profile?.subscription_tier || 'free';
    if (subscriptionTier === 'free') {
      return NextResponse.json({ 
        error: 'API keys are only available for paid plans. Please upgrade to Starter, Professional, or Enterprise.' 
      }, { status: 403 });
    }

    // Generate a unique API key
    // Format: rf_<32 random hex characters>
    const apiKeyPrefix = 'rf_';
    const randomPart = randomBytes(32).toString('hex');
    const apiKey = `${apiKeyPrefix}${randomPart}`;

    // Upsert user profile with API key
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        hr_portal_api_key: apiKey,
        hr_portal_api_enabled: true,
        subscription_tier: subscriptionTier,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (updateError) {
      console.error('API key generation error:', updateError);
      return NextResponse.json({ error: 'Failed to generate API key' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      apiKey: apiKey,
      message: 'API key generated successfully' 
    });

  } catch (error) {
    console.error('API key generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate Supabase admin client is available
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' }, 
        { status: 500 }
      );
    }

    // Get current user from auth header
    // Get current user from NextAuth session
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('subscription_tier, hr_portal_api_key, hr_portal_api_enabled')
      .eq('user_id', user.id)
      .single();

    // Mask the API key for security (show only first 8 characters and last 4)
    let maskedKey = null;
    if (profile?.hr_portal_api_key) {
      const key = profile.hr_portal_api_key;
      maskedKey = `${key.substring(0, 8)}${'•'.repeat(24)}${key.substring(key.length - 4)}`;
    }

    return NextResponse.json({ 
      apiKey: profile?.hr_portal_api_key || null,
      maskedKey: maskedKey,
      hasKey: !!profile?.hr_portal_api_key,
      subscriptionTier: profile?.subscription_tier || 'free',
      enabled: profile?.hr_portal_api_enabled || false
    });

  } catch (error) {
    console.error('API key fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}




