/** 开发环境跳过 useAsyncData 缓存，避免空数组/旧数据被复用 */
export function devSkipAsyncCache<T>() {
  return import.meta.dev ? () => undefined as T | undefined : undefined;
}
