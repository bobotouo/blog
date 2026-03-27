<template>
  <section class="max-w-4xl mx-auto py-10 px-6">
    <button
      type="button"
      class="inline-block bg-transparent border-0 p-0 text-left text-xs uppercase tracking-[0.35em] text-white/50 hover:text-white/70 transition cursor-pointer font-inherit"
      @click="goBack"
    >
      ← 返回 AI 小说
    </button>

    <div v-if="pending" class="mt-8 space-y-4">
      <div class="h-10 w-2/3 rounded-lg bg-white/10 animate-pulse" />
      <div class="h-32 rounded-2xl bg-white/5" />
    </div>

    <template v-else-if="bundle">
      <div class="mt-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
        <div class="grid gap-0 md:grid-cols-[min(160px,32%)_1fr]">
          <div class="min-h-[120px] md:min-h-[140px] bg-black/20">
            <img
              v-if="bundle.coverImage"
              :src="bundle.coverImage"
              :alt="bundle.novelName"
              class="h-full w-full object-cover"
            />
          </div>
          <div class="p-4 md:p-5 space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-[10px] uppercase tracking-[0.3em] text-white/40">Novel</p>
              <FictionStatusBadge :status="bundle.status" />
            </div>
            <h1 class="text-xl md:text-2xl font-semibold text-white leading-snug">
              {{ bundle.novelName }}
            </h1>
            <p v-if="bundle.description" class="text-sm text-white/70 leading-relaxed line-clamp-3">
              {{ bundle.description }}
            </p>
            <div
              v-if="typeof bundle.summaryBody === 'string' && bundle.summaryBody.length > 0"
              class="prose prose-invert prose-sm max-w-none text-white/75 border-t border-white/10 pt-3 mt-2"
            >
              <div v-html="bundle.summaryBody" />
            </div>
          </div>
        </div>
      </div>

      <div class="mt-10">
        <h2 class="text-sm uppercase tracking-[0.35em] text-white/50 mb-4">章节目录</h2>
        <ol class="space-y-2">
          <li
            v-for="(ch, idx) in bundle.chapters ?? []"
            :key="ch._path"
            class="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
          >
            <NuxtLink
              :to="chapterLink(ch)"
              class="flex items-center gap-4 px-4 py-3 text-white/90"
            >
              <span class="text-white/40 text-sm w-8 shrink-0">{{ idx + 1 }}</span>
              <span class="flex-1 font-medium">{{ ch.title }}</span>
              <span v-if="ch.date" class="text-white/45 text-sm shrink-0">{{ formatDateYmd(ch.date) }}</span>
            </NuxtLink>
          </li>
        </ol>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { normalizeSegment } from "~/utils/ai-fiction-slug";
import { formatDateYmd } from "~/utils/format-date";
import { nuxtLinkToFromContentPath } from "~/utils/route-from-content-path";

definePageMeta({
  layout: "blog",
});

const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();
const base = (config.public.baseUrl as string) || "/";
const basePath = base.replace(/\/$/, "");
const jsonBase = import.meta.server ? "" : basePath;

const novelParam = computed(() => normalizeSegment(String(route.params.novel ?? "")));

function cmpChapterPath(a: string, b: string) {
  const fa = a.split("/").pop() || a;
  const fb = b.split("/").pop() || b;
  const na = fa.match(/^(\d+)/)?.[1];
  const nb = fb.match(/^(\d+)/)?.[1];
  if (na && nb && na !== nb) return Number(na) - Number(nb);
  return fa.localeCompare(fb, "zh-CN", { numeric: true });
}

function chapterLink(ch: { _path: string }) {
  return nuxtLinkToFromContentPath(ch._path, base);
}

type Bundle = {
  novelSlug: string;
  novelName: string;
  description: string;
  coverImage?: string;
  tags?: string[];
  summaryBody: string;
  status?: string;
  chapters: Array<{ _path: string; title: string; date?: string; chapterFile?: string }>;
};

// useRequestFetch 在 SSR 里自动把相对路径补成 http://localhost:PORT/...
// 避免 queryContent + clientDB:true 在 _payload.json 请求时抛未捕获异常
const requestFetch = useRequestFetch();

const { data: bundle, pending } = await useAsyncData<Bundle | null>(
  `novel::${route.path.replace(/\/$/, "")}`,
  async () => {
    const n = novelParam.value;
    if (!n) return null;

    // ── 主路径：静态 JSON（server/client 均走此路） ──────────────────────────
    try {
      const list = await requestFetch<Bundle[]>(`${jsonBase}/ai-fiction-series.json`);
      if (Array.isArray(list)) {
        const match = list.find((x) => normalizeSegment(x.novelSlug) === n);
        if (match) {
          return {
            ...match,
            chapters: Array.isArray(match.chapters) ? match.chapters : [],
            summaryBody: typeof match.summaryBody === "string" ? match.summaryBody : "",
          };
        }
      }
    } catch {
      /* silent */
    }

    // ── 客户端兜底：queryContent（clientDB 仅在客户端可靠） ─────────────────
    if (import.meta.client) {
      try {
        const prefix = `/ai-fiction/`;
        const all = await queryContent("ai-fiction").find();
        const summary = all.find(
          (r) =>
            String(r._path).startsWith(prefix) &&
            normalizeSegment(String(r._path).replace(prefix, "").split("/")[0] ?? "") === n &&
            String(r._path).endsWith("/summary"),
        );
        const chapterRows = all.filter(
          (r) =>
            String(r._path).startsWith(prefix) &&
            normalizeSegment(String(r._path).replace(prefix, "").split("/")[0] ?? "") === n &&
            !String(r._path).endsWith("/summary"),
        );
        chapterRows.sort((a, b) => cmpChapterPath(String(a._path), String(b._path)));
        const canonicalSlug = summary
          ? String(summary._path).replace(prefix, "").replace(/\/summary$/, "")
          : chapterRows[0]
            ? (String(chapterRows[0]._path).replace(prefix, "").split("/")[0] ?? n)
            : n;
        const fm = summary as {
          title?: string;
          description?: string;
          coverImage?: string;
          tags?: string[];
          status?: string;
        } | undefined;
        return {
          novelSlug: canonicalSlug,
          novelName: (fm?.title ?? n) as string,
          description: (fm?.description ?? "") as string,
          coverImage: fm?.coverImage as string | undefined,
          tags: fm?.tags as string[] | undefined,
          summaryBody: "",
          status: fm?.status,
          chapters: chapterRows.map((r) => ({
            _path: String(r._path),
            title: ((r as { title?: string }).title ?? String(r._path).split("/").pop()) as string,
            date: (r as { date?: string }).date,
            chapterFile: String(r._path).split("/").pop(),
          })),
        };
      } catch {
        /* silent */
      }
    }

    return null;
  },
);

function goBack() {
  if (import.meta.client && window.history.length > 1) {
    router.back();
  } else {
    navigateTo("/blog?tab=ai-fiction");
  }
}

</script>

<style scoped>
.prose :deep(p) {
  margin-bottom: 0.75rem;
}
</style>
