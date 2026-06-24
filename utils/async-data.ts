import type { NuxtApp } from "#app";

/** 开发环境跳过 useAsyncData 缓存，避免空数组/旧数据被复用 */
export function devSkipAsyncCache<T>() {
  return import.meta.dev ? () => undefined as T | undefined : undefined;
}

/** SSR 返回空数组时，客户端强制重新拉取（避免 Netlify 首屏统计为 0） */
export function skipEmptySsrPayload<T extends unknown[]>() {
  return (key: string, nuxtApp: NuxtApp) => {
    if (import.meta.dev) return undefined;
    const data = (nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]) as T | undefined;
    if (import.meta.client && Array.isArray(data) && data.length === 0) {
      return undefined;
    }
    return data;
  };
}
