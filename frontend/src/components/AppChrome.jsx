import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function AppChrome({ children }) {
  const { user, logout, isLibrarian } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const activeKey = pathname.startsWith('/books/') ? '/catalog'
    : pathname.startsWith('/dashboard') ? pathname.split('/').slice(0, 2).join('/') || '/dashboard'
    : pathname;

  const navItems = isLibrarian
    ? [
        { to: '/dashboard',           label: 'Dashboard' },
        { to: '/catalog',             label: 'Catalogue' },
        { to: '/dashboard/overdue',   label: 'Overdue' },
        { to: '/dashboard/members',   label: 'Members' },
      ]
    : [
        { to: '/catalog', label: 'Catalogue' },
        { to: '/loans',   label: 'My Loans' },
        { to: '/profile', label: 'Profile' },
      ];

  const name    = user?.full_name || '';
  const initial = name[0]?.toUpperCase() || 'U';
  const roleLabel = isLibrarian ? 'Head Librarian' : (user?.member_type ? user.member_type.charAt(0) + user.member_type.slice(1).toLowerCase() + ' member' : 'Member');

  return (
    <>
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(245,242,234,.86)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', height: 62, display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: 'var(--primary)', color: '#fff', font: '700 15px var(--serif)' }}>K</span>
            <span style={{ font: '600 17px var(--serif)', color: 'var(--text)' }}>KNUST Library</span>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            {navItems.map(({ to, label }) => {
              const isActive = to === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(to);
              return (
                <Link key={to} to={to} style={{ background: isActive ? 'var(--primary-soft)' : 'transparent', color: isActive ? 'var(--primary)' : 'var(--muted)', border: 'none', borderRadius: 9, padding: '8px 14px', font: `${isActive ? 600 : 500} 14px var(--ui)`, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>
                  {label}
                </Link>
              );
            })}
          </nav>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
            <div style={{ textAlign: 'right', lineHeight: 1.25 }}>
              <div style={{ font: '600 13.5px var(--ui)', color: 'var(--text)' }}>{name}</div>
              <div style={{ font: '400 13px var(--ui)', color: 'var(--muted)' }}>{roleLabel}</div>
            </div>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-soft)', color: 'var(--primary)', font: '600 14px var(--ui)', flexShrink: 0 }}>{initial}</span>
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 9, background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--muted)', cursor: 'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
