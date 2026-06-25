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

    // 相对路径：走 Nitro 内部静态资源（useRequestFetch 绑定的请求上下文）
    const relative = await fetchJson<T>(path, fetch);
    if (relative) return relative;

    try {
      const event = useRequestEvent();
      if (event) {
        const { getRequestURL } = await import("h3");
        const origin = getRequestURL(event).origin;
        const absolute = await fetchJson<T>(new URL(path, origin).href, fetch);
        if (absolute) return absolute;
      }
    } catch {
      /* ignore */
    }

    if (process.env.VERCEL_URL) {
      const vercel = await fetchJson<T>(
        new URL(path, `https://${process.env.VERCEL_URL}`).href,
        fetch,
      );
      if (vercel) return vercel;
    }
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

    const relative = await fetchJson<T[]>(path, fetch);
    if (Array.isArray(relative) && relative.length > 0) return relative;

    try {
      const event = useRequestEvent();
      if (event) {
        const { getRequestURL } = await import("h3");
        const data = await fetchJson<T[]>(
          new URL(path, getRequestURL(event).origin).href,
          fetch,
        );
        if (Array.isArray(data)) return data;
      }
    } catch {
      /* ignore */
    }

    if (process.env.VERCEL_URL) {
      const data = await fetchJson<T[]>(
        new URL(path, `https://${process.env.VERCEL_URL}`).href,
        fetch,
      );
      if (Array.isArray(data)) return data;
    }
    return [];
  }

  const data = await fetchJson<T[]>(path, fetch);
  return Array.isArray(data) ? data : [];
}
