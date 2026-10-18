/**
 * Server-only loopback proxy. Origin, env vars, and path allowlist:
 * see ./API_CONTRACT.md (STACK-F021).
 */
import 'server-only'
import type { ApiFailure } from '../types'

/** Route owners provide a constant path; request query parameters are preserved. */
export type BackendPath = '/api' | '/api/users' | '/api/projects' |
  `/api/auth/${string}` | `/api/users/${string}` | `/api/projects/${string}`

function failure(status: number, code: string, message: string): Response {
  const body: ApiFailure = { success: false, error: { code, message, status } }
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

function localWebOrigin(): string {
  const configured = process.env.STRAW_WEB_ORIGIN || 'http://localhost:3000'
  const url = new URL(configured)
  if (!['http:', 'https:'].includes(url.protocol) ||
      !['localhost', '127.0.0.1'].includes(url.hostname) ||
      url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Invalid local web origin')
  }
  return url.origin
}

/** One credentialed CORS policy; authorization still belongs to the backend. */
function withCors(request: Request, response: Response, origin?: string): Response {
  response.headers.append('Vary', 'Origin')
  if (origin && request.headers.get('origin') === origin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  return response
}

/** Supply implemented methods, excluding OPTIONS; Next also implements HEAD for GET. */
export function preflightResponse(request: Request, methods: readonly string[]): Response {
  const respond = (response: Response, origin?: string): Response => {
    response.headers.append('Vary', 'Access-Control-Request-Method, Access-Control-Request-Headers')
    return withCors(request, response, origin)
  }
  let origin: string
  try {
    origin = localWebOrigin()
  } catch {
    return respond(failure(503, 'SERVICE_UNAVAILABLE', 'The local API configuration is unavailable.'))
  }
  const allowedMethods = [...new Set([...methods, ...(methods.includes('GET') ? ['HEAD'] : []), 'OPTIONS'])]
  const requestedMethod = request.headers.get('access-control-request-method')
  const requestedHeaders = request.headers.get('access-control-request-headers')
  const headersAllowed = requestedHeaders === null || requestedHeaders.split(',').every(
    header => ['accept', 'content-type'].includes(header.trim().toLowerCase()),
  )
  if (request.headers.get('origin') !== origin || !requestedMethod ||
      !allowedMethods.includes(requestedMethod) || !headersAllowed) {
    return respond(failure(403, 'FORBIDDEN_PREFLIGHT', 'This preflight request is not permitted.'))
  }
  return respond(new Response(null, {
    status: 204,
    headers: {
      'Cache-Control': 'no-store',
      'Allow': allowedMethods.join(', '),
      'Access-Control-Allow-Methods': allowedMethods.join(', '),
      'Access-Control-Allow-Headers': 'Accept, Content-Type',
    },
  }), origin)
}

/**
 * Server-only fixed-loopback bridge for Next route handlers (Node runtime).
 * STRAW_API_PORT defaults to 3001. STRAW_WEB_ORIGIN defaults to
 * http://localhost:3000; a configured localhost/127.0.0.1 HTTP(S) origin must
 * match exactly. No browser-supplied host, authorization or forwarding headers.
 */
export async function proxyBackend(request: Request, path: BackendPath): Promise<Response> {
  let origin: string
  try {
    origin = localWebOrigin()
  } catch {
    return withCors(request, failure(503, 'SERVICE_UNAVAILABLE', 'The local API configuration is unavailable.'))
  }
  const respond = (response: Response): Response => withCors(request, response, origin)
  if (!/^\/api(?:\/(?:auth|users|projects)(?:\/[A-Za-z0-9_-]+)*)?$/.test(path)) {
    return respond(failure(400, 'INVALID_PROXY_PATH', 'Invalid local API path.'))
  }
  let destination: URL
  try {
    const port = process.env.STRAW_API_PORT || '3001'
    if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) throw new Error('Invalid port')
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.headers.get('origin') !== origin) {
      return respond(failure(403, 'FORBIDDEN_ORIGIN', 'This request requires the configured local web origin.'))
    }
    destination = new URL(`http://127.0.0.1:${port}${path}`)
    destination.search = new URL(request.url).search
  } catch {
    return respond(failure(503, 'SERVICE_UNAVAILABLE', 'The local API configuration is unavailable.'))
  }

  const headers = new Headers()
  for (const name of ['content-type', 'cookie', 'origin']) {
    const value = request.headers.get(name)
    if (value !== null) headers.set(name, value)
  }
  let body: ArrayBuffer | undefined
  try {
    if (!['GET', 'HEAD'].includes(request.method)) body = await request.arrayBuffer()
  } catch {
    return respond(failure(400, 'INVALID_REQUEST', 'The request body could not be read.'))
  }
  try {
    const backend = await fetch(destination, {
      method: request.method, headers, body, redirect: 'manual', cache: 'no-store',
      signal: AbortSignal.timeout(30000),
    })
    const responseHeaders = new Headers({ 'Cache-Control': 'no-store' })
    const contentType = backend.headers.get('content-type')
    if (contentType) responseHeaders.set('content-type', contentType)
    const cookies = typeof backend.headers.getSetCookie === 'function'
      ? backend.headers.getSetCookie()
      : [backend.headers.get('set-cookie')].filter((cookie): cookie is string => cookie !== null)
    for (const cookie of cookies) responseHeaders.append('set-cookie', cookie)
    return respond(new Response(backend.body, { status: backend.status, headers: responseHeaders }))
  } catch {
    return respond(failure(503, 'SERVICE_UNAVAILABLE', 'The local API service could not be reached.'))
  }
}
