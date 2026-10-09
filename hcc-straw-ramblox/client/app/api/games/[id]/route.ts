import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../../server/database';
import {
  getGameById,
  updateGame,
  deleteGame
} from '../../../../../server/database-types';

type GameRouteContext = {
  params: Promise<{ id: string }>;
};

// GET single game
export async function GET(
  request: NextRequest,
  { params }: GameRouteContext
) {
  try {
    const { id } = await params;
    const db = getDb();
    const game = getGameById(db).get(id);

    if (!game) {
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
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
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch game' },
      { status: 500 }
    );
  }
}

// PUT update game
export async function PUT(
  request: NextRequest,
  { params }: GameRouteContext
) {
  try {
    const { id } = await params;
    const db = getDb();
    const { name, description, status } = await request.json();
    const now = new Date().toISOString();

    const result = updateGame(db).run(
      name,
      description,
      status,
      now,
      id
    );

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    const game = getGameById(db).get(id);

    if (!game) {
      return NextResponse.json(
        { success: false, error: 'Updated game could not be loaded' },
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
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update game' },
      { status: 500 }
    );
  }
}

// DELETE game
export async function DELETE(
  request: NextRequest,
  { params }: GameRouteContext
) {
  try {
    const { id } = await params;
    const db = getDb();
    
    const result = deleteGame(db).run(id);

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
    return NextResponse.json(
      { success: false, error: 'Failed to delete game' },
      { status: 500 }
    );
  }
}
