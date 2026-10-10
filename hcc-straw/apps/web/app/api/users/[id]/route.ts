import { proxyBackend, preflightResponse } from '@/lib/backend-proxy'

export const runtime = 'nodejs'
export async function GET(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params
  return proxyBackend(request, `/api/users/${encodeURIComponent(id)}`)
}
export const OPTIONS = (request: Request): Response => preflightResponse(request, ['GET'])
