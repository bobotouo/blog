import { incrementView } from "~/server/db/stats";

export default defineEventHandler(async (event) => {
  const body = await readBody<{ path?: string }>(event);
  const path = body?.path;

  if (!path || typeof path !== "string") {
    setResponseStatus(event, 400);
    return { error: "Missing path" };
  }

  const views = await incrementView(path);
  return { views };
});
