/**
 * Monetization API Routes
 * 
 * Game passes and revenue tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { getDb } from './database';
import {
  getGamePassById,
  getGamePassesByGame,
  createGamePass,
  updateGamePass,
  incrementGamePassSales
} from './database-types';
import { generateId } from './database-types';

// Configure for Node.js runtime
export const config = {
  runtime: 'nodejs'
};

/**
 * GET /api/monetization
 * Get monetization stats for a game
 */
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return NextResponse.json(
        { success: false, error: 'gameId parameter required' },
        { status: 400 }
      );
    }

    // Get game passes
    const passes = getGamePassesByGame(db).all(gameId, 'deleted');
    
    // Calculate totals
    let totalRevenue = 0;
    let totalSales = 0;

    passes.forEach(pass => {
      totalRevenue += pass.total_revenue || 0;
      totalSales += pass.sales_count || 0;
    });

    return NextResponse.json({
      success: true,
      game_passes: passes.map(transformPass),
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

/**
 * GET /api/monetization/:id
 * Get single game pass
 */
export async function GET_PASS(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const pass = getGamePassById(db).get(params.id);

    if (!pass) {
      return NextResponse.json(
        { success: false, error: 'Game pass not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      game_pass: transformPass(pass as any)
    });
  } catch (error) {
    console.error('Get game pass error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch game pass' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monetization
 * Create a new game pass
 */
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const { game_id, name, description, price } = await request.json();

    // Validate required fields
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
    if (price <= 0) {
      return NextResponse.json(
        { success: false, error: 'Price must be greater than 0' },
        { status: 400 }
      );
    }

    // Create game pass
    const passId = generateId();
    const now = new Date().toISOString();

    const result = createGamePass(db).run(
      passId,
      game_id,
      name,
      description || null,
      price,
      0,
      0,
      'active',
      now,
      now
    );

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to create game pass' },
        { status: 500 }
      );
    }

    const pass = getGamePassById(db).get(passId);

    return NextResponse.json({
      success: true,
      game_pass: transformPass(pass as any)
    });
  } catch (error) {
    console.error('Create game pass error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create game pass' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/monetization/:id
 * Update game pass
 */
export async function PUT_PASS(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const { name, price, status } = await request.json();
    const now = new Date().toISOString();

    const result = updateGamePass(db).run(
      name,
      price,
      status,
      now,
      params.id
    );

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: 'Game pass not found' },
        { status: 404 }
      );
    }

    const pass = getGamePassById(db).get(params.id);

    return NextResponse.json({
      success: true,
      game_pass: transformPass(pass as any)
    });
  } catch (error) {
    console.error('Update game pass error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update game pass' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monetization/:id/purchase
 * Record a game pass purchase
 */
export async function PURCHASE_PASS(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const { game_id, player_id, amount } = await request.json();

    if (!game_id || !player_id) {
      return NextResponse.json(
        { success: false, error: 'game_id and player_id required' },
        { status: 400 }
      );
    }

    // Increment sales and revenue
    const result = incrementGamePassSales(db).run(
      1,
      amount || 0,
      new Date().toISOString(),
      params.id
    );

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: 'Game pass not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Purchase recorded',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Purchase error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record purchase' },
      { status: 500 }
    );
  }
}

// Helper function
function transformPass(pass: any) {
  return {
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
  };
}
