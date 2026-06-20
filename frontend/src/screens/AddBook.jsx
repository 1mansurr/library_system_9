import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppChrome from '../components/AppChrome';
import { useToast } from '../components/Toast';
import { apiFetch } from '../lib/api';

const CATEGORIES = ['Computer Science', 'Engineering', 'Sciences', 'Business', 'Humanities'];

export default function AddBook() {
  const navigate = useNavigate();
  const toast    = useToast();
  const [form, setForm] = useState({ isbn: '', title: '', author: '', category: 'Computer Science' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function set(key) { return e => setForm(f => ({ ...f, [key]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.isbn.trim() || !form.title.trim() || !form.author.trim()) {
      setError('ISBN, title and author are required.'); return;
    }
    setLoading(true);
    try {
      const book = await apiFetch('/api/books', {
        method: 'POST',
        body: JSON.stringify({ isbn: form.isbn.trim(), title: form.title.trim(), author: form.author.trim(), category: form.category }),
      });
      toast('Book saved.', 'Now add at least one copy.');
      navigate(`/dashboard/books/${book.book_id}/copies`);
    } catch (err) {
      const msg = err?.body?.message || err?.body?.error || 'Failed to save book.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const inputBase = { width: '100%', boxSizing: 'border-box', padding: '11px 13px', border: '1px solid var(--border-strong)', borderRadius: 10, font: '400 15px var(--ui)', background: '#fff', color: 'var(--text)', outline: 'none' };
  const focusOn  = e => { e.target.style.borderColor = 'var(--primary)'; };
  const focusOff = e => { e.target.style.borderColor = 'var(--border-strong)'; };
  const labelStyle = { display: 'block', font: '500 13px var(--ui)', color: 'var(--muted)', marginBottom: 7 };

  return (
    <AppChrome>
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '40px 24px 90px', animation: 'fadeUp .35s ease' }}>
        <button onClick={() => navigate('/dashboard')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--muted)', font: '500 13.5px var(--ui)', cursor: 'pointer', padding: 0, marginBottom: 24 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Dashboard
        </button>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 6 }}>
          <span style={{ font: '600 12px var(--ui)', color: '#fff', background: 'var(--primary)', width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
          <span style={{ font: '500 12.5px var(--ui)', color: 'var(--faint)' }}>→</span>
          <span style={{ font: '600 12px var(--ui)', color: 'var(--muted)', background: 'var(--surface-2)', border: '1px solid var(--border)', width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
          <span style={{ font: '500 13px var(--ui)', color: 'var(--muted)', marginLeft: 4 }}>Book details, then copies</span>
        </div>

        <h1 style={{ font: '600 28px var(--serif)', letterSpacing: '-.005em', margin: '10px 0 26px' }}>Add a new book</h1>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
            <div>
              <label style={labelStyle}>ISBN</label>
              <input value={form.isbn} onChange={set('isbn')} placeholder="978-…" style={{ ...inputBase, fontVariantNumeric: 'tabular-nums' }} onFocus={focusOn} onBlur={focusOff} />
            </div>
            <div>
              <label style={labelStyle}>Title</label>
              <input value={form.title} onChange={set('title')} placeholder="Book title" style={inputBase} onFocus={focusOn} onBlur={focusOff} />
            </div>
            <div>
              <label style={labelStyle}>Author</label>
              <input value={form.author} onChange={set('author')} placeholder="Author name" style={inputBase} onFocus={focusOn} onBlur={focusOff} />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={form.category} onChange={set('category')} style={{ ...inputBase, cursor: 'pointer' }} onFocus={focusOn} onBlur={focusOff}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {error && <div style={{ background: 'var(--bad-bg)', color: 'var(--bad-fg)', font: '500 13px var(--ui)', padding: '10px 13px', borderRadius: 9 }}>{error}</div>}
            <button type="submit" disabled={loading}
              style={{ width: '100%', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: 13, font: '600 15px var(--ui)', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Saving…' : 'Save & add copies →'}
            </button>
          </form>
        </div>
      </main>
    </AppChrome>
  );
}
