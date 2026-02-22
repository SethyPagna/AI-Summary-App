import { useState } from 'react';
import { supabase, SITE_URL } from '../lib/supabase';

// ── Google "G" logo ───────────────────────────────────────────────────────────
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

// ── Screen states ─────────────────────────────────────────────────────────────
// 'form'          → main login / sign-up UI
// 'check-email'   → after email sign-up (confirmation required)
// 'magic-sent'    → after magic-link request

export default function AuthPage({ darkMode, onToggleDark }) {
  const [mode, setMode]           = useState('login'); // 'login' | 'signup'
  const [screen, setScreen]       = useState('form');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [name, setName]           = useState('');
  const [loading, setLoading]     = useState(false);
  const [gLoading, setGLoading]   = useState(false);
  const [error, setError]         = useState('');
  const [sentTo, setSentTo]       = useState('');

  const busy = loading || gLoading;

  // ── helpers ───────────────────────────────────────────────────────────────
  function clearError() { setError(''); }

  function friendlyError(msg = '') {
    if (msg.includes('Invalid login credentials'))
      return 'Wrong email or password. Double-check and try again.';
    if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed'))
      return 'Please confirm your email first — check your inbox (and spam).';
    if (msg.includes('User already registered'))
      return 'An account with this email already exists. Try signing in instead.';
    if (msg.includes('Password should be'))
      return 'Password must be at least 6 characters.';
    if (msg.includes('Unable to validate') || msg.includes('provider'))
      return 'Google sign-in failed. Make sure pop-ups are not blocked and try again.';
    return msg || 'Something went wrong. Please try again.';
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────
  async function handleGoogle() {
    clearError();
    setGLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // After Google authenticates the user, it redirects to Supabase which
        // then redirects to this URL. Must match Supabase → Auth → Redirect URLs.
        redirectTo: SITE_URL,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account', // always show account picker
        },
      },
    });

    if (error) {
      setError(friendlyError(error.message));
      setGLoading(false);
    }
    // On success: browser navigates away to Google. Nothing more runs here.
  }

  // ── Email + Password ──────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    clearError();
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw new Error(friendlyError(error.message));
        // useAuth picks up SIGNED_IN automatically — no redirect needed

      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
            // Supabase sends the confirmation email with a link back to SITE_URL
            emailRedirectTo: SITE_URL,
          },
        });

        if (error) throw new Error(friendlyError(error.message));

        if (data.session) {
          // Email confirmation is OFF in Supabase → user is logged in immediately.
          // useAuth will pick up the SIGNED_IN event — nothing to do here.
        } else {
          // Email confirmation is ON (default) → show "check your email" screen.
          setSentTo(email.trim());
          setScreen('check-email');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Magic link (passwordless) ─────────────────────────────────────────────
  async function handleMagicLink() {
    if (!email.trim()) {
      setError('Enter your email address above first.');
      return;
    }
    clearError();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: SITE_URL },
    });

    setLoading(false);

    if (error) {
      setError(friendlyError(error.message));
    } else {
      setSentTo(email.trim());
      setScreen('magic-sent');
    }
  }

  // ── Resend confirmation ───────────────────────────────────────────────────
  async function handleResend() {
    clearError();
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: sentTo,
      options: { emailRedirectTo: SITE_URL },
    });
    setLoading(false);
    if (error) setError(friendlyError(error.message));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Screen: check-email
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'check-email') {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-brand">
            <div className="auth-brand-icon">✦</div>
            <h1>AI Summary App</h1>
          </div>

          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📬</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>
              Check your inbox
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 6 }}>
              We sent a confirmation link to:
            </p>
            <p style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 15, marginBottom: 20, wordBreak: 'break-all' }}>
              {sentTo}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
              Click the link in that email to activate your account.
              <br />
              Can't find it? Check your <strong>Spam / Junk</strong> folder.
              <br />
              The link expires in <strong>24 hours</strong>.
            </p>

            {error && <div className="auth-error" style={{ marginBottom: 14, textAlign: 'left' }}>⚠ {error}</div>}

            <button
              className="btn btn-ghost"
              style={{ width: '100%', marginBottom: 10 }}
              onClick={handleResend}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : '↩'} Resend confirmation email
            </button>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => { setScreen('form'); setMode('login'); clearError(); }}
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Screen: magic-sent
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'magic-sent') {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-brand">
            <div className="auth-brand-icon">✦</div>
            <h1>AI Summary App</h1>
          </div>

          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>✨</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>
              Magic link sent!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 6 }}>
              We sent a sign-in link to:
            </p>
            <p style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 15, marginBottom: 20, wordBreak: 'break-all' }}>
              {sentTo}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
              Click the link in that email to sign in instantly — no password needed.
              <br />
              Check your <strong>Spam / Junk</strong> folder if you don't see it.
            </p>

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => { setScreen('form'); clearError(); }}
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Screen: main form
  // ─────────────────────────────────────────────────────────────────────────
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
          <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="subtitle">
            {mode === 'login'
              ? 'Sign in to access your documents and projects'
              : 'Get started — it only takes a moment'}
          </p>

          {/* Error banner */}
          {error && (
            <div className="auth-error">
              <span style={{ marginRight: 6 }}>⚠</span>
              {error}
              <button
                onClick={clearError}
                style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 15, lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          )}

          {/* ── Google button ───────────────────────────────────────────────── */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '12px 16px',
              border: '1.5px solid var(--border)',
              borderRadius: 10,
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 500,
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.65 : 1,
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxShadow: 'none',
            }}
            onMouseEnter={(e) => {
              if (!busy) {
                e.currentTarget.style.borderColor = '#4285F4';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(66,133,244,0.12)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {gLoading
              ? <span className="spinner" style={{ width: 16, height: 16 }} />
              : <GoogleIcon />
            }
            {gLoading ? 'Redirecting to Google…' : 'Continue with Google'}
          </button>

          {/* ── Divider ─────────────────────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            margin: '18px 0 14px',
            color: 'var(--text-muted)', fontSize: 12,
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            or with email &amp; password
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* ── Email / Password form ────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} noValidate>
            {mode === 'signup' && (
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={busy}
                  required
                  autoComplete="name"
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
                disabled={busy}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy}
              style={{ marginTop: 4 }}
            >
              {loading && <span className="spinner" />}
              {loading
                ? 'Please wait…'
                : mode === 'login'
                  ? 'Sign In with Email'
                  : 'Create Account'}
            </button>
          </form>

          {/* ── Magic link (login mode only) ────────────────────────────────── */}
          {mode === 'login' && (
            <button
              type="button"
              onClick={handleMagicLink}
              disabled={busy}
              style={{
                width: '100%',
                marginTop: 10,
                padding: '10px 14px',
                background: 'transparent',
                border: '1.5px dashed var(--border)',
                borderRadius: 10,
                cursor: busy ? 'not-allowed' : 'pointer',
                color: 'var(--text-secondary)',
                fontSize: 13,
                fontFamily: 'var(--font-body)',
                transition: 'border-color 0.2s, color 0.2s',
                opacity: busy ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!busy) {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--accent)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              ✉ Send me a magic link instead
            </button>
          )}

          {/* ── Mode switch ──────────────────────────────────────────────────── */}
          <div className="auth-switch" style={{ marginTop: 20 }}>
            {mode === 'login' ? (
              <>
                No account yet?{' '}
                <button
                  onClick={() => { setMode('signup'); clearError(); }}
                  disabled={busy}
                >
                  Create one free
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('login'); clearError(); }}
                  disabled={busy}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dark mode toggle */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onToggleDark}
            style={{ fontSize: 13 }}
          >
            {darkMode ? '☀ Light Mode' : '⏾ Dark Mode'}
          </button>
        </div>

      </div>
    </div>
  );
}
