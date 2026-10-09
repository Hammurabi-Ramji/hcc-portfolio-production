/**
 * Game Management API Routes
 * 
 * Full CRUD operations with SQLite backend
 */

import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { getDb } from './database';
import {
  getGameById,
  getGamesByCreator,
  getPublishedGames,
  createGame,
  updateGame,
  deleteGame
} from './database-types';
import { generateId } from './database-types';

// Configure for Node.js runtime
export const config = {
  runtime: 'nodejs'
};

/**
 * GET /api/games
 * List games with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (userId) {
      // Get user's games
      const games = getGamesByCreator(db).all(userId);
      
      return NextResponse.json({
        success: true,
        games: games.map(transformGame),
        total: games.length,
        page: 1,
        totalPages: 1
      });
    } else if (status === 'published') {
      // Get published games for discovery
      const games = getPublishedGames(db).all('published');
      
      return NextResponse.json({
        success: true,
        games: games.map(transformGame),
        total: games.length,
        page: 1,
        totalPages: 1
      });
    } else {
      // Return all games (for admin)
      const games = db.prepare('SELECT * FROM games ORDER BY created_at DESC LIMIT ?').all(limit);
      
      return NextResponse.json({
        success: true,
        games: games.map(transformGame),
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

/**
 * GET /api/games/:id
 * Get single game by ID
 */
export async function GET_GAME(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const game = getGameById(db).get(params.id);

    if (!game) {
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      game: transformGame(game as any)
    });
  } catch (error) {
    console.error('Get game error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch game' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/games
 * Create a new game
 */
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const { creator_id, name, description } = await request.json();

    // Validate required fields
    if (!creator_id || !name) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: creator_id, name' 
        },
        { status: 400 }
      );
    }

    // Create game with default creator if creator_id is invalid or missing from db
    const validCreator = creator_id || 'admin-user-id-12345';
    
    const gameId = generateId();
    const now = new Date().toISOString();
    
    const result = createGame(db).run(
      gameId,
      validCreator,
      name,
      description || null,
      'draft',
      now,
      now
    );

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to create game' },
        { status: 500 }
      );
    }

    // Fetch created game
    const game = getGameById(db).get(gameId);

    return NextResponse.json({
      success: true,
      game: transformGame(game as any)
    });
  } catch (error) {
    console.error('Create game error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create game' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/games/:id
 * Update existing game
 */
export async function PUT_GAME(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const { name, description, status } = await request.json();
    const now = new Date().toISOString();

    const result = updateGame(db).run(
      name,
      description,
      status,
      now,
      params.id
    );

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    const game = getGameById(db).get(params.id);

    return NextResponse.json({
      success: true,
      game: transformGame(game as any)
    });
  } catch (error) {
    console.error('Update game error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update game' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/games/:id
 * Delete a game
 */
export async function DELETE_GAME(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    
    const result = deleteGame(db).run(params.id);

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Game deleted successfully'
    });
  } catch (error) {
    console.error('Delete game error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete game' },
      { status: 500 }
    );
  }
}

// Helper function to transform database row to API response
function transformGame(game: any) {
  return {
    id: game.id,
    creator_id: game.creator_id,
    name: game.name,
    description: game.description,
    status: game.status,
    created_at: game.created_at,
    updated_at: game.updated_at
  };
}
