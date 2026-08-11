import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppChrome from '../components/AppChrome';
import { apiFetch } from '../lib/api';

export default function CoursePicker() {
  const { collegeId, departmentId } = useParams();
  const navigate = useNavigate();
  const [departmentName, setDepartmentName] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch(`/api/colleges/${collegeId}/departments`),
      apiFetch(`/api/departments/${departmentId}/courses`),
    ]).then(([depts, crs]) => {
      setDepartmentName(depts.find(d => d.department_id === departmentId)?.name ?? '');
      setCourses(crs);
    }).finally(() => setLoading(false));
  }, [collegeId, departmentId]);

  return (
    <AppChrome>
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 24px 90px', animation: 'fadeUp .35s ease' }}>
        <button onClick={() => navigate(`/catalog/college/${collegeId}`)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--muted)', font: '500 13.5px var(--ui)', cursor: 'pointer', padding: 0, marginBottom: 20 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Departments
        </button>

        <h1 style={{ font: '600 34px var(--serif)', letterSpacing: '-.01em', lineHeight: 1.15, margin: '0 0 5px' }}>{departmentName || 'Courses'}</h1>
        <p style={{ font: '400 15px var(--ui)', color: 'var(--muted)', margin: '0 0 26px' }}>Choose a course of study.</p>

        {loading && <div style={{ color: 'var(--muted)' }}>Loading…</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
          {courses.map(c => (
            <button key={c.course_id} onClick={() => navigate(`/catalog/college/${collegeId}/department/${departmentId}/course/${c.course_id}`)}
              style={{ textAlign: 'left', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, cursor: 'pointer', transition: 'border-color .15s, transform .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ font: '600 16px/1.3 var(--serif)', color: 'var(--text)' }}>{c.name}</div>
            </button>
          ))}
        </div>
      </main>
    </AppChrome>
  );
}
