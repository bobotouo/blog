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

/** 读取 public/ 下构建期生成的 JSON 对象（SSR / 预渲染 / 客户端通用） */
export async function loadPublicJsonObject<T>(
  relativePath: string,
  basePath = "",
): Promise<T | null> {
  const clean = relativePath.replace(/^\//, "");

  if (import.meta.server) {
    try {
      const { readFile } = await import("node:fs/promises");
      const { join } = await import("node:path");
      const raw = await readFile(join(process.cwd(), "public", clean), "utf-8");
      return JSON.parse(raw) as T;
    } catch {
      /* Netlify 运行时函数内可能无 public/，改走站点静态 CDN */
    }

    try {
      const event = useRequestEvent();
      if (event) {
        const { getRequestURL } = await import("h3");
        const url = new URL(encodePublicUrlPath(clean, basePath), getRequestURL(event).origin).href;
        return await $fetch<T>(url);
      }
    } catch {
      /* ignore */
    }
    return null;
  }

  return await $fetch<T>(encodePublicUrlPath(clean, basePath)).catch(() => null);
}

/** 读取 public/ 下构建期生成的 JSON（SSR / 预渲染 / 客户端通用） */
export async function loadPublicJson<T>(filename: string, basePath = ""): Promise<T[]> {
  if (import.meta.server) {
    try {
      const { readFile } = await import("node:fs/promises");
      const { join } = await import("node:path");
      const raw = await readFile(join(process.cwd(), "public", filename), "utf-8");
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as T[];
    } catch {
      /* Netlify 运行时函数内可能无 public/，改走站点静态 CDN */
    }

    try {
      const event = useRequestEvent();
      if (event) {
        const { getRequestURL } = await import("h3");
        const data = await $fetch<T[]>(new URL(encodePublicUrlPath(filename, basePath), getRequestURL(event).origin).href);
        if (Array.isArray(data)) return data;
      }
    } catch {
      /* ignore */
    }
    return [];
  }

  return await $fetch<T[]>(encodePublicUrlPath(filename, basePath)).catch(() => []);
}
