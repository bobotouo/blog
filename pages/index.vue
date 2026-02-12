<template>
  <div
    class="relative w-full min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#16212f_0%,_#0a0f14_45%,_#05070b_100%)]"
  >
    <div class="absolute inset-0 bg-grid opacity-[0.2]" aria-hidden />
    <NebulaGlow />

    <main
      class="relative z-10 min-h-screen flex flex-col justify-center px-6 py-16"
    >
      <ClientOnly>
        <div class="max-w-6xl mx-auto w-full flex flex-col md:flex-row md:items-center md:justify-between gap-12 md:gap-16">
          <!-- 左侧：标题 + 描述 + 开始阅读 -->
          <div class="flex-1 min-w-0">
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
              写点想法，留点日常。
            </Motion>

            <Motion
              tag="div"
              :initial="{ y: 18, opacity: 0 }"
              :animate="{ y: 0, opacity: 1 }"
              :transition="{ duration: 0.6, delay: 0.55, ease: 'easeOut' }"
              class="mt-10"
            >
              <NuxtLink
                to="/blog"
                class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-3 text-sm font-medium text-white backdrop-blur hover:bg-white/20 transition"
              >
                开始阅读
                <span class="text-base">→</span>
              </NuxtLink>
            </Motion>
          </div>

          <!-- 右侧：大头贴风格快照卡片 -->
          <Motion
            :initial="{ x: 24, opacity: 0 }"
            :animate="{ x: 0, opacity: 1 }"
            :transition="{ duration: 0.7, delay: 0.35, ease: 'easeOut' }"
            class="flex-shrink-0 w-full md:w-[320px] lg:w-[360px]"
          >
            <HomeSnapshotCard
              v-if="homeSnapshots.length"
              :snapshots="homeSnapshots"
            />
            <HomeSnapshotCard
              v-else
              title="日常快照"
              summary="像朋友圈一样记录生活片段，轻量、直接。"
            />
          </Motion>
        </div>

        <template #fallback>
          <div class="max-w-5xl mx-auto w-full text-white">
            <h1 class="text-4xl md:text-6xl font-semibold">
              一个更私人的博客与快照墙
            </h1>
            <p class="mt-4 text-white/70">
              写点想法，留点日常。
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
import { Motion } from "motion-v";
import RotatingText from "~/components/RotatingText.vue";
import NebulaGlow from "~/components/NebulaGlow.vue";
import HomeSnapshotCard from "~/components/HomeSnapshotCard.vue";

const config = useRuntimeConfig();
const basePath = ((config.public.baseUrl as string) || "/").replace(/\/$/, "");

const { data: snapshots } = await useAsyncData("home-latest-snapshot", async () => {
  if (import.meta.server) {
    const list = await queryContent("snapshots").sort({ date: -1 }).find();
    return list;
  }
  const cached = useNuxtData("home-latest-snapshot").data.value;
  if (cached?.length !== undefined) return cached;
  const list = await $fetch<unknown[]>(`${basePath}/snapshots-list.json`).catch(() => []);
  return list;
});

const homeSnapshots = computed(() => {
  const list = snapshots.value;
  if (!Array.isArray(list) || list.length === 0) return [];
  return list.slice(0, 5) as Array<{ title?: string; summary?: string; images?: string[] }>;
});
</script>

<style scoped></style>
