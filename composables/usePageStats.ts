import { onMounted, ref } from "vue";

/** 统计 API 的 base：未配置 statsBase 时用当前站点同源 /api */
function getStatsApiBase(): string {
  const config = useRuntimeConfig();
  const base = config.public.statsBase as string | undefined;
  if (base) return base;
  if (import.meta.client && typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }
  return "";
}

export const usePageStats = (path: string) => {
  const views = ref<number | null>(null);

  const track = async () => {
    if (!import.meta.client) return;
    const apiBase = getStatsApiBase();
    if (!apiBase) return;

    const payload = JSON.stringify({ path });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(`${apiBase}/track`, blob);
      return;
    }

    await fetch(`${apiBase}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    });
  };

  const load = async () => {
    const apiBase = getStatsApiBase();
    if (!apiBase) return;
    try {
      const data = await $fetch<{ views?: number }>(`${apiBase}/stats`, {
        query: { path },
        timeout: 4000,
      });
      if (typeof data?.views === "number") {
        views.value = data.views;
      }
    } catch {
      // Keep views as null on failure.
    }
  };

  onMounted(() => {
    const run = () => {
      track();
      load();
    };
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => run(), { timeout: 1500 });
      return;
    }
    window.setTimeout(run, 700);
  });

  return { views };
};
