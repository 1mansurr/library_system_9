import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AppChrome from '../components/AppChrome';
import { useToast } from '../components/Toast';
import { apiFetch } from '../lib/api';

function statusBadge(status) {
  return status === 'ACTIVE'
    ? { bg: 'var(--ok-bg)', fg: 'var(--ok-fg)', label: 'Active' }
    : { bg: 'var(--bad-bg)', fg: 'var(--bad-fg)', label: 'Suspended' };
}

export default function Members() {
  const toast    = useToast();
  const location = useLocation();
  const [query, setQuery]     = useState('');
  const [member, setMember]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const uid = params.get('uid');
    if (uid) lookupById(uid);
  }, [location.search]);

  async function lookupById(id) {
    setLoading(true);
    setError('');
    setMember(null);
    try {
      const u = await apiFetch(`/api/users/${id}`);
      setMember(u);
    } catch (err) {
      setError(err?.status === 404 ? 'Member not found.' : 'Could not load member.');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    const id = query.trim();
    if (!id) return;
    lookupById(id);
  }

  async function toggleStatus() {
    if (!member) return;
    const newStatus = member.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setToggling(true);
    try {
      const updated = await apiFetch(`/api/users/${member.user_id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setMember(updated);
      toast(`${updated.full_name} is now ${newStatus.toLowerCase()}.`);
    } catch {
      toast('Something went wrong. Try again.');
    } finally {
      setToggling(false);
    }
  }

  const bd = member ? statusBadge(member.status) : null;
  const idRow = member?.member_type === 'STAFF'
    ? { k: 'Staff ID', v: member.staff_id || '—' }
    : member?.member_type === 'STUDENT'
    ? { k: 'Matric number', v: member.matric_no || '—' }
    : null;

  return (
    <AppChrome>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 90px', animation: 'fadeUp .35s ease' }}>
        <h1 style={{ font: '600 38px var(--serif)', letterSpacing: '-.01em', lineHeight: 1.13, margin: '0 0 22px' }}>Members</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 22, alignItems: 'start' }}>
          {/* Search panel */}
          <div>
            <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: 14 }}>
              <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--faint)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input
                value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Paste member user_id (UUID) and press Enter"
                style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px 11px 38px', border: '1px solid var(--border-strong)', borderRadius: 10, font: '400 14px var(--ui)', background: '#fff', color: 'var(--text)', outline: 'none' }}
                onFocus={e => { e.target.style.borderColor = 'var(--primary)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; }}
              />
            </form>

            {error && <div style={{ background: 'var(--bad-bg)', color: 'var(--bad-fg)', font: '500 13px var(--ui)', padding: '10px 13px', borderRadius: 9 }}>{error}</div>}
            {loading && <div style={{ color: 'var(--muted)', padding: '20px 0' }}>Looking up…</div>}
            {!loading && !member && !error && (
              <div style={{ background: 'var(--surface-2)', border: '1px dashed var(--border-strong)', borderRadius: 14, padding: '50px 24px', textAlign: 'center', color: 'var(--muted)', font: '400 14px var(--ui)' }}>
                Enter a member's user ID to view their record.
              </div>
            )}
          </div>

          {/* Member detail panel */}
          <div style={{ position: 'sticky', top: 80 }}>
            {member && bd && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 26 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 50, height: 50, borderRadius: '50%', background: 'var(--primary-soft)', color: 'var(--primary)', font: '600 18px var(--serif)', flexShrink: 0 }}>
                    {member.full_name?.[0]?.toUpperCase() ?? 'U'}
                  </span>
                  <div>
                    <div style={{ font: '600 19px var(--serif)', color: 'var(--text)' }}>{member.full_name}</div>
                    <div style={{ font: '400 13px var(--ui)', color: 'var(--muted)' }}>{member.card_number}</div>
                  </div>
                  <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', padding: '4px 11px', borderRadius: 20, font: '600 12px var(--ui)', background: bd.bg, color: bd.fg }}>{bd.label}</span>
                </div>

                <div style={{ display: 'grid', gap: 1, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 11, overflow: 'hidden', marginBottom: 22 }}>
                  {[
                    { k: 'Email', v: member.email },
                    { k: 'Phone', v: member.phone || '—' },
                    ...(idRow ? [idRow] : []),
                    { k: 'Member type', v: member.member_type ? member.member_type.charAt(0) + member.member_type.slice(1).toLowerCase() : '—' },
                  ].map(r => (
                    <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '12px 16px', background: 'var(--surface)' }}>
                      <span style={{ font: '500 12.5px var(--ui)', color: 'var(--muted)' }}>{r.k}</span>
                      <span style={{ font: '500 12.5px var(--ui)', color: 'var(--text)', textAlign: 'right' }}>{r.v}</span>
                    </div>
                  ))}
                </div>

                <button onClick={toggleStatus} disabled={toggling}
                  style={{
                    width: '100%', borderRadius: 10, padding: 12, font: '600 14px var(--ui)', cursor: toggling ? 'wait' : 'pointer',
                    border: '1px solid transparent', opacity: toggling ? 0.7 : 1,
                    ...(member.status === 'ACTIVE'
                      ? { background: 'var(--bad-bg)', color: 'var(--bad-fg)' }
                      : { background: 'var(--ok-bg)', color: 'var(--ok-fg)' }),
                  }}>
                  {toggling ? '…' : member.status === 'ACTIVE' ? 'Suspend member' : 'Reactivate member'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </AppChrome>
  );
}
