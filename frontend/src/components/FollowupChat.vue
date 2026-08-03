<script setup>
import { ref, watch } from 'vue'
import { marked } from 'marked'
import { MessageSquare, Send, User, Bot, Loader2 } from 'lucide-vue-next'
import { sendFollowupChat } from '../services/api.js'

const props = defineProps({
  taskId: String,
  topic: String,
  apiBase: String
})

const messages = ref([])
const inputMessage = ref('')
const loading = ref(false)

const quickPrompts = [
  'Resúmeme los 3 puntos clave en viñetas',
  '¿Qué opiniones o críticas destacadas hay en Reddit?',
  '¿Cuáles son las recomendaciones principales de implementación?'
]

// Reset conversation when switching taskId
watch(() => props.taskId, () => {
  messages.value = []
})

async function sendMessage(textToSend) {
  const queryText = (textToSend || inputMessage.value).trim()
  if (!queryText || !props.taskId || loading.value) return

  messages.value.push({ role: 'user', text: queryText })
  if (!textToSend) inputMessage.value = ''

  loading.value = true

  try {
    const data = await sendFollowupChat(props.taskId, queryText)
    const replyText = data.reply || data.response || 'Sin respuesta'
    messages.value.push({ role: 'assistant', text: replyText })
  } catch (err) {
    messages.value.push({ role: 'assistant', text: `⚠️ Error de comunicación: ${err.message}` })
  } finally {
    loading.value = false
  }
}

function renderMd(text) {
  return marked.parse(text)
}
</script>

<template>
  <div class="glass-panel rounded-xl p-6 shadow-2xl space-y-6">
    
    <!-- Module Header -->
    <div class="flex items-center justify-between pb-3 border-b border-[#222D3D]">
      <div class="flex items-center space-x-2 text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
        <MessageSquare class="w-4 h-4 text-amber-500" />
        <span>Chat de Seguimiento Continuado</span>
      </div>
      <span class="text-[10px] font-mono text-slate-400 bg-[#0B0F17] px-2 py-0.5 rounded border border-[#222D3D]">
        CONTEXT READY
      </span>
    </div>

    <!-- Quick Prompts suggestions -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="p in quickPrompts"
        :key="p"
        @click="sendMessage(p)"
        :disabled="loading"
        class="text-xs font-mono px-3 py-1.5 rounded-lg bg-[#0B0F17] border border-[#222D3D] text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition disabled:opacity-50 text-left"
      >
        ✨ "{{ p }}"
      </button>
    </div>

    <!-- Chat Messages Thread -->
    <div v-if="messages.length > 0" class="space-y-4 max-h-[400px] overflow-y-auto pr-2">
      <div
        v-for="(msg, idx) in messages"
        :key="idx"
        :class="[
          'p-4 rounded-xl text-xs leading-relaxed font-sans border transition',
          msg.role === 'user'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-100 ml-8'
            : 'bg-[#0B0F17] border-[#222D3D] text-slate-200 mr-8'
        ]"
      >
        <div class="flex items-center space-x-2 font-mono text-[10px] text-slate-400 mb-2 pb-1 border-b border-[#222D3D]/50">
          <User v-if="msg.role === 'user'" class="w-3 h-3 text-amber-400" />
          <Bot v-else class="w-3 h-3 text-cyan-400" />
          <span>{{ msg.role === 'user' ? 'Analista' : 'Signal AI Agent' }}</span>
        </div>

        <div v-if="msg.role === 'user'" class="text-slate-100 font-medium">
          {{ msg.text }}
        </div>
        <div v-else class="markdown-body" v-html="renderMd(msg.text)"></div>
      </div>

      <div v-if="loading" class="flex items-center space-x-2 text-xs font-mono text-amber-400 p-3 bg-[#0B0F17] rounded-lg border border-[#222D3D]">
        <Loader2 class="w-4 h-4 animate-spin text-amber-500" />
        <span>Sintetizando respuesta contextual...</span>
      </div>
    </div>

    <!-- Input Form -->
    <form @submit.prevent="sendMessage()" class="relative flex items-center">
      <input
        v-model="inputMessage"
        type="text"
        placeholder="Haz una pregunta de seguimiento sobre este informe..."
        class="w-full bg-[#0B0F17] border border-[#222D3D] rounded-lg pl-4 pr-12 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition"
        :disabled="loading"
      />
      <button
        type="submit"
        :disabled="loading || !inputMessage.trim()"
        class="absolute right-2 p-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 rounded-md disabled:opacity-40 transition shadow"
      >
        <Send class="w-3.5 h-3.5" />
      </button>
    </form>

  </div>
</template>
