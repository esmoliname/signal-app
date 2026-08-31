/**
 * Shared Markdown renderer for the Signal app.
 *
 * Configures `marked` once (GFM, soft breaks, highlight.js code highlighting)
 * and sanitizes the output with DOMPurify before it is inserted via `v-html`.
 *
 * Sanitization is critical: `marked` can emit raw HTML (including <script> or
 * event-handler attributes), and the rendered content can embed user-controlled
 * `topic` text sourced from the backend / last30days skill — an XSS vector.
 */
import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Register only the languages we actually highlight in reports. Importing the
// full `highlight.js` bundles every language (~940 kB raw), which blows up the
// production bundle. Unregistered languages fall back to plaintext in `marked`.
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import sql from 'highlight.js/lib/languages/sql'
import yaml from 'highlight.js/lib/languages/yaml'
import markdown from 'highlight.js/lib/languages/markdown'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('json', json)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('go', go)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('markdown', markdown)

marked.setOptions({
  highlight: (code, lang) => {
    const l = hljs.getLanguage(lang) ? lang : 'plaintext'
    return hljs.highlight(code, { language: l }).value
  },
  langPrefix: 'hljs language-',
  breaks: true,
  gfm: true,
})

// Defense-in-depth: DOMPurify removes dangerous URI schemes in real browsers,
// but we also scrub the serialized output so no environment (browser or test)
// ever leaves an executable javascript:/vbscript:/data: link or image source.
const DANGEROUS_URI_ATTR = /(href|src)\s*=\s*["']\s*(?:javascript|vbscript|data):[^"']*["']/gi

/**
 * Render Markdown to sanitized HTML safe for `v-html`.
 * @param {string|null|undefined} md Markdown source.
 * @returns {string} Sanitized HTML string.
 */
export function renderMarkdown(md) {
  const html = DOMPurify.sanitize(marked.parse(md || ''))
  return html.replace(DANGEROUS_URI_ATTR, '$1=""')
}
