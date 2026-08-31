import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '../utils/markdown'

describe('renderMarkdown (XSS hardening)', () => {
  it('sanitizes <script> tags from raw HTML', () => {
    const html = renderMarkdown('<script>alert(1)<\/script>')
    // The executable <script> element must be stripped entirely.
    expect(html).not.toMatch(/<script/i)
    expect(html).not.toMatch(/<\/script/i)
  })

  it('neutralizes inline event-handler attributes', () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)">')
    expect(html).not.toMatch(/onerror/i)
  })

  it('neutralizes javascript: URLs in links', () => {
    const html = renderMarkdown('[click](javascript:alert(1))')
    expect(html).not.toMatch(/javascript:/i)
  })

  it('renders safe GFM bold markdown as <strong>', () => {
    const html = renderMarkdown('**bold**')
    expect(html).toContain('<strong>')
    expect(html).toContain('bold')
  })

  it('returns empty string for empty/null/undefined input', () => {
    expect(renderMarkdown('')).toBe('')
    expect(renderMarkdown(null)).toBe('')
    expect(renderMarkdown(undefined)).toBe('')
  })
})
