import { devSkipAsyncCache, skipEmptySsrPayload } from "~/utils/async-data";
import { loadPublicJson } from "~/utils/load-public-json";

export type FictionSeriesItem = {
  novelSlug: string;
  novelName: string;
  indexPath: string;
  description?: string;
  coverImage?: string;
  chapterCount: number;
  status?: string;
};

async function loadSeriesFromQuery(): Promise<FictionSeriesItem[]> {
  const rows = await queryContent("ai-fiction").find();
  const summaryPaths = rows.filter((r) => String(r._path).endsWith("/summary"));
  const out: FictionSeriesItem[] = [];
  for (const s of summaryPaths) {
    const path = String(s._path);
    const novelSlug = path.replace(/^\/ai-fiction\//, "").replace(/\/summary$/, "");
    if (!novelSlug) continue;
    const chapters = rows.filter(
      (r) => String(r._path).startsWith(`/ai-fiction/${novelSlug}/`) && !String(r._path).endsWith("/summary"),
    );
    const fm = s as { title?: string; description?: string; coverImage?: string; status?: string };
    out.push({
      novelSlug,
      novelName: fm.title ?? novelSlug,
      indexPath: `/ai-fiction/${novelSlug}`,
      description: fm.description,
      coverImage: fm.coverImage as string | undefined,
      status: fm.status,
      chapterCount: chapters.length,
    });
  }
  out.sort((a, b) => a.novelName.localeCompare(b.novelName, "zh-CN"));
  return out;
}

/** 小说系列列表：JSON 优先，queryContent 兜底（与 ai-fiction 列表页一致） */
export function useFictionSeries(key = "ai-fiction-landing") {
  const config = useRuntimeConfig();
  const basePath = ((config.public.baseUrl as string) || "/").replace(/\/$/, "");

  return useAsyncData(
    key,
    async () => {
      const fromJson = await loadPublicJson<FictionSeriesItem>("ai-fiction-series.json", basePath);
      if (fromJson.length > 0) return fromJson;

      if (import.meta.server && !import.meta.dev) return [];

      try {
        return await loadSeriesFromQuery();
      } catch {
        return [];
      }
    },
    {
      getCachedData: import.meta.dev
        ? devSkipAsyncCache<FictionSeriesItem[]>()
        : skipEmptySsrPayload<FictionSeriesItem[]>(),
    },
  );
}
