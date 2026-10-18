import { preflightResponse, proxyBackend } from '@/lib/backend-proxy'

export const runtime = 'nodejs'

export async function POST(request: Request): Promise<Response> {
  return proxyBackend(request, '/api/auth/forgot-password')
}

export function OPTIONS(request: Request): Response {
  return preflightResponse(request, ['POST'])
}
