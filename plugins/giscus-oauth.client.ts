import {
  captureGiscusOAuthFromUrl,
  hasOAuthCallback,
  primeGiscusSessionForOAuth,
  restoreGiscusOAuthToUrl,
} from "~/utils/giscus-oauth";

/** 在 Vue Router hydration 前捕获 OAuth 并恢复 URL / localStorage */
captureGiscusOAuthFromUrl();
if (hasOAuthCallback()) {
  primeGiscusSessionForOAuth();
  restoreGiscusOAuthToUrl();
}

export default defineNuxtPlugin({
  name: "giscus-oauth",
  enforce: "pre",
});
