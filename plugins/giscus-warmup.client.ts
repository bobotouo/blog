const GISCUS_SRC = "https://giscus.app/client.js";
let warmed = false;

const mayNeedCommentsSoon = (path: string): boolean => {
  if (!path || path === "/") return false;
  if (path === "/blog" || path === "/ai-fiction" || path === "/snapshots" || path === "/stats") {
    return false;
  }
  return (
    path.startsWith("/blog/") ||
    path.startsWith("/ai-fiction/") ||
    path.startsWith("/snapshots/") ||
    /^\/[^/]+\/?$/.test(path)
  );
};

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

  // 避免本地调试阶段多一个跨站请求占用资源；由真实评论页按需加载即可。
};

export default defineNuxtPlugin(() => {
  if (import.meta.dev) return;
  const route = useRoute();
  if (!mayNeedCommentsSoon(route.path)) return;

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
