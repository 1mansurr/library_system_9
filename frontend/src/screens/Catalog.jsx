import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppChrome from '../components/AppChrome';
import { apiFetch } from '../lib/api';

export default function Catalog() {
  const { collegeId, departmentId, courseId } = useParams();
  const navigate = useNavigate();
  const [courseName, setCourseName]   = useState('');
  const [books, setBooks]             = useState([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [availableOnly, setAvail]     = useState(false);

  useEffect(() => {
    apiFetch(`/api/departments/${departmentId}/courses`)
      .then(courses => setCourseName(courses.find(c => c.course_id === courseId)?.name ?? ''));
  }, [departmentId, courseId]);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: 0, size: 50, course_id: courseId });
      if (search)        params.set('title', search);
      if (availableOnly) params.set('available_only', 'true');
      const data = await apiFetch(`/api/books?${params}`);
      setBooks(data.content ?? []);
      setTotal(data.total ?? data.content?.length ?? 0);
    } finally {
      setLoading(false);
    }
  }, [search, availableOnly, courseId]);

  useEffect(() => {
    const id = setTimeout(fetchBooks, search ? 300 : 0);
    return () => clearTimeout(id);
  }, [fetchBooks, search]);

  function availCount(book) { return book.available_copies ?? 0; }
  function totalCount(book) { return book.total_copies ?? 0; }

  return (
    <AppChrome>
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 24px 90px', animation: 'fadeUp .35s ease' }}>
        <button onClick={() => navigate(`/catalog/college/${collegeId}/department/${departmentId}`)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--muted)', font: '500 13.5px var(--ui)', cursor: 'pointer', padding: 0, marginBottom: 20 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Courses
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 26 }}>
          <div>
            <h1 style={{ font: '600 38px var(--serif)', letterSpacing: '-.01em', lineHeight: 1.13, margin: '0 0 5px' }}>{courseName || 'Catalogue'}</h1>
            <p style={{ font: '400 15px var(--ui)', color: 'var(--muted)', margin: 0 }}>
              {loading ? 'Loading…' : `${books.length} of ${total} titles`}
            </p>
          </div>
          <div style={{ position: 'relative', width: 'min(340px, 100%)' }}>
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--faint)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by title or author"
              style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px 11px 38px', border: '1px solid var(--border-strong)', borderRadius: 10, font: '400 14px var(--ui)', background: '#fff', color: 'var(--text)', outline: 'none' }}
              onFocus={e => { e.target.style.borderColor = 'var(--primary)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
          <button onClick={() => setAvail(v => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: availableOnly ? 'var(--primary-soft)' : '#fff', color: availableOnly ? 'var(--primary)' : 'var(--muted)', border: `1px solid ${availableOnly ? 'var(--primary)' : 'var(--border-strong)'}`, borderRadius: 20, padding: '7px 14px', font: `${availableOnly ? 600 : 500} 13px var(--ui)`, cursor: 'pointer' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: availableOnly ? 'var(--primary)' : 'var(--faint)', flexShrink: 0 }} />
            Available only
          </button>
        </div>

        {!loading && books.length === 0 && (
          <div style={{ textAlign: 'center', padding: '70px 20px', color: 'var(--muted)', font: '400 16px var(--serif)' }}>No books match those filters.</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
          {books.map(book => {
            const avail = availCount(book);
            const tot   = totalCount(book);
            const hasCopies = tot > 0;
            return (
              <button key={book.book_id} onClick={() => navigate(`/books/${book.book_id}`)}
                style={{ textAlign: 'left', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 0, transition: 'border-color .15s, transform .15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ font: '600 19px/1.25 var(--serif)', color: 'var(--text)', marginBottom: 5, minHeight: 46 }}>{book.title}</div>
                <div style={{ font: '400 15px var(--serif)', color: 'var(--muted)', marginBottom: 18 }}>{book.author}</div>
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 20, font: '600 12px var(--ui)', background: hasCopies && avail > 0 ? 'var(--ok-bg)' : 'var(--bad-bg)', color: hasCopies && avail > 0 ? 'var(--ok-fg)' : 'var(--bad-fg)' }}>
                    {hasCopies ? `${avail} / ${tot} available` : 'No copies'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </AppChrome>
  );
}
