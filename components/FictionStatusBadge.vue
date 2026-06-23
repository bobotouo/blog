<template>
  <div v-if="labels.length > 0" class="inline-flex max-w-full flex-wrap items-center gap-1.5">
    <span
      v-for="label in labels"
      :key="label"
      class="inline-flex max-w-full shrink-0 items-center border-2 border-pencil px-2.5 py-0.5 font-body text-[11px] truncate"
      :class="fictionStatusBadgeClass()"
      :style="{ borderRadius: wobblyRadius.sm }"
      :title="label"
    >
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { wobblyRadius } from "~/utils/design-tokens";
import { fictionStatusBadgeClass, splitFictionStatus } from "~/utils/fiction-status";

const props = defineProps<{
  status?: string;
}>();

const labels = computed(() => splitFictionStatus(props.status));
</script>
