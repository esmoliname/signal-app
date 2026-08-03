/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#0B0F17',
          card: '#151C28',
          border: '#222D3D',
          hover: '#1C2536',
        },
        amber: {
          warm: '#D97706',
          gold: '#F59E0B',
          glow: 'rgba(245, 158, 11, 0.15)',
        },
        platform: {
          reddit: '#EA580C',
          youtube: '#DC2626',
          hn: '#D97706',
          github: '#64748B',
          tiktok: '#0D9488',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
}
