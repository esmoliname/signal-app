import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchHistory, deleteHistoryItem, renameHistoryItem } from '../services/api.js'
import { toastError } from '../composables/useToasts'

export const useHistoryStore = defineStore('history', () => {
  const historyList = ref([])
  const activeTaskId = ref(null)
  const isLoading = ref(false)

  async function loadHistory() {
    isLoading.value = true
    try {
      historyList.value = await fetchHistory() || []
    } catch (e) {
      console.error('[historyStore] loadHistory error:', e)
      toastError(`No se pudo cargar el historial: ${e.message}`)
    } finally {
      isLoading.value = false
    }
  }

  async function removeTask(taskId) {
    try {
      await deleteHistoryItem(taskId)
      historyList.value = historyList.value.filter(i => i.id !== taskId)
      if (activeTaskId.value === taskId) activeTaskId.value = null
      return true
    } catch (e) {
      console.error('[historyStore] removeTask error:', e)
      toastError(`No se pudo eliminar el expediente: ${e.message}`)
      return false
    }
  }

  async function updateTitle(taskId, newTitle) {
    try {
      await renameHistoryItem(taskId, newTitle)
      const idx = historyList.value.findIndex(i => i.id === taskId)
      if (idx !== -1)
        historyList.value[idx] = { ...historyList.value[idx], title: newTitle, topic: newTitle }
      return true
    } catch (e) {
      console.error('[historyStore] updateTitle error:', e)
      toastError(`No se pudo renombrar el expediente: ${e.message}`)
      return false
    }
  }

  return { historyList, activeTaskId, isLoading, loadHistory, removeTask, updateTitle }
})
