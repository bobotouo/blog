<!--
  顶层文章路由：使文章 URL 在 GitHub Pages base /blog/ 下为 /blog/:slug 而非 /blog/blog/:slug
  作者：项目 创建时间：2026-02 功能：博客文章单页（与 blog/[...slug] 内容一致，路径为 /:slug）
-->
<template>
  <article class="max-w-4xl mx-auto py-10 px-6">
    <NuxtLink to="/blog" class="text-xs uppercase tracking-[0.35em] text-white/50">
      ← 返回列表
    </NuxtLink>

    <div class="mt-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 md:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
      <p class="text-xs uppercase tracking-[0.4em] text-white/40 mb-4">Feature</p>
      <h1 class="text-4xl md:text-5xl font-semibold text-white mb-4">
        {{ post?.title }}
      </h1>
      <div class="text-sm text-white/60 mb-6 flex flex-wrap items-center gap-4">
        <span>{{ formatDate(post?.date) }}</span>
        <span v-if="views !== null" class="text-white/40">· {{ views }} 次阅读</span>
        <span v-if="commentCount !== null" class="text-white/40">
          · {{ commentCount }} 条评论
        </span>
      </div>
      <div v-if="post?.tags" class="flex flex-wrap gap-2 mb-8">
        <span
          v-for="tag in post?.tags"
          :key="tag"
          class="px-4 py-1.5 bg-white/10 text-white/80 rounded-full text-xs border border-white/15"
        >
          {{ tag }}
        </span>
      </div>

      <div class="prose prose-invert max-w-none">
        <ContentRenderer :value="post as any" />
      </div>
    </div>

    <div class="mt-10">
      <div class="text-xs uppercase tracking-[0.35em] text-white/50 mb-4">
        Comments
      </div>
      <Comments />
    </div>
  </article>
</template>

<script setup lang="ts">
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
const slug = route.params.slug as string;

// 与 Giscus 的 pathname 一致，用于评论数与统计
const config = useRuntimeConfig();
const base = (config.public.baseUrl as string) || "/";
const fullPath = base.replace(/\/$/, "") + route.path;
const { views } = usePageStats(fullPath);
const { count: commentCount } = useCommentCount(fullPath);

const contentPath = `/blog/${slug}`;

const { data: post } = await useAsyncData(`blog-post-${contentPath}`, () =>
  queryContent(contentPath).findOne(),
);

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: "Page not found" });
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
</style>
