/**
 * Exercises the Next proxy in front of the local Rust API:
 * login, reload, logout, forged and expired cookies, wrong-owner reads,
 * and a project that remains after the API process restarts.
 */
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import net from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const webRoot = path.resolve(import.meta.dirname, '..')
const apiRoot = path.resolve(webRoot, '..', 'api')
const databaseDir = path.join(tmpdir(), `straw-session-${process.pid}`)
mkdirSync(databaseDir, { recursive: true })
const database = path.join(databaseDir, 'session.sqlite3')

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      server.close(() => resolve(port))
    })
  })
}

function start(command, args, env, cwd) {
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
  let output = ''
  child.stdout.on('data', (chunk) => { output += chunk })
  child.stderr.on('data', (chunk) => { output += chunk })
  return { child, output: () => output }
}

async function waitFor(url, child, readOutput) {
  const deadline = Date.now() + 120000
  let last = ''
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`process exited ${child.exitCode}\n${readOutput()}`)
    try {
      const response = await fetch(url, { redirect: 'manual' })
      if (response.status < 500) return
      last = `${response.status}`
    } catch (error) {
      last = error instanceof Error ? error.message : String(error)
    }
    await delay(250)
  }
  throw new Error(`timed out waiting for ${url}: ${last}\n${readOutput()}`)
}

function cookieFrom(response) {
  const raw = response.headers.getSetCookie?.() ?? []
  const line = raw.find((value) => value.startsWith('straw_session='))
  if (!line) throw new Error(`missing straw_session: ${raw.join(' | ')}`)
  return line.split(';')[0]
}

async function request(base, origin, method, resource, { cookie, body } = {}) {
  const response = await fetch(new URL(resource, base), {
    method,
    redirect: 'manual',
    headers: {
      origin,
      accept: 'application/json',
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch { json = { raw: text } }
  return { status: response.status, json, cookie: cookieFromSafe(response) }
}

function cookieFromSafe(response) {
  try { return cookieFrom(response) } catch { return null }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const apiPort = await freePort()
const webPort = await freePort()
const origin = `http://127.0.0.1:${webPort}`
const cargo = path.join(process.env.USERPROFILE || '', '.cargo', 'bin', process.platform === 'win32' ? 'cargo.exe' : 'cargo')
const api = start(cargo, ['run', '--offline', '--locked', '--quiet', '--manifest-path', path.join(apiRoot, 'Cargo.toml')], {
  STRAW_API_PORT: String(apiPort),
  STRAW_API_DATABASE: database,
  STRAW_WEB_ORIGIN: origin,
}, apiRoot)
const web = start(process.execPath, [path.join(webRoot, 'node_modules', 'next', 'dist', 'bin', 'next'), 'start', '--port', String(webPort), '--hostname', '127.0.0.1'], {
  NEXT_TELEMETRY_DISABLED: '1',
  STRAW_API_PORT: String(apiPort),
  STRAW_WEB_ORIGIN: origin,
}, webRoot)

let failed = null
try {
  await waitFor(`http://127.0.0.1:${apiPort}/api/auth/me`, api.child, api.output)
  await waitFor(`${origin}/login`, web.child, web.output)

  const registered = await request(origin, origin, 'POST', '/api/auth/register', {
    body: { email: 'owner@example.test', password: 'long-enough-password', username: 'owner' },
  })
  assert(registered.status === 201, `register ${registered.status} ${JSON.stringify(registered.json)}`)
  assert(registered.cookie?.startsWith('straw_session='), 'register did not set straw_session')

  const reloaded = await request(origin, origin, 'GET', '/api/auth/me', { cookie: registered.cookie })
  assert(reloaded.status === 200 && reloaded.json?.data?.email === 'owner@example.test', `reload ${reloaded.status}`)

  const created = await request(origin, origin, 'POST', '/api/projects', {
    cookie: registered.cookie,
    body: { name: 'Boundary project', description: 'durable', status: 'active' },
  })
  assert(created.status === 201, `create ${created.status} ${JSON.stringify(created.json)}`)
  const projectId = created.json?.data?.id
  assert(typeof projectId === 'string' && projectId.length === 64, 'project id')

  const other = await request(origin, origin, 'POST', '/api/auth/register', {
    body: { email: 'other@example.test', password: 'long-enough-password', username: 'other' },
  })
  assert(other.status === 201 && other.cookie, `other register ${other.status}`)
  const denied = await request(origin, origin, 'GET', `/api/projects/${projectId}`, { cookie: other.cookie })
  assert(denied.status === 403 && denied.json?.error?.code === 'FORBIDDEN', `wrong owner ${denied.status} ${JSON.stringify(denied.json)}`)

  const loggedOut = await request(origin, origin, 'POST', '/api/auth/logout', { cookie: registered.cookie })
  assert(loggedOut.status === 200, `logout ${loggedOut.status} ${JSON.stringify(loggedOut.json)}`)
  const afterLogout = await request(origin, origin, 'GET', '/api/auth/me', { cookie: registered.cookie })
  assert(afterLogout.status === 401, `post-logout reload ${afterLogout.status}`)

  const forged = await request(origin, origin, 'GET', '/api/auth/me', { cookie: 'straw_session=forged' })
  assert(forged.status === 401 && forged.json?.error?.code === 'UNAUTHORIZED', `forged ${forged.status}`)

  const login = await request(origin, origin, 'POST', '/api/auth/login', {
    body: { email: 'owner@example.test', password: 'long-enough-password' },
  })
  assert(login.status === 200 && login.cookie, `login ${login.status}`)
  const { spawnSync } = await import('node:child_process')
  const expired = spawnSync('python', ['-c', 'import sqlite3,sys; c=sqlite3.connect(sys.argv[1]); c.execute("UPDATE sessions SET expires_at=0"); c.commit()', database], { encoding: 'utf8' })
  if (expired.status !== 0) throw new Error(`could not expire session: ${expired.stderr || expired.stdout}`)
  const expiredMe = await request(origin, origin, 'GET', '/api/auth/me', { cookie: login.cookie })
  assert(expiredMe.status === 401, `expired ${expiredMe.status} ${JSON.stringify(expiredMe.json)}`)

  const again = await request(origin, origin, 'POST', '/api/auth/login', {
    body: { email: 'owner@example.test', password: 'long-enough-password' },
  })
  assert(again.status === 200 && again.cookie, 'relogin before restart')
  api.child.kill()
  await new Promise((resolve) => api.child.once('exit', resolve))
  const restarted = start(cargo, ['run', '--offline', '--locked', '--quiet', '--manifest-path', path.join(apiRoot, 'Cargo.toml')], {
    STRAW_API_PORT: String(apiPort),
    STRAW_API_DATABASE: database,
    STRAW_WEB_ORIGIN: origin,
  }, apiRoot)
  await waitFor(`http://127.0.0.1:${apiPort}/api/auth/me`, restarted.child, restarted.output)
  const durable = await request(origin, origin, 'GET', `/api/projects/${projectId}`, { cookie: again.cookie })
  assert(durable.status === 200 && durable.json?.data?.name === 'Boundary project', `restart read ${durable.status} ${JSON.stringify(durable.json)}`)
  restarted.child.kill()
  console.log('session boundary passed')
} catch (error) {
  failed = error
  console.error(failed instanceof Error ? failed.stack : failed)
  console.error('--- api ---')
  console.error(api.output())
  console.error('--- web ---')
  console.error(web.output())
} finally {
  api.child.kill()
  web.child.kill()
}
if (failed) process.exit(1)
