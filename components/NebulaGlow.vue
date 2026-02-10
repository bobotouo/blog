<template>
  <div class="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
    <div
      class="absolute -top-32 right-[-15%] h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,_rgba(34,211,238,0.45),_rgba(34,211,238,0)_70%)] blur-3xl mix-blend-screen animate-float-slow"
      style="animation: float-slow 14s ease-in-out infinite; will-change: transform, opacity;"
    />
    <div
      class="absolute -bottom-40 left-[-10%] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,_rgba(249,115,22,0.45),_rgba(249,115,22,0)_70%)] blur-3xl mix-blend-screen animate-float-reverse"
      style="animation: float-reverse 16s ease-in-out infinite; will-change: transform, opacity;"
    />
    <div
      class="absolute top-1/3 left-1/2 h-[20rem] w-[20rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(163,230,53,0.28),_rgba(163,230,53,0)_70%)] blur-3xl mix-blend-screen animate-float-fast"
      style="animation: float-fast 9s ease-in-out infinite; will-change: transform, opacity;"
    />
  </div>
</template>

<script setup lang="ts"></script>
