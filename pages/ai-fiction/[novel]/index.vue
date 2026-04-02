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

    <div v-else-if="!bundle" class="mt-20 flex flex-col items-center gap-4 text-center">
      <p class="text-5xl font-semibold text-white/10">404</p>
      <p class="text-white/50">找不到这本小说</p>
      <button
        type="button"
        class="mt-2 rounded-full border border-white/15 px-5 py-2 text-sm text-white/60 transition hover:text-white/90 hover:border-white/30"
        @click="goBack"
      >
        返回小说列表
      </button>
    </div>

    <template v-else-if="bundle">
      <!-- 桌面：左右两栏；移动：上下堆叠 -->
      <div class="mt-8 lg:grid lg:grid-cols-[240px_1fr] lg:gap-8 lg:items-start">

        <!-- ── 左栏：封面 + 信息卡（桌面 sticky） ── -->
        <div class="lg:sticky lg:top-8">
          <!-- 封面 -->
          <div class="relative w-full rounded-2xl overflow-hidden bg-black/30 aspect-[3/4] max-h-[340px] lg:max-h-none lg:aspect-[2/3]">
            <div class="absolute inset-0 bg-[linear-gradient(160deg,rgba(34,211,238,0.1),transparent_55%,rgba(249,115,22,0.08))] pointer-events-none z-[1]" />
            <img
              v-if="bundle.coverImage"
              :src="bundle.coverImage"
              :alt="bundle.novelName"
              class="relative z-0 h-full w-full object-cover"
            />
            <div v-else class="flex h-full w-full items-end p-4">
              <span class="text-[10px] uppercase tracking-[0.35em] text-white/20">Novel</span>
            </div>
          </div>

          <!-- 信息区 -->
          <div class="mt-4 space-y-2.5">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-[10px] uppercase tracking-[0.32em] text-[color:var(--accent)]/70">AI Fiction</span>
              <FictionStatusBadge :status="bundle.status" />
            </div>
            <h1 class="text-xl font-semibold text-white leading-snug">
              {{ bundle.novelName }}
            </h1>
            <p v-if="bundle.description" class="text-sm text-white/60 leading-relaxed">
              {{ bundle.description }}
            </p>
            <div
              v-if="typeof bundle.summaryBody === 'string' && bundle.summaryBody.length > 0"
              class="prose prose-invert prose-sm max-w-none text-white/60 border-t border-white/10 pt-3"
            >
              <div v-html="bundle.summaryBody" />
            </div>
            <div class="flex flex-wrap items-center gap-3 pt-1 text-xs text-white/40 border-t border-white/[0.07]">
              <span>{{ bundle.chapters?.length ?? 0 }} 章</span>
              <span v-if="commentCount !== null">{{ commentCount }} 条评论</span>
            </div>
          </div>
        </div>

        <!-- ── 右栏：章节目录 + 评论 ── -->
        <div class="mt-8 lg:mt-0 space-y-10">

          <!-- 章节目录 -->
          <div ref="tocRef">
            <!-- 目录头部 -->
            <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
              <h2 class="text-sm uppercase tracking-[0.35em] text-white/50">章节目录</h2>
              <button
                v-if="lastReadPath"
                type="button"
                class="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--accent)]/25 bg-[color:var(--accent)]/10 px-3.5 py-1.5 text-xs text-[color:var(--accent)]/90 transition hover:bg-[color:var(--accent)]/20"
                @click="jumpToLastRead"
              >
                <span>继续阅读</span>
                <span class="max-w-[8rem] truncate opacity-70">{{ lastReadTitle }}</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>

            <!-- 分卷导航 -->
            <div v-if="arcGroups.length > 1" class="mb-4 flex flex-wrap gap-2">
              <button
                v-for="(arc, ai) in arcGroups"
                :key="ai"
                type="button"
                class="rounded-full border px-3 py-1 text-xs transition"
                :class="
                  activeArc === ai
                    ? 'border-white/25 bg-white/10 text-white'
                    : 'border-white/10 bg-transparent text-white/50 hover:text-white/80 hover:border-white/20'
                "
                @click="selectArc(ai)"
              >
                {{ arc.label }}
              </button>
            </div>

            <!-- 章节列表：两列 -->
            <ol class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li
                v-for="(ch, localIdx) in visibleChapters"
                :key="ch._path"
                class="group rounded-xl border transition"
                :class="
                  ch._path === lastReadPath
                    ? 'border-[color:var(--accent)]/30 bg-[color:var(--accent)]/[0.08]'
                    : 'border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.14]'
                "
              >
                <NuxtLink :to="chapterLink(ch)" class="flex items-center gap-3 px-4 py-3.5 h-full">
                  <span class="w-8 shrink-0 text-right text-xs tabular-nums text-white/30 font-mono">
                    {{ arcGroups.length > 1 ? arcGroups[activeArc]!.start + localIdx + 1 : localIdx + 1 }}
                  </span>
                  <span
                    class="flex-1 min-w-0 text-sm leading-snug transition"
                    :class="ch._path === lastReadPath ? 'text-[color:var(--accent)]/90 font-medium' : 'text-white/75 group-hover:text-white'"
                  >
                    {{ ch.title }}
                  </span>
                  <span
                    v-if="ch._path === lastReadPath"
                    class="shrink-0 text-[10px] text-[color:var(--accent)]/60"
                  >
                    续
                  </span>
                </NuxtLink>
              </li>
            </ol>

            <!-- 加载更多 / 收起 -->
            <div
              v-if="arcGroups.length === 1 && (bundle.chapters?.length ?? 0) > PAGE_SIZE"
              class="mt-4 flex items-center gap-4"
            >
              <button
                v-if="showCount < (bundle.chapters?.length ?? 0)"
                type="button"
                class="rounded-full border border-white/15 px-5 py-2 text-sm text-white/55 transition hover:border-white/25 hover:text-white/90"
                @click="showCount = Math.min(showCount + PAGE_SIZE, bundle.chapters?.length ?? 0)"
              >
                加载更多（剩余 {{ (bundle.chapters?.length ?? 0) - showCount }} 章）
              </button>
              <button
                v-if="showCount > PAGE_SIZE"
                type="button"
                class="text-xs text-white/35 transition hover:text-white/60"
                @click="showCount = PAGE_SIZE; scrollToToc()"
              >
                收起
              </button>
            </div>
          </div>

          <!-- 评论区 -->
          <div>
            <div class="text-xs uppercase tracking-[0.35em] text-white/50 mb-4">Comments</div>
            <p v-if="commentCount !== null" class="text-sm text-white/40 mb-4">
              {{ commentCount }} 条讨论 · 使用 GitHub 账号留言
            </p>
            <Comments />
          </div>

        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { normalizeSegment } from "~/utils/ai-fiction-slug";
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
const fullPath = basePath + route.path;
const { count: commentCount } = useCommentCount(fullPath);

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

    // ── 主路径：per-novel bundle.json（体积小，仅含本书数据） ───────────────
    try {
      const bundle = await requestFetch<Bundle>(
        `${jsonBase}/ai-fiction/${encodeURIComponent(n)}/bundle.json`,
      );
      if (bundle && bundle.novelSlug) {
        return {
          ...bundle,
          chapters: Array.isArray(bundle.chapters) ? bundle.chapters : [],
          summaryBody: typeof bundle.summaryBody === "string" ? bundle.summaryBody : "",
        };
      }
    } catch {
      /* silent */
    }

    // ── 兜底：全量 series.json（兼容旧版静态部署）───────────────────────────
    try {
      const list = await requestFetch<Bundle[]>(`${jsonBase}/ai-fiction-series.json`);
      if (Array.isArray(list)) {
        const match = list.find((x) => normalizeSegment(x.novelSlug) === n);
        if (match) {
          return {
            ...match,
            chapters: Array.isArray((match as Bundle & { chapters?: unknown[] }).chapters) ? (match as Bundle & { chapters: Bundle["chapters"] }).chapters : [],
            summaryBody: typeof (match as Bundle & { summaryBody?: string }).summaryBody === "string" ? (match as Bundle & { summaryBody: string }).summaryBody : "",
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

// ── 目录分页逻辑 ──────────────────────────────────────────────────────────
const PAGE_SIZE = 50;
const ARC_SIZE = 50;

/** 当前展开的章数（单卷模式） */
const showCount = ref(PAGE_SIZE);

/** 「上次读到」的 _path（从 localStorage 读） */
const lastReadPath = ref<string | null>(null);
const lastReadTitle = computed(() => {
  if (!lastReadPath.value || !bundle.value) return "";
  const ch = bundle.value.chapters.find((c) => c._path === lastReadPath.value);
  return ch?.title ?? "";
});

/** 分卷组（超过 ARC_SIZE 章时按 ARC_SIZE 切分） */
const arcGroups = computed(() => {
  const chapters = bundle.value?.chapters ?? [];
  if (chapters.length <= ARC_SIZE) return [{ label: "全部", start: 0, end: chapters.length }];
  const groups: Array<{ label: string; start: number; end: number }> = [];
  for (let i = 0; i < chapters.length; i += ARC_SIZE) {
    const end = Math.min(i + ARC_SIZE, chapters.length);
    groups.push({ label: `${i + 1}–${end}`, start: i, end });
  }
  return groups;
});

const activeArc = ref(0);

const visibleChapters = computed(() => {
  const chapters = bundle.value?.chapters ?? [];
  if (arcGroups.value.length > 1) {
    const arc = arcGroups.value[activeArc.value]!;
    return chapters.slice(arc.start, arc.end);
  }
  return chapters.slice(0, showCount.value);
});

function selectArc(idx: number) {
  activeArc.value = idx;
}

const tocRef = ref<HTMLElement | null>(null);

function scrollToToc() {
  if (import.meta.client) {
    tocRef.value?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/** 跳到「上次读到」的章节 */
function jumpToLastRead() {
  if (!lastReadPath.value || !bundle.value) return;
  const link = nuxtLinkToFromContentPath(lastReadPath.value, base);
  navigateTo(link);
}

/** 从 localStorage 恢复上次阅读记录 */
onMounted(() => {
  if (!bundle.value) return;
  const novelSlug = bundle.value.novelSlug;
  try {
    const raw = window.localStorage.getItem(`fiction-last-read-v1`);
    if (!raw) return;
    const map = JSON.parse(raw) as Record<string, string>;
    const savedPath = map[novelSlug];
    if (savedPath && bundle.value.chapters.some((c) => c._path === savedPath)) {
      lastReadPath.value = savedPath;
      // 自动定位到对应分卷
      const idx = bundle.value.chapters.findIndex((c) => c._path === savedPath);
      if (idx >= 0 && arcGroups.value.length > 1) {
        activeArc.value = Math.floor(idx / ARC_SIZE);
      } else if (idx >= 0 && arcGroups.value.length === 1) {
        showCount.value = Math.max(showCount.value, Math.ceil((idx + 1) / PAGE_SIZE) * PAGE_SIZE);
      }
    }
  } catch {
    // ignore
  }
});

</script>

<style scoped>
.prose :deep(p) {
  margin-bottom: 0.75rem;
}
</style>
