import { captureGiscusOAuthFromUrl, prepareGiscusOAuthHandoff } from "~/utils/giscus-oauth";

captureGiscusOAuthFromUrl();
prepareGiscusOAuthHandoff();

export default defineNuxtPlugin({
  name: "giscus-oauth",
  enforce: "pre",
});
