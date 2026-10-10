# Ramblox - Complete Setup Guide

## 1. Install Dependencies
```bash
cd hcc-straw-ramblox
pnpm install
```

## 2. Set Up Supabase
1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Get your credentials from Project Settings → API
4. Update `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```

## 3. Run Database Migrations
1. Open Supabase SQL Editor
2. Run the schema from `server/database-schema.sql`

## 4. Start Development Server
```bash
pnpm dev
```

## 5. Test the Editor
Navigate to http://localhost:3000/editor

## AI Asset Generation
The AI asset generator is currently in placeholder mode. To integrate real AI models:

1. **For 3D Models**: Use Shap-E or Tripo AI API
2. **For Textures**: Use Stable Diffusion API
3. **For Materials**: Use Material Diffusion

Update `server/ai-assets.ts` to call actual AI APIs.

## Scripts Included
- `scripts/leaderboard.lua` - Player ranking
- `scripts/currency.lua` - In-game economy
- `scripts/teleport.lua` - Map transitions

## Testing Checklist
- [ ] Landing page loads
- [ ] Login page works
- [ ] 3D editor viewport renders
- [ ] Asset library displays
- [ ] Transform controls work (W/E/R keys)

## Next Steps
1. Integrate actual AI model APIs
2. Add Roblox API deployment
3. Implement multiplayer
4. Add mobile companion app

---

**Built with ❤️ by Hammurabi Coding Company**
