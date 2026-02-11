/**
 * 访问统计汇总：总访问量 + 按路径分布，用于仪表盘展示
 */
import type { Ref } from "vue";

export type DeviceType = "desktop" | "mobile" | "tablet" | "bot" | "unknown";

export type StatsSummary = {
  total: number;
  last7Days: number;
  last30Days: number;
  last365Days: number;
  byPath: { path: string; views: number }[];
  byDevice: Record<DeviceType, number>;
  byCountry: { country: string; code: string; views: number }[];
};

export function useStatsSummary(): {
  summary: Ref<StatsSummary | null>;
  pending: Ref<boolean>;
  refresh: () => Promise<void>;
} {
  const config = useRuntimeConfig();
  const statsBase = (config.public.statsBase as string) || "";
  const summaryUrl = statsBase
    ? `${statsBase.replace(/\/$/, "")}/stats/summary`
    : "/api/stats/summary";

  const summary = ref<StatsSummary | null>(null);
  const pending = ref(true);

  const fetchSummary = async () => {
    if (!import.meta.client) return;
    pending.value = true;
    try {
      const data = await $fetch<StatsSummary>(summaryUrl, { credentials: "same-origin" });
      summary.value = data;
    } catch {
      summary.value = null;
    } finally {
      pending.value = false;
    }
  };

  onMounted(fetchSummary);

  return { summary, pending, refresh: fetchSummary };
}
