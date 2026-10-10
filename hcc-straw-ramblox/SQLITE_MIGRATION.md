# Ramblox - SQLite3 Migration Guide

## Overview

Ramblox has been migrated from Supabase to **SQLite3** for local-first development. This eliminates the need for cloud credentials and enables offline development.

---

## What Changed

### ✅ Removed
- ❌ Supabase authentication
- ❌ Supabase database
- ❌ Environment variables for Supabase
- ❌ Edge runtime dependencies

### ✅ Added
- ✅ **SQLite3** database (`better-sqlite3`)
- ✅ **bcrypt** for password hashing
- ✅ **Session-based authentication**
- ✅ **Local-first architecture**
- ✅ **Embedded SQL schema**

---

## Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
cd hcc-straw-ramblox
pnpm install
```

### Step 2: Set Up Environment
```bash
# .env.local is already configured
cat .env.local
```

### Step 3: Initialize Database
```bash
pnpm setup-db
```

This will:
- Create `data/ramblox.db`
- Run all migrations
- Create an admin test user
- Create a sample game

### Step 4: Start Development
```bash
pnpm dev
```

### Step 5: Test It
- **Landing page**: http://localhost:3000
- **Editor**: http://localhost:3000/editor
- **API Health**: http://localhost:3000/api
- **Test Auth**: See "Testing" section below

---

## Testing the New System

### Create a User via API

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "username": "tester",
    "display_name": "Test User"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "username": "tester"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### Create a Game

```bash
curl -X POST http://localhost:3000/api/games \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "creator_id": "user-id-here",
    "name": "My Adventure Game",
    "description": "An epic adventure"
  }'
```

---

## Database Files

### Location
```
data/
  ramblox.db          ← Main database
  ramblox.db-wal      ← Write-ahead log
  ramblox.db-shm      ← Shared memory
```

### Backup
```bash
# Create backup
cp data/ramblox.db data/ramblox.backup.db

# Restore from backup
cp data/ramblox.backup.db data/ramblox.db
```

### View Database
```bash
# Install SQLite CLI (if not available)
# macOS: brew install sqlite3
# Windows: choco install sqlite

# Open database
sqlite3 data/ramblox.db

# List tables
.tables

# Query users
SELECT * FROM users;

# Query games
SELECT * FROM games;

# Exit
.quit
```

---

## Architecture Changes

### Before (Supabase)
```
Client → Next.js API → Supabase (PostgreSQL) → Auth
```

### After (SQLite3)
```
Client → Next.js API → SQLite3 (local) → Auth (bcrypt)
```

---

## File Structure Changes

```
server/
├── database.ts          ← NEW: SQLite connection & schema
├── database-types.ts    ← NEW: TypeScript definitions
├── auth-utils.ts        ← NEW: Password hashing
├── auth.ts              ← UPDATED: Real auth implementation
├── games.ts             ← UPDATED: Full CRUD
├── analytics.ts         ← UPDATED: Real tracking
├── monetization.ts      ← UPDATED: Game passes
├── sqlite-schema.sql    ← NEW: Standalone schema
└── database-schema.sql  ← OLD: PostgreSQL (keep for reference)
```

---

## Environment Variables

### Removed
```bash
# Remove these from .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Added
```bash
# SQLite database path
SQLITE_PATH=data/ramblox.db

# Session secret
SESSION_SECRET=your-secret-key-here
SESSION_EXPIRY=604800000  # 7 days

# API (optional)
AI_API_KEY=
AI_API_URL=
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Games
- `GET /api/games` - List games
- `GET /api/games/:id` - Get game
- `POST /api/games` - Create game
- `PUT /api/games/:id` - Update game
- `DELETE /api/games/:id` - Delete game

### Analytics
- `GET /api/analytics?gameId=xxx` - Get analytics
- `POST /api/analytics` - Track event

### Monetization
- `GET /api/monetization?gameId=xxx` - Get game passes
- `POST /api/monetization` - Create game pass
- `POST /api/monetization/:id/purchase` - Record purchase

---

## Security Considerations

### Password Security
✅ **bcrypt** with 12 salt rounds  
✅ **Hashed passwords** in database  
✅ **Session tokens** with 7-day expiry  
✅ **No plaintext passwords**

### Data Protection
✅ **Foreign key constraints**  
✅ **Cascading deletes**  
✅ **Check constraints** for data validation  
✅ **JSON validation** for event data

### Recommendations for Production
1. Use a strong `SESSION_SECRET` (random 32+ chars)
2. Enable HTTPS
3. Set up rate limiting
4. Add CSRF protection
5. Use production-grade file storage (S3, etc.)

---

## Migration from Supabase (If Needed)

If you want to migrate existing Supabase data:

```sql
-- In Supabase SQL Editor
SELECT 
  id, email, username, password_hash, display_name, created_at, updated_at
FROM users;
```

Then:
1. Export to JSON
2. Transform to SQLite format
3. Import using SQLite CLI

---

## Troubleshooting

### Issue: Database not created
**Solution:** Run `pnpm setup-db`

### Issue: Tables don't exist
**Solution:** Delete `data/ramblox.db` and run `pnpm setup-db`

### Issue: Permission errors
**Solution:** Ensure `data/` directory has write permissions

### Issue: "Module not found: better-sqlite3"
**Solution:** Run `pnpm install` to install dependencies

### Issue: TypeScript errors
**Solution:** Run `pnpm type-check` and fix any reported issues

---

## Next Steps

1. ✅ Test the system with the examples above
2. ✅ Update frontend to use new auth endpoints
3. ✅ Add UI for registration/login
4. ✅ Test game creation/editing
5. ✅ Monitor database performance
6. ✅ Set up automated backups

---

## Support

**Questions?** Check:
- [README.md](./README.md) - Project overview
- [SETUP.md](./SETUP.md) - Initial setup guide
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Architecture details
- [AUDIT_REPORT.md](../output/AUDIT_REPORT.md) - Previous audit

---

**Built with ❤️ by Hammurabi Coding Company**
