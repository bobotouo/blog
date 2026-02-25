export default defineNuxtPlugin(() => {
  if (!process.client) return;

  const config = useRuntimeConfig();
  const rawBase = config.public.baseUrl || "/";
  const base = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;

  const fixImages = () => {
    if (!base || base === "/") return;
    document
      .querySelectorAll<HTMLImageElement>('img[src^="/uploads/"], img[src^="/images/"]')
      .forEach((img) => {
        const src = img.getAttribute("src");
        if (!src) return;
        if (src.startsWith(`${base}/`)) return;
        img.setAttribute("src", `${base}${src}`);
      });
  };

  const nuxtApp = useNuxtApp();
  nuxtApp.hook("page:finish", fixImages);

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", fixImages, { once: true });
  } else {
    fixImages();
  }
});
