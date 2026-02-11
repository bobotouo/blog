<!--
  访问统计展示：总访问量、按页面/设备/地域分布
-->
<template>
  <div class="stats-summary text-white/70 text-sm space-y-4">
    <div v-if="pending && !summary" class="animate-pulse">
      统计加载中…
    </div>
    <template v-else-if="summary">
      <!-- 时间段汇总：近一周 / 近一月 / 近一年 / 总共 -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
        <div class="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <p class="text-white/50 text-xs">近一周</p>
          <p class="text-white font-medium tabular-nums">{{ formatNumber(summary.last7Days) }}</p>
        </div>
        <div class="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <p class="text-white/50 text-xs">近一月</p>
          <p class="text-white font-medium tabular-nums">{{ formatNumber(summary.last30Days) }}</p>
        </div>
        <div class="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <p class="text-white/50 text-xs">近一年</p>
          <p class="text-white font-medium tabular-nums">{{ formatNumber(summary.last365Days) }}</p>
        </div>
        <div class="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <p class="text-white/50 text-xs">总共</p>
          <p class="text-white font-medium tabular-nums">{{ formatNumber(summary.total) }}</p>
        </div>
      </div>

      <!-- 按设备分布 -->
      <div v-if="deviceEntries.length" class="mt-3">
        <p class="text-white/50 mb-2">按设备分布</p>
        <ul class="space-y-1.5 pl-0 list-none">
          <li
            v-for="[key, count] in deviceEntries"
            :key="key"
            class="flex items-center gap-2"
          >
            <span class="w-16 shrink-0 text-white/70">{{ deviceLabel(key) }}</span>
            <span class="tabular-nums text-white/50 shrink-0 w-8">{{ count }}</span>
            <div class="flex-1 min-w-0 h-1.5 rounded-full bg-white/10 overflow-hidden max-w-32">
              <div
                class="h-full rounded-full bg-[color:var(--accent)]"
                :style="barStyle(count, deviceMax)"
              />
            </div>
          </li>
        </ul>
      </div>

      <!-- 按地域分布 -->
      <div v-if="summary.byCountry?.length" class="mt-3">
        <p class="text-white/50 mb-2">按地域分布</p>
        <ul class="space-y-1.5 pl-0 list-none max-h-40 overflow-y-auto">
          <li
            v-for="item in summary.byCountry"
            :key="item.code"
            class="flex items-center gap-2"
          >
            <span class="flex-1 min-w-0 text-white/70">{{ item.country }}</span>
            <span class="tabular-nums text-white/50 shrink-0">{{ item.views }}</span>
            <div class="w-16 h-1.5 rounded-full bg-white/10 shrink-0 overflow-hidden">
              <div
                class="h-full rounded-full bg-[color:var(--accent)]"
                :style="barStyle(item.views, countryMax)"
              />
            </div>
          </li>
        </ul>
      </div>

      <!-- 按页面分布 -->
      <details v-if="summary.byPath.length" class="mt-3 group/details" :open="defaultOpen">
        <summary class="cursor-pointer list-none text-white/50 hover:text-white/70 inline-flex items-center gap-1">
          <span>按页面分布</span>
          <span class="transition group-open/details:rotate-180">▼</span>
        </summary>
        <ul class="mt-2 space-y-1.5 pl-0 list-none max-h-48 overflow-y-auto">
          <li
            v-for="item in summary.byPath"
            :key="item.path"
            class="flex items-center gap-2"
          >
            <span
              class="flex-1 min-w-0 truncate text-white/70"
              :title="item.path"
            >
              {{ displayPath(item.path) }}
            </span>
            <span class="tabular-nums text-white/50 shrink-0">{{ item.views }}</span>
            <div
              class="w-12 h-1.5 rounded-full bg-white/10 shrink-0 overflow-hidden"
              :title="`${item.views} 次`"
            >
              <div
                class="h-full rounded-full bg-[color:var(--accent)]"
                :style="barStyle(item.views, pathMax)"
              />
            </div>
          </li>
        </ul>
      </details>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { DeviceType, StatsSummary } from "~/composables/useStatsSummary";

const props = withDefaults(
  defineProps<{
    summary: StatsSummary | null;
    pending: boolean;
    /** 是否默认展开「按页面分布」 */
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
  const pct = max ? (views / max) * 100 : 0;
  return { width: `${Math.min(pct, 100)}%` };
}

function deviceLabel(key: string): string {
  return deviceLabels[key as DeviceType] ?? key;
}

function displayPath(path: string) {
  if (!path) return "—";
  return path.startsWith("/") ? path : `/${path}`;
}
</script>
