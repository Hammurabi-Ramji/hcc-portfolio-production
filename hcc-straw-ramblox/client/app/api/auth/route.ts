import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Authentication endpoints available',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login'
    }
  });
}
