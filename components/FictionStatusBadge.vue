<template>
  <div v-if="labels.length > 0" class="inline-flex max-w-full flex-wrap items-center gap-1.5">
    <span
      v-for="label in labels"
      :key="label"
      class="inline-flex max-w-full shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide shadow-sm truncate"
      :class="fictionStatusBadgeClass()"
      :title="label"
    >
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { fictionStatusBadgeClass, splitFictionStatus } from "~/utils/fiction-status";

const props = defineProps<{
  status?: string;
}>();

const labels = computed(() => splitFictionStatus(props.status));
</script>
