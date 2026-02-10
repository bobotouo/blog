<template>
  <div
    class="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#16212f_0%,_#0a0f14_40%,_#05070b_100%)] text-[color:var(--fg-main)]"
  >
    <div class="absolute inset-0 bg-grid opacity-[0.25]" aria-hidden />
    <div
      class="absolute -bottom-48 left-[-10%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(249,115,22,0.25),_rgba(249,115,22,0)_70%)] blur-3xl"
      aria-hidden
    />
    <div
      class="absolute inset-0 z-[1] bg-gradient-to-b from-black/10 via-black/50 to-black/80 pointer-events-none"
      aria-hidden
    />
    <div class="relative z-10">
      <header class="max-w-5xl mx-auto px-6 pt-8 pb-6 flex items-center justify-between">
        <NuxtLink to="/" class="text-lg tracking-[0.2em] uppercase text-white/90">
          NOVA BLOG
        </NuxtLink>
        <nav class="flex items-center gap-6 text-sm text-white/70">
          <NuxtLink to="/" class="hover:text-white transition">首页</NuxtLink>
          <NuxtLink to="/blog" class="hover:text-white transition">文章</NuxtLink>
          <NuxtLink to="/snapshots" class="hover:text-white transition">
            快照
          </NuxtLink>
        </nav>
      </header>
      <slot />
    </div>
  </div>
</template>
