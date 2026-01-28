import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth-server';

/**
 * Migration endpoint to assign existing candidates and drafts to the current user
 * This fixes the issue where candidates created before NextAuth migration have user_id = NULL
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all candidates with NULL user_id
    const { data: orphanCandidates, error: fetchError } = await supabaseAdmin!
      .from('candidates')
      .select('id')
      .is('user_id', null);

    if (fetchError) {
      console.error('Error fetching orphan candidates:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const candidateIds = (orphanCandidates || []).map(c => c.id);

    if (candidateIds.length === 0) {
      return NextResponse.json({ 
        message: 'No orphan candidates found',
        migrated: { candidates: 0, drafts: 0 }
      });
    }

    // Update candidates to assign them to current user
    const { error: updateCandidatesError } = await supabaseAdmin!
      .from('candidates')
      .update({ user_id: user.id })
      .in('id', candidateIds);

    if (updateCandidatesError) {
      console.error('Error updating candidates:', updateCandidatesError);
      return NextResponse.json({ error: updateCandidatesError.message }, { status: 500 });
    }

    // Get all drafts for these candidates (they will now be visible)
    const { data: drafts, error: draftsError } = await supabaseAdmin!
      .from('rejection_emails')
      .select('id')
      .in('candidate_id', candidateIds);

    if (draftsError) {
      console.error('Error fetching drafts:', draftsError);
      // Don't fail if drafts query fails
    }

    const draftCount = drafts?.length || 0;

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${candidateIds.length} candidates and ${draftCount} drafts`,
      migrated: {
        candidates: candidateIds.length,
        drafts: draftCount
      }
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

