"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  roles?: UserRole[];
}

function sameOriginCallback(pathname: string): string {
  if (!pathname.startsWith('/') || pathname.startsWith('//') || pathname.includes('\\') || pathname.includes('://')) {
    return '/dashboard';
  }
  return pathname;
}

/**
 * Client-side presentation guard. Server cookie rejection remains the API
 * authority; login reads the same `callbackUrl` query that middleware sets.
 */
export function ProtectedRoute({ children, requireAuth = true, roles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const roleAllowlist = roles ?? [];
  const roleOk =
    roleAllowlist.length === 0 ||
    (user !== null && roleAllowlist.includes(user.role));
  const canAccess =
    (!requireAuth || isAuthenticated) && roleOk;

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !isAuthenticated) {
      const destination = sameOriginCallback(pathname);
      router.replace(`/login?callbackUrl=${encodeURIComponent(destination)}`);
      return;
    }

    if (isAuthenticated && !roleOk) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router, pathname, requireAuth, roleOk]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-label="Loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!canAccess) {
    return null;
  }

  return <>{children}</>;
}
