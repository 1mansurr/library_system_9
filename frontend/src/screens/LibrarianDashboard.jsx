import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppChrome from '../components/AppChrome';
import { apiFetch } from '../lib/api';

function fmt(d) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

export default function LibrarianDashboard() {
  const navigate = useNavigate();
  const [stats, setStats]     = useState(null);
  const [overdue, setOverdue] = useState([]);
  const [names, setNames]     = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [booksPage, overdueLoans, pendingLoans] = await Promise.all([
          apiFetch('/api/books?size=1'),
          apiFetch('/api/loans/overdue'),
          apiFetch('/api/loans/pending'),
        ]);
        setStats({
          titles:  booksPage.total ?? 0,
          overdue: overdueLoans.length,
          pending: pendingLoans.length,
        });
        const sorted = [...overdueLoans].sort((a, b) =>
          new Date(a.due_date) - new Date(b.due_date)
        ).slice(0, 4);
        setOverdue(sorted);

        const ids = [...new Set(sorted.map(l => l.user_id))];
        const resolved = {};
        await Promise.all(ids.map(async id => {
          try {
            const u = await apiFetch(`/api/users/${id}`);
            resolved[id] = u.full_name;
          } catch {}
        }));
        setNames(resolved);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const today = fmt(new Date());

  const statCards = stats ? [
    { value: stats.titles,  label: 'Titles in catalogue', edge: 'var(--primary)' },
    { value: stats.pending, label: 'Pending approvals',   edge: 'var(--accent)' },
    { value: stats.overdue, label: 'Overdue',             edge: 'var(--bad-fg)' },
  ] : [];

  function daysOverdue(dueDate) {
    return Math.round((new Date() - new Date(dueDate)) / 86400000);
  }

  return (
    <AppChrome>
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 24px 90px', animation: 'fadeUp .35s ease' }}>
        <h1 style={{ font: '600 38px var(--serif)', letterSpacing: '-.01em', lineHeight: 1.13, margin: '0 0 4px' }}>Library overview</h1>
        <p style={{ font: '400 15px var(--ui)', color: 'var(--muted)', margin: '0 0 28px' }}>Today is {today}</p>

        {/* Stat tiles */}
        {loading ? (
          <div style={{ color: 'var(--muted)', marginBottom: 30 }}>Loading stats…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 30 }}>
            {statCards.map(s => (
              <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, borderTop: `3px solid ${s.edge}` }}>
                <div style={{ font: '600 34px var(--serif)', color: 'var(--text)', lineHeight: 1, marginBottom: 8 }}>{s.value}</div>
                <div style={{ font: '500 13px var(--ui)', color: 'var(--muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20, alignItems: 'start' }}>
          {/* Overdue list */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '17px 22px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ font: '600 19px var(--serif)', margin: 0 }}>Needs attention</h3>
              <button onClick={() => navigate('/dashboard/overdue')} style={{ background: 'none', border: 'none', color: 'var(--primary)', font: '600 13px var(--ui)', cursor: 'pointer' }}>View all overdue →</button>
            </div>
            {overdue.length === 0 && !loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', font: '400 14px var(--ui)' }}>Nothing overdue. All clear.</div>}
            {overdue.map(o => {
              const days = daysOverdue(o.due_date);
              return (
                <div key={o.loan_id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 22px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: '600 14px var(--ui)', color: 'var(--text)' }}>{names[o.user_id] ?? '…'}</div>
                    <div style={{ font: '400 12.5px var(--ui)', color: 'var(--muted)' }}>Copy {o.copy_id?.slice(0, 8)}</div>
                  </div>
                  <div style={{ font: '600 12.5px var(--ui)', color: 'var(--bad-fg)', background: 'var(--bad-bg)', padding: '3px 10px', borderRadius: 7 }}>{days} days</div>
                </div>
              );
            })}
          </div>

          {/* Quick actions */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22 }}>
            <h3 style={{ font: '600 19px var(--serif)', margin: '0 0 16px' }}>Quick actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => navigate('/dashboard/books/new')}
                style={{ display: 'flex', alignItems: 'center', gap: 11, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 11, padding: '14px 16px', font: '600 14px var(--ui)', cursor: 'pointer', textAlign: 'left' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add a new book
              </button>
              <button onClick={() => navigate('/dashboard/approvals')}
                style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#fff', color: 'var(--text)', border: '1px solid var(--border-strong)', borderRadius: 11, padding: '14px 16px', font: '600 14px var(--ui)', cursor: 'pointer', textAlign: 'left' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                Review pending approvals
                {stats?.pending > 0 && <span style={{ marginLeft: 'auto', background: 'var(--accent)', color: 'var(--accent-text)', font: '700 11px var(--ui)', padding: '2px 8px', borderRadius: 10 }}>{stats.pending}</span>}
              </button>
              <button onClick={() => navigate('/dashboard/overdue')}
                style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#fff', color: 'var(--text)', border: '1px solid var(--border-strong)', borderRadius: 11, padding: '14px 16px', font: '600 14px var(--ui)', cursor: 'pointer', textAlign: 'left' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Review overdue loans
              </button>
              <button onClick={() => navigate('/dashboard/members')}
                style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#fff', color: 'var(--text)', border: '1px solid var(--border-strong)', borderRadius: 11, padding: '14px 16px', font: '600 14px var(--ui)', cursor: 'pointer', textAlign: 'left' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
                Manage members
              </button>
            </div>
          </div>
        </div>
      </main>
    </AppChrome>
  );
}
