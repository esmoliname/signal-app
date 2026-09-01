/**
 * Lightweight global toast/notification system.
 *
 * A module-level reactive list (mirroring the useTheme singleton pattern) lets
 * any store, composable, or component push a toast without prop-drilling. The
 * <ToastContainer /> component renders them at the root (App.vue).
 */
import { reactive } from 'vue'

const state = reactive({
  items: [],
})

let nextId = 1
// Keep the default timeout so transient successes don't linger.
const DEFAULT_DURATION = 3500

function push(kind, message, duration = DEFAULT_DURATION) {
  const id = nextId++
  state.items.push({ id, kind, message })
  if (duration > 0) {
    setTimeout(() => dismiss(id), duration)
  }
  return id
}

export function dismiss(id) {
  const idx = state.items.findIndex(t => t.id === id)
  if (idx !== -1) state.items.splice(idx, 1)
}

export function toastSuccess(message, duration) { return push('success', message, duration) }
export function toastError(message, duration)   { return push('error', message, duration) }
export function toastInfo(message, duration)    { return push('info', message, duration) }

export function useToasts() {
  return {
    items: state.items,
    success: toastSuccess,
    error: toastError,
    info: toastInfo,
    dismiss,
  }
}
