<template>
  <article class="hand-container hand-section">
    <BackButton label="返回目录" :fallback-to="`/ai-fiction/${novel}`" />

    <HandCard class="mt-8" decoration="postit" padding="p-0" :hover-lift="false">
      <div v-if="pending" class="p-8 space-y-4">
        <div class="h-4 w-20 bg-erased animate-pulse" />
        <div class="h-10 max-w-xl bg-erased animate-pulse" />
        <div class="space-y-2 pt-4">
          <div class="h-4 w-full bg-erased animate-pulse" />
          <div class="h-4 w-full bg-erased animate-pulse" />
        </div>
      </div>
      <template v-else-if="post">
        <div class="p-6 md:p-10 border-b-2 border-dashed border-pencil/20">
          <HandTag variant="muted" class="mb-4">幻想</HandTag>
          <h1 class="font-heading text-4xl md:text-5xl font-bold text-pencil mb-4">{{ post.title }}</h1>
          <div class="font-body text-sm text-pencil/50 flex flex-wrap gap-3">
            <span>{{ formatDateYmd(post.date) }}</span>
            <span v-if="views !== null">· {{ views }} 次阅读</span>
            <span v-if="commentCount !== null">· {{ commentCount }} 条评论</span>
          </div>
          <div v-if="post.tags" class="flex flex-wrap gap-2 mt-5">
            <HandTag v-for="tag in post.tags" :key="tag" variant="postit" class="!text-sm">{{ tag }}</HandTag>
          </div>
        </div>
        <div class="p-6 md:p-10">
          <div class="prose max-w-none">
            <div v-if="staticBody" v-html="staticBody" />
            <ContentRenderer v-else :value="post as any" />
          </div>
        </div>
      </template>
    </HandCard>

    <nav
      v-if="!pending && post && (prevNext.prev || prevNext.next)"
      class="mt-10 w-full overflow-hidden border-[3px] border-pencil bg-white shadow-hand"
      :style="{ borderRadius: wobblyRadius.md }"
      aria-label="章节导航"
    >
      <div class="flex flex-col divide-y-2 divide-dashed divide-pencil/20 md:flex-row md:divide-x-2 md:divide-y-0">
        <NuxtLink
          v-if="prevNext.prev"
          :to="nuxtLinkToFromContentPath(prevNext.prev._path, base)"
          class="group flex flex-1 items-center gap-4 p-5 md:p-6 hover:bg-erased/50 transition"
        >
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-pencil bg-postit text-pencil group-hover:bg-pen group-hover:text-white transition"
            :style="{ borderRadius: wobblyRadius.sm }"
            aria-hidden="true"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6" /></svg>
          </span>
          <div class="min-w-0 flex-1">
            <p class="mb-1 font-body text-xs text-pencil/45">上一章</p>
            <p class="line-clamp-2 font-heading text-base font-bold text-pencil">{{ prevNext.prev.title }}</p>
          </div>
        </NuxtLink>
        <NuxtLink
          v-if="prevNext.next"
          :to="nuxtLinkToFromContentPath(prevNext.next._path, base)"
          class="group flex flex-1 items-center gap-4 p-5 md:p-6 md:flex-row-reverse md:text-right hover:bg-erased/50 transition"
        >
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-pencil bg-postit text-pencil group-hover:bg-pen group-hover:text-white transition"
            :style="{ borderRadius: wobblyRadius.sm }"
            aria-hidden="true"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6" /></svg>
          </span>
          <div class="min-w-0 flex-1 md:text-right">
            <p class="mb-1 font-body text-xs text-pencil/45">下一章</p>
            <p class="line-clamp-2 font-heading text-base font-bold text-pencil">{{ prevNext.next.title }}</p>
          </div>
        </NuxtLink>
      </div>
    </nav>

    <div v-if="!pending && post" class="mt-10">
      <div class="flex items-center gap-3 mb-5">
        <HandTag variant="muted">评论</HandTag>
        <span class="flex-1 hand-dashed-divider" />
      </div>
      <ClientOnly><Comments /></ClientOnly>
    </div>
  </article>
</template>

<script setup lang="ts">
import { wobblyRadius } from "~/utils/design-tokens";
import { normalizeSegment } from "~/utils/ai-fiction-slug";
import { formatDateYmd } from "~/utils/format-date";
import { nuxtLinkToFromContentPath } from "~/utils/route-from-content-path";

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
const jsonBase = import.meta.server ? "" : basePath;
const fullPath = basePath + route.path;
const { views } = usePageStats(fullPath);
const { count: commentCount } = useCommentCount(fullPath);

// useRequestFetch 在 SSR 里自动补全 URL（带 host），避免 queryContent+clientDB 抛异常
const requestFetch = useRequestFetch();

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

    // 主路径：per-novel bundle.json（仅含本书章节，体积更小）
    try {
      const bundle = await requestFetch<{ chapters?: ChapterNavItem[] }>(
        `${jsonBase}/ai-fiction/${encodeURIComponent(n)}/bundle.json`,
      );
      if (bundle?.chapters?.length) return bundle.chapters as ChapterNavItem[];
    } catch {
      /* silent */
    }

    // 兜底：全量 series.json
    try {
      const list = await requestFetch<Array<{ novelSlug: string; chapters?: ChapterNavItem[] }>>(
        `${jsonBase}/ai-fiction-series.json`,
      );
      if (Array.isArray(list)) {
        const s = list.find((x) => normalizeSegment(x.novelSlug) === n);
        if (s?.chapters?.length) return s.chapters as ChapterNavItem[];
      }
    } catch {
      /* silent */
    }

    // 客户端兜底：queryContent（clientDB 仅在客户端可靠）
    if (import.meta.client) {
      try {
        const all = await queryContent("ai-fiction").find();
        const rows = all.filter(
          (r) =>
            normalizeSegment(String(r._path).replace(/^\/ai-fiction\//, "").split("/")[0] ?? "") === n &&
            !String(r._path).endsWith("/summary"),
        );
        rows.sort((a, b) => cmpChapterPath(String(a._path), String(b._path)));
        return rows.map((r) => ({
          _path: String(r._path),
          title: (r as { title?: string }).title ?? String(r._path).split("/").pop() ?? "",
          chapterFile: String(r._path).split("/").pop(),
        })) as ChapterNavItem[];
      } catch {
        /* silent */
      }
    }

    return [] as ChapterNavItem[];
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

    // 通过 ai-fiction-list.json 做 Unicode 归一化匹配，拿到 canonical 路径
    let canonicalPath: string | undefined;
    try {
      const indexRows = await requestFetch<Array<{ _path?: string; chapterFile?: string }>>(
        `${jsonBase}/ai-fiction-list.json`,
      );
      if (Array.isArray(indexRows)) {
        canonicalPath = indexRows.find((row) => {
          const segs = String(row?._path ?? "").replace(/^\/ai-fiction\//, "").split("/");
          const chapterSeg = row?.chapterFile ?? segs[1] ?? "";
          return normalizeSegment(segs[0] ?? "") === n && normalizeSegment(chapterSeg) === ch;
        })?._path;
      }
    } catch {
      /* silent */
    }

    const tryJson = async (pathLike: string) => {
      const rel = String(pathLike).replace(/^\/ai-fiction\//, "");
      const segs = rel.split("/");
      if (segs.length < 2) return null;
      const jsonUrl = `${jsonBase}/ai-fiction/${encodeURIComponent(segs[0]!)}/${encodeURIComponent(segs[1]!)}.json`;
      try {
        return await requestFetch<{ body?: string; title?: string; date?: string; tags?: string[] }>(jsonUrl);
      } catch {
        return null;
      }
    };

    if (canonicalPath) {
      const hit = await tryJson(canonicalPath);
      if (hit?.body) return hit;
    }

    const direct = await tryJson(`/ai-fiction/${n}/${ch}`);
    if (direct?.body) return direct;

    // 客户端兜底：queryContent
    if (import.meta.client) {
      try {
        const doc = await queryContent(canonicalPath || `/ai-fiction/${n}/${ch}`).findOne();
        if (doc) return doc;
      } catch {
        /* ignore */
      }
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

/** 记录阅读进度：chapterNavList 就绪后写 localStorage（避免 onMounted 时数据未到的竞态） */
function saveReadProgress(list: ChapterNavItem[] | null | undefined) {
  if (!list?.length) return;
  try {
    const chapterPath = list.find((c) => {
      const file = c.chapterFile ?? String(c._path).split("/").pop() ?? "";
      return normalizeSegment(file) === chapter.value;
    })?._path;
    if (!chapterPath) return;
    const raw = window.localStorage.getItem("fiction-last-read-v1");
    const map: Record<string, string> = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[novel.value] = chapterPath;
    window.localStorage.setItem("fiction-last-read-v1", JSON.stringify(map));
  } catch {
    // ignore
  }
}

// 立即尝试一次（SSR hydration 后数据已就绪的场景）
onMounted(() => {
  if (chapterNavList.value?.length) {
    saveReadProgress(chapterNavList.value);
  }
});

// 数据异步到达时再写一次（避免 onMounted 时 chapterNavList 尚未加载的竞态）
watch(chapterNavList, (list) => {
  if (import.meta.client && list?.length) {
    saveReadProgress(list);
  }
}, { once: true });

</script>
