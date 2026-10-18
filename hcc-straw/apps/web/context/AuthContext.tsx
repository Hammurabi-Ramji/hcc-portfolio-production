"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { AuthService } from '@/services/auth.service';
import type { ApiFailure, ApiResponse, AuthResponse, AuthState, RegisterRequest, User } from '@/types';

const AuthContext = createContext<AuthState | undefined>(undefined);

function failure(code: string, message: string): ApiFailure {
  return { success: false, error: { code, message } };
}

/** Reject malformed wire data instead of accepting a token-shaped success. */
function isUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') return false;
  return 'id' in value && typeof value.id === 'string' && value.id.length > 0 &&
    'email' in value && typeof value.email === 'string' &&
    'role' in value && typeof value.role === 'string' && ['admin', 'user', 'moderator'].includes(value.role) &&
    'emailVerified' in value && typeof value.emailVerified === 'boolean' &&
    'isActive' in value && value.isActive === true &&
    'createdAt' in value && typeof value.createdAt === 'string' &&
    'updatedAt' in value && typeof value.updatedAt === 'string';
}

function authUser(response: ApiResponse<AuthResponse>): ApiResponse<User> {
  if (!response.success) return response;
  if (!response.data || !isUser(response.data.user)) {
    return failure('INVALID_RESPONSE', 'The local API returned an invalid user.');
  }
  return { success: true, data: response.data.user };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const confirmedUser = useRef<User | null>(null);
  const mounted = useRef(false);
  const readVersion = useRef(0);
  const intent = useRef(0);
  const pendingMutations = useRef(0);
  const mutationQueue = useRef<Promise<unknown>>(Promise.resolve());

  const refreshUser = useCallback(async () => {
    // A read during a cookie mutation could describe the previous session.
    if (!mounted.current || pendingMutations.current > 0) return;
    const version = ++readVersion.current;
    setIsLoading(true);
    try {
      const response = await AuthService.getCurrentUser();
      if (!mounted.current || version !== readVersion.current) return;
      if (response.success) {
        confirmedUser.current = isUser(response.data) ? response.data : null;
      } else if (response.error.status === 401 || response.error.status === 403) {
        confirmedUser.current = null;
      }
      // A transient transport failure does not prove server-side revocation.
      setUser(confirmedUser.current);
    } catch {
      // Unexpected transport errors must also settle loading without inventing logout.
      if (mounted.current && version === readVersion.current) setUser(confirmedUser.current);
    } finally {
      if (mounted.current && version === readVersion.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refreshUser();
    return () => {
      mounted.current = false;
      ++readVersion.current;
    };
  }, [refreshUser]);

  /** Serialize Set-Cookie responses and ignore superseded UI completions. */
  const mutate = useCallback((operation: () => Promise<ApiResponse<User | null>>): Promise<ApiResponse<User | null>> => {
    if (!mounted.current) return Promise.resolve(failure('AUTH_UNAVAILABLE', 'The authentication provider is unavailable.'));
    const operationIntent = ++intent.current;
    ++readVersion.current;
    ++pendingMutations.current;
    setIsLoading(true);
    const result = mutationQueue.current.then(async () => {
      if (!mounted.current) return failure('AUTH_UNAVAILABLE', 'The authentication provider is unavailable.');
      let response: ApiResponse<User | null>;
      try {
        response = await operation();
      } catch {
        response = failure('REQUEST_FAILED', 'The local API request could not be completed.');
      }
      if (response.success) confirmedUser.current = response.data;
      if (!mounted.current || operationIntent !== intent.current) {
        return failure('AUTH_OPERATION_SUPERSEDED', 'A newer authentication operation replaced this request.');
      }
      setUser(confirmedUser.current);
      return response;
    }).finally(() => {
      --pendingMutations.current;
      if (mounted.current && operationIntent === intent.current) setIsLoading(false);
    });
    mutationQueue.current = result;
    return result;
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe?: boolean): Promise<ApiResponse<User>> => {
    const response = await mutate(async () => authUser(await AuthService.login({ email, password, rememberMe })));
    return response.success && response.data ? { success: true, data: response.data } :
      response.success ? failure('INVALID_RESPONSE', 'The local API returned an invalid user.') : response;
  }, [mutate]);

  const register = useCallback(async (data: RegisterRequest): Promise<ApiResponse<User>> => {
    const response = await mutate(async () => authUser(await AuthService.register(data)));
    return response.success && response.data ? { success: true, data: response.data } :
      response.success ? failure('INVALID_RESPONSE', 'The local API returned an invalid user.') : response;
  }, [mutate]);

  const logout = useCallback(async () => {
    const response = await mutate(async () => {
      const revoked = await AuthService.logout();
      // A 401 proves this cookie has no valid session: already signed out.
      // Origin denials (403) and outages do not prove revocation.
      return revoked.success || revoked.error.status === 401 ? { success: true, data: null } : revoked;
    });
    if (!response.success) throw new Error(response.error.message);
  }, [mutate]);

  const updateUser = useCallback((updatedUser: Partial<User>) => {
    const current = confirmedUser.current;
    if (!mounted.current || !current || pendingMutations.current > 0 ||
        (updatedUser.id !== undefined && updatedUser.id !== current.id)) return;
    // A local profile edit cannot alter authenticated identity or authorization.
    const next = { ...current, ...updatedUser, id: current.id, role: current.role,
      isActive: current.isActive, emailVerified: current.emailVerified };
    confirmedUser.current = next;
    setUser(next);
  }, []);

  const value: AuthState = {
    user, isAuthenticated: user !== null, isLoading,
    login, register, logout, refreshUser, updateUser,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
