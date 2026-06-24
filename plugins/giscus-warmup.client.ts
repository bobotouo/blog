const GISCUS_SRC = "https://giscus.app/client.js";
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

  const urls = [GISCUS_SRC];

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

  scheduleWarmup();
});
