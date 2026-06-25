import { fetchDiscussionByPagePath } from "~/server/utils/giscus-discussion";

type CommentCacheEntry = {
  comments: number | null;
  expiresAt: number;
};

const COMMENT_CACHE_TTL = 5 * 60 * 1000;
const commentCache = new Map<string, CommentCacheEntry>();

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const path = query.path;

  if (!path || typeof path !== "string") {
    setResponseStatus(event, 400);
    return { error: "Missing path" };
  }

  const config = useRuntimeConfig();
  const token = config.giscusToken;
  const repo = config.public.giscusRepo;

  if (!token || !repo) {
    return { comments: null };
  }

  setHeader(event, "cache-control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");

  const now = Date.now();
  const cached = commentCache.get(path);
  if (cached && cached.expiresAt > now) {
    return { comments: cached.comments };
  }

  try {
    const node = await fetchDiscussionByPagePath(path, repo, token);
    const comments = node ? (node.comments?.totalCount ?? 0) : 0;
    commentCache.set(path, {
      comments,
      expiresAt: now + COMMENT_CACHE_TTL,
    });
    return { comments };
  } catch {
    if (cached) {
      return { comments: cached.comments };
    }
    return { comments: null };
  }
});
