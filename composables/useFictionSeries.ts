import { devSkipAsyncCache } from "~/utils/async-data";

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
  const jsonBase = import.meta.server ? "" : basePath;

  return useAsyncData(
    key,
    async () => {
      const jsonPath = jsonBase
        ? `${jsonBase}/ai-fiction-series.json`
        : "/ai-fiction-series.json";
      const loadJson = () => $fetch<FictionSeriesItem[]>(jsonPath).catch(() => []);

      if (import.meta.server) {
        const fromJson = await loadJson();
        if (fromJson.length > 0) return fromJson;
        return await loadSeriesFromQuery();
      }

      const fromJson = await loadJson();
      if (fromJson.length > 0) return fromJson;
      try {
        return await loadSeriesFromQuery();
      } catch {
        return [];
      }
    },
    { getCachedData: devSkipAsyncCache<FictionSeriesItem[]>() },
  );
}
