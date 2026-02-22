import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Step 1: get the existing session synchronously first so the loading
    //         screen resolves instantly on refresh, before any async event fires.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Step 2: subscribe to all future auth changes.
    // This fires for: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED,
    // and most importantly — when Google OAuth redirects back to the page
    // and Supabase exchanges the ?code= for a real session.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // Clean up the ?code= / error params Google puts in the URL
      if (event === 'SIGNED_IN') {
        const url = new URL(window.location.href);
        if (url.searchParams.has('code') || url.hash.includes('access_token')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
