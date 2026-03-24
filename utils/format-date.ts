/** 日期格式化为 YYYY-MM-DD；可在模板/普通函数中安全调用（勿在渲染中调用 useDateFormat）。 */
export function formatDateYmd(date: string | Date | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
