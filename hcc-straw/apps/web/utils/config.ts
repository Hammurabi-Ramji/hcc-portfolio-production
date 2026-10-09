export const SITE_NAME = 'AUTARCH Web Platform';
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const APP_CONFIG = {
  name: SITE_NAME,
  version: '1.0.0',
  description: 'Full-stack web application platform',
};

export const AUTH_CONFIG = {
  tokenExpiration: 24 * 60 * 60 * 1000, // 24 hours
  refreshTokenExpiration: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const PAGINATION_CONFIG = {
  defaultLimit: 10,
  maxLimit: 100,
  minLimit: 1,
};

export const FILE_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
  ],
};

export const APP_ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  docs: '/docs',
  features: '/features',
  about: '/about',
  settings: '/settings',
  profile: '/profile',
  projects: '/projects',
};

export const PERMISSIONS = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
};

export const USER_ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
} as const;

export const PROJECT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
  DRAFT: 'draft',
} as const;
