import { preflightResponse, proxyBackend } from '@/lib/backend-proxy'

export const runtime = 'nodejs'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params
  return proxyBackend(request, `/api/projects/${encodeURIComponent(id)}`)
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params
  return proxyBackend(request, `/api/projects/${encodeURIComponent(id)}`)
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params
  return proxyBackend(request, `/api/projects/${encodeURIComponent(id)}`)
}

export const OPTIONS = (request: Request): Response => preflightResponse(request, ['GET', 'PUT', 'DELETE'])
