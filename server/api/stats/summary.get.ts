/**
 * 访问统计汇总：总访问量 + 按路径分布
 */
import { getViewsSummary } from "~/server/db/stats";

export default defineEventHandler(async () => {
  const summary = await getViewsSummary();
  return summary;
});
