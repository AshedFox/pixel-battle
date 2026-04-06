import { login, logout, refresh, register } from '@/services/auth.service';
import { parseJwtPayload } from '@/lib/jwt';
import { RequestResult } from '@/types/request';
import { LoginInput, LoginResponse, RegisterInput } from '@repo/shared';
import {
  createContext,
  ReactNode,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { configureApiClient } from '@/lib/api-client';

type UserRole = 'USER' | 'ADMIN';

type AuthData = {
  accessToken: string;
  expiresAt: Date;
  role: UserRole;
} | null;

type AuthContextType = {
  isAuthenticated: boolean;
  authData: AuthData;
  role: UserRole | null;
  login: (input: LoginInput) => Promise<RequestResult<LoginResponse>>;
  register: (input: RegisterInput) => Promise<RequestResult<undefined>>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_HINT_NAME = import.meta.env.VITE_AUTH_HINT_COOKIE_NAME || 'is_auth';

const cookies = document.cookie.split('; ');
const hasAuthCookie = !!cookies.find((c) => c.startsWith(`${AUTH_HINT_NAME}=`));

const initialAuthPromise = (async function () {
  if (!hasAuthCookie) {
    return null;
  }
  const result = await refresh();

  return result.data ?? null;
})();

const authChannel = new BroadcastChannel('auth');

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const initialAuthState = use(initialAuthPromise);

  const [authData, setAuthData] = useState<AuthData>(() => {
    if (!initialAuthState) {
      return null;
    }

    const payload = parseJwtPayload(initialAuthState.accessToken);

    if (!payload) {
      return null;
    }

    return {
      accessToken: initialAuthState.accessToken,
      expiresAt: new Date(initialAuthState.expiresAt),
      role: payload.role as UserRole,
    };
  });
  const authDataRef = useRef(authData);

  useEffect(() => {
    authDataRef.current = authData;
  }, [authData]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      switch (e.data.type) {
        case 'TOKEN_REFRESHED': {
          const payload = parseJwtPayload(e.data.accessToken);
          if (payload) {
            setAuthData({
              accessToken: e.data.accessToken,
              expiresAt: new Date(e.data.expiresAt),
              role: payload.role as UserRole,
            });
          }
          break;
        }
        case 'LOGOUT':
          setAuthData(null);
          break;
      }
    };

    authChannel.addEventListener('message', handler);
    return () => authChannel.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    if (initialAuthState) {
      authChannel.postMessage({
        type: 'TOKEN_REFRESHED',
        ...initialAuthState,
      });
    }
  }, [initialAuthState]);

  const handleRefresh = useCallback(async () => {
    const { data, error } = await refresh();

    if (error) {
      setAuthData(null);
      authChannel.postMessage({ type: 'LOGOUT' });
      return { error };
    }

    const payload = parseJwtPayload(data.accessToken);

    if (!payload) {
      setAuthData(null);
      authChannel.postMessage({ type: 'LOGOUT' });
      return { error: new Error('Invalid token payload') };
    }

    setAuthData({
      accessToken: data.accessToken,
      expiresAt: new Date(data.expiresAt),
      role: payload.role as UserRole,
    });

    authChannel.postMessage({
      type: 'TOKEN_REFRESHED',
      ...data,
    });

    return { data };
  }, []);

  useEffect(() => {
    configureApiClient({
      accessToken: authData?.accessToken ?? null,
      onRefresh: handleRefresh,
    });
  }, [authData?.accessToken, handleRefresh]);

  useEffect(() => {
    if (!authData) {
      return;
    }

    const msUntilExp = authData.expiresAt.getTime() - Date.now();
    const msUntilRefresh = msUntilExp - 60000;

    if (msUntilRefresh <= 0) {
      handleRefresh();
      return;
    }

    const timerId = setTimeout(() => {
      handleRefresh();
    }, msUntilRefresh);

    return () => clearTimeout(timerId);
  }, [authData, handleRefresh]);

  const handleLogin = async (input: LoginInput) => {
    const { data, error } = await login(input);

    if (error) {
      setAuthData(null);
      return { error };
    }

    const payload = parseJwtPayload(data.accessToken);
    if (!payload) {
      return { error: new Error('Invalid token payload') };
    }

    setAuthData({
      accessToken: data.accessToken,
      expiresAt: new Date(data.expiresAt),
      role: payload.role as UserRole,
    });

    authChannel.postMessage({
      type: 'TOKEN_REFRESHED',
      ...data,
    });

    return { data };
  };

  const handleRegister = async (input: RegisterInput) => {
    const { data, error } = await register(input);

    if (error) {
      setAuthData(null);
      return { error };
    }

    return { data };
  };

  const handleLogout = async () => {
    await logout();
    setAuthData(null);
    authChannel.postMessage({ type: 'LOGOUT' });
  };

  return (
    <AuthContext
      value={{
        isAuthenticated: !!authData,
        authData,
        role: authData?.role ?? null,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext>
  );
};

export const useAuth = () => {
  const ctx = use(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
