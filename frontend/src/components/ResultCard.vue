<script setup>
import { computed } from 'vue'
import { ExternalLink, Zap } from 'lucide-vue-next'
import { useI18n } from '../i18n'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const { t } = useI18n()

// Brand colors for dark mode; in light mode we might rely on text classes or opacity
const PLATFORM_COLORS = {
  reddit: 'text-orange-500',
  youtube: 'text-red-500',
  hn: 'text-amber-500',
  github: 'text-slate-400',
  tiktok: 'text-teal-500',
}

const colorClass = computed(() => PLATFORM_COLORS[props.item.source] || 'text-slate-400')
const scoreStr = computed(() => {
  const s = props.item.score
  return s > 999 ? (s/1000).toFixed(1) + 'k' : s
})
</script>

<template>
  <a :href="item.url" target="_blank" rel="noopener noreferrer" 
     class="block group bg-white dark:bg-[#151C28] p-3.5 sm:p-4 md:p-5 rounded-xl border border-slate-200 dark:border-[#222D3D] hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-md dark:hover:shadow-lg relative overflow-hidden">
    
    <!-- Hover gradient -->
    <div class="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-500/0 group-hover:from-amber-500/5 dark:group-hover:from-amber-500/10 group-hover:to-transparent transition-all duration-500"></div>

    <div class="relative z-10 flex flex-col h-full">
      <div class="flex items-start justify-between mb-2.5 sm:mb-3 gap-2">
        <div class="flex items-center space-x-2 min-w-0">
          <span :class="[colorClass, 'font-mono text-[9px] sm:text-[10px] uppercase font-bold px-1.5 sm:px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 transition-colors shrink-0']">
            {{ item.source }}
          </span>
          <span class="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-mono transition-colors truncate">{{ item.date }}</span>
        </div>
        <div class="flex items-center space-x-1 text-[9px] sm:text-[10px] font-mono text-slate-600 dark:text-amber-400 transition-colors shrink-0">
          <Zap class="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          <span class="font-bold">{{ scoreStr }}</span>
        </div>
      </div>

      <h4 class="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug mb-1.5 sm:mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
        {{ item.title }}
      </h4>

      <p class="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 flex-1 line-clamp-3 mb-3 sm:mb-4 transition-colors">
        {{ item.excerpt }}
      </p>

      <div class="mt-auto pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-[#222D3D] flex items-center justify-between transition-colors">
        <span class="text-[9px] sm:text-[10px] font-mono text-slate-500 dark:text-slate-500 truncate max-w-[70%]">
          {{ t('by') }} {{ item.author }}
        </span>
        <div class="flex items-center space-x-1">
          <span class="text-[9px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">{{ t('source_link') }}</span>
          <ExternalLink class="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors shrink-0" />
        </div>
      </div>
    </div>
  </a>
</template>
