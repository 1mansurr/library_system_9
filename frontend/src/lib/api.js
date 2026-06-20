const TOKEN_KEY = 'library_jwt';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers });

  if (res.status === 401) {
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
