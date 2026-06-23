<template>
  <div class="flex items-center gap-3 sm:gap-4 mb-6">
    <span class="flex-1 hand-dashed-divider min-w-4" aria-hidden="true" />
    <component
      :is="tag"
      class="shrink-0 font-heading text-lg md:text-xl font-bold text-pencil whitespace-nowrap"
    >
      <slot />
    </component>
    <span class="flex-1 hand-dashed-divider min-w-4" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    tag?: string;
  }>(),
  { tag: "h2" },
);
</script>
