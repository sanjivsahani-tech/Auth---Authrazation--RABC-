import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, configureApi } from '../api/client';

const AuthContext = createContext(null);
const TOKEN_KEY = 'admin_access_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistAuth = useCallback((data) => {
    const accessToken = data?.accessToken;
    if (!accessToken) return;
    localStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);
    if (data.user) setUser(data.user);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password });
      persistAuth(data.data);
    },
    [persistAuth],
  );

  const getSignupStatus = useCallback(async () => {
    const { data } = await api.get('/auth/admin-signup-status');
    return Boolean(data?.data?.canSignup);
  }, []);

  const signupAdmin = useCallback(
    async (payload) => {
      const { data } = await api.post('/auth/admin-signup', payload);
      persistAuth(data.data);
    },
    [persistAuth],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout request failures.
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
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
          await logout();
          return false;
        }
      },
    });
  }, [token, logout]);

  useEffect(() => {
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

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token),
      login,
      logout,
      getSignupStatus,
      signupAdmin,
    }),
    [token, user, loading, login, logout, getSignupStatus, signupAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}