<template>
  <section class="hand-container hand-section">
    <div class="mb-10">
      <HandTag variant="postit" class="mb-4 rotate-1">幻想连载</HandTag>
      <h1 class="font-heading text-4xl md:text-5xl font-bold text-pencil mb-3">AI 小说</h1>
      <p class="font-body text-lg text-pencil/60 max-w-xl leading-relaxed">
        一章一章贴在墙上的连载便签。点进单本，翻阅章节目录。
      </p>
      <p class="mt-3 font-body text-pencil/45">{{ fictionSeries.length }} 部小说</p>
    </div>

    <div v-if="fictionSeries.length > 0" class="space-y-5">
      <FictionSeriesCard
        v-for="(series, idx) in fictionSeries"
        :key="series.novelSlug"
        :novel-name="series.novelName"
        :description="series.description"
        :cover-image="series.coverImage"
        :chapter-count="series.chapterCount"
        :status="series.status"
        :to="nuxtLinkToFromContentPath(series.indexPath, base)"
        :comment-path="`${basePath}${series.indexPath}`"
        :class="idx % 2 === 0 ? '' : ''"
      />
    </div>

    <HandCard v-else decoration="tape" padding="p-6" :hover-lift="false">
      <p class="font-body text-pencil/60">
        暂无小说。在 <code class="bg-erased px-1 border border-pencil/30">content/ai-fiction/&lt;书名&gt;/</code> 下添加章节后执行构建脚本即可。
      </p>
    </HandCard>
  </section>
</template>

<script setup lang="ts">
import { useFictionSeries } from "~/composables/useFictionSeries";

definePageMeta({ layout: "blog" });

const config = useRuntimeConfig();
const base = (config.public.baseUrl as string) || "/";
const basePath = base.replace(/\/$/, "");

const { data: fictionSeriesData } = await useFictionSeries();
const fictionSeries = computed(() => fictionSeriesData.value ?? []);
const route = useRoute();
usePageStats(route.path);
</script>
