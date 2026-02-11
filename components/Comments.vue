<template>
  <div
    id="comments"
    ref="commentsContainer"
    class="my-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 md:p-6"
  >
    <!-- Giscus comments widget will be injected here -->
  </div>
</template>

<script setup lang="ts">
const commentsContainer = ref<HTMLElement | null>(null);
const commentsLoaded = ref(false);

const config = useRuntimeConfig();
const repo = config.public.giscusRepo || "";
const repoId = config.public.giscusRepoId || "";
const category = config.public.giscusCategory || "Announcements";
const categoryId = config.public.giscusCategoryId || "";
const rawTheme = config.public.giscusTheme || "";
const theme =
  rawTheme && rawTheme !== "preferred_color_scheme" ? rawTheme : "dark_dimmed";

const loadComments = () => {
  if (commentsLoaded.value || !commentsContainer.value) return;
  if (!repo || !repoId || !categoryId) return;

  const script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  script.async = true;
  script.crossOrigin = "anonymous";

  script.setAttribute("data-repo", repo);
  script.setAttribute("data-repo-id", repoId);
  script.setAttribute("data-category", category);
  script.setAttribute("data-category-id", categoryId);
  script.setAttribute("data-mapping", "pathname");
  // 显式传完整 pathname，避免静态站 base 导致 term 不一致而 404
  const term = typeof window !== "undefined" ? window.location.pathname : "";
  if (term) script.setAttribute("data-term", term);
  script.setAttribute("data-reactions-enabled", "1");
  script.setAttribute("data-emit-metadata", "0");
  script.setAttribute("data-input-position", "bottom");
  script.setAttribute("data-theme", theme);
  script.setAttribute("data-lang", "zh-CN");

  commentsContainer.value.appendChild(script);
  commentsLoaded.value = true;
};

onMounted(() => {
  if (!commentsContainer.value) return;
  loadComments();
});
</script>
