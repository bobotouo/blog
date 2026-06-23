import {
  captureGiscusOAuthFromUrl,
  restoreGiscusOAuthToUrl,
} from "~/utils/giscus-oauth";

captureGiscusOAuthFromUrl();

export default defineNuxtPlugin({
  name: "giscus-oauth",
  enforce: "pre",
  setup() {
    restoreGiscusOAuthToUrl();
    const router = useRouter();
    router.isReady().then(() => restoreGiscusOAuthToUrl());
  },
});
