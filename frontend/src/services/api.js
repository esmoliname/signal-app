/**
 * Signal API Client — all requests target FastAPI at http://localhost:8000
 * Uses AbortController timeouts and surfaces human-readable errors.
 */

const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')
export const API_BASE_URL = BASE

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
      'Asegúrate de que FastAPI esté corriendo en http://localhost:8000.\n' +
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
  return json(await call(`${BASE}/api/health`))
}

export async function fetchHistory(q = '') {
  const qs  = q ? `?q=${encodeURIComponent(q)}` : ''
  return json(await call(`${BASE}/api/history${qs}`))
}

export async function createResearch(payload) {
  return json(await call(`${BASE}/api/research`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, 20_000))
}

export async function getResearchDetail(taskId) {
  return json(await call(`${BASE}/api/research/${taskId}`, {}, 10_000))
}

export async function deleteHistoryItem(taskId) {
  const res = await call(`${BASE}/api/history/${taskId}`, { method: 'DELETE' }, 10_000)
  if (!res.ok && res.status !== 204) throw new Error(`Delete failed: HTTP ${res.status}`)
  return true
}

export async function renameHistoryItem(taskId, newTitle) {
  return json(await call(`${BASE}/api/history/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: newTitle, topic: newTitle }),
  }, 10_000))
}

export async function sendFollowupChat(taskId, message) {
  return json(await call(`${BASE}/api/research/${taskId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  }, 30_000))
}

/**
 * Open an SSE connection to the research stream endpoint.
 * Returns the EventSource. On connection error, calls onError(message).
 */
export function openResearchStream(taskId, onError) {
  const url = `${BASE}/api/research/${taskId}/stream`
  const es  = new EventSource(url)
  es.onerror = () => {
    if (onError) onError(
      `Conexión SSE perdida (${url}). ` +
      'Verifica que FastAPI esté activo. El resultado se recuperará de la base de datos automáticamente.'
    )
  }
  return es
}
