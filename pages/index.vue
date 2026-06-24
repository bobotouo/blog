<template>
  <div>
    <!-- Hero -->
    <section class="hand-section pt-8 md:pt-12 pb-4">
      <div class="hand-container relative">
        <!-- decorative scribble - desktop only -->
        <svg
          class="hidden md:block absolute -right-4 top-8 w-24 h-24 text-marker/30 -rotate-12"
          viewBox="0 0 100 100"
          fill="none"
          aria-hidden="true"
        >
          <path d="M10 50 Q30 10 50 50 T90 50" stroke="currentColor" stroke-width="3" stroke-dasharray="6 4" />
          <circle cx="85" cy="48" r="4" fill="currentColor" />
        </svg>

        <div class="max-w-3xl">
          <HandTag variant="postit" class="mb-6 -rotate-1">
            🎉 欢迎光临~
          </HandTag>

          <ClientOnly>
            <Motion
              tag="h1"
              :initial="{ y: 30, opacity: 0 }"
              :animate="{ y: 0, opacity: 1 }"
              :transition="{ duration: 0.7, ease: 'easeOut' }"
              class="font-heading font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-pencil leading-[1.05] mb-6"
            >
              {{ site.name }}
              <span class="inline-block text-marker rotate-6 ml-1">!</span>
            </Motion>
            <template #fallback>
              <h1 class="font-heading font-bold text-5xl sm:text-6xl md:text-7xl text-pencil leading-tight mb-6">
                {{ site.name }}!
              </h1>
            </template>
          </ClientOnly>

          <ClientOnly>
            <Motion
              tag="div"
              :initial="{ y: 20, opacity: 0 }"
              :animate="{ y: 0, opacity: 1 }"
              :transition="{ duration: 0.6, delay: 0.15 }"
              class="mb-4"
            >
              <p class="font-heading text-2xl md:text-3xl text-pencil/80">
                <RotatingText
                  :texts="['祝各位朋友', '生活愉快', '心想事成', '万事如意','平安喜乐🎉']"
                  :auto="true"
                  :stagger-duration="0.04"
                  :rotation-interval="3000"
                  element-level-class-name="inline-block text-pencil"
                />
              </p>
            </Motion>
            <template #fallback>
              <p class="font-heading text-2xl text-pencil/80 mb-4">写点想法</p>
            </template>
          </ClientOnly>

          <p class="font-body text-lg md:text-xl text-pencil/65 max-w-lg leading-relaxed mb-8">
            {{ site.description }}。花有重开日，人无再少年。时日有尽，余生很贵，今朝有酒今朝醉。
          </p>
        </div>
      </div>
    </section>

    <!-- Portal cards -->
    <section class="hand-section pt-4 pb-8">
      <div class="hand-container">
        <div class="grid gap-8 md:grid-cols-3">
          <NuxtLink
            v-for="(portal, idx) in portals"
            :key="portal.to"
            :to="portal.to"
            class="block group"
          >
            <HandCard
              :decoration="portal.decoration"
              :rotate="portal.rotate"
              padding="p-6 md:p-8"
              class="h-full group-hover:shadow-hand transition-shadow duration-100"
            >
              <div class="text-3xl mb-3" aria-hidden="true">{{ portal.emoji }}</div>
              <h2 class="font-heading text-2xl md:text-3xl font-bold text-pencil mb-2 group-hover:text-marker transition-colors">
                {{ portal.title }}
              </h2>
              <p class="font-body text-pencil/65 leading-relaxed mb-4">
                {{ portal.desc }}
              </p>
              <span class="font-body text-pen group-hover:text-marker transition-colors inline-flex items-center gap-1">
                去看看
                <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <p v-if="portal.count !== null" class="mt-3 font-body text-sm text-pencil/40">
                {{ portal.count }} {{ portal.countLabel }}
              </p>
            </HandCard>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Latest content -->
    <section class="hand-section pt-4">
      <div class="hand-container">
        <div class="grid gap-10 lg:grid-cols-2 lg:gap-12">
          <!-- Recent posts -->
          <HandSectionPanel label="最新随笔" rotate="-0.5deg">
            <div class="space-y-4">
              <NuxtLink
                v-for="(post, idx) in recentPosts"
                :key="post._path"
                :to="nuxtLinkToFromContentPath(post._path, base)"
                class="block"
              >
                <HandCard
                  :decoration="idx === 0 ? 'tack' : 'none'"
                  :rotate="idx % 2 === 0 ? '-0.5deg' : '0.5deg'"
                  padding="p-4"
                  flat
                  class="border-pencil/40"
                >
                  <p class="font-body text-sm text-pencil/45 mb-1">{{ formatDateYmd(post.date) }}</p>
                  <h3 class="font-heading text-lg font-bold text-pencil group-hover:text-pen transition-colors line-clamp-2">
                    {{ post.title }}
                  </h3>
                  <p v-if="post.description" class="font-body text-sm text-pencil/60 mt-1.5 line-clamp-2 leading-relaxed">
                    {{ post.description }}
                  </p>
                </HandCard>
              </NuxtLink>
              <p v-if="!recentPosts.length" class="font-body text-pencil/45">还没有文章诶～</p>
            </div>
            <div class="mt-6">
              <HandButton to="/blog" variant="primary">全部随笔 →</HandButton>
            </div>
          </HandSectionPanel>

          <!-- Snapshots preview -->
          <HandSectionPanel label="生活快照" rotate="0.5deg">
            <HomeSnapshotCard
              :loading="snapshotsPending"
              :snapshots="homeSnapshots"
              title="日常快照"
              summary="记录生活一点一滴"
            />
          </HandSectionPanel>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Motion } from "motion-v";
import { site } from "~/utils/design-tokens";
import { formatDateYmd } from "~/utils/format-date";
import { nuxtLinkToFromContentPath } from "~/utils/route-from-content-path";
import { useFictionSeries } from "~/composables/useFictionSeries";
import { useBlogList } from "~/composables/useBlogList";
import HomeSnapshotCard from "~/components/HomeSnapshotCard.vue";
import type { HandCardDecoration } from "~/utils/design-tokens";

definePageMeta({ layout: "blog" });

const config = useRuntimeConfig();
const base = (config.public.baseUrl as string) || "/";
const basePath = base.replace(/\/$/, "");
const jsonBase = import.meta.server ? "" : basePath;

const { data: posts } = await useBlogList("home-blog-list");

const { data: fictionSeriesData } = await useFictionSeries();

const { data: snapshots, pending: snapshotsPending } = useAsyncData(
  "home-snapshots",
  async () => {
    const jsonPath = basePath ? `${jsonBase}/snapshots-list.json` : "/snapshots-list.json";
    return await $fetch<unknown[]>(jsonPath).catch(() => []);
  },
  { server: false, lazy: true, default: () => [] },
);

const recentPosts = computed(
  () => (posts.value ?? []).slice(0, 3) as Array<{ _path: string; title: string; date: string; description?: string }>,
);

const postCount = computed(() => (posts.value ?? []).length);
const fictionCount = computed(() => (fictionSeriesData.value ?? []).length);
const snapshotCount = computed(() => (snapshots.value ?? []).length);

const portals = computed(() => [
  {
    to: "/blog",
    title: "随笔",
    desc: "技术笔记、日常思考、阅读摘录。(其实全是自动化采集 AI 总结的...)",
    emoji: "📝",
    decoration: "tack" as HandCardDecoration,
    rotate: "-1deg",
    count: postCount.value,
    countLabel: "篇文章",
  },
  {
    to: "/ai-fiction",
    title: "幻想",
    desc: "AI 编织的长短篇故事。(其实是 token 溢出了花不完...)",
    emoji: "📖",
    decoration: "tack" as HandCardDecoration,
    rotate: "1deg",
    count: fictionCount.value,
    countLabel: "部小说",
  },
  {
    to: "/snapshots",
    title: "快照",
    desc: "记录生活中日常的快照，心情。(其实是不好发朋友圈的碎碎念...)",
    emoji: "📸",
    decoration: "tack" as HandCardDecoration,
    rotate: "-0.5deg",
    count: snapshotCount.value,
    countLabel: "条快照",
  },
]);

function withBasePath(path: string): string {
  const b = (config.public.baseUrl as string) || "/";
  if (!b || b === "/") return path;
  const prefix = b.replace(/\/$/, "");
  if (path.startsWith("/uploads/") || path.startsWith("/images/")) return prefix + path;
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
  });
});

onMounted(() => {
  const warmup = () => {
    preloadRouteComponents("/blog").catch(() => {});
    preloadRouteComponents("/ai-fiction").catch(() => {});
    preloadRouteComponents("/snapshots").catch(() => {});
  };
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(warmup, { timeout: 1200 });
  } else {
    setTimeout(warmup, 300);
  }
});
</script>
