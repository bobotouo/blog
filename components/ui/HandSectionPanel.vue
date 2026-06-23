<template>
  <div class="hand-section-panel relative mt-4" :style="panelWrapStyle">
    <!-- 顶标：嵌在边框正中，便签黄底 -->
    <div
      class="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-postit border-[3px] border-pencil font-heading text-base md:text-lg font-bold italic text-pencil whitespace-nowrap shadow-hand-subtle"
      :style="{ borderRadius: wobblyRadius.sm }"
    >
      {{ label }}
    </div>

    <div
      class="border-4 border-pencil bg-white px-5 pb-6 pt-10 md:px-6 md:pb-8 md:pt-11"
      :style="boxStyle"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { wobblyRadius, shadows } from "~/utils/design-tokens";

const props = withDefaults(
  defineProps<{
    label: string;
    rotate?: string;
  }>(),
  { rotate: "" },
);

const panelWrapStyle = computed(() =>
  props.rotate ? { transform: `rotate(${props.rotate})` } : undefined,
);

const boxStyle = computed(() => ({
  borderRadius: wobblyRadius.md,
  boxShadow: shadows.subtle,
}));
</script>
