import { proxyBackend, preflightResponse } from '@/lib/backend-proxy'

export const runtime = 'nodejs'
export const GET = (request: Request): Promise<Response> => proxyBackend(request, '/api/users/profile')
export const PUT = (request: Request): Promise<Response> => proxyBackend(request, '/api/users/profile')
export const OPTIONS = (request: Request): Response => preflightResponse(request, ['GET', 'PUT'])
