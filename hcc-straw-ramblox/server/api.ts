/**
 * Ramblox API Routes
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, prompt, style, quality } = body;

    if (!type || !prompt) {
      return NextResponse.json(
        { error: 'Missing type and prompt' },
        { status: 400 }
      );
    }

    const response = {
      success: true,
      asset: {
        id: `asset-${Date.now()}`,
        name: prompt.split(' ').slice(0, 3).join('-'),
        type,
        format: type === 'texture' ? 'png' : 'gltf',
        metadata: { prompt, style, quality }
      },
      estimated_time: 30
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 }
    );
  }
}
