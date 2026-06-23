<template>
  <header class="hand-container px-6 pt-6 pb-4">
    <div class="flex items-center justify-between">
      <!-- Logo -->
      <NuxtLink to="/" class="group flex items-center gap-3 transition-transform duration-100 hover:-rotate-1">
        <div
          class="w-10 h-10 flex items-center justify-center bg-postit border-[3px] border-pencil shadow-hand"
          :style="{ borderRadius: wobblyRadius.sm }"
        >
          <span class="font-heading font-bold text-xl text-pencil">涂</span>
        </div>
        <div class="flex flex-col">
          <span class="font-heading text-xl md:text-2xl font-bold text-pencil leading-tight">
            {{ site.name }}
          </span>
          <span class="font-body text-sm text-pencil/50 hidden sm:block">{{ site.tagline }}</span>
        </div>
      </NuxtLink>

      <!-- Desktop nav -->
      <nav class="hidden md:flex items-center gap-1" aria-label="主导航">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="relative px-4 py-2 font-body text-lg transition-all duration-100"
          :class="isActive(item.to) ? 'font-bold hand-wavy-underline' : 'text-pencil/60 hover:text-pencil hover:-rotate-1'"
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- Mobile menu -->
      <button
        type="button"
        class="md:hidden w-11 h-11 flex flex-col items-center justify-center gap-1.5 border-[3px] border-pencil bg-white shadow-hand transition-all duration-100 active:shadow-none active:translate-x-0.5 active:translate-y-0.5"
        :style="{ borderRadius: wobblyRadius.sm }"
        :aria-expanded="mobileOpen"
        aria-label="切换菜单"
        @click="mobileOpen = !mobileOpen"
      >
        <span class="w-5 h-0.5 bg-pencil transition-all" :class="mobileOpen ? 'rotate-45 translate-y-2' : ''" />
        <span class="w-5 h-0.5 bg-pencil transition-all" :class="mobileOpen ? 'opacity-0' : ''" />
        <span class="w-5 h-0.5 bg-pencil transition-all" :class="mobileOpen ? '-rotate-45 -translate-y-2' : ''" />
      </button>
    </div>

    <!-- Mobile nav panel -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <nav
        v-if="mobileOpen"
        class="md:hidden mt-4"
        aria-label="移动端导航"
      >
        <HandCard decoration="tape" padding="p-3" :hover-lift="false">
          <div class="flex flex-col gap-1">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="px-4 py-3 font-body text-lg rounded transition-colors"
              :class="isActive(item.to) ? 'bg-postit font-bold' : 'hover:bg-erased'"
              :aria-current="isActive(item.to) ? 'page' : undefined"
              @click="mobileOpen = false"
            >
              {{ item.label }}
            </NuxtLink>
          </div>
        </HandCard>
      </nav>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { site, wobblyRadius } from "~/utils/design-tokens";

const route = useRoute();
const mobileOpen = ref(false);

const navItems = [
  { to: "/", label: "首页" },
  { to: "/blog", label: "随笔" },
  { to: "/ai-fiction", label: "幻想" },
  { to: "/snapshots", label: "快照" },
];

function isActive(to: string) {
  if (to === "/") return route.path === "/";
  return route.path.startsWith(to);
}

watch(() => route.path, () => {
  mobileOpen.value = false;
});
</script>
