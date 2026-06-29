import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { apiFetch } from '../lib/api';

const MEMBER_TYPES = ['STUDENT', 'STAFF', 'EXTERNAL'];

export default function Register() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm] = useState({
    full_name: '', email: '', phone: '',
    member_type: 'STUDENT', matric_no: '', staff_id: '',
    password: '', confirm: '',
  });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function set(key) { return e => setForm(f => ({ ...f, [key]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.full_name.trim() || !form.email.trim() || !form.password) {
      setError('Please complete all required fields.'); return;
    }
    if (form.member_type === 'STUDENT' && !form.matric_no.trim()) {
      setError('Students must provide an index number.'); return;
    }
    if (form.member_type === 'STAFF' && !form.staff_id.trim()) {
      setError('Staff must provide a staff ID.'); return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.'); return;
    }

    const body = {
      full_name:   form.full_name.trim(),
      email:       form.email.trim(),
      phone:       form.phone.trim() || undefined,
      member_type: form.member_type,
      password:    form.password,
    };
    if (form.member_type === 'STUDENT') body.matric_no = form.matric_no.trim();
    if (form.member_type === 'STAFF')   body.staff_id  = form.staff_id.trim();

    setLoading(true);
    try {
      await apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(body) });
      await login(form.email.trim(), form.password);
      navigate('/catalog', { replace: true });
    } catch (err) {
      const msg = err?.body?.message || err?.body?.error || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const inputBase = {
    width: '100%', boxSizing: 'border-box', padding: '11px 13px',
    border: '1px solid var(--border-strong)', borderRadius: 10,
    font: '400 15px var(--ui)', background: '#fff', color: 'var(--text)', outline: 'none',
  };
  const focusOn  = e => { e.target.style.borderColor = 'var(--primary)'; };
  const focusOff = e => { e.target.style.borderColor = 'var(--border-strong)'; };
  const labelStyle = { display: 'block', font: '500 13px var(--ui)', color: 'var(--muted)', marginBottom: 7 };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px 80px' }}>
      <div style={{ width: '100%', maxWidth: 520, animation: 'fadeUp .4s ease' }}>
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--muted)', font: '500 13.5px var(--ui)', textDecoration: 'none', marginBottom: 26 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to sign in
        </Link>
        <h1 style={{ font: '600 38px var(--serif)', letterSpacing: '-.01em', lineHeight: 1.13, margin: '0 0 6px' }}>Create your library account</h1>
        <p style={{ font: '400 16px var(--serif)', color: 'var(--muted)', margin: '0 0 30px' }}>It takes a minute. Your library card number is issued on the spot.</p>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 30 }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
            <div>
              <label style={labelStyle}>Full name</label>
              <input value={form.full_name} onChange={set('full_name')} placeholder="e.g. Ama Mensah" style={inputBase} onFocus={focusOn} onBlur={focusOff} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder={{ STUDENT: 'you@st.knust.edu.gh', STAFF: 'you@knust.edu.gh', EXTERNAL: 'you@gmail.com' }[form.member_type]} style={inputBase} onFocus={focusOn} onBlur={focusOff} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input value={form.phone} onChange={set('phone')} placeholder="+233 …" style={inputBase} onFocus={focusOn} onBlur={focusOff} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Member type</label>
              <div style={{ display: 'flex', gap: 9 }}>
                {MEMBER_TYPES.map(t => {
                  const active = form.member_type === t;
                  return (
                    <button
                      key={t} type="button" onClick={() => setForm(f => ({ ...f, member_type: t }))}
                      style={{ flex: 1, background: active ? 'var(--primary)' : '#fff', color: active ? '#fff' : 'var(--muted)', border: `1px solid ${active ? 'var(--primary)' : 'var(--border-strong)'}`, borderRadius: 9, padding: 10, font: `${active ? 600 : 500} 13.5px var(--ui)`, cursor: 'pointer' }}
                    >
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            {form.member_type === 'STUDENT' && (
              <div>
                <label style={labelStyle}>Index Number</label>
                <input value={form.matric_no} onChange={set('matric_no')} placeholder="e.g. 20512345" style={inputBase} onFocus={focusOn} onBlur={focusOff} />
              </div>
            )}
            {form.member_type === 'STAFF' && (
              <div>
                <label style={labelStyle}>Staff ID</label>
                <input value={form.staff_id} onChange={set('staff_id')} placeholder="e.g. KN-STF-0421" style={inputBase} onFocus={focusOn} onBlur={focusOff} />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Password</label>
                <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" style={inputBase} onFocus={focusOn} onBlur={focusOff} />
              </div>
              <div>
                <label style={labelStyle}>Confirm password</label>
                <input type="password" value={form.confirm} onChange={set('confirm')} placeholder="••••••••" style={inputBase} onFocus={focusOn} onBlur={focusOff} />
              </div>
            </div>

            {error && <div style={{ background: 'var(--bad-bg)', color: 'var(--bad-fg)', font: '500 13px var(--ui)', padding: '10px 13px', borderRadius: 9 }}>{error}</div>}

            <button
              type="submit" disabled={loading}
              style={{ width: '100%', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: 13, font: '600 15px var(--ui)', cursor: loading ? 'wait' : 'pointer', marginTop: 4, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
