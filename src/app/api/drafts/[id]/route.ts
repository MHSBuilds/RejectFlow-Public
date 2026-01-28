import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate Supabase admin client is available
    if (!supabaseAdmin) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not configured');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase service role key' }, 
        { status: 500 }
      );
    }

    console.log('Fetching draft with ID:', params.id);
    console.log('ID type:', typeof params.id);
    console.log('ID length:', params.id?.length);
    
    const { data: draft, error } = await supabaseAdmin!
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
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Draft fetch error:', {
        error: error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        requestedId: params.id
      });
      
      // Check if it's a "not found" error or something else
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to fetch draft',
        details: error.message 
      }, { status: 500 });
    }
    
    if (!draft) {
      console.error('Draft query returned no data for ID:', params.id);
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    console.log('Draft found:', draft.id, 'Status:', draft.status);

    // Transform the data to match DraftWithDetails type
    // Supabase returns candidates and interview_feedback, but frontend expects candidate and feedback
    const transformedDraft = {
      ...draft,
      candidate: Array.isArray(draft.candidates) ? draft.candidates[0] : draft.candidates,
      feedback: Array.isArray(draft.interview_feedback) ? draft.interview_feedback[0] : draft.interview_feedback,
    };
    
    // Remove the original plural fields to avoid confusion
    delete transformedDraft.candidates;
    delete transformedDraft.interview_feedback;

    return NextResponse.json({ draft: transformedDraft });
  } catch (error) {
    console.error('Draft fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}



