<template>
  <section class="max-w-5xl mx-auto py-10 px-6">
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
      <div>
        <p class="text-xs uppercase tracking-[0.4em] text-white/50 mb-4">
          Latest Posts
        </p>
        <h1 class="text-4xl md:text-5xl font-semibold text-white">
          记录、思考、延伸
        </h1>
        <p class="mt-3 text-white/60 max-w-xl">
          保持阅读专注。
        </p>
      </div>
      <div class="text-white/50 text-sm">
        {{ activeTab === "ai-fiction" ? `${fictionSeries.length} 本小说` : `${activePosts.length} 篇内容` }}
      </div>
    </div>
    <div class="mb-8 inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="rounded-full px-5 py-2 text-sm transition"
        :class="activeTab === tab.key ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white'"
        @click="setTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div v-if="activeTab === 'ai-fiction' && fictionSeries.length > 0" class="mb-10 space-y-4">
      <NuxtLink
        v-for="series in fictionSeries"
        :key="series.novelSlug"
        :to="nuxtLinkToFromContentPath(series.indexPath, base)"
        class="block rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden hover:bg-white/10 transition"
      >
        <div class="grid gap-0 md:grid-cols-[200px_1fr]">
          <div class="h-full min-h-[130px] bg-black/20">
            <img
              v-if="series.coverImage"
              :src="series.coverImage"
              :alt="series.novelName"
              class="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div class="p-4 md:p-5 space-y-2.5">
            <div class="flex flex-wrap items-center gap-2">
              <div class="text-xs uppercase tracking-[0.3em] text-white/45">Novel</div>
              <FictionStatusBadge :status="series.status" />
            </div>
            <h3 class="text-xl md:text-2xl font-semibold text-white">{{ series.novelName }}</h3>
            <p v-if="series.description" class="text-sm text-white/75 line-clamp-2">{{ series.description }}</p>
            <div class="text-xs md:text-sm text-white/55">
              共 {{ series.chapterCount }} 章
            </div>
            <span class="inline-flex items-center rounded-full border border-white/20 px-3.5 py-1.5 text-xs md:text-sm text-white/90">
              查看目录 →
            </span>
          </div>
        </div>
      </NuxtLink>
    </div>

    <div v-if="featured && activeTab !== 'ai-fiction'" class="mb-10">
      <NuxtLink
        :to="nuxtLinkToFromContentPath(featured._path, base)"
        class="group grid gap-6 md:grid-cols-[1.1fr_1fr] rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden hover:bg-white/10 transition"
      >
        <div class="max-h-[220px] min-h-[52px]">
          <img
            v-if="featured.coverImage"
            :src="featured.coverImage"
            alt="cover"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            class=" w-full object-cover group-hover:scale-[1.02] transition"
          />
          <div
            v-else
            class="h-full w-full bg-[linear-gradient(135deg,_rgba(34,211,238,0.25),_rgba(249,115,22,0.15))]"
          />
        </div>
        <div class="p-5 md:p-6 space-y-3">
          <div class="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/40">
            <span>Featured</span>
            <span class="text-white/30">→</span>
          </div>
          <h2 class="text-2xl md:text-3xl font-semibold text-white group-hover:text-[color:var(--accent)] transition">
            {{ featured.title }}
          </h2>
          <p class="text-sm text-white/60">{{ formatDateYmd(featured.date) }}</p>
          <p class="text-white/80" v-if="featured.description">
            {{ featured.description }}
          </p>
          <div class="text-xs uppercase tracking-[0.25em] text-white/40">
            继续阅读 →
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- 两列瀑布流：使用 CSS 多列布局，每张卡片 break-inside-avoid 保证不被打断 -->
    <div v-if="activeTab !== 'ai-fiction'" class="columns-1 md:columns-2 [column-gap:1.5rem]">
      <article
        v-for="post in rest"
        :key="post._path"
        class="group p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300 shadow-[0_0_0_rgba(0,0,0,0)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.35)] break-inside-avoid mb-6"
      >
        <NuxtLink :to="nuxtLinkToFromContentPath(post._path, base)" class="block space-y-3">
          <div class="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/40">
            <span>Article</span>
            <span class="text-white/30">→</span>
          </div>
          <h2 class="text-2xl font-semibold text-white group-hover:text-[color:var(--accent)] transition">
            {{ post.title }}
          </h2>
          <p class="text-sm text-white/60">{{ formatDateYmd(post.date) }}</p>
          <p class="text-white/80" v-if="post.description">
            {{ post.description }}
          </p>
          <div class="text-xs text-white/40">查看评论 →</div>
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
