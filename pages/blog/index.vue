<template>
  <section class="max-w-5xl mx-auto py-10 px-6">
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
      <div>
        <p class="text-xs uppercase tracking-[0.4em] text-white/50 mb-4">
          Latest Posts
        </p>
        <h1 class="text-4xl md:text-5xl font-semibold text-white">
          记录、思考、延伸
        </h1>
        <p class="mt-3 text-white/60 max-w-xl">
          简洁版式与酷炫光感并存，保持阅读专注。
        </p>
      </div>
      <div class="text-white/50 text-sm">{{ posts?.length ?? 0 }} 篇文章</div>
    </div>
    <div v-if="featured" class="mb-10">
      <NuxtLink
        :to="articlePath(featured._path)"
        class="group grid gap-6 md:grid-cols-[1.1fr_1fr] rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden hover:bg-white/10 transition"
      >
        <div class="h-52 md:h-full">
          <img
            v-if="featured.coverImage"
            :src="featured.coverImage"
            alt="cover"
            loading="lazy"
            decoding="async"
            class="h-full w-full object-cover group-hover:scale-[1.02] transition"
          />
          <div
            v-else
            class="h-full w-full bg-[linear-gradient(135deg,_rgba(34,211,238,0.25),_rgba(249,115,22,0.15))]"
          />
        </div>
        <div class="p-5 md:p-6 space-y-3">
          <div class="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/40">
            <span>Featured</span>
            <span class="text-white/30">→</span>
          </div>
          <h2 class="text-2xl md:text-3xl font-semibold text-white group-hover:text-[color:var(--accent)] transition">
            {{ featured.title }}
          </h2>
          <p class="text-sm text-white/60">{{ formatDate(featured.date) }}</p>
          <p class="text-white/80" v-if="featured.description">
            {{ featured.description }}
          </p>
          <div class="text-xs uppercase tracking-[0.25em] text-white/40">
            继续阅读 →
          </div>
        </div>
      </NuxtLink>
    </div>

    <div class="grid gap-6 md:grid-cols-2">
      <article
        v-for="post in rest"
        :key="post._path"
        class="group p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300 shadow-[0_0_0_rgba(0,0,0,0)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
      >
        <NuxtLink :to="articlePath(post._path)" class="block space-y-3">
          <div class="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/40">
            <span>Article</span>
            <span class="text-white/30">→</span>
          </div>
          <h2 class="text-2xl font-semibold text-white group-hover:text-[color:var(--accent)] transition">
            {{ post.title }}
          </h2>
          <p class="text-sm text-white/60">{{ formatDate(post.date) }}</p>
          <p class="text-white/80" v-if="post.description">
            {{ post.description }}
          </p>
          <div class="text-xs text-white/40">查看评论 →</div>
        </NuxtLink>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "blog",
});

const { data: posts } = await useAsyncData("blog", async () => {
  return await queryContent("blog").sort({ date: -1 }).find();
});

const featured = computed(() => posts.value?.[0] ?? null);
const rest = computed(() => posts.value?.slice(1) ?? []);

function formatDate(date: string | Date) {
  return useDateFormat(date, "YYYY-MM-DD").value;
}

/** 文章页路径：在 base /blog/ 下为 /blog/:slug，故应用内用 /:slug */
function articlePath(contentPath: string) {
  return contentPath.replace(/^\/blog\//, "/") || "/";
}
</script>

<style scoped></style>
