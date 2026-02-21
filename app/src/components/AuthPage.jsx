import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';

// Google "G" logo SVG
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function AuthPage({ darkMode, onToggleDark }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  // ── Google OAuth ────────────────────────────────────────────────────────
  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Supabase will redirect back here after Google auth
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
      // Page redirects to Google — no further code runs here
    } catch (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
  }

  // ── Email / Password ────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast('Welcome back!', 'success');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        toast('Account created! Please check your email to confirm.', 'success');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const isLoading = loading || googleLoading;

  return (
    <div className="auth-page">
      <div className="auth-container">

        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-icon">✦</div>
          <h1>AI Summary App</h1>
          <p>Intelligent document analysis & summarization</p>
        </div>

        <div className="auth-card">
          <h2>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          <p className="subtitle">
            {mode === 'login'
              ? 'Sign in to access your documents and projects'
              : 'Join to start summarizing your documents with AI'}
          </p>

          {error && (
            <div className="auth-error">
              <span>⚠ </span>{error}
            </div>
          )}

          {/* ── Google button ── */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '11px 16px',
              border: '1.5px solid var(--border)',
              borderRadius: 10,
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 500,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s',
              marginBottom: 4,
            }}
            onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            {googleLoading
              ? <span className="spinner" style={{ width: 16, height: 16 }} />
              : <GoogleIcon />
            }
            {googleLoading ? 'Redirecting to Google…' : 'Continue with Google'}
          </button>

          {/* ── Divider ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '16px 0', color: 'var(--text-muted)', fontSize: 12,
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            or continue with email
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* ── Email / Password form ── */}
          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {loading && <span className="spinner" />}
              {loading
                ? 'Please wait…'
                : mode === 'login' ? 'Sign In with Email' : 'Create Account'}
            </button>
          </form>

          <div className="auth-switch">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button onClick={() => { setMode('signup'); setError(''); }} disabled={isLoading}>
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => { setMode('login'); setError(''); }} disabled={isLoading}>
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dark mode toggle */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={onToggleDark} style={{ fontSize: 13 }}>
            {darkMode ? '☀ Light Mode' : '⏾ Dark Mode'}
          </button>
        </div>

      </div>
    </div>
  );
}
