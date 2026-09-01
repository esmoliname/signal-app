<script setup>
import { ref, computed, nextTick } from 'vue'
import { History, Search, Clock, Plus, Trash2, Edit2, Check, X, AlertTriangle } from 'lucide-vue-next'
import { useHistoryStore } from '../stores/historyStore'
import { useI18n } from '../i18n'
import { useToasts } from '../composables/useToasts'

const store = useHistoryStore()
const { t } = useI18n()
const { success: toastSuccess, error: toastError } = useToasts()
const emit  = defineEmits(['select-history', 'new-session'])

const searchQuery = ref('')
const editingId   = ref(null)
const editTitle   = ref('')

// Accessible delete-confirmation modal (replaces native confirm()).
const pendingDeleteId = ref(null)
const deleteInputRef  = ref(null)
const editInputRef    = ref(null)

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
  nextTick(() => {
    const el = editInputRef.value
    if (el) el.focus()
  })
}

function cancelEdit(e) {
  e?.stopPropagation()
  editingId.value = null
}

async function saveEdit(item, e) {
  e?.stopPropagation()
  const tStr = editTitle.value.trim()
  if (!tStr) return
  const ok = await store.updateTitle(item.id, tStr)
  if (ok) {
    editingId.value = null
    toastSuccess(t('rename_ok'))
  }
}

// Open the accessible delete-confirmation dialog.
function askDelete(id, e) {
  e?.stopPropagation()
  pendingDeleteId.value = id
  nextTick(() => deleteInputRef.value?.focus())
}

async function confirmDelete() {
  const id = pendingDeleteId.value
  if (!id) return
  const wasActive = store.activeTaskId === id
  const ok = await store.removeTask(id)
  pendingDeleteId.value = null
  if (ok) {
    toastSuccess(t('delete_ok'))
    if (wasActive) emit('new-session')
  }
}

function cancelDelete() {
  pendingDeleteId.value = null
}
</script>

<template>
  <aside class="bg-white/70 dark:bg-[#151C28]/80 backdrop-blur-md rounded-xl p-4 sm:p-5 flex flex-col h-full shadow-sm dark:shadow-lg border border-slate-200 dark:border-[#222D3D] transition-colors overflow-hidden">

    <!-- New session button -->
    <button
      @click="emit('new-session')"
      class="w-full py-2.5 px-3 sm:px-4 mb-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white dark:text-slate-950 font-semibold text-[11px] sm:text-xs font-mono uppercase tracking-wider rounded-lg shadow-md flex items-center justify-center space-x-2 transition duration-200 shrink-0">
      <Plus class="w-4 h-4" />
      <span class="truncate">{{ t('new_research_btn') }}</span>
    </button>

    <!-- Header -->
    <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-[#222D3D] transition-colors shrink-0">
      <div class="flex items-center space-x-2 text-slate-700 dark:text-slate-200 truncate pr-2">
        <History class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
        <h3 class="font-semibold text-[10px] sm:text-xs uppercase tracking-wider font-mono truncate">{{ t('records_title') }}</h3>
      </div>
      <span class="text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#0B0F17] px-1.5 sm:px-2 py-0.5 rounded border border-slate-200 dark:border-[#222D3D] transition-colors shrink-0">
        {{ store.historyList.length }}
      </span>
    </div>

    <!-- Search -->
    <div class="relative mb-4 shrink-0">
      <Search class="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
      <input v-model="searchQuery" type="text" :placeholder="t('search_history_placeholder')"
        :aria-label="t('search_history_aria')"
        class="w-full bg-slate-50 dark:bg-[#0B0F17] text-[11px] sm:text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 pl-8 pr-3 py-2 rounded border border-slate-200 dark:border-[#222D3D] focus:outline-none focus:border-amber-400 dark:focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/30 transition-colors shadow-sm" />
    </div>

    <!-- List -->
    <div class="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">

      <!-- Loading skeleton for the history list -->
      <div v-if="store.isLoading && store.historyList.length === 0" class="space-y-2">
        <div v-for="i in 4" :key="i" class="p-3 rounded-lg border border-slate-200 dark:border-[#222D3D] animate-pulse">
          <div class="h-3 w-3/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div class="h-2 w-1/2 bg-slate-200 dark:bg-slate-700 rounded mt-2"></div>
        </div>
      </div>

      <div v-else-if="filtered.length === 0" class="text-center py-8 text-[11px] sm:text-xs text-slate-500 font-mono">
        {{ t('noSavedSessions') }}
      </div>

      <div
        v-for="item in filtered" :key="item.id"
        role="button"
        tabindex="0"
        @click="emit('select-history', item.id)"
        @keyup.enter="emit('select-history', item.id)"
        :aria-pressed="store.activeTaskId === item.id"
        :class="[
          'w-full text-left p-2.5 sm:p-3 rounded-lg border transition-all duration-200 group flex items-center justify-between cursor-pointer',
          store.activeTaskId === item.id
            ? 'bg-amber-50 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/50 text-amber-900 dark:text-white shadow-sm dark:shadow-[0_0_10px_rgba(217,119,6,0.1)]'
            : 'bg-white dark:bg-[#0B0F17]/80 border-slate-200 dark:border-[#222D3D] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1C2536] hover:border-slate-300 dark:hover:border-slate-700',
        ]">

        <!-- Inline rename mode -->
        <div v-if="editingId === item.id" class="flex items-center space-x-1.5 w-full" @click.stop>
          <input v-model="editTitle" ref="editInputRef" type="text"
            @keyup.enter="saveEdit(item, $event)"
            @keyup.esc="cancelEdit($event)"
            :aria-label="t('rename')"
            class="w-full bg-white dark:bg-[#151C28] text-[11px] sm:text-xs text-slate-900 dark:text-slate-100 px-2 py-1 rounded border border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-colors" />
          <button @click.stop="saveEdit(item, $event)" class="text-emerald-500 dark:text-emerald-400 p-1 hover:text-emerald-600 dark:hover:text-emerald-300 shrink-0">
            <Check class="w-3.5 h-3.5" />
          </button>
          <button @click.stop="cancelEdit($event)" class="text-slate-400 p-1 hover:text-red-500 dark:hover:text-red-400 shrink-0">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Normal mode -->
        <template v-else>
          <div class="min-w-0 flex-1 pr-2 overflow-hidden">
            <div class="font-medium text-[11px] sm:text-xs truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {{ item.title || item.topic }}
            </div>
            <div class="flex items-center space-x-1 sm:space-x-2 mt-1 sm:mt-1.5 text-[9px] sm:text-[10px] font-mono text-slate-500 truncate">
              <Clock class="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
              <span class="truncate">{{ fmt(item.created_at) }}</span>
              <span class="shrink-0">·</span>
              <span class="shrink-0">{{ item.days }}d</span>
            </div>
          </div>
          <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition shrink-0">
            <button @click.stop="startEdit(item, $event)"
              :aria-label="t('edit_aria')"
              class="p-1 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors" :title="t('rename')">
              <Edit2 class="w-3 h-3" />
            </button>
            <button @click.stop="askDelete(item.id, $event)"
              :aria-label="t('delete_aria')"
              class="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" :title="t('delete')">
              <Trash2 class="w-3 h-3" />
            </button>
          </div>
        </template>

      </div>
    </div>

  </aside>

  <!-- Accessible delete-confirmation dialog (replaces native confirm) -->
  <Teleport to="body">
    <div
      v-if="pendingDeleteId"
      class="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      :aria-label="t('confirm_delete_title')"
      @click.self="cancelDelete"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm"></div>

      <!-- Panel -->
      <div class="relative z-10 w-full max-w-sm bg-white dark:bg-[#151C28] border border-slate-200 dark:border-[#222D3D] rounded-xl shadow-2xl p-5 transition-colors">
        <div class="flex items-start gap-3">
          <div class="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle class="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div class="min-w-0">
            <h4 class="text-sm font-bold text-slate-900 dark:text-slate-100 font-sans">{{ t('confirm_delete_title') }}</h4>
            <p class="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">{{ t('confirm_delete_body') }}</p>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-5">
          <button
            type="button"
            ref="deleteInputRef"
            @click="cancelDelete"
            class="px-3.5 py-2 rounded-lg text-[11px] sm:text-xs font-mono font-semibold uppercase tracking-wider border border-slate-300 dark:border-[#222D3D] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0B0F17] transition-colors"
          >
            {{ t('cancel') }}
          </button>
          <button
            type="button"
            @click="confirmDelete"
            class="px-3.5 py-2 rounded-lg text-[11px] sm:text-xs font-mono font-semibold uppercase tracking-wider bg-red-600 text-white hover:bg-red-500 transition-colors shadow"
          >
            {{ t('delete_confirm_btn') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
