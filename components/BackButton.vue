<template>
  <HandButton variant="secondary" type="button" class="!min-h-10 !px-4 !py-2 !text-base" @click="goBack">
    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
    <span>{{ label }}</span>
  </HandButton>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label?: string;
    fallbackTo?: string;
  }>(),
  {
    label: "返回",
    fallbackTo: "/",
  },
);

const router = useRouter();

function goBack() {
  if (import.meta.client && window.history.length > 1) {
    router.back();
  } else {
    navigateTo(props.fallbackTo);
  }
}
</script>
