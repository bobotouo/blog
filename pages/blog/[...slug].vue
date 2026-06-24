<template>
  <article class="hand-container hand-section">
    <BackButton label="返回随笔" fallback-to="/blog" />

    <HandCard class="mt-8" decoration="tack" padding="p-0" :hover-lift="false">
      <div v-if="pending" class="p-8 space-y-4">
        <div class="h-4 w-24 bg-erased animate-pulse" />
        <div class="h-10 max-w-xl bg-erased animate-pulse" />
        <div class="h-4 w-48 bg-erased animate-pulse" />
        <div class="space-y-2 pt-4">
          <div class="h-4 w-full bg-erased animate-pulse" />
          <div class="h-4 w-full bg-erased animate-pulse" />
          <div class="h-4 max-w-[66%] bg-erased animate-pulse" />
        </div>
      </div>

      <template v-else-if="post">
        <div class="p-6 md:p-10 border-b-2 border-dashed border-pencil/20">
          <HandTag variant="muted" class="mb-4">Article</HandTag>
          <h1 class="font-heading text-4xl md:text-5xl font-bold text-pencil mb-4">{{ post.title }}</h1>
          <div class="font-body text-sm text-pencil/50 flex flex-wrap gap-3">
            <span>{{ formatDateYmd(post.date) }}</span>
            <span v-if="views !== null">· {{ views }} 次阅读</span>
            <span v-if="commentCount !== null">· {{ commentCount }} 条评论</span>
          </div>
          <div v-if="postTags.length" class="flex flex-wrap gap-2 mt-5">
            <HandTag v-for="tag in postTags" :key="tag" variant="postit" class="!text-sm">{{ tag }}</HandTag>
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
import { formatDateYmd } from "~/utils/format-date";
import { normalizeTags } from "~/utils/normalize-tags";

definePageMeta({ layout: "blog" });

const route = useRoute();
const { views } = usePageStats(route.path);
const { count: commentCount } = useCommentCount(route.path);

const slug = Array.isArray(route.params.slug) ? route.params.slug.join("/") : route.params.slug;
const contentPath = `/blog/${slug}`;
const config = useRuntimeConfig();
const basePath = ((config.public.baseUrl as string) || "/").replace(/\/$/, "");
const jsonBase = import.meta.server ? "" : basePath;

const { data: post, pending } = await useAsyncData(
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
  { getCachedData: import.meta.dev ? () => undefined : undefined, lazy: true },
);

watch(
  [pending, post],
  ([p, data]) => {
    if (!p && !data) throw createError({ statusCode: 404, statusMessage: "Page not found" });
  },
  { immediate: true },
);

const staticBody = computed(() => {
  const p = post.value as { body?: unknown } | null | undefined;
  const b = p?.body;
  return typeof b === "string" ? b : null;
});

const postTags = computed(() => normalizeTags((post.value as { tags?: unknown } | null)?.tags));
</script>
