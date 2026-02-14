import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, configureApi } from '../api/client';

const AuthContext = createContext(null);
// Why: Separate key avoids overwriting admin session in same browser profile.
const TOKEN_KEY = 'user_access_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Why: Centralized refresh handling keeps page components free from auth boilerplate.
    configureApi({
      tokenProvider: () => token,
      unauthorizedHandler: async () => {
        if (!token) return false;
        try {
          const { data } = await api.post('/auth/refresh');
          const nextToken = data?.data?.accessToken;
          if (!nextToken) return false;
          localStorage.setItem(TOKEN_KEY, nextToken);
          setToken(nextToken);
          return true;
        } catch {
          logout();
          return false;
        }
      },
    });
  }, [token]);

  useEffect(() => {
    // Why: Rehydrate logged-in user on reload so permission-based UI stays correct.
    async function init() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.data.user);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [token]);

  async function login(email, password) {
    // Behavior: Access token is persisted so refresh survives browser reload.
    const { data } = await api.post('/auth/login', { email, password });
    const accessToken = data.data.accessToken;
    localStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);
    setUser(data.data.user);
  }

  async function logout() {
    // Why: Clearing local token state immediately avoids using stale credentials.
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout request failures.
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ token, user, loading, isAuthenticated: Boolean(token), login, logout }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
