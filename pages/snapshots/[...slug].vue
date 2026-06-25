<template>
  <article class="hand-container hand-section">
    <BackButton label="返回快照" fallback-to="/snapshots" />

    <HandCard class="mt-8" decoration="none" padding="p-0" :hover-lift="false">
      <div v-if="pending" class="p-8 space-y-4">
        <div class="h-4 w-24 bg-erased animate-pulse" />
        <div class="h-10 max-w-xl bg-erased animate-pulse" />
        <div class="grid gap-3 sm:grid-cols-2 pt-4">
          <div class="aspect-[4/3] bg-erased animate-pulse" />
          <div class="aspect-[4/3] bg-erased animate-pulse" />
        </div>
      </div>

      <template v-else-if="snapshot">
        <div class="p-6 md:p-10 border-b-2 border-dashed border-pencil/20">
          <HandTag variant="postit" class="mb-4">Snapshot</HandTag>
          <h1 class="font-heading text-4xl md:text-5xl font-bold text-pencil mb-4">{{ snapshot.title }}</h1>
          <div class="font-body text-sm text-pencil/50 flex flex-wrap gap-3">
            <span>{{ formatDateYmd(snapshot.date) }}</span>
            <span v-if="snapshot.location">· {{ snapshot.location }}</span>
            <span v-if="views !== null">· {{ views }} 次浏览</span>
            <span v-if="commentCount !== null">· {{ commentCount }} 条评论</span>
          </div>
          <p v-if="snapshot.summary" class="mt-4 font-body text-lg text-pencil/70">{{ snapshot.summary }}</p>
        </div>

        <div class="p-6 md:p-10">
          <div v-if="snapshot.images?.length" class="grid gap-4 sm:grid-cols-2 mb-8">
            <img
              v-for="(img, idx) in snapshot.images"
              :key="`${snapshot._path}-img-${idx}`"
              :src="img"
              alt="snapshot"
              :loading="idx === 0 ? 'eager' : 'lazy'"
              decoding="async"
              class="block h-auto w-full max-h-[32rem] border-[3px] border-pencil object-contain"
              :style="{ borderRadius: wobblyRadius.sm, boxShadow: shadows.subtle }"
            />
          </div>

          <div v-if="snapshotTags.length" class="flex flex-wrap gap-2 mb-6">
            <HandTag v-for="tag in snapshotTags" :key="tag" variant="muted" class="!text-xs">{{ tag }}</HandTag>
          </div>

          <div class="prose max-w-none">
            <div v-if="staticBody" v-html="staticBody" />
            <ContentRenderer v-else :value="snapshot as any" />
          </div>
        </div>
      </template>
    </HandCard>

    <div v-if="!pending && snapshot" class="mt-10">
      <div class="flex items-center gap-3 mb-5">
        <HandTag variant="muted">评论</HandTag>
        <span class="flex-1 hand-dashed-divider" />
      </div>
      <Comments />
    </div>
  </article>
</template>

<script setup lang="ts">
import { wobblyRadius, shadows } from "~/utils/design-tokens";
import { formatDateYmd } from "~/utils/format-date";
import { detailPageCachedData, loadContentDetail, toJsonFetch } from "~/utils/async-data";
import { normalizeTags } from "~/utils/normalize-tags";

definePageMeta({ layout: "blog", prerender: false });

const route = useRoute();
const requestFetch = useRequestFetch();
const config = useRuntimeConfig();
const base = (config.public.baseUrl as string) || "/";
const fullPath = base.replace(/\/$/, "") + route.path;
const { views } = usePageStats(fullPath);
const { count: commentCount } = useCommentCount(fullPath);

const slug = Array.isArray(route.params.slug) ? route.params.slug.join("/") : route.params.slug;
const contentPath = `/snapshots/${slug}`;
const basePath = base.replace(/\/$/, "");

const { data: snapshot, pending } = await useAsyncData(
  `snapshot-${contentPath}`,
  () =>
    loadContentDetail<{ body?: string; title?: string; date?: string }>({
      contentPath,
      jsonRelativePath: `snapshots/${slug}.json`,
      basePath,
      fetch: toJsonFetch(requestFetch),
    }),
  { getCachedData: detailPageCachedData() },
);

if (!snapshot.value) {
  throw createError({ statusCode: 404, statusMessage: "Page not found" });
}

const staticBody = computed(() => {
  const s = snapshot.value as { body?: unknown } | null | undefined;
  const b = s?.body;
  return typeof b === "string" ? b : null;
});

const snapshotTags = computed(() => normalizeTags((snapshot.value as { tags?: unknown } | null)?.tags));
</script>
