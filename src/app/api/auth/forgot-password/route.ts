import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists in our users table
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (!existingUser) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ 
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });
    }

    // Check if user has email/password auth (not just OAuth)
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(existingUser.id);

    if (!authUser || !authUser.user) {
      // User exists but no auth record - might be OAuth only
      return NextResponse.json({ 
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });
    }

    // Send password reset email via Supabase Auth
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXTAUTH_URL || 'https://rejectflow.app'}/reset-password`,
    });

    if (resetError) {
      console.error('Password reset error:', resetError);
      // Still return success to prevent email enumeration
      return NextResponse.json({ 
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.' 
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ 
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.' 
    });
  }
}










