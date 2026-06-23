/** Giscus OAuth 回调依赖 URL 中的 ?giscus= 会话参数，SPA 路由可能提前将其抹掉 */
export const GISCUS_OAUTH_STORAGE_KEY = "__giscus_oauth_pending__";

export function captureGiscusOAuthFromUrl(url?: string) {
  if (typeof window === "undefined") return;
  try {
    const href = url ?? window.location.href;
    const token = new URL(href).searchParams.get("giscus");
    if (token) sessionStorage.setItem(GISCUS_OAUTH_STORAGE_KEY, token);
  } catch {
    /* ignore */
  }
}

/** 若 URL 已丢失 giscus 参数，从 sessionStorage 恢复，供 client.js 读取 */
export function restoreGiscusOAuthToUrl() {
  if (typeof window === "undefined") return false;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("giscus")) {
      sessionStorage.removeItem(GISCUS_OAUTH_STORAGE_KEY);
      return true;
    }
    const pending = sessionStorage.getItem(GISCUS_OAUTH_STORAGE_KEY);
    if (!pending) return false;
    url.searchParams.set("giscus", pending);
    window.history.replaceState(window.history.state, "", url.toString());
    return true;
  } catch {
    return false;
  }
}

export function clearGiscusOAuthPending() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(GISCUS_OAUTH_STORAGE_KEY);
}

export function stripGiscusOAuthFromUrl() {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("giscus")) return;
    url.searchParams.delete("giscus");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, "", next);
  } catch {
    /* ignore */
  }
}
