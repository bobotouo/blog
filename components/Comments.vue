<template>
  <div id="comments" ref="commentsContainer" class="my-8">
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
const theme = config.public.giscusTheme || "dark";

onMounted(() => {
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
  script.setAttribute("data-reactions-enabled", "1");
  script.setAttribute("data-emit-metadata", "0");
  script.setAttribute("data-input-position", "bottom");
  script.setAttribute("data-theme", theme);
  script.setAttribute("data-lang", "zh-CN");

  commentsContainer.value.appendChild(script);
  commentsLoaded.value = true;
});
</script>

<style scoped>
/* No extra styles */
</style>
