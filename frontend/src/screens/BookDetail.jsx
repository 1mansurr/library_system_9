import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppChrome from '../components/AppChrome';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';
import { apiFetch } from '../lib/api';

function badge(status) {
  switch (status) {
    case 'AVAILABLE': return { bg: 'var(--ok-bg)',      fg: 'var(--ok-fg)',       label: 'Available' };
    case 'LOANED':    return { bg: 'var(--accent-soft)', fg: 'var(--accent-text)', label: 'Loaned' };
    case 'LOST':      return { bg: 'var(--bad-bg)',      fg: 'var(--bad-fg)',      label: 'Lost' };
    default:          return { bg: 'var(--surface-2)',   fg: 'var(--muted)',       label: status };
  }
}

function fmt(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLibrarian } = useAuth();
  const toast = useToast();

  const [book, setBook]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason]   = useState('');
  const [borrowing, setBorrowing] = useState(null);

  async function loadBook() {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/books/${id}`);
      setBook(data);
    } catch {
      navigate('/catalog', { replace: true });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBook(); }, [id]);

  async function borrow(format) {
    const copies = book.copies ?? [];
    const candidate = copies.find(c => c.status === 'AVAILABLE' && c.format === format);
    if (!candidate) return;

    setBorrowing(format);
    setReason('');
    try {
      const loan = await apiFetch('/api/loans', {
        method: 'POST',
        body: JSON.stringify({ copy_id: candidate.copy_id }),
      });
      const due = loan?.due_date ? fmt(loan.due_date) : '';
      toast('Borrowed!', due ? `Due back on ${due}.` : 'Enjoy the book.');
      await loadBook();
    } catch (err) {
      const status = err?.status;
      const msg    = err?.body?.message || '';
      if (status === 409 && msg.toLowerCase().includes('limit')) {
        setReason("You've reached your loan limit. Return a book before borrowing.");
      } else if (status === 409) {
        setReason('This copy was just borrowed by someone else. Try another copy.');
      } else if (status === 403 && msg.toLowerCase().includes('suspend')) {
        setReason('Your account is suspended. Please visit the library desk.');
      } else if (status === 403) {
        setReason("You don't have permission for that.");
      } else {
        setReason('Something went wrong. Try again in a moment.');
      }
    } finally {
      setBorrowing(null);
    }
  }

  if (loading) return <AppChrome><div style={{ padding: 40, color: 'var(--muted)' }}>Loading…</div></AppChrome>;
  if (!book)   return null;

  const copies = book.copies ?? [];
  const avail  = copies.filter(c => c.status === 'AVAILABLE').length;

  return (
    <AppChrome>
      <main style={{ maxWidth: 880, margin: '0 auto', padding: '34px 24px 90px', animation: 'fadeUp .35s ease' }}>
        <button onClick={() => navigate('/catalog')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--muted)', font: '500 13.5px var(--ui)', cursor: 'pointer', padding: 0, marginBottom: 24 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to catalogue
        </button>

        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 30 }}>
          <div style={{ width: 120, height: 166, flexShrink: 0, borderRadius: 10, background: 'var(--primary-soft)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ font: '400 14px var(--ui)', color: 'var(--muted)', marginBottom: 12 }}>
              {book.course_name ? `${book.course_name} · ${book.department_name}` : 'Uncategorised'}
            </div>
            <h1 style={{ font: '600 34px/1.18 var(--serif)', letterSpacing: '-.01em', margin: '0 0 8px' }}>{book.title}</h1>
            <div style={{ font: '400 17px var(--serif)', color: 'var(--muted)', marginBottom: 18 }}>by {book.author}</div>
            <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
              <div>
                <div style={{ font: '400 13px var(--ui)', color: 'var(--faint)', marginBottom: 3 }}>ISBN</div>
                <div style={{ font: '500 14px var(--ui)', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{book.isbn}</div>
              </div>
              <div>
                <div style={{ font: '400 13px var(--ui)', color: 'var(--faint)', marginBottom: 3 }}>Copies</div>
                <div style={{ font: '500 14px var(--ui)', color: 'var(--text)' }}>{avail} of {copies.length} available</div>
              </div>
            </div>
          </div>
        </div>

        {reason && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--accent-soft)', color: 'var(--accent-text)', font: '500 13.5px var(--ui)', padding: '12px 15px', borderRadius: 11, marginBottom: 18 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {reason}
          </div>
        )}

        {isLibrarian && (
          <div style={{ marginBottom: 18 }}>
            <button onClick={() => navigate(`/dashboard/books/${id}/copies`)}
              style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', font: '600 14px var(--ui)', cursor: 'pointer' }}>
              + Add copy
            </button>
          </div>
        )}

        {!isLibrarian && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 26 }}>
            {['HARDCOPY', 'SOFTCOPY'].map(format => {
              const available = copies.some(c => c.status === 'AVAILABLE' && c.format === format);
              const busy = borrowing === format;
              const label = format === 'HARDCOPY' ? 'Borrow hardcopy' : 'Borrow softcopy';
              return (
                <button key={format} onClick={() => borrow(format)} disabled={!available || busy}
                  style={{ background: available ? 'var(--primary)' : 'var(--surface-2)', color: available ? '#fff' : 'var(--faint)', border: available ? 'none' : '1px solid var(--border)', borderRadius: 10, padding: '11px 20px', font: '600 14px var(--ui)', cursor: available && !busy ? 'pointer' : 'not-allowed', opacity: busy ? 0.7 : 1 }}>
                  {busy ? 'Borrowing…' : available ? label : `${label} (unavailable)`}
                </button>
              );
            })}
          </div>
        )}

        <h3 style={{ font: '600 18px var(--serif)', color: 'var(--text)', margin: '0 0 14px' }}>Copies</h3>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          {copies.length === 0 && <div style={{ padding: '40px 22px', color: 'var(--muted)', font: '400 14px var(--serif)' }}>No copies available yet.</div>}
          {copies.map(cp => {
            const bd = badge(cp.status);
            return (
              <div key={cp.copy_id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 11px', borderRadius: 7, font: '600 11.5px var(--ui)', letterSpacing: '.02em', background: bd.bg, color: bd.fg, flexShrink: 0, minWidth: 84, justifyContent: 'center' }}>{bd.label}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '500 14px var(--ui)', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{cp.barcode}</div>
                  <div style={{ font: '400 12.5px var(--ui)', color: 'var(--muted)', marginTop: 2 }}>
                    {cp.format === 'SOFTCOPY' ? 'Digital copy' : `Shelf ${cp.location}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </AppChrome>
  );
}
