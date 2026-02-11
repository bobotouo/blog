<template>
  <article class="max-w-4xl mx-auto py-10 px-6">
    <NuxtLink to="/snapshots" class="text-xs uppercase tracking-[0.35em] text-white/50">
      ← 返回快照
    </NuxtLink>

    <div class="mt-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 md:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
      <p class="text-xs uppercase tracking-[0.4em] text-white/40 mb-4">Snapshot</p>
      <h1 class="text-4xl md:text-5xl font-semibold text-white mb-4">
        {{ snapshot?.title }}
      </h1>
      <div class="text-sm text-white/60 mb-6 flex flex-wrap items-center gap-4">
        <span>{{ formatDate(snapshot?.date) }}</span>
        <span v-if="snapshot?.location" class="text-white/40">· {{ snapshot?.location }}</span>
        <span v-if="views !== null" class="text-white/40">· {{ views }} 次浏览</span>
        <span v-if="commentCount !== null" class="text-white/40">
          · {{ commentCount }} 条评论
        </span>
      </div>

      <p v-if="snapshot?.summary" class="text-white/70 mb-6">
        {{ snapshot?.summary }}
      </p>

      <div v-if="snapshot?.images && snapshot?.images.length" class="grid gap-3 sm:grid-cols-2 mb-8">
        <div
          v-for="(img, idx) in snapshot.images"
          :key="`${snapshot?._path}-img-${idx}`"
          class="h-56 overflow-hidden rounded-2xl border border-white/10"
        >
          <img :src="img" alt="snapshot" class="h-full w-full object-cover" />
        </div>
      </div>

      <div v-if="snapshot?.tags" class="flex flex-wrap gap-2 mb-8">
        <span
          v-for="tag in snapshot.tags"
          :key="tag"
          class="px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/60 border border-white/10 rounded-full"
        >
          {{ tag }}
        </span>
      </div>

      <div class="prose prose-invert max-w-none">
        <ContentRenderer :value="snapshot as any" />
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
});

const route = useRoute();
const { views } = usePageStats(route.path);
const { count: commentCount } = useCommentCount(route.path);

const slug = Array.isArray(route.params.slug)
  ? route.params.slug.join("/")
  : route.params.slug;
const contentPath = `/snapshots/${slug}`;

const { data: snapshot } = await useAsyncData(`snapshot-${contentPath}`, () =>
  queryContent(contentPath).findOne(),
);

if (!snapshot.value) {
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
  color: #38bdf8;
}
.prose :deep(strong) {
  color: #ffffff;
}
.prose :deep(code) {
  background-color: rgba(34, 211, 238, 0.18);
  padding: 0.2rem 0.4rem;
  border-radius: 0.35rem;
  font-size: 0.9rem;
  color: #e2e8f0;
}
.prose :deep(pre) {
  background-color: rgba(9, 12, 18, 0.9);
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 1rem;
  border: 1px solid rgba(34, 211, 238, 0.2);
}
.prose :deep(pre code) {
  background-color: transparent;
  color: inherit;
  padding: 0;
}
.prose :deep(blockquote) {
  border-left: 4px solid #22d3ee;
  padding-left: 1rem;
  font-style: italic;
  color: #d1d5db;
  margin-bottom: 1rem;
  background: rgba(34, 211, 238, 0.08);
  padding: 1rem;
  border-radius: 0 0.5rem 0.5rem 0;
}
</style>
