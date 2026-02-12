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

  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    setResponseStatus(event, 400);
    return { error: "Invalid repo" };
  }

  setHeader(event, "cache-control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");

  const now = Date.now();
  const cached = commentCache.get(path);
  if (cached && cached.expiresAt > now) {
    return { comments: cached.comments };
  }

  const gql = `
    query($query: String!) {
      search(type: DISCUSSION, first: 1, query: $query) {
        nodes {
          ... on Discussion {
            title
            comments {
              totalCount
            }
          }
        }
      }
    }
  `;

  const variables = {
    query: `repo:${owner}/${name} in:title \"${path}\"`,
  };

  try {
    const response = await $fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: { query: gql, variables },
      timeout: 4000,
    });

    const node = response?.data?.search?.nodes?.[0];
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
