import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabaseAdmin } from '@/lib/supabase';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Use Supabase admin client to verify credentials
          // Note: We need to use Supabase Auth API for password verification
          const { data: authData, error: authError } = await supabaseAdmin!.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (authError || !authData.user) {
            return null;
          }

          const user = authData.user;

          // Check if user exists in our users table
          const { data: existingUser } = await supabaseAdmin!
            .from('users')
            .select('id, full_name, email')
            .eq('email', user.email)
            .single();

          if (existingUser) {
            // Return existing user
            return {
              id: existingUser.id,
              email: existingUser.email || user.email,
              name: existingUser.full_name || user.email?.split('@')[0] || 'User',
            };
          } else {
            // Create new user in our users table
            const { data: newUser, error: insertError } = await supabaseAdmin!
              .from('users')
              .insert({
                email: user.email,
                full_name: user.email?.split('@')[0] || 'User',
                provider: 'email',
              })
              .select()
              .single();

            if (insertError || !newUser) {
              console.error('Error creating user:', insertError);
              return null;
            }

            return {
              id: newUser.id,
              email: newUser.email,
              name: newUser.full_name || user.email?.split('@')[0] || 'User',
            };
          }
        } catch (error) {
          console.error('Error in credentials authorize:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign-in
      if (account?.provider === 'google' && user.email) {
        try {
          // Check if user exists in our users table
          const { data: existingUser } = await supabaseAdmin!
            .from('users')
            .select('id, full_name')
            .eq('email', user.email)
            .single();

          if (!existingUser) {
            // Create new user in Supabase users table
            console.log('[SignIn] Creating new user for email:', user.email);
            const { data: newUser, error: insertError } = await supabaseAdmin!
              .from('users')
              .insert({
                email: user.email,
                full_name: user.name || '',
                avatar_url: user.image || null,
                provider: 'google',
                provider_id: account.providerAccountId,
              })
              .select()
              .single();

            if (insertError) {
              console.error('[SignIn] Error creating user:', insertError);
              // If duplicate, try to fetch the existing user
              if (insertError.code === '23505') {
                const { data: existingUserRetry } = await supabaseAdmin!
                  .from('users')
                  .select('id')
                  .eq('email', user.email)
                  .single();
                
                if (existingUserRetry) {
                  user.id = existingUserRetry.id;
                  console.log('[SignIn] Used existing user after conflict:', user.id);
                  return true;
                }
              }
              return false;
            }

            // Store user ID for JWT callback - this is critical!
            if (newUser) {
              user.id = newUser.id;
              console.log('[SignIn] Created new user with ID:', newUser.id);
            }
          } else {
            // Update existing user with latest info
            console.log('[SignIn] Found existing user:', existingUser.id);
            await supabaseAdmin!
              .from('users')
              .update({
                full_name: user.name || existingUser.full_name,
                avatar_url: user.image || null,
                provider_id: account.providerAccountId,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingUser.id);

            user.id = existingUser.id;
            console.log('[SignIn] Using existing user ID:', user.id);
          }
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      
      // Handle credentials (email/password) sign-in
      // User is already created/verified in authorize function
      if (account?.provider === 'credentials' && user.email) {
        return true;
      }
      
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      // Initial sign in - user.id was set in signIn callback to database UUID
      if (user && user.email) {
        // user.id should already be the database UUID from signIn callback
        token.id = user.id;
        token.email = user.email;
        console.log('[JWT] Set token ID:', token.id, 'for email:', user.email);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Cookie configuration for custom domain support
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Don't set domain explicitly - let browser handle it for both rejectflow.app and www.rejectflow.app
        // This allows cookies to work on both root and www subdomain
      },
    },
  },
};

