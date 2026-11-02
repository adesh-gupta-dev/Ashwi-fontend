import React, { createContext, useEffect, useContext, useMemo, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import api from '@/services/api';
import { registerAuthHandlers } from '@/services/api';
import { consoleTerminal } from '@/utils/consoleTerminal';
import {
  clearStoredSession,
  hydrateStoredToken,
  hydrateStoredUser,
  persistStoredToken,
  persistStoredUser,
  migrateLegacyWebSession,
} from '@/services/storage';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isVerified?: boolean;
};

type AuthContextValue = {
  user: User | null;
  isHydrated: boolean;
  login: (nextUser: User, token: string) => void;
  logout: () => void;
  updateUser: (nextUser: User) => void;
  token: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    migrateLegacyWebSession().then(() => Promise.all([hydrateStoredUser(), hydrateStoredToken()]))
      .then(([storedUser, storedToken]) => {
        if (cancelled) return;
        if (storedUser && storedToken) {
          setUser(storedUser);
          setToken(storedToken);
        }
      })
      .catch((error) => {
        consoleTerminal('auth.hydrate', error);
      })
      .finally(() => {
        if (!cancelled) setIsHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    registerAuthHandlers({
      onUnauthorized: () => {
        setUser(null);
        setToken(null);
        void clearStoredSession().catch((error) => consoleTerminal('auth.clear-session', error));
      },
    });
  }, []);

  useEffect(() => {
    if (!isHydrated || !token) {
      return;
    }

    let cancelled = false;

    const refreshSession = async () => {
      try {
        const response = await api.get('/auth/me');
        if (cancelled || !response.ok) {
          return;
        }

        const nextUser = response.data?.user;
        if (nextUser) {
          setUser(nextUser);
          void persistStoredUser(nextUser).catch((error) => consoleTerminal('auth.persist-user', error));
        }
      } catch (error) {
        consoleTerminal('auth.refresh', error);
      }
    };

    void refreshSession();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void refreshSession();
      }
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [isHydrated, token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isHydrated,
      token,
      login: (nextUser: User, nextToken: string) => {
        setUser(nextUser);
        setToken(nextToken);
        void Promise.all([
          persistStoredUser(nextUser),
          persistStoredToken(nextToken),
        ]).catch((error) => consoleTerminal('auth.persist-session', error));
      },
      logout: () => {
        setUser(null);
        setToken(null);
        void clearStoredSession().catch((error) => consoleTerminal('auth.clear-session', error));
      },
      updateUser: (nextUser: User) => {
        setUser(nextUser);
        void persistStoredUser(nextUser).catch((error) => consoleTerminal('auth.persist-user', error));
      },
    }),
    [isHydrated, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    consoleTerminal('auth.provider-missing');
    return {
      user: null, token: null, isHydrated: true,
      login: () => consoleTerminal('auth.login-unavailable'),
      logout: () => consoleTerminal('auth.logout-unavailable'),
      updateUser: () => consoleTerminal('auth.update-unavailable'),
    } satisfies AuthContextValue;
  }

  return context;
}
