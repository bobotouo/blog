<!--
  访问统计页：总访问量 + 按页面/设备/地域分布，仅自己查看（路径 /stats 避免与 /admin Decap CMS 冲突）
-->
<template>
  <section class="max-w-3xl mx-auto py-10 px-6">
    <div class="mb-8 flex flex-col gap-2">
      <h1 class="text-2xl font-semibold text-white">访问统计</h1>
      <p class="text-sm text-white/50">仅后台查看，不对外展示</p>
    </div>

    <div
      class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6"
    >
      <div class="flex items-center justify-between gap-4 mb-4">
        <span class="text-white/50 text-sm">数据来源：当前站点 API</span>
        <button
          type="button"
          class="text-sm text-white/50 hover:text-white/70 transition disabled:opacity-50"
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
    </div>

    <div class="mt-6 flex gap-4 text-sm text-white/50">
      <NuxtLink to="/blog" class="hover:text-white transition">返回博客</NuxtLink>
      <NuxtLink to="/admin/" class="hover:text-white transition">内容后台</NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "blog",
});

const statsSummary = useStatsSummary();
const statsSummaryData = computed(() => statsSummary.summary.value);
const statsSummaryPending = computed(() => statsSummary.pending.value);
</script>
