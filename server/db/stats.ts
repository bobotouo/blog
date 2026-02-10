import { promises as fs } from "fs";
import { dirname, join } from "path";

const dbPath = join(process.cwd(), "server", "db", "stats.json");

type StatsDB = {
  views: Record<string, number>;
};

const emptyDB: StatsDB = { views: {} };

const ensureDB = async (): Promise<void> => {
  await fs.mkdir(dirname(dbPath), { recursive: true });
  try {
    await fs.access(dbPath);
  } catch {
    await fs.writeFile(dbPath, JSON.stringify(emptyDB, null, 2), "utf-8");
  }
};

const readDB = async (): Promise<StatsDB> => {
  await ensureDB();
  const raw = await fs.readFile(dbPath, "utf-8");
  try {
    return JSON.parse(raw) as StatsDB;
  } catch {
    return { ...emptyDB };
  }
};

const writeDB = async (db: StatsDB): Promise<void> => {
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2), "utf-8");
};

export const incrementView = async (path: string): Promise<number> => {
  const db = await readDB();
  db.views[path] = (db.views[path] || 0) + 1;
  await writeDB(db);
  return db.views[path];
};

export const getViews = async (path: string): Promise<number> => {
  const db = await readDB();
  return db.views[path] || 0;
};
