<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import * as THREE from 'three'

const canvasContainer = ref(null)
let scene, camera, renderer, mesh, material, animationId
let mouseX = 0
let mouseY = 0
let targetMouseX = 0
let targetMouseY = 0

// Shader definition for a fluid, photorealistic iridescent holographic material
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  uniform float uTime;
  uniform float uDistortion;
  
  // 3D Simplex Noise for smooth, organic displacement
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i); 
    vec4 p = permute( permute( permute( 
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 105.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    // Smooth, organic fluid displacement
    // Lowered frequency, smoother amplitude
    float noise1 = snoise(vec3(position.x * 1.5, position.y * 1.5 + uTime * 0.3, position.z * 1.5 - uTime * 0.2));
    float noise2 = snoise(vec3(position.x * 3.0 - uTime * 0.4, position.y * 3.0, position.z * 3.0 + uTime * 0.5));
    float combinedNoise = (noise1 + noise2 * 0.5) * 0.6;
    
    vec3 displacedPosition = position + normal * combinedNoise * uDistortion;
    
    // Compute world position for fragment shader
    vec4 worldPosition = modelMatrix * vec4(displacedPosition, 1.0);
    vPosition = worldPosition.xyz;
    
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const fragmentShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  uniform float uTime;
  uniform vec3 cameraPos;

  // Cosine based palette for spectral/iridescent look
  vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
      return a + b*cos( 6.28318*(c*t+d) );
  }

  void main() {
    vec3 viewDirection = normalize(cameraPos - vPosition);
    
    // Real Fresnel calculation
    float fresnelTerm = dot(viewDirection, vNormal);
    fresnelTerm = clamp(1.0 - fresnelTerm, 0.0, 1.0);
    float fresnelPow = pow(fresnelTerm, 2.5); // Soft rim lighting
    
    // Chromatic Iridescence Palette (Cyan Neon, Magenta, Warm Gold, Violet)
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(2.0, 1.0, 0.0);
    vec3 d = vec3(0.50, 0.20, 0.25);
    
    // Angle-dependent spectral shift
    float spectralPattern = vUv.x * 2.0 + vUv.y * 2.0 + uTime * 0.15 + fresnelTerm * 2.0;
    vec3 iridescence = palette(spectralPattern, a, b, c, d);
    
    // Signal specific colors
    vec3 signalCyan = vec3(0.0, 0.8, 0.9);
    vec3 signalMagenta = vec3(0.9, 0.1, 0.6);
    vec3 signalGold = vec3(0.95, 0.65, 0.1);
    
    // Mix iridescence with brand colors based on normal and time
    vec3 color = iridescence;
    color = mix(color, signalGold, sin(uTime * 0.4 + vPosition.y * 2.0) * 0.3 + 0.3);
    color = mix(color, signalCyan, fresnelPow * 0.9);
    color = mix(color, signalMagenta, pow(clamp(dot(vNormal, vec3(0.0, 1.0, 0.0)), 0.0, 1.0), 2.0) * 0.5);
    
    // Transparency and Bloom (Glow)
    // The center is more transparent, edges glow
    float alpha = 0.2 + fresnelPow * 0.8;
    
    gl_FragColor = vec4(color, alpha);
  }
`

onMounted(() => {
  if (!canvasContainer.value) return

  // Scene setup
  scene = new THREE.Scene()
  
  // Camera setup
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.z = 4.0
  
  // Renderer setup with proper blending for crystal look
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: false })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  canvasContainer.value.appendChild(renderer.domElement)
  
  // Geometry - High detail for organic fluid distortion
  const geometry = new THREE.IcosahedronGeometry(1.2, 128)
  
  // Material with Additive Blending and Depth Write disabled for glow effect
  material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uDistortion: { value: 0.25 },
      cameraPos: { value: camera.position }
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  })
  
  // Mesh
  mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)
  
  // Event listeners
  window.addEventListener('resize', onWindowResize)
  window.addEventListener('mousemove', onMouseMove)
  
  // Force initial resize to handle mobile scale
  onWindowResize()
  
  // Animation loop
  animate()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize)
  window.removeEventListener('mousemove', onMouseMove)
  cancelAnimationFrame(animationId)
  if (renderer && canvasContainer.value) {
    canvasContainer.value.removeChild(renderer.domElement)
  }
  if (geometry) geometry.dispose()
  if (material) material.dispose()
  if (renderer) renderer.dispose()
})

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  
  // Responsive Scaling for Mobile (Scale down by 50% on screens < 768px)
  if (window.innerWidth < 768 && mesh) {
    mesh.scale.set(0.6, 0.6, 0.6)
    // Offset slightly higher on mobile so it sits right behind the search bar
    mesh.position.y = 0.5
  } else if (mesh) {
    mesh.scale.set(1, 1, 1)
    mesh.position.y = 0
  }
}

function onMouseMove(event) {
  // Normalize mouse coordinates (-1 to 1)
  targetMouseX = (event.clientX / window.innerWidth) * 2 - 1
  targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1
}

function animate() {
  animationId = requestAnimationFrame(animate)
  
  // Smooth mouse interpolation (lerp) with easing
  mouseX += (targetMouseX - mouseX) * 0.03
  mouseY += (targetMouseY - mouseY) * 0.03
  
  // Update uniforms
  if (material) {
    material.uniforms.uTime.value += 0.012
    material.uniforms.cameraPos.value.copy(camera.position)
  }
  
  // Gentle orbital rotation and counter-oscillation
  if (mesh) {
    mesh.rotation.y += 0.001
    mesh.rotation.x += 0.0005
    
    // Oscillate based on mouse position (opposite direction for parallax)
    const basePosY = window.innerWidth < 768 ? 0.5 : 0;
    mesh.position.x = -mouseX * 0.4
    mesh.position.y = basePosY - mouseY * 0.4
  }
  
  renderer.render(scene, camera)
}
</script>

<template>
  <div 
    ref="canvasContainer" 
    class="fixed inset-0 pointer-events-none z-0 opacity-80 transition-opacity duration-1000"
  ></div>
</template>
