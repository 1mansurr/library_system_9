import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import AppChrome from '../components/AppChrome';
import { apiFetch } from '../lib/api';

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateStr));
}
function money(n) { return `GH₵ ${Number(n ?? 0).toFixed(2)}`; }

async function resolveUsersAndCopies(loans) {
  const userIds = [...new Set(loans.map(l => l.user_id))];
  const copyIds = [...new Set(loans.map(l => l.copy_id))];
  const [resolvedUsers, resolvedCopies] = await Promise.all([
    Promise.all(userIds.map(async id => {
      try { return [id, await apiFetch(`/api/users/${id}`)]; } catch { return [id, null]; }
    })),
    Promise.all(copyIds.map(async id => {
      try { return [id, await apiFetch(`/api/copies/${id}`)]; } catch { return [id, null]; }
    })),
  ]);
  return {
    users: Object.fromEntries(resolvedUsers.filter(([, u]) => u).map(([id, u]) => [id, u])),
    copies: Object.fromEntries(resolvedCopies.filter(([, c]) => c).map(([id, c]) => [id, c])),
  };
}

function loanRow(l, users, copies) {
  const user = users[l.user_id];
  const copy = copies[l.copy_id];
  return {
    Member: user?.full_name ?? '',
    'Card number': user?.card_number ?? '',
    Book: copy?.title ?? '',
    Barcode: copy?.barcode ?? '',
    'Borrowed on': fmt(l.borrow_date),
    'Due date': fmt(l.due_date),
    'Returned on': l.return_date ? fmt(l.return_date) : '',
    Fine: Number(l.fine_amount ?? l.current_fine_estimate ?? 0),
    Status: l.status,
  };
}

const LOAN_COLUMNS = [
  { key: 'Member' },
  { key: 'Card number' },
  { key: 'Book' },
  { key: 'Barcode' },
  { key: 'Borrowed on' },
  { key: 'Due date' },
  { key: 'Returned on' },
  { key: 'Fine', render: v => Number(v) > 0 ? money(v) : '—' },
  { key: 'Status' },
];

async function loadLoanTab(endpoint) {
  const data = await apiFetch(endpoint);
  const { users, copies } = await resolveUsersAndCopies(data);
  return data.map(l => loanRow(l, users, copies));
}

const TABS = [
  { key: 'borrowed', label: 'Borrowed', columns: LOAN_COLUMNS, load: () => loadLoanTab('/api/loans?status=BORROWED') },
  { key: 'overdue', label: 'Overdue', columns: LOAN_COLUMNS, load: () => loadLoanTab('/api/loans/overdue') },
  { key: 'returned', label: 'Returned history', columns: LOAN_COLUMNS, load: () => loadLoanTab('/api/loans?status=RETURNED') },
  {
    key: 'fines',
    label: 'Fines',
    columns: [
      { key: 'Member' },
      { key: 'Book' },
      { key: 'Type' },
      { key: 'Fine', render: v => money(v) },
      { key: 'Status' },
    ],
    async load() {
      const data = await apiFetch('/api/loans');
      const finable = data.filter(l =>
        (l.status === 'RETURNED' && Number(l.fine_amount) > 0) ||
        (l.is_overdue && Number(l.current_fine_estimate) > 0)
      );
      const { users, copies } = await resolveUsersAndCopies(finable);
      return finable.map(l => {
        const user = users[l.user_id];
        const copy = copies[l.copy_id];
        const charged = l.status === 'RETURNED';
        return {
          Member: user?.full_name ?? '',
          Book: copy?.title ?? '',
          Type: charged ? 'Charged' : 'Accruing',
          Fine: Number(charged ? l.fine_amount : l.current_fine_estimate),
          Status: l.status,
        };
      });
    },
    summary(rows) {
      const charged = rows.filter(r => r.Type === 'Charged').reduce((s, r) => s + Number(r.Fine), 0);
      const accruing = rows.filter(r => r.Type === 'Accruing').reduce((s, r) => s + Number(r.Fine), 0);
      return `Charged: ${money(charged)} · Accruing: ${money(accruing)}`;
    },
  },
  {
    key: 'inventory',
    label: 'Inventory',
    columns: [
      { key: 'Title' },
      { key: 'Author' },
      { key: 'ISBN' },
      { key: 'Department' },
      { key: 'College' },
      { key: 'Total copies' },
      { key: 'Available' },
      { key: 'On loan' },
      { key: 'Utilization', render: v => `${v}%` },
    ],
    async load() {
      const { content } = await apiFetch('/api/books?size=1000');
      return content.map(b => {
        const onLoan = b.total_copies - b.available_copies;
        const utilization = b.total_copies > 0 ? Math.round((onLoan / b.total_copies) * 100) : 0;
        return {
          Title: b.title,
          Author: b.author,
          ISBN: b.isbn,
          Department: b.department_name ?? '—',
          College: b.college_name ?? '—',
          'Total copies': b.total_copies,
          Available: b.available_copies,
          'On loan': onLoan,
          Utilization: utilization,
        };
      });
    },
  },
  {
    key: 'popular',
    label: 'Most borrowed',
    columns: [
      { key: 'Rank' },
      { key: 'Title' },
      { key: 'Author' },
      { key: 'Times borrowed' },
    ],
    async load() {
      const counts = await apiFetch('/api/loans/stats/most-borrowed');
      const copyIds = [...new Set(counts.map(c => c.copy_id))];
      const resolved = await Promise.all(copyIds.map(async id => {
        try { return [id, await apiFetch(`/api/copies/${id}`)]; } catch { return [id, null]; }
      }));
      const copies = Object.fromEntries(resolved.filter(([, c]) => c).map(([id, c]) => [id, c]));

      const byBook = new Map();
      for (const { copy_id, borrow_count } of counts) {
        const copy = copies[copy_id];
        if (!copy) continue;
        const existing = byBook.get(copy.book_id);
        if (existing) existing.count += borrow_count;
        else byBook.set(copy.book_id, { title: copy.title, author: copy.author, count: borrow_count });
      }
      return [...byBook.values()]
        .sort((a, b) => b.count - a.count)
        .map((b, i) => ({ Rank: i + 1, Title: b.title, Author: b.author, 'Times borrowed': b.count }));
    },
  },
];

export default function Reports() {
  const [tabKey, setTabKey]   = useState('borrowed');
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);

  const activeTab = TABS.find(t => t.key === tabKey);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const tab = TABS.find(t => t.key === tabKey);
      setRows(await tab.load());
    } finally {
      setLoading(false);
    }
  }, [tabKey]);

  useEffect(() => { load(); }, [load]);

  function download() {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, activeTab.label.slice(0, 31));
    XLSX.writeFile(wb, `${activeTab.label.toLowerCase().replace(/\s+/g, '_')}_report.xlsx`);
  }

  const summaryText = activeTab.summary && !loading ? activeTab.summary(rows) : null;

  const tabBtn = (key, label) => {
    const on = tabKey === key;
    return (
      <button key={key} onClick={() => setTabKey(key)}
        style={{ background: on ? '#fff' : 'transparent', color: on ? 'var(--text)' : 'var(--muted)', border: 'none', borderRadius: 8, padding: '8px 18px', font: `${on ? 600 : 500} 13.5px var(--ui)`, cursor: 'pointer', boxShadow: on ? '0 1px 2px rgba(0,0,0,.06)' : 'none' }}>
        {label}
      </button>
    );
  };

  const th = { padding: '10px 14px', font: '600 12px var(--ui)', color: 'var(--muted)', textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', whiteSpace: 'nowrap' };
  const td = { padding: '11px 14px', font: '400 13.5px var(--ui)', color: 'var(--text)', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' };

  return (
    <AppChrome>
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 24px 90px', animation: 'fadeUp .35s ease' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 22 }}>
          <div>
            <h1 style={{ font: '600 38px var(--serif)', letterSpacing: '-.01em', lineHeight: 1.13, margin: '0 0 5px' }}>Reports</h1>
            <p style={{ font: '400 15px var(--ui)', color: 'var(--muted)', margin: 0 }}>
              {loading ? 'Loading…' : `${rows.length} record${rows.length !== 1 ? 's' : ''}`}
              {summaryText ? ` · ${summaryText}` : ''}
            </p>
          </div>
          <button onClick={download} disabled={loading || rows.length === 0}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', font: '600 14px var(--ui)', cursor: loading || rows.length === 0 ? 'not-allowed' : 'pointer', opacity: loading || rows.length === 0 ? 0.6 : 1 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download Excel
          </button>
        </div>

        <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 3, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: 4, marginBottom: 22 }}>
          {TABS.map(t => tabBtn(t.key, t.label))}
        </div>

        <div style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {activeTab.columns.map(c => <th key={c.key} style={th}>{c.key}</th>)}
                </tr>
              </thead>
              <tbody>
                {!loading && rows.length === 0 && (
                  <tr><td colSpan={activeTab.columns.length} style={{ ...td, textAlign: 'center', color: 'var(--muted)', padding: '36px 22px' }}>No records.</td></tr>
                )}
                {rows.map((r, i) => (
                  <tr key={i}>
                    {activeTab.columns.map(c => (
                      <td key={c.key} style={td}>{c.render ? c.render(r[c.key]) : (r[c.key] ?? '—')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </AppChrome>
  );
}
