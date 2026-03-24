<template>
  <section class="max-w-5xl mx-auto py-10 px-6">
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
      <div>
        <p class="text-xs uppercase tracking-[0.4em] text-white/50 mb-4">AI Fiction</p>
        <h1 class="text-4xl md:text-5xl font-semibold text-white">
          AI 小说
        </h1>
        <p class="mt-3 text-white/60 max-w-xl">
          连载目录，点进单本查看章节。
        </p>
      </div>
      <div class="flex items-center gap-4 text-sm text-white/55">
        <span>{{ fictionSeries.length }} 本</span>
        <NuxtLink to="/blog?tab=ai-fiction" class="hover:text-white transition">
          博客入口 →
        </NuxtLink>
      </div>
    </div>

    <div v-if="fictionSeries.length > 0" class="space-y-4">
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
            <div class="text-xs uppercase tracking-[0.3em] text-white/45">Novel</div>
            <h2 class="text-xl md:text-2xl font-semibold text-white">{{ series.novelName }}</h2>
            <p v-if="series.description" class="text-sm text-white/75 line-clamp-2">
              {{ series.description }}
            </p>
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

    <p v-else class="text-white/50 text-sm">
      暂无小说。在 <code class="text-white/70">content/ai-fiction/&lt;书名&gt;/</code> 下添加 <code class="text-white/70">summary.md</code> 与章节 md，并执行
      <code class="text-white/70">node scripts/generate-blog-list.mjs</code>。
    </p>
  </section>
</template>

<script setup lang="ts">
import { nuxtLinkToFromContentPath } from "~/utils/route-from-content-path";

definePageMeta({
  layout: "blog",
});

const config = useRuntimeConfig();
const base = (config.public.baseUrl as string) || "/";
const basePath = base.replace(/\/$/, "");

type SeriesItem = {
  novelSlug: string;
  novelName: string;
  indexPath: string;
  description?: string;
  coverImage?: string;
  chapterCount: number;
};

async function loadSeriesFromQuery(): Promise<SeriesItem[]> {
  const rows = await queryContent("ai-fiction").find();
  const summaryPaths = rows.filter((r) => String(r._path).endsWith("/summary"));
  const out: SeriesItem[] = [];
  for (const s of summaryPaths) {
    const path = String(s._path);
    const novelSlug = path.replace(/^\/ai-fiction\//, "").replace(/\/summary$/, "");
    if (!novelSlug) continue;
    const chapters = rows.filter(
      (r) =>
        String(r._path).startsWith(`/ai-fiction/${novelSlug}/`) &&
        !String(r._path).endsWith("/summary"),
    );
    const fm = s as { title?: string; description?: string; coverImage?: string };
    out.push({
      novelSlug,
      novelName: fm.title ?? novelSlug,
      indexPath: `/ai-fiction/${novelSlug}`,
      description: fm.description,
      coverImage: fm.coverImage as string | undefined,
      chapterCount: chapters.length,
    });
  }
  out.sort((a, b) => a.novelName.localeCompare(b.novelName, "zh-CN"));
  return out;
}

const { data: fictionSeriesData } = await useAsyncData(
  "ai-fiction-landing",
  async () => {
    const fromJson = await $fetch<SeriesItem[]>(`${basePath}/ai-fiction-series.json`).catch(
      () => [] as SeriesItem[],
    );
    if (Array.isArray(fromJson) && fromJson.length > 0) return fromJson;
    try {
      return await loadSeriesFromQuery();
    } catch {
      return [] as SeriesItem[];
    }
  },
  { getCachedData: () => undefined },
);

const fictionSeries = computed(() => fictionSeriesData.value ?? []);

const route = useRoute();
usePageStats(route.path);
</script>
