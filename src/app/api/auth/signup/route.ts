import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // We'll handle redirects via NextAuth
      },
    });

    if (authError) {
      // Handle specific errors
      if (authError.message.includes('already registered') || authError.message.includes('already exists') || authError.message.includes('User already registered')) {
        return NextResponse.json({ error: 'An account with this email already exists. Sign in or reset your password.' }, { status: 409 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    // Create user in our users table
    const { data: newUser, error: userError } = await supabaseAdmin!
      .from('users')
      .insert({
        email: authData.user.email,
        full_name: authData.user.email?.split('@')[0] || 'User',
        provider: 'email',
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user record:', userError);
      // Don't fail the signup if user record creation fails - they can still sign in
    }

    return NextResponse.json({ 
      success: true,
      message: 'Account created successfully. You can now sign in.',
      user: {
        email: authData.user.email,
        id: newUser?.id || authData.user.id,
      }
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


