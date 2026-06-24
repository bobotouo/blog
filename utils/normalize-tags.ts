/** 兼容 frontmatter / AI 输出里 tags 为 JSON 字符串、方括号字符串或逗号分隔文本 */
export function normalizeTags(raw: unknown): string[] {
  if (raw == null || raw === "") return [];

  if (Array.isArray(raw)) {
    return raw
      .flatMap((item) => normalizeTags(item))
      .map((t) => t.trim())
      .filter(Boolean);
  }

  if (typeof raw !== "string") return [];

  const s = raw.trim();
  if (!s) return [];

  if (s.startsWith("[") && s.endsWith("]")) {
    try {
      const parsed = JSON.parse(s) as unknown;
      if (Array.isArray(parsed)) return normalizeTags(parsed);
    } catch {
      const inner = s.slice(1, -1).trim();
      if (!inner) return [];
      return inner
        .split(/[,，]/)
        .map(stripTagQuotes)
        .filter(Boolean);
    }
  }

  if (s.includes(",") || s.includes("，")) {
    return s
      .split(/[,，]/)
      .map(stripTagQuotes)
      .filter(Boolean);
  }

  const single = stripTagQuotes(s);
  return single ? [single] : [];
}

function stripTagQuotes(tag: string): string {
  return tag.trim().replace(/^[\[\]"'`\s]+|[\]\s"'`]+$/g, "");
}
