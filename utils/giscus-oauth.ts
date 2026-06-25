/** Giscus OAuth 回调：保留 ?giscus= 供 client.js 读取（一次性加密 session） */
export const GISCUS_OAUTH_STORAGE_KEY = "__giscus_oauth_pending__";
const GISCUS_OAUTH_TS_KEY = "__giscus_oauth_pending_ts__";
export const GISCUS_SESSION_KEY = "giscus-session";
const GISCUS_OAUTH_TTL_MS = 10 * 60 * 1000;

export function getGiscusDiscussionTerm(fallbackPath = ""): string {
  if (typeof window !== "undefined") return window.location.pathname;
  return fallbackPath;
}

export function captureGiscusOAuthFromUrl(url?: string) {
  if (typeof window === "undefined") return;
  try {
    const href = url ?? window.location.href;
    const token = new URL(href).searchParams.get("giscus");
    if (!token) return;
    sessionStorage.setItem(GISCUS_OAUTH_STORAGE_KEY, token);
    sessionStorage.setItem(GISCUS_OAUTH_TS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

function isPendingFresh(): boolean {
  const ts = Number(sessionStorage.getItem(GISCUS_OAUTH_TS_KEY) || 0);
  return ts > 0 && Date.now() - ts < GISCUS_OAUTH_TTL_MS;
}

export function hasOAuthCallback(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (new URL(window.location.href).searchParams.get("giscus")) return true;
    return isPendingFresh() && !!sessionStorage.getItem(GISCUS_OAUTH_STORAGE_KEY);
  } catch {
    return false;
  }
}

/** 路由 hydration 可能抹掉 ?giscus=，在 client.js 执行前写回 URL */
export function restoreGiscusOAuthToUrl() {
  if (typeof window === "undefined") return false;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("giscus")) return true;
    if (!isPendingFresh()) {
      clearGiscusOAuthPending();
      return false;
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

/** OAuth 回跳：清掉过期 session，只让 client.js 从 URL 写入 giscus-session */
export function prepareGiscusOAuthHandoff() {
  if (!hasOAuthCallback()) return;
  restoreGiscusOAuthToUrl();
  const fromUrl = new URL(window.location.href).searchParams.get("giscus");
  if (fromUrl) {
    localStorage.removeItem(GISCUS_SESSION_KEY);
  }
}

export function clearGiscusOAuthPending() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(GISCUS_OAUTH_STORAGE_KEY);
  sessionStorage.removeItem(GISCUS_OAUTH_TS_KEY);
}

export function clearGiscusSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GISCUS_SESSION_KEY);
  clearGiscusOAuthPending();
}

/** client.js 处理完 URL 上的 ?giscus= 后清备份 */
export function finalizeGiscusOAuthHandoff() {
  clearGiscusOAuthPending();
}
