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
      .select('user_id, subscription_tier, hr_portal_api_enabled, company_name')
      .eq('hr_portal_api_key', apiKey)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    if (!profile.hr_portal_api_enabled) {
      return NextResponse.json({ error: 'HR Portal API not enabled for this account' }, { status: 403 });
    }

    // Only Professional and Enterprise plans can use bulk API
    if (!['professional', 'enterprise'].includes(profile.subscription_tier)) {
      return NextResponse.json({ 
        error: 'Bulk API requires Professional or Enterprise plan' 
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { candidates } = body;

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json({ 
        error: 'candidates array is required and must not be empty' 
      }, { status: 400 });
    }

    // Limit bulk operations based on plan
    const maxBulkSize = profile.subscription_tier === 'enterprise' ? 100 : 25;
    if (candidates.length > maxBulkSize) {
      return NextResponse.json({ 
        error: `Maximum ${maxBulkSize} candidates allowed per bulk request`,
        limit: maxBulkSize
      }, { status: 400 });
    }

    // Check API usage limits
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const { data: usage } = await supabaseAdmin
      .from('user_usage')
      .select('api_calls')
      .eq('user_id', profile.user_id)
      .gte('month', currentMonth.toISOString())
      .single();

    const apiCalls = usage?.api_calls || 0;
    const apiLimit = profile.subscription_tier === 'enterprise' ? 999999 : 500;

    if (apiCalls + candidates.length > apiLimit) {
      return NextResponse.json({ 
        error: 'API call limit would be exceeded',
        details: `This request would use ${candidates.length} API calls, exceeding your limit`,
        limit: apiLimit,
        used: apiCalls
      }, { status: 429 });
    }

    // Get company name from profile (fetch once, reuse for all candidates)
    const companyName = profile.company_name || '';

    // Process each candidate
    const results = [];
    const errors = [];

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      
      try {
        // Validate required fields
        if (!candidate.candidate_name || !candidate.candidate_email || !candidate.position || !candidate.rating) {
          errors.push({
            index: i,
            error: 'Missing required fields',
            candidate: candidate.candidate_name || 'Unknown'
          });
          continue;
        }

        // Ensure arrays are properly formatted
        const rejectionReasons = Array.isArray(candidate.rejection_reasons) 
          ? candidate.rejection_reasons 
          : (candidate.rejection_reasons ? [candidate.rejection_reasons] : []);
        
        const areasForImprovement = Array.isArray(candidate.areas_for_improvement) 
          ? candidate.areas_for_improvement 
          : (candidate.areas_for_improvement ? [candidate.areas_for_improvement] : []);

        // Generate rejection email content (company name already fetched from profile above)
        const emailContent = await generateRejectionEmail(
          candidate.candidate_name,
          candidate.position,
          parseInt(candidate.rating),
          candidate.notes || '',
          rejectionReasons,
          areasForImprovement,
          companyName
        );

        if (!emailContent) {
          errors.push({
            index: i,
            error: 'Failed to generate email content',
            candidate: candidate.candidate_name
          });
          continue;
        }

        results.push({
          index: i,
          success: true,
          rejection_email: {
            subject: `Update on your application for ${candidate.position}`,
            content: emailContent,
            html_content: emailContent.replace(/\n/g, '<br>'),
            candidate_name: candidate.candidate_name,
            candidate_email: candidate.candidate_email,
            position: candidate.position,
            rating: candidate.rating,
            generated_at: new Date().toISOString()
          }
        });

      } catch (error) {
        errors.push({
          index: i,
          error: 'Processing error',
          candidate: candidate.candidate_name || 'Unknown',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Track API usage
    await supabaseAdmin
      .from('user_usage')
      .upsert({
        user_id: profile.user_id,
        month: currentMonth.toISOString().slice(0, 10),
        api_calls: apiCalls + candidates.length
      }, {
        onConflict: 'user_id,month'
      });

    return NextResponse.json({
      success: true,
      processed: results.length,
      total: candidates.length,
      errorCount: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Bulk HR API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
