<script setup>
import { ref, computed, onMounted } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/tokyo-night-dark.css'
import {
  Shield, Activity, Sparkles, AlertCircle, SlidersHorizontal,
  Download, FileText, Code, RefreshCw,
} from 'lucide-vue-next'

import ResearchForm        from '../components/ResearchForm.vue'
import ResultCard          from '../components/ResultCard.vue'
import SidebarHistory      from '../components/SidebarHistory.vue'
import VectorFluxBackground from '../components/VectorFluxBackground.vue'
import MetricsOverview     from '../components/MetricsOverview.vue'
import FollowupChat        from '../components/FollowupChat.vue'

import { API_BASE_URL, fetchHealth, createResearch, getResearchDetail, openResearchStream } from '../services/api.js'
import { useHistoryStore } from '../stores/historyStore'

// ── Marked config ──────────────────────────────────────────────────────── //
marked.setOptions({
  highlight: (code, lang) => {
    const l = hljs.getLanguage(lang) ? lang : 'plaintext'
    return hljs.highlight(code, { language: l }).value
  },
  langPrefix: 'hljs language-',
  breaks: true,
  gfm: true,
})

const store = useHistoryStore()

// ── State ──────────────────────────────────────────────────────────────── //
const loading      = ref(false)
const progress     = ref(0)
const stepMessage  = ref('')
const result       = ref(null)
const sourceFilter = ref('all')
const health       = ref(null)
const errorMsg     = ref(null)

let activeES = null

// ── Computed ───────────────────────────────────────────────────────────── //
const renderedMd = computed(() =>
  result.value?.key_insights ? marked.parse(result.value.key_insights) : ''
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
}

async function loadDetail(taskId, showSpinner = false) {
  if (activeES) { activeES.close(); activeES = null }
  store.activeTaskId = taskId
  errorMsg.value     = null
  if (showSpinner) { loading.value = true; progress.value = 100; stepMessage.value = 'Cargando expediente…' }
  try {
    result.value = await getResearchDetail(taskId)
  } catch (err) {
    errorMsg.value = err.message
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
  stepMessage.value = 'Iniciando conexión con Signal Intelligence Core…'
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
      // Auto-recover from DB after 900 ms (skill may have finished even if SSE dropped)
      setTimeout(() => loadDetail(data.task_id, false), 900)
    })

    activeES.addEventListener('progress', (e) => {
      const p = JSON.parse(e.data)
      progress.value    = p.progress
      stepMessage.value = p.step
    })

    activeES.addEventListener('complete', async (e) => {
      if (activeES) { activeES.close(); activeES = null }
      const c = JSON.parse(e.data)
      await loadDetail(c.task_id, true)
      await store.loadHistory()
      loading.value = false
    })

  } catch (err) {
    errorMsg.value = err.message
    loading.value  = false
  }
}

// ── Exports ────────────────────────────────────────────────────────────── //
function exportMd() {
  if (!result.value?.key_insights) return
  const a = document.createElement('a')
  a.href     = URL.createObjectURL(new Blob([result.value.key_insights], { type: 'text/markdown' }))
  a.download = `signal-${result.value.topic || 'report'}.md`
  a.click()
}
function exportJson() {
  if (!result.value) return
  const a = document.createElement('a')
  a.href     = URL.createObjectURL(new Blob([JSON.stringify(result.value, null, 2)], { type: 'application/json' }))
  a.download = `signal-${result.value.topic || 'report'}.json`
  a.click()
}

// ── Lifecycle ──────────────────────────────────────────────────────────── //
onMounted(async () => {
  try { health.value = await fetchHealth() } catch (_) {}
  await store.loadHistory()
})
</script>

<template>
  <div class="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans relative overflow-x-hidden">

    <VectorFluxBackground />

    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <header class="border-b border-[#222D3D] glass-panel sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">

        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-lg bg-[#151C28] border border-amber-500/40 flex items-center justify-center">
            <Shield class="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h1 class="text-sm font-bold tracking-wider text-slate-100 uppercase font-mono">SIGNAL</h1>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                LIVE CLI WRAPPER
              </span>
            </div>
            <p class="text-[10px] text-slate-400 font-mono tracking-tight">30-DAY INTELLIGENCE HUB</p>
          </div>
        </div>

        <div class="flex items-center space-x-3 text-xs">
          <div class="hidden sm:flex items-center space-x-2 bg-[#151C28]/90 border border-[#222D3D] px-3 py-1 rounded-md font-mono text-[11px] text-slate-400">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{{ API_BASE_URL }}</span>
          </div>
          <div v-if="health" class="flex items-center space-x-2 px-3 py-1 rounded-md border text-[11px] font-mono bg-[#151C28]/90 border-[#222D3D]">
            <span :class="['relative inline-flex rounded-full h-2 w-2', health.skill?.script_exists ? 'bg-amber-500' : 'bg-red-500']"></span>
            <span :class="health.skill?.script_exists ? 'text-slate-300' : 'text-red-400'">
              {{ health.skill?.script_exists ? 'Skill Ready' : 'Skill Missing' }}
            </span>
          </div>
        </div>

      </div>
    </header>

    <!-- ── Main Layout ─────────────────────────────────────────────────────── -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">

      <!-- Left: Content (3 cols) -->
      <div class="lg:col-span-3 space-y-8">

        <ResearchForm :loading="loading" @submit-research="handleSubmit" />

        <!-- Error banner -->
        <div v-if="errorMsg" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start space-x-3 text-red-400 text-xs font-mono">
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <div class="whitespace-pre-wrap break-all">{{ errorMsg }}</div>
        </div>

        <!-- Progress overlay -->
        <div v-if="loading" class="glass-panel rounded-xl p-6 space-y-4 shadow-xl">
          <div class="flex items-center justify-between text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            <div class="flex items-center space-x-2">
              <Activity class="w-4 h-4 text-amber-500 animate-spin" />
              <span>Pipeline de Inteligencia en Ejecución</span>
            </div>
            <span class="text-amber-400">{{ progress }}%</span>
          </div>
          <div class="w-full bg-[#0B0F17] rounded-full h-2 overflow-hidden border border-[#222D3D]">
            <div class="animate-shimmer h-full transition-all duration-300 rounded-full" :style="{ width: progress + '%' }"></div>
          </div>
          <p class="text-xs text-slate-300 font-mono bg-[#0B0F17]/90 p-3 rounded border border-[#222D3D] flex items-center space-x-2">
            <span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            <span>{{ stepMessage }}</span>
          </p>
        </div>

        <!-- Results -->
        <div v-if="result && !loading" class="space-y-8">

          <MetricsOverview :result="result" />

          <!-- Markdown report -->
          <div class="glass-panel rounded-xl p-6 sm:p-8 shadow-2xl">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#222D3D] mb-6 gap-4">
              <div class="flex items-center space-x-2 text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                <Sparkles class="w-4 h-4" />
                <span>Informe de Inteligencia — Datos Reales</span>
              </div>
              <div class="flex items-center space-x-2">
                <button @click="exportMd"
                  class="px-2.5 py-1 rounded bg-[#0B0F17] border border-[#222D3D] text-slate-300 hover:text-amber-400 hover:border-amber-500/40 text-xs font-mono transition flex items-center space-x-1">
                  <FileText class="w-3.5 h-3.5 text-amber-500" /><span>MD</span>
                </button>
                <button @click="exportJson"
                  class="px-2.5 py-1 rounded bg-[#0B0F17] border border-[#222D3D] text-slate-300 hover:text-amber-400 hover:border-amber-500/40 text-xs font-mono transition flex items-center space-x-1">
                  <Code class="w-3.5 h-3.5 text-cyan-400" /><span>JSON</span>
                </button>
                <button @click="window.print()"
                  class="px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 text-xs font-mono transition flex items-center space-x-1">
                  <Download class="w-3.5 h-3.5 text-amber-400" /><span>PDF</span>
                </button>
              </div>
            </div>
            <div class="markdown-body" v-html="renderedMd"></div>
          </div>

          <!-- Followup chat -->
          <FollowupChat
            :task-id="store.activeTaskId"
            :topic="result.topic"
          />

          <!-- Feed cards -->
          <div class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#222D3D]">
              <h3 class="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                <SlidersHorizontal class="w-4 h-4 text-amber-500" />
                <span>Feeds Detectados ({{ result.feeds?.length || 0 }} resultados)</span>
              </h3>
              <div class="flex flex-wrap gap-1 bg-[#0B0F17]/90 p-1 rounded-md border border-[#222D3D]">
                <button
                  v-for="src in ['all', 'reddit', 'youtube', 'hn', 'github', 'tiktok']"
                  :key="src"
                  @click="sourceFilter = src"
                  :class="[
                    'px-2.5 py-1 rounded text-xs font-mono uppercase tracking-wider transition-all duration-200',
                    sourceFilter === src
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                      : 'text-slate-400 hover:text-slate-200'
                  ]">
                  {{ src === 'all' ? 'Todos' : src }}
                </button>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResultCard v-for="item in filteredFeeds" :key="item.id" :item="item" />
            </div>
            <div v-if="filteredFeeds.length === 0" class="text-center py-8 text-sm text-slate-500 font-mono">
              Sin resultados para la fuente seleccionada.
            </div>
          </div>

        </div>

      </div>

      <!-- Right: Sidebar (1 col) -->
      <div class="lg:col-span-1 h-[650px] sticky top-24">
        <SidebarHistory
          @select-history="(id) => loadDetail(id, false)"
          @new-session="resetSession"
        />
      </div>

    </main>
  </div>
</template>
