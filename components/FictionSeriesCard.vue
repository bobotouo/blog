<template>
  <NuxtLink
    :to="to"
    class="fiction-card group flex items-stretch min-h-[130px] border-2 border-pencil bg-white overflow-hidden transition-all duration-100 hover:shadow-hand hover:-rotate-[0.5deg]"
    :style="{ borderRadius: wobblyRadius.md, boxShadow: shadows.subtle }"
  >
    <!-- cover -->
    <div class="relative w-[120px] shrink-0 border-r-2 border-pencil bg-erased">
      <img
        v-if="coverImage"
        :src="coverImage"
        :alt="novelName"
        class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        loading="lazy"
      />
      <div v-else class="flex h-full w-full items-center justify-center text-2xl">📖</div>
    </div>

    <!-- info -->
    <div class="flex flex-1 flex-col justify-between min-w-0 px-5 py-4">
      <div>
        <div class="flex flex-wrap items-center gap-2 mb-1.5">
          <HandTag variant="muted" class="!text-xs !py-0.5">幻想</HandTag>
          <FictionStatusBadge v-if="status" :status="status" />
        </div>
        <h3 class="font-heading text-lg font-bold text-pencil leading-snug group-hover:text-pen transition-colors line-clamp-1">
          {{ novelName }}
        </h3>
        <p v-if="description" class="mt-1 font-body text-sm text-pencil/55 line-clamp-2 leading-relaxed">
          {{ description }}
        </p>
      </div>

      <div class="mt-3">
        <div class="flex flex-wrap items-center gap-x-3 font-body text-xs text-pencil/45">
          <span>{{ chapterCount }} 章</span>
          <span v-if="commentCount !== null">{{ commentCount }} 条评论</span>
        </div>
        <div v-if="previewItems?.length" class="mt-2 space-y-1.5" @click.stop>
          <div v-for="(c, i) in previewItems.slice(0, 2)" :key="i" class="flex items-start gap-2 font-body text-xs leading-snug">
            <img v-if="c.avatarUrl" :src="c.avatarUrl" alt="" class="mt-0.5 h-5 w-5 shrink-0 border border-pencil object-cover" :style="{ borderRadius: wobblyRadius.sm }" loading="lazy" />
            <div v-else class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center bg-erased border border-pencil font-body text-[10px]" :style="{ borderRadius: wobblyRadius.sm }">
              {{ c.author.slice(0, 1).toUpperCase() }}
            </div>
            <p class="flex-1 min-w-0 text-pencil/50 line-clamp-1">
              <span class="text-pencil/70 font-bold mr-1">{{ c.author }}</span>{{ c.bodyPreview }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center pr-4 text-pencil/25 group-hover:text-pen transition shrink-0">
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { wobblyRadius, shadows } from "~/utils/design-tokens";

const props = defineProps<{
  novelName: string;
  description?: string;
  coverImage?: string;
  chapterCount: number;
  status?: string;
  to: string;
  commentPath: string;
}>();

const { count: commentCount } = useCommentCount(props.commentPath);
const { items: previewItems } = useCommentPreview(props.commentPath, 3);
</script>
