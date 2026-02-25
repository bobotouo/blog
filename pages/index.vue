<template>
  <div
    class="relative w-full min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#16212f_0%,_#0a0f14_45%,_#05070b_100%)]"
  >
    <div class="absolute inset-0 bg-grid opacity-[0.2]" aria-hidden />
    <NebulaGlow />

    <main class="relative z-10 min-h-screen flex flex-col justify-center px-6 py-16">
      <div class="max-w-6xl mx-auto w-full flex flex-col md:flex-row md:items-center md:justify-between gap-12 md:gap-16">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/60 mb-6">
            <span class="h-[1px] w-8 bg-white/40" />
            Nebula Journal
          </div>

          <ClientOnly>
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
            <template #fallback>
              <h1 class="text-4xl md:text-6xl font-semibold text-white text-shadow-soft leading-tight">
                随手记录
                <span class="block mt-4 text-white/70 text-2xl md:text-3xl">
                  一个更私人的博客与快照墙
                </span>
              </h1>
            </template>
          </ClientOnly>

          <p class="mt-6 max-w-2xl text-base md:text-lg text-white/70">
            写点想法，留点日常。
          </p>

          <div class="mt-10">
            <NuxtLink
              to="/blog"
              class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-3 text-sm font-medium text-white backdrop-blur hover:bg-white/20 transition"
            >
              开始阅读
              <span class="text-base">→</span>
            </NuxtLink>
          </div>
        </div>

        <div class="flex-shrink-0 w-full md:w-[320px] lg:w-[360px]">
          <HomeSnapshotCard
            v-if="homeSnapshots.length"
            :snapshots="homeSnapshots"
          />
          <HomeSnapshotCard
            v-else
            title="日常快照"
            summary="像朋友圈一样记录生活片段，轻量、直接。"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { Motion } from "motion-v";
import RotatingText from "~/components/RotatingText.vue";
import NebulaGlow from "~/components/NebulaGlow.vue";
import HomeSnapshotCard from "~/components/HomeSnapshotCard.vue";

const config = useRuntimeConfig();
const basePath = ((config.public.baseUrl as string) || "/").replace(/\/$/, "");

const { data: snapshots } = await useAsyncData(
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
    return await $fetch<unknown[]>(`${basePath}/snapshots-list.json`).catch(() => []);
  },
  { getCachedData: () => (import.meta.dev ? null : undefined) },
);

const homeSnapshots = computed(() => {
  const list = snapshots.value;
  if (!Array.isArray(list) || list.length === 0) return [];
  return list.slice(0, 5) as Array<{ title?: string; summary?: string; images?: string[] }>;
});
</script>

<style scoped></style>
