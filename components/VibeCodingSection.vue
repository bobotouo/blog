<template>
  <HandSectionPanel label="vibe coding" rotate="-0.3deg">
    <!-- 外留白：避免 hover 阴影被面板裁切 -->
    <div class="space-y-8 overflow-visible p-3">
      <!-- A股全景：iframe 可滚动；标题/按钮打开外链 -->
      <div class="group overflow-visible">
        <HandCard
          decoration="tack"
          rotate="-0.5deg"
          padding="p-4 md:p-5"
          flat
          :hover-lift="false"
          class="!border-0 transition-shadow duration-100 group-hover:shadow-hand"
        >
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="min-w-0">
              <h3 class="font-heading text-xl md:text-2xl font-bold text-pencil">
                A股全景
              </h3>
              <p class="font-body text-sm text-pencil/60 mt-1">
                实时行情一览 · 窗口内可滚动浏览
              </p>
            </div>
            <a
              :href="stockUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="shrink-0 font-body text-sm font-bold text-pencil bg-white border-2 border-pencil px-3 py-1.5 shadow-hand hover:bg-marker hover:text-white transition-colors duration-100"
              :style="{ borderRadius: wobblyRadius.sm }"
            >
              打开 →
            </a>
          </div>

          <div class="relative bg-erased" :style="{ borderRadius: wobblyRadius.sm }">
            <iframe
              :src="stockUrl"
              title="A股全景"
              class="block h-[320px] w-full border-0 md:h-[440px]"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            />
          </div>
        </HandCard>
      </div>

      <!-- Game Emulator：README 摘要 + 等比缩略图 -->
      <a
        :href="emulatorUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="block group overflow-visible"
      >
        <HandCard
          decoration="tack"
          rotate="0.5deg"
          padding="p-4 md:p-5"
          flat
          :hover-lift="false"
          class="!border-0 transition-shadow duration-100 group-hover:shadow-hand"
        >
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="min-w-0">
              <h3 class="font-heading text-xl md:text-2xl font-bold text-pencil group-hover:text-marker transition-colors">
                Game Emulator
              </h3>
              <p class="font-body text-sm text-pencil/45 mt-1">
                bobotouo/game-emulator · GitHub
              </p>
            </div>
            <span
              class="shrink-0 font-body text-sm font-bold text-pencil bg-white border-2 border-pencil px-3 py-1.5 shadow-hand group-hover:bg-marker group-hover:text-white transition-colors duration-100"
              :style="{ borderRadius: wobblyRadius.sm }"
            >
              仓库 →
            </span>
          </div>

          <p class="font-body text-pencil/70 leading-relaxed mb-4">
            {{ emulatorSummary }}
          </p>

          <img
            :src="emulatorScreenshot"
            alt="Game Emulator 运行截图"
            loading="lazy"
            decoding="async"
            class="w-full max-w-[220px] h-auto"
            :style="{ borderRadius: wobblyRadius.sm }"
          />
        </HandCard>
      </a>
    </div>
  </HandSectionPanel>
</template>

<script setup lang="ts">
import { wobblyRadius } from "~/utils/design-tokens";

const stockUrl = "https://lao-a.bobotou118.dpdns.org/";
const emulatorUrl = "https://github.com/bobotouo/game-emulator";
const emulatorScreenshot =
  "https://raw.githubusercontent.com/bobotouo/game-emulator/main/doc/test1.gif";

const emulatorSummary =
  "基于 Flutter 与 libretro 的多系统模拟器，支持 GBA（gpSP）、FC/NES（FCEUmm）与街机（FBNeo），具备本地游戏库、自动存档、变速游玩，以及局域网 / 互联网联机。";
</script>
