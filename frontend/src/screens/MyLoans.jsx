import { useState, useEffect, useCallback } from 'react';
import AppChrome from '../components/AppChrome';
import { useToast } from '../components/Toast';
import { apiFetch } from '../lib/api';

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateStr));
}
function money(n) { return `GH₵ ${Number(n).toFixed(2)}`; }
function daysApart(a, b) { return Math.round((new Date(a) - new Date(b)) / 86400000); }

export default function MyLoans() {
  const toast = useToast();
  const [loans, setLoans]     = useState([]);
  const [copies, setCopies]   = useState({});
  const [tab, setTab]         = useState('active');
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/loans/me');
      setLoans(data);
      const ids = [...new Set(data.map(l => l.copy_id))];
      const resolved = {};
      await Promise.all(ids.map(async id => {
        try {
          const c = await apiFetch(`/api/copies/${id}`);
          resolved[id] = c;
        } catch {}
      }));
      setCopies(resolved);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleReturn(loanId, title) {
    setReturning(loanId);
    try {
      const result = await apiFetch(`/api/loans/${loanId}/return`, { method: 'POST' });
      const fine = Number(result.fine_amount ?? 0);
      toast(
        fine > 0 ? `Returned — fine of ${money(fine)}` : 'Returned on time. No fine.',
        title
      );
      await load();
    } catch {
      toast('Something went wrong. Try again in a moment.');
    } finally {
      setReturning(null);
    }
  }

  const now = new Date();
  const active = loans.filter(l => l.status === 'BORROWED');
  const past   = loans.filter(l => l.status === 'RETURNED');

  const tabBtn = (key, label, count) => {
    const on = tab === key;
    return (
      <button onClick={() => setTab(key)}
        style={{ background: on ? '#fff' : 'transparent', color: on ? 'var(--text)' : 'var(--muted)', border: 'none', borderRadius: 8, padding: '8px 18px', font: `${on ? 600 : 500} 13.5px var(--ui)`, cursor: 'pointer', boxShadow: on ? '0 1px 2px rgba(0,0,0,.06)' : 'none' }}>
        {label} <span style={{ opacity: 0.7 }}>{count}</span>
      </button>
    );
  };

  return (
    <AppChrome>
      <main style={{ maxWidth: 880, margin: '0 auto', padding: '40px 24px 90px', animation: 'fadeUp .35s ease' }}>
        <h1 style={{ font: '600 38px var(--serif)', letterSpacing: '-.01em', lineHeight: 1.13, margin: '0 0 22px' }}>My loans</h1>

        <div style={{ display: 'inline-flex', gap: 3, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: 4, marginBottom: 24 }}>
          {tabBtn('active', 'Active', active.length)}
          {tabBtn('past', 'Past', past.length)}
        </div>

        {loading && <div style={{ color: 'var(--muted)', padding: '40px 0' }}>Loading…</div>}

        {!loading && tab === 'active' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {active.length === 0 && <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', font: '400 16px var(--serif)' }}>No active loans. Browse the catalogue to borrow a book.</div>}
            {active.map(ln => {
              const copy    = copies[ln.copy_id] ?? {};
              const title   = copy.title   ?? ln.copy_id;
              const author  = copy.author  ?? '';
              const dueDate = new Date(ln.due_date);
              const dleft   = Math.round((dueDate - now) / 86400000);
              const overdue = dleft < 0;
              let statusText, statusColor;
              if (overdue) { statusText = `${Math.abs(dleft)} day${Math.abs(dleft) === 1 ? '' : 's'} overdue`; statusColor = 'var(--bad-fg)'; }
              else if (dleft === 0) { statusText = 'Due today'; statusColor = 'var(--accent-text)'; }
              else if (dleft === 1) { statusText = 'Due tomorrow'; statusColor = 'var(--accent-text)'; }
              else { statusText = `Due in ${dleft} days`; statusColor = 'var(--muted)'; }
              const fineEst = ln.current_fine_estimate ?? 0;

              return (
                <div key={ln.loan_id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', borderLeft: `3px solid ${overdue ? 'var(--bad-fg)' : 'var(--primary)'}` }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ font: '600 18px var(--serif)', color: 'var(--text)', marginBottom: 3 }}>{title}</div>
                    {author && <div style={{ font: '400 13px var(--ui)', color: 'var(--muted)' }}>{author}</div>}
                    <div style={{ display: 'flex', gap: 18, marginTop: 13, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ font: '400 12px var(--ui)', color: 'var(--faint)' }}>Borrowed</div>
                        <div style={{ font: '500 13px var(--ui)', color: 'var(--text)', marginTop: 2 }}>{fmt(ln.borrow_date)}</div>
                      </div>
                      <div>
                        <div style={{ font: '400 12px var(--ui)', color: 'var(--faint)' }}>Due</div>
                        <div style={{ font: '500 13px var(--ui)', color: 'var(--text)', marginTop: 2 }}>{fmt(ln.due_date)}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                    <div style={{ font: '600 13.5px var(--ui)', color: statusColor }}>{statusText}</div>
                    {overdue && <div style={{ font: '500 12.5px var(--ui)', color: 'var(--bad-fg)', background: 'var(--bad-bg)', padding: '3px 9px', borderRadius: 7 }}>Fine so far {money(fineEst)}</div>}
                    <button onClick={() => handleReturn(ln.loan_id, title)} disabled={returning === ln.loan_id}
                      style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 18px', font: '600 13.5px var(--ui)', cursor: returning === ln.loan_id ? 'wait' : 'pointer', opacity: returning === ln.loan_id ? 0.7 : 1 }}>
                      {returning === ln.loan_id ? 'Returning…' : 'Return'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && tab === 'past' && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            {past.length === 0 && <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', font: '400 16px var(--serif)' }}>No past loans yet.</div>}
            {past.map(ln => {
              const copy   = copies[ln.copy_id] ?? {};
              const title  = copy.title ?? ln.copy_id;
              const fine   = Number(ln.fine_amount ?? 0);
              return (
                <div key={ln.loan_id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '17px 22px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: '600 15px var(--serif)', color: 'var(--text)' }}>{title}</div>
                    <div style={{ font: '400 12.5px var(--ui)', color: 'var(--muted)', marginTop: 2 }}>
                      Borrowed {fmt(ln.borrow_date)} · Returned {fmt(ln.return_date)}
                    </div>
                  </div>
                  <div style={{ font: '500 12.5px var(--ui)', color: 'var(--muted)' }}>{fine > 0 ? `Fine ${money(fine)}` : 'No fine'}</div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 11px', borderRadius: 7, font: '600 11.5px var(--ui)', background: 'var(--ok-bg)', color: 'var(--ok-fg)' }}>Returned</span>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </AppChrome>
  );
}
