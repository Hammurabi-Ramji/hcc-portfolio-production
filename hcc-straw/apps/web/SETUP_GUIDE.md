# AUTARCH Web Platform - Complete Setup Guide

This guide describes the quarantined legacy Next.js tree in `apps/web`. It is outside the sovereign STRAW/Eduba path and is not the STRAW or Eduba build. Eduba (`straw-app/crates/eduba-ledger`, `straw-app/crates/eduba-server`) is the append-only SQLite archival ledger via sqlx, not a school. The sovereign desktop is Trunk, Tauri 2, and pure Rust, with Axum on `127.0.0.1`. From `straw-app/`, use `trunk build`, `cargo tauri build`, and `cargo test --workspace --offline --locked`. Node and npm steps below run only this legacy tree.

## 🎉 What You Have Now

You have the legacy Next.js application and the loopback Rust API it calls. Pages exist in source. Session pages, live login, and a production deployment are not certified by this guide. This tree does not build the desktop or Eduba.

### ✅ **6 Main Pages**
- Home / Landing page
- Login
- Signup  
- Dashboard
- Documentation
- Features

### ✅ **6 Additional Pages**
- About
- Settings
- Profile
- Projects

### ✅ **10+ Reusable Hooks**
- `useAuth` - Authentication state
- `useLocalStorage` - Local storage
- `useSessionStorage` - Session storage
- `useDebounce` - Debounce functionality
- `useWindowSize` - Window dimensions
- `useMediaQuery` - Media queries
- `useScrollPosition` - Scroll tracking
- `useClickOutside` - Click outside detection
- `useProtectedRoute` - Protected routes
- `usePagePermission` - Permission checking
- `useLoading` - Loading states

### ✅ **5 Service Classes**
- `AuthService` - User authentication
- `UserService` - User profile management
- `ProjectService` - Project CRUD operations
- `FileService` - File upload/download
- `NotificationService` - Toast notifications

### ✅ **20+ API Routes**
- `/api/auth/*` - Authentication endpoints
- `/api/users/*` - User management
- `/api/projects/*` - Project management
- `/api/files/*` - File operations
- `/api/health` - Health check

### ✅ **25+ Utility Functions**
- Validation helpers
- Formatting utilities
- Date/time functions
- String utilities
- Storage helpers

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd apps/web
npm install
```

This installs the packages declared in `package.json`, including:
- `next` 15.x
- `react` & `react-dom` 19.x
- `axios`
- `tailwindcss`
- `typescript`
- `zod`
- `react-hook-form`
- `@tanstack/react-query`
- `zustand`
- `lucide-react`
- And more...

### 2. Configure Environment
From `apps/web`, copy `.env.example` to `.env.local` when that file is absent:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRAW_API_PORT=3001
STRAW_WEB_ORIGIN=http://localhost:3000
NODE_ENV=development
```

Start the local API from `apps/api` with `cargo run --offline --locked`. PostgreSQL, Redis, and a JWT secret are not settings for this service.

### 3. Start Development Server
```bash
npm run dev
```

Visit http://localhost:3000 to see your app!

---

## 📁 Complete File Structure

```
apps/web/
├── app/                      # Next.js pages
│   ├── layout.tsx           # Root layout with metadata
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles
│   │
│   ├── about/
│   │   └── page.tsx         # About page
│   │
│   ├── api/                 # API routes
│   │   ├── health/          # Health check
│   │   │   └── route.ts
│   │   │
│   │   ├── auth/            # Auth endpoints
│   │   │   ├── login/       # POST /api/auth/login
│   │   │   ├── register/    # POST /api/auth/register
│   │   │   ├── logout/      # POST /api/auth/logout
│   │   │   └── me/          # GET /api/auth/me
│   │   │
│   │   ├── users/           # User endpoints
│   │   │   ├── route.ts     # GET/POST /api/users
│   │   │   ├── [userId]/    # GET /api/users/:id
│   │   │   ├── profile/     # GET/PUT /api/users/profile
│   │   │   └── search/      # GET /api/users/search
│   │   │
│   │   └── projects/        # Project endpoints
│   │       ├── route.ts     # GET/POST /api/projects
│   │       └── [projectId]/ # GET/PUT/DELETE /api/projects/:id
│   │
│   ├── dashboard/
│   │   └── page.tsx         # Dashboard
│   │
│   ├── docs/
│   │   └── page.tsx         # Documentation
│   │
│   ├── features/
│   │   └── page.tsx         # Features
│   │
│   ├── login/
│   │   └── page.tsx         # Login page
│   │
│   ├── profile/
│   │   └── page.tsx         # Profile page
│   │
│   ├── projects/
│   │   └── page.tsx         # Projects page
│   │
│   ├── settings/
│   │   └── page.tsx         # Settings page
│   │
│   └── signup/
│       └── page.tsx         # Signup page
│
├── components/              # React components
│   ├── Features.tsx         # Feature cards
│   ├── Footer.tsx           # Site footer
│   ├── Navbar.tsx           # Navigation
│   └── ProtectedRoute.tsx   # Route protection
│
├── context/                 # React Context
│   └── AuthContext.tsx      # Auth provider
│
├── hooks/                   # Custom hooks
│   ├── useDebounce.ts       # Debounce hook
│   ├── useLoading.ts        # Loading states
│   ├── useLocalStorage.ts   # Local storage
│   ├── useProtectedRoute.ts # Protected routes
│   ├── useSessionStorage.ts # Session storage
│   ├── useToast.tsx         # Toast notifications
│   ├── usePermissions.tsx   # Permission checking
│   └── useWindow.ts         # Window utilities
│
├── lib/                     # Core libraries
│   ├── api.ts              # Axios instance
│   ├── api-client.ts       # API client class
│   └── utils.ts            # Helper utilities
│
├── middleware/              # Next.js middleware
│   └── middleware.ts       # Request handling
│
├── services/                # API service classes
│   ├── auth.service.ts     # Authentication API
│   ├── file.service.ts     # File operations
│   ├── project.service.ts  # Projects API
│   └── user.service.ts     # Users API
│
├── types/                   # TypeScript types
│   └── index.ts            # All type definitions
│
├── utils/                   # Utility functions
│   ├── config.ts           # App configuration
│   ├── helpers.ts          # Helper functions
│   ├── index.ts            # Re-exports
│   ├── pagination.ts       # Pagination utilities
│   └── validation.ts       # Validation utilities
│
├── public/                  # Static assets
│
├── styles/                  # Additional styles
│
├── .env.example             # Environment template
├── .env.local              # Local environment
├── .eslintrc.js            # ESLint config
├── .gitignore              # Git ignore
├── .prettierrc             # Prettier config
├── next.config.js          # Next.js config
├── package.json            # Dependencies
├── postcss.config.js       # PostCSS config
├── tailwind.config.js      # Tailwind config
├── tsconfig.json           # TypeScript config
├── README.md               # Documentation
├── QUICK_START.md          # Quick start guide
├── FILE_STRUCTURE.md       # File structure
└── ARCHITECTURE.md         # Architecture overview
```

---

## 🎯 API Endpoints Reference

### Authentication
```
POST   /api/auth/login          - Login user
POST   /api/auth/register       - Register new user
POST   /api/auth/logout         - Logout user
GET    /api/auth/me             - Get current user
```

### Users
```
GET    /api/users               - List all users
POST   /api/users               - Create user
GET    /api/users/:userId       - Get user by ID
GET    /api/users/profile       - Get current user profile
PUT    /api/users/profile       - Update current user profile
GET    /api/users/search        - Search users
```

### Projects
```
GET    /api/projects            - List projects
POST   /api/projects            - Create project
GET    /api/projects/:projectId - Get project by ID
PUT    /api/projects/:projectId - Update project
DELETE /api/projects/:projectId - Delete project
```

### Health
```
GET    /api/health              - Health check endpoint
```

---

## 🔐 Authentication Flow

### 1. User Registration
```typescript
const result = await userApi.register({
  email: 'user@example.com',
  password: 'SecurePass123',
  username: 'johndoe',
  firstName: 'John',
  lastName: 'Doe',
});
```

### 2. User Login
```typescript
const result = await userApi.login({
  email: 'user@example.com',
  password: 'SecurePass123',
});

if (result.success) {
  const { accessToken, user } = result.data;
  // Token stored in localStorage and cookie
}
```

### 3. Protected Routes
```typescript
import { useAuth } from '@/context/AuthContext';

function ProtectedComponent() {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <div>Protected Content</div>;
}
```

---

## 📊 State Management

### Authentication Context
```typescript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();
  
  // Access user data
  console.log(user?.email);
  
  // Call login
  login('email@example.com', 'password');
  
  // Call logout
  logout();
}
```

---

## 🎨 UI Components

### Reusable Components
- **Navbar** - Responsive navigation
- **Footer** - Site footer with links
- **Features** - Feature card grid
- **ProtectedRoute** - Route protection wrapper

### Custom Hooks
```typescript
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';
```

---

## 🛠️ Development Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
npm run type-check # TypeScript check
```

These commands run in `apps/web` for the legacy tree only. They do not build Eduba or the desktop. `npm run format` is not a script in this package.

---

## 🎉 Next Steps

1. Start the legacy API from `apps/api` with `cargo run --offline --locked` on `127.0.0.1:3001`, then `npm run dev` in `apps/web`. That pair is not `trunk build` or `cargo tauri build`.
2. Exercise login only after the session pages and API routes are wired. Email recovery stays HTTP 501.
3. The legacy API database is its local SQLite file. That file is not the Eduba ledger. PostgreSQL and Redis are not part of this tree.
4. Production hosting is not configured in this tree.

---

This guide describes the quarantined legacy Next.js app and the loopback Rust API on `127.0.0.1:3001` with the `straw_session` cookie. It is not a production-deployment certificate and it is not the STRAW or Eduba build.
