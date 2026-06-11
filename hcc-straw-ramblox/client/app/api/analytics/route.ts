/**
 * Analytics API Routes
 * 
 * GET /api/analytics?gameId=xxx - Get analytics data
 * POST /api/analytics - Track analytics event
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../server/database';

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
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return NextResponse.json(
        { success: false, error: 'gameId parameter required' },
        { status: 400 }
      );
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
    const db = getDb();
    const { game_id, player_id, event_type, event_data } = await request.json();

    if (!game_id || !player_id || !event_type) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: game_id, player_id, event_type' 
        },
        { status: 400 }
      );
    }

    let validGameId = typeof game_id === 'string' && game_id.trim().length > 0
      ? game_id.trim()
      : null;

    if (validGameId) {
      const existingGame = db.prepare<[string], { id: string }>(
        'SELECT id FROM games WHERE id = ?'
      ).get(validGameId);

      if (!existingGame) {
        validGameId = null;
      }
    }

    if (!validGameId) {
      const fallbackGame = db.prepare<[], { id: string }>(
        'SELECT id FROM games ORDER BY created_at ASC LIMIT 1'
      ).get();

      if (!fallbackGame) {
        return NextResponse.json(
          { success: false, error: 'No valid game found for analytics event' },
          { status: 500 }
        );
      }

      validGameId = fallbackGame.id;
    }
    
    const eventId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const eventData = event_data ? JSON.stringify(event_data) : null;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO analytics_events (id, game_id, player_id, event_type, event_data, session_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(eventId, validGameId, player_id, event_type, eventData, null, now);

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
