<template>
  <article class="hand-container hand-section">
    <BackButton label="返回随笔" fallback-to="/blog" />

    <HandCard class="mt-8" decoration="tape" padding="p-0" :hover-lift="false">
      <div class="p-6 md:p-10 border-b-2 border-dashed border-pencil/20">
        <div class="flex flex-wrap items-center gap-3 mb-5">
          <HandTag variant="muted">Article</HandTag>
          <span class="font-body text-sm text-pencil/45">{{ formatDateYmd(post?.date) }}</span>
          <span v-if="views !== null" class="font-body text-sm text-pencil/40">· {{ views }} 次阅读</span>
          <span v-if="commentCount !== null" class="font-body text-sm text-pencil/40">· {{ commentCount }} 条评论</span>
        </div>

        <h1 class="font-heading text-4xl md:text-5xl font-bold text-pencil mb-5 leading-tight">
          {{ post?.title }}
        </h1>

        <div v-if="post?.tags" class="flex flex-wrap gap-2">
          <HandTag v-for="tag in post.tags" :key="tag" variant="postit" class="!text-sm">
            {{ tag }}
          </HandTag>
        </div>
      </div>

      <div class="p-6 md:p-10">
        <div class="prose max-w-none">
          <div v-if="staticBody" v-html="staticBody" />
          <ContentRenderer v-else-if="post" :value="post as any" />
        </div>
      </div>
    </HandCard>

    <div class="mt-10">
      <div class="flex items-center gap-3 mb-5">
        <HandTag variant="muted">评论</HandTag>
        <span class="flex-1 hand-dashed-divider" />
      </div>
      <ClientOnly><Comments /></ClientOnly>
    </div>
  </article>
</template>

<script setup lang="ts">
import { formatDateYmd } from "~/utils/format-date";
import { devSkipAsyncCache } from "~/utils/async-data";

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
    if (import.meta.server) return await load();
    const cached = useNuxtData(`blog-post-${contentPath}`).data.value;
    if (cached) return cached;
    try {
      return await load();
    } catch {
      return await loadJson();
    }
  },
  { getCachedData: devSkipAsyncCache() },
);

const staticBody = computed(() => {
  const p = post.value as { body?: unknown } | null | undefined;
  const b = p?.body;
  return typeof b === "string" ? b : null;
});

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: "Page not found" });
}
</script>
