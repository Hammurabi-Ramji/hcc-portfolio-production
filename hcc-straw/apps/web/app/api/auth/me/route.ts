import { preflightResponse, proxyBackend } from '@/lib/backend-proxy'

export const runtime = 'nodejs'

export async function GET(request: Request): Promise<Response> {
  return proxyBackend(request, '/api/auth/me')
}

export function OPTIONS(request: Request): Response {
  return preflightResponse(request, ['GET'])
}
