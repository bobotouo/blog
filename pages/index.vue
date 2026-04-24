<template>
  <div
    class="relative min-h-screen overflow-hidden"
    style="background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(56, 189, 248, 0.1), rgba(56, 189, 248, 0.02) 40%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(245, 158, 11, 0.06), transparent 50%), radial-gradient(ellipse 50% 30% at 20% 80%, rgba(251, 113, 133, 0.05), transparent 50%), #0a0f14"
    @mousemove="onMouseMove"
  >
    <!-- 背景网格 -->
    <div class="absolute inset-0 bg-grid" aria-hidden />

    <!-- 噪点纹理 -->
    <div class="absolute inset-0 bg-grain pointer-events-none" aria-hidden />

    <!-- 装饰性光晕 -->
    <div class="absolute top-32 left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" aria-hidden />
    <div class="absolute bottom-32 right-20 w-[32rem] h-[32rem] bg-amber-500/10 rounded-full blur-3xl" aria-hidden />
    <div class="absolute top-48 right-48 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl" aria-hidden />

    <!-- 浮动装饰粒子 -->
    <div class="absolute top-1/4 left-10 w-3 h-3 bg-cyan-400/60 rounded-full animate-float-slow" aria-hidden />
    <div class="absolute top-1/3 right-1/4 w-2 h-2 bg-amber-400/60 rounded-full animate-float-reverse" aria-hidden />
    <div class="absolute bottom-1/3 left-1/4 w-4 h-4 bg-pink-400/40 rounded-full animate-float-fast" aria-hidden />

    <!-- 鼠标跟随光晕 -->
    <div
      class="pointer-events-none absolute inset-0 z-[1] transition-[background] duration-200"
      :style="`background: radial-gradient(700px circle at ${mouseX}px ${mouseY}px, rgba(56, 189, 248, 0.1), transparent 60%)`"
      aria-hidden
    />

    <main class="relative z-10 flex min-h-screen flex-col justify-center px-6 sm:px-12 py-20">
      <div class="mx-auto w-full max-w-6xl">

        <!-- 卡片 + 文案/导航 并排布局 -->
        <div class="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">

          <!-- 左侧：眉标 + 文案 + 导航 -->
          <div class="flex w-full lg:w-[400px] flex-shrink-0 flex-col items-start text-left">

            <!-- 眉标 -->
            <div class="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.06] border border-white/[0.08] backdrop-blur-md mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] group hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-300">
              <span class="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 group-hover:animate-pulse"></span>
              <span class="font-mono text-[11px] uppercase tracking-[0.4em] text-white/40 font-medium">
                Nova Journal
              </span>
              <span class="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-pink-400 to-amber-400 animate-pulse" style="animation-delay: 0.5s;"></span>
            </div>

            <!-- 标题 -->
            <ClientOnly>
              <Motion
                tag="h1"
                :initial="{ y: 40, opacity: 0 }"
                :animate="{ y: 0, opacity: 1 }"
                :transition="{ duration: 0.9, ease: 'easeOut' }"
                class="mb-4"
              >
                <div class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.1] tracking-tight">
                  <span class="block text-white/80 mb-2 text-lg uppercase tracking-[0.3em] font-medium text-white/40">记录 · 思考 · 延伸</span>
                  <span class="block">
                    <RotatingText
                      :texts="['写点想法', '留点日常', '开心常在', '平安喜乐！🎉']"
                      :auto="true"
                      :stagger-duration="0.04"
                      :rotation-interval="2800"
                      element-level-class-name="inline-block text-white"
                    />
                  </span>
                </div>
              </Motion>
              <template #fallback>
                <div class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.1] tracking-tight">
                  <span class="block text-white/80 mb-2 text-lg uppercase tracking-[0.3em] font-medium text-white/40">记录 · 思考 · 延伸</span>
                  <span class="block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">写点想法</span>
                </div>
              </template>
            </ClientOnly>

            <!-- 描述 -->
            <ClientOnly>
              <Motion
                tag="div"
                :initial="{ y: 25, opacity: 0 }"
                :animate="{ y: 0, opacity: 1 }"
                :transition="{ duration: 0.8, delay: 0.25, ease: 'easeOut' }"
                class="mb-8 max-w-md"
              >
                <p class="text-base sm:text-lg text-white/[0.65] leading-relaxed font-light">
                  在喧嚣中寻找宁静，在平凡中发现不凡。<br class="hidden sm:block" />每一篇文字，都是一次与自我的对话。
                </p>
              </Motion>
              <template #fallback>
                <p class="text-base sm:text-lg text-white/[0.65] leading-relaxed font-light mb-8">
                  在喧嚣中寻找宁静，在平凡中发现不凡。<br class="hidden sm:block" />每一篇文字，都是一次与自我的对话。
                </p>
              </template>
            </ClientOnly>

            <!-- 导航按钮 -->
            <ClientOnly>
              <Motion
                tag="div"
                :initial="{ y: 25, opacity: 0 }"
                :animate="{ y: 0, opacity: 1 }"
                :transition="{ duration: 0.8, delay: 0.35, ease: 'easeOut' }"
                class="flex flex-wrap gap-4"
              >
                <NuxtLink
                  to="/blog"
                  class="group relative inline-flex items-center gap-3 px-7 py-3.5 rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-500/[0.15] to-blue-500/[0.15] border border-cyan-500/20 text-cyan-300 font-medium text-sm transition-all duration-500 hover:from-cyan-500/[0.25] hover:to-blue-500/[0.25] hover:border-cyan-500/30 hover:text-white hover:shadow-[0_0_40px_rgba(56,189,248,0.15)] before:absolute before:inset-0 before:bg-gradient-to-r before:from-cyan-400/0 before:via-cyan-400/10 before:to-cyan-400/0 before:transition-all before:duration-500 before:-translate-x-full hover:before:translate-x-full"
                >
                  <span class="relative z-10 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-cyan-400 group-hover:animate-pulse"></span>
                    浏览文章
                  </span>
                  <svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </NuxtLink>
                <NuxtLink
                  to="/blog?tab=ai-fiction"
                  class="group relative inline-flex items-center gap-3 px-7 py-3.5 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-500/[0.1] to-pink-500/[0.1] border border-amber-500/15 text-amber-300/80 font-medium text-sm transition-all duration-500 hover:from-amber-500/[0.15] hover:to-pink-500/[0.15] hover:border-amber-500/25 hover:text-amber-200 hover:shadow-[0_0_40px_rgba(245,158,11,0.1)] before:absolute before:inset-0 before:bg-gradient-to-r before:from-amber-400/0 before:via-amber-400/10 before:to-amber-400/0 before:transition-all before:duration-500 before:-translate-x-full hover:before:translate-x-full"
                >
                  <span class="relative z-10 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-amber-400/60 group-hover:animate-pulse"></span>
                    AI 小说
                  </span>
                  <svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </NuxtLink>
              </Motion>
              <template #fallback>
                <div class="flex flex-wrap gap-4">
                  <NuxtLink to="/blog" class="px-7 py-3.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">
                    浏览文章
                  </NuxtLink>
                </div>
              </template>
            </ClientOnly>
          </div>

          <!-- 右侧：快照卡片 -->
          <div class="w-full lg:w-[340px] flex-shrink-0 mt-16 lg:mt-0">
            <ClientOnly>
              <Motion
                tag="div"
                :initial="{ x: 40, opacity: 0, scale: 0.95 }"
                :animate="{ x: 0, opacity: 1, scale: 1 }"
                :transition="{ duration: 0.9, delay: 0.4, ease: 'easeOut' }"
                class="transform-gpu"
              >
                <HomeSnapshotCard
                  :loading="pending"
                  :snapshots="homeSnapshots"
                  title="日常快照"
                  summary="记录生活中的温暖瞬间"
                />
              </Motion>
              <template #fallback>
                <div class="w-full h-[440px] bg-white/5 rounded-3xl animate-pulse border border-white/10"></div>
              </template>
            </ClientOnly>
          </div>

        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Motion } from "motion-v";
import RotatingText from "~/components/RotatingText.vue";
import HomeSnapshotCard from "~/components/HomeSnapshotCard.vue";

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

const { data: snapshots, pending } = useAsyncData(
  "home-latest-snapshot",
  async () => {
    const jsonPath = basePath ? `${jsonBase}/snapshots-list.json` : "/snapshots-list.json";
    return await $fetch<unknown[]>(jsonPath).catch(() => []);
  },
  {
    server: false,
    lazy: true,
    default: () => [],
  },
);

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

onMounted(() => {
  const warmup = () => {
    // 预热首次跳转目标页，减少第一次点击“浏览文章 / AI 小说”的等待。
    preloadRouteComponents("/blog").catch(() => {});
  };
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(warmup, { timeout: 1200 });
  } else {
    setTimeout(warmup, 300);
  }
});
</script>