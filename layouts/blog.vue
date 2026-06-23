<template>
  <div class="relative min-h-screen">
    <AppHeader />
    <div class="relative z-10">
      <slot />
    </div>

    <!-- footer -->
    <footer class="hand-container px-6 py-10 mt-8">
      <div class="hand-dashed-divider pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="font-body text-pencil/50">
          © {{ year }} {{ site.name }} · 纸上留痕
        </p>
        <div class="flex items-center gap-6 font-body text-pencil/50">
          <NuxtLink to="/blog" class="hover:text-marker hover:line-through transition-colors">随笔</NuxtLink>
          <NuxtLink to="/ai-fiction" class="hover:text-pen hover:line-through transition-colors">幻想</NuxtLink>
          <NuxtLink to="/snapshots" class="hover:text-pencil hover:line-through transition-colors">快照</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { site } from "~/utils/design-tokens";

const year = new Date().getFullYear();
</script>
