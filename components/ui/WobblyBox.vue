<template>
  <component
    :is="tag"
    class="wobbly-box"
    :class="[$attrs.class, paddingClass]"
    :style="boxStyle"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { wobblyRadius, shadows, type WobblySize } from "~/utils/design-tokens";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    tag?: string;
    radius?: WobblySize | "pill";
    shadow?: keyof typeof shadows | "none";
    rotate?: string;
    padding?: boolean;
  }>(),
  {
    tag: "div",
    radius: "md",
    shadow: "none",
    rotate: "",
    padding: false,
  },
);

const paddingClass = computed(() => (props.padding ? "p-6" : ""));

const boxStyle = computed(() => ({
  borderRadius: wobblyRadius[props.radius],
  boxShadow: props.shadow === "none" ? undefined : shadows[props.shadow],
  transform: props.rotate ? `rotate(${props.rotate})` : undefined,
}));
</script>
