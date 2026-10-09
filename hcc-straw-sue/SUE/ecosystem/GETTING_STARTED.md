# SUE Ecosystem - Getting Started Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Prerequisites
Ensure you have:
- Node.js 18+
- Docker & Docker Compose
- Git

```bash
# Verify installations
node --version    # v18+
docker --version  # 20+
docker-compose --version  # 2.0+
```

### Step 2: Clone & Setup
```bash
# Navigate to ecosystem
cd C:\SUE\ecosystem

# Install dependencies (installs all 7 projects)
pnpm install

# Setup environment
cp .env.example .env
```

### Step 3: Start Services
```bash
# Terminal 1: Start Docker services (PostgreSQL, Redis)
docker-compose up

# Terminal 2-5: Start development servers (in different terminals)
cd sue-cloud-backend && pnpm dev        # Backend API (port 8000)
cd sue-dashboard-web && pnpm dev         # Web Dashboard (port 3000)
cd sue-admin-portal && pnpm dev          # Admin Portal (port 3001)
cd sue-ai-chat && pnpm dev               # AI Chat (port 3002)
```

### Step 4: Access Applications

| App | URL | Purpose |
|-----|-----|---------|
| **Dashboard** | http://localhost:3000 | User-facing app |
| **Backend API** | http://localhost:8000 | REST/WebSocket API |
| **Admin** | http://localhost:3001 | System administration |
| **AI Chat** | http://localhost:3002 | AI interface |

---

## 📦 Components Overview

### 1. **Dashboard Web** (Next.js)
User-facing web application for notes, projects, and collaboration.

**Key Features:**
- Create/edit/organize notes
- Project management
- Collaboration tools
- Real-time sync
- User settings
- Dark mode

**Tech Stack:**
- Next.js 14
- React 18
- TypeScript
- TailwindCSS
- Socket.io (real-time)

**Getting Started:**
```bash
cd sue-dashboard-web
pnpm dev                    # Start dev server
pnpm build                  # Production build
pnpm lint                   # Check code quality
```

---

### 2. **Cloud Backend** (Express.js)
Production-grade API server for all client applications.

**Key Features:**
- RESTful API
- WebSocket real-time sync
- User authentication (JWT)
- OAuth integration
- Data persistence
- Audit logging

**Tech Stack:**
- Node.js 18
- Express
- TypeScript
- PostgreSQL
- Redis
- Socket.io

**Getting Started:**
```bash
cd sue-cloud-backend
pnpm dev                    # Start dev server
pnpm db:migrate             # Run migrations
pnpm db:seed                # Seed test data
pnpm test                   # Run tests
```

**API Documentation:**
```bash
# Health check
curl http://localhost:8000/health

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get notes
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/v1/notes
```

---

### 3. **CLI Tool** (Node.js)
Command-line interface for automation and batch operations.

**Key Features:**
- Batch import/export (JSON, CSV)
- Note/project CRUD
- Local database management
- Cloud synchronization
- Automation scripts
- Statistics & reporting

**Tech Stack:**
- Node.js 18
- Commander.js (CLI framework)
- TypeScript
- SQLite3 (local)
- Axios (HTTP client)

**Getting Started:**
```bash
cd sue-cli
pnpm dev                    # Run in development

# Examples:
pnpm dev notes list         # List all notes
pnpm dev import notes.json  # Import from file
pnpm dev export json        # Export as JSON
pnpm dev sync               # Sync with cloud
```

---

### 4. **Mobile App** (React Native)
Native iOS and Android application for on-the-go access.

**Key Features:**
- Offline-first sync
- Camera capture
- Biometric auth
- Push notifications
- Dark mode
- Native performance

**Tech Stack:**
- React Native
- Expo
- Redux state management
- TypeScript
- React Navigation

**Getting Started:**
```bash
cd sue-mobile
pnpm dev                    # Start Expo server
# Scan QR code with Expo app or press 'i' for iOS / 'a' for Android

# Build for app stores:
pnpm run build:ios          # Build for iOS App Store
pnpm run build:android      # Build for Google Play
```

---

### 5. **Admin Portal** (Vue.js)
Administrative dashboard for system management and analytics.

**Key Features:**
- User management
- System analytics
- API key generation
- Security audit logs
- Usage statistics
- System configuration

**Tech Stack:**
- Vue 3
- TypeScript
- Vuetify (Material Design)
- TailwindCSS
- ApexCharts (analytics)

**Getting Started:**
```bash
cd sue-admin-portal
pnpm dev                    # Start dev server
pnpm build                  # Production build
```

---

### 6. **AI Chat** (React)
Dedicated AI chat interface with multi-LLM support.

**Key Features:**
- Multi-LLM support (Ollama, Venice, HuggingFace)
- Conversation history
- Memory integration (RAG)
- Code highlighting
- Export conversations
- Sharing

**Tech Stack:**
- React 18
- TypeScript
- TailwindCSS
- Socket.io
- Markdown rendering

**Getting Started:**
```bash
cd sue-ai-chat
pnpm dev                    # Start dev server

# Ensure Ollama is running (optional):
ollama serve                # In another terminal
```

---

## 🗂️ Project Structure

```
ecosystem/
├── README.md               # Complete documentation
├── ARCHITECTURE.md         # System design
├── DEVELOPMENT.md          # Dev guidelines
├── GETTING_STARTED.md     # This file
├── docker-compose.yml      # Container setup
├── .env.example            # Configuration template
├── pnpm-workspace.yaml     # Monorepo config
│
├── sue-dashboard-web/      # Web dashboard (Next.js)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── next.config.js
│
├── sue-cloud-backend/      # API server (Express)
│   ├── src/
│   ├── prisma/            # Database schema
│   ├── package.json
│   └── tsconfig.json
│
├── sue-cli/                # CLI tool
│   ├── src/
│   ├── package.json
│   └── bin/
│
├── sue-mobile/             # Mobile app (React Native)
│   ├── app/
│   ├── package.json
│   └── app.json
│
├── sue-admin-portal/       # Admin dashboard (Vue)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── sue-ai-chat/            # AI chat (React)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
└── shared/                 # Shared code
    ├── types/
    └── utils/
```

---

## 🔐 Authentication

### Default Test Credentials
```
Email: test@example.com
Password: test123456
```

### Get Authentication Token
```bash
# 1. Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"test123456"
  }'

# Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-123",
    "name": "Test User",
    "email": "test@example.com"
  }
}

# 2. Use token in requests:
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  http://localhost:8000/api/v1/notes
```

---

## 🧪 Testing

### Run All Tests
```bash
# Unit tests
pnpm test

# E2E tests (UI)
pnpm run test:e2e

# E2E tests (API)
pnpm run test:e2e:api

# Watch mode
pnpm run test:watch

# Coverage report
pnpm run test:coverage
```

### Manual Testing Checklist

- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Can create a note
- [ ] Can edit a note
- [ ] Can delete a note
- [ ] Can create a project
- [ ] Can add note to project
- [ ] Sidebar updates in real-time
- [ ] Can sync with cloud
- [ ] Dark mode toggles
- [ ] Mobile app loads
- [ ] CLI commands work

---

## 🚀 Deployment

### Deploy to Staging
```bash
# Build all components
pnpm run build

# Push to staging
git push origin staging

# CI/CD automatically deploys
# Check: https://app-staging.sue.hammurabicoding.com
```

### Deploy to Production
```bash
# Create release branch
git checkout -b release/v5.0.1

# Update version numbers
pnpm run version:bump

# Commit and push
git commit -am "Release v5.0.1"
git push origin release/v5.0.1

# Create Pull Request on GitHub
# After approval and merge, automatic deployment begins
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is free
netstat -anb | find ":8000"

# Check database connection
docker-compose ps
docker-compose logs postgres

# Reset database
pnpm run db:reset
```

### Frontend won't load
```bash
# Clear cache
rm -rf .next

# Reinstall dependencies
pnpm install

# Restart dev server
pnpm dev
```

### Docker issues
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f postgres

# Restart services
docker-compose restart

# Full reset
docker-compose down -v
docker-compose up
```

### Port conflicts
```bash
# Find process using port
netstat -anb | find ":3000"

# Kill process (Windows)
taskkill /PID <PID> /F

# Or change port in package.json
# Change "dev": "next dev --port 3000" to different port
```

---

## 📚 Learning Resources

### Getting Familiar with Each Stack

**Next.js & React:**
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TailwindCSS Guide](https://tailwindcss.com/docs)

**Express & Node.js:**
- [Express Guide](https://expressjs.com/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)
- [TypeScript in Express](https://typescript-eslint.io/)

**Vue.js:**
- [Vue 3 Documentation](https://vuejs.org/)
- [Vuetify Components](https://vuetifyjs.com/)

**React Native:**
- [React Native Documentation](https://reactnative.dev)
- [Expo Guide](https://docs.expo.dev)

**Databases:**
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Redis](https://redis.io/docs/)
- [Prisma ORM](https://www.prisma.io/docs/)

---

## 🎯 Common Tasks

### Create a New Note
```bash
curl -X POST http://localhost:8000/api/v1/notes \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Note",
    "content": "Note content here",
    "tags": ["important", "review"]
  }'
```

### Add a Feature (Full Stack)

1. **Backend** - Add API endpoint
   ```typescript
   // sue-cloud-backend/src/routes/notes.ts
   router.post('/archive', authMiddleware, async (req, res) => {
     // Archive note logic
   })
   ```

2. **Frontend** - Add UI component
   ```tsx
   // sue-dashboard-web/src/components/NoteActions.tsx
   const archiveNote = async (noteId) => {
     await api.post(`/notes/${noteId}/archive`)
   }
   ```

3. **Test** - Add test
   ```typescript
   // sue-cloud-backend/__tests__/archive.test.ts
   it('should archive a note', async () => {
     const response = await request(app)
       .post('/api/v1/notes/123/archive')
   })
   ```

4. **Mobile** - Implement in mobile app
5. **CLI** - Add command support

---

## 📞 Support & Community

- **Discord**: [SUE Community](https://discord.gg/sue)
- **Email**: support@hammurabicoding.com
- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: https://docs.sue.hammurabicoding.com

---

## ✅ Next Steps

1. **Setup complete** ✓
2. **Run: pnpm dev** in each component directory
3. **Access**: http://localhost:3000
4. **Create test note** to verify setup
5. **Read**: DEVELOPMENT.md for best practices
6. **Explore**: Each component's README for specific docs
7. **Contribute**: Pick an issue and submit PR

---

**Happy building! 🚀**

Version 5.0.0 - Complete SUE Ecosystem
