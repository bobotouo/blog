import {
  captureGiscusOAuthFromUrl,
  getFreshGiscusOAuthCode,
  primeGiscusSessionForClient,
  restoreGiscusOAuthToUrl,
} from "~/utils/giscus-oauth";

captureGiscusOAuthFromUrl();

export default defineNuxtPlugin({
  name: "giscus-oauth",
  enforce: "pre",
  setup() {
    const router = useRouter();

    router.beforeEach((to) => {
      const code = getFreshGiscusOAuthCode();
      if (code && !to.query.giscus) {
        return {
          path: to.path,
          hash: to.hash,
          query: { ...to.query, giscus: code },
          replace: true,
        };
      }
    });

    restoreGiscusOAuthToUrl();
    router.isReady().then(() => {
      restoreGiscusOAuthToUrl();
      primeGiscusSessionForClient();
    });
  },
});
