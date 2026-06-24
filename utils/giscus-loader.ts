/** jsDelivr 上的 giscus 是 Web Component（非 giscus.app/client.js） */
export const GISCUS_HOST = "https://giscus.app";
export const GISCUS_JSDELIVR_MODULE = "https://cdn.jsdelivr.net/npm/giscus@1.6.0/dist/giscus.mjs";

export function giscusWidgetLoaded() {
  return typeof customElements !== "undefined" && !!customElements.get("giscus-widget");
}

/** 优先本地打包 → 同源 public → jsDelivr */
export async function loadGiscusWidget(options?: { moduleUrl?: string; basePath?: string }) {
  if (giscusWidgetLoaded()) return "bundled";

  try {
    await import("giscus");
    if (giscusWidgetLoaded()) return "bundled";
  } catch {
    /* try fallbacks */
  }

  const base = (options?.basePath || "").replace(/\/$/, "");
  const fallbacks = [
    options?.moduleUrl,
    base ? `${base}/giscus-widget.mjs` : "/giscus-widget.mjs",
    GISCUS_JSDELIVR_MODULE,
  ].filter((url): url is string => !!url);

  for (const url of fallbacks) {
    try {
      await import(/* @vite-ignore */ url);
      if (giscusWidgetLoaded()) return url;
    } catch {
      /* next */
    }
  }

  throw new Error("giscus widget module failed to load");
}

/** client.js 回退：同源 vendor → 官方 */
export function giscusClientScriptUrls(basePath = "") {
  const base = basePath.replace(/\/$/, "");
  const local = base ? `${base}/giscus-client.js` : "/giscus-client.js";
  return [local, `${GISCUS_HOST}/client.js`];
}
