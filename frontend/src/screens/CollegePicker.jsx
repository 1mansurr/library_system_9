import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppChrome from '../components/AppChrome';
import { apiFetch } from '../lib/api';

export default function CollegePicker() {
  const navigate = useNavigate();
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    apiFetch('/api/colleges').then(setColleges).finally(() => setLoading(false));
  }, []);

  return (
    <AppChrome>
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 24px 90px', animation: 'fadeUp .35s ease' }}>
        <h1 style={{ font: '600 38px var(--serif)', letterSpacing: '-.01em', lineHeight: 1.13, margin: '0 0 5px' }}>Catalogue</h1>
        <p style={{ font: '400 15px var(--ui)', color: 'var(--muted)', margin: '0 0 26px' }}>
          Choose your college to browse books by course of study.
        </p>

        {loading && <div style={{ color: 'var(--muted)' }}>Loading…</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
          {colleges.map(c => (
            <button key={c.college_id} onClick={() => navigate(`/catalog/college/${c.college_id}`)}
              style={{ textAlign: 'left', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, cursor: 'pointer', transition: 'border-color .15s, transform .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ font: '600 17px/1.3 var(--serif)', color: 'var(--text)' }}>{c.name}</div>
            </button>
          ))}
        </div>
      </main>
    </AppChrome>
  );
}
