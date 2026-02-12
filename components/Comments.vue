<template>
  <div
    id="comments"
    ref="commentsContainer"
    class="relative my-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 md:p-6"
  >
    <Transition name="skeleton-fade">
      <div
        v-if="showSkeleton"
        class="absolute inset-0 z-10 rounded-2xl bg-[rgba(10,14,20,0.72)] p-4 md:p-6 space-y-3"
      >
        <div class="h-4 w-40 rounded bg-white/10 animate-pulse" />
        <div class="h-20 w-full rounded-xl bg-white/10 animate-pulse" />
        <div class="h-20 w-full rounded-xl bg-white/10 animate-pulse" />
      </div>
    </Transition>
    <p
      v-if="showConfigHint"
      class="text-sm text-white/60"
    >
      评论系统未配置：请在本地环境变量中设置 Giscus 参数后重启开发服务。
    </p>
    <!-- Giscus comments widget will be injected here -->
  </div>
</template>

<script setup lang="ts">
const commentsContainer = ref<HTMLElement | null>(null);
const commentsLoaded = ref(false);
const widgetReady = ref(false);
let widgetObserver: MutationObserver | null = null;
let frameResizeObserver: ResizeObserver | null = null;

const config = useRuntimeConfig();
const repo = config.public.giscusRepo || "";
const repoId = config.public.giscusRepoId || "";
const category = config.public.giscusCategory || "Announcements";
const categoryId = config.public.giscusCategoryId || "";
const rawTheme = config.public.giscusTheme || "";
const theme =
  rawTheme && rawTheme !== "preferred_color_scheme" ? rawTheme : "dark_dimmed";
const hasGiscusConfig = computed(() => !!repo && !!repoId && !!categoryId);
const showConfigHint = computed(
  () => import.meta.dev && !hasGiscusConfig.value
);
const showSkeleton = computed(() => hasGiscusConfig.value && !widgetReady.value);

useHead({
  link: [
    { rel: "dns-prefetch", href: "https://giscus.app" },
    { rel: "dns-prefetch", href: "https://github.githubassets.com" },
    { rel: "preconnect", href: "https://giscus.app", crossorigin: "" },
    { rel: "preconnect", href: "https://github.githubassets.com", crossorigin: "" },
  ],
});

const loadComments = () => {
  if (commentsLoaded.value || !commentsContainer.value) return;
  if (!hasGiscusConfig.value) return;

  const script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  script.async = true;
  script.crossOrigin = "anonymous";

  script.setAttribute("data-repo", repo);
  script.setAttribute("data-repo-id", repoId);
  script.setAttribute("data-category", category);
  script.setAttribute("data-category-id", categoryId);
  // 用 pathname 作为 term，与 Netlify 一致，同一篇文章两边共用一个 discussion
  script.setAttribute("data-mapping", "specific");
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

const markReadyWhenFrameVisible = (frame: HTMLIFrameElement) => {
  const rect = frame.getBoundingClientRect();
  if (rect.height >= 160) {
    widgetReady.value = true;
  }
};

const bindFrameObservers = (frame: HTMLIFrameElement) => {
  frame.addEventListener("load", () => {
    // load 触发后，内容高度不一定立刻稳定，这里延后一帧再判断
    requestAnimationFrame(() => {
      markReadyWhenFrameVisible(frame);
    });
  });

  if (frameResizeObserver) {
    frameResizeObserver.disconnect();
  }
  frameResizeObserver = new ResizeObserver(() => {
    markReadyWhenFrameVisible(frame);
  });
  frameResizeObserver.observe(frame);
};

const detectWidgetReady = () => {
  if (!commentsContainer.value) return;
  const frame = commentsContainer.value.querySelector<HTMLIFrameElement>(".giscus-frame");
  if (!frame) return;

  if (frame.dataset.readyBound !== "1") {
    frame.dataset.readyBound = "1";
    bindFrameObservers(frame);
  }
  markReadyWhenFrameVisible(frame);
};

onMounted(() => {
  if (!commentsContainer.value) return;
  widgetReady.value = false;
  widgetObserver = new MutationObserver(() => {
    detectWidgetReady();
  });
  widgetObserver.observe(commentsContainer.value, {
    childList: true,
    subtree: true,
  });
  loadComments();
  detectWidgetReady();
});

onUnmounted(() => {
  if (widgetObserver) {
    widgetObserver.disconnect();
    widgetObserver = null;
  }
  if (frameResizeObserver) {
    frameResizeObserver.disconnect();
    frameResizeObserver = null;
  }
});
</script>

<style scoped>
.skeleton-fade-enter-active,
.skeleton-fade-leave-active {
  transition: opacity 0.28s ease;
}

.skeleton-fade-enter-from,
.skeleton-fade-leave-to {
  opacity: 0;
}
</style>
