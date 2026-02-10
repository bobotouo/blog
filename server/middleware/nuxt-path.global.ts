/**
 * 拦截对 GET /_nuxt 与 GET /_nuxt/ 的请求，直接返回 404，
 * 避免 Nuxt 开发服务器将该请求当作未处理错误并打印 createError 报错。
 */
export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname;
  if (path === "/_nuxt" || path === "/_nuxt/") {
    setResponseStatus(event, 404);
    return { statusMessage: "Not Found" };
  }
});
