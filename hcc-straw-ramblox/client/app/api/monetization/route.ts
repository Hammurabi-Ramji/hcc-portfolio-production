/**
 * Monetization API Routes (game creator only)
 *
 * GET /api/monetization?gameId=xxx - List game passes and revenue
 * POST /api/monetization - Create game pass
 */

import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../server/database';
import { getGamePassById, type GamePass } from '../../../../server/database-types';
import { findGame, forbidden, getSession, unauthorized } from '@/lib/auth';

export const config = {
  runtime: 'nodejs'
};

const gameNotFound = () =>
  NextResponse.json(
    { success: false, error: 'Game not found' },
    { status: 404 }
  );

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return unauthorized();
    }

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return NextResponse.json(
        { success: false, error: 'gameId parameter required' },
        { status: 400 }
      );
    }

    // Revenue and sales belong to the game's creator.
    const game = findGame(gameId);
    if (!game) {
      return gameNotFound();
    }
    if (game.creator_id !== session.userId) {
      return forbidden();
    }

    // Get game passes
    const passes = db.prepare<[string, GamePass['status']], GamePass>(`
      SELECT * FROM game_passes WHERE game_id = ? AND status != ?
      ORDER BY price DESC
    `).all(game.id, 'deleted');

    // Calculate totals
    let totalRevenue = 0;
    let totalSales = 0;

    passes.forEach((pass: any) => {
      totalRevenue += pass.total_revenue || 0;
      totalSales += pass.sales_count || 0;
    });

    return NextResponse.json({
      success: true,
      game_passes: transformPasses(passes),
      total_revenue: totalRevenue,
      sales_count: totalSales,
      avg_revenue_per_pass: passes.length > 0 ? Math.round(totalRevenue / passes.length) : 0
    });
  } catch (error) {
    console.error('Get monetization error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch monetization data' },
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
    const { game_id, name, description, price } = await request.json();

    if (!game_id || !name || !price) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: game_id, name, price'
        },
        { status: 400 }
      );
    }

    // Validate price
    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { success: false, error: 'Price must be greater than 0' },
        { status: 400 }
      );
    }

    // Passes can only be added to an existing game the caller created; there
    // is no fallback to some other game.
    const game = findGame(game_id);
    if (!game) {
      return gameNotFound();
    }
    if (game.creator_id !== session.userId) {
      return forbidden();
    }

    const passId = randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO game_passes (id, game_id, name, description, price, sales_count, total_revenue, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(passId, game.id, name, description || null, price, 0, 0, 'active', now, now);

    const pass = getGamePassById(db).get(passId);

    if (!pass) {
      return NextResponse.json(
        { success: false, error: 'Failed to load created game pass' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      game_pass: {
        id: pass.id,
        game_id: pass.game_id,
        name: pass.name,
        description: pass.description,
        price: pass.price,
        sales_count: pass.sales_count,
        total_revenue: pass.total_revenue,
        status: pass.status,
        created_at: pass.created_at,
        updated_at: pass.updated_at
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Create game pass error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create game pass' },
      { status: 500 }
    );
  }
}

// Helper function
function transformPasses(passes: any[]) {
  return passes.map(pass => ({
    id: pass.id,
    game_id: pass.game_id,
    name: pass.name,
    description: pass.description,
    price: pass.price,
    sales_count: pass.sales_count,
    total_revenue: pass.total_revenue,
    status: pass.status,
    created_at: pass.created_at,
    updated_at: pass.updated_at
  }));
}
