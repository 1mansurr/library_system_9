import { useState, useEffect, useCallback } from 'react';
import AppChrome from '../components/AppChrome';
import { useToast } from '../components/Toast';
import { apiFetch } from '../lib/api';

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateStr));
}

export default function Approvals() {
  const toast = useToast();
  const [loans, setLoans]   = useState([]);
  const [users, setUsers]   = useState({});
  const [copies, setCopies] = useState({});
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/loans/pending');
      setLoans(data);

      const userIds = [...new Set(data.map(l => l.user_id))];
      const copyIds = [...new Set(data.map(l => l.copy_id))];

      const [resolvedUsers, resolvedCopies] = await Promise.all([
        Promise.all(userIds.map(async id => {
          try { return [id, await apiFetch(`/api/users/${id}`)]; } catch { return [id, null]; }
        })),
        Promise.all(copyIds.map(async id => {
          try { return [id, await apiFetch(`/api/copies/${id}`)]; } catch { return [id, null]; }
        })),
      ]);

      setUsers(Object.fromEntries(resolvedUsers.filter(([, u]) => u).map(([id, u]) => [id, u])));
      setCopies(Object.fromEntries(resolvedCopies.filter(([, c]) => c).map(([id, c]) => [id, c])));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function act(loanId, endpoint, successMsg) {
    setActing(loanId + endpoint);
    try {
      await apiFetch(`/api/loans/${loanId}/${endpoint}`, { method: 'POST' });
      toast(successMsg);
      await load();
    } catch (err) {
      toast(err?.body?.message || 'Something went wrong. Try again.');
    } finally {
      setActing(null);
    }
  }

  const borrowRequests = loans.filter(l => l.status === 'PENDING');
  const returnRequests = loans.filter(l => l.status === 'PENDING_RETURN');

  function Section({ title, subtitle, items, renderActions }) {
    return (
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
          <h2 style={{ font: '600 22px var(--serif)', margin: 0 }}>{title}</h2>
          <span style={{ font: '500 13px var(--ui)', color: 'var(--muted)' }}>{subtitle}</span>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          {items.length === 0 && (
            <div style={{ padding: '36px 22px', textAlign: 'center', color: 'var(--muted)', font: '400 14px var(--serif)' }}>
              No pending {title.toLowerCase()} right now.
            </div>
          )}
          {items.map(loan => {
            const user = users[loan.user_id];
            const copy = copies[loan.copy_id];
            return (
              <div key={loan.loan_id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr 1fr', gap: 16, alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
                {/* Member */}
                <div>
                  <div style={{ font: '600 14.5px var(--ui)', color: 'var(--text)' }}>{user?.full_name ?? '…'}</div>
                  <div style={{ font: '400 12.5px var(--ui)', color: 'var(--muted)', marginTop: 2 }}>
                    {user?.card_number ?? ''} · {user?.member_type ? user.member_type.charAt(0) + user.member_type.slice(1).toLowerCase() : ''}
                  </div>
                </div>
                {/* Book */}
                <div>
                  <div style={{ font: '600 14px var(--ui)', color: 'var(--text)' }}>{copy?.title ?? copy?.barcode ?? '…'}</div>
                  <div style={{ font: '400 12.5px var(--ui)', color: 'var(--muted)', marginTop: 2 }}>
                    {copy?.author ?? ''}{copy?.location ? ` · Shelf ${copy.location}` : ''}
                  </div>
                  <div style={{ font: '400 12px var(--ui)', color: 'var(--faint)', marginTop: 3 }}>Requested {fmt(loan.borrow_date)}</div>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  {renderActions(loan)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const btnBase = { border: 'none', borderRadius: 8, padding: '8px 14px', font: '600 13px var(--ui)', cursor: 'pointer' };

  return (
    <AppChrome>
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 90px', animation: 'fadeUp .35s ease' }}>
        <h1 style={{ font: '600 38px var(--serif)', letterSpacing: '-.01em', lineHeight: 1.13, margin: '0 0 6px' }}>Approvals</h1>
        <p style={{ font: '400 15px var(--ui)', color: 'var(--muted)', margin: '0 0 28px' }}>
          {loading ? 'Loading…' : `${borrowRequests.length} borrow request${borrowRequests.length !== 1 ? 's' : ''}, ${returnRequests.length} return request${returnRequests.length !== 1 ? 's' : ''} pending`}
        </p>

        {!loading && (
          <>
            <Section
              title="Borrow Requests"
              subtitle="Members waiting for you to hand over the book"
              items={borrowRequests}
              renderActions={loan => (
                <>
                  <button
                    disabled={!!acting}
                    onClick={() => act(loan.loan_id, 'approve', `Approved — book issued to ${users[loan.user_id]?.full_name ?? 'member'}.`)}
                    style={{ ...btnBase, background: 'var(--primary)', color: '#fff', opacity: acting ? 0.7 : 1 }}>
                    {acting === loan.loan_id + 'approve' ? '…' : 'Approve'}
                  </button>
                  <button
                    disabled={!!acting}
                    onClick={() => act(loan.loan_id, 'reject', `Request rejected.`)}
                    style={{ ...btnBase, background: 'var(--bad-bg)', color: 'var(--bad-fg)', opacity: acting ? 0.7 : 1 }}>
                    {acting === loan.loan_id + 'reject' ? '…' : 'Reject'}
                  </button>
                </>
              )}
            />

            <Section
              title="Return Requests"
              subtitle="Members who have physically brought the book back"
              items={returnRequests}
              renderActions={loan => (
                <button
                  disabled={!!acting}
                  onClick={() => act(loan.loan_id, 'confirm-return', `Return confirmed. Book marked available.`)}
                  style={{ ...btnBase, background: 'var(--ok-bg)', color: 'var(--ok-fg)', border: '1px solid var(--ok-fg)', opacity: acting ? 0.7 : 1 }}>
                  {acting === loan.loan_id + 'confirm-return' ? '…' : 'Confirm Return'}
                </button>
              )}
            />
          </>
        )}
      </main>
    </AppChrome>
  );
}
