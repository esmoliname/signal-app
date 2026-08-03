<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
let ctx, animationId
let width, height
let time = 0
let mouseX = -1000, mouseY = -1000

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  ctx = canvas.getContext('2d')
  resize()

  window.addEventListener('resize', resize)
  window.addEventListener('mousemove', onMouseMove)
  animate()
}

function resize() {
  if (!canvasRef.value) return
  width = window.innerWidth
  height = window.innerHeight
  canvasRef.value.width = width
  canvasRef.value.height = height
}

function onMouseMove(e) {
  mouseX = e.clientX
  mouseY = e.clientY
}

function animate() {
  animationId = requestAnimationFrame(animate)
  if (!ctx) return

  ctx.clearRect(0, 0, width, height)
  time += 0.015

  const cols = Math.floor(width / 36)
  const rows = Math.floor(height / 36)
  const spacingX = width / cols
  const spacingY = height / rows

  const colors = ['#84CC16', '#06B6D4', '#D97706', '#F59E0B']

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = i * spacingX + spacingX / 2
      const y = j * spacingY + spacingY / 2

      // Magnetic vector wave angle
      let angle = Math.sin(x * 0.006 + time) + Math.cos(y * 0.006 + time * 0.8)

      // Mouse magnetic influence
      const dx = mouseX - x
      const dy = mouseY - y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 250) {
        const mouseAngle = Math.atan2(dy, dx)
        const factor = (1 - dist / 250)
        angle += (mouseAngle - angle) * factor * 1.5
      }

      const needleLen = 10 + Math.sin(time + i + j) * 3
      const colorIndex = (i + j) % colors.length
      const color = colors[colorIndex]

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angle)

      ctx.strokeStyle = color
      ctx.globalAlpha = 0.25 + Math.sin(time + i) * 0.1
      ctx.lineWidth = 1.2

      ctx.beginPath()
      ctx.moveTo(-needleLen / 2, 0)
      ctx.lineTo(needleLen / 2, 0)
      ctx.stroke()

      // Small vector head dot
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(needleLen / 2, 0, 1.2, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }
  }
}

onMounted(() => {
  initCanvas()
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', resize)
  window.removeEventListener('mousemove', onMouseMove)
})
</script>

<template>
  <canvas
    ref="canvasRef"
    class="fixed inset-0 -z-10 pointer-events-none opacity-35 mix-blend-screen"
  ></canvas>
</template>
