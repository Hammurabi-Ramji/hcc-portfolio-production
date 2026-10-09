# Ramblox Server

## API Routes

### `/api` - Health check
**GET** - Returns service status

### `/api/generate` - Asset generation
**POST** - Generate AI assets
- body: `{ type, prompt, style, quality }`
- returns: `{ success, asset }`

### `/api/games` - Game management
**GET** - List games
**POST** - Create game

### `/api/monetization` - Revenue tracking
**GET** - Get monetization stats
**POST** - Create game pass

### `/api/analytics` - Event tracking
**GET** - Get analytics
**POST** - Track event

### `/api/auth` - Authentication
**POST** - Login/register

## Error Responses
```json
{
  "success": false,
  "error": "Error message"
}
```

## Authentication
Currently placeholder - integrate with Supabase Auth for production.
