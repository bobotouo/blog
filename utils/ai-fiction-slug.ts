/**
 * 小说 URL 段与 content/_path 对齐：decodeURIComponent + Unicode NFC，
 * 避免 macOS 文件系统 NFD 与浏览器 NFC 不一致导致匹配失败。
 */
export function normalizeSegment(raw: string): string {
  let s = String(raw ?? "").trim().replace(/\/$/, "");
  try {
    s = decodeURIComponent(s);
  } catch {
    /* ignore */
  }
  return s.normalize("NFC");
}

export function extractNovelSegmentFromPath(path: string): string | null {
  const m = String(path).match(/^\/ai-fiction\/([^/]+)/);
  return m?.[1] ?? null;
}

/** 在已有 content 路径中找出与路由参数等价的那一段目录名（保留 content 中的原始写法） */
export function findCanonicalNovelSegment(paths: string[], novelParam: string): string | null {
  const wanted = normalizeSegment(novelParam);
  const seen = new Set<string>();
  for (const p of paths) {
    const seg = extractNovelSegmentFromPath(p);
    if (!seg || seen.has(seg)) continue;
    seen.add(seg);
    if (seg.normalize("NFC") === wanted) return seg;
  }
  return null;
}

export function seriesRowMatchesNovel(
  novelSlug: string | undefined,
  novelParam: string,
): boolean {
  if (!novelSlug) return false;
  return normalizeSegment(novelSlug) === normalizeSegment(novelParam);
}
