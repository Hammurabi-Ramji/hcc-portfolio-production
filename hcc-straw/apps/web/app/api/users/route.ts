import { proxyBackend, preflightResponse } from '@/lib/backend-proxy'

export const runtime = 'nodejs'
export const GET = (request: Request): Promise<Response> => proxyBackend(request, '/api/users')
export const POST = (request: Request): Promise<Response> => proxyBackend(request, '/api/users')
export const OPTIONS = (request: Request): Response => preflightResponse(request, ['GET', 'POST'])
