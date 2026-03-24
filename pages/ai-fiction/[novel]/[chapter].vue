<template>
  <article class="max-w-4xl mx-auto py-10 px-6">
    <button
      type="button"
      class="inline-block bg-transparent border-0 p-0 text-left text-xs uppercase tracking-[0.35em] text-white/50 hover:text-white/70 transition cursor-pointer font-inherit"
      @click="goBack"
    >
      ← 返回目录
    </button>

    <div class="mt-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 md:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
      <div v-if="pending" class="article-skeleton space-y-6">
        <div class="article-skeleton-line h-3 w-20 rounded-full" />
        <div class="article-skeleton-line h-10 max-w-xl rounded-lg" />
        <div class="article-skeleton-line h-4 w-48 rounded-full" />
        <div class="space-y-2 pt-4">
          <div class="article-skeleton-line h-4 w-full rounded" />
          <div class="article-skeleton-line h-4 w-full rounded" />
        </div>
      </div>
      <template v-else-if="post">
        <p class="text-xs uppercase tracking-[0.4em] text-white/40 mb-4">AI Fiction</p>
        <h1 class="text-4xl md:text-5xl font-semibold text-white mb-4">
          {{ post.title }}
        </h1>
        <div class="text-sm text-white/60 mb-6 flex flex-wrap items-center gap-4">
          <span>{{ formatDate(post.date) }}</span>
          <span v-if="views !== null" class="text-white/40">· {{ views }} 次阅读</span>
          <span v-if="commentCount !== null" class="text-white/40">
            · {{ commentCount }} 条评论
          </span>
        </div>
        <div v-if="post.tags" class="flex flex-wrap gap-2 mb-8">
          <span
            v-for="tag in post.tags"
            :key="tag"
            class="px-4 py-1.5 bg-white/10 text-white/80 rounded-full text-xs border border-white/15"
          >
            {{ tag }}
          </span>
        </div>

        <div class="prose prose-invert max-w-none">
          <div v-if="staticBody" v-html="staticBody" />
          <ContentRenderer v-else :value="post as any" />
        </div>
      </template>
    </div>

    <nav
      v-if="!pending && post && (prevNext.prev || prevNext.next)"
      class="mt-8 flex flex-col sm:flex-row sm:justify-between gap-3 w-full"
      aria-label="章节导航"
    >
      <div class="flex-1 min-w-0 sm:max-w-[48%]">
        <NuxtLink
          v-if="prevNext.prev"
          :to="prevNext.prev._path"
          class="group block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition text-left"
        >
          <span class="text-xs uppercase tracking-[0.25em] text-white/45">上一章</span>
          <span class="mt-1 block text-sm font-medium text-white group-hover:text-[color:var(--accent)] line-clamp-2">
            {{ prevNext.prev.title }}
          </span>
        </NuxtLink>
      </div>
      <div class="flex-1 min-w-0 sm:max-w-[48%] flex sm:justify-end">
        <NuxtLink
          v-if="prevNext.next"
          :to="prevNext.next._path"
          class="group block w-full sm:w-auto rounded-2xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition text-right"
        >
          <span class="text-xs uppercase tracking-[0.25em] text-white/45">下一章</span>
          <span class="mt-1 block text-sm font-medium text-white group-hover:text-[color:var(--accent)] line-clamp-2">
            {{ prevNext.next.title }}
          </span>
        </NuxtLink>
      </div>
    </nav>

    <div v-if="!pending && post" class="mt-10">
      <div class="text-xs uppercase tracking-[0.35em] text-white/50 mb-4">
        Comments
      </div>
      <Comments />
    </div>
  </article>
</template>

<script setup lang="ts">
import { normalizeSegment } from "~/utils/ai-fiction-slug";

definePageMeta({
  layout: "blog",
  middleware: (to) => {
    if (to.params.chapter === "summary") {
      return navigateTo(`/ai-fiction/${encodeURIComponent(String(to.params.novel))}`, { replace: true });
    }
  },
});

const route = useRoute();
const router = useRouter();
const novel = computed(() => normalizeSegment(String(route.params.novel ?? "")));
const chapter = computed(() => normalizeSegment(String(route.params.chapter ?? "")));
const stableKey = computed(() => `chapter::${route.path.replace(/\/$/, "")}`);

const config = useRuntimeConfig();
const base = (config.public.baseUrl as string) || "/";
const basePath = base.replace(/\/$/, "");
const fullPath = basePath + route.path;
const { views } = usePageStats(fullPath);
const { count: commentCount } = useCommentCount(fullPath);

function cmpChapterPath(a: string, b: string) {
  const fa = a.split("/").pop() || a;
  const fb = b.split("/").pop() || b;
  const na = fa.match(/^(\d+)/)?.[1];
  const nb = fb.match(/^(\d+)/)?.[1];
  if (na && nb && na !== nb) return Number(na) - Number(nb);
  return fa.localeCompare(fb, "zh-CN", { numeric: true });
}

type ChapterNavItem = { _path: string; title: string; chapterFile?: string };

const { data: chapterNavList } = await useAsyncData(
  computed(() => `nav::${route.path.replace(/\/[^/]+$/, "")}`),
  async () => {
    const n = novel.value;
    const list = await $fetch<Array<{ novelSlug: string; chapters?: ChapterNavItem[] }>>(
      `${basePath}/ai-fiction-series.json`,
    ).catch(() => []);
    const s = list.find((x) => normalizeSegment(x.novelSlug) === n);
    if (s?.chapters?.length) return s.chapters as ChapterNavItem[];
    // fallback: queryContent
    try {
      const all = await queryContent("ai-fiction").find();
      const chapterRows = all.filter(
        (r) =>
          normalizeSegment(String(r._path).replace(/^\/ai-fiction\//, "").split("/")[0] ?? "") === n &&
          !String(r._path).endsWith("/summary"),
      );
      chapterRows.sort((a, b) => cmpChapterPath(String(a._path), String(b._path)));
      return chapterRows.map((r) => ({
        _path: String(r._path),
        title: (r as { title?: string }).title ?? String(r._path).split("/").pop() ?? "",
        chapterFile: String(r._path).split("/").pop(),
      })) as ChapterNavItem[];
    } catch {
      return [] as ChapterNavItem[];
    }
  },
  { watch: [novel] },
);

const prevNext = computed(() => {
  const chapters = chapterNavList.value ?? [];
  const cur = chapter.value;
  const idx = chapters.findIndex((c) => {
    const file = c.chapterFile ?? String(c._path).split("/").pop() ?? "";
    return normalizeSegment(file) === cur;
  });
  if (idx < 0) return { prev: null as ChapterNavItem | null, next: null as ChapterNavItem | null };
  return {
    prev: idx > 0 ? chapters[idx - 1]! : null,
    next: idx < chapters.length - 1 ? chapters[idx + 1]! : null,
  };
});

const { data: post, pending } = await useAsyncData(
  stableKey,
  async () => {
    const n = novel.value;
    const ch = chapter.value;

    // 1. 静态 JSON（最稳定）
    const enc = (s: string) => encodeURIComponent(s);
    const jsonUrl = `${basePath}/ai-fiction/${enc(n)}/${enc(ch)}.json`;
    const jsonDoc = await $fetch<{ body?: string; title?: string; date?: string; tags?: string[] }>(
      jsonUrl,
    ).catch(() => null);
    if (jsonDoc?.body) return jsonDoc;

    // 2. queryContent 兜底
    try {
      const doc = await queryContent(`/ai-fiction/${n}/${ch}`).findOne();
      if (doc) return doc;
    } catch {
      /* ignore */
    }
    return null;
  },
  { watch: [novel, chapter] },
);

const staticBody = computed(() => {
  const p = post.value as { body?: unknown } | null | undefined;
  const b = p?.body;
  return typeof b === "string" ? b : null;
});

watch(
  [pending, post],
  ([p, data]) => {
    if (!p && !data) {
      throw createError({ statusCode: 404, statusMessage: "Page not found" });
    }
  },
  { immediate: true },
);

function goBack() {
  if (import.meta.client && window.history.length > 1) {
    router.back();
  } else {
    navigateTo(`/ai-fiction/${encodeURIComponent(novel.value)}`);
  }
}

function formatDate(date: string | Date | undefined) {
  if (!date) return "";
  return useDateFormat(date, "YYYY-MM-DD").value;
}
</script>

<style scoped>
.prose {
  line-height: 1.8;
  color: #e5e7eb;
}
.prose :deep(*) {
  color: inherit;
}
.prose :deep(a) {
  color: #a78bfa;
}
.prose :deep(strong) {
  color: #ffffff;
}
.prose :deep(code) {
  color: #e5e7eb;
}
.prose :deep(pre) {
  color: #f9fafb;
}
.prose p {
  margin-bottom: 1rem;
}
.prose ul,
.prose ol {
  margin-bottom: 1rem;
  padding-left: 2rem;
}
.prose li {
  margin-bottom: 0.5rem;
}
.prose code {
  background-color: rgba(34, 211, 238, 0.18);
  padding: 0.2rem 0.4rem;
  border-radius: 0.35rem;
  font-size: 0.9rem;
  color: #e2e8f0;
}
.prose pre {
  background-color: rgba(9, 12, 18, 0.9);
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 1rem;
  border: 1px solid rgba(34, 211, 238, 0.2);
}
.prose pre code {
  background-color: transparent;
  color: inherit;
  padding: 0;
}
.prose blockquote {
  border-left: 4px solid #22d3ee;
  padding-left: 1rem;
  font-style: italic;
  color: #d1d5db;
  margin-bottom: 1rem;
  background: rgba(34, 211, 238, 0.08);
  padding: 1rem;
  border-radius: 0 0.5rem 0.5rem 0;
}
.prose a {
  color: #38bdf8;
  text-decoration: underline;
}
.prose strong {
  color: #ffffff;
}

.article-skeleton-line {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.11), rgba(255, 255, 255, 0.06));
  background-size: 220% 100%;
  animation: article-skeleton-shimmer 1.25s ease-in-out infinite;
}

@keyframes article-skeleton-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
</style>
