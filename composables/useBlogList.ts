/** 随笔列表：JSON 优先（快），queryContent 兜底 */
import { devSkipAsyncCache, skipEmptySsrPayload } from "~/utils/async-data";
import { loadPublicJson } from "~/utils/load-public-json";

export function useBlogList(key = "blog") {
  const config = useRuntimeConfig();
  const basePath = ((config.public.baseUrl as string) || "/").replace(/\/$/, "");

  return useAsyncData(
    key,
    async () => {
      const fromJson = await loadPublicJson<unknown>("blog-list.json", basePath);
      if (fromJson.length > 0) return fromJson;

      if (import.meta.server && !import.meta.dev) return [];

      try {
        return await queryContent("blog").sort({ date: -1 }).find();
      } catch {
        return [];
      }
    },
    {
      getCachedData: import.meta.dev
        ? devSkipAsyncCache<unknown[]>()
        : skipEmptySsrPayload<unknown[]>(),
    },
  );
}
