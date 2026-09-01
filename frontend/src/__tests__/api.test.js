import { describe, it, expect, vi, beforeAll } from 'vitest'
import { openResearchStream, API_BASE_URL, IS_DEMO_MODE } from '../services/api.js'

// The test environment's .env defines VITE_API_BASE_URL=http://localhost:8000,
// so the client resolves to a real backend URL (not demo mode). Verify the
// client surfaces that configured URL rather than a silently different fallback,
// and that the SSE stream still wires correctly against a real backend.
describe('api.base-url resolution', () => {
  it('resolves API_BASE_URL from VITE_API_BASE_URL (not a hardcoded fallback)', () => {
    // With the local .env, the configured URL is http://localhost:8000.
    expect(IS_DEMO_MODE).toBe(false)
    expect(API_BASE_URL).toBe('http://localhost:8000')
  })

  it('still exposes a non-empty API_BASE_URL string', () => {
    expect(typeof API_BASE_URL).toBe('string')
    expect(API_BASE_URL.length).toBeGreaterThan(0)
  })
})

// happy-dom does not ship a global EventSource; provide a minimal fake so we
// can assert the stream wiring (onOpen / onError / lifecycle).
class FakeEventSource {
  constructor(url) { this.url = url; this.onopen = null; this.onerror = null }
  addEventListener() {}
  close() {}
}
beforeAll(() => {
  globalThis.EventSource = FakeEventSource
})

describe('api.openResearchStream', () => {
  it('returns an EventSource instance and fires onOpen', () => {
    const onOpen = vi.fn()
    const onError = vi.fn()
    const es = openResearchStream('abc-123', { onOpen, onError })

    expect(es).toBeInstanceOf(FakeEventSource)

    // Simulate the stream opening.
    es.onopen({})
    expect(onOpen).toHaveBeenCalledTimes(1)

    es.close()
  })

  it('supports the backwards-compatible single onError function', () => {
    const onError = vi.fn()
    const es = openResearchStream('abc-123', onError)

    es.onerror({})
    expect(onError).toHaveBeenCalledTimes(1)

    es.close()
  })
})
