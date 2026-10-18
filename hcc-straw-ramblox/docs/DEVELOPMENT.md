# Ramblox Documentation

## Development Guide

### Setup
1. Install dependencies: `pnpm install`
2. Set up environment: Copy `.env.example` to `.env.local`
3. Start dev server: `pnpm dev`

### 3D Editor
- Uses React Three Fiber for 3D rendering
- Transform controls for object manipulation
- Properties panel for editing

### AI Assets
- Text-to-3D generation interface
- Placeholder for AI model integration

## API
- `/api/generate` - Generate AI assets
- `/api/assets` - List assets

## Database
- Supabase PostgreSQL
- Schema in `server/database-schema.sql`
