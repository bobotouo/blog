<template>
  <div
    id="comments"
    ref="commentsContainer"
    :class="{ 'comments-ready': widgetReady }"
    class="relative min-h-[18rem] md:min-h-[20rem] border-2 border-pencil bg-white p-4 md:p-6"
    :style="{ borderRadius: wobblyRadius.md, boxShadow: shadows.subtle }"
  >
    <Transition name="skeleton-fade">
      <div v-if="showSkeleton" class="comments-skeleton">
        <div class="comments-skeleton-title" />
        <div class="comments-skeleton-item" />
        <div class="comments-skeleton-item" />
      </div>
    </Transition>
    <p v-if="showConfigHint" class="font-body text-pencil/60">
      评论系统未配置：请在环境变量中设置 Giscus 参数后重启开发服务。
    </p>
  </div>
</template>

<script setup lang="ts">
import { wobblyRadius, shadows } from "~/utils/design-tokens";
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
const theme = rawTheme && rawTheme !== "preferred_color_scheme" ? rawTheme : "light";
const hasGiscusConfig = computed(() => !!repo && !!repoId && !!categoryId);
const showConfigHint = computed(() => import.meta.dev && !hasGiscusConfig.value);
const showSkeleton = computed(() => hasGiscusConfig.value && !widgetReady.value);

const loadComments = () => {
  if (commentsLoaded.value || !commentsContainer.value || !hasGiscusConfig.value) return;

  const script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  script.async = true;
  script.crossOrigin = "anonymous";
  script.setAttribute("data-repo", repo);
  script.setAttribute("data-repo-id", repoId);
  script.setAttribute("data-category", category);
  script.setAttribute("data-category-id", categoryId);
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
  if (frame.getBoundingClientRect().height >= 160) widgetReady.value = true;
};

const bindFrameObservers = (frame: HTMLIFrameElement) => {
  frame.addEventListener("load", () => requestAnimationFrame(() => markReadyWhenFrameVisible(frame)));
  if (frameResizeObserver) frameResizeObserver.disconnect();
  frameResizeObserver = new ResizeObserver(() => markReadyWhenFrameVisible(frame));
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
  widgetObserver = new MutationObserver(detectWidgetReady);
  widgetObserver.observe(commentsContainer.value, { childList: true, subtree: true });
  loadComments();
  detectWidgetReady();
});

onUnmounted(() => {
  widgetObserver?.disconnect();
  frameResizeObserver?.disconnect();
});
</script>

<style scoped>
.skeleton-fade-enter-active,
.skeleton-fade-leave-active { transition: opacity 0.28s ease; }
.skeleton-fade-enter-from,
.skeleton-fade-leave-to { opacity: 0; }

.comments-skeleton {
  position: absolute;
  inset: 1px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  pointer-events: none;
  background: #fdfbf7;
}

.comments-skeleton-title,
.comments-skeleton-item {
  background: linear-gradient(90deg, #e5e0d8, #f0ebe3, #e5e0d8);
  background-size: 220% 100%;
  animation: skeleton-shimmer 1.25s ease-in-out infinite;
  border: 2px dashed #2d2d2d30;
}

.comments-skeleton-title {
  height: 0.95rem;
  width: min(16rem, 48%);
  border-radius: 8px;
}

.comments-skeleton-item {
  flex: 1;
  min-height: 5.25rem;
  border-radius: 12px;
}

:global(#comments .giscus-frame) {
  opacity: 0;
  transition: opacity 0.22s ease;
}

:global(#comments.comments-ready .giscus-frame) {
  opacity: 1;
}

@keyframes skeleton-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
</style>
