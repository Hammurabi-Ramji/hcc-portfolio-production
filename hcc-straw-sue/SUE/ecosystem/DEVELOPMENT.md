# SUE Ecosystem Development Guide

## Getting Started

### 1. Clone and Setup
```bash
cd ecosystem
pnpm install
cp .env.example .env
```

### 2. Start Services
```bash
# Terminal 1: Docker services
docker-compose up

# Terminal 2: Backend
cd sue-cloud-backend && pnpm dev

# Terminal 3: Dashboard
cd sue-dashboard-web && pnpm dev

# Terminal 4: Admin Portal  
cd sue-admin-portal && pnpm dev

# Terminal 5: AI Chat
cd sue-ai-chat && pnpm dev
```

### 3. Access Applications
- Dashboard: http://localhost:3000
- Backend API: http://localhost:8000
- Admin: http://localhost:3001
- AI Chat: http://localhost:3002

---

## Development Workflow

### Creating a New Feature

1. **Backend** - Add API endpoint
   ```typescript
   // sue-cloud-backend/src/routes/notes.ts
   router.post('/analyze', async (req, res) => {
     // Implement feature
   })
   ```

2. **Frontend** - Add UI component
   ```tsx
   // sue-dashboard-web/src/components/features/Analyzer.tsx
   export function Analyzer() {
     // Implement UI
   }
   ```

3. **Test** - Add tests
   ```typescript
   // sue-cloud-backend/__tests__/analyze.test.ts
   describe('Analyzer', () => {
     it('should analyze notes', () => {
       // Test implementation
     })
   })
   ```

4. **Document** - Update docs
   ```markdown
   # API Endpoint
   POST /api/v1/notes/analyze
   ```

---

## Testing Strategy

### Unit Tests
```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

### E2E Tests
```bash
# UI E2E
pnpm run test:e2e

# API E2E
pnpm run test:e2e:api
```

### Load Testing
```bash
# Using k6
k6 run tests/load/notes.js
```

---

## Code Quality

### Linting
```bash
pnpm run lint
pnpm run lint:fix
```

### Formatting
```bash
pnpm run format
```

### Type Checking
```bash
pnpm run type-check
```

### Full Validation
```bash
pnpm run validate
```

---

## Database

### Migrations
```bash
# Create migration
pnpm run db:create

# Run pending
pnpm run db:migrate

# Rollback
pnpm run db:rollback

# Reset (dev only)
pnpm run db:reset
```

### Seeding
```bash
# Seed development data
pnpm run db:seed

# Seed specific data
pnpm run db:seed -- --users 100
```

---

## Performance Profiling

### Frontend
```bash
# React DevTools
# Redux DevTools (if applicable)
# Lighthouse (Chrome DevTools)
```

### Backend
```bash
# Node profiler
node --prof server.js

# Analyze
node --prof-process isolate-*.log > profile.txt
```

### Database
```bash
# Slow query log
SELECT * FROM pg_stat_statements ORDER BY total_time DESC;

# Analyze query
EXPLAIN ANALYZE SELECT ...
```

---

## Debugging

### Backend
```bash
# VSCode Debug Config
{
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/sue-cloud-backend/dist/server.js",
  "preLaunchTask": "build",
  "outFiles": ["${workspaceFolder}/sue-cloud-backend/dist/**/*.js"]
}
```

### Frontend
```bash
# Browser DevTools (F12)
# Vue DevTools extension
# Redux DevTools extension
```

### Database
```bash
# Connect to PostgreSQL
psql -U sue -d sue_db

# View logs
docker logs ecosystem_postgres_1
```

---

## Common Tasks

### Update Dependencies
```bash
pnpm update --latest
pnpm audit
```

### Generate Types
```bash
# From database schema
pnpm run db:generate

# From API responses
pnpm run types:generate
```

### Create API Documentation
```bash
pnpm run docs:generate
```

---

## Git Workflow

### Commit Messages
```
feat: Add user authentication
fix: Resolve sync issue
docs: Update API docs
style: Format code
refactor: Restructure auth module
test: Add unit tests
chore: Update dependencies
```

### Pull Request
1. Create feature branch: `git checkout -b feature/my-feature`
2. Commit changes with meaningful messages
3. Push: `git push origin feature/my-feature`
4. Create PR with description
5. Await review and CI/CD checks
6. Merge when approved

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Error
```bash
# Check PostgreSQL is running
docker-compose ps

# Reset database
pnpm run db:reset

# Check connection string
echo $DATABASE_URL
```

### Dependencies Issue
```bash
# Clear lock file
rm pnpm-lock.yaml

# Reinstall
pnpm install
```

---

## Performance Tips

1. **Caching**: Use Redis for frequently accessed data
2. **Database**: Add indexes to frequently queried columns
3. **Frontend**: Lazy load components and images
4. **API**: Paginate large result sets
5. **WebSocket**: Use rooms for targeted broadcasts

---

## Security Checklist

- [ ] Change default passwords
- [ ] Set strong JWT secret
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Set database backups
- [ ] Enable audit logging
- [ ] Review access controls
- [ ] Update dependencies regularly

---

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Express Docs](https://expressjs.com/)
- [Vue Docs](https://vuejs.org/)
- [React Native Docs](https://reactnative.dev/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Redis Docs](https://redis.io/docs/)

---

**Happy coding! 🚀**
