import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppChrome from '../components/AppChrome';
import { apiFetch } from '../lib/api';

function daysOverdue(dueDateStr) {
  return Math.round((new Date() - new Date(dueDateStr)) / 86400000);
}

export default function Overdue() {
  const navigate = useNavigate();
  const [loans, setLoans]   = useState([]);
  const [names, setNames]   = useState({});
  const [copies, setCopies] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await apiFetch('/api/loans/overdue');
        setLoans(data);

        const userIds = [...new Set(data.map(l => l.user_id))];
        const copyIds = [...new Set(data.map(l => l.copy_id))];

        const [resolvedNames, resolvedCopies] = await Promise.all([
          Promise.all(userIds.map(async id => {
            try { return [id, await apiFetch(`/api/users/${id}`)]; } catch { return [id, null]; }
          })),
          Promise.all(copyIds.map(async id => {
            try { return [id, await apiFetch(`/api/copies/${id}`)]; } catch { return [id, null]; }
          })),
        ]);

        setNames(Object.fromEntries(resolvedNames.filter(([, u]) => u).map(([id, u]) => [id, u])));
        setCopies(Object.fromEntries(resolvedCopies.filter(([, c]) => c).map(([id, c]) => [id, c])));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const sorted = [...loans].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  return (
    <AppChrome>
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 90px', animation: 'fadeUp .35s ease' }}>
        <h1 style={{ font: '600 38px var(--serif)', letterSpacing: '-.01em', lineHeight: 1.13, margin: '0 0 5px' }}>Overdue loans</h1>
        <p style={{ font: '400 15px var(--ui)', color: 'var(--muted)', margin: '0 0 24px' }}>
          {loading ? 'Loading…' : `${loans.length} ${loans.length === 1 ? 'loan' : 'loans'} past due`}
        </p>

        {!loading && loans.length === 0 && (
          <div style={{ textAlign: 'center', padding: '70px 20px', color: 'var(--muted)', font: '400 16px var(--serif)' }}>Nothing overdue right now.</div>
        )}

        {!loading && loans.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr .8fr 1fr', gap: 14, padding: '13px 22px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', font: '600 12px var(--ui)', letterSpacing: '.02em', color: 'var(--faint)' }}>
              <div>Member</div><div>Book</div><div>Overdue</div><div style={{ textAlign: 'right' }}>Action</div>
            </div>
            {sorted.map(loan => {
              const user  = names[loan.user_id];
              const copy  = copies[loan.copy_id];
              const days  = daysOverdue(loan.due_date);
              return (
                <div key={loan.loan_id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr .8fr 1fr', gap: 14, padding: '15px 22px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                  <div>
                    <button onClick={() => navigate(`/dashboard/members?uid=${loan.user_id}`)}
                      style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}>
                      <div style={{ font: '600 14px var(--ui)', color: 'var(--primary)', textDecoration: 'underline', textUnderlineOffset: 2 }}>{user?.full_name ?? '—'}</div>
                    </button>
                    <div style={{ font: '400 12px var(--ui)', color: 'var(--muted)', marginTop: 2 }}>{user?.phone ?? ''}</div>
                  </div>
                  <div style={{ font: '500 13.5px var(--ui)', color: 'var(--text)' }}>{copy?.title ?? copy?.barcode ?? '—'}</div>
                  <div>
                    <span style={{ font: '600 12.5px var(--ui)', color: 'var(--bad-fg)', background: 'var(--bad-bg)', padding: '3px 10px', borderRadius: 7 }}>{days} days</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <button onClick={() => alert(`Notify ${user?.full_name ?? 'member'} — email/SMS not wired in MVP`)}
                      style={{ background: '#fff', color: 'var(--text)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '7px 13px', font: '600 12.5px var(--ui)', cursor: 'pointer' }}>
                      Notify
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </AppChrome>
  );
}
