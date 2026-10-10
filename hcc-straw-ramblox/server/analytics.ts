/**
 * Analytics API Routes
 * 
 * Track and analyze player behavior
 */

import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { getDb } from './database';
import {
  getAnalyticsEvents,
  getAnalyticsSummary,
  createAnalyticsEvent
} from './database-types';
import { generateId } from './database-types';

// Configure for Node.js runtime
export const config = {
  runtime: 'nodejs'
};

/**
 * GET /api/analytics
 * Get analytics summary for a game
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

    // Get summary
    const summary = getAnalyticsSummary(db).get(gameId);

    // Get recent events
    const events = getAnalyticsEvents(db).all(gameId, 100);

    // Calculate retention metrics
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const todayStr = today.toISOString().split('T')[0];
    const sevenDaysStr = sevenDaysAgo.toISOString().split('T')[0];

    const dailyActive = db.prepare(`
      SELECT COUNT(DISTINCT player_id) as count
      FROM analytics_events
      WHERE game_id = ?
      AND DATE(created_at) >= ?
    `).all(gameId, todayStr)[0];

    const weeklyActive = db.prepare(`
      SELECT COUNT(DISTINCT player_id) as count
      FROM analytics_events
      WHERE game_id = ?
      AND DATE(created_at) >= ?
    `).all(gameId, sevenDaysStr)[0];

    return NextResponse.json({
      success: true,
      summary: {
        total_players: summary?.total_players || 0,
        active_today: dailyActive?.count || 0,
        active_week: weeklyActive?.count || 0,
        retention_day1: calculateRetention(events, '1day'),
        retention_day7: calculateRetention(events, '7day'),
        avg_session_duration: calculateAvgSession(events)
      },
      events: events.map(transformEvent),
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics
 * Track an analytics event
 */
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const { game_id, player_id, event_type, event_data, session_id } = await request.json();

    // Validate required fields
    if (!game_id || !player_id || !event_type) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: game_id, player_id, event_type' 
        },
        { status: 400 }
      );
    }

    // Create event
    const eventId = generateId();
    const eventData = event_data ? JSON.stringify(event_data) : null;

    const result = createAnalyticsEvent(db).run(
      eventId,
      game_id,
      player_id,
      event_type,
      eventData,
      session_id || null,
      new Date().toISOString()
    );

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to record event' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event_id: eventId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Track event error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

// Helper functions

function transformEvent(event: any) {
  return {
    id: event.id,
    game_id: event.game_id,
    player_id: event.player_id,
    event_type: event.event_type,
    event_data: event.event_data ? JSON.parse(event.event_data) : null,
    session_id: event.session_id,
    created_at: event.created_at
  };
}

function calculateRetention(events: any[], period: '1day' | '7day'): number {
  if (events.length === 0) return 0;

  const uniqueDays = new Set(events.map(e => e.created_at.split('T')[0]));
  const uniquePlayers = new Set(events.map(e => e.player_id));

  // This is a simplified calculation
  // In production, you'd compare day N vs day N+1
  const total = uniquePlayers.size;
  const active = uniqueDays.size;

  if (total === 0) return 0;
  return Math.round((active / total) * 100);
}

function calculateAvgSession(events: any[]): number {
  // Simplified - in production, you'd track session start/end
  if (events.length === 0) return 0;
  
  const eventsPerPlayer = new Set(events.map(e => e.player_id));
  return Math.round(events.length / eventsPerPlayer.size);
}
