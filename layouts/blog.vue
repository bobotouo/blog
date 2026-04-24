<template>
  <div
    class="relative min-h-screen overflow-hidden"
    :style="`background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(56, 189, 248, 0.08), transparent 50%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(245, 158, 11, 0.04), transparent 50%), #05080c`"
  >
    <!-- 背景网格 -->
    <div class="absolute inset-0 bg-grid opacity-[0.2]" aria-hidden />

    <!-- 装饰性光晕 -->
    <div class="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" aria-hidden />
    <div class="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-amber-500/5 rounded-full blur-3xl" aria-hidden />

    <div class="relative z-10">
      <header class="max-w-6xl mx-auto px-6 pt-6 pb-6">
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <NuxtLink
            to="/"
            class="group flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <span class="text-white font-bold text-sm">N</span>
            </div>
            <span class="text-lg tracking-[0.15em] uppercase text-white/90 font-semibold">
              ova Blog
            </span>
          </NuxtLink>

          <!-- Desktop Navigation -->
          <nav class="hidden md:flex items-center gap-1" aria-label="主导航">
            <NuxtLink
              to="/"
              class="relative px-4 py-2 text-sm transition-all duration-300 rounded-lg"
              :class="$route.path === '/' ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/5'"
              :aria-current="$route.path === '/' ? 'page' : undefined"
            >
              <span v-if="$route.path === '/'" class="absolute inset-0 rounded-lg bg-white/10"></span>
              <span class="relative z-10">首页</span>
            </NuxtLink>
            <NuxtLink
              to="/blog"
              class="relative px-4 py-2 text-sm transition-all duration-300 rounded-lg"
              :class="$route.path.startsWith('/blog') ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/5'"
              :aria-current="$route.path.startsWith('/blog') ? 'page' : undefined"
            >
              <span v-if="$route.path.startsWith('/blog')" class="absolute inset-0 rounded-lg bg-white/10"></span>
              <span class="relative z-10">文章</span>
            </NuxtLink>
            <NuxtLink
              to="/ai-fiction"
              class="relative px-4 py-2 text-sm transition-all duration-300 rounded-lg"
              :class="$route.path.startsWith('/ai-fiction') ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/5'"
              :aria-current="$route.path.startsWith('/ai-fiction') ? 'page' : undefined"
            >
              <span v-if="$route.path.startsWith('/ai-fiction')" class="absolute inset-0 rounded-lg bg-gradient-to-r from-amber-500/20 to-pink-500/20 border border-amber-500/30"></span>
              <span class="relative z-10">AI 小说</span>
            </NuxtLink>
            <NuxtLink
              to="/snapshots"
              class="relative px-4 py-2 text-sm transition-all duration-300 rounded-lg"
              :class="$route.path.startsWith('/snapshots') ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/5'"
              :aria-current="$route.path.startsWith('/snapshots') ? 'page' : undefined"
            >
              <span v-if="$route.path.startsWith('/snapshots')" class="absolute inset-0 rounded-lg bg-white/10"></span>
              <span class="relative z-10">快照</span>
            </NuxtLink>
          </nav>

          <!-- Mobile Menu Button -->
          <button
            type="button"
            class="md:hidden relative w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-1.5 transition-all duration-300"
            :class="mobileMenuOpen ? 'bg-white/10' : 'hover:bg-white/10'"
            @click="mobileMenuOpen = !mobileMenuOpen"
            :aria-expanded="mobileMenuOpen"
            aria-label="切换菜单"
          >
            <span
              class="w-5 h-px bg-white/70 transition-all duration-300"
              :class="mobileMenuOpen ? 'rotate-45 translate-y-1' : ''"
            ></span>
            <span
              class="w-5 h-px bg-white/70 transition-all duration-300"
              :class="mobileMenuOpen ? 'opacity-0' : ''"
            ></span>
            <span
              class="w-5 h-px bg-white/70 transition-all duration-300"
              :class="mobileMenuOpen ? '-rotate-45 -translate-y-1' : ''"
            ></span>
          </button>
        </div>

        <!-- Mobile Navigation -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <nav
            v-if="mobileMenuOpen"
            class="md:hidden mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl"
            aria-label="移动端导航"
          >
            <div class="flex flex-col gap-1">
              <NuxtLink
                to="/"
                class="px-4 py-3 text-sm rounded-xl transition-all duration-300"
                :class="$route.path === '/' ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'"
                :aria-current="$route.path === '/' ? 'page' : undefined"
                @click="mobileMenuOpen = false"
              >首页</NuxtLink>
              <NuxtLink
                to="/blog"
                class="px-4 py-3 text-sm rounded-xl transition-all duration-300"
                :class="$route.path.startsWith('/blog') ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'"
                :aria-current="$route.path.startsWith('/blog') ? 'page' : undefined"
                @click="mobileMenuOpen = false"
              >文章</NuxtLink>
              <NuxtLink
                to="/ai-fiction"
                class="px-4 py-3 text-sm rounded-xl transition-all duration-300"
                :class="$route.path.startsWith('/ai-fiction') ? 'bg-gradient-to-r from-amber-500/20 to-pink-500/20 text-white border border-amber-500/30' : 'text-white/60 hover:bg-white/5 hover:text-white'"
                :aria-current="$route.path.startsWith('/ai-fiction') ? 'page' : undefined"
                @click="mobileMenuOpen = false"
              >AI 小说</NuxtLink>
              <NuxtLink
                to="/snapshots"
                class="px-4 py-3 text-sm rounded-xl transition-all duration-300"
                :class="$route.path.startsWith('/snapshots') ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'"
                :aria-current="$route.path.startsWith('/snapshots') ? 'page' : undefined"
                @click="mobileMenuOpen = false"
              >快照</NuxtLink>
            </div>
          </nav>
        </Transition>
      </header>

      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const mobileMenuOpen = ref(false);

// Close mobile menu on route change
const route = useRoute();
watch(() => route.path, () => {
  mobileMenuOpen.value = false;
});
</script>
