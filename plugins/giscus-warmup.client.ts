import { GISCUS_JSDELIVR_MODULE } from "~/utils/giscus-loader";

const WARM_URLS = [
  GISCUS_JSDELIVR_MODULE,
];

let warmed = false;

const mayNeedCommentsSoon = (path: string): boolean => {
  if (!path || path === "/") return false;
  if (path === "/blog" || path === "/ai-fiction" || path === "/snapshots" || path === "/stats") {
    return false;
  }
  return (
    path.startsWith("/blog/")
    || path.startsWith("/ai-fiction/")
    || path.startsWith("/snapshots/")
    || /^\/[^/]+\/?$/.test(path)
  );
};

const warmGiscusAssets = () => {
  if (warmed) return;
  warmed = true;

  const config = useRuntimeConfig();
  const base = ((config.public.baseUrl as string) || "/").replace(/\/$/, "");
  const urls = [
    config.public.giscusModuleUrl as string,
    base ? `${base}/giscus-widget.mjs` : "/giscus-widget.mjs",
    base ? `${base}/giscus-client.js` : "/giscus-client.js",
    ...WARM_URLS,
  ].filter(Boolean);

  for (const href of urls) {
    if (document.querySelector(`link[rel="prefetch"][href="${href}"]`)) continue;
    const prefetch = document.createElement("link");
    prefetch.rel = "prefetch";
    prefetch.as = "script";
    prefetch.href = href;
    prefetch.crossOrigin = "anonymous";
    document.head.appendChild(prefetch);
  }
};

export default defineNuxtPlugin(() => {
  if (import.meta.dev) return;
  const route = useRoute();
  if (!mayNeedCommentsSoon(route.path)) return;

  const scheduleWarmup = () => {
    const requestIdle = (window as Window & { requestIdleCallback?: typeof requestIdleCallback }).requestIdleCallback;
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
