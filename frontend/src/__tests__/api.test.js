import { describe, it, expect, vi, beforeAll } from 'vitest'
import { openResearchStream, API_BASE_URL } from '../services/api.js'

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

  it('still exposes an API_BASE_URL fallback', () => {
    expect(typeof API_BASE_URL).toBe('string')
    expect(API_BASE_URL.length).toBeGreaterThan(0)
  })
})
