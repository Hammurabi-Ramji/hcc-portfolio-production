"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

interface UseProtectedRouteOptions {
  redirectTo?: string;
}

export function useProtectedRoute(options: UseProtectedRouteOptions = {}) {
  const { redirectTo = '/login' } = options;
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    } else {
      setIsAuthorized(true);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return isAuthorized;
}
