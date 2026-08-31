<script setup>
import { ref, watch, nextTick } from 'vue'
import { MessageSquare, Send, Bot, User } from 'lucide-vue-next'
import { sendFollowupChat } from '../services/api'
import { useI18n } from '../i18n'
import { renderMarkdown } from '../utils/markdown'

const props = defineProps({
  taskId: String,
  topic: String
})

const { t } = useI18n()

const messages = ref([])
const input = ref('')
const loading = ref(false)
const chatContainer = ref(null)

watch(() => props.taskId, () => {
  messages.value = []
})

async function submit() {
  const msg = input.value.trim()
  if (!msg || !props.taskId || loading.value) return
  
  input.value = ''
  messages.value.push({ role: 'user', content: msg })
  scrollToBottom()
  
  loading.value = true
  try {
    const res = await sendFollowupChat(props.taskId, msg)
    messages.value.push({ role: 'assistant', content: res.reply || res.response })
  } catch (err) {
    messages.value.push({ role: 'assistant', content: `**Error:** ${err.message}` })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

function renderMd(text) {
  return renderMarkdown(text)
}
</script>

<template>
  <div class="bg-white/70 dark:bg-[#151C28]/80 backdrop-blur-md rounded-xl shadow-sm dark:shadow-xl border border-slate-200 dark:border-[#222D3D] flex flex-col h-[400px] sm:h-[500px] transition-colors relative z-10 overflow-hidden">
    <!-- Header -->
    <div class="px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-200 dark:border-[#222D3D] flex items-center space-x-3 transition-colors shrink-0">
      <div class="w-7 h-7 sm:w-8 sm:h-8 rounded bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 flex items-center justify-center transition-colors shrink-0">
        <MessageSquare class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-500" />
      </div>
      <div class="min-w-0">
        <h3 class="text-[11px] sm:text-sm font-bold font-mono text-slate-800 dark:text-slate-100 uppercase tracking-wider transition-colors truncate">{{ t('chat_title') }}</h3>
        <p class="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-mono transition-colors truncate">{{ t('chat_topic') }}: {{ topic }}</p>
      </div>
    </div>

    <!-- Messages -->
    <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-6">
      <div v-if="messages.length === 0" class="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-[11px] sm:text-xs font-mono transition-colors text-center px-4">
        {{ t('chat_empty') }}
      </div>
      
      <div v-for="(msg, i) in messages" :key="i"
           :class="['flex space-x-2 sm:space-x-3', msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : '']">
        <!-- Avatar -->
        <div :class="[
          'w-6 h-6 sm:w-8 sm:h-8 rounded shrink-0 flex items-center justify-center border transition-colors',
          msg.role === 'user' 
            ? 'bg-slate-100 dark:bg-[#1C2536] border-slate-300 dark:border-slate-700' 
            : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
        ]">
          <User v-if="msg.role === 'user'" class="w-3 h-3 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-400" />
          <Bot v-else class="w-3 h-3 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-500" />
        </div>
        
        <!-- Bubble -->
        <div :class="[
          'max-w-[85%] sm:max-w-[80%] rounded-lg p-2.5 sm:p-3 text-[11px] sm:text-sm transition-colors',
          msg.role === 'user'
            ? 'bg-slate-100 dark:bg-[#1C2536] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800'
            : 'bg-white dark:bg-[#0B0F17] text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-[#222D3D] shadow-sm'
        ]">
          <div v-if="msg.role === 'user'" class="whitespace-pre-wrap">{{ msg.content }}</div>
          <div v-else class="markdown-body text-[11px] sm:text-sm bg-transparent overflow-x-auto" v-html="renderMd(msg.content)"></div>
        </div>
      </div>
      
      <div v-if="loading" class="flex space-x-2 sm:space-x-3">
        <div class="w-6 h-6 sm:w-8 sm:h-8 rounded bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center shrink-0 transition-colors">
          <Bot class="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
        </div>
        <div class="bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-[#222D3D] rounded-lg p-2.5 sm:p-3 shadow-sm transition-colors flex items-center space-x-2">
          <div class="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-amber-500 rounded-full animate-bounce"></div>
          <div class="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-amber-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          <div class="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-amber-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="p-3 sm:p-4 border-t border-slate-200 dark:border-[#222D3D] bg-slate-50/50 dark:bg-[#151C28]/50 transition-colors shrink-0">
      <form @submit.prevent="submit" class="relative">
        <input 
          v-model="input"
          type="text"
          :placeholder="t('chat_placeholder')"
          class="w-full bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-300 dark:border-[#222D3D] rounded-lg pl-3 pr-10 sm:pl-4 sm:pr-12 py-2 sm:py-3 text-[11px] sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors shadow-sm"
          :disabled="loading"
        />
        <button 
          type="submit"
          :disabled="loading || !input.trim()"
          class="absolute right-1.5 top-1.5 sm:right-2 sm:top-2 p-1 sm:p-1.5 rounded-md bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors">
          <Send class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </form>
    </div>
  </div>
</template>

<style>
/* Adjust markdown styling within chat */
.markdown-body.text-sm p, .markdown-body.text-\[11px\] p { margin-bottom: 0.5em; }
.markdown-body.text-sm ul, .markdown-body.text-\[11px\] ul { margin-bottom: 0.5em; padding-left: 1.5em; }
.markdown-body.text-sm:last-child, .markdown-body.text-\[11px\]:last-child { margin-bottom: 0; }
</style>
