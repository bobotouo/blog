<template>
  <span
    class="inline-flex items-center gap-1.5 px-3 py-1 border-2 border-pencil font-body text-sm text-pencil"
    :class="variantClass"
    :style="tagStyle"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
import { wobblyRadius, colors } from "~/utils/design-tokens";

const props = withDefaults(
  defineProps<{
    variant?: "default" | "postit" | "muted";
  }>(),
  { variant: "default" },
);

const tagStyle = computed(() => ({
  borderRadius: wobblyRadius.sm,
}));

const variantClass = computed(() => {
  if (props.variant === "postit") return "bg-postit";
  if (props.variant === "muted") return "bg-erased text-pencil/70";
  return "bg-white";
});
</script>
