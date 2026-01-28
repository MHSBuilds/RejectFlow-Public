import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Get current user from NextAuth session
    const user = await getAuthUser(request);
    
    if (!user) {
      console.error('[Profile API GET] No authenticated user found');
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Please sign in to view profile'
      }, { status: 401 });
    }

    // Ensure user exists in users table
    // Use upsert to handle both create and update cases
    const { data: userRecord, error: userUpsertError } = await supabaseAdmin!
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.name || '',
        provider: 'google',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (userUpsertError && userUpsertError.code !== '23505') {
      // Only log non-duplicate errors (23505 is duplicate key, which is fine)
      console.error('[Profile API GET] Failed to upsert user:', userUpsertError);
      // Don't fail the request, just log the error
    }

    // Fetch user profile
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json({ profile: profile || null });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Get current user from NextAuth session
    const user = await getAuthUser(request);
    
    if (!user) {
      console.error('[Profile API POST] No authenticated user found');
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Please sign in to save profile'
      }, { status: 401 });
    }

    // Ensure user exists in users table before saving profile
    // Use upsert to handle both create and update cases, with conflict resolution
    const { data: userRecord, error: userUpsertError } = await supabaseAdmin!
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.name || '',
        provider: 'google',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id', // Conflict on ID
        ignoreDuplicates: false // Update if exists
      })
      .select()
      .single();

    if (userUpsertError) {
      // If ID conflict, try email conflict resolution
      if (userUpsertError.code === '23505') {
        // Check if user exists with same email but different ID
        const { data: existingUser } = await supabaseAdmin!
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single();
        
        if (existingUser && existingUser.id !== user.id) {
          // User exists with different ID - log warning but continue
          console.warn('[Profile API POST] User exists with different ID:', {
            sessionId: user.id,
            dbId: existingUser.id,
            email: user.email
          });
          // Continue with profile save - the foreign key will use the existing ID
        } else if (existingUser && existingUser.id === user.id) {
          // User exists with correct ID - this is fine, continue
          console.log('[Profile API POST] User already exists with correct ID');
        } else {
          // Unexpected error
          console.error('[Profile API POST] Failed to upsert user:', userUpsertError);
          return NextResponse.json({ 
            error: 'Failed to sync user account',
            details: userUpsertError.message || 'User sync failed'
          }, { status: 500 });
        }
      } else {
        console.error('[Profile API POST] Failed to upsert user:', userUpsertError);
        return NextResponse.json({ 
          error: 'Failed to sync user account',
          details: userUpsertError.message || 'User sync failed'
        }, { status: 500 });
      }
    }

    const profileData = await request.json();
    
    // Ensure user_id matches authenticated user
    const { data: upsertData, error } = await supabaseAdmin
      .from('user_profiles')
      .upsert({ ...profileData, user_id: user.id }, {
        onConflict: 'user_id'
      })
      .select();

    if (error) {
      console.error('[Profile API POST] Upsert error:', {
        error: error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        user_id: user.id,
        profileData: profileData
      });
      return NextResponse.json({ 
        error: 'Failed to save profile',
        details: error.message || 'Database error',
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

