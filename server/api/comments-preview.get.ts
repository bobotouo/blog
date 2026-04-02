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

function escapeForSearchTitle(path: string): string {
  return path.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

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

  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    setResponseStatus(event, 400);
    return { error: "Invalid repo" };
  }

  setHeader(event, "cache-control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");

  const cacheKey = `${path}::${limit}`;
  const now = Date.now();
  const cached = previewCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return { comments: cached.items };
  }

  const escaped = escapeForSearchTitle(path);
  const gql = `
    query($searchQuery: String!, $n: Int!) {
      search(type: DISCUSSION, first: 1, query: $searchQuery) {
        nodes {
          ... on Discussion {
            comments(last: $n) {
              nodes {
                body
                createdAt
                author {
                  login
                  avatarUrl
                }
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    searchQuery: `repo:${owner}/${name} in:title "${escaped}"`,
    n: limit,
  };

  try {
    const response = await $fetch<{ data?: { search?: { nodes?: unknown[] } } }>(
      "https://api.github.com/graphql",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: { query: gql, variables },
        timeout: 5000,
      },
    );

    const discussion = response?.data?.search?.nodes?.[0] as
      | {
          comments?: {
            nodes?: Array<{
              body?: string;
              createdAt?: string;
              author?: { login?: string; avatarUrl?: string | null };
            }>;
          };
        }
      | undefined;

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
