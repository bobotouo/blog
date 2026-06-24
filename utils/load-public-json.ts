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
        const prefix = basePath.replace(/\/$/, "");
        const path = prefix ? `${prefix}/${filename}` : `/${filename}`;
        const data = await $fetch<T[]>(new URL(path, getRequestURL(event).origin).href);
        if (Array.isArray(data)) return data;
      }
    } catch {
      /* ignore */
    }
    return [];
  }

  const prefix = basePath.replace(/\/$/, "");
  const path = prefix ? `${prefix}/${filename}` : `/${filename}`;
  return await $fetch<T[]>(path).catch(() => []);
}
