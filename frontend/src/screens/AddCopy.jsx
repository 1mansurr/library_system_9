import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppChrome from '../components/AppChrome';
import { useToast } from '../components/Toast';
import { apiFetch } from '../lib/api';

export default function AddCopy() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast    = useToast();

  const [book, setBook]     = useState(null);
  const [copies, setCopies] = useState([]);
  const [barcode, setBarcode]   = useState('');
  const [location, setLocation] = useState('');
  const [adding, setAdding]     = useState(false);

  useEffect(() => {
    apiFetch(`/api/books/${id}`).then(b => {
      setBook(b);
      setCopies(b.copies ?? []);
    }).catch(() => navigate('/dashboard', { replace: true }));
  }, [id]);

  async function handleAddCopy() {
    if (!barcode.trim()) { toast('Enter a barcode for the copy.'); return; }
    setAdding(true);
    try {
      const copy = await apiFetch(`/api/books/${id}/copies`, {
        method: 'POST',
        body: JSON.stringify({ barcode: barcode.trim(), location: location.trim() || undefined }),
      });
      toast('Copy added.', barcode.trim());
      setCopies(prev => [...prev, copy]);
      setBarcode('');
      setLocation('');
    } catch (err) {
      const msg = err?.body?.message || err?.body?.error || 'Failed to add copy.';
      toast(msg);
    } finally {
      setAdding(false);
    }
  }

  function handleDone() {
    navigate('/catalog');
    toast('Catalogue updated.');
  }

  const inputBase = { width: '100%', boxSizing: 'border-box', padding: '11px 13px', border: '1px solid var(--border-strong)', borderRadius: 10, font: '400 15px var(--ui)', background: '#fff', color: 'var(--text)', outline: 'none' };
  const focusOn  = e => { e.target.style.borderColor = 'var(--primary)'; };
  const focusOff = e => { e.target.style.borderColor = 'var(--border-strong)'; };

  return (
    <AppChrome>
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '40px 24px 90px', animation: 'fadeUp .35s ease' }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 6 }}>
          <span style={{ font: '600 12px var(--ui)', color: '#fff', background: 'var(--ok-fg)', width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          <span style={{ font: '500 12.5px var(--ui)', color: 'var(--faint)' }}>→</span>
          <span style={{ font: '600 12px var(--ui)', color: '#fff', background: 'var(--primary)', width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
          <span style={{ font: '500 13px var(--ui)', color: 'var(--muted)', marginLeft: 4 }}>Now add copies</span>
        </div>

        {book && (
          <>
            <h1 style={{ font: '600 28px var(--serif)', letterSpacing: '-.015em', margin: '10px 0 4px' }}>{book.title}</h1>
            <p style={{ font: '400 14px var(--ui)', color: 'var(--muted)', margin: '0 0 24px' }}>{book.author} · {book.category}</p>
          </>
        )}

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, display: 'grid', gap: 18, marginBottom: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', font: '500 13px var(--ui)', color: 'var(--muted)', marginBottom: 7 }}>Barcode</label>
              <input value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="KN-1042" style={{ ...inputBase, fontVariantNumeric: 'tabular-nums' }} onFocus={focusOn} onBlur={focusOff}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCopy(); } }} />
            </div>
            <div>
              <label style={{ display: 'block', font: '500 13px var(--ui)', color: 'var(--muted)', marginBottom: 7 }}>Shelf location</label>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="CSC 14-03" style={inputBase} onFocus={focusOn} onBlur={focusOff}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCopy(); } }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleAddCopy} disabled={adding}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#fff', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: 10, padding: 12, font: '600 14px var(--ui)', cursor: adding ? 'wait' : 'pointer', opacity: adding ? 0.7 : 1 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {adding ? 'Adding…' : 'Add copy'}
            </button>
            <button onClick={handleDone}
              style={{ flex: 1, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: 12, font: '600 14px var(--ui)', cursor: 'pointer' }}>
              Done
            </button>
          </div>
        </div>

        <h3 style={{ font: '600 18px var(--serif)', color: 'var(--text)', margin: '0 0 14px' }}>Copies added ({copies.length})</h3>
        {copies.length === 0 && (
          <div style={{ background: 'var(--surface-2)', border: '1px dashed var(--border-strong)', borderRadius: 12, padding: 26, textAlign: 'center', color: 'var(--muted)', font: '400 13.5px var(--ui)' }}>
            No copies yet — add at least one so the book can be borrowed.
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {copies.map(cp => (
            <div key={cp.copy_id} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 11, padding: '13px 18px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 7, font: '600 11px var(--ui)', background: 'var(--ok-bg)', color: 'var(--ok-fg)' }}>Available</span>
              <div style={{ font: '500 14px var(--ui)', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{cp.barcode}</div>
              <div style={{ marginLeft: 'auto', font: '400 12.5px var(--ui)', color: 'var(--muted)' }}>{cp.location ? `Shelf ${cp.location}` : ''}</div>
            </div>
          ))}
        </div>
      </main>
    </AppChrome>
  );
}
