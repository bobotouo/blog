import { promises as fs } from "node:fs";
import { dirname, join } from "node:path";

const dbPath = join(process.cwd(), "server", "db", "stats.json");
// Netlify 函数运行时只注入 SITE_ID/SITE_NAME/URL，不注入 NETLIFY；用 SITE_ID 判断
const isNetlify = !!process.env.SITE_ID;

export type DeviceType = "desktop" | "mobile" | "tablet" | "bot" | "unknown";

export type StatsDB = {
  views: Record<string, number>;
  byDevice: Partial<Record<DeviceType, number>>;
  byCountry: Record<string, number>;
  /** 按日聚合，key 为 YYYY-MM-DD（UTC） */
  daily: Record<string, number>;
};

const emptyDB: StatsDB = {
  views: {},
  byDevice: {},
  byCountry: {},
  daily: {},
};

async function readRaw(): Promise<string> {
  if (isNetlify) {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: "blog-stats", consistency: "strong" });
    const value = await store.get("db");
    return typeof value === "string" ? value : "{}";
  }
  await ensureFileDB();
  return fs.readFile(dbPath, "utf-8");
}

async function writeRaw(data: string): Promise<void> {
  if (isNetlify) {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: "blog-stats", consistency: "strong" });
    await store.set("db", data);
    return;
  }
  await ensureFileDB();
  await fs.writeFile(dbPath, data, "utf-8");
}

const ensureFileDB = async (): Promise<void> => {
  await fs.mkdir(dirname(dbPath), { recursive: true });
  try {
    await fs.access(dbPath);
  } catch {
    await fs.writeFile(dbPath, JSON.stringify(emptyDB, null, 2), "utf-8");
  }
};

const readDB = async (): Promise<StatsDB> => {
  const raw = await readRaw();
  try {
    const parsed = JSON.parse(raw) as Partial<StatsDB>;
    return {
      views: parsed.views ?? emptyDB.views,
      byDevice: parsed.byDevice ?? emptyDB.byDevice,
      byCountry: parsed.byCountry ?? emptyDB.byCountry,
      daily: parsed.daily ?? emptyDB.daily,
    };
  } catch {
    return { ...emptyDB };
  }
};

const writeDB = async (db: StatsDB): Promise<void> => {
  await writeRaw(JSON.stringify(db, null, 2));
};

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export const recordView = async (params: {
  path: string;
  device: DeviceType;
  country: string;
}): Promise<number> => {
  const db = await readDB();
  const { path, device, country } = params;
  const dateKey = todayUTC();
  db.views[path] = (db.views[path] || 0) + 1;
  db.byDevice[device] = (db.byDevice[device] || 0) + 1;
  const code = country && country !== "unknown" ? country.toUpperCase() : "XX";
  db.byCountry[code] = (db.byCountry[code] || 0) + 1;
  db.daily[dateKey] = (db.daily[dateKey] || 0) + 1;
  await writeDB(db);
  return db.views[path];
};

export const getViews = async (path: string): Promise<number> => {
  const db = await readDB();
  return db.views[path] || 0;
};

export type ByPathItem = { path: string; views: number };

export type ByCountryItem = { country: string; code: string; views: number };

function sumDailyInRange(
  daily: Record<string, number>,
  days: number,
): number {
  const end = new Date();
  let sum = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    sum += daily[key] ?? 0;
  }
  return sum;
}

export const getViewsSummary = async (): Promise<{
  total: number;
  last7Days: number;
  last30Days: number;
  last365Days: number;
  byPath: ByPathItem[];
  byDevice: Record<DeviceType, number>;
  byCountry: ByCountryItem[];
}> => {
  const db = await readDB();
  const pathEntries = Object.entries(db.views).filter(
    ([path]) => path && !path.startsWith("__"),
  );
  const total = pathEntries.reduce((sum, [, n]) => sum + n, 0);
  const last7Days = sumDailyInRange(db.daily, 7);
  const last30Days = sumDailyInRange(db.daily, 30);
  const last365Days = sumDailyInRange(db.daily, 365);
  const byPath = pathEntries
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views);

  const deviceKeys: DeviceType[] = ["desktop", "mobile", "tablet", "bot", "unknown"];
  const byDevice = Object.fromEntries(
    deviceKeys.map((k) => [k, db.byDevice[k] ?? 0]),
  ) as Record<DeviceType, number>;

  const countryNames: Record<string, string> = {
    CN: "中国",
    TW: "台湾",
    HK: "香港",
    MO: "澳门",
    US: "美国",
    JP: "日本",
    KR: "韩国",
    GB: "英国",
    DE: "德国",
    FR: "法国",
    IN: "印度",
    SG: "新加坡",
    MY: "马来西亚",
    TH: "泰国",
    VN: "越南",
    RU: "俄罗斯",
    CA: "加拿大",
    AU: "澳大利亚",
    BR: "巴西",
    XX: "未知",
  };
  const byCountry = Object.entries(db.byCountry)
    .filter(([, views]) => views > 0)
    .map(([code, views]) => ({
      country: countryNames[code] ?? code,
      code,
      views,
    }))
    .sort((a, b) => b.views - a.views);

  return {
    total,
    last7Days,
    last30Days,
    last365Days,
    byPath,
    byDevice,
    byCountry,
  };
};
