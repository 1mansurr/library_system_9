import { useState, useEffect } from 'react';
import AppChrome from '../components/AppChrome';
import { apiFetch } from '../lib/api';

export default function Profile() {
  const [me, setMe]         = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/users/me')
      .then(setMe)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AppChrome><div style={{ padding: 40, color: 'var(--muted)' }}>Loading…</div></AppChrome>;
  if (!me) return null;

  const statusBadge = me.status === 'ACTIVE'
    ? { bg: 'rgba(255,255,255,.16)', fg: '#fff', label: 'Active' }
    : { bg: 'var(--bad-bg)', fg: 'var(--bad-fg)', label: 'Suspended' };

  const idRow = me.member_type === 'STAFF'
    ? { k: 'Staff ID', v: me.staff_id || '—' }
    : me.member_type === 'STUDENT'
    ? { k: 'Matric number', v: me.matric_no || '—' }
    : null;

  const rows = [
    { k: 'Email',       v: me.email || '—' },
    { k: 'Phone',       v: me.phone || '—' },
    ...(idRow ? [idRow] : []),
    { k: 'Member type', v: me.member_type ? me.member_type.charAt(0) + me.member_type.slice(1).toLowerCase() : '—' },
  ];

  const joinedDate = me.created_at
    ? new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' }).format(new Date(me.created_at))
    : '—';

  return (
    <AppChrome>
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 90px', animation: 'fadeUp .35s ease' }}>
        <h1 style={{ font: '600 38px var(--serif)', letterSpacing: '-.01em', lineHeight: 1.13, margin: '0 0 24px' }}>My profile</h1>

        {/* Library Card */}
        <div style={{ background: 'var(--primary)', color: '#fff', borderRadius: 16, padding: '26px 28px', position: 'relative', overflow: 'hidden', marginBottom: 26 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,.08) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ font: 'italic 400 15px var(--serif)', opacity: 0.7, marginBottom: 16 }}>KNUST Library Card</div>
              <div style={{ font: '600 28px var(--serif)', marginBottom: 6 }}>{me.full_name}</div>
              <div style={{ font: '500 13px var(--ui)', opacity: 0.78 }}>
                {me.member_type ? me.member_type.charAt(0) + me.member_type.slice(1).toLowerCase() : ''}{joinedDate !== '—' ? ` · Member since ${joinedDate}` : ''}
              </div>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 12px', borderRadius: 20, font: '600 12px var(--ui)', background: statusBadge.bg, color: statusBadge.fg }}>{statusBadge.label}</span>
          </div>
          <div style={{ position: 'relative', marginTop: 30, font: '600 22px var(--ui)', letterSpacing: '.16em', fontVariantNumeric: 'tabular-nums' }}>{me.card_number || '—'}</div>
        </div>

        {/* Details */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          {rows.map(r => (
            <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '15px 22px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ font: '500 13.5px var(--ui)', color: 'var(--muted)' }}>{r.k}</span>
              <span style={{ font: '500 13.5px var(--ui)', color: 'var(--text)', textAlign: 'right' }}>{r.v}</span>
            </div>
          ))}
        </div>
      </main>
    </AppChrome>
  );
}
