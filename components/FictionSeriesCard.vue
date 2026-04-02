<template>
  <NuxtLink
    :to="to"
    class="fiction-card group flex items-stretch min-h-[130px] rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl overflow-hidden transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.07] hover:shadow-[0_16px_48px_rgba(0,0,0,0.32)] hover:-translate-y-px"
  >
    <!-- 封面 -->
    <div class="relative w-[130px] shrink-0 bg-black/30">
      <div
        class="absolute inset-0 bg-[linear-gradient(160deg,rgba(34,211,238,0.1),transparent_55%)] pointer-events-none z-[1]"
      />
      <img
        v-if="coverImage"
        :src="coverImage"
        :alt="novelName"
        class="relative z-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        loading="lazy"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.3em] text-white/20"
      >
        Novel
      </div>
    </div>

    <!-- 信息区 -->
    <div class="flex flex-1 flex-col justify-between min-w-0 px-5 py-4">
      <div>
        <div class="flex flex-wrap items-center gap-2 mb-1.5">
          <span class="text-[10px] uppercase tracking-[0.3em] text-[color:var(--accent)]/80">Fiction</span>
          <FictionStatusBadge v-if="status" :status="status" />
        </div>
        <h3 class="text-lg font-semibold text-white leading-snug group-hover:text-[color:var(--accent)] transition-colors line-clamp-1">
          {{ novelName }}
        </h3>
        <p v-if="description" class="mt-1 text-sm text-white/55 line-clamp-2 leading-relaxed">
          {{ description }}
        </p>
      </div>

      <!-- 底部：章数 + 评论预览 -->
      <div class="mt-3">
        <div class="flex flex-wrap items-center gap-x-3 text-xs text-white/40">
          <span>{{ chapterCount }} 章</span>
          <span v-if="commentCount !== null">{{ commentCount }} 条评论</span>
        </div>

        <div
          v-if="previewItems && previewItems.length > 0"
          class="mt-2 space-y-1.5"
          @click.stop
        >
          <div
            v-for="(c, i) in previewItems.slice(0, 2)"
            :key="i"
            class="flex items-start gap-2 text-xs leading-snug"
          >
            <img
              v-if="c.avatarUrl"
              :src="c.avatarUrl"
              alt=""
              class="mt-0.5 h-5 w-5 shrink-0 rounded-full border border-white/10 object-cover"
              loading="lazy"
            />
            <div v-else class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[10px] text-white/40">
              {{ c.author.slice(0, 1).toUpperCase() }}
            </div>
            <p class="flex-1 min-w-0 text-white/45 line-clamp-1">
              <span class="text-white/65 font-medium mr-1">{{ c.author }}</span>{{ c.bodyPreview }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧箭头 -->
    <div class="flex items-center pr-4 text-white/20 group-hover:text-white/50 transition shrink-0">
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{
  novelName: string;
  description?: string;
  coverImage?: string;
  chapterCount: number;
  status?: string;
  /** NuxtLink `to`（已编码） */
  to: string;
  /** 与 Giscus /api/comments 一致的完整 pathname，如 /blog/ai-fiction/foo */
  commentPath: string;
}>();

const { count: commentCount } = useCommentCount(props.commentPath);
const { items: previewItems } = useCommentPreview(props.commentPath, 3);
</script>
