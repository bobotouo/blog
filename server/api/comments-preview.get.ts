import { fetchDiscussionByPagePath } from "~/server/utils/giscus-discussion";

type PreviewItem = {
  author: string;
  avatarUrl: string | null;
  bodyPreview: string;
  createdAt: string;
};

type PreviewCacheEntry = {
  items: PreviewItem[];
  expiresAt: number;
};

const PREVIEW_CACHE_TTL = 5 * 60 * 1000;
const previewCache = new Map<string, PreviewCacheEntry>();

function truncatePreview(body: string, max = 96): string {
  const oneLine = body.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max)}…`;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const path = query.path;
  const limitRaw = query.limit;
  const limit =
    typeof limitRaw === "string" && /^\d+$/.test(limitRaw)
      ? Math.min(8, Math.max(1, parseInt(limitRaw, 10)))
      : 3;

  if (!path || typeof path !== "string") {
    setResponseStatus(event, 400);
    return { error: "Missing path" };
  }

  const config = useRuntimeConfig();
  const token = config.giscusToken;
  const repo = config.public.giscusRepo;

  if (!token || !repo) {
    return { comments: null as PreviewItem[] | null };
  }

  setHeader(event, "cache-control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");

  const cacheKey = `${path}::${limit}`;
  const now = Date.now();
  const cached = previewCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return { comments: cached.items };
  }

  try {
    const discussion = await fetchDiscussionByPagePath(path, repo, token, {
      commentsLast: limit,
    });

    const nodes = discussion?.comments?.nodes?.filter(Boolean) ?? [];
    const items: PreviewItem[] = nodes
      .map((n) => {
        const body = typeof n.body === "string" ? n.body : "";
        return {
          author: n.author?.login ?? "用户",
          avatarUrl: n.author?.avatarUrl ?? null,
          bodyPreview: truncatePreview(body),
          createdAt: typeof n.createdAt === "string" ? n.createdAt : "",
        };
      })
      .reverse();

    previewCache.set(cacheKey, {
      items,
      expiresAt: now + PREVIEW_CACHE_TTL,
    });
    return { comments: items };
  } catch {
    if (cached) {
      return { comments: cached.items };
    }
    return { comments: null };
  }
});
