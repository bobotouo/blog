<template>
  <component
    :is="componentTag"
    :to="to"
    :type="isButton ? type : undefined"
    :disabled="disabled"
    class="hand-btn inline-flex items-center justify-center gap-2 min-h-12 px-6 py-2.5 font-body text-lg md:text-xl border-[3px] border-pencil text-pencil transition-all duration-100 select-none"
    :class="[variantClass, { 'opacity-50 pointer-events-none': disabled }]"
    :style="btnStyle"
    v-bind="linkAttrs"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { wobblyRadius, shadows } from "~/utils/design-tokens";

const props = withDefaults(
  defineProps<{
    to?: string;
    type?: "button" | "submit" | "reset";
    variant?: "primary" | "secondary";
    disabled?: boolean;
  }>(),
  {
    type: "button",
    variant: "primary",
    disabled: false,
  },
);

const isLink = computed(() => !!props.to);
const isButton = computed(() => !isLink.value);
const componentTag = computed(() => (isLink.value ? "NuxtLink" : "button"));
const linkAttrs = computed(() => (isLink.value ? { to: props.to } : {}));

const btnStyle = computed(() => ({
  borderRadius: wobblyRadius.pill,
  boxShadow: shadows.standard,
}));

const variantClass = computed(() =>
  props.variant === "secondary"
    ? "bg-erased hover:bg-pen hover:text-white hover:shadow-hand-hover hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-1 active:translate-y-1"
    : "bg-white hover:bg-marker hover:text-white hover:shadow-hand-hover hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-1 active:translate-y-1",
);
</script>
