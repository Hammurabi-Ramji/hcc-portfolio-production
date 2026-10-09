/**
 * Ramblox API Root - Health Check
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      games: '/api/games',
      analytics: '/api/analytics',
      monetization: '/api/monetization'
    }
  });
}
