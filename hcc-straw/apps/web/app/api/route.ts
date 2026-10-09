import { preflightResponse, proxyBackend } from '@/lib/backend-proxy'

export const runtime = 'nodejs'

// Bare /api has no service-info contract: preserve the backend's structured 404.
async function unsupportedResource(request: Request): Promise<Response> {
  return proxyBackend(request, '/api')
}

export { unsupportedResource as GET, unsupportedResource as HEAD,
  unsupportedResource as POST, unsupportedResource as PUT,
  unsupportedResource as PATCH, unsupportedResource as DELETE }

export function OPTIONS(request: Request): Response {
  return preflightResponse(request, ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'])
}
