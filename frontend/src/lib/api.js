const TOKEN_KEY = 'library_jwt';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

const SERVICE_BASES = {
  '/api/auth':   import.meta.env.VITE_USER_SERVICE_URL  || '',
  '/api/users':  import.meta.env.VITE_USER_SERVICE_URL  || '',
  '/api/books':  import.meta.env.VITE_BOOK_SERVICE_URL  || '',
  '/api/copies': import.meta.env.VITE_BOOK_SERVICE_URL  || '',
  '/api/loans':  import.meta.env.VITE_LOAN_SERVICE_URL  || '',
};

function resolveUrl(path) {
  const prefix = Object.keys(SERVICE_BASES).find(p => path.startsWith(p));
  return prefix ? `${SERVICE_BASES[prefix]}${path}` : path;
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(resolveUrl(path), { ...options, headers });

  if (res.status === 401 && !path.startsWith('/api/auth')) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('library_user');
    window.location.href = '/login';
    throw { status: 401, body: null };
  }

  let body = null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    body = await res.json();
  }

  if (!res.ok) {
    throw { status: res.status, body };
  }

  return body;
}
