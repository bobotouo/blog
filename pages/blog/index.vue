<template>
  <section class="max-w-6xl mx-auto py-12 px-6">
    <!-- 页面标题区域 -->
    <div class="mb-12">
      <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-pulse"></span>
            <span class="text-xs uppercase tracking-[0.35em] text-white/40 font-medium">
              {{ activeTab === 'ai-fiction' ? 'Fiction' : 'Latest Posts' }}
            </span>
          </div>
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            <span v-if="activeTab === 'ai-fiction'" class="bg-gradient-to-r from-amber-400 to-pink-400 bg-clip-text text-transparent">
              AI 小说
            </span>
            <span v-else class="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              记录、思考、延伸
            </span>
          </h1>
          <p class="text-white/50 max-w-2xl text-lg leading-relaxed">
            <span v-if="activeTab === 'ai-fiction'">
              探索 AI 创作的无限可能，每一部小说都是一次新的冒险。
            </span>
            <span v-else>
              在文字中沉淀思考，在点滴中记录成长。保持阅读，保持思考。
            </span>
          </p>
        </div>
        <div class="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <svg class="w-5 h-5 text-cyan-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span class="text-white/60 text-sm font-medium">
            {{ activeTab === "ai-fiction" ? `${fictionSeries.length} 本小说` : `${activePosts.length} 篇内容` }}
          </span>
        </div>
      </div>
    </div>

    <!-- Tab 切换 -->
    <div class="mb-10">
      <div class="inline-flex items-center gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/10">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="relative px-6 py-2.5 text-sm font-medium transition-all duration-300 rounded-xl"
          :class="activeTab === tab.key
            ? 'text-white shadow-lg'
            : 'text-white/50 hover:text-white/80'"
          @click="setTab(tab.key)"
        >
          <span v-if="activeTab === tab.key" class="absolute inset-0 rounded-xl bg-gradient-to-r"
            :class="tab.key === 'ai-fiction'
              ? 'from-amber-500/20 to-pink-500/20 border border-amber-500/30'
              : 'from-cyan-500/20 to-blue-500/20 border border-cyan-500/30'"
          ></span>
          <span class="relative z-10">{{ tab.label }}</span>
        </button>
      </div>
    </div>

    <!-- AI 小说系列 -->
    <div v-if="activeTab === 'ai-fiction' && fictionSeries.length > 0" class="space-y-6">
      <FictionSeriesCard
        v-for="(series, idx) in fictionSeries"
        :key="series.novelSlug"
        :novel-name="series.novelName"
        :description="series.description"
        :cover-image="series.coverImage"
        :chapter-count="series.chapterCount"
        :status="series.status"
        :to="nuxtLinkToFromContentPath(series.indexPath, base)"
        :comment-path="`${basePath}${series.indexPath}`"
        class="card-hover-lift"
      />
    </div>

    <!-- 精选文章 -->
    <div v-if="featured && activeTab !== 'ai-fiction'" class="mb-12">
      <div class="mb-6 flex items-center gap-3">
        <span class="w-8 h-px bg-gradient-to-r from-cyan-400 to-transparent"></span>
        <span class="text-xs uppercase tracking-[0.3em] text-cyan-400/60 font-medium">精选文章</span>
      </div>
      <NuxtLink
        :to="nuxtLinkToFromContentPath(featured._path, base)"
        class="group block rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl overflow-hidden hover:border-cyan-500/20 transition-all duration-500 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
      >
        <div class="grid gap-8 md:grid-cols-[1.2fr_1fr]">
          <div class="relative overflow-hidden max-h-[280px] min-h-[200px]">
            <div class="absolute inset-0 bg-gradient-to-t from-[#05080c] via-transparent to-transparent z-10"></div>
            <img
              v-if="featured.coverImage"
              :src="featured.coverImage"
              :alt="featured.title"
              loading="eager"
              fetchpriority="high"
              decoding="async"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div
              v-else
              class="h-full w-full bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-purple-500/20"
            />
          </div>
          <div class="p-8 md:p-10 flex flex-col justify-center space-y-4">
            <div class="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-cyan-400/60">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span>Featured</span>
            </div>
            <h2 class="text-3xl md:text-4xl font-bold text-white group-hover:text-cyan-300 transition-colors duration-300">
              {{ featured.title }}
            </h2>
            <p class="text-white/60">{{ formatDateYmd(featured.date) }}</p>
            <p class="text-white/70 text-lg leading-relaxed" v-if="featured.description">
              {{ featured.description }}
            </p>
            <div class="flex items-center gap-2 text-cyan-400/60 group-hover:text-cyan-300 transition-colors duration-300 pt-2">
              <span class="text-sm font-medium">继续阅读</span>
              <svg class="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- 文章列表 - 瀑布流 -->
    <div v-if="activeTab !== 'ai-fiction'" class="columns-1 md:columns-2 [&>article]:break-inside-avoid [column-gap:1.5rem]">
      <article
        v-for="(post, idx) in rest"
        :key="post._path"
        class="group block mb-6 p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-md hover:border-cyan-500/20 transition-all duration-500 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] card-hover-lift"
        :style="`animation-delay: ${idx * 50}ms`"
      >
        <NuxtLink :to="nuxtLinkToFromContentPath(post._path, base)" class="block space-y-4">
          <div class="flex items-center justify-between">
            <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <span class="w-1 h-1 rounded-full bg-cyan-400/60"></span>
              <span class="text-[10px] uppercase tracking-[0.3em] text-white/40 font-medium">Article</span>
            </span>
            <svg class="w-4 h-4 text-white/20 group-hover:text-cyan-400/60 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors duration-300 leading-snug">
            {{ post.title }}
          </h2>
          <p class="text-sm text-white/50">{{ formatDateYmd(post.date) }}</p>
          <p class="text-white/60 leading-relaxed" v-if="post.description">
            {{ post.description }}
          </p>
          <div class="flex items-center gap-2 pt-2 text-xs text-white/30 group-hover:text-cyan-400/40 transition-colors duration-300">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>查看评论</span>
          </div>
        </NuxtLink>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { formatDateYmd } from "~/utils/format-date";
import { nuxtLinkToFromContentPath } from "~/utils/route-from-content-path";

definePageMeta({
  layout: "blog",
});

const config = useRuntimeConfig();
const base = (config.public.baseUrl as string) || "/";
const basePath = base.replace(/\/$/, "");
const jsonBase = import.meta.server ? "" : basePath;
const route = useRoute();
const router = useRouter();

const tabs = [
  { key: "podcast", label: "博客" },
  { key: "ai-fiction", label: "AI 小说" },
] as const;
type TabKey = (typeof tabs)[number]["key"];

function resolveTab(value: unknown): TabKey {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "ai-fiction" ? "ai-fiction" : "podcast";
}

/** 默认与静态预渲染一致；真实 tab 在客户端 onMounted 里按地址栏同步 */
const activeTab = ref<TabKey>("podcast");

function applyTabFromAddressBar() {
  if (typeof window === "undefined") return;
  const tab = new URLSearchParams(window.location.search).get("tab");
  activeTab.value = tab === "ai-fiction" ? "ai-fiction" : "podcast";
}

onMounted(() => {
  applyTabFromAddressBar();
});

watch(
  () => route.fullPath,
  () => {
    if (import.meta.client) applyTabFromAddressBar();
    else activeTab.value = resolveTab(route.query.tab);
  },
);

function setTab(tab: TabKey) {
  activeTab.value = tab;
  const query = { ...route.query };
  if (tab === "podcast") {
    delete query.tab;
  } else {
    query.tab = tab;
  }
  router.replace({ query });
}

const { data: posts } = await useAsyncData(
  "blog",
  async () => {
    if (import.meta.server) {
      return await queryContent("blog").sort({ date: -1 }).find();
    }
    const cached = useNuxtData("blog").data.value;
    if (cached?.length !== undefined) return cached;
    if (import.meta.dev) {
      try {
        return await queryContent("blog").sort({ date: -1 }).find();
      } catch {
        /* fallback */
      }
    }
    return await $fetch<unknown[]>(`${jsonBase}/blog-list.json`).catch(() => []);
  },
  { getCachedData: () => (import.meta.dev ? null : undefined) },
);

const { data: fictionSeriesData } = await useAsyncData(
  "ai-fiction-series",
  () => $fetch<unknown[]>(`${jsonBase}/ai-fiction-series.json`).catch(() => []),
  { getCachedData: () => undefined },
);

const fictionSeries = computed(
  () =>
    (fictionSeriesData.value ?? []) as Array<{
      novelSlug: string;
      novelName: string;
      indexPath: string;
      description?: string;
      coverImage?: string;
      chapterCount: number;
      status?: string;
    }>,
);

const activePosts = computed(
  () =>
    (posts.value ?? []) as Array<{
      _path: string;
      title: string;
      date: string | Date;
      description?: string;
      coverImage?: string;
    }>,
);
const featured = computed(() => {
  const list = activePosts.value ?? [];
  if (!list.length) return null;
  return (
    list.find((p) => String(p._path).endsWith("/2024-01-01-welcome")) ??
    list.find((p) => String(p.title).includes("欢迎")) ??
    list[0] ??
    null
  );
});
const rest = computed(() => {
  const list = activePosts.value ?? [];
  const f = featured.value;
  return list
    .filter((p) => !f || p._path !== f._path)
    .sort((a, b) => {
      const ta = new Date(a.date as string | Date).getTime();
      const tb = new Date(b.date as string | Date).getTime();
      return tb - ta;
    });
});

usePageStats(route.path);
</script>

<style scoped></style>
