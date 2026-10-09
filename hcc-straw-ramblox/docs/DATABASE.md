# Ramblox Database Schema

## Tables
- users
- games
- game_assets
- game_passes
- player_stats
- analytics_events
- ai_generated_assets

## SQL Setup
Run migrations from `server/database-schema.sql`

## Relations
- games → users (creator)
- game_passes → games
- analytics_events → games
