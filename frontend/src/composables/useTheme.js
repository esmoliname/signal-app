import { ref, watch } from 'vue'

const isDark = ref(true) // Default to dark mode for Obsidian theme

export function useTheme() {
  // Initialization (should be called once, e.g., in App.vue or Dashboard.vue onMounted)
  function initTheme() {
    const saved = localStorage.getItem('signal_theme')
    if (saved) {
      isDark.value = saved === 'dark'
    } else {
      isDark.value = true // Default dark
    }
    applyTheme()
  }

  function toggleTheme() {
    isDark.value = !isDark.value
    applyTheme()
  }

  function applyTheme() {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('signal_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('signal_theme', 'light')
    }
  }

  return {
    isDark,
    initTheme,
    toggleTheme,
  }
}
