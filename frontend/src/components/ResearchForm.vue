<script setup>
import { ref } from 'vue'
import { Search, RefreshCw, Layers, Calendar, Sparkles, Plus, X } from 'lucide-vue-next'

const props = defineProps({
  loading: Boolean
})

const emit = defineEmits(['submit-research', 'switch-tab'])

// Multi-Tab state
const tabs = ref([
  { id: 'tab-1', title: 'Investigación 1', topic: '', active: true }
])
const activeTabId = ref('tab-1')
const topic = ref('')

const selectedSources = ref(['reddit', 'youtube', 'hn', 'github'])
const days = ref(30)
const forceRefresh = ref(false)

const availableSources = [
  { id: 'reddit', label: 'Reddit', code: 'RD', activeClass: 'bg-[#EA580C]/15 border-[#EA580C]/50 text-[#EA580C] shadow-[0_0_12px_rgba(234,88,12,0.15)]' },
  { id: 'youtube', label: 'YouTube', code: 'YT', activeClass: 'bg-[#DC2626]/15 border-[#DC2626]/50 text-[#DC2626] shadow-[0_0_12px_rgba(220,38,38,0.15)]' },
  { id: 'hn', label: 'Hacker News', code: 'HN', activeClass: 'bg-[#D97706]/15 border-[#D97706]/50 text-[#D97706] shadow-[0_0_12px_rgba(217,119,6,0.15)]' },
  { id: 'github', label: 'GitHub', code: 'GH', activeClass: 'bg-[#64748B]/15 border-[#64748B]/50 text-slate-200 shadow-[0_0_12px_rgba(100,116,139,0.15)]' },
  { id: 'tiktok', label: 'TikTok', code: 'TT', activeClass: 'bg-[#0D9488]/15 border-[#0D9488]/50 text-[#0D9488] shadow-[0_0_12px_rgba(13,148,136,0.15)]' },
]

function toggleSource(id) {
  if (selectedSources.value.includes(id)) {
    if (selectedSources.value.length > 1) {
      selectedSources.value = selectedSources.value.filter(s => s !== id)
    }
  } else {
    selectedSources.value.push(id)
  }
}

function addTab() {
  const newId = `tab-${Date.now()}`
  const newTab = { id: newId, title: `Consulta ${tabs.value.length + 1}`, topic: '', active: true }
  tabs.value.forEach(t => t.active = false)
  tabs.value.push(newTab)
  activeTabId.value = newId
  topic.value = ''
}

function switchTab(tabId) {
  tabs.value.forEach(t => t.active = (t.id === tabId))
  activeTabId.value = tabId
  const current = tabs.value.find(t => t.id === tabId)
  if (current) {
    topic.value = current.topic
  }
}

function removeTab(tabId, event) {
  event.stopPropagation()
  if (tabs.value.length === 1) return
  tabs.value = tabs.value.filter(t => t.id !== tabId)
  if (activeTabId.value === tabId) {
    switchTab(tabs.value[0].id)
  }
}

function handleSubmit() {
  if (!topic.value.trim() || props.loading) return
  
  // Update active tab title
  const current = tabs.value.find(t => t.id === activeTabId.value)
  if (current) {
    current.topic = topic.value.trim()
    current.title = topic.value.trim()
  }

  emit('submit-research', {
    topic: topic.value.trim(),
    sources: [...selectedSources.value],
    days: days.value,
    force_refresh: forceRefresh.value
  })
}
</script>

<template>
  <div class="glass-panel rounded-xl p-6 shadow-2xl relative z-10 transition-all duration-300">
    
    <!-- Multi-Tab Comparator Header -->
    <div class="flex items-center space-x-2 mb-4 overflow-x-auto pb-1 border-b border-[#222D3D]">
      <button
        v-for="t in tabs"
        :key="t.id"
        type="button"
        @click="switchTab(t.id)"
        :class="[
          'px-3 py-1.5 rounded-t-lg text-xs font-mono border transition-all duration-200 flex items-center space-x-2 shrink-0',
          t.active
            ? 'bg-[#0B0F17] border-amber-500/50 text-amber-400 border-b-transparent font-semibold shadow-[0_-2px_10px_rgba(217,119,6,0.1)]'
            : 'bg-[#151C28]/60 border-[#222D3D] text-slate-400 hover:text-slate-200'
        ]"
      >
        <span class="truncate max-w-[120px]">{{ t.title }}</span>
        <X
          v-if="tabs.length > 1"
          @click="removeTab(t.id, $event)"
          class="w-3 h-3 text-slate-500 hover:text-red-400 transition ml-1"
        />
      </button>

      <button
        type="button"
        @click="addTab"
        class="p-1.5 rounded-lg border border-[#222D3D] bg-[#0B0F17]/60 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 transition flex items-center justify-center shrink-0"
        title="Abrir nueva pestaña comparadora"
      >
        <Plus class="w-3.5 h-3.5" />
      </button>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      
      <!-- Search Input with Glow Effect -->
      <div class="relative group">
        <div class="flex items-center bg-[#0B0F17] rounded-lg border border-[#222D3D] focus-within:border-amber-500/80 focus-within:ring-1 focus-within:ring-amber-500/40 focus-within:shadow-[0_0_20px_rgba(217,119,6,0.15)] transition-all duration-300">
          <Search class="w-5 h-5 text-slate-400 ml-4 shrink-0" />
          <input
            v-model="topic"
            type="text"
            placeholder="Ingrese tema o tecnología para análisis de inteligencia (ej: FastAPI, PyTorch, Agentic AI...)"
            class="w-full bg-transparent px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none text-sm sm:text-base font-sans"
            :disabled="loading"
            required
          />
          <button
            type="submit"
            :disabled="loading || !topic.trim()"
            class="mr-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold rounded-md shadow-lg shadow-amber-600/20 flex items-center space-x-2 transition-all duration-300 text-xs tracking-wider uppercase"
          >
            <RefreshCw v-if="loading" class="w-3.5 h-3.5 animate-spin" />
            <Sparkles v-else class="w-3.5 h-3.5" />
            <span>{{ loading ? 'Ejecutando...' : 'Investigar' }}</span>
          </button>
        </div>
      </div>

      <!-- Controls & Selectors -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
        
        <!-- Platform Chips Selector -->
        <div>
          <label class="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
            <Layers class="w-3.5 h-3.5 text-amber-500" />
            <span>Fuentes de Inteligencia</span>
          </label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="src in availableSources"
              :key="src.id"
              type="button"
              @click="toggleSource(src.id)"
              :class="[
                'px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all duration-200 flex items-center space-x-1.5',
                selectedSources.includes(src.id)
                  ? src.activeClass
                  : 'bg-[#0B0F17]/80 border-[#222D3D] text-slate-400 hover:border-slate-700 hover:text-slate-200'
              ]"
            >
              <span class="font-mono text-[10px] opacity-60">{{ src.code }}</span>
              <span>{{ src.label }}</span>
            </button>
          </div>
        </div>

        <!-- Days Selector -->
        <div>
          <label class="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
            <Calendar class="w-3.5 h-3.5 text-amber-500" />
            <span>Frescura Temporal</span>
          </label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="d in [7, 15, 30]"
              :key="d"
              type="button"
              @click="days = d"
              :class="[
                'py-1.5 rounded-md text-xs font-medium border text-center transition-all duration-200 font-mono',
                days === d
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-400 shadow-[0_0_10px_rgba(217,119,6,0.12)]'
                  : 'bg-[#0B0F17]/80 border-[#222D3D] text-slate-400 hover:border-slate-700 hover:text-slate-200'
              ]"
            >
              {{ d }}d
            </button>
          </div>
        </div>

        <!-- Force Refresh Toggle -->
        <div class="flex flex-col justify-end">
          <label class="relative flex items-center cursor-pointer select-none p-2 bg-[#0B0F17]/80 border border-[#222D3D] rounded-md hover:border-slate-700 transition-all duration-200">
            <input
              type="checkbox"
              v-model="forceRefresh"
              class="sr-only peer"
            />
            <div class="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[10px] after:left-[10px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-600 peer-checked:after:bg-white"></div>
            <span class="ml-3 text-xs font-medium text-slate-300">Omitir Caché 12h (Forzar)</span>
          </label>
        </div>

      </div>

    </form>
  </div>
</template>
