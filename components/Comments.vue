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

    <giscus-widget
      v-if="useWidget && widgetVisible"
      :key="widgetKey"
      class="giscus-widget-host block w-full"
      :host="giscusHost"
      :repo="repo"
      :repoid="repoId"
      :category="category"
      :categoryid="categoryId"
      mapping="specific"
      :term="discussionTerm"
      strict="0"
      reactionsenabled="1"
      emitmetadata="0"
      inputposition="bottom"
      :theme="theme"
      lang="zh-CN"
      loading="eager"
    />

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
import {
  GISCUS_HOST,
  giscusClientScriptUrls,
  loadGiscusWidget,
} from "~/utils/giscus-loader";

const commentsContainer = ref<HTMLElement | null>(null);
const useWidget = ref(true);
const widgetVisible = ref(false);
const widgetKey = ref(0);
const widgetReady = ref(false);
let frameResizeObserver: ResizeObserver | null = null;
let loadGeneration = 0;

const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();
const basePath = ((config.public.baseUrl as string) || "/").replace(/\/$/, "");
const giscusHost = (config.public.giscusHost as string) || GISCUS_HOST;
const giscusModuleUrl = (config.public.giscusModuleUrl as string) || "";
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
const discussionTerm = computed(() => getGiscusDiscussionTerm(route.path));
let loadTimeoutId: ReturnType<typeof setTimeout> | null = null;

function getGiscusFrame() {
  const root = commentsContainer.value;
  if (!root) return null;
  const widget = root.querySelector("giscus-widget");
  const shadowFrame = widget?.shadowRoot?.querySelector("iframe");
  if (shadowFrame) return shadowFrame;
  return (
    root.querySelector<HTMLIFrameElement>(".giscus-frame")
    ?? root.querySelector<HTMLIFrameElement>('iframe[title="Comments"]')
  );
}

function teardownGiscus() {
  if (!commentsContainer.value) return;
  commentsContainer.value.querySelectorAll('script[src*="giscus"]').forEach((el) => el.remove());
  commentsContainer.value.querySelector(".giscus")?.remove();
  commentsContainer.value.querySelector("giscus-widget")?.remove();
  widgetVisible.value = false;
}

function clearLoadTimeout() {
  if (loadTimeoutId) {
    clearTimeout(loadTimeoutId);
    loadTimeoutId = null;
  }
}

function markReadyWhenFrameVisible(frame: HTMLIFrameElement) {
  if (frame.getBoundingClientRect().height >= 80) widgetReady.value = true;
}

function bindFrameObservers(frame: HTMLIFrameElement) {
  frame.addEventListener("load", () => requestAnimationFrame(() => markReadyWhenFrameVisible(frame)));
  frameResizeObserver?.disconnect();
  frameResizeObserver = new ResizeObserver(() => markReadyWhenFrameVisible(frame));
  frameResizeObserver.observe(frame);
}

function detectWidgetReady() {
  const frame = getGiscusFrame();
  if (!frame) return;
  if (frame.dataset.readyBound !== "1") {
    frame.dataset.readyBound = "1";
    bindFrameObservers(frame);
  }
  markReadyWhenFrameVisible(frame);
}

function armLoadTimeout(gen: number) {
  loadTimeoutId = setTimeout(() => {
    if (gen !== loadGeneration) return;
    if (!getGiscusFrame()) loadError.value = true;
    widgetReady.value = true;
  }, 20000);
}

function loadCommentsViaScript(gen: number) {
  if (!commentsContainer.value) return;

  const urls = giscusClientScriptUrls(basePath);
  let index = 0;

  const tryNext = () => {
    if (gen !== loadGeneration || index >= urls.length) {
      if (gen === loadGeneration) {
        loadError.value = true;
        widgetReady.value = true;
      }
      return;
    }

    const script = document.createElement("script");
    script.src = urls[index]!;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onerror = () => {
      index += 1;
      script.remove();
      tryNext();
    };
    script.onload = () => {
      if (gen !== loadGeneration) return;
      finalizeGiscusOAuthHandoff();
      detectWidgetReady();
    };
    script.setAttribute("data-repo", repo);
    script.setAttribute("data-repo-id", repoId);
    script.setAttribute("data-category", category);
    script.setAttribute("data-category-id", categoryId);
    script.setAttribute("data-mapping", "specific");
    script.setAttribute("data-term", discussionTerm.value);
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", theme);
    script.setAttribute("data-lang", "zh-CN");
    script.setAttribute("data-loading", "eager");
    commentsContainer.value!.appendChild(script);
    armLoadTimeout(gen);
  };

  tryNext();
}

async function loadComments(force = false) {
  if (!commentsContainer.value || !hasGiscusConfig.value) return;

  const gen = ++loadGeneration;
  loadError.value = false;
  widgetReady.value = false;
  clearLoadTimeout();
  teardownGiscus();

  if (hasOAuthCallback()) {
    primeGiscusSessionForOAuth();
  }

  useWidget.value = true;
  try {
    await loadGiscusWidget({ moduleUrl: giscusModuleUrl || undefined, basePath });
    if (gen !== loadGeneration) return;
    widgetVisible.value = true;
    widgetKey.value += 1;
    finalizeGiscusOAuthHandoff();
    await nextTick();
    detectWidgetReady();
    armLoadTimeout(gen);
    return;
  } catch {
  }

  if (gen !== loadGeneration) return;
  useWidget.value = false;
  loadCommentsViaScript(gen);
}

function retryLoad() {
  loadComments(true);
}

function isAuthError(msg: string) {
  return msg.includes("Invalid state")
    || msg.includes("State has expired")
    || msg.includes("Bad credentials");
}

function onGiscusMessage(event: MessageEvent) {
  if (event.origin !== giscusHost) return;
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
  await router.isReady();
  if (hasOAuthCallback()) {
    primeGiscusSessionForOAuth();
  }
  await loadComments();
});

watch(
  () => discussionTerm.value,
  () => {
    if (!widgetVisible.value || !useWidget.value) return;
    widgetKey.value += 1;
    nextTick(() => detectWidgetReady());
  },
);

onUnmounted(() => {
  clearLoadTimeout();
  window.removeEventListener("message", onGiscusMessage);
  frameResizeObserver?.disconnect();
});
</script>

<style scoped>
.skeleton-fade-enter-active,
.skeleton-fade-leave-active { transition: opacity 0.28s ease; }
.skeleton-fade-enter-from,
.skeleton-fade-leave-to { opacity: 0; }

.giscus-widget-host :deep(iframe) {
  width: 100%;
  min-height: 150px;
}
</style>
