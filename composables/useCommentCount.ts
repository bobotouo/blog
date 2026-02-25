import { onMounted, ref } from "vue";

type CountCacheEntry = {
  comments: number;
  expiresAt: number;
};

const COMMENT_COUNT_TTL = 10 * 60 * 1000;
const STORAGE_KEY = "blog-comment-count-cache-v1";

export const useCommentCount = (path: string) => {
  const count = ref<number | null>(null);
  const memoryCache = useState<Record<string, CountCacheEntry>>(
    "comment-count-cache",
    () => ({})
  );

  const readLocalCache = (): Record<string, CountCacheEntry> => {
    if (import.meta.server) return {};
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, CountCacheEntry>;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  };

  const writeLocalCache = (cache: Record<string, CountCacheEntry>) => {
    if (import.meta.server) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch {
      // Ignore quota/storage errors.
    }
  };

  const getCachedCount = (): number | null => {
    const now = Date.now();
    const memoryHit = memoryCache.value[path];
    if (memoryHit && memoryHit.expiresAt > now) {
      return memoryHit.comments;
    }

    const localCache = readLocalCache();
    const localHit = localCache[path];
    if (localHit && localHit.expiresAt > now) {
      memoryCache.value[path] = localHit;
      return localHit.comments;
    }

    return null;
  };

  const saveCache = (comments: number) => {
    const entry: CountCacheEntry = {
      comments,
      expiresAt: Date.now() + COMMENT_COUNT_TTL,
    };
    memoryCache.value[path] = entry;
    const localCache = readLocalCache();
    localCache[path] = entry;
    writeLocalCache(localCache);
  };

  const load = async () => {
    const cachedCount = getCachedCount();
    if (cachedCount !== null) {
      count.value = cachedCount;
      return;
    }

    try {
      const data = await $fetch<{ comments: number | null }>("/api/comments", {
        query: { path },
        timeout: 4500,
      });
      if (typeof data?.comments === "number") {
        count.value = data.comments;
        saveCache(data.comments);
      }
    } catch {
      // Keep count as null on failure.
    }
  };

  onMounted(() => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => load(), { timeout: 2000 });
      return;
    }
    window.setTimeout(() => load(), 900);
  });

  return { count };
};
