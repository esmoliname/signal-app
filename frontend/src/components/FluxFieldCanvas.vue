<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
let ctx, animationId
let width, height
let particles = []
let mouseX = 0, mouseY = 0

class VectorParticle {
  constructor(w, h) {
    this.reset(w, h)
  }

  reset(w, h) {
    this.x = Math.random() * w
    this.y = Math.random() * h
    this.vx = 0
    this.vy = 0
    this.speed = 0.8 + Math.random() * 1.2
    this.size = 1 + Math.random() * 1.5
    this.life = 0
    this.maxLife = 150 + Math.random() * 150
    
    // Gradient spectrum palette: electric blue, gold amber, acid green
    const colors = ['#06b6d4', '#F59E0B', '#10b981', '#6366f1']
    this.color = colors[Math.floor(Math.random() * colors.length)]
  }

  update(w, h, mX, mY) {
    this.life++
    if (this.life > this.maxLife) {
      this.reset(w, h)
    }

    // Vector field calculation with sine/cosine flow waves
    const angle = (Math.sin(this.x * 0.005) + Math.cos(this.y * 0.005)) * Math.PI
    
    // Mouse attraction influence
    const dx = mX - this.x
    const dy = mY - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    let mouseAngle = 0
    if (dist < 300) {
      mouseAngle = Math.atan2(dy, dx)
    }

    const finalAngle = angle + (dist < 300 ? (mouseAngle - angle) * 0.15 : 0)

    this.vx += Math.cos(finalAngle) * 0.1
    this.vy += Math.sin(finalAngle) * 0.1

    // Speed clamp
    this.vx *= 0.95
    this.vy *= 0.95

    this.x += this.vx * this.speed
    this.y += this.vy * this.speed

    // Wrap boundaries
    if (this.x < 0) this.x = w
    if (this.x > w) this.x = 0
    if (this.y < 0) this.y = h
    if (this.y > h) this.y = 0
  }

  draw(context) {
    const alpha = Math.sin((this.life / this.maxLife) * Math.PI) * 0.6
    context.fillStyle = this.color
    context.globalAlpha = alpha
    context.beginPath()
    context.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    context.fill()
  }
}

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  ctx = canvas.getContext('2d')
  resize()

  const particleCount = Math.min(Math.floor((width * height) / 12000), 120)
  particles = []
  for (let i = 0; i < particleCount; i++) {
    particles.push(new VectorParticle(width, height))
  }

  window.addEventListener('resize', resize)
  window.addEventListener('mousemove', handleMouseMove)
  animate()
}

function resize() {
  if (!canvasRef.value) return
  width = window.innerWidth
  height = window.innerHeight
  canvasRef.value.width = width
  canvasRef.value.height = height
}

function handleMouseMove(e) {
  mouseX = e.clientX
  mouseY = e.clientY
}

function animate() {
  animationId = requestAnimationFrame(animate)

  if (!ctx) return
  ctx.clearRect(0, 0, width, height)

  // Draw subtle magnetic vector grid lines
  const gridSize = 48
  ctx.strokeStyle = 'rgba(34, 45, 61, 0.2)'
  ctx.lineWidth = 0.5
  ctx.globalAlpha = 0.3

  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  // Render vector particles with trailing flow
  for (let p of particles) {
    p.update(width, height, mouseX, mouseY)
    p.draw(ctx)
  }
}

onMounted(() => {
  initCanvas()
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', resize)
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<template>
  <canvas
    ref="canvasRef"
    class="fixed inset-0 -z-10 pointer-events-none opacity-45 mix-blend-screen"
  ></canvas>
</template>
