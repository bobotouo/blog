import {
  GISCUS_OAUTH_STORAGE_KEY,
  captureGiscusOAuthFromUrl,
  hasOAuthCallback,
  prepareGiscusOAuthHandoff,
  restoreGiscusOAuthToUrl,
} from "~/utils/giscus-oauth";

/** OAuth 回跳：把 ?giscus= 同步进 Vue Router，避免 hydration 后地址栏丢 token */
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return;

  captureGiscusOAuthFromUrl();
  if (!hasOAuthCallback()) return;

  restoreGiscusOAuthToUrl();
  prepareGiscusOAuthHandoff();

  const pending = sessionStorage.getItem(GISCUS_OAUTH_STORAGE_KEY);
  const fromUrl = typeof window !== "undefined"
    ? new URL(window.location.href).searchParams.get("giscus")
    : null;
  const token = fromUrl || pending;
  if (!token || to.query.giscus === token) return;

  return navigateTo(
    { path: to.path, query: { ...to.query, giscus: token }, hash: to.hash },
    { replace: true },
  );
});
