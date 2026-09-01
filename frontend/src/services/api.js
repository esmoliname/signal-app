/**
 * Signal API Client — all requests target the configured FastAPI backend.
 *
 * The base URL comes EXCLUSIVELY from VITE_API_BASE_URL. We deliberately do NOT
 * fall back to http://localhost:8000 in production: a browser on Vercel cannot
 * reach the developer's machine, so a blind fallback only produces a confusing
 * "Failed to fetch". When no base URL is configured we enter DEMO MODE and serve
 * synthetic data so the UI never hangs on a red error banner.
 */

const RAW_BASE = import.meta.env.VITE_API_BASE_URL || ''
export const BASE = RAW_BASE.replace(/\/$/, '')

// Demo mode: no backend URL configured. In production this is the expected state
// until VITE_API_BASE_URL is set at build time. Returning synthetic data keeps the
// UI usable instead of stuck on a network error.
export const IS_DEMO_MODE = !BASE

export const API_BASE_URL = BASE || '(demo mode — configure VITE_API_BASE_URL)'

// ─── Demo fixtures (only used when no backend is configured) ────────────── //

const DEMO_HEALTH = {
  status: 'ok',
  demo_mode: true,
  message: 'Demo mode — no backend configured. Set VITE_API_BASE_URL to enable real data.',
}

const DEMO_RESEARCH = {
  task_id: 'demo-task',
  is_cached: true,
  topic: 'signal demo',
  key_insights:
    '**Demo mode** - you are seeing synthetic data.\n\n' +
    'No backend base URL is configured for this environment. ' +
    'Set `VITE_API_BASE_URL` when building the frontend so requests ' +
    'reach your deployed FastAPI backend instead of falling back to a demo.\n\n' +
    'This workspace is fully functional — just point it at a real API and rebuild.',
  feeds: [
    {
      id: 'demo-1',
      source: 'reddit',
      title: 'Example feed (demo)',
      url: 'https://example.com',
      published: null,
    },
  ],
}

const DEMO_HISTORY = []

function demoResponse(payload) {
  // Mimic the shape of a successful network round-trip.
  return Promise.resolve(payload)
}

function demoReject(message) {
  // Simulate an immediate, friendly failure for flows that need a real backend.
  return Promise.reject(new Error(message))
}

// ─── Generic fetch with timeout ─────────────────────────────────────────── //
async function call(url, options = {}, timeoutMs = 15_000) {
  const ctrl  = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal })
    clearTimeout(timer)
    return res
  } catch (err) {
    clearTimeout(timer)
    if (err.name === 'AbortError')
      throw new Error(`Timeout (${timeoutMs / 1000}s) al conectar con ${url}`)
    throw new Error(
      `No se pudo conectar al backend (${url}).\n` +
      'Verifica que el servidor API esté corriendo y que VITE_API_BASE_URL apunte a él.\n' +
      `Detalle: ${err.message}`
    )
  }
}

async function json(res) {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try { msg = (await res.json()).detail || msg } catch (_) {}
    throw new Error(msg)
  }
  return res.json()
}

// ─── Endpoints ──────────────────────────────────────────────────────────── //

export async function fetchHealth() {
  if (IS_DEMO_MODE) return demoResponse(DEMO_HEALTH)
  return json(await call(`${BASE}/api/health`))
}

export async function fetchHistory(q = '') {
  if (IS_DEMO_MODE) return demoResponse(DEMO_HISTORY)
  const qs  = q ? `?q=${encodeURIComponent(q)}` : ''
  return json(await call(`${BASE}/api/history${qs}`))
}

export async function createResearch(payload) {
  if (IS_DEMO_MODE) return demoResponse(DEMO_RESEARCH)
  return json(await call(`${BASE}/api/research`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, 20_000))
}

export async function getResearchDetail(taskId) {
  if (IS_DEMO_MODE) return demoResponse({ ...DEMO_RESEARCH, task_id: taskId })
  return json(await call(`${BASE}/api/research/${taskId}`, {}, 10_000))
}

export async function deleteHistoryItem(taskId) {
  // Demo mode has an empty history, so there is nothing to delete.
  if (IS_DEMO_MODE) return demoReject('Demo mode — no backend configured (set VITE_API_BASE_URL).')
  const res = await call(`${BASE}/api/history/${taskId}`, { method: 'DELETE' }, 10_000)
  if (!res.ok && res.status !== 204) throw new Error(`Delete failed: HTTP ${res.status}`)
  return true
}

export async function renameHistoryItem(taskId, newTitle) {
  if (IS_DEMO_MODE) return demoReject('Demo mode — no backend configured (set VITE_API_BASE_URL).')
  return json(await call(`${BASE}/api/history/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: newTitle, topic: newTitle }),
  }, 10_000))
}

export async function sendFollowupChat(taskId, message) {
  if (IS_DEMO_MODE) return demoReject('Demo mode — no backend configured (set VITE_API_BASE_URL).')
  return json(await call(`${BASE}/api/research/${taskId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  }, 30_000))
}

/**
 * Open an SSE connection to the research stream endpoint.
 * Returns the EventSource. On connection error, calls onError(message).
 * EventSource auto-reconnects; onError may fire repeatedly during a transient
 * outage — callers should handle that gracefully.
 *
 * @param {string} taskId
 * @param {(opts: {onError?: Function, onOpen?: Function}) => void} onErrorOrOpts
 *   Backwards-compatible: pass a single onError function, OR an options object
 *   `{ onError, onOpen }`. `onOpen` fires once when the stream opens.
 */
export function openResearchStream(taskId, onErrorOrOpts) {
  const opts = onErrorOrOpts && typeof onErrorOrOpts === 'object'
    ? onErrorOrOpts
    : { onError: onErrorOrOpts }
  const { onError, onOpen } = opts || {}

  // In demo mode there is no real backend to stream from. Return a no-op
  // EventSource that just reports that the stream is "open" so the UI path
  // stays coherent without connecting to a bogus URL.
  if (IS_DEMO_MODE) {
    const url = `${API_BASE_URL}/api/research/${taskId}/stream`
    const noop = {
      url,
      readyState: 0,
      close() {},
      addEventListener() {},
      removeEventListener() {},
    }
    if (typeof onOpen === 'function') setTimeout(() => { try { onOpen() } catch {} }, 0)
    return noop
  }

  const url = `${BASE}/api/research/${taskId}/stream`
  const es  = new EventSource(url)

  es.onopen = () => {
    if (onOpen) onOpen()
  }
  es.onerror = () => {
    if (onError) onError(
      `Conexión SSE perdida (${url}). ` +
      'Verifica que FastAPI esté activo. El resultado se recuperará de la base de datos automáticamente.'
    )
  }
  return es
}
