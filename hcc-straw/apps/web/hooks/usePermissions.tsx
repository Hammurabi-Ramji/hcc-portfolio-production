"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface UsePagePermissionReturn {
  can: (permission: string) => boolean;
  has: (permission: string) => boolean;
  is: (role: string) => boolean;
  roles: string[];
}

export function usePagePermission(): UsePagePermissionReturn {
  const { user, isAuthenticated } = useAuth();
  const [canModifyPage, setCanModifyPage] = useState(false);

  useEffect(() => {
    if (user) {
      setCanModifyPage(user.role === 'admin' || user.role === 'moderator');
    }
  }, [user]);

  const has = (permission: string): boolean => {
    if (!user) return false;
    const permissions: Record<string, string[]> = {
      'edit:profile': ['user', 'moderator', 'admin'],
      'delete:account': ['user', 'moderator', 'admin'],
      'view:admin': ['admin', 'moderator'],
      'manage:users': ['admin'],
      'manage:projects': ['user', 'admin', 'moderator'],
    };

    return permissions[permission]?.includes(user.role) ?? false;
  };

  const can = (permission: string): boolean => {
    return has(permission);
  };

  const is = (role: string): boolean => {
    return user?.role === role;
  };

  return {
    can,
    has,
    is,
    roles: user?.role ? [user.role] : [],
  };
}
