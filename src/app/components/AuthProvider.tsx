'use client';

import { createContext, useContext } from 'react';
import { useSession } from 'next-auth/react';

interface AuthContextType {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  } | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  
  const user = session?.user || null;
  const loading = status === 'loading';

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
