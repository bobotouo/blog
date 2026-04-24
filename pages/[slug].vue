<!--
  顶层文章路由：使文章 URL 在 GitHub Pages base /blog/ 下为 /blog/:slug 而非 /blog/blog/:slug
  作者：项目 创建时间：2026-02 功能：博客文章单页（与 blog/[...slug] 内容一致，路径为 /:slug）
-->
<template>
  <article class="max-w-4xl mx-auto py-12 px-6">
    <!-- 返回按钮 -->
    <button
      type="button"
      class="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-sm text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300"
      @click="goBack"
    >
      <svg class="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      <span class="tracking-[0.2em] uppercase">返回列表</span>
    </button>

    <!-- 文章主体 -->
    <div class="mt-8 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl overflow-hidden">
      <!-- 文章头部 -->
      <div class="p-8 md:p-12 border-b border-white/5">
        <!-- 元信息 -->
        <div class="flex flex-wrap items-center gap-4 mb-6">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-pulse"></span>
            <span class="text-[10px] uppercase tracking-[0.3em] text-cyan-400/60 font-medium">Article</span>
          </div>
          <span class="text-white/30">·</span>
          <span class="text-sm text-white/50">{{ formatDateYmd(post?.date) }}</span>
          <span v-if="views !== null" class="inline-flex items-center gap-1.5 text-sm text-white/40">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {{ views }} 次阅读
          </span>
          <span v-if="commentCount !== null" class="inline-flex items-center gap-1.5 text-sm text-white/40">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {{ commentCount }} 条评论
          </span>
        </div>

        <!-- 标题 -->
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          {{ post?.title }}
        </h1>

        <!-- 标签 -->
        <div v-if="post?.tags" class="flex flex-wrap gap-2">
          <span
            v-for="tag in post?.tags"
            :key="tag"
            class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs hover:bg-white/10 hover:border-white/20 hover:text-white/80 transition-all duration-300"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.413.585l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {{ tag }}
          </span>
        </div>
      </div>

      <!-- 文章内容 -->
      <div class="p-8 md:p-12">
        <div class="prose max-w-none">
          <div v-if="staticBody" v-html="staticBody" />
          <ContentRenderer v-else-if="post" :value="post as any" />
        </div>
      </div>
    </div>

    <!-- 评论区 -->
    <div class="mt-12">
      <div class="flex items-center gap-3 mb-6">
        <span class="w-8 h-px bg-gradient-to-r from-cyan-400 to-transparent"></span>
        <span class="text-xs uppercase tracking-[0.3em] text-cyan-400/60 font-medium">Comments</span>
      </div>
      <div class="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-sm p-8">
        <ClientOnly><Comments /></ClientOnly>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { formatDateYmd } from "~/utils/format-date";

definePageMeta({
  layout: "blog",
  middleware: (to) => {
    const s = to.params.slug as string;
    if (s === "blog" || s === "snapshots") {
      return navigateTo(s === "blog" ? "/blog" : "/snapshots", { replace: true });
    }
  },
});

const route = useRoute();
const router = useRouter();
const goBack = () => {
  if (import.meta.client && window.history.length > 1) {
    router.back();
  } else {
    navigateTo("/blog");
  }
};
const slug = route.params.slug as string;

// 与 Giscus 的 pathname 一致，用于评论数与统计
const config = useRuntimeConfig();
const base = (config.public.baseUrl as string) || "/";
const fullPath = base.replace(/\/$/, "") + route.path;
const { views } = usePageStats(fullPath);
const { count: commentCount } = useCommentCount(fullPath);

const contentPath = `/blog/${slug}`;
const basePath = base.replace(/\/$/, "");
const jsonBase = import.meta.server ? "" : basePath;

const { data: post } = await useAsyncData(
  `blog-post-${contentPath}`,
  async () => {
    const loadJson = () =>
      $fetch<{ body?: string; title?: string; date?: string; tags?: string[] }>(
        `${jsonBase}/blog/${slug}.json`,
      ).catch(() => null);

    const load = async () => {
      const fromQuery = await queryContent(contentPath).findOne();
      if (fromQuery) return fromQuery;
      return await loadJson();
    };

    if (import.meta.server) {
      return await load();
    }
    const cached = useNuxtData(`blog-post-${contentPath}`).data.value;
    if (cached) return cached;
    try {
      return await load();
    } catch {
      return await loadJson();
    }
  },
  { getCachedData: () => (import.meta.dev ? null : undefined) },
);

// 仅当 body 为字符串时用 v-html（静态 JSON）；Netlify 上 queryContent 返回的 body 是对象，用 ContentRenderer
const staticBody = computed(() => {
  const p = post.value as { body?: unknown } | null | undefined;
  const b = p?.body;
  return typeof b === "string" ? b : null;
});

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: "Page not found" });
}
</script>
