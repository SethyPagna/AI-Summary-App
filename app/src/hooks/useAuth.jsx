import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle OAuth redirect — Supabase automatically exchanges the code
    // in the URL hash/query params when getSession() is called.
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.warn('Session error:', error.message);
      setUser(data.session?.user ?? null);
      setLoading(false);

      // Clean up OAuth params from URL after successful login
      if (data.session && (window.location.hash || window.location.search.includes('code='))) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    });

    // Listen for auth state changes — fires on:
    //  SIGNED_IN  (email/password or OAuth callback)
    //  SIGNED_OUT
    //  TOKEN_REFRESHED
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === 'SIGNED_IN' && (window.location.hash || window.location.search.includes('code='))) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
