import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { apiFetch } from './lib/api.js'

// temporary console helper for L2 acceptance test
window.testLogin = async (email, password) => {
  const TOKEN_KEY = 'library_jwt';
  const USER_KEY  = 'library_user';
  const data = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify({
    user_id: data.user_id, role: data.role,
    member_type: data.member_type, full_name: data.full_name,
  }));
  console.log('Login OK:', data);
  return data;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
