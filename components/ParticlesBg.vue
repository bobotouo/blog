<template>
  <div ref="containerRef" class="particles-container" aria-hidden />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const props = withDefaults(
  defineProps<{
    particleCount?: number;
    particleSpread?: number;
    speed?: number;
    particleColors?: string[];
    moveParticlesOnHover?: boolean;
    particleHoverFactor?: number;
    alphaParticles?: boolean;
    particleBaseSize?: number;
    sizeRandomness?: number;
    cameraDistance?: number;
    disableRotation?: boolean;
    pixelRatio?: number;
  }>(),
  {
    particleCount: 200,
    particleSpread: 10,
    speed: 0.1,
    particleColors: () => ["#ffffff"],
    moveParticlesOnHover: false,
    particleHoverFactor: 1,
    alphaParticles: false,
    particleBaseSize: 100,
    sizeRandomness: 1,
    cameraDistance: 20,
    disableRotation: false,
    pixelRatio: 1,
  }
);

const containerRef = ref<HTMLElement | null>(null);

const vertexShader = /* glsl */ `
  attribute vec4 aRandom;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uSpread;
  uniform float uBaseSize;
  uniform float uSizeRandomness;

  varying vec4 vRandom;
  varying vec3 vColor;

  void main() {
    vRandom = aRandom;
    vColor = aColor;

    vec3 pos = position * uSpread;
    pos.z *= 10.0;

    vec3 mPos = pos;
    float t = uTime;
    mPos.x += sin(t * aRandom.z + 6.28 * aRandom.w) * mix(0.1, 1.5, aRandom.x);
    mPos.y += sin(t * aRandom.y + 6.28 * aRandom.x) * mix(0.1, 1.5, aRandom.w);
    mPos.z += sin(t * aRandom.w + 6.28 * aRandom.y) * mix(0.1, 1.5, aRandom.z);

    vec4 mvPos = modelViewMatrix * vec4(mPos, 1.0);

    if (uSizeRandomness == 0.0) {
      gl_PointSize = uBaseSize;
    } else {
      gl_PointSize = (uBaseSize * (1.0 + uSizeRandomness * (aRandom.x - 0.5))) / length(mvPos.xyz);
    }

    gl_Position = projectionMatrix * mvPos;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uAlphaParticles;

  varying vec4 vRandom;
  varying vec3 vColor;

  void main() {
    vec2 uv = gl_PointCoord.xy;
    float d = length(uv - vec2(0.5));

    if (uAlphaParticles < 0.5) {
      if (d > 0.5) discard;
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), 1.0);
    } else {
      float circle = smoothstep(0.5, 0.4, d) * 0.8;
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), circle);
    }
  }
`;

function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const int = parseInt(hex, 16);
  return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255];
}

let cleanup: (() => void) | null = null;

onMounted(async () => {
  const container = containerRef.value;
  if (!container) return;

  const THREE = await import("three");

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
  renderer.setPixelRatio(props.pixelRatio > 0 ? props.pixelRatio : window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(15, 1, 0.1, 1000);
  camera.position.set(0, 0, props.cameraDistance);

  const resize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener("resize", resize);
  resize();

  // Build geometry
  const count = props.particleCount;
  const positions = new Float32Array(count * 3);
  const randoms = new Float32Array(count * 4);
  const colors = new Float32Array(count * 3);
  const palette = props.particleColors.length > 0 ? props.particleColors : ["#ffffff"];

  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0, len = 0;
    do {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
      z = Math.random() * 2 - 1;
      len = x * x + y * y + z * z;
    } while (len > 1 || len === 0);
    const r = Math.cbrt(Math.random());
    positions.set([x * r, y * r, z * r], i * 3);
    randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    const col = hexToRgb(palette[Math.floor(Math.random() * palette.length)]);
    colors.set(col, i * 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 4));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));

  const dpr = props.pixelRatio > 0 ? props.pixelRatio : window.devicePixelRatio;
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uSpread: { value: props.particleSpread },
      uBaseSize: { value: props.particleBaseSize * dpr },
      uSizeRandomness: { value: props.sizeRandomness },
      uAlphaParticles: { value: props.alphaParticles ? 1.0 : 0.0 },
    },
    transparent: true,
    depthTest: false,
  });

  const points = new THREE.Points(geometry, material);
  const scene = new THREE.Scene();
  scene.add(points);

  // Mouse hover — rAF 节流，避免 mousemove 每帧触发多次
  const mouse = { x: 0, y: 0 };
  let mouseRafPending = false;
  const onMouseMove = (e: MouseEvent) => {
    if (mouseRafPending) return;
    mouseRafPending = true;
    requestAnimationFrame(() => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRafPending = false;
    });
  };
  if (props.moveParticlesOnHover) {
    window.addEventListener("mousemove", onMouseMove, { passive: true });
  }

  let rafId: number;
  let lastTime = performance.now();
  let elapsed = 0;

  const tick = (now: number) => {
    rafId = requestAnimationFrame(tick);
    const delta = now - lastTime;
    lastTime = now;
    elapsed += delta * props.speed;

    material.uniforms.uTime.value = elapsed * 0.001;

    if (props.moveParticlesOnHover) {
      points.position.x = -mouse.x * props.particleHoverFactor;
      points.position.y = -mouse.y * props.particleHoverFactor;
    } else {
      points.position.x = 0;
      points.position.y = 0;
    }

    if (!props.disableRotation) {
      points.rotation.x = Math.sin(elapsed * 0.0002) * 0.1;
      points.rotation.y = Math.cos(elapsed * 0.0005) * 0.15;
      points.rotation.z += 0.01 * props.speed;
    }

    renderer.render(scene, camera);
  };

  rafId = requestAnimationFrame(tick);

  // Page Visibility：切到后台时暂停动画，节省 CPU/GPU
  const onVisibilityChange = () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      lastTime = performance.now();
      rafId = requestAnimationFrame(tick);
    }
  };
  document.addEventListener("visibilitychange", onVisibilityChange);

  cleanup = () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    if (props.moveParticlesOnHover) window.removeEventListener("mousemove", onMouseMove);
    renderer.dispose();
    geometry.dispose();
    material.dispose();
    if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
  };
});

onUnmounted(() => {
  cleanup?.();
});
</script>

<style scoped>
.particles-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.particles-container canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
</style>
