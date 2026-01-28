import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateRejectionEmail } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    // Validate Supabase admin client
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' }, 
        { status: 500 }
      );
    }

    // Get API key from headers
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    // Validate API key and get user
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, subscription_tier, hr_portal_api_enabled')
      .eq('hr_portal_api_key', apiKey)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    if (!profile.hr_portal_api_enabled) {
      return NextResponse.json({ error: 'HR Portal API not enabled for this account' }, { status: 403 });
    }

    // Check API usage limits based on subscription tier
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const { data: usage } = await supabaseAdmin
      .from('user_usage')
      .select('api_calls')
      .eq('user_id', profile.user_id)
      .gte('month', currentMonth.toISOString())
      .single();

    // Set API call limits based on subscription tier
    let apiLimit: number;
    switch (profile.subscription_tier) {
      case 'starter':
        apiLimit = 100;
        break;
      case 'professional':
        apiLimit = 500;
        break;
      case 'enterprise':
        apiLimit = 999999; // Effectively unlimited
        break;
      default:
        return NextResponse.json({ error: 'API access requires paid plan' }, { status: 403 });
    }

    const apiCalls = usage?.api_calls || 0;
    if (apiCalls >= apiLimit) {
      return NextResponse.json({ 
        error: 'API call limit reached',
        details: `You have reached your ${profile.subscription_tier} plan limit of ${apiLimit} API calls per month`,
        limit: apiLimit,
        used: apiCalls,
        upgradeUrl: 'https://rejectflow.vercel.app/pricing'
      }, { status: 429 });
    }

    // Parse request body
    const body = await request.json();
    const { 
      candidate_name, 
      candidate_email, 
      position, 
      rating, 
      rejection_reasons, 
      notes,
      areas_for_improvement 
    } = body;

    // Validate required fields
    if (!candidate_name || !candidate_email || !position || !rating) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'candidate_name, candidate_email, position, and rating are required'
      }, { status: 400 });
    }

    // Ensure arrays are properly formatted
    const rejectionReasons = Array.isArray(rejection_reasons) 
      ? rejection_reasons 
      : (rejection_reasons ? [rejection_reasons] : []);
    
    const areasForImprovement = Array.isArray(areas_for_improvement) 
      ? areas_for_improvement 
      : (areas_for_improvement ? [areas_for_improvement] : []);

    // Get user profile to fetch company name
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('company_name')
      .eq('user_id', profile.user_id)
      .single();

    const companyName = userProfile?.company_name || '';

    // Generate rejection email content using OpenAI
    const emailContent = await generateRejectionEmail(
      candidate_name,
      position,
      parseInt(rating),
      notes || '',
      rejectionReasons,
      areasForImprovement,
      companyName
    );

    if (!emailContent) {
      return NextResponse.json({ error: 'Failed to generate email content' }, { status: 500 });
    }

    // Create subject line
    const subject = `Update on your application for ${position}`;

    // Track API usage
    await supabaseAdmin
      .from('user_usage')
      .upsert({
        user_id: profile.user_id,
        month: currentMonth.toISOString().slice(0, 10),
        api_calls: apiCalls + 1
      }, {
        onConflict: 'user_id,month'
      });

    // Return generated content
    return NextResponse.json({
      success: true,
      rejection_email: {
        subject,
        content: emailContent,
        html_content: emailContent.replace(/\n/g, '<br>'),
        candidate_name,
        candidate_email,
        position,
        rating,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('HR API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
