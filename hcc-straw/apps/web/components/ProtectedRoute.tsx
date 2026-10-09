"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  roles?: string[];
}

export function ProtectedRoute({ children, requireAuth = true, roles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !isAuthenticated) {
      // Store the intended destination
      localStorage.setItem('redirectAfterLogin', pathname);
      router.push('/login');
      return;
    }

    if (roles && roles.length > 0) {
      const user = (useAuth as any).user;
      if (!roles.includes(user?.role || '')) {
        router.push('/dashboard'); // Or unauthorized page
      }
    }
  }, [isAuthenticated, isLoading, router, pathname, requireAuth, roles]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
