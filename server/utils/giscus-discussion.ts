import {
  escapeForGitHubSearchTitle,
  giscusDiscussionSearchTerms,
} from "~/utils/giscus-discussion-term";

type CommentNode = {
  body?: string;
  createdAt?: string;
  author?: { login?: string; avatarUrl?: string | null };
};

export type DiscussionSearchResult = {
  title?: string;
  comments?: {
    totalCount?: number;
    nodes?: CommentNode[];
  };
};

function buildSearchQuery(includeComments: number | null): string {
  const commentsField =
    includeComments !== null
      ? `comments(last: ${includeComments}) {
              nodes {
                body
                createdAt
                author {
                  login
                  avatarUrl
                }
              }
            }`
      : `comments {
              totalCount
            }`;

  return `
    query($query: String!) {
      search(type: DISCUSSION, first: 1, query: $query) {
        nodes {
          ... on Discussion {
            title
            ${commentsField}
          }
        }
      }
    }
  `;
}

export async function fetchDiscussionByPagePath(
  pagePath: string,
  repo: string,
  token: string,
  options?: { commentsLast?: number },
): Promise<DiscussionSearchResult | null> {
  const [owner, name] = repo.split("/");
  if (!owner || !name) return null;

  const gql = buildSearchQuery(
    typeof options?.commentsLast === "number" ? options.commentsLast : null,
  );

  for (const term of giscusDiscussionSearchTerms(pagePath)) {
    const variables = {
      query: `repo:${owner}/${name} in:title "${escapeForGitHubSearchTitle(term)}"`,
    };

    try {
      const response = await $fetch<{
        data?: { search?: { nodes?: DiscussionSearchResult[] } };
      }>("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: { query: gql, variables },
        timeout: 5000,
      });

      const node = response?.data?.search?.nodes?.[0];
      if (node) return node;
    } catch {
      /* try next term */
    }
  }

  return null;
}
