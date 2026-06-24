<template>
  <div
    class="hand-card relative bg-white border-2 border-pencil transition-transform duration-100"
    :class="[
      hoverLift && 'hover:-rotate-1 hover:shadow-hand cursor-default',
      paddingClass,
    ]"
    :style="cardStyle"
  >
    <!-- tape decoration -->
    <div
      v-if="decoration === 'tape'"
      class="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-pencil/15 border border-pencil/20 -rotate-2 z-10"
      aria-hidden="true"
    />
    <!-- thumbtack decoration -->
    <div
      v-if="decoration === 'tack'"
      class="hand-card-tack absolute left-1/2 z-10 -translate-x-1/2"
      :class="insetTack ? 'top-2' : '-top-2.5'"
      aria-hidden="true"
    >
      <div class="relative h-5 w-5 rounded-full border-2 border-pencil bg-marker shadow-[2px_2px_0_#2d2d2d]">
        <div class="absolute left-1 top-0.5 h-1.5 w-1.5 rounded-full bg-white/70" />
      </div>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { wobblyRadius, shadows, colors, type HandCardDecoration } from "~/utils/design-tokens";

const props = withDefaults(
  defineProps<{
    decoration?: HandCardDecoration;
    radius?: keyof typeof wobblyRadius;
    hoverLift?: boolean;
    padding?: string;
    rotate?: string;
    /** 面板内嵌时使用，去掉额外阴影 */
    flat?: boolean;
    /** 图钉画在卡片内侧，避免瀑布流/裁切露出半截 */
    insetTack?: boolean;
  }>(),
  {
    decoration: "none",
    radius: "md",
    hoverLift: true,
    padding: "p-6",
    rotate: "",
    flat: false,
    insetTack: false,
  },
);

const paddingClass = computed(() => props.padding);

const cardStyle = computed(() => ({
  borderRadius: wobblyRadius[props.radius],
  boxShadow: props.flat ? undefined : shadows.subtle,
  backgroundColor: props.decoration === "postit" ? colors.postIt : colors.white,
  transform: props.rotate ? `rotate(${props.rotate})` : undefined,
}));
</script>
