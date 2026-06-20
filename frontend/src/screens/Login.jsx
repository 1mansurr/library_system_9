import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'LIBRARIAN' ? '/dashboard' : '/catalog', { replace: true });
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  const inputBase = {
    width: '100%', boxSizing: 'border-box', padding: '12px 13px',
    border: '1px solid var(--border-strong)', borderRadius: 10,
    font: '400 15px var(--ui)', background: '#fff', color: 'var(--text)', outline: 'none',
  };
  const focusOn  = e => { e.target.style.borderColor = 'var(--primary)'; };
  const focusOff = e => { e.target.style.borderColor = 'var(--border-strong)'; };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.05fr 1fr' }}>
      {/* brand side */}
      <div style={{ background: 'var(--primary)', color: '#fff', padding: '56px 6vw', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,.07) 1px, transparent 0)', backgroundSize: '22px 22px' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,.12)', font: '700 19px var(--serif)' }}>K</span>
          <div style={{ font: '500 14px var(--ui)', opacity: 0.92 }}>University Library</div>
        </div>
        <div style={{ position: 'relative', maxWidth: 440 }}>
          <div style={{ font: 'italic 400 16px var(--serif)', color: 'var(--accent-soft)', opacity: 0.85, marginBottom: 18 }}>Kwame Nkrumah University of Science &amp; Technology</div>
          <h1 style={{ font: '600 40px/1.12 var(--serif)', letterSpacing: '-.01em', margin: '0 0 18px' }}>Every title in the stacks, a click away.</h1>
          <p style={{ font: '400 18px/1.65 var(--serif)', opacity: 0.82, margin: 0 }}>Search the catalogue, borrow from any branch, and track your loans and fines — all from one quiet, well-kept place.</p>
          <div style={{ marginTop: 34, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              'Browse thousands of titles across every faculty',
              'Borrow books and track due dates in real time',
              'Manage your account and view fines online',
            ].map(text => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, font: '500 14.5px var(--ui)', opacity: 0.92 }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,.12)', flexShrink: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                {text}
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', font: 'italic 400 14px var(--serif)', opacity: 0.6 }}>Kumasi · Ghana — open Mon–Sat, 8am to 9pm</div>
      </div>

      {/* form side */}
      <div style={{ background: 'var(--bg)', padding: '56px 6vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: 380, margin: '0 auto' }}>
          <h2 style={{ font: '600 28px var(--serif)', letterSpacing: '-.005em', margin: '0 0 6px' }}>Welcome back</h2>
          <p style={{ font: '400 16px var(--serif)', color: 'var(--muted)', margin: '0 0 30px' }}>Sign in to your library account.</p>

          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', font: '500 13px var(--ui)', color: 'var(--muted)', marginBottom: 7 }}>Email address</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="ama.mensah@st.knust.edu.gh"
              style={{ ...inputBase, marginBottom: 18 }}
              onFocus={focusOn} onBlur={focusOff}
            />
            <label style={{ display: 'block', font: '500 13px var(--ui)', color: 'var(--muted)', marginBottom: 7 }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ ...inputBase, marginBottom: 22 }}
              onFocus={focusOn} onBlur={focusOff}
            />
            {error && <div style={{ background: 'var(--bad-bg)', color: 'var(--bad-fg)', font: '500 13px var(--ui)', padding: '10px 13px', borderRadius: 9, marginBottom: 14 }}>{error}</div>}
            <button
              type="submit" disabled={loading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: 13, font: '600 15px var(--ui)', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0', color: 'var(--faint)', font: '500 12px var(--ui)' }}>
            <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            or jump straight in
            <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <p style={{ textAlign: 'center', font: '400 14px var(--ui)', color: 'var(--muted)', margin: '28px 0 0' }}>
            New here?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', font: '600 14px var(--ui)', textDecoration: 'underline', textUnderlineOffset: 2 }}>Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
