import { captureGiscusOAuthFromUrl } from "~/utils/giscus-oauth";

/** 仅尽早捕获 ?giscus=，具体恢复在 Comments 加载前执行，避免污染全局路由 */
captureGiscusOAuthFromUrl();

export default defineNuxtPlugin({
  name: "giscus-oauth",
  enforce: "pre",
});
