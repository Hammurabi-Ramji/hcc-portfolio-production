import { proxyBackend, preflightResponse } from '@/lib/backend-proxy'

export const runtime = 'nodejs'
export const POST = (request: Request): Promise<Response> => proxyBackend(request, '/api/users/avatar')
export const OPTIONS = (request: Request): Response => preflightResponse(request, ['POST'])
