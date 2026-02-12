<template>
  <NuxtLink
    to="/snapshots"
    class="group block w-full max-w-sm mx-auto md:mx-0 md:max-w-none"
  >
    <div
      ref="cardRef"
      class="snapshot-card liquid-glass relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/[0.07] shadow-[0_16px_42px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.32)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_24px_56px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.42)]"
      :style="cardTransformStyle"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
    >
      <div class="absolute inset-0 bg-[linear-gradient(150deg,rgba(133,201,255,0.14),rgba(75,108,255,0.03)_36%,rgba(2,12,28,0.22))]" aria-hidden />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(255,255,255,0.38),transparent_30%),radial-gradient(circle_at_92%_88%,rgba(88,212,255,0.22),transparent_38%)]" aria-hidden />

      <div
        class="snapshot-stage relative overflow-hidden transition-[height] duration-300 ease-out"
        :style="stageStyle"
      >
        <Transition
          name="snapshot-switch"
          mode="out-in"
          @before-leave="lockStageHeight"
          @after-enter="syncStageHeight"
        >
          <article
            :key="activeSnapshot.key"
            ref="activeSlideRef"
            class="relative p-1.5 pb-14"
          >
            <div
              v-if="activeSnapshot.coverImage"
              class="aspect-[4/3] w-full overflow-hidden rounded-[1.5rem] bg-slate-900/35"
            >
              <img
                :src="activeSnapshot.coverImage"
                :alt="activeSnapshot.title"
                class="h-full w-full object-cover"
                @load="syncStageHeight"
              />
            </div>
            <div
              v-else
              class="snapshot-text-shell aspect-[4/3] w-full px-5 py-6 flex items-center justify-center text-center"
            >
              <p class="snapshot-text-animate text-base md:text-lg font-medium leading-relaxed text-white/90">
                {{ activeSnapshot.summary || activeSnapshot.title }}
              </p>
            </div>

            <div class="mt-3 px-3 pr-28">
              <p class="text-[1.06rem] font-semibold text-white/95 line-clamp-1">
                {{ activeSnapshot.title }}
              </p>
              <p
                v-if="activeSnapshot.summary && activeSnapshot.coverImage"
                class="mt-1 text-sm text-white/80 line-clamp-2"
              >
                {{ activeSnapshot.summary }}
              </p>
            </div>
          </article>
        </Transition>
      </div>

      <div
        v-if="hasMultiple"
        class="absolute left-4 bottom-4 flex items-center gap-1.5"
        aria-hidden="true"
      >
        <span
          v-for="item in normalizedSnapshots"
          :key="`${item.key}-dot`"
          class="h-1.5 rounded-full bg-white/35 transition-all duration-300"
          :class="item.key === activeSnapshot.key ? 'w-5 bg-white/85' : 'w-1.5'"
        />
      </div>

      <span class="snapshot-cta absolute right-3 bottom-3 inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-semibold tracking-[0.02em] text-cyan-50/85 shadow-[0_6px_16px_rgba(0,124,179,0.28)]">
        进入快照 →
      </span>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";

type SnapshotItem = {
  key: string;
  title: string;
  summary?: string;
  coverImage?: string;
};

const props = defineProps<{
  title?: string;
  summary?: string;
  coverImage?: string;
  snapshots?: Array<{
    title?: string;
    summary?: string;
    images?: string[];
  }>;
}>();

const normalizedSnapshots = computed<SnapshotItem[]>(() => {
  const list = Array.isArray(props.snapshots) ? props.snapshots : [];
  if (list.length > 0) {
    return list.map((item, index) => ({
      key: `snapshot-${index}`,
      title: item.title || "日常快照",
      summary: item.summary,
      coverImage: item.images?.[0]
    }));
  }
  return [
    {
      key: "fallback",
      title: props.title || "日常快照",
      summary: props.summary,
      coverImage: props.coverImage
    }
  ];
});

const hasMultiple = computed(() => normalizedSnapshots.value.length > 1);
const currentIndex = ref(0);
const cardRef = ref<HTMLElement | null>(null);
const activeSlideRef = ref<HTMLElement | null>(null);
const stageHeight = ref<number | null>(null);
const tiltX = ref(0);
const tiltY = ref(0);
const activeSnapshot = computed(
  () => normalizedSnapshots.value[currentIndex.value] || normalizedSnapshots.value[0]
);
const cardTransformStyle = computed(() => ({
  transform: `perspective(680px) rotateX(${tiltX.value}deg) rotateY(${tiltY.value}deg) rotateZ(4.6deg)`
}));
const stageStyle = computed(() =>
  stageHeight.value ? { height: `${stageHeight.value}px` } : {}
);

let switchTimer: ReturnType<typeof setInterval> | null = null;

const clearSwitchTimer = (): void => {
  if (!switchTimer) return;
  clearInterval(switchTimer);
  switchTimer = null;
};

const startSwitchTimer = (): void => {
  clearSwitchTimer();
  if (!hasMultiple.value) return;
  switchTimer = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % normalizedSnapshots.value.length;
  }, 3400);
};

const onMouseMove = (event: MouseEvent): void => {
  if (!cardRef.value) return;
  const rect = cardRef.value.getBoundingClientRect();
  const px = (event.clientX - rect.left) / rect.width;
  const py = (event.clientY - rect.top) / rect.height;
  tiltY.value = (px - 0.5) * 22;
  tiltX.value = (0.5 - py) * 20;
};

const onMouseLeave = (): void => {
  tiltX.value = 0;
  tiltY.value = 0;
};

const lockStageHeight = (el: Element): void => {
  stageHeight.value = (el as HTMLElement).offsetHeight;
};

const syncStageHeight = (): void => {
  if (!activeSlideRef.value) return;
  stageHeight.value = activeSlideRef.value.offsetHeight;
};

onMounted(() => {
  startSwitchTimer();
  nextTick(() => {
    syncStageHeight();
  });
});

onUnmounted(() => {
  clearSwitchTimer();
});

watch(
  () => normalizedSnapshots.value.length,
  () => {
    currentIndex.value = 0;
    startSwitchTimer();
    nextTick(() => {
      syncStageHeight();
    });
  }
);

watch(
  () => activeSnapshot.value.key,
  () => {
    nextTick(() => {
      syncStageHeight();
    });
  }
);
</script>

<style scoped>
.snapshot-card {
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  transform-style: preserve-3d;
  will-change: transform;
  transition: transform 220ms ease, box-shadow 260ms ease;
}

.liquid-glass::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.02) 28%, rgba(255, 255, 255, 0.08) 62%, rgba(255, 255, 255, 0.24));
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: xor;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  padding: 1.2px;
}

.snapshot-text-shell {
  background:
    radial-gradient(circle at 20% 18%, rgba(123, 208, 255, 0.28), transparent 42%),
    linear-gradient(155deg, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0.03));
}

.snapshot-cta {
  background: linear-gradient(140deg, rgba(28, 92, 128, 0.48), rgba(3, 18, 33, 0.7));
  border: 1px solid rgba(144, 219, 245, 0.45);
  text-shadow: 0 0 8px rgba(139, 227, 255, 0.25);
}

.snapshot-text-animate {
  animation: text-float 3s ease-in-out infinite, text-glow 2.7s ease-in-out infinite;
}

.snapshot-switch-enter-active,
.snapshot-switch-leave-active {
  transition: all 0.42s ease;
}

.snapshot-switch-enter-from {
  opacity: 0;
  transform: translateX(14px) scale(0.98);
}

.snapshot-switch-leave-to {
  opacity: 0;
  transform: translateX(-14px) scale(0.98);
}

@keyframes text-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

@keyframes text-glow {
  0%,
  100% {
    text-shadow: 0 0 0 rgba(255, 255, 255, 0.06);
  }
  50% {
    text-shadow: 0 6px 20px rgba(255, 255, 255, 0.24);
  }
}
</style>
