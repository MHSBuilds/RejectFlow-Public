import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
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
      console.error('[Drafts API] No authenticated user found');
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Please sign in to view drafts'
      }, { status: 401 });
    }

    // First, get all candidate IDs for this user
    // Also include candidates with NULL user_id (legacy data from before NextAuth migration)
    const { data: userCandidates, error: candidatesError } = await supabaseAdmin!
      .from('candidates')
      .select('id')
      .or(`user_id.eq.${user.id},user_id.is.null`);  // Include user's candidates + legacy NULL candidates

    if (candidatesError) {
      console.error('Error fetching user candidates:', candidatesError);
      return NextResponse.json({ error: candidatesError.message }, { status: 500 });
    }

    const candidateIds = (userCandidates || []).map(c => c.id);
    
    if (candidateIds.length === 0) {
      // User has no candidates, so no drafts
      return NextResponse.json({ drafts: [] });
    }

    // Fetch ONLY drafts belonging to the authenticated user
    // Filter by candidate_id being in the user's candidate list
    const { data: drafts, error } = await supabaseAdmin!
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
      .in('candidate_id', candidateIds)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to match DraftWithDetails type
    // Supabase returns candidates and interview_feedback, but frontend expects candidate and feedback
    const transformedDrafts = (drafts || []).map(draft => {
      const transformed = {
        ...draft,
        candidate: Array.isArray(draft.candidates) ? draft.candidates[0] : draft.candidates,
        feedback: Array.isArray(draft.interview_feedback) ? draft.interview_feedback[0] : draft.interview_feedback,
      };
      
      // Remove the original plural fields to avoid confusion
      delete transformed.candidates;
      delete transformed.interview_feedback;
      
      return transformed;
    });

    return NextResponse.json({ drafts: transformedDrafts });
  } catch (error) {
    console.error('Drafts fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}



