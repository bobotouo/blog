export type JsonFetch = <T>(request: string, opts?: object) => Promise<T>;

/** 将 public 下的相对路径编码为 URL 路径（保留 ASCII 段，编码非 ASCII） */
function encodePublicUrlPath(relativePath: string, basePath = ""): string {
  const clean = relativePath.replace(/^\//, "");
  const segments = clean.split("/").map((seg) => {
    try {
      return encodeURIComponent(decodeURIComponent(seg));
    } catch {
      return encodeURIComponent(seg);
    }
  });
  const prefix = basePath.replace(/\/$/, "");
  const path = segments.join("/");
  return prefix ? `${prefix}/${path}` : `/${path}`;
}

async function fetchJson<T>(
  path: string,
  fetchFn: JsonFetch,
): Promise<T | null> {
  try {
    return await fetchFn<T>(path);
  } catch {
    return null;
  }
}

/** Vercel 等 Serverless SSR：从 CDN 拉静态 JSON，勿用 useRequestFetch（会走 SSR 渲染链导致 OOM） */
async function resolveStaticOrigins(): Promise<string[]> {
  const origins: string[] = [];
  try {
    const event = useRequestEvent();
    if (event) {
      const { getRequestURL } = await import("h3");
      origins.push(getRequestURL(event).origin);
    }
  } catch {
    /* ignore */
  }
  for (const raw of [
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ]) {
    if (!raw) continue;
    const origin = raw.startsWith("http")
      ? raw.replace(/\/$/, "")
      : `https://${raw.replace(/\/$/, "")}`;
    if (!origins.includes(origin)) origins.push(origin);
  }
  return origins;
}

async function fetchJsonFromStaticCdn<T>(path: string): Promise<T | null> {
  const origins = await resolveStaticOrigins();
  const fetch = $fetch as JsonFetch;
  for (const origin of origins) {
    const hit = await fetchJson<T>(new URL(path, origin).href, fetch);
    if (hit !== null && hit !== undefined) return hit;
  }
  return null;
}

/** 读取 public/ 下构建期生成的 JSON 对象（SSR / 预渲染 / 客户端通用） */
export async function loadPublicJsonObject<T>(
  relativePath: string,
  basePath = "",
  fetchFn?: JsonFetch,
): Promise<T | null> {
  const clean = relativePath.replace(/^\//, "");
  const path = encodePublicUrlPath(clean, basePath);
  const fetch = (fetchFn ?? $fetch) as JsonFetch;

  if (import.meta.server) {
    try {
      const { readFile } = await import("node:fs/promises");
      const { join } = await import("node:path");
      const raw = await readFile(join(process.cwd(), "public", clean), "utf-8");
      return JSON.parse(raw) as T;
    } catch {
      /* 本地 dev；Vercel 函数内无 public/ */
    }

    const fromCdn = await fetchJsonFromStaticCdn<T>(path);
    if (fromCdn) return fromCdn;

    return null;
  }

  return await fetchJson<T>(path, fetch);
}

/** 读取 public/ 下构建期生成的 JSON（SSR / 预渲染 / 客户端通用） */
export async function loadPublicJson<T>(
  filename: string,
  basePath = "",
  fetchFn?: JsonFetch,
): Promise<T[]> {
  const clean = filename.replace(/^\//, "");
  const path = encodePublicUrlPath(clean, basePath);
  const fetch = (fetchFn ?? $fetch) as JsonFetch;

  if (import.meta.server) {
    try {
      const { readFile } = await import("node:fs/promises");
      const { join } = await import("node:path");
      const raw = await readFile(join(process.cwd(), "public", clean), "utf-8");
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as T[];
    } catch {
      /* ignore */
    }

    const fromCdn = await fetchJsonFromStaticCdn<T[]>(path);
    if (Array.isArray(fromCdn)) return fromCdn;

    return [];
  }

  const data = await fetchJson<T[]>(path, fetch);
  return Array.isArray(data) ? data : [];
}
