<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useTheme } from '../composables/useTheme'

const canvas = ref(null)
let ctx = null
let animationId = null
let width = 0
let height = 0
let time = 0

const { isDark } = useTheme()

// We will use a soft ambient flow mesh gradient approach instead of rigid vectors.
// We'll draw several large, blurry circles (blobs) that drift slowly.

class Blob {
  constructor(colorDark, colorLight, radiusMultiplier, speedX, speedY, offsetX, offsetY) {
    this.colorDark = colorDark
    this.colorLight = colorLight
    this.radiusMultiplier = radiusMultiplier
    this.speedX = speedX
    this.speedY = speedY
    this.offsetX = offsetX
    this.offsetY = offsetY
    this.x = 0
    this.y = 0
  }

  update(time, w, h) {
    // Gentle floating motion using sine/cosine
    this.x = w * 0.5 + Math.cos(time * this.speedX + this.offsetX) * (w * 0.4)
    this.y = h * 0.5 + Math.sin(time * this.speedY + this.offsetY) * (h * 0.4)
  }

  draw(ctx, isDarkTheme, w, h) {
    const radius = Math.max(w, h) * this.radiusMultiplier
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, radius)
    
    // Choose color based on theme
    const color = isDarkTheme ? this.colorDark : this.colorLight
    
    gradient.addColorStop(0, color)
    gradient.addColorStop(1, 'transparent')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)
  }
}

let blobs = []

function init() {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')
  
  width = window.innerWidth
  height = window.innerHeight
  canvas.value.width = width
  canvas.value.height = height

  blobs = [
    // colorDark, colorLight, radius, speedX, speedY, offsetX, offsetY
    // Blob 1: Top Left / Blueish
    new Blob('rgba(59, 130, 246, 0.15)', 'rgba(148, 163, 184, 0.08)', 0.6, 0.002, 0.003, 0, 1),
    // Blob 2: Bottom Right / Violet
    new Blob('rgba(139, 92, 246, 0.15)', 'rgba(203, 213, 225, 0.08)', 0.7, -0.0015, 0.002, 2, 3),
    // Blob 3: Center / Slate-Blue Deep
    new Blob('rgba(30, 41, 59, 0.20)', 'rgba(226, 232, 240, 0.10)', 0.8, 0.001, -0.002, 4, 0)
  ]
}

function animate() {
  animationId = requestAnimationFrame(animate)
  time += 1
  
  // Clear background
  ctx.fillStyle = isDark.value ? '#0B0F17' : '#F8FAFC'
  ctx.fillRect(0, 0, width, height)
  
  // Blend mode for smoother gradient mixing
  ctx.globalCompositeOperation = isDark.value ? 'screen' : 'multiply'
  
  for (const blob of blobs) {
    blob.update(time, width, height)
    blob.draw(ctx, isDark.value, width, height)
  }
  
  // Reset composite operation
  ctx.globalCompositeOperation = 'source-over'
}

function onResize() {
  init()
}

onMounted(() => {
  init()
  window.addEventListener('resize', onResize)
  animate()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  cancelAnimationFrame(animationId)
})

watch(isDark, () => {
  if (ctx) {
    ctx.fillStyle = isDark.value ? '#0B0F17' : '#F8FAFC'
    ctx.fillRect(0, 0, width, height)
  }
})
</script>

<template>
  <canvas 
    ref="canvas" 
    class="fixed inset-0 pointer-events-none z-[-10] transition-colors duration-1000"
  ></canvas>
</template>
