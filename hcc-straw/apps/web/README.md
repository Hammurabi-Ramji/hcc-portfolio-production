# AUTARCH Web Platform

A production-ready full-stack web application foundation built with Next.js 15, TypeScript, PostgreSQL, and Docker.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- PostgreSQL (or use Docker)

### Installation

```bash
# Install dependencies
cd apps/web
npm install

# Setup environment variables
cp ../.env.example .env
# Edit .env with your configuration

# Start development servers
cd ../..
npm run dev

# Or use Docker
npm run docker:up
```

## 🏗️ Project Structure

```
apps/web/
├── app/                  # Next.js App Router pages
│   ├── layout.tsx       # Root layout with metadata
│   ├── page.tsx         # Home page
│   ├── globals.css      # Global styles
│   ├── login/
│   ├── signup/
│   ├── dashboard/
│   ├── docs/
│   └── features/
├── components/          # React components
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── Features.tsx
├── context/            # React contexts
│   └── AuthContext.tsx
├── lib/                # Utility libraries
│   ├── utils.ts        # Helper functions
│   └── api-client.ts   # API client
├── types/              # TypeScript types
│   └── index.ts
├── public/             # Static assets
└── styles/             # Additional styles
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS
- **ShadCN UI** - Beautiful components
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **TanStack Query** - Data fetching

### Backend (API)
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **PostgreSQL** - Primary database
- **Redis** - Caching layer
- **Drizzle ORM** - Database ORM
- **JWT** - Authentication

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **GitHub Actions** - CI/CD
- **Nginx** - Reverse proxy

## 📋 Features

✅ **Authentication System**
- User registration & login
- JWT-based sessions
- Email verification
- Password reset
- Role-based access control (RBAC)

✅ **Database Schema**
- Users & profiles
- Sessions management
- Audit logs
- File uploads
- Soft deletes

✅ **Developer Experience**
- TypeScript throughout
- ESLint + Prettier
- Husky git hooks
- Hot module replacement
- Error boundaries

✅ **Production Ready**
- Docker configurations
- Environment variables
- Security best practices
- Performance optimized
- Scalable architecture

## 🚦 Scripts

```bash
# Development
npm run dev           # Start dev servers
npm run build         # Build for production
npm start             # Start production server
npm run lint          # Run ESLint
npm run format        # Format code

# Docker
npm run docker:up     # Start Docker containers
npm run docker:down   # Stop Docker containers
npm run docker:logs   # View Docker logs

# Database
npm run db:generate   # Generate ORM types
npm run db:migrate    # Run migrations
npm run db:seed       # Seed database
```

## 🔧 Configuration

### Environment Variables (.env)

```env
# Application
NEXT_PUBLIC_API_URL=http://localhost:3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Email (for verification/reset)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your@email.com
EMAIL_PASS=password

# Other
APP_URL=http://localhost:3000
```

## 🐳 Docker Setup

Start all services:
```bash
docker-compose up -d
```

Services:
- **Web** - Next.js frontend (port 3000)
- **API** - Node.js backend (port 3001)
- **PostgreSQL** - Database (port 5432)
- **Redis** - Cache (port 6379)
- **Nginx** - Reverse proxy (ports 80, 443)

## 📚 Documentation

- [API Documentation](/docs) - Complete API reference
- [Getting Started](/docs#quick-start) - Quick start guide
- [Architecture](/docs#architecture) - System architecture
- [Authentication](/docs#authentication) - Auth implementation

## 🔒 Security

- Password hashing with bcrypt (12 rounds)
- JWT tokens with refresh mechanism
- CSRF protection
- CORS configuration
- Rate limiting
- SQL injection prevention (ORM)
- XSS protection

## 📈 Performance

- Next.js 15 with App Router
- Server-side rendering
- Static site generation (where applicable)
- Intelligent caching with Redis
- CDN integration ready
- Image optimization

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary. All rights reserved by Hammurabi Coding Company.

## 👥 Team

Built with ❤️ by Hammurabi Coding Company

## 📞 Support

- Documentation: [View Docs](/docs)
- Issues: [GitHub Issues](https://github.com/your-repo/issues)
- Email: support@autarch-web.com

---

**Ready to build?** Get started with the [Quick Start Guide](/docs#quick-start) or explore the [Documentation](/docs).
