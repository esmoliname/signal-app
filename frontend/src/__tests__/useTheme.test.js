import { describe, it, expect, beforeEach } from 'vitest'
import { useTheme } from '../composables/useTheme'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ''
})

describe('useTheme', () => {
  it('defaults to dark when nothing is saved', () => {
    const { initTheme, isDark } = useTheme()
    initTheme()
    expect(isDark.value).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('restores a saved light theme', () => {
    localStorage.setItem('signal_theme', 'light')
    const { initTheme, isDark } = useTheme()
    initTheme()
    expect(isDark.value).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('toggleTheme flips state and persists to localStorage', () => {
    const { initTheme, toggleTheme, isDark } = useTheme()
    initTheme()
    expect(isDark.value).toBe(true)

    toggleTheme()
    expect(isDark.value).toBe(false)
    expect(localStorage.getItem('signal_theme')).toBe('light')

    toggleTheme()
    expect(isDark.value).toBe(true)
    expect(localStorage.getItem('signal_theme')).toBe('dark')
  })
})
