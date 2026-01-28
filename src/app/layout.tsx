'use client';

import './globals.css';
import AuthProvider, { useAuth } from './components/AuthProvider';
import { SessionProvider } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { SpeedInsights } from '@vercel/speed-insights/next';

function Navigation() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  // Don't show nav on login page
  if (pathname === '/login' || pathname === '/auth/callback') {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <a href="/candidates" className="flex items-center gap-3">
              <img src="/logo.svg" alt="RejectFlow" className="w-10 h-10" />
              <span className="text-xl font-bold text-gray-900">RejectFlow</span>
            </a>
            <div className="ml-10 flex space-x-1">
              <a 
                href="/candidates/add" 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/candidates/add' 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Add Candidates
              </a>
              <a 
                href="/candidates" 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/candidates' 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Candidates
              </a>
              <a 
                href="/drafts" 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/drafts' 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Drafts
              </a>
                     <a 
                       href="/profile" 
                       className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                         pathname === '/profile' 
                           ? 'bg-blue-50 text-blue-700' 
                           : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                       }`}
                     >
                       Profile
                     </a>
                     <a 
                       href="/pricing" 
                       className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                         pathname === '/pricing' 
                           ? 'bg-blue-50 text-blue-700' 
                           : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                       }`}
                     >
                       Pricing
                     </a>
                     <a 
                       href="/api-docs" 
                       className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                         pathname === '/api-docs' 
                           ? 'bg-blue-50 text-blue-700' 
                           : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                       }`}
                     >
                       API Docs
                     </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>RejectFlow - Rejection Assistant</title>
        <meta name="description" content="AI-powered assistant for drafting and managing rejection emails" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="bg-gray-50">
        <SessionProvider>
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
        </SessionProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
