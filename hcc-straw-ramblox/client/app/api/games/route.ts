/**
 * Game Management API Routes
 *
 * GET /api/games?status=published - Public discovery (published games only)
 * GET /api/games?userId=xxx - A creator's games; drafts only for that creator
 * GET /api/games - The signed-in user's own games
 * POST /api/games - Create a game owned by the signed-in user
 */

import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../server/database';
import { getGameById, type Game } from '../../../../server/database-types';
import { getSession, unauthorized } from '@/lib/auth';

export const config = {
  runtime: 'nodejs'
};

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const requested = Number.parseInt(searchParams.get('limit') || '20', 10);
    const limit = Number.isFinite(requested) && requested > 0 ? Math.min(requested, 100) : 20;
    const session = await getSession();

    let games: Game[];
    if (userId) {
      // Drafts and archived games are only visible to their creator.
      games = session?.userId === userId
        ? db.prepare<[string, number], Game>(`
            SELECT * FROM games WHERE creator_id = ?
            ORDER BY created_at DESC LIMIT ?
          `).all(userId, limit)
        : db.prepare<[string, string, number], Game>(`
            SELECT * FROM games WHERE creator_id = ? AND status = ?
            ORDER BY created_at DESC LIMIT ?
          `).all(userId, 'published', limit);
    } else if (status === 'published') {
      // Get published games for discovery
      games = db.prepare<[string, number], Game>(`
        SELECT * FROM games WHERE status = ?
        ORDER BY created_at DESC LIMIT ?
      `).all('published', limit);
    } else {
      // Without a filter, list the signed-in user's own games. There is no
      // admin role, so nobody can list every game including others' drafts.
      if (!session) {
        return unauthorized();
      }
      games = db.prepare<[string, number], Game>(`
        SELECT * FROM games WHERE creator_id = ?
        ORDER BY created_at DESC LIMIT ?
      `).all(session.userId, limit);
    }

    return NextResponse.json({
      success: true,
      games: transformGames(games),
      total: games.length,
      page: 1,
      totalPages: 1
    });
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
    const session = await getSession();
    if (!session) {
      return unauthorized();
    }

    const db = getDb();
    const { name, description } = await request.json();

    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: name'
        },
        { status: 400 }
      );
    }

    // The creator is always the signed-in user; any creator_id in the body is ignored.
    const gameId = randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO games (id, creator_id, name, description, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(gameId, session.userId, name.trim(), description || null, 'draft', now, now);

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
