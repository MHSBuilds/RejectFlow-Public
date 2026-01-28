import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateRejectionEmail } from '@/lib/openai';
import { processEmailContent } from '@/lib/resend';
import { getAuthUser } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    console.log('Generate draft API called');
    
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

    const { candidate_id, feedback_id } = await request.json();
    console.log(`Generating draft for candidate: ${candidate_id}, feedback: ${feedback_id}`);

    if (!candidate_id || !feedback_id) {
      return NextResponse.json({ error: 'Missing candidate_id or feedback_id' }, { status: 400 });
    }

    // Get candidate and feedback data
    const { data: candidate, error: candidateError } = await supabaseAdmin!
      .from('candidates')
      .select('full_name, email, position')
      .eq('id', candidate_id)
      .single();

    if (candidateError) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    const { data: feedback, error: feedbackError } = await supabaseAdmin!
      .from('interview_feedback')
      .select('rating, notes, rejection_reasons, areas_for_improvement')
      .eq('id', feedback_id)
      .single();

    if (feedbackError) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    // Ensure arrays are properly formatted
    const rejectionReasons = Array.isArray(feedback.rejection_reasons) 
      ? feedback.rejection_reasons 
      : (feedback.rejection_reasons ? [feedback.rejection_reasons] : []);

    const areasForImprovement = Array.isArray(feedback.areas_for_improvement)
      ? feedback.areas_for_improvement
      : (feedback.areas_for_improvement ? [feedback.areas_for_improvement] : []);

    // Get user profile to fetch company name
    const { data: profile } = await supabaseAdmin!
      .from('user_profiles')
      .select('company_name')
      .eq('user_id', user.id)
      .single();

    const companyName = profile?.company_name || '';

    // Generate email using OpenAI
    console.log('Calling OpenAI to generate email...', { companyName });
    let draftContent: string;
    try {
      draftContent = await generateRejectionEmail(
        candidate.full_name,
        candidate.position,
        feedback.rating,
        feedback.notes,
        rejectionReasons,
        areasForImprovement,
        companyName
      );
      console.log('OpenAI response received, length:', draftContent.length);
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      return NextResponse.json({ 
        error: 'Failed to generate email with AI: ' + (openaiError instanceof Error ? openaiError.message : 'Unknown error')
      }, { status: 500 });
    }

    // Process content to remove markdown and placeholders
    const cleanedDraftContent = processEmailContent(draftContent);

    // Validate non-empty / sufficiently long content
    const normalized = (cleanedDraftContent ?? '').trim();
    if (!normalized || normalized.length < 600) {
      console.error('AI returned empty or incomplete content', {
        length: normalized.length,
      });
      return NextResponse.json(
        {
          error:
            'AI returned incomplete email content. Please try again or contact support.',
        },
        { status: 500 }
      );
    }

    // Find max version for this candidate/feedback combo to avoid collisions
    const { data: existingDrafts, error: versionError } = await supabaseAdmin!
      .from('rejection_emails')
      .select('version')
      .eq('candidate_id', candidate_id)
      .eq('feedback_id', feedback_id)
      .order('version', { ascending: false })
      .limit(1);

    if (versionError) {
      console.error('Error fetching max version:', versionError);
    }

    const maxVersion = existingDrafts?.[0]?.version || 0;
    const newVersion = maxVersion + 1;

    // Save draft to database
    console.log('Saving draft to database...');
    const { data: draft, error: draftError } = await supabaseAdmin!
      .from('rejection_emails')
      .insert({
        candidate_id,
        feedback_id,
        draft_content: cleanedDraftContent,
        status: 'draft',
        version: newVersion
      })
      .select()
      .single();

    if (draftError) {
      console.error('Database save error:', draftError);
      return NextResponse.json({ error: 'Failed to save draft: ' + draftError.message }, { status: 500 });
    }

    // Track draft generation in usage
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const { data: usage } = await supabaseAdmin!
      .from('user_usage')
      .select('*')
      .eq('user_id', user.id)
      .gte('month', currentMonth.toISOString())
      .single();

    const emailsGenerated = usage?.emails_generated || 0;

    await supabaseAdmin!
      .from('user_usage')
      .upsert({
        user_id: user.id,
        month: currentMonth.toISOString().slice(0, 10),
        emails_generated: emailsGenerated + 1
      }, {
        onConflict: 'user_id,month'
      });

    console.log('Draft generated successfully:', draft.id);
    return NextResponse.json({ draft });

  } catch (error) {
    console.error('Generate draft error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}
