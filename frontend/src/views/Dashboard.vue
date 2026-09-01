<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import 'highlight.js/styles/tokyo-night-dark.css'
import { renderMarkdown } from '../utils/markdown'
import {
  Shield, Activity, Sparkles, AlertCircle, SlidersHorizontal,
  Download, FileText, Code, Sun, Moon, Globe, Menu, X, History
} from 'lucide-vue-next'

import ResearchForm        from '../components/ResearchForm.vue'
import { useToasts } from '../composables/useToasts'
import ResultCard          from '../components/ResultCard.vue'
import SidebarHistory      from '../components/SidebarHistory.vue'
import VectorFluxBackground from '../components/VectorFluxBackground.vue'
import HologramOrbCanvas   from '../components/HologramOrbCanvas.vue'
import MetricsOverview     from '../components/MetricsOverview.vue'
import FollowupChat        from '../components/FollowupChat.vue'

import { API_BASE_URL, IS_DEMO_MODE, fetchHealth, createResearch, getResearchDetail, openResearchStream } from '../services/api.js'
import { useHistoryStore } from '../stores/historyStore'
import { useTheme } from '../composables/useTheme'
import { useI18n } from '../i18n'

// ── i18n & Theme ───────────────────────────────────────────────────────── //
const { isDark, initTheme, toggleTheme } = useTheme()
const { locale, toggleLocale, t } = useI18n()

const store = useHistoryStore()
const { error: toastError } = useToasts()

// ── State ──────────────────────────────────────────────────────────────── //
const loading      = ref(false)
const progress     = ref(0)
const stepMessage  = ref('')
const result       = ref(null)
const sourceFilter = ref('all')
const health       = ref(null)
const errorMsg     = ref(null)
const isMobileDrawerOpen = ref(false)

let activeES = null

// ── Computed ───────────────────────────────────────────────────────────── //
const renderedMd = computed(() =>
  result.value?.key_insights ? renderMarkdown(result.value.key_insights) : ''
)

const filteredFeeds = computed(() => {
  if (!result.value?.feeds) return []
  if (sourceFilter.value === 'all') return result.value.feeds
  return result.value.feeds.filter(f => f.source === sourceFilter.value)
})

// ── Helpers ────────────────────────────────────────────────────────────── //
function resetSession() {
  if (activeES) { activeES.close(); activeES = null }
  store.activeTaskId = null
  result.value       = null
  loading.value      = false
  progress.value     = 0
  stepMessage.value  = ''
  errorMsg.value     = null
  isMobileDrawerOpen.value = false
}

async function loadDetail(taskId, showSpinner = false) {
  if (activeES) { activeES.close(); activeES = null }
  store.activeTaskId = taskId
  errorMsg.value     = null
  isMobileDrawerOpen.value = false // Close drawer on mobile selection
  if (showSpinner) { loading.value = true; progress.value = 100; stepMessage.value = t('loadingRecord') }
  try {
    result.value = await getResearchDetail(taskId)
  } catch (err) {
    errorMsg.value = err.message
    toastError(err.message)
  } finally {
    if (showSpinner) loading.value = false
  }
}

// ── Research submit ────────────────────────────────────────────────────── //
async function handleSubmit(payload) {
  if (activeES) { activeES.close(); activeES = null }

  loading.value     = true
  errorMsg.value    = null
  progress.value    = 5
  stepMessage.value = t('connecting')
  result.value      = null

  try {
    const data = await createResearch(payload)
    store.activeTaskId = data.task_id

    // Cached result → load directly, no SSE needed
    if (data.is_cached) {
      await loadDetail(data.task_id, true)
      loading.value = false
      return
    }

    // Open SSE stream
    activeES = openResearchStream(data.task_id, async (sseErr) => {
      errorMsg.value = sseErr
      loading.value  = false
      // Auto-recover from DB after 900 ms
      setTimeout(() => loadDetail(data.task_id, false), 900)
    })

    activeES.addEventListener('progress', (e) => {
      try {
        const p = JSON.parse(e.data)
        progress.value    = p.progress
        stepMessage.value = p.step
      } catch (_) {
        console.warn('Malformed SSE progress payload ignored:', e.data)
      }
    })

    activeES.addEventListener('complete', async (e) => {
      if (activeES) { activeES.close(); activeES = null }
      let c
      try {
        c = JSON.parse(e.data)
      } catch (_) {
        console.warn('Malformed SSE complete payload — reloading detail from DB.', e.data)
        loading.value = false
        return
      }
      await loadDetail(c.task_id, true)
      await store.loadHistory()
      loading.value = false
    })

  } catch (err) {
    errorMsg.value = err.message
    loading.value  = false
    toastError(err.message)
  }
}

// ── Exports ────────────────────────────────────────────────────────────── //
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href    = url
  a.download = filename
  a.click()
  // Safe to revoke immediately after the click is dispatched.
  URL.revokeObjectURL(url)
}

function handlePrint() {
  window.print()
}

function exportMd() {
  if (!result.value?.key_insights) return
  triggerDownload(
    new Blob([result.value.key_insights], { type: 'text/markdown' }),
    `signal-${result.value.topic || 'report'}.md`
  )
}
function exportJson() {
  if (!result.value) return
  triggerDownload(
    new Blob([JSON.stringify(result.value, null, 2)], { type: 'application/json' }),
    `signal-${result.value.topic || 'report'}.json`
  )
}

// ── Lifecycle ──────────────────────────────────────────────────────────── //
onMounted(async () => {
  initTheme()
  try { health.value = await fetchHealth() } catch (_) {}
  await store.loadHistory()
})

// Prevent EventSource leak when navigating away mid-stream.
onUnmounted(() => {
  if (activeES) { activeES.close(); activeES = null }
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col font-sans relative overflow-x-hidden transition-colors duration-300">

    <VectorFluxBackground />
    
    <!-- Hologram placed behind the top search/metrics area -->
    <!-- Responsive scale via CSS and JS -->
    <div class="absolute top-0 left-0 w-full h-[600px] pointer-events-none z-0">
      <HologramOrbCanvas />
    </div>

    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <header class="border-b border-slate-200 dark:border-[#222D3D] bg-white/70 dark:bg-[#151C28]/80 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">

        <div class="flex items-center space-x-3">
          <!-- Mobile Drawer Toggle -->
          <button @click="isMobileDrawerOpen = true" :aria-label="t('open_menu')" class="lg:hidden p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1C2536] transition-colors">
            <Menu class="w-5 h-5" />
          </button>
          
          <div class="w-8 h-8 rounded-lg bg-white dark:bg-[#151C28] border border-slate-200 dark:border-amber-500/40 hidden sm:flex items-center justify-center shadow-sm">
            <Shield class="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h1 class="text-sm font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase font-mono">SIGNAL</h1>
              <span class="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
                {{ t('live_cli_wrapper') }}
              </span>
            </div>
            <p class="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-tight hidden sm:block">{{ t('30day_hub') }}</p>
          </div>
        </div>

        <div class="flex items-center space-x-2 sm:space-x-3 text-xs">
          <!-- i18n Toggle -->
          <button @click="toggleLocale" :aria-label="t('toggle_language')" class="flex items-center space-x-1 bg-slate-100 dark:bg-[#151C28]/90 border border-slate-200 dark:border-[#222D3D] px-2 py-1.5 sm:py-1 rounded-md font-mono text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#1C2536] transition-colors shadow-sm">
            <Globe class="w-3.5 h-3.5" />
            <span>{{ locale }}</span>
          </button>

          <!-- Theme Toggle -->
          <button @click="toggleTheme" :aria-label="t('toggle_theme')" :aria-pressed="isDark" class="flex items-center space-x-1 bg-slate-100 dark:bg-[#151C28]/90 border border-slate-200 dark:border-[#222D3D] px-2 py-1.5 sm:py-1 rounded-md font-mono text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#1C2536] transition-colors shadow-sm">
            <Sun v-if="isDark" class="w-3.5 h-3.5 text-amber-400" />
            <Moon v-else class="w-3.5 h-3.5 text-indigo-500" />
          </button>

          <div class="hidden md:flex items-center space-x-2 bg-slate-100 dark:bg-[#151C28]/90 border border-slate-200 dark:border-[#222D3D] px-3 py-1 rounded-md font-mono text-[11px] text-slate-600 dark:text-slate-400 transition-colors shadow-sm">
            <span :class="['relative flex h-2 w-2', IS_DEMO_MODE ? 'bg-amber-400' : 'bg-emerald-400']">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" :class="IS_DEMO_MODE ? 'bg-amber-400' : 'bg-emerald-400'"></span>
              <span class="relative inline-flex rounded-full h-2 w-2" :class="IS_DEMO_MODE ? 'bg-amber-500' : 'bg-emerald-500'"></span>
            </span>
            <span v-if="IS_DEMO_MODE" class="text-amber-600 dark:text-amber-400 font-bold">{{ t('demo_mode') }}</span>
            <span v-else>{{ API_BASE_URL }}</span>
          </div>
          <div v-if="health" class="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-md border text-[11px] font-mono bg-slate-100 dark:bg-[#151C28]/90 border-slate-200 dark:border-[#222D3D] transition-colors shadow-sm">
            <span :class="['relative inline-flex rounded-full h-2 w-2', health.skill?.script_exists ? 'bg-amber-500' : 'bg-red-500']"></span>
            <span :class="health.skill?.script_exists ? 'text-slate-600 dark:text-slate-300' : 'text-red-500 dark:text-red-400'">
              {{ health.skill?.script_exists ? t('status_skill_ready') : t('status_skill_missing') }}
            </span>
          </div>
        </div>

      </div>
    </header>

    <!-- ── Main Layout ─────────────────────────────────────────────────────── -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8 relative z-10">

      <!-- Left: Content (3 cols) -->
      <div class="lg:col-span-3 space-y-6 sm:space-y-8 min-w-0">

        <ResearchForm :loading="loading" @submit-research="handleSubmit" />

        <!-- Error banner -->
        <div v-if="errorMsg" class="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-4 flex items-start space-x-3 text-red-600 dark:text-red-400 text-xs font-mono transition-colors">
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <div class="whitespace-pre-wrap break-all">{{ errorMsg }}</div>
        </div>

        <!-- Progress overlay -->
        <div v-if="loading" class="bg-white/70 dark:bg-[#0B0F17]/70 backdrop-blur-md rounded-xl p-5 sm:p-6 space-y-4 shadow-sm dark:shadow-xl border border-slate-200 dark:border-[#222D3D] transition-colors">
          <div class="flex items-center justify-between text-xs font-mono font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            <div class="flex items-center space-x-2">
              <Activity class="w-4 h-4 text-amber-500 animate-spin" />
              <span class="truncate">{{ t('pipelineRunning') }}</span>
            </div>
            <span class="text-amber-500 dark:text-amber-400 ml-2">{{ progress }}%</span>
          </div>
          <div class="w-full bg-slate-100 dark:bg-[#0B0F17] rounded-full h-2 overflow-hidden border border-slate-200 dark:border-[#222D3D]">
            <div class="bg-gradient-to-r from-amber-400 to-amber-600 h-full transition-all duration-300 rounded-full" :style="{ width: progress + '%' }"></div>
          </div>
          <p class="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-mono bg-white dark:bg-[#0B0F17]/90 p-3 rounded border border-slate-200 dark:border-[#222D3D] flex items-center space-x-2 transition-colors">
            <span class="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0"></span>
            <span class="truncate">{{ stepMessage }}</span>
          </p>
        </div>

        <!-- Results -->
        <div v-if="result && !loading" class="space-y-6 sm:space-y-8">

          <MetricsOverview :result="result" />

          <!-- Markdown report -->
          <div class="bg-white/80 dark:bg-[#151C28]/80 backdrop-blur-md rounded-xl p-5 sm:p-8 shadow-sm dark:shadow-2xl border border-slate-200 dark:border-[#222D3D] transition-colors overflow-hidden">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-[#222D3D] mb-6 gap-4">
              <div class="flex items-center space-x-2 text-[11px] sm:text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                <Sparkles class="w-4 h-4 shrink-0" />
                <span>{{ t('real_data_badge') }}</span>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <button @click="exportMd"
                  class="px-2 py-1 rounded bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-[#222D3D] text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-400 dark:hover:border-amber-500/40 text-[10px] sm:text-xs font-mono transition flex items-center space-x-1 shadow-sm">
                  <FileText class="w-3.5 h-3.5 text-amber-500" /><span>{{ t('export_md') }}</span>
                </button>
                <button @click="exportJson"
                  class="px-2 py-1 rounded bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-[#222D3D] text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-400 dark:hover:border-cyan-500/40 text-[10px] sm:text-xs font-mono transition flex items-center space-x-1 shadow-sm">
                  <Code class="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" /><span>{{ t('export_json') }}</span>
                </button>
                <button @click="handlePrint"
                  class="px-2 py-1 rounded bg-amber-100 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-500/25 text-[10px] sm:text-xs font-mono transition flex items-center space-x-1 shadow-sm">
                  <Download class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /><span>{{ t('export_pdf') }}</span>
                </button>
              </div>
            </div>
            <div class="markdown-body dark:markdown-body-dark overflow-x-auto" v-html="renderedMd"></div>
          </div>

          <!-- Followup chat -->
          <FollowupChat
            :task-id="store.activeTaskId"
            :topic="result.topic"
          />

          <!-- Feed cards -->
          <div class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-[#222D3D]">
              <h3 class="text-xs sm:text-sm font-bold font-mono text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                <SlidersHorizontal class="w-4 h-4 text-amber-500 shrink-0" />
                <span>{{ t('detected_feeds') }} ({{ result.feeds?.length || 0 }})</span>
              </h3>
              <div class="flex flex-wrap gap-1 bg-white dark:bg-[#0B0F17]/90 p-1 rounded-md border border-slate-200 dark:border-[#222D3D] shadow-sm">
                <button
                  v-for="src in ['all', 'reddit', 'youtube', 'hn', 'github', 'tiktok']"
                  :key="src"
                  @click="sourceFilter = src"
                  :class="[
                    'px-2 py-1 sm:px-2.5 sm:py-1 rounded text-[10px] sm:text-xs font-mono uppercase tracking-wider transition-all duration-200',
                    sourceFilter === src
                      ? 'bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent'
                  ]">
                  {{ src === 'all' ? t('allSources') : src }}
                </button>
              </div>
            </div>
            
            <!-- Mobile reflow: 1 col on small, 2 col on md -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResultCard v-for="item in filteredFeeds" :key="item.id" :item="item" />
            </div>
            
            <div v-if="filteredFeeds.length === 0" class="text-center py-8 text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-mono">
              {{ t('noSourceResults') }}
            </div>
          </div>

        </div>

      </div>

      <!-- Desktop Right: Sidebar (1 col) -->
      <div class="hidden lg:block lg:col-span-1 h-[650px] sticky top-24">
        <SidebarHistory
          @select-history="(id) => loadDetail(id, false)"
          @new-session="resetSession"
        />
      </div>

    </main>

    <!-- Mobile Drawer for Sidebar History -->
    <!-- Backdrop -->
    <div v-if="isMobileDrawerOpen" 
         @click="isMobileDrawerOpen = false"
         class="lg:hidden fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-50 transition-opacity">
    </div>
    
    <!-- Drawer Panel -->
    <div :class="[
      'lg:hidden fixed inset-y-0 left-0 w-4/5 max-w-sm z-50 transform transition-transform duration-300 ease-in-out shadow-2xl bg-slate-50 dark:bg-[#0B0F17]',
      isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
    ]">
      <div class="h-full flex flex-col p-4">
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center space-x-2 text-amber-600 dark:text-amber-500">
            <History class="w-5 h-5" />
            <span class="font-mono font-bold uppercase tracking-wider text-xs">{{ t('records_title') }}</span>
          </div>
          <button @click="isMobileDrawerOpen = false" :aria-label="t('close_menu')" class="p-1.5 rounded-md text-slate-500 hover:bg-slate-200 dark:hover:bg-[#1C2536] transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="flex-1 overflow-hidden h-full">
          <SidebarHistory
            @select-history="(id) => loadDetail(id, false)"
            @new-session="resetSession"
          />
        </div>
      </div>
    </div>

  </div>
</template>

<style>
/* Adjust markdown styling within container */
.markdown-body {
  color: #334155;
}
.dark .markdown-body {
  color: #F8FAFC;
}
/* Ensure table scroll doesn't break layout on mobile */
.markdown-body table {
  display: block;
  overflow-x: auto;
  white-space: nowrap;
}
</style>
