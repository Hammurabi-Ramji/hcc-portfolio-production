import { preflightResponse, proxyBackend } from '@/lib/backend-proxy'

export const runtime = 'nodejs'

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params
  return proxyBackend(request, `/api/projects/${encodeURIComponent(id)}/activate`)
}

export const OPTIONS = (request: Request): Response => preflightResponse(request, ['PATCH'])
