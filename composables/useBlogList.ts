/** 随笔列表：JSON 优先（快），queryContent 兜底 */
import { devSkipAsyncCache } from "~/utils/async-data";

export function useBlogList(key = "blog") {
  const config = useRuntimeConfig();
  const basePath = ((config.public.baseUrl as string) || "/").replace(/\/$/, "");
  const jsonBase = import.meta.server ? "" : basePath;

  return useAsyncData(
    key,
    async () => {
      const jsonPath = jsonBase ? `${jsonBase}/blog-list.json` : "/blog-list.json";
      const loadJson = () => $fetch<unknown[]>(jsonPath).catch(() => []);

      if (import.meta.server) {
        const fromJson = await loadJson();
        if (Array.isArray(fromJson) && fromJson.length > 0) return fromJson;
        return await queryContent("blog").sort({ date: -1 }).find();
      }

      const cached = useNuxtData(key).data.value;
      if (Array.isArray(cached) && cached.length > 0) return cached;

      if (import.meta.dev) {
        try {
          const fromQuery = await queryContent("blog").sort({ date: -1 }).find();
          if (Array.isArray(fromQuery) && fromQuery.length > 0) return fromQuery;
        } catch {
          /* fallback JSON */
        }
      }
      return await loadJson();
    },
    { getCachedData: devSkipAsyncCache<unknown[]>() },
  );
}
