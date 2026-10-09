"use client";

import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

interface UseProtectedRouteOptions {
  redirectTo?: string;
}

export function useProtectedRoute(options: UseProtectedRouteOptions = {}) {
  const { redirectTo = '/login' } = options;
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(redirectTo);
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return !isLoading && isAuthenticated;
}
