import { getServerSession } from 'next-auth';
import { authOptions } from './auth-options';

// Server-side function to get current user
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

// Client-side sign out (redirects to NextAuth signout)
export async function signOut() {
  // This will be handled by NextAuth's signOut function
  window.location.href = '/api/auth/signout';
  }
  
// Client-side Google sign in (redirects to NextAuth signin)
export async function signInWithGoogle() {
  // This will be handled by NextAuth's signIn function
  window.location.href = '/api/auth/signin/google';
}

