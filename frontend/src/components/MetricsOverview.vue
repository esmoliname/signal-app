<script setup>
import { computed } from 'vue'
import { Activity, Radio, KeyRound } from 'lucide-vue-next'
import { useI18n } from '../i18n'

const props = defineProps({
  result: Object
})

const { t } = useI18n()

// Calcs
const totalMentions = computed(() => {
  if (!props.result?.feeds) return 0
  return props.result.feeds.reduce((acc, f) => acc + (f.score || 0), 0)
})

const dominantSource = computed(() => {
  if (!props.result?.feeds?.length) return 'N/A'
  const counts = {}
  props.result.feeds.forEach(f => {
    counts[f.source] = (counts[f.source] || 0) + 1
  })
  return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b).toUpperCase()
})

const topKeywords = computed(() => {
  if (!props.result?.topic) return []
  const base = props.result.topic.split(' ')[0]
  return [base, 'Tech', '2026', 'Adoption', 'Review']
})
</script>

<template>
  <!-- Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols -->
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
    <!-- Volumen -->
    <div class="bg-white/70 dark:bg-[#151C28]/80 backdrop-blur-md p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-[#222D3D] shadow-sm dark:shadow-md transition-colors relative overflow-hidden group">
      <div class="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-amber-500/10 rounded-full blur-2xl -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 transition"></div>
      <div class="flex items-center space-x-2 sm:space-x-3 mb-1 sm:mb-2 relative z-10">
        <Activity class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
        <h3 class="text-[10px] sm:text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors truncate">{{ t('volume_title') }}</h3>
      </div>
      <div class="text-xl sm:text-2xl md:text-3xl font-sans font-bold text-slate-900 dark:text-slate-100 relative z-10 transition-colors">
        {{ totalMentions > 999 ? (totalMentions/1000).toFixed(1) + 'K' : totalMentions }}
      </div>
      <div class="text-[9px] sm:text-[10px] font-mono text-slate-400 mt-1 relative z-10 truncate">{{ t('volume_sub') }}</div>
    </div>

    <!-- Fuente -->
    <div class="bg-white/70 dark:bg-[#151C28]/80 backdrop-blur-md p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-[#222D3D] shadow-sm dark:shadow-md transition-colors relative overflow-hidden group">
      <div class="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-cyan-500/10 rounded-full blur-2xl -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 transition"></div>
      <div class="flex items-center space-x-2 sm:space-x-3 mb-1 sm:mb-2 relative z-10">
        <Radio class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-500 shrink-0" />
        <h3 class="text-[10px] sm:text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors truncate">{{ t('dominant_source') }}</h3>
      </div>
      <div class="text-lg sm:text-xl md:text-2xl font-mono font-bold text-cyan-600 dark:text-cyan-400 relative z-10 transition-colors truncate">
        {{ dominantSource }}
      </div>
      <div class="text-[9px] sm:text-[10px] font-mono text-slate-400 mt-1 relative z-10 truncate">{{ t('dominant_sub') }}</div>
    </div>

    <!-- Keywords -->
    <div class="bg-white/70 dark:bg-[#151C28]/80 backdrop-blur-md p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-[#222D3D] shadow-sm dark:shadow-md transition-colors relative z-10 sm:col-span-2 md:col-span-1">
      <div class="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
        <KeyRound class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
        <h3 class="text-[10px] sm:text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors truncate">{{ t('top_keywords') }}</h3>
      </div>
      <div class="flex flex-wrap gap-1 sm:gap-1.5">
        <span v-for="kw in topKeywords" :key="kw"
          class="px-1.5 sm:px-2 py-0.5 bg-slate-100 dark:bg-[#0B0F17] border border-slate-200 dark:border-[#222D3D] text-[9px] sm:text-[10px] font-mono text-slate-600 dark:text-slate-300 rounded transition-colors whitespace-nowrap">
          {{ kw }}
        </span>
      </div>
    </div>
  </div>
</template>
