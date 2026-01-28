import { getServerSession } from 'next-auth';
import { authOptions } from './auth-options';
import { NextRequest } from 'next/server';

/**
 * Get the current authenticated user from NextAuth session
 * Use this in API routes instead of Supabase auth
 */
export async function getAuthUser(request?: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Debug logging (only in development)
    if (process.env.NODE_ENV === 'development') {
      if (!session) {
        console.log('[getAuthUser] No session found');
      } else if (!session.user) {
        console.log('[getAuthUser] Session exists but no user object');
      } else {
        console.log('[getAuthUser] Session found for user:', session.user.email);
      }
    }
    
    if (!session?.user) {
      return null;
    }
    
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };
  } catch (error) {
    console.error('[getAuthUser] Error getting session:', error);
    return null;
  }
}

