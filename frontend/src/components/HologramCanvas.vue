<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

const canvasContainer = ref(null)

let scene, camera, renderer
let sphereGroup, ringsGroup, particleSystem
let animationFrameId
let mouseX = 0, mouseY = 0
let targetMouseX = 0, targetMouseY = 0

function initThree() {
  if (!canvasContainer.value) return

  const width = canvasContainer.value.clientWidth || 800
  const height = canvasContainer.value.clientHeight || 480

  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
  camera.position.set(0, 0, 20)

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  canvasContainer.value.appendChild(renderer.domElement)

  sphereGroup = new THREE.Group()
  ringsGroup = new THREE.Group()
  scene.add(sphereGroup)
  scene.add(ringsGroup)

  // 1. Outer Holographic Reticular Gold Core Sphere
  const sphereGeo = new THREE.IcosahedronGeometry(4.2, 4)
  const sphereMat = new THREE.MeshBasicMaterial({
    color: 0xF59E0B,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  })
  const coreSphere = new THREE.Mesh(sphereGeo, sphereMat)
  sphereGroup.add(coreSphere)

  // 2. Glowing Dual-Spectrum Particle Cloud (Cyan & Amber)
  const particleCount = 850
  const particlesGeo = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)

  const colorAmber = new THREE.Color(0xF59E0B) // Warm Amber Gold
  const colorCyan = new THREE.Color(0x06b6d4)  // Electric Cyan

  for (let i = 0; i < particleCount; i++) {
    const radius = 3.9 + Math.random() * 0.9
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos((Math.random() * 2) - 1)

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = radius * Math.cos(phi)

    const lerpFactor = (positions[i * 3 + 1] + radius) / (2 * radius)
    const pColor = colorCyan.clone().lerp(colorAmber, lerpFactor)

    colors[i * 3] = pColor.r
    colors[i * 3 + 1] = pColor.g
    colors[i * 3 + 2] = pColor.b
  }

  particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const particleMat = new THREE.PointsMaterial({
    size: 0.14,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending
  })

  particleSystem = new THREE.Points(particlesGeo, particleMat)
  sphereGroup.add(particleSystem)

  // 3. Concentric Orbiting Spectrum Rings
  const ringCount = 5
  for (let i = 0; i < ringCount; i++) {
    const ringRadius = 5.6 + i * 1.5
    const ringGeo = new THREE.RingGeometry(ringRadius, ringRadius + 0.05, 64)
    const ringColor = (i % 2 === 0) ? 0xF59E0B : 0x06b6d4
    
    const ringMat = new THREE.MeshBasicMaterial({
      color: ringColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35 - (i * 0.05),
      wireframe: (i % 2 !== 0)
    })
    
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 2.2 + (i * 0.22)
    ring.rotation.y = (i * 0.18)
    ringsGroup.add(ring)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('resize', onWindowResize)

  animate()
}

function onMouseMove(event) {
  targetMouseX = (event.clientX / window.innerWidth - 0.5) * 2
  targetMouseY = (event.clientY / window.innerHeight - 0.5) * 2
}

function onWindowResize() {
  if (!canvasContainer.value || !renderer || !camera) return
  const width = canvasContainer.value.clientWidth || 800
  const height = canvasContainer.value.clientHeight || 480
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

function animate() {
  animationFrameId = requestAnimationFrame(animate)

  // Smooth mouse lerp interaction
  mouseX += (targetMouseX - mouseX) * 0.05
  mouseY += (targetMouseY - mouseY) * 0.05

  if (sphereGroup) {
    sphereGroup.rotation.y += 0.005
    sphereGroup.rotation.x += 0.002
    sphereGroup.rotation.z = mouseX * 0.25
  }

  if (ringsGroup) {
    ringsGroup.rotation.y -= 0.004
    ringsGroup.rotation.x = mouseY * 0.35
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

onMounted(() => {
  initThree()
})

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('resize', onWindowResize)
  if (renderer) renderer.dispose()
})
</script>

<template>
  <div
    ref="canvasContainer"
    class="w-full h-full min-h-[440px] pointer-events-none select-none opacity-80 mix-blend-screen relative overflow-visible flex items-center justify-center"
  ></div>
</template>
