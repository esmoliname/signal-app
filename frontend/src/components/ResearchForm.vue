<script setup>
import { ref } from 'vue'
import { Terminal, Database, Clock } from 'lucide-vue-next'
import { useI18n } from '../i18n'

const { t } = useI18n()

const props = defineProps({
  loading: Boolean
})
const emit = defineEmits(['submit-research'])

const form = ref({
  topic: '',
  days: 30,
  sources: ['reddit', 'hn', 'github', 'youtube']
})

const SRC_OPTS = [
  { id: 'reddit', label: 'Reddit' },
  { id: 'hn', label: 'HackerNews' },
  { id: 'github', label: 'GitHub' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'tiktok', label: 'TikTok' },
]

function toggleSource(id) {
  if (form.value.sources.includes(id)) {
    form.value.sources = form.value.sources.filter(s => s !== id)
  } else {
    form.value.sources.push(id)
  }
}

function submit() {
  if (!form.value.topic.trim()) return
  emit('submit-research', { ...form.value })
}
</script>

<template>
  <div class="bg-white/70 dark:bg-[#151C28]/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 md:p-8 shadow-sm dark:shadow-2xl border border-slate-200 dark:border-[#222D3D] transition-colors relative z-10">
    <div class="flex items-center space-x-3 mb-5 sm:mb-6">
      <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 flex items-center justify-center transition-colors shrink-0">
        <Terminal class="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-500" />
      </div>
      <div>
        <h2 class="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans transition-colors truncate">{{ t('query_title') }}</h2>
        <p class="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono transition-colors break-words">{{ t('query_sub') }}</p>
      </div>
    </div>

    <form @submit.prevent="submit" class="space-y-5 sm:space-y-6">
      <!-- Input Principal -->
      <div>
        <div class="relative group">
          <div class="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-amber-300 dark:from-amber-500/50 dark:to-cyan-500/50 rounded-lg blur opacity-10 group-hover:opacity-30 dark:group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <input 
            v-model="form.topic" 
            type="text" 
            :placeholder="t('search_placeholder')"
            class="relative w-full bg-white dark:bg-[#0B0F17] border border-slate-300 dark:border-[#222D3D] rounded-lg px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-mono transition-colors shadow-sm"
            required
            :disabled="loading"
          />
          <div class="absolute right-3 sm:right-4 top-3.5 sm:top-4 text-[10px] sm:text-xs font-mono text-slate-400 dark:text-slate-500 transition-colors hidden sm:block">
            CLI_INPUT
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        <!-- Rango Temporal -->
        <div class="space-y-2.5 sm:space-y-3">
          <label class="text-[10px] sm:text-xs font-bold font-mono text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-2 transition-colors">
            <Clock class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{{ t('timeframe_title') }}</span>
          </label>
          <div class="flex space-x-2">
            <button v-for="d in [7, 15, 30]" :key="d" type="button" @click="form.days = d"
              :class="[
                'flex-1 py-1.5 sm:py-2 rounded-md text-[10px] sm:text-xs font-mono transition-all duration-200 border shadow-sm truncate',
                form.days === d 
                  ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500 text-amber-700 dark:text-amber-400' 
                  : 'bg-slate-50 dark:bg-[#0B0F17] border-slate-200 dark:border-[#222D3D] text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500'
              ]"
              :disabled="loading">
              {{ d }} {{ t('days_suffix') }}
            </button>
          </div>
        </div>

        <!-- Fuentes -->
        <div class="space-y-2.5 sm:space-y-3">
          <label class="text-[10px] sm:text-xs font-bold font-mono text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-2 transition-colors">
            <Database class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{{ t('sources_title') }}</span>
          </label>
          <div class="flex flex-wrap gap-1.5 sm:gap-2">
            <button v-for="s in SRC_OPTS" :key="s.id" type="button" @click="toggleSource(s.id)"
              :class="[
                'px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-[10px] sm:text-[11px] font-mono transition-all duration-200 border shadow-sm',
                form.sources.includes(s.id)
                  ? 'bg-slate-800 dark:bg-slate-800 border-slate-700 dark:border-slate-600 text-white'
                  : 'bg-white dark:bg-[#0B0F17] border-slate-200 dark:border-[#222D3D] text-slate-500 dark:text-slate-500 hover:border-slate-400 dark:hover:border-slate-600'
              ]"
              :disabled="loading">
              {{ s.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="pt-4 border-t border-slate-200 dark:border-[#222D3D] flex justify-end transition-colors">
        <button 
          type="submit" 
          :disabled="loading"
          class="relative overflow-hidden group w-full sm:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-mono font-bold text-xs sm:text-sm tracking-widest uppercase transition-all shadow-md hover:shadow-lg disabled:opacity-50">
          <div class="absolute inset-0 w-full h-full bg-gradient-to-r from-amber-500 to-amber-600 opacity-0 group-hover:opacity-100 dark:group-hover:opacity-90 transition-opacity duration-300"></div>
          <span class="relative flex items-center justify-center space-x-2">
            <span>{{ loading ? t('investigating_btn') : t('investigate_btn') }}</span>
            <span v-if="!loading" class="text-amber-500 dark:text-amber-600 group-hover:text-white transition-colors">→</span>
          </span>
        </button>
      </div>
    </form>
  </div>
</template>
