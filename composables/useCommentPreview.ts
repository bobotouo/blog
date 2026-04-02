import { onMounted, ref } from "vue";

export type CommentPreviewItem = {
  author: string;
  avatarUrl: string | null;
  bodyPreview: string;
  createdAt: string;
};

const MEMORY_TTL = 8 * 60 * 1000;

export function useCommentPreview(path: string, limit = 3) {
  const items = ref<CommentPreviewItem[] | null>(null);
  const loading = ref(true);
  const memory = useState<Record<string, { items: CommentPreviewItem[]; expiresAt: number }>>(
    "comment-preview-cache-v1",
    () => ({}),
  );
  const cacheKey = `${path}::${limit}`;

  const load = async () => {
    if (!path) {
      loading.value = false;
      return;
    }

    const now = Date.now();
    const hit = memory.value[cacheKey];
    if (hit && hit.expiresAt > now) {
      items.value = hit.items;
      loading.value = false;
      return;
    }

    const config = useRuntimeConfig();
    const apiBase = (config.public.commentsApiBase as string) || "";
    const baseUrl = (config.public.baseUrl as string) || "/";
    const basePath = baseUrl.replace(/\/$/, "");
    const url = apiBase
      ? `${apiBase.replace(/\/$/, "")}/api/comments-preview`
      : basePath
        ? `${basePath}/api/comments-preview`
        : "/api/comments-preview";

    try {
      const data = await $fetch<{ comments: CommentPreviewItem[] | null }>(url, {
        query: { path, limit },
        timeout: 5000,
      });
      if (data?.comments === null) {
        items.value = null;
      } else if (Array.isArray(data?.comments)) {
        items.value = data.comments;
        memory.value[cacheKey] = {
          items: data.comments,
          expiresAt: Date.now() + MEMORY_TTL,
        };
      }
    } catch {
      items.value = null;
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    load();
  });

  return { items, loading };
}
