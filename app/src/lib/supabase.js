import { createClient } from '@supabase/supabase-js';

// ── Read from environment variables (set in .env / Vercel dashboard) ──────────
const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
    'Copy .env.example → .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    detectSessionInUrl: true, // exchanges the ?code= Google puts in the redirect URL
    flowType: 'pkce',         // secure OAuth flow for browser apps
    persistSession: true,
    autoRefreshToken: true,
    storage: window.localStorage,
  },
});

// Deployed URL — used as redirectTo in every auth call.
// Falls back to current origin so local dev works without setting the var.
export const SITE_URL =
  import.meta.env.VITE_SITE_URL || window.location.origin;
