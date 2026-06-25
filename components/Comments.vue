<template>
  <div
    id="comments"
    ref="commentsContainer"
    class="comments-shell relative min-h-[18rem] md:min-h-[20rem] border-2 border-pencil bg-white p-4 md:p-6"
    :style="{ borderRadius: wobblyRadius.md, boxShadow: shadows.subtle }"
  >
    <Transition name="skeleton-fade">
      <div v-if="showSkeleton" class="comments-skeleton space-y-3 pointer-events-none">
        <div class="h-2.5 w-28 rounded-sm bg-erased/80 animate-pulse" />
        <div
          class="h-14 rounded border border-dashed border-pencil/20 bg-erased/25 animate-pulse"
          :style="{ borderRadius: wobblyRadius.sm }"
        />
        <div
          class="h-14 rounded border border-dashed border-pencil/20 bg-erased/25 animate-pulse"
          :style="{ borderRadius: wobblyRadius.sm }"
        />
      </div>
    </Transition>
    <p v-if="showConfigHint" class="font-body text-pencil/60">
      评论系统未配置：请在环境变量中设置 Giscus 参数后重启开发服务。
    </p>
    <p v-else-if="loadError" class="font-body text-pencil/70 space-y-2">
      <span class="block">评论服务加载失败。</span>
      <span class="block text-sm text-pencil/50">
        <button type="button" class="underline hover:text-pencil" @click="retryLoad">点击重试</button>
      </span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { wobblyRadius, shadows } from "~/utils/design-tokens";
import {
  clearGiscusSession,
  finalizeGiscusOAuthHandoff,
  getGiscusDiscussionTerm,
  hasOAuthCallback,
  primeGiscusSessionForOAuth,
} from "~/utils/giscus-oauth";

const GISCUS_ORIGIN = "https://giscus.app";
const commentsContainer = ref<HTMLElement | null>(null);
const commentsLoaded = ref(false);
const widgetReady = ref(false);
let widgetObserver: MutationObserver | null = null;
let frameResizeObserver: ResizeObserver | null = null;
let loadGeneration = 0;

const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();
const repo = config.public.giscusRepo || "";
const repoId = config.public.giscusRepoId || "";
const category = config.public.giscusCategory || "Announcements";
const categoryId = config.public.giscusCategoryId || "";
const rawTheme = config.public.giscusTheme || "";
const theme = rawTheme && rawTheme !== "preferred_color_scheme" ? rawTheme : "light";
const hasGiscusConfig = computed(() => !!repo && !!repoId && !!categoryId);
const showConfigHint = computed(() => import.meta.dev && !hasGiscusConfig.value);
const loadError = ref(false);
const showSkeleton = computed(() => hasGiscusConfig.value && !widgetReady.value && !loadError.value);
let loadTimeoutId: ReturnType<typeof setTimeout> | null = null;

function discussionTerm() {
  return getGiscusDiscussionTerm(route.path);
}

function giscusScriptUrl() {
  return `${GISCUS_ORIGIN}/client.js`;
}

function getGiscusFrame() {
  return commentsContainer.value?.querySelector<HTMLIFrameElement>(".giscus-frame") ?? null;
}

function postToGiscus(message: Record<string, unknown>) {
  const frame = getGiscusFrame();
  frame?.contentWindow?.postMessage({ giscus: message }, GISCUS_ORIGIN);
}

function teardownGiscus() {
  if (!commentsContainer.value) return;
  commentsContainer.value.querySelectorAll('script[src*="giscus"]').forEach((el) => el.remove());
  commentsContainer.value.querySelector(".giscus")?.remove();
}

function clearLoadTimeout() {
  if (loadTimeoutId) {
    clearTimeout(loadTimeoutId);
    loadTimeoutId = null;
  }
}

function loadComments(force = false) {
  if (!commentsContainer.value || !hasGiscusConfig.value) return;
  if (commentsLoaded.value && !force) return;

  const gen = ++loadGeneration;
  loadError.value = false;
  widgetReady.value = false;
  clearLoadTimeout();
  teardownGiscus();

  if (hasOAuthCallback()) {
    primeGiscusSessionForOAuth();
  }

  const script = document.createElement("script");
  script.src = giscusScriptUrl();
  // OAuth 回跳时同步执行 client.js，避免 async 间隙内路由清掉 ?giscus=
  script.async = !hasOAuthCallback();
  script.crossOrigin = "anonymous";
  script.onerror = () => {
    if (gen !== loadGeneration) return;
    loadError.value = true;
    widgetReady.value = true;
    clearLoadTimeout();
  };
  script.onload = () => {
    if (gen !== loadGeneration) return;
    if (!hasOAuthCallback()) {
      finalizeGiscusOAuthHandoff();
    }
    detectWidgetReady();
  };
  script.setAttribute("data-repo", repo);
  script.setAttribute("data-repo-id", repoId);
  script.setAttribute("data-category", category);
  script.setAttribute("data-category-id", categoryId);
  script.setAttribute("data-mapping", "specific");
  script.setAttribute("data-term", discussionTerm());
  script.setAttribute("data-strict", "0");
  script.setAttribute("data-reactions-enabled", "1");
  script.setAttribute("data-emit-metadata", "0");
  script.setAttribute("data-input-position", "bottom");
  script.setAttribute("data-theme", theme);
  script.setAttribute("data-lang", "zh-CN");
  script.setAttribute("data-loading", "eager");

  commentsContainer.value.appendChild(script);
  commentsLoaded.value = true;

  loadTimeoutId = setTimeout(() => {
    if (gen !== loadGeneration) return;
    if (!getGiscusFrame()) {
      loadError.value = true;
    }
    widgetReady.value = true;
  }, 20000);
}

function retryLoad() {
  commentsLoaded.value = false;
  loadComments(true);
}

function markReadyWhenFrameVisible(frame: HTMLIFrameElement) {
  if (frame.getBoundingClientRect().height >= 80) widgetReady.value = true;
}

function bindFrameObservers(frame: HTMLIFrameElement) {
  frame.addEventListener("load", () => requestAnimationFrame(() => markReadyWhenFrameVisible(frame)));
  if (frameResizeObserver) frameResizeObserver.disconnect();
  frameResizeObserver = new ResizeObserver(() => markReadyWhenFrameVisible(frame));
  frameResizeObserver.observe(frame);
}

function detectWidgetReady() {
  if (!commentsContainer.value) return;
  const frame = getGiscusFrame();
  if (!frame) return;
  if (frame.dataset.readyBound !== "1") {
    frame.dataset.readyBound = "1";
    bindFrameObservers(frame);
  }
  markReadyWhenFrameVisible(frame);
}

function isAuthError(msg: string) {
  return msg.includes("Invalid state")
    || msg.includes("State has expired")
    || msg.includes("Bad credentials");
}

function onGiscusMessage(event: MessageEvent) {
  if (event.origin !== GISCUS_ORIGIN) return;
  const payload = event.data?.giscus;
  if (!payload) return;

  if (payload.resizeMessage) {
    loadError.value = false;
    detectWidgetReady();
  }

  if (payload.signedIn === true) {
    finalizeGiscusOAuthHandoff();
    detectWidgetReady();
  } else if (payload.error) {
    const msg = String(payload.error);
    if (isAuthError(msg)) {
      clearGiscusSession();
      commentsLoaded.value = false;
      loadComments(true);
    }
    detectWidgetReady();
  } else if (payload.discussionReady) {
    detectWidgetReady();
  }
}

onMounted(async () => {
  if (!commentsContainer.value || !hasGiscusConfig.value) return;

  window.addEventListener("message", onGiscusMessage);
  widgetObserver = new MutationObserver(detectWidgetReady);
  widgetObserver.observe(commentsContainer.value, { childList: true, subtree: true });

  await router.isReady();
  if (hasOAuthCallback()) {
    primeGiscusSessionForOAuth();
  }
  loadComments();
  detectWidgetReady();
});

watch(
  () => route.path,
  () => {
    if (!commentsLoaded.value) return;
    postToGiscus({
      setConfig: {
        term: discussionTerm(),
      },
    });
    detectWidgetReady();
  },
);

onUnmounted(() => {
  clearLoadTimeout();
  window.removeEventListener("message", onGiscusMessage);
  widgetObserver?.disconnect();
  frameResizeObserver?.disconnect();
});
</script>

<style scoped>
.skeleton-fade-enter-active,
.skeleton-fade-leave-active { transition: opacity 0.28s ease; }
.skeleton-fade-enter-from,
.skeleton-fade-leave-to { opacity: 0; }
</style>
