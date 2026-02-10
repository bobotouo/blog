/**
 * 显式处理 GET /_nuxt，返回 404，避免开发服务器报 [request error] [unhandled]。
 * 仅匹配路径恰好为 /_nuxt，不影响 /_nuxt/xxx.js 等静态资源。
 */
export default defineEventHandler((event) => {
  setResponseStatus(event, 404);
  return { statusMessage: "Not Found" };
});
