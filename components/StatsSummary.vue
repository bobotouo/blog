<!--
  访问统计展示：总访问量、按页面/设备/地域分布
-->
<template>
  <div class="stats-summary font-body text-pencil/80 text-sm space-y-4">
    <div v-if="pending && !summary" class="animate-pulse font-body text-pencil/50">
      统计加载中…
    </div>
    <template v-else-if="summary">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
        <div
          v-for="item in periodCards"
          :key="item.label"
          class="border-2 border-pencil bg-white px-3 py-2 shadow-hand-subtle"
          :style="{ borderRadius: wobblyRadius.sm }"
        >
          <p class="text-pencil/50 text-xs font-body">{{ item.label }}</p>
          <p class="font-heading text-lg font-bold text-pencil tabular-nums">{{ formatNumber(item.value) }}</p>
        </div>
      </div>

      <div v-if="deviceEntries.length" class="mt-4">
        <p class="font-heading text-pencil mb-2">按设备分布</p>
        <ul class="space-y-2 pl-0 list-none">
          <li v-for="[key, count] in deviceEntries" :key="key" class="flex items-center gap-2">
            <span class="w-16 shrink-0">{{ deviceLabel(key) }}</span>
            <span class="tabular-nums text-pencil/50 shrink-0 w-8">{{ count }}</span>
            <div class="flex-1 min-w-0 h-2 border border-pencil/20 overflow-hidden max-w-32 bg-erased">
              <div class="h-full bg-pen" :style="barStyle(count, deviceMax)" />
            </div>
          </li>
        </ul>
      </div>

      <div v-if="summary.byCountry?.length" class="mt-4">
        <p class="font-heading text-pencil mb-2">按地域分布</p>
        <ul class="space-y-2 pl-0 list-none max-h-40 overflow-y-auto">
          <li v-for="item in summary.byCountry" :key="item.code" class="flex items-center gap-2">
            <span class="flex-1 min-w-0">{{ item.country }}</span>
            <span class="tabular-nums text-pencil/50 shrink-0">{{ item.views }}</span>
            <div class="w-16 h-2 border border-pencil/20 shrink-0 overflow-hidden bg-erased">
              <div class="h-full bg-marker" :style="barStyle(item.views, countryMax)" />
            </div>
          </li>
        </ul>
      </div>

      <details v-if="summary.byPath.length" class="mt-4 group/details" :open="defaultOpen">
        <summary class="cursor-pointer list-none text-pen hover:text-marker inline-flex items-center gap-1 font-body">
          <span>按页面分布</span>
          <span class="transition group-open/details:rotate-180">▼</span>
        </summary>
        <ul class="mt-2 space-y-2 pl-0 list-none max-h-48 overflow-y-auto">
          <li v-for="item in summary.byPath" :key="item.path" class="flex items-center gap-2">
            <span class="flex-1 min-w-0 truncate" :title="item.path">{{ displayPath(item.path) }}</span>
            <span class="tabular-nums text-pencil/50 shrink-0">{{ item.views }}</span>
            <div class="w-12 h-2 border border-pencil/20 shrink-0 overflow-hidden bg-erased" :title="`${item.views} 次`">
              <div class="h-full bg-pen" :style="barStyle(item.views, pathMax)" />
            </div>
          </li>
        </ul>
      </details>
    </template>
  </div>
</template>

<script setup lang="ts">
import { wobblyRadius } from "~/utils/design-tokens";
import type { DeviceType, StatsSummary } from "~/composables/useStatsSummary";

const props = withDefaults(
  defineProps<{
    summary: StatsSummary | null;
    pending: boolean;
    defaultOpen?: boolean;
  }>(),
  { defaultOpen: false },
);

const deviceLabels: Record<DeviceType, string> = {
  desktop: "桌面",
  mobile: "手机",
  tablet: "平板",
  bot: "爬虫",
  unknown: "未知",
};

const periodCards = computed(() => {
  const s = props.summary;
  if (!s) return [];
  return [
    { label: "近一周", value: s.last7Days },
    { label: "近一月", value: s.last30Days },
    { label: "近一年", value: s.last365Days },
    { label: "总共", value: s.total },
  ];
});

const formatNumber = (n: number) => {
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}亿`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)}万`;
  return n.toLocaleString();
};

const pathMax = computed(() => {
  const s = props.summary;
  if (!s?.byPath?.length) return 1;
  return Math.max(...s.byPath.map((x) => x.views), 1);
});

const deviceEntries = computed(() => {
  const s = props.summary?.byDevice;
  if (!s || typeof s !== "object") return [];
  return Object.entries(s).filter(([, v]) => (v ?? 0) > 0) as [string, number][];
});

const deviceMax = computed(() => {
  const s = props.summary?.byDevice;
  if (!s) return 1;
  return Math.max(...Object.values(s), 1);
});

const countryMax = computed(() => {
  const list = props.summary?.byCountry;
  if (!list?.length) return 1;
  return Math.max(...list.map((x) => x.views), 1);
});

function barStyle(views: number, max: number) {
  return { width: `${Math.min(max ? (views / max) * 100 : 0, 100)}%` };
}

function deviceLabel(key: string): string {
  return deviceLabels[key as DeviceType] ?? key;
}

function displayPath(path: string) {
  if (!path) return "—";
  return path.startsWith("/") ? path : `/${path}`;
}
</script>
