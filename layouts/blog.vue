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
        <nav class="flex items-center gap-6 text-sm text-white/70" aria-label="主导航">
          <NuxtLink
            to="/"
            class="transition hover:text-white"
            :class="$route.path === '/' ? 'text-white' : ''"
            :aria-current="$route.path === '/' ? 'page' : undefined"
          >首页</NuxtLink>
          <NuxtLink
            to="/blog"
            class="transition hover:text-white"
            :class="$route.path.startsWith('/blog') ? 'text-white' : ''"
            :aria-current="$route.path.startsWith('/blog') ? 'page' : undefined"
          >文章</NuxtLink>
          <NuxtLink
            to="/ai-fiction"
            class="transition hover:text-white"
            :class="$route.path.startsWith('/ai-fiction') ? 'text-white' : ''"
            :aria-current="$route.path.startsWith('/ai-fiction') ? 'page' : undefined"
          >AI 小说</NuxtLink>
          <NuxtLink
            to="/snapshots"
            class="transition hover:text-white"
            :class="$route.path.startsWith('/snapshots') ? 'text-white' : ''"
            :aria-current="$route.path.startsWith('/snapshots') ? 'page' : undefined"
          >快照</NuxtLink>
        </nav>
      </header>
      <slot />
    </div>
  </div>
</template>
