<script setup>
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next'
import { useToasts } from '../composables/useToasts'

const { items, dismiss } = useToasts()

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const STYLES = {
  success: 'border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
  error:   'border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-300',
  info:    'border-sky-300 dark:border-sky-500/40 text-sky-700 dark:text-sky-300',
}
</script>

<template>
  <!-- Fixed top-center stack, polite so screen readers announce new toasts. -->
  <div
    aria-live="polite"
    class="fixed top-4 left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-2 w-full max-w-md px-4 pointer-events-none"
  >
    <TransitionGroup
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="opacity-0 -translate-y-2 scale-95"
      leave-to-class="opacity-0 translate-y-1 scale-95"
    >
      <div
        v-for="t in items"
        :key="t.id"
        class="pointer-events-auto w-full flex items-start gap-2.5 bg-white dark:bg-[#151C28]/95 backdrop-blur-md border rounded-lg shadow-lg px-3.5 py-2.5 text-xs font-mono transition-colors"
        :class="STYLES[t.kind] || STYLES.info"
      >
        <component :is="ICONS[t.kind] || Info" class="w-4 h-4 shrink-0 mt-0.5" />
        <span class="flex-1 break-words leading-snug">{{ t.message }}</span>
        <button
          type="button"
          :aria-label="'Dismiss notification'"
          class="shrink-0 text-current/60 hover:text-current transition-colors -m-1 p-1 rounded"
          @click="dismiss(t.id)"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
