import { getRequestIP } from "h3";
import { recordView } from "~/server/db/stats";
import {
  getCountryFromHeaders,
  getCountryFromIP,
  parseDeviceType,
} from "~/server/utils/stats-helpers";

export default defineEventHandler(async (event) => {
  const body = await readBody<{ path?: string }>(event);
  const path = body?.path;

  if (!path || typeof path !== "string") {
    setResponseStatus(event, 400);
    return { error: "Missing path" };
  }

  const ua = getHeader(event, "user-agent") ?? "";
  const device = parseDeviceType(ua);
  let country =
    getCountryFromHeaders(event) ?? (await getCountryFromIP(getRequestIP(event, { xForwardedFor: true }) ?? undefined));
  if (!country) country = "XX";

  const views = await recordView({ path, device, country });
  return { views };
});
