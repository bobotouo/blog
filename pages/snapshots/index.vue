<template>
  <section class="hand-container hand-section">
    <div class="mb-10">
      <HandTag variant="muted" class="mb-4 -rotate-1">生活碎片</HandTag>
      <h1 class="font-heading text-4xl md:text-5xl font-bold text-pencil mb-3">日常快照</h1>
      <p class="font-body text-lg text-pencil/60 max-w-xl leading-relaxed">
        像朋友圈一样记录生活片段，轻量、直接、带一点情绪。
      </p>
      <p class="mt-3 font-body text-pencil/45">{{ snapshots?.length ?? 0 }} 条快照</p>
    </div>

    <div class="space-y-8">
      <article v-for="(item, idx) in snapshots" :key="item._path">
        <HandCard
          decoration="none"
          :rotate="idx % 2 === 0 ? '-0.5deg' : '0.5deg'"
          padding="p-6 md:p-8"
        >
          <div class="flex flex-wrap items-center gap-3 font-body text-sm text-pencil/45 mb-4">
            <HandTag variant="muted" class="!text-xs">Snapshot</HandTag>
            <span>{{ formatDateYmd(item.date) }}</span>
            <span v-if="item.location">· {{ item.location }}</span>
          </div>

          <NuxtLink :to="nuxtLinkToFromContentPath(item._path, base)" class="block group">
            <h2 class="font-heading text-2xl md:text-3xl font-bold text-pencil group-hover:text-marker transition-colors">
              {{ item.title }}
            </h2>
            <p v-if="item.summary" class="mt-3 font-body text-pencil/65 leading-relaxed">
              {{ item.summary }}
            </p>
          </NuxtLink>

          <div v-if="item.images?.length" class="mt-6 grid gap-4 sm:grid-cols-2">
            <div v-for="(img, imgIdx) in item.images" :key="`${item._path}-img-${imgIdx}`">
              <img
                :src="img"
                :alt="`${item.title} 图片 ${imgIdx + 1}`"
                loading="lazy"
                decoding="async"
                class="block h-auto w-auto max-h-[20rem] max-w-full border-[3px] border-pencil object-contain"
                :style="{ borderRadius: wobblyRadius.sm, boxShadow: shadows.subtle }"
              />
            </div>
          </div>

          <div v-if="item.tags" class="mt-5 flex flex-wrap gap-2">
            <HandTag v-for="tag in item.tags" :key="tag" variant="postit" class="!text-xs">
              {{ tag }}
            </HandTag>
          </div>
        </HandCard>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { wobblyRadius, shadows } from "~/utils/design-tokens";
import { formatDateYmd } from "~/utils/format-date";
import { nuxtLinkToFromContentPath } from "~/utils/route-from-content-path";

definePageMeta({ layout: "blog" });

const config = useRuntimeConfig();
const base = (config.public.baseUrl as string) || "/";
const basePath = base.replace(/\/$/, "");
const jsonBase = import.meta.server ? "" : basePath;

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
      } catch { /* fallback */ }
    }
    return await $fetch<unknown[]>(`${jsonBase}/snapshots-list.json`).catch(() => []);
  },
  { getCachedData: () => (import.meta.dev ? null : undefined) },
);
</script>
