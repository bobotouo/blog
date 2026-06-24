<template>
  <section class="hand-container hand-section">
    <!-- Header -->
    <div class="mb-12">
      <HandTag variant="postit" class="mb-4 -rotate-1">随笔集</HandTag>
      <h1 class="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-pencil mb-4">
        记录、思考、延伸
      </h1>
      <p class="font-body text-lg md:text-xl text-pencil/60 max-w-2xl leading-relaxed">
        在文字中沉淀思考，在点滴中记录成长。每一页都是与自我的对话。
      </p>
      <p class="mt-4 font-body text-pencil/45">{{ activePosts.length }} 篇文章</p>
    </div>

    <!-- Featured -->
    <div v-if="featured" class="mb-12">
      <div class="flex items-center gap-3 mb-6">
        <HandTag variant="muted">精选</HandTag>
        <span class="flex-1 hand-dashed-divider" />
      </div>
      <NuxtLink :to="nuxtLinkToFromContentPath(featured._path, base)" class="block group">
        <HandCard decoration="tape" rotate="-0.5deg" padding="p-0" class="overflow-hidden group-hover:shadow-hand transition-shadow">
          <div class="grid gap-0 md:grid-cols-[1.2fr_1fr]">
            <div class="relative overflow-hidden max-h-[280px] min-h-[200px] border-b-2 md:border-b-0 md:border-r-2 border-pencil">
              <img
                v-if="featured.coverImage"
                :src="featured.coverImage"
                :alt="featured.title"
                loading="eager"
                fetchpriority="high"
                decoding="async"
                class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              />
              <div v-else class="h-full w-full bg-postit flex items-center justify-center text-5xl">📝</div>
            </div>
            <div class="p-6 md:p-8 flex flex-col justify-center">
              <p class="font-body text-sm text-pencil/45 mb-2">{{ formatDateYmd(featured.date) }}</p>
              <h2 class="font-heading text-2xl md:text-3xl font-bold text-pencil group-hover:text-marker transition-colors mb-3">
                {{ featured.title }}
              </h2>
              <p v-if="featured.description" class="font-body text-pencil/65 leading-relaxed">
                {{ featured.description }}
              </p>
              <span class="mt-4 font-body text-pen group-hover:text-marker inline-flex items-center gap-1 transition-colors">
                继续阅读 →
              </span>
            </div>
          </div>
        </HandCard>
      </NuxtLink>
    </div>

    <!-- Post list -->
    <div class="blog-post-columns columns-1 md:columns-2 [&>article]:break-inside-avoid gap-8">
      <article v-for="(post, idx) in rest" :key="post._path" class="mb-6">
        <NuxtLink :to="nuxtLinkToFromContentPath(post._path, base)" class="block group">
          <HandCard
            :decoration="postDecoration(idx, rest.length)"
            inset-tack
            :rotate="idx % 2 === 0 ? '-0.5deg' : '0.5deg'"
            padding="p-5"
            class="group-hover:shadow-hand"
          >
            <div class="flex items-center justify-between mb-3">
              <HandTag variant="muted" class="!text-xs">Article</HandTag>
              <svg class="w-4 h-4 text-pencil/25 group-hover:text-pen group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h2 class="font-heading text-xl font-bold text-pencil group-hover:text-pen transition-colors leading-snug">
              {{ post.title }}
            </h2>
            <p class="font-body text-sm text-pencil/45 mt-1">{{ formatDateYmd(post.date) }}</p>
            <p v-if="post.description" class="font-body text-pencil/60 mt-2 leading-relaxed line-clamp-3">
              {{ post.description }}
            </p>
          </HandCard>
        </NuxtLink>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { formatDateYmd } from "~/utils/format-date";
import { nuxtLinkToFromContentPath } from "~/utils/route-from-content-path";
import type { HandCardDecoration } from "~/utils/design-tokens";
import { useBlogList } from "~/composables/useBlogList";

definePageMeta({ layout: "blog" });

const config = useRuntimeConfig();
const base = (config.public.baseUrl as string) || "/";
const route = useRoute();

const { data: posts } = await useBlogList();

const activePosts = computed(
  () => (posts.value ?? []) as Array<{ _path: string; title: string; date: string; description?: string; coverImage?: string }>,
);

const featured = computed(() => {
  const list = activePosts.value ?? [];
  if (!list.length) return null;
  return (
    list.find((p) => String(p._path).endsWith("/2024-01-01-welcome")) ??
    list.find((p) => String(p.title).includes("欢迎")) ??
    list[0] ??
    null
  );
});

const rest = computed(() => {
  const list = activePosts.value ?? [];
  const f = featured.value;
  return list
    .filter((p) => !f || p._path !== f._path)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

/** 双栏瀑布流：DOM 最后两篇即底行，不挂图钉 */
function postDecoration(idx: number, total: number): HandCardDecoration {
  if (total > 0 && idx >= total - 2) return "none";
  return idx % 3 === 0 ? "tack" : "none";
}

usePageStats(route.path);
</script>

<style scoped>
.blog-post-columns article:nth-last-child(-n+2) :deep(.hand-card-tack) {
  display: none;
}
</style>
