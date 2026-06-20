import { createContext, useContext, useState, useCallback } from 'react';
import { apiFetch } from './api';

const TOKEN_KEY = 'library_jwt';
const USER_KEY  = 'library_user';

function loadStored() {
  try {
    const user = JSON.parse(localStorage.getItem(USER_KEY));
    const token = localStorage.getItem(TOKEN_KEY);
    if (user && token) return { user, token };
  } catch {}
  return { user: null, token: null };
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [{ user, token }, setAuth] = useState(loadStored);

  const login = useCallback(async (email, password) => {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const u = {
      user_id:     data.user_id,
      role:        data.role,
      member_type: data.member_type,
      full_name:   data.full_name,
    };
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setAuth({ user: u, token: data.token });
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAuth({ user: null, token: null });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAuthenticated: !!user,
      isLibrarian: user?.role === 'LIBRARIAN',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
