import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { registerAuthHandlers } from '../services/api';

const AuthContext = createContext();

const parseJwtPayload = (token) => {
  try {
    const base64Payload = token.split('.')[1];
    const normalized = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

const isExpired = (token) => {
  const payload = parseJwtPayload(token);
  if (!payload?.exp) {
    return false;
  }

  return Date.now() >= payload.exp * 1000;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await api.get('/auth/me', { skipAuthRedirect: true });
      if (res.data?.success && res.data?.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
      }
    } catch {
      // Ignore refresh errors; auth interceptor handles invalid tokens.
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser && !isExpired(token)) {
      setUser(JSON.parse(storedUser));
      refreshUser();
    } else if (token && isExpired(token)) {
      logout();
    }

    registerAuthHandlers({ onUnauthorized: logout });
    setIsLoading(false);
  }, [logout, refreshUser]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return undefined;

    const payload = parseJwtPayload(token);
    if (!payload?.exp) return undefined;

    const timeoutMs = payload.exp * 1000 - Date.now();
    if (timeoutMs <= 0) {
      logout();
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      logout();
      window.location.href = '/login';
    }, timeoutMs);

    return () => window.clearTimeout(timeoutId);
  }, [user, logout]);

  useEffect(() => {
    const handleFocus = () => {
      refreshUser();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [refreshUser]);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const updateUser = (nextUser) => {
    if (!nextUser) return;
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
