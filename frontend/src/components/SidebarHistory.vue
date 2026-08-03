<script setup>
import { ref, computed } from 'vue'
import { History, Search, Clock, Plus, Trash2, Edit2, Check, X } from 'lucide-vue-next'
import { useHistoryStore } from '../stores/historyStore'

const store = useHistoryStore()
const emit  = defineEmits(['select-history', 'new-session'])

const searchQuery = ref('')
const editingId   = ref(null)
const editTitle   = ref('')

const filtered = computed(() => {
  const kw = searchQuery.value.trim().toLowerCase()
  if (!kw) return store.historyList
  return store.historyList.filter(item =>
    (item.title || item.topic || '').toLowerCase().includes(kw)
  )
})

function fmt(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-ES', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function startEdit(item, e) {
  e?.stopPropagation()
  editingId.value = item.id
  editTitle.value = item.title || item.topic
}

function cancelEdit(e) {
  e?.stopPropagation()
  editingId.value = null
}

async function saveEdit(item, e) {
  e?.stopPropagation()
  const t = editTitle.value.trim()
  if (!t) return
  const ok = await store.updateTitle(item.id, t)
  if (ok) editingId.value = null
}

async function remove(id, e) {
  e?.stopPropagation()
  if (!confirm('¿Eliminar permanentemente este expediente?')) return
  const wasActive = store.activeTaskId === id
  const ok = await store.removeTask(id)
  if (ok && wasActive) emit('new-session')
}
</script>

<template>
  <aside class="glass-panel rounded-xl p-5 flex flex-col h-full shadow-lg">

    <!-- New session button -->
    <button
      @click="emit('new-session')"
      class="w-full py-2.5 px-4 mb-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-semibold text-xs font-mono uppercase tracking-wider rounded-lg shadow-md flex items-center justify-center space-x-2 transition duration-200">
      <Plus class="w-4 h-4" />
      <span>Nueva Investigación</span>
    </button>

    <!-- Header -->
    <div class="flex items-center justify-between mb-4 pb-3 border-b border-[#222D3D]">
      <div class="flex items-center space-x-2 text-slate-200">
        <History class="w-4 h-4 text-amber-500" />
        <h3 class="font-semibold text-xs uppercase tracking-wider font-mono">Expedientes</h3>
      </div>
      <span class="text-[11px] font-mono text-slate-400 bg-[#0B0F17] px-2 py-0.5 rounded border border-[#222D3D]">
        {{ store.historyList.length }}
      </span>
    </div>

    <!-- Search -->
    <div class="relative mb-4">
      <Search class="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
      <input v-model="searchQuery" type="text" placeholder="Buscar expediente…"
        class="w-full bg-[#0B0F17] text-xs text-slate-200 placeholder-slate-500 pl-8 pr-3 py-2 rounded border border-[#222D3D] focus:outline-none focus:border-amber-500/80 transition" />
    </div>

    <!-- List -->
    <div class="flex-1 overflow-y-auto space-y-2 pr-1">

      <div v-if="filtered.length === 0" class="text-center py-8 text-xs text-slate-500 font-mono">
        Sin expedientes guardados
      </div>

      <div
        v-for="item in filtered" :key="item.id"
        @click="emit('select-history', item.id)"
        :class="[
          'w-full text-left p-3 rounded-lg border transition group flex items-center justify-between cursor-pointer',
          store.activeTaskId === item.id
            ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-[0_0_10px_rgba(217,119,6,0.1)]'
            : 'bg-[#0B0F17]/80 border-[#222D3D] text-slate-300 hover:bg-[#1C2536] hover:border-slate-700',
        ]">

        <!-- Inline rename mode -->
        <div v-if="editingId === item.id" class="flex items-center space-x-1.5 w-full" @click.stop>
          <input v-model="editTitle" type="text"
            @keyup.enter="saveEdit(item, $event)"
            class="w-full bg-[#151C28] text-xs text-slate-100 px-2 py-1 rounded border border-amber-500 focus:outline-none" />
          <button @click.stop="saveEdit(item, $event)" class="text-emerald-400 p-1 hover:text-emerald-300">
            <Check class="w-3.5 h-3.5" />
          </button>
          <button @click.stop="cancelEdit($event)" class="text-slate-400 p-1 hover:text-red-400">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Normal mode -->
        <template v-else>
          <div class="min-w-0 flex-1 pr-2">
            <div class="font-medium text-xs truncate group-hover:text-amber-400 transition">
              {{ item.title || item.topic }}
            </div>
            <div class="flex items-center space-x-2 mt-1.5 text-[10px] font-mono text-slate-500">
              <Clock class="w-3 h-3" />
              <span>{{ fmt(item.created_at) }}</span>
              <span>·</span>
              <span>{{ item.days }}d</span>
            </div>
          </div>
          <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition">
            <button @click.stop="startEdit(item, $event)"
              class="p-1 text-slate-400 hover:text-amber-400 transition rounded" title="Renombrar">
              <Edit2 class="w-3 h-3" />
            </button>
            <button @click.stop="remove(item.id, $event)"
              class="p-1 text-slate-400 hover:text-red-400 transition rounded" title="Eliminar">
              <Trash2 class="w-3 h-3" />
            </button>
          </div>
        </template>

      </div>
    </div>

  </aside>
</template>
