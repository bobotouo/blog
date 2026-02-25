<template>
  <section class="max-w-5xl mx-auto py-10 px-6">
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
      <div>
        <p class="text-xs uppercase tracking-[0.4em] text-white/50 mb-4">
          Daily Snapshots
        </p>
        <h1 class="text-4xl md:text-5xl font-semibold text-white">
          日常快照
        </h1>
        <p class="mt-3 text-white/60 max-w-xl">
          像朋友圈一样记录生活片段，轻量、直接、带一点情绪。
        </p>
      </div>
      <div class="text-white/50 text-sm">{{ snapshots?.length ?? 0 }} 条快照</div>
    </div>

    <div class="space-y-8">
      <article
        v-for="item in snapshots"
        :key="item._path"
        class="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 shadow-[0_30px_80px_rgba(0,0,0,0.4)]"
      >
        <div class="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/40">
          <span>Snapshot</span>
          <span class="text-white/20">·</span>
          <span>{{ formatDate(item.date) }}</span>
          <span v-if="item.location" class="text-white/30">· {{ item.location }}</span>
        </div>

        <NuxtLink :to="item._path" class="block mt-4">
          <h2 class="text-2xl md:text-3xl font-semibold text-white hover:text-[color:var(--accent)] transition">
            {{ item.title }}
          </h2>
          <p v-if="item.summary" class="mt-3 text-white/70">
            {{ item.summary }}
          </p>
        </NuxtLink>

        <div v-if="item.images && item.images.length" class="mt-6 grid gap-3 sm:grid-cols-2">
          <div
            v-for="(img, idx) in item.images"
            :key="`${item._path}-img-${idx}`"
            class="flex items-start"
          >
            <div class="inline-block max-w-full overflow-hidden rounded-2xl border border-white/15">
              <img
                :src="img"
                alt="snapshot"
                loading="lazy"
                decoding="async"
                class="block h-auto w-auto max-h-[20rem] max-w-full md:max-w-[28rem] object-contain"
              />
            </div>
          </div>
        </div>

        <div v-if="item.tags" class="mt-6 flex flex-wrap gap-2">
          <span
            v-for="tag in item.tags"
            :key="tag"
            class="px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/60 border border-white/10 rounded-full"
          >
            {{ tag }}
          </span>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "blog",
});

const config = useRuntimeConfig();
const basePath = ((config.public.baseUrl as string) || "/").replace(/\/$/, "");

const { data: snapshots } = await useAsyncData(
  "snapshots",
  async () => {
    if (import.meta.server) {
      return await queryContent("snapshots").sort({ date: -1 }).find();
    }
    const cached = useNuxtData("snapshots").data.value;
    if (cached?.length !== undefined) return cached;
    if (import.meta.dev) {
      try {
        return await queryContent("snapshots").sort({ date: -1 }).find();
      } catch {
        /* fallback */
      }
    }
    return await $fetch<unknown[]>(`${basePath}/snapshots-list.json`).catch(() => []);
  },
  { getCachedData: () => (import.meta.dev ? null : undefined) },
);

function formatDate(date: string | Date) {
  return useDateFormat(date, "YYYY-MM-DD").value;
}
</script>
