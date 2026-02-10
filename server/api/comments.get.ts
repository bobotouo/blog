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

  const response = await $fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: { query: gql, variables },
  });

  const node = response?.data?.search?.nodes?.[0];
  if (!node) {
    return { comments: 0 };
  }

  return { comments: node.comments?.totalCount ?? 0 };
});
