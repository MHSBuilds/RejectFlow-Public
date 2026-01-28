import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { redraftEmail } from '@/lib/openai';
import { processEmailContent } from '@/lib/resend';
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

    const { draft_id, instructions } = await request.json();

    if (!draft_id || !instructions) {
      return NextResponse.json({ error: 'Missing draft_id or instructions' }, { status: 400 });
    }

    // Get original draft with context
    const { data: originalDraft, error: fetchError } = await supabaseAdmin!
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
      .eq('id', draft_id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Get user profile to fetch company name
    const { data: profile } = await supabaseAdmin!
      .from('user_profiles')
      .select('company_name')
      .eq('user_id', user.id)
      .single();

    const companyName = profile?.company_name || '';

    // Generate redrafted email
    const redraftedContent = await redraftEmail(
      originalDraft.draft_content,
      instructions,
      originalDraft.candidates.full_name,
      originalDraft.candidates.position,
      originalDraft.interview_feedback.rating,
      originalDraft.interview_feedback.notes,
      originalDraft.interview_feedback.rejection_reasons,
      originalDraft.interview_feedback.areas_for_improvement,
      companyName
    );

    // Process content to remove markdown and placeholders
    const cleanedRedraftedContent = processEmailContent(redraftedContent);

    // Find max version for this candidate/feedback combo to avoid collisions
    const { data: existingDrafts, error: versionError } = await supabaseAdmin!
      .from('rejection_emails')
      .select('version')
      .eq('candidate_id', originalDraft.candidate_id)
      .eq('feedback_id', originalDraft.feedback_id)
      .order('version', { ascending: false })
      .limit(1);

    if (versionError) {
      console.error('Error fetching max version:', versionError);
      // Fallback to originalDraft.version + 1 if query fails
    }

    const maxVersion = existingDrafts?.[0]?.version || originalDraft.version || 0;
    const newVersion = maxVersion + 1;

    // Create new version
    const now = new Date().toISOString();
    const { data: newDraft, error: createError } = await supabaseAdmin!
      .from('rejection_emails')
      .insert({
        candidate_id: originalDraft.candidate_id,
        feedback_id: originalDraft.feedback_id,
        draft_content: cleanedRedraftedContent,
        status: 'draft',
        version: newVersion,
        redraft_instructions: instructions,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: 'Failed to create redraft' }, { status: 500 });
    }

    return NextResponse.json({ draft: newDraft });

  } catch (error) {
    console.error('Redraft error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}



