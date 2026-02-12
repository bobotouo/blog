const GISCUS_SRC = "https://giscus.app/client.js";
let warmed = false;

const warmGiscusAssets = () => {
  if (warmed) return;
  warmed = true;

  if (!document.querySelector(`link[rel="prefetch"][href="${GISCUS_SRC}"]`)) {
    const prefetch = document.createElement("link");
    prefetch.rel = "prefetch";
    prefetch.as = "script";
    prefetch.href = GISCUS_SRC;
    prefetch.crossOrigin = "anonymous";
    document.head.appendChild(prefetch);
  }

  fetch(GISCUS_SRC, { mode: "no-cors", cache: "force-cache" }).catch(() => {
    // Ignore warmup failures in poor network conditions.
  });
};

export default defineNuxtPlugin(() => {
  const scheduleWarmup = () => {
    const requestIdle = (window as any).requestIdleCallback;
    if (typeof requestIdle === "function") {
      requestIdle(() => warmGiscusAssets(), { timeout: 1800 });
      return;
    }

    window.setTimeout(() => warmGiscusAssets(), 900);
  };

  const onFirstInteraction = () => {
    warmGiscusAssets();
    window.removeEventListener("pointerdown", onFirstInteraction);
    window.removeEventListener("keydown", onFirstInteraction);
    window.removeEventListener("touchstart", onFirstInteraction);
    window.removeEventListener("mousemove", onFirstInteraction);
  };

  scheduleWarmup();
  window.addEventListener("pointerdown", onFirstInteraction, { passive: true });
  window.addEventListener("keydown", onFirstInteraction, { passive: true });
  window.addEventListener("touchstart", onFirstInteraction, { passive: true });
  window.addEventListener("mousemove", onFirstInteraction, { passive: true });
});
