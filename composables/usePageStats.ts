import { onMounted, ref } from "vue";

export const usePageStats = (path: string) => {
  const views = ref<number | null>(null);
  const config = useRuntimeConfig();
  const statsBase = config.public.statsBase || "";

  const track = async () => {
    if (!process.client || !statsBase) return;

    const payload = JSON.stringify({ path });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(`${statsBase}/track`, blob);
      return;
    }

    await fetch(`${statsBase}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    });
  };

  const load = async () => {
    if (!statsBase) return;
    const { data } = await useFetch(`${statsBase}/stats`, {
      query: { path },
      server: false,
    });

    if (data.value && typeof data.value.views === "number") {
      views.value = data.value.views;
    }
  };

  onMounted(() => {
    track();
    load();
  });

  return { views };
};
