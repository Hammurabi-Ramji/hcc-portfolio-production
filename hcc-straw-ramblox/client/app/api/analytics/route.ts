/**
 * Analytics API Routes
 * 
 * GET /api/analytics?gameId=xxx - Get analytics data (game creator only)
 * POST /api/analytics - Track an event for the signed-in player
 */

import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../server/database';
import { findGame, forbidden, getSession, unauthorized } from '@/lib/auth';

const gameNotFound = () =>
  NextResponse.json(
    { success: false, error: 'Game not found' },
    { status: 404 }
  );

export const config = {
  runtime: 'nodejs'
};

interface AnalyticsSummaryRow {
  total_players: number;
  active_today: number;
  active_week: number;
}

interface CountRow {
  count: number;
}

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

    // Player and revenue analytics belong to the game's creator.
    const game = findGame(gameId);
    if (!game) {
      return gameNotFound();
    }
    if (game.creator_id !== session.userId) {
      return forbidden();
    }

    // Get summary stats
    const summary = db.prepare<[string], AnalyticsSummaryRow>(`
      SELECT 
        COUNT(DISTINCT player_id) as total_players,
        COUNT(CASE WHEN created_at >= datetime('now', '-1 day') THEN 1 END) as active_today,
        COUNT(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 END) as active_week
      FROM analytics_events 
      WHERE game_id = ?
    `).get(gameId);

    // Get recent events
    const events = db.prepare(`
      SELECT * FROM analytics_events 
      WHERE game_id = ? 
      ORDER BY created_at DESC 
      LIMIT 100
    `).all(gameId) as Array<{
      id: string;
      game_id: string;
      player_id: string;
      event_type: string;
      event_data: string | null;
      session_id: string | null;
      created_at: string;
    }>;

    // Calculate additional metrics
    const todayStr = new Date().toISOString().split('T')[0];
    const sevenDaysAgoStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const dailyActive = db.prepare<[string, string], CountRow>(`
      SELECT COUNT(DISTINCT player_id) as count
      FROM analytics_events
      WHERE game_id = ?
      AND DATE(created_at) >= ?
    `).get(gameId, todayStr)?.count || 0;

    const weeklyActive = db.prepare<[string, string], CountRow>(`
      SELECT COUNT(DISTINCT player_id) as count
      FROM analytics_events
      WHERE game_id = ?
      AND DATE(created_at) >= ?
    `).get(gameId, sevenDaysAgoStr)?.count || 0;

    return NextResponse.json({
      success: true,
      summary: {
        total_players: summary?.total_players || 0,
        active_today: dailyActive,
        active_week: weeklyActive,
        retention_day1: 100, // Simplified
        retention_day7: 100, // Simplified
        avg_session_duration: 0
      },
      events: events.map((e) => ({
        id: e.id,
        game_id: e.game_id,
        player_id: e.player_id,
        event_type: e.event_type,
        event_data: e.event_data ? JSON.parse(e.event_data) : null,
        session_id: e.session_id,
        created_at: e.created_at
      })),
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
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
    // The player is the signed-in user; any player_id in the body is ignored.
    const { game_id, event_type, event_data } = await request.json();

    if (!game_id || !event_type) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: game_id, event_type' 
        },
        { status: 400 }
      );
    }

    // Events are only recorded against a real game the player can see: a
    // published game, or the caller's own game while it is in development.
    const game = findGame(game_id);
    if (!game) {
      return gameNotFound();
    }
    if (game.status !== 'published' && game.creator_id !== session.userId) {
      return gameNotFound();
    }
    const validGameId = game.id;
    
    const eventId = randomUUID();
    const eventData = event_data ? JSON.stringify(event_data) : null;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO analytics_events (id, game_id, player_id, event_type, event_data, session_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(eventId, validGameId, session.userId, event_type, eventData, null, now);

    return NextResponse.json({
      success: true,
      event_id: eventId,
      timestamp: now
    });
  } catch (error) {
    console.error('Track event error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track event' },
      { status: 500 }
    );
  }
}
