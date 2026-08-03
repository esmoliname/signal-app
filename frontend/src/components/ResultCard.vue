<script setup>
import { ExternalLink, ThumbsUp, Calendar, User } from 'lucide-vue-next'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const sourceConfig = {
  reddit: { name: 'Reddit', badgeBg: 'bg-[#EA580C]/10 text-[#EA580C] border-[#EA580C]/30' },
  youtube: { name: 'YouTube', badgeBg: 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30' },
  hn: { name: 'Hacker News', badgeBg: 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/30' },
  github: { name: 'GitHub', badgeBg: 'bg-[#64748B]/10 text-slate-300 border-[#64748B]/30' },
  tiktok: { name: 'TikTok', badgeBg: 'bg-[#0D9488]/10 text-[#0D9488] border-[#0D9488]/30' },
}

const config = sourceConfig[props.item.source] || { name: props.item.source, badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' }
</script>

<template>
  <div class="bg-[#151C28] hover:bg-[#1C2536] border border-[#222D3D] hover:border-amber-500/30 rounded-lg p-5 transition duration-200 flex flex-col justify-between group shadow-sm">
    
    <div>
      <!-- Header Badge & Score -->
      <div class="flex items-center justify-between mb-3">
        <span :class="['px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold border uppercase tracking-wider', config.badgeBg]">
          {{ config.name }}
        </span>
        
        <div class="flex items-center space-x-1.5 text-xs text-slate-400 bg-[#0B0F17] px-2.5 py-0.5 rounded border border-[#222D3D] font-mono">
          <ThumbsUp class="w-3 h-3 text-amber-500" />
          <span>{{ item.score?.toLocaleString() || 0 }} pts</span>
        </div>
      </div>

      <!-- Title -->
      <h4 class="text-sm font-semibold text-slate-100 group-hover:text-amber-400 transition mb-2 line-clamp-2 leading-snug">
        {{ item.title }}
      </h4>

      <!-- Excerpt -->
      <p class="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3 font-sans">
        {{ item.excerpt }}
      </p>
    </div>

    <!-- Footer metadata & link -->
    <div class="pt-3 border-t border-[#222D3D] flex items-center justify-between text-xs text-slate-400">
      <div class="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
        <span class="flex items-center space-x-1">
          <User class="w-3 h-3 text-slate-500" />
          <span class="truncate max-w-[100px]">{{ item.author }}</span>
        </span>
        <span class="flex items-center space-x-1">
          <Calendar class="w-3 h-3 text-slate-500" />
          <span>{{ item.date }}</span>
        </span>
      </div>

      <a
        :href="item.url"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center space-x-1 text-xs text-amber-500 hover:text-amber-400 font-medium transition"
      >
        <span>Origen</span>
        <ExternalLink class="w-3 h-3" />
      </a>
    </div>

  </div>
</template>
