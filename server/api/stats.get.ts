import { getViews } from "~/server/db/stats";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const path = query.path;

  if (!path || typeof path !== "string") {
    setResponseStatus(event, 400);
    return { error: "Missing path" };
  }

  const views = await getViews(path);
  return { views };
});
