import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { db } from '@/api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setUser(await db.auth.me());
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    return db.auth.onChange((u) => {
      setUser(u);
      setLoading(false);
    });
  }, [refresh]);

  const value = {
    user,
    isAuthenticated: !!user,
    isTherapist: user?.role === 'admin',
    isLoadingAuth,
    refresh,
    logout: (redirect) => db.auth.logout(redirect),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
