<template>
  <div
    class="relative w-full min-h-screen overflow-hidden"
    style="background: #05070b"
    @mousemove="onMouseMove"
  >
    <!-- 粒子背景 -->
    <ClientOnly>
      <ParticlesBg
        :particle-count="300"
        :particle-spread="10"
        :speed="0.3"
        :particle-colors="['#ffffff']"
        :alpha-particles="false"
        :particle-base-size="100"
        :size-randomness="1"
        :camera-distance="20"
        :move-particles-on-hover="true"
        :particle-hover-factor="1"
        :disable-rotation="false"
        :pixel-ratio="1"
      />
      <template #fallback><div /></template>
    </ClientOnly>

    <!-- 鼠标跟随光晕 -->
    <div
      class="pointer-events-none absolute inset-0 z-[1] transition-[background] duration-75"
      :style="`background: radial-gradient(700px circle at ${mouseX}px ${mouseY}px, rgba(34,211,238,0.05), transparent 55%)`"
      aria-hidden
    />


    <main class="relative z-10 flex min-h-screen flex-col justify-center px-6 sm:px-12 py-20">
      <div class="mx-auto w-full max-w-5xl">

        <!-- 卡片 + 文案/导航 并排，整体居中，各列宽度固定不互相挤压 -->
        <div class="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-center lg:gap-24 lg:overflow-visible">

          <!-- 左：眉标 + 文案 + 导航（左对齐，固定宽度） -->
          <div class="flex w-[300px] flex-shrink-0 flex-col items-start overflow-visible text-left">

            <!-- 眉标 -->
            <div class="flex items-center gap-3">
              <span class="h-px w-8 bg-gradient-to-r from-transparent to-cyan-400/50" />
              <span class="font-mono text-[11px] uppercase tracking-[0.35em] text-white/30">
                Nebula Journal
              </span>
            </div>

            <ClientOnly>
              <Motion
                tag="h1"
                :initial="{ y: 36, opacity: 0 }"
                :animate="{ y: 0, opacity: 1 }"
                :transition="{ duration: 0.9, ease: 'easeOut' }"
                class="hero-title mt-10 text-[clamp(2rem,4.5vw,3.2rem)] font-bold leading-[1.1] tracking-tight"
              >
                <RotatingText
                  :texts="['写点想法', '留点日常', '开心常在', '平安喜乐！🎉']"
                  :auto="true"
                  :stagger-duration="0.04"
                  :rotation-interval="2800"
                  element-level-class-name="inline-block"
                />
              </Motion>
              <template #fallback>
                <h1 class="hero-title mt-10 text-[clamp(2rem,4.5vw,3.2rem)] font-bold leading-[1.1] tracking-tight">
                  写点想法
                </h1>
              </template>
            </ClientOnly>
            <ClientOnly>
              <Motion
                tag="div"
                :initial="{ y: 14, opacity: 0 }"
                :animate="{ y: 0, opacity: 1 }"
                :transition="{ duration: 0.9, delay: 0.28, ease: 'easeOut' }"
                class="mt-20 flex flex-wrap gap-3"
              >
                <NuxtLink to="/blog" class="nav-pill group">
                  <span class="nav-dot bg-cyan-400 group-hover:shadow-[0_0_8px_3px_rgba(34,211,238,0.5)] transition-shadow duration-200" />
                  博客文章
                  <span class="nav-arrow">→</span>
                </NuxtLink>
                <NuxtLink to="/blog?tab=ai-fiction" class="nav-pill group">
                  <span class="nav-dot bg-violet-400 group-hover:shadow-[0_0_8px_3px_rgba(167,139,250,0.5)] transition-shadow duration-200" />
                  Ai 小说
                  <span class="nav-arrow">→</span>
                </NuxtLink>
              </Motion>
              <template #fallback>
                <div class="mt-8 flex flex-wrap gap-3">
                  <NuxtLink to="/blog" class="nav-pill">博客文章 →</NuxtLink>
                </div>
              </template>
            </ClientOnly>
          </div>

          <!-- 右：快照卡片 -->
          <ClientOnly>
            <Motion
              tag="div"
              :initial="{ x: 32, opacity: 0 }"
              :animate="{ x: 0, opacity: 1 }"
              :transition="{ duration: 1, delay: 0.35, ease: 'easeOut' }"
              class="w-full max-w-[280px] flex-shrink-0 lg:w-[260px]"
            >
              <HomeSnapshotCard
                :loading="pending"
                :snapshots="homeSnapshots"
                title="日常快照"
                summary="像朋友圈一样记录生活片段，轻量、直接。"
              />
            </Motion>
            <template #fallback><div class="w-[260px]" /></template>
          </ClientOnly>

        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Motion } from "motion-v";
import RotatingText from "~/components/RotatingText.vue";
import HomeSnapshotCard from "~/components/HomeSnapshotCard.vue";
import ParticlesBg from "~/components/ParticlesBg.vue";

/* 鼠标跟随光晕 */
const mouseX = ref(760);
const mouseY = ref(400);
const onMouseMove = (e: MouseEvent) => {
  mouseX.value = e.clientX;
  mouseY.value = e.clientY;
};

/* 数据获取 */
const config = useRuntimeConfig();
const basePath = ((config.public.baseUrl as string) || "/").replace(/\/$/, "");
const jsonBase = import.meta.server ? "" : basePath;

const { data: snapshots, pending } = await useAsyncData(
  "home-latest-snapshot",
  async () => {
    if (import.meta.server) {
      return await queryContent("snapshots").sort({ date: -1 }).find();
    }
    const cached = useNuxtData("home-latest-snapshot").data.value;
    if (cached?.length !== undefined) return cached;
    if (import.meta.dev) {
      try {
        return await queryContent("snapshots").sort({ date: -1 }).find();
      } catch {
        /* fallback */
      }
    }
    const jsonPath = basePath ? `${jsonBase}/snapshots-list.json` : "/snapshots-list.json";
    return await $fetch<unknown[]>(jsonPath).catch(() => []);
  },
  { getCachedData: () => (import.meta.dev ? null : undefined), lazy: true },
);

onMounted(async () => {
  if (
    import.meta.client &&
    (!snapshots.value || !Array.isArray(snapshots.value) || snapshots.value.length === 0)
  ) {
    const jsonPath = basePath ? `${jsonBase}/snapshots-list.json` : "/snapshots-list.json";
    const list = await $fetch<unknown[]>(jsonPath).catch(() => []);
    if (Array.isArray(list) && list.length > 0) {
      snapshots.value = list;
    }
  }
});

function withBasePath(path: string): string {
  const base = (config.public.baseUrl as string) || "/";
  if (!base || base === "/") return path;
  const prefix = base.replace(/\/$/, "");
  if (path.startsWith("/uploads/") || path.startsWith("/images/")) {
    return prefix + path;
  }
  return path;
}

const homeSnapshots = computed(() => {
  const list = snapshots.value;
  if (!Array.isArray(list) || list.length === 0) return [];
  return list.slice(0, 5).map((item) => {
    const raw = item as { title?: string; summary?: string; images?: string[] };
    return {
      ...raw,
      images: raw.images?.map((img) => (typeof img === "string" ? withBasePath(img) : img)),
    };
  }) as Array<{ title?: string; summary?: string; images?: string[] }>;
});
</script>

<style scoped>
/* 大标题：白色文字 + 青色光晕 */
.hero-title {
  color: #ffffff;
  filter: drop-shadow(0 0 32px rgba(34, 211, 238, 0.45))
          drop-shadow(0 0 80px rgba(34, 211, 238, 0.18));
}

/* 导航药丸 */
.nav-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.nav-pill:hover {
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.92);
  transform: translateY(-1px);
}

.nav-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.nav-arrow {
  opacity: 0.35;
  font-size: 0.7rem;
  transition: opacity 0.2s, transform 0.2s;
}

.nav-pill:hover .nav-arrow {
  opacity: 0.75;
  transform: translateX(2px);
}

</style>
