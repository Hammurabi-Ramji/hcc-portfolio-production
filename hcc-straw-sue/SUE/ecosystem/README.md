# SUE Ecosystem - Complete Full-Stack Application Suite

Welcome to the **SUE Ecosystem** - a comprehensive, production-ready application suite that extends the SUE browser extension with web, mobile, CLI, backend, admin, and AI chat platforms.

## 📦 Components

### 1. **Sue Dashboard Web** (`sue-dashboard-web/`)
Modern web interface for notes, projects, and collaboration
- **Tech:** Next.js 14, React 18, TailwindCSS
- **Features:**
  - Full CRUD for notes and projects
  - Rich text editor with markdown support
  - Real-time collaboration
  - User settings and integrations
  - Analytics and statistics
  - Dark mode support

### 2. **Sue Cloud Backend** (`sue-cloud-backend/`)
Production-grade API server with real-time sync
- **Tech:** Express, TypeScript, PostgreSQL, Redis, Socket.io
- **Features:**
  - RESTful & WebSocket APIs
  - Real-time synchronization
  - JWT authentication + OAuth
  - User management
  - Audit logging
  - Rate limiting and caching

### 3. **Sue CLI** (`sue-cli/`)
Command-line interface for automation and batch operations
- **Tech:** Node.js, Commander.js, better-sqlite3
- **Features:**
  - Batch import/export (JSON, CSV, Markdown)
  - Automation scripts
  - Local database management
  - Syncing with cloud
  - Statistics and reporting
  - Configuration management

### 4. **Sue Mobile App** (`sue-mobile/`)
Native iOS and Android application
- **Tech:** React Native, Expo, Redux
- **Features:**
  - Offline-first sync
  - Camera capture and upload
  - Biometric authentication
  - Push notifications
  - Dark mode
  - Quick note creation

### 5. **Sue Admin Portal** (`sue-admin-portal/`)
Administrative dashboard for system management
- **Tech:** Vue 3, Vuetify, TypeScript
- **Features:**
  - User management and analytics
  - API key generation
  - System monitoring
  - Security audit logs
  - Billing and usage statistics
  - System configuration

### 6. **Sue AI Chat** (`sue-ai-chat/`)
Dedicated AI chat interface with multi-LLM support
- **Tech:** React, TailwindCSS, Socket.io
- **Features:**
  - Multi-LLM support (Ollama, Venice, HuggingFace)
  - Conversation history
  - Memory integration (RAG)
  - Code highlighting
  - Export conversations
  - Sharing capabilities

### 7. **Browser Extension** (Existing)
The original SUE sidebar extension
- **Tech:** Vue.js, WASM (Rust/Leptos)
- **Status:** ✅ Production ready (v5.0.0)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL 15+
- Redis 7+
- Docker (optional, for containerized setup)

### Setup

```bash
# Clone or navigate to ecosystem
cd ecosystem

# Install all dependencies
pnpm install

# Setup environment variables
cp .env.example .env

# Start database
docker-compose up -d postgres redis

# Run migrations
cd sue-cloud-backend && pnpm db:migrate

# Start development servers
pnpm run dev
```

This starts:
- Dashboard: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Admin Portal: `http://localhost:3001`
- AI Chat: `http://localhost:3002`

---

## 📁 Project Structure

```
ecosystem/
├── ARCHITECTURE.md                    # System design
├── docker-compose.yml                # Container setup
├── .env.example                       # Environment template
├── pnpm-workspace.yaml               # Monorepo config
│
├── sue-dashboard-web/                # Web dashboard
│   ├── src/pages/                    # Page components
│   ├── src/components/               # Reusable components
│   ├── src/lib/                      # Utilities
│   ├── public/                       # Static assets
│   └── package.json
│
├── sue-cloud-backend/                # API server
│   ├── src/routes/                   # API endpoints
│   ├── src/services/                 # Business logic
│   ├── src/middleware/               # Express middleware
│   ├── src/db/                       # Database setup
│   ├── prisma/                       # ORM schema
│   └── package.json
│
├── sue-cli/                          # CLI tool
│   ├── src/commands/                 # CLI commands
│   ├── src/lib/                      # Utilities
│   └── package.json
│
├── sue-mobile/                       # React Native app
│   ├── app/                          # App screens
│   ├── components/                   # Components
│   ├── store/                        # State management
│   └── package.json
│
├── sue-admin-portal/                 # Admin dashboard
│   ├── src/pages/                    # Admin pages
│   ├── src/components/               # Admin components
│   └── package.json
│
├── sue-ai-chat/                      # AI chat interface
│   ├── src/pages/                    # Chat pages
│   ├── src/components/               # Chat components
│   └── package.json
│
└── shared/                           # Shared code
    ├── types/                        # TypeScript types
    ├── utils/                        # Utilities
    └── constants/                    # Constants
```

---

## 🔧 Development

### Start Development Mode

```bash
# Terminal 1: Backend
cd sue-cloud-backend && pnpm dev

# Terminal 2: Dashboard
cd sue-dashboard-web && pnpm dev

# Terminal 3: Admin Portal
cd sue-admin-portal && pnpm dev

# Terminal 4: AI Chat
cd sue-ai-chat && pnpm dev

# Terminal 5: CLI (interactive)
cd sue-cli && pnpm dev
```

### Build for Production

```bash
# Build all components
pnpm run build

# Or individual builds
cd sue-cloud-backend && pnpm build
cd sue-dashboard-web && pnpm build
cd sue-cli && pnpm build
```

### Testing

```bash
# Run all tests
pnpm test

# Unit tests
pnpm run test:unit

# E2E tests
pnpm run test:e2e

# Watch mode
pnpm run test:watch
```

---

## 🐳 Docker Deployment

### Development (Docker Compose)

```bash
docker-compose up
```

Includes:
- PostgreSQL database
- Redis cache
- Backend API
- Frontend dashboards
- Network isolation

### Production (Kubernetes)

```bash
# Build images
docker build -t sue-backend ./sue-cloud-backend
docker build -t sue-dashboard ./sue-dashboard-web
docker build -t sue-admin ./sue-admin-portal

# Deploy
kubectl apply -f k8s/
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication
```bash
# Login
POST /auth/login
{
  "email": "user@example.com",
  "password": "password"
}

# Response
{
  "token": "jwt-token",
  "user": { ... }
}
```

### Notes API
```bash
# List notes
GET /notes?limit=10&sort=updated

# Create note
POST /notes
{
  "title": "My Note",
  "content": "...",
  "tags": ["tag1", "tag2"]
}

# Update note
PUT /notes/:id
{ ... }

# Delete note
DELETE /notes/:id
```

### WebSocket Events
```javascript
// Connected
socket.on('note:updated', (data) => {...})
socket.on('note:created', (data) => {...})
socket.on('user:online', (userId) => {...})

// Emit
socket.emit('note:updated', data)
```

---

## 🔐 Security Features

- ✅ JWT authentication with refresh tokens
- ✅ OAuth2 integration (Google, GitHub, Apple)
- ✅ End-to-end encryption for sensitive data
- ✅ CSRF protection
- ✅ Rate limiting per user
- ✅ SQL injection prevention (ORM + parameterized queries)
- ✅ XSS protection (CSP headers)
- ✅ CORS configuration
- ✅ Audit logging of all actions
- ✅ Data encryption at rest

---

## 📊 Database Schema

### Core Tables
- `users` - User accounts
- `notes` - Individual notes
- `projects` - Project containers
- `project_items` - Notes within projects
- `shared_collections` - Shared workspaces
- `collaborators` - Access control
- `audit_logs` - Activity tracking

---

## 🤖 AI Integration

### Supported LLMs
- **Ollama** - Local inference (self-hosted)
- **Venice AI** - Cloud API
- **Hugging Face** - Inference API
- **OpenAI** - ChatGPT API (optional)

### RAG (Retrieval Augmented Generation)
```javascript
// Query notes for context
const context = await vectorStore.search('query', 5)

// Send to LLM with context
const response = await llm.chat([
  { role: 'system', content: context },
  { role: 'user', content: 'query' }
])
```

---

## 📱 Mobile App

### Building

```bash
# iOS
pnpm run build:ios

# Android
pnpm run build:android

# Both
pnpm run build
```

### Submission
```bash
# iOS App Store
pnpm run submit:ios

# Google Play
pnpm run submit:android
```

---

## 🛠️ CLI Examples

```bash
# List all notes
sue notes list

# Search notes
sue notes list --query "todo"

# Create note
sue notes create "My Note" --content "Content here"

# Import from file
sue import notes.json

# Export all
sue export json --output backup.json

# Sync with cloud
sue sync --force

# Show stats
sue stats
```

---

## 🚢 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Redis connection working
- [ ] SSL certificates installed
- [ ] API keys generated (OAuth, LLM, etc.)
- [ ] Email service configured
- [ ] File storage configured
- [ ] Backups enabled
- [ ] Monitoring set up
- [ ] CI/CD pipeline configured

---

## 📖 Documentation

- [Architecture](./ARCHITECTURE.md) - System design and data flow
- [API Reference](./docs/API.md) - Complete API documentation
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production setup
- [Contributing](./CONTRIBUTING.md) - Development guidelines
- [Security Policy](./SECURITY.md) - Security practices

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check database connection
pnpm run db:push

# Check Redis connection
redis-cli ping

# View logs
tail -f logs/server.log
```

### Frontend build fails
```bash
# Clear cache
pnpm run clean

# Reinstall dependencies
rm -rf node_modules && pnpm install

# Rebuild
pnpm build
```

### Mobile app won't run
```bash
# Clear Expo cache
expo start -c

# Reset native modules
cd sue-mobile && npm install && cd ..
```

---

## 📈 Performance Optimization

- ✅ Code splitting and lazy loading
- ✅ Redis caching for frequent queries
- ✅ Database query optimization with indexes
- ✅ CDN for static assets
- ✅ Gzip compression
- ✅ Image optimization
- ✅ Worker pools for heavy tasks
- ✅ WebSocket for real-time updates

---

## 🔄 CI/CD Pipeline

All components have GitHub Actions workflows:
```yaml
- Lint & Format
- Type Checking
- Unit Tests
- E2E Tests
- Build
- Deploy to Staging
- Deploy to Production (manual approval)
```

---

## 📞 Support

- 📧 Email: support@hammurabicoding.com
- 💬 Discord: [SUE Community](https://discord.gg/sue)
- 🐛 Issues: [GitHub Issues](https://github.com/hammurabicoding/sue)
- 📚 Wiki: [SUE Documentation](https://docs.sue.hammurabicoding.com)

---

## 📄 License

MIT License - See LICENSE file

---

## 🎯 Roadmap

- [ ] Offline desktop app (Electron)
- [ ] Collaborative editing (OT/CRDT)
- [ ] Advanced search with Elasticsearch
- [ ] Plugin marketplace
- [ ] Voice input/output
- [ ] Video recording capture
- [ ] Team workspaces
- [ ] Custom workflows

---

**Built with ❤️ by Hammurabi Coding Company**

v5.0.0 - Complete Ecosystem
