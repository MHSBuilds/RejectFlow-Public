import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    // Ensure admin client is available
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
      console.error('[Candidates API] No authenticated user found');
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Please sign in to view candidates'
      }, { status: 401 });
    }

    // Fetch candidates belonging to the authenticated user
    // Also include candidates with NULL user_id (legacy data from before NextAuth migration)
    // This is a temporary measure until migration is complete
    const { data: candidates, error } = await supabaseAdmin!
      .from('candidates')
      .select(`
        *,
        interview_feedback (
          id,
          interviewer_name,
          rating,
          notes,
          rejection_reasons,
          areas_for_improvement,
          created_at
        ),
        rejection_emails (
          id,
          status,
          version,
          created_at
        )
      `)
      .or(`user_id.eq.${user.id},user_id.is.null`)  // Include user's candidates + legacy NULL candidates
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Candidates fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Normalize arrays → single objects to match UI/types
    const normalizedCandidates = (candidates || []).map((candidate: any) => ({
      ...candidate,
      feedback: Array.isArray(candidate.interview_feedback) && candidate.interview_feedback.length > 0 
        ? candidate.interview_feedback[0] 
        : undefined,
      rejection_email: Array.isArray(candidate.rejection_emails) && candidate.rejection_emails.length > 0 
        ? candidate.rejection_emails[0] 
        : undefined,
    }));

    return NextResponse.json({ candidates: normalizedCandidates });
  } catch (error) {
    console.error('Candidates fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
