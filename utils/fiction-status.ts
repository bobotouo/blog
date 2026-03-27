/** 连载状态：summary.md 中 `status` 为用户手填文案，仅 trim，不做枚举限制 */

/** 支持 `A | B | C` 这种多状态写法，空项会被过滤 */
export function splitFictionStatus(raw: unknown): string[] {
  if (raw == null || raw === "") return [];
  return String(raw)
    .split("|")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/** 返回展示用字符串；空则 undefined（UI 不显示徽章） */
export function trimFictionStatus(raw: unknown): string | undefined {
  return splitFictionStatus(raw)[0];
}

/** 任意文案共用一套中性样式，与深色博客统一 */
export function fictionStatusBadgeClass(): string {
  return "border-white/20 bg-white/10 text-white/90";
}
