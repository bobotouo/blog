<template>
  <div
    class="relative w-full min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#16212f_0%,_#0a0f14_45%,_#05070b_100%)]"
  >
    <div class="absolute inset-0 bg-grid opacity-[0.2]" aria-hidden />
    <div
      class="absolute -top-32 right-[-15%] h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,_rgba(34,211,238,0.35),_rgba(34,211,238,0)_70%)] blur-3xl"
      aria-hidden
    />
    <div
      class="absolute -bottom-40 left-[-10%] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,_rgba(249,115,22,0.35),_rgba(249,115,22,0)_70%)] blur-3xl"
      aria-hidden
    />

    <main
      class="relative z-10 min-h-screen flex flex-col justify-center px-6 py-16"
    >
      <!-- ClientOnly 避免 motion-v 在 SSR/水合时 renderSlot 读到 null 的 currentRenderingInstance -->
      <ClientOnly>
        <div class="max-w-5xl mx-auto w-full">
          <div class="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/60 mb-6">
            <span class="h-[1px] w-8 bg-white/40" />
            Nebula Journal
          </div>

          <Motion
            tag="h1"
            :initial="{ y: 28, opacity: 0 }"
            :animate="{ y: 0, opacity: 1 }"
            :transition="{ duration: 0.8, ease: 'easeOut' }"
            class="text-4xl md:text-6xl font-semibold text-white text-shadow-soft leading-tight"
          >
            <RotatingText
              :texts="['随手记录', '日常碎片', '慢慢写作']"
              :auto="true"
              :stagger-duration="0.04"
              :rotation-interval="2800"
              element-level-class-name="inline-block"
            />
            <span class="block mt-4 text-white/70 text-2xl md:text-3xl">
              一个更私人的博客与快照墙
            </span>
          </Motion>

          <Motion
            tag="p"
            :initial="{ y: 18, opacity: 0 }"
            :animate="{ y: 0, opacity: 1 }"
            :transition="{ duration: 0.8, delay: 0.25, ease: 'easeOut' }"
            class="mt-6 max-w-2xl text-base md:text-lg text-white/70"
          >
            写点想法，留点日常。喜欢轻盈的排版和一点点霓虹感。
          </Motion>

          <Motion
            tag="div"
            :initial="{ y: 18, opacity: 0 }"
            :animate="{ y: 0, opacity: 1 }"
            :transition="{ duration: 0.6, delay: 0.55, ease: 'easeOut' }"
            class="mt-10 flex flex-wrap items-center gap-4"
          >
            <NuxtLink
              to="/blog"
              class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-3 text-sm font-medium text-white backdrop-blur hover:bg-white/20 transition"
            >
              开始阅读
              <span class="text-base">→</span>
            </NuxtLink>
            <NuxtLink
              to="/snapshots"
              class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3 text-sm font-medium text-white/80 backdrop-blur hover:bg-white/15 hover:text-white transition"
            >
              我的快照
              <span class="text-base">→</span>
            </NuxtLink>
          </Motion>
        </div>
        <template #fallback>
          <div class="max-w-5xl mx-auto w-full text-white">
            <h1 class="text-4xl md:text-6xl font-semibold">
              一个更私人的博客与快照墙
            </h1>
            <p class="mt-4 text-white/70">
              写点想法，留点日常。喜欢轻盈的排版和一点点霓虹感。
            </p>
            <NuxtLink
              to="/blog"
              class="inline-flex items-center gap-2 mt-8 rounded-full border border-white/20 bg-white/10 px-7 py-3 text-sm font-medium text-white"
            >
              开始阅读
              <span class="text-base">→</span>
            </NuxtLink>
          </div>
        </template>
      </ClientOnly>

    </main>
  </div>
</template>

<script setup lang="ts">
import { Motion } from 'motion-v';
import RotatingText from '~/components/RotatingText.vue';

</script>

<style scoped></style>
