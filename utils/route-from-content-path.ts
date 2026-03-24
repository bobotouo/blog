/**
 * NuxtLink 的 `to` 在 app.baseURL 为 /blog/ 时必须是「相对路由根」的路径：
 * - content 里博客文章常为 /blog/:slug，若直接传入会与 base 拼成 /blog/blog/:slug；
 * - /ai-fiction/…、/snapshots/… 等含中文或其它非 ASCII 时，应对每段 encode，避免静态部署下无法导航。
 */

function stripAppBasePrefix(path: string, baseUrl: string): string {
  const b = (baseUrl || "/").replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!b || b === "/") return p;
  if (p === b || p === `${b}/`) return "/";
  if (p.startsWith(`${b}/`)) return p.slice(b.length) || "/";
  return p;
}

function encodePathSegments(path: string): string {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return "/";
  return (
    "/" +
    parts
      .map((seg) => {
        try {
          return encodeURIComponent(decodeURIComponent(seg));
        } catch {
          return encodeURIComponent(seg);
        }
      })
      .join("/")
  );
}

/**
 * 将 content 绝对路径转为 NuxtLink 可用的 `to`（已去重 base、已编码路径段）。
 */
export function nuxtLinkToFromContentPath(path: string, baseUrl: string): string {
  return encodePathSegments(stripAppBasePrefix(String(path), baseUrl));
}
