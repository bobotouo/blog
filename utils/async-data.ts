import type { NuxtApp } from "#app";
import { loadPublicJsonObject } from "~/utils/load-public-json";

/** 开发环境跳过 useAsyncData 缓存，避免空数组/旧数据被复用（列表页用） */
export function devSkipAsyncCache<T>() {
  return import.meta.dev ? () => undefined as T | undefined : undefined;
}

/**
 * 详情页：SSR payload 有数据则复用；payload 为 null（序列化失败）时客户端重新拉取。
 * 勿用 devSkipAsyncCache，否则刷新会丢弃 SSR 数据并在 clientDB 关闭时 404。
 */
export function detailPageCachedData<T extends Record<string, unknown>>() {
  return (key: string, nuxtApp: NuxtApp) => {
    const data = (nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]) as T | null | undefined;
    if (data && typeof data === "object") return data;
    return undefined;
  };
}

/** SSR / 客户端统一：先读 public JSON，再尝试 queryContent */
export async function loadContentDetail<T extends Record<string, unknown>>(options: {
  contentPath: string;
  jsonRelativePath: string;
  basePath?: string;
}): Promise<T | null> {
  const fromJson = await loadPublicJsonObject<T>(options.jsonRelativePath, options.basePath ?? "");
  if (fromJson) return fromJson;

  try {
    const doc = await queryContent(options.contentPath).findOne();
    if (doc) return doc as T;
  } catch {
    /* ignore */
  }

  return null;
}

/** SSR 返回空数组时，客户端强制重新拉取（避免线上首屏统计为 0） */
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
