import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import AppChrome from '../components/AppChrome';
import { apiFetch } from '../lib/api';

const COL_ALIASES = {
  isbn:     ['isbn'],
  title:    ['title', 'book title', 'book_title'],
  author:   ['author', 'authors', 'author name', 'author_name'],
  category: ['category', 'genre', 'subject', 'department'],
  copies:   ['copies', 'quantity', 'count', 'qty'],
};

function parseWorkbook(wb) {
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (!raw.length) return { rows: [], error: 'The spreadsheet is empty.' };

  const headers = Object.keys(raw[0]);
  const colMap = {};
  for (const [field, aliases] of Object.entries(COL_ALIASES)) {
    colMap[field] = headers.find(h => aliases.includes(h.toLowerCase().trim()));
  }

  const missing = ['isbn', 'title', 'author'].filter(c => !colMap[c]);
  if (missing.length) return { rows: [], error: `Missing required columns: ${missing.join(', ')}.` };

  return {
    rows: raw
      .map((row, i) => ({
        _row: i + 2,
        isbn:     String(row[colMap.isbn]   || '').trim(),
        title:    String(row[colMap.title]  || '').trim(),
        author:   String(row[colMap.author] || '').trim(),
        category: colMap.category ? String(row[colMap.category] || '').trim() : '',
        copies:   Math.max(1, parseInt(colMap.copies ? row[colMap.copies] : 1) || 1),
      }))
      .filter(r => r.isbn && r.title && r.author),
    error: null,
  };
}

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet([
    { isbn: '978-0134685991', title: 'Effective Java', author: 'Joshua Bloch', category: 'Computer Science', copies: 3 },
    { isbn: '978-0132350884', title: 'Clean Code', author: 'Robert C. Martin', category: 'Computer Science', copies: 2 },
    { isbn: '978-0201633610', title: 'Design Patterns', author: 'Gang of Four', category: 'Computer Science', copies: 1 },
  ]);
  XLSX.utils.book_append_sheet(wb, ws, 'Books');
  XLSX.writeFile(wb, 'book_catalogue_template.xlsx');
}

export default function ImportBooks() {
  const navigate = useNavigate();
  const fileRef  = useRef();

  const [phase,    setPhase]    = useState('idle');
  const [rows,     setRows]     = useState([]);
  const [parseErr, setParseErr] = useState('');
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results,  setResults]  = useState([]);

  function processFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const { rows: parsed, error } = parseWorkbook(wb);
        if (error) { setParseErr(error); return; }
        if (!parsed.length) {
          setParseErr('No valid rows found. Make sure isbn, title, and author columns are filled.');
          return;
        }
        setParseErr('');
        setRows(parsed);
        setPhase('preview');
      } catch {
        setParseErr('Could not read the file. Make sure it is a valid .xlsx or .xls file.');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  }

  function reset() {
    setPhase('idle');
    setRows([]);
    setParseErr('');
    setResults([]);
    setProgress(0);
  }

  async function runImport() {
    setPhase('importing');
    setProgress(0);
    const out = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const book = await apiFetch('/api/books', {
          method: 'POST',
          body: JSON.stringify({
            isbn:     row.isbn,
            title:    row.title,
            author:   row.author,
            category: row.category || undefined,
          }),
        });
        await Promise.all(
          Array.from({ length: row.copies }, (_, c) =>
            apiFetch(`/api/books/${book.book_id}/copies`, {
              method: 'POST',
              body: JSON.stringify({ barcode: `${row.isbn}-${String(c + 1).padStart(3, '0')}` }),
            }).catch(() => null)
          )
        );
        out.push({ ...row, ok: true });
      } catch (err) {
        out.push({ ...row, ok: false, error: err?.body?.message || err?.body?.error || 'Failed' });
      }
      setProgress(i + 1);
    }
    setResults(out);
    setPhase('done');
  }

  const succeeded = results.filter(r => r.ok).length;
  const failed    = results.filter(r => !r.ok).length;

  const th = { padding: '10px 14px', font: '600 12px var(--ui)', color: 'var(--muted)', textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', whiteSpace: 'nowrap' };
  const td = { padding: '11px 14px', font: '400 13.5px var(--ui)', color: 'var(--text)', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' };

  return (
    <AppChrome>
      <main style={{ maxWidth: 940, margin: '0 auto', padding: '40px 24px 90px', animation: 'fadeUp .35s ease' }}>

        <button onClick={() => navigate('/dashboard')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--muted)', font: '500 13.5px var(--ui)', cursor: 'pointer', padding: 0, marginBottom: 24 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Dashboard
        </button>

        <h1 style={{ font: '600 28px var(--serif)', letterSpacing: '-.005em', margin: '0 0 6px' }}>Import catalogue</h1>
        <p style={{ font: '400 15px var(--ui)', color: 'var(--muted)', margin: '0 0 28px' }}>Upload a spreadsheet to add multiple books at once.</p>

        {/* ── IDLE ── */}
        {phase === 'idle' && (
          <>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current.click()}
              style={{
                border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border-strong)'}`,
                borderRadius: 16, padding: '52px 24px', textAlign: 'center',
                background: dragging ? 'var(--primary-soft)' : 'var(--surface)',
                cursor: 'pointer', transition: 'all .15s',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 14 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <div style={{ font: '600 15px var(--ui)', color: 'var(--text)', marginBottom: 6 }}>
                Drop your spreadsheet here, or click to browse
              </div>
              <div style={{ font: '400 13px var(--ui)', color: 'var(--muted)' }}>
                Supports .xlsx and .xls files
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
                onChange={e => processFile(e.target.files[0])} />
            </div>

            {parseErr && (
              <div style={{ marginTop: 14, background: 'var(--bad-bg)', color: 'var(--bad-fg)', font: '500 13px var(--ui)', padding: '10px 14px', borderRadius: 10 }}>
                {parseErr}
              </div>
            )}

            <div style={{ marginTop: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <div style={{ font: '600 13px var(--ui)', color: 'var(--text)', marginBottom: 10 }}>Required columns</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {['isbn', 'title', 'author'].map(c => (
                  <span key={c} style={{ font: '600 12px var(--ui)', background: 'var(--primary)', color: '#fff', padding: '3px 10px', borderRadius: 6 }}>{c}</span>
                ))}
                {['category', 'copies'].map(c => (
                  <span key={c} style={{ font: '600 12px var(--ui)', background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--border-strong)', padding: '3px 10px', borderRadius: 6 }}>{c} (optional)</span>
                ))}
              </div>
              <button onClick={downloadTemplate}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'none', border: '1px solid var(--border-strong)', borderRadius: 9, padding: '9px 16px', font: '600 13px var(--ui)', color: 'var(--text)', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download template
              </button>
            </div>
          </>
        )}

        {/* ── PREVIEW ── */}
        {phase === 'preview' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ font: '500 14px var(--ui)', color: 'var(--muted)' }}>
                <span style={{ font: '700 14px var(--ui)', color: 'var(--text)' }}>{rows.length}</span> books ready to import
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={reset}
                  style={{ background: 'none', border: '1px solid var(--border-strong)', borderRadius: 9, padding: '9px 16px', font: '600 13px var(--ui)', color: 'var(--muted)', cursor: 'pointer' }}>
                  Choose another file
                </button>
                <button onClick={runImport}
                  style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 20px', font: '600 13px var(--ui)', cursor: 'pointer' }}>
                  Import {rows.length} books →
                </button>
              </div>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', maxHeight: 480, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th style={th}>#</th>
                      <th style={th}>Title</th>
                      <th style={th}>Author</th>
                      <th style={th}>ISBN</th>
                      <th style={th}>Category</th>
                      <th style={{ ...th, textAlign: 'center' }}>Copies</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : 'var(--surface)' }}>
                        <td style={{ ...td, color: 'var(--faint)', fontVariantNumeric: 'tabular-nums' }}>{row._row}</td>
                        <td style={{ ...td, fontWeight: 500, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.title}</td>
                        <td style={{ ...td, color: 'var(--muted)' }}>{row.author}</td>
                        <td style={{ ...td, fontVariantNumeric: 'tabular-nums', color: 'var(--muted)' }}>{row.isbn}</td>
                        <td style={{ ...td, color: 'var(--muted)' }}>{row.category || '—'}</td>
                        <td style={{ ...td, textAlign: 'center' }}>{row.copies}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── IMPORTING ── */}
        {phase === 'importing' && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ font: '600 20px var(--serif)', color: 'var(--text)', marginBottom: 8 }}>
              Importing…
            </div>
            <div style={{ font: '400 14px var(--ui)', color: 'var(--muted)', marginBottom: 28 }}>
              {progress} of {rows.length} books processed
            </div>
            <div style={{ background: 'var(--border)', borderRadius: 99, height: 6, overflow: 'hidden', maxWidth: 360, margin: '0 auto' }}>
              <div style={{ height: '100%', background: 'var(--primary)', borderRadius: 99, width: `${(progress / rows.length) * 100}%`, transition: 'width .2s' }} />
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {phase === 'done' && (
          <>
            <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
              <div style={{ flex: 1, background: 'var(--ok-bg)', border: '1px solid var(--ok-fg)', borderRadius: 14, padding: '18px 22px' }}>
                <div style={{ font: '700 28px var(--serif)', color: 'var(--ok-fg)' }}>{succeeded}</div>
                <div style={{ font: '500 13px var(--ui)', color: 'var(--ok-fg)', opacity: 0.8 }}>Books added</div>
              </div>
              {failed > 0 && (
                <div style={{ flex: 1, background: 'var(--bad-bg)', border: '1px solid var(--bad-fg)', borderRadius: 14, padding: '18px 22px' }}>
                  <div style={{ font: '700 28px var(--serif)', color: 'var(--bad-fg)' }}>{failed}</div>
                  <div style={{ font: '500 13px var(--ui)', color: 'var(--bad-fg)', opacity: 0.8 }}>Failed</div>
                </div>
              )}
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 22 }}>
              <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th style={th}>Status</th>
                      <th style={th}>Title</th>
                      <th style={th}>ISBN</th>
                      <th style={th}>Copies</th>
                      <th style={th}>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : 'var(--surface)' }}>
                        <td style={td}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '600 11.5px var(--ui)', padding: '3px 10px', borderRadius: 7, background: r.ok ? 'var(--ok-bg)' : 'var(--bad-bg)', color: r.ok ? 'var(--ok-fg)' : 'var(--bad-fg)' }}>
                            {r.ok ? 'Added' : 'Failed'}
                          </span>
                        </td>
                        <td style={{ ...td, fontWeight: 500 }}>{r.title}</td>
                        <td style={{ ...td, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>{r.isbn}</td>
                        <td style={{ ...td, textAlign: 'center' }}>{r.ok ? r.copies : '—'}</td>
                        <td style={{ ...td, color: 'var(--bad-fg)', font: '400 12.5px var(--ui)' }}>{r.error || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => navigate('/dashboard')}
                style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 22px', font: '600 14px var(--ui)', cursor: 'pointer' }}>
                Go to dashboard
              </button>
              <button onClick={reset}
                style={{ background: 'none', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '11px 22px', font: '600 14px var(--ui)', color: 'var(--text)', cursor: 'pointer' }}>
                Import another file
              </button>
            </div>
          </>
        )}
      </main>
    </AppChrome>
  );
}
