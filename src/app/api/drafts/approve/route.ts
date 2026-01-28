import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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

    const { draft_id } = await request.json();

    if (!draft_id) {
      return NextResponse.json({ error: 'Missing draft_id' }, { status: 400 });
    }

    const { data: draft, error } = await supabaseAdmin!
      .from('rejection_emails')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', draft_id)
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
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to approve draft' }, { status: 500 });
    }

    const transformedDraft = {
      ...draft,
      candidate: Array.isArray(draft.candidates) ? draft.candidates[0] : draft.candidates,
      feedback: Array.isArray(draft.interview_feedback) ? draft.interview_feedback[0] : draft.interview_feedback,
    };

    delete transformedDraft.candidates;
    delete transformedDraft.interview_feedback;

    return NextResponse.json({ draft: transformedDraft });

  } catch (error) {
    console.error('Approve draft error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}



