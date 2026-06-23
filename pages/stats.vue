<template>
  <section class="hand-container hand-section">
    <HandTag variant="muted" class="mb-4">后台</HandTag>
    <h1 class="font-heading text-3xl md:text-4xl font-bold text-pencil mb-2">访问统计</h1>
    <p class="font-body text-pencil/50 mb-8">仅自己查看，不对外展示</p>

    <HandCard decoration="tape" padding="p-6" :hover-lift="false">
      <div class="flex items-center justify-between gap-4 mb-5">
        <span class="font-body text-sm text-pencil/50">数据来源：当前站点 API</span>
        <button
          type="button"
          class="font-body text-sm text-pen hover:text-marker transition disabled:opacity-50 hand-wavy-underline"
          :disabled="statsSummaryPending"
          @click="statsSummary.refresh()"
        >
          刷新
        </button>
      </div>
      <StatsSummary
        :summary="statsSummaryData"
        :pending="statsSummaryPending"
        :default-open="true"
      />
    </HandCard>

    <div class="mt-8 flex gap-6 font-body text-pencil/50">
      <NuxtLink to="/" class="hover:text-marker hover:line-through transition">返回首页</NuxtLink>
      <NuxtLink to="/blog" class="hover:text-pen hover:line-through transition">随笔</NuxtLink>
      <a href="/admin/" class="hover:text-pencil hover:line-through transition">内容后台</a>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ layout: "blog" });

const statsSummary = useStatsSummary();
const statsSummaryData = computed(() => statsSummary.summary.value);
const statsSummaryPending = computed(() => statsSummary.pending.value);
</script>
