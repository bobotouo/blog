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
      <div class="text-white/50 text-sm">
        {{ posts?.length ?? 0 }} 篇文章
      </div>
    </div>
    <div class="grid gap-6 md:grid-cols-2">
      <article
        v-for="post in posts"
        :key="post._path"
        class="group p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300 shadow-[0_0_0_rgba(0,0,0,0)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
      >
        <NuxtLink :to="post._path" class="block space-y-4">
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

function formatDate(date: string | Date) {
  return useDateFormat(date, "YYYY-MM-DD").value;
}
</script>

<style scoped></style>
