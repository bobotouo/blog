<template>
  <NuxtLink to="/snapshots" class="group block w-full">
    <Transition name="skeleton-fade">
      <div v-if="loading" class="space-y-3">
        <div class="aspect-[4/3] w-full bg-erased animate-pulse" :style="{ borderRadius: wobblyRadius.sm }" />
        <div class="h-4 max-w-[75%] bg-erased animate-pulse rounded" />
        <div class="h-8 max-w-[40%] bg-erased animate-pulse rounded ml-auto" />
      </div>
    </Transition>

    <template v-if="!loading">
      <!-- 图片轮播 -->
      <div
        class="relative aspect-[4/3] w-full overflow-hidden bg-erased"
        :style="{ borderRadius: wobblyRadius.sm }"
      >
        <template v-for="(item, idx) in normalizedSnapshots" :key="item.key">
          <img
            v-if="item.coverImage"
            :src="item.coverImage"
            :alt="item.title"
            :loading="idx === 0 ? 'eager' : 'lazy'"
            decoding="async"
            class="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
            :class="idx === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'"
          />
          <div
            v-else
            class="absolute inset-0 flex items-center justify-center px-5 py-6 text-center bg-postit transition-opacity duration-300"
            :class="idx === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'"
          >
            <p class="font-body text-lg text-pencil/80 leading-relaxed">
              {{ item.summary || item.title }}
            </p>
          </div>
        </template>

        <div
          v-if="hasMultiple"
          class="absolute left-3 bottom-3 z-10 flex items-center gap-1.5"
          aria-hidden="true"
        >
          <span
            v-for="item in normalizedSnapshots"
            :key="`${item.key}-dot`"
            class="h-2 border-2 border-pencil shadow-[1px_1px_0_#2d2d2d] transition-all duration-300"
            :class="item.key === activeSnapshot.key ? 'w-5 bg-marker' : 'w-2 bg-white/90'"
            :style="{ borderRadius: wobblyRadius.sm }"
          />
        </div>
      </div>

      <!-- 底部文字 + 按钮 -->
      <div class="mt-4 flex items-end justify-between gap-4">
        <div class="min-w-0 flex-1">
          <p class="font-heading text-lg font-bold text-pencil line-clamp-1">
            {{ activeSnapshot.title }}
          </p>
          <p
            v-if="activeSnapshot.summary && activeSnapshot.coverImage"
            class="mt-1 font-body text-sm text-pencil/60 line-clamp-2"
          >
            {{ activeSnapshot.summary }}
          </p>
        </div>

        <span
          class="shrink-0 font-body text-sm font-bold text-pencil bg-white border-2 border-pencil px-3 py-1.5 shadow-hand group-hover:bg-marker group-hover:text-white transition-colors duration-100"
          :style="{ borderRadius: wobblyRadius.sm }"
        >
          进入快照 →
        </span>
      </div>
    </template>
  </NuxtLink>
</template>

<script setup lang="ts">
import { wobblyRadius } from "~/utils/design-tokens";

type SnapshotItem = {
  key: string;
  title: string;
  summary?: string;
  coverImage?: string;
};

const props = defineProps<{
  loading?: boolean;
  title?: string;
  summary?: string;
  coverImage?: string;
  snapshots?: Array<{ title?: string; summary?: string; images?: string[] }>;
}>();

const normalizedSnapshots = computed<SnapshotItem[]>(() => {
  const list = Array.isArray(props.snapshots) ? props.snapshots : [];
  if (list.length > 0) {
    return list.map((item, index) => ({
      key: `snapshot-${index}`,
      title: item.title || "日常快照",
      summary: item.summary,
      coverImage: item.images?.[0],
    }));
  }
  return [{
    key: "fallback",
    title: props.title || "日常快照",
    summary: props.summary,
    coverImage: props.coverImage,
  }];
});

const hasMultiple = computed(() => normalizedSnapshots.value.length > 1);
const currentIndex = ref(0);

const activeSnapshot = computed(
  () => normalizedSnapshots.value[currentIndex.value] || normalizedSnapshots.value[0],
);

let switchTimer: ReturnType<typeof setInterval> | null = null;

const clearSwitchTimer = () => {
  if (switchTimer) { clearInterval(switchTimer); switchTimer = null; }
};
const startSwitchTimer = () => {
  clearSwitchTimer();
  if (!hasMultiple.value) return;
  switchTimer = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % normalizedSnapshots.value.length;
  }, 3400);
};

onMounted(() => startSwitchTimer());
onUnmounted(() => clearSwitchTimer());
watch(() => normalizedSnapshots.value.length, () => {
  currentIndex.value = 0;
  startSwitchTimer();
});
</script>

<style scoped>
.skeleton-fade-enter-active,
.skeleton-fade-leave-active { transition: opacity 0.28s ease; }
.skeleton-fade-enter-from,
.skeleton-fade-leave-to { opacity: 0; }
</style>
