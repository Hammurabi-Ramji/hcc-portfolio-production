/**
 * Game Management API Routes
 * 
 * GET /api/games - List all games
 * POST /api/games - Create new game
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../server/database';
import { getGameById, type Game } from '../../../../server/database-types';

export const config = {
  runtime: 'nodejs'
};

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = Number.parseInt(searchParams.get('limit') || '20', 10);

    if (userId) {
      // Get user's games
      const games = db.prepare<[string, number], Game>(`
        SELECT * FROM games WHERE creator_id = ? 
        ORDER BY created_at DESC LIMIT ?
      `).all(userId, limit);
      
      return NextResponse.json({
        success: true,
        games: transformGames(games),
        total: games.length,
        page: 1,
        totalPages: 1
      });
    } else if (status === 'published') {
      // Get published games for discovery
      const games = db.prepare<[string, number], Game>(`
        SELECT * FROM games WHERE status = ? 
        ORDER BY created_at DESC LIMIT ?
      `).all('published', limit);
      
      return NextResponse.json({
        success: true,
        games: transformGames(games),
        total: games.length,
        page: 1,
        totalPages: 1
      });
    } else {
      // Return all games (for admin)
      const games = db.prepare<[number], Game>(`
        SELECT * FROM games ORDER BY created_at DESC LIMIT ?
      `).all(limit);
      
      return NextResponse.json({
        success: true,
        games: transformGames(games),
        total: games.length,
        page: 1,
        totalPages: 1
      });
    }
  } catch (error) {
    console.error('Get games error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const { creator_id, name, description } = await request.json();

    if (!creator_id || !name) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: creator_id, name' 
        },
        { status: 400 }
      );
    }

    let validCreator = typeof creator_id === 'string' && creator_id.trim().length > 0
      ? creator_id.trim()
      : null;

    if (validCreator) {
      const existingCreator = db.prepare<[string], { id: string }>(
        'SELECT id FROM users WHERE id = ?'
      ).get(validCreator);

      if (!existingCreator) {
        validCreator = null;
      }
    }

    if (!validCreator) {
      const fallbackCreator = db.prepare<[], { id: string }>(
        'SELECT id FROM users ORDER BY created_at ASC LIMIT 1'
      ).get();

      if (!fallbackCreator) {
        return NextResponse.json(
          { success: false, error: 'No valid creator found for game creation' },
          { status: 500 }
        );
      }

      validCreator = fallbackCreator.id;
    }
    
    const gameId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO games (id, creator_id, name, description, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(gameId, validCreator, name, description || null, 'draft', now, now);

    const game = getGameById(db).get(gameId);

    if (!game) {
      return NextResponse.json(
        { success: false, error: 'Failed to load created game' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      game: {
        id: game.id,
        creator_id: game.creator_id,
        name: game.name,
        description: game.description,
        status: game.status,
        created_at: game.created_at,
        updated_at: game.updated_at
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Create game error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create game' },
      { status: 500 }
    );
  }
}

// Helper function
function transformGames(games: any[]) {
  return games.map(game => ({
    id: game.id,
    creator_id: game.creator_id,
    name: game.name,
    description: game.description,
    status: game.status,
    created_at: game.created_at,
    updated_at: game.updated_at
  }));
}
