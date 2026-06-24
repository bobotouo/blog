/** 评论 API：本地开发走同源 /api，避免跨域请求线上站 */
export function resolveCommentsApiUrl(
  endpoint: "comments" | "comments-preview",
  query: Record<string, string | number>,
  options: { apiBase?: string; basePath?: string },
): string {
  const apiBase = options.apiBase?.trim().replace(/\/$/, "") || "";
  const basePath = options.basePath?.replace(/\/$/, "") || "";

  const useLocalApi = import.meta.dev;

  const qs = new URLSearchParams(
    Object.entries(query).map(([k, v]) => [k, String(v)]),
  ).toString();

  if (apiBase && !useLocalApi) {
    return `${apiBase}/api/${endpoint}?${qs}`;
  }

  const prefix = basePath ? `${basePath}/api/${endpoint}` : `/api/${endpoint}`;
  return `${prefix}?${qs}`;
}
