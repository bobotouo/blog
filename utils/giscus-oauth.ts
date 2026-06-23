/** Giscus OAuth：client.js 从 ?giscus= 或 localStorage「giscus-session」读取一次性 code */
export const GISCUS_OAUTH_STORAGE_KEY = "__giscus_oauth_pending__";
const GISCUS_OAUTH_TS_KEY = "__giscus_oauth_pending_ts__";
const GISCUS_SESSION_KEY = "giscus-session";
const GISCUS_OAUTH_TTL_MS = 2 * 60 * 1000;

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

export function getFreshGiscusOAuthCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromUrl = new URL(window.location.href).searchParams.get("giscus");
    if (fromUrl) return fromUrl;
    if (!isPendingFresh()) return null;
    return sessionStorage.getItem(GISCUS_OAUTH_STORAGE_KEY);
  } catch {
    return null;
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

/**
 * giscus client.js 在 script 执行时读 location.href；async 加载期间 query 可能再被抹掉。
 * 提前写入 giscus-session，与官方 client.js 逻辑一致：JSON.stringify(code)
 */
export function primeGiscusSessionForClient() {
  if (typeof window === "undefined") return;
  restoreGiscusOAuthToUrl();
  const code = getFreshGiscusOAuthCode();
  if (!code) return;
  localStorage.setItem(GISCUS_SESSION_KEY, JSON.stringify(code));
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

/** client.js 自己会 strip ?giscus=，这里只清我们自己的备份 */
export function finalizeGiscusOAuthHandoff() {
  clearGiscusOAuthPending();
}
