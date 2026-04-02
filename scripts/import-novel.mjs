#!/usr/bin/env node
/**
 * import-novel.mjs
 *
 * 从小说生成目录导入章节到博客 content/ai-fiction/<dest>/ 下
 *
 * 用法：
 *   node scripts/import-novel.mjs [小说名称] [选项]
 *
 *   小说名称：源目录下的子文件夹名（含 outline.json + chapters/）
 *             只有一本时可省略，自动识别
 *
 * 选项：
 *   --base   <path>  包含各本小说子目录的父目录
 *                    默认：/Users/bobo/Desktop/project/novel/output
 *   --dest   <name>  博客目标文件夹名（content/ai-fiction/ 下）
 *                    默认：与源子目录同名
 *   --force          覆盖已存在的章节文件（默认跳过）
 *   --dry-run        只打印要写入的文件，不实际写入
 *
 * 示例：
 *   node scripts/import-novel.mjs                        # 单本自动识别
 *   node scripts/import-novel.mjs 登棋仙途               # 多本时指定
 *   node scripts/import-novel.mjs 登棋仙途 --dest 登棋仙途  # 自定义目标文件夹名
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";
import { parseArgs } from "node:util";

const BLOG_ROOT = resolve(import.meta.dirname, "..");

// ── 参数解析 ───────────────────────────────────────────────────────────────
const { values: flags, positionals } = parseArgs({
  options: {
    // 优先级：--base 参数 > NOVEL_SRC_BASE 环境变量 > 默认路径
    base:      { type: "string",  default: process.env.NOVEL_SRC_BASE ?? "/Users/bobo/Desktop/project/novel/output" },
    dest:      { type: "string",  default: "" },
    force:     { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
  },
  allowPositionals: true,
  strict: false,
});

const BASE_DIR = resolve(flags.base);
const FORCE    = flags.force;
const DRY_RUN  = flags["dry-run"];

// ── 探测可用的小说子目录（含 outline.json + chapters/） ───────────────────
function isNovelDir(dir) {
  return existsSync(join(dir, "outline.json")) && existsSync(join(dir, "chapters"));
}

if (!existsSync(BASE_DIR)) fatal(`base 目录不存在：${BASE_DIR}`);

const novels = readdirSync(BASE_DIR)
  .filter((n) => {
    try { return statSync(join(BASE_DIR, n)).isDirectory(); } catch { return false; }
  })
  .filter((n) => isNovelDir(join(BASE_DIR, n)));

// 检查 base 目录本身是否就是一本小说
const baseSelf = isNovelDir(BASE_DIR);

let SRC_DIR;
let NOVEL_LABEL;

if (positionals.length > 0) {
  // 明确指定了小说名
  const name = positionals[0];
  if (baseSelf && name === "") {
    SRC_DIR = BASE_DIR;
    NOVEL_LABEL = name;
  } else {
    const candidate = join(BASE_DIR, name);
    if (!existsSync(candidate)) fatal(`在 ${BASE_DIR} 下找不到子目录：${name}`);
    if (!isNovelDir(candidate)) fatal(`${candidate} 不是有效的小说目录（缺少 outline.json 或 chapters/）`);
    SRC_DIR = candidate;
    NOVEL_LABEL = name;
  }
} else if (baseSelf) {
  // base 本身就是小说目录（兼容旧用法）
  SRC_DIR = BASE_DIR;
  NOVEL_LABEL = BASE_DIR.split("/").pop() || "novel";
} else if (novels.length === 1) {
  // 只有一本，自动识别
  NOVEL_LABEL = novels[0];
  SRC_DIR = join(BASE_DIR, NOVEL_LABEL);
  log(`自动识别到小说：${NOVEL_LABEL}`);
} else if (novels.length === 0) {
  fatal(`在 ${BASE_DIR} 下未找到有效的小说目录（需含 outline.json + chapters/）`);
} else {
  // 多本，必须指定
  const list = novels.map((n) => `  · ${n}`).join("\n");
  fatal(
    `${BASE_DIR} 下有多本小说，请指定要导入的名称：\n${list}\n\n` +
    `用法：node scripts/import-novel.mjs <小说名称>`
  );
}

// 目标文件夹名：--dest 优先，否则与源相同
const DEST_NAME = (flags.dest || "").trim() || NOVEL_LABEL;
const DEST_DIR  = join(BLOG_ROOT, "content", "ai-fiction", DEST_NAME);
const OUTLINE   = join(SRC_DIR, "outline.json");
const CHAPTERS  = join(SRC_DIR, "chapters");

log(`源目录：${SRC_DIR}`);
log(`目标：  content/ai-fiction/${DEST_NAME}/`);

// ── 读取 outline.json ──────────────────────────────────────────────────────
/** @type {Array<{chapter: number, title: string}>} */
const outline = JSON.parse(readFileSync(OUTLINE, "utf8"));
const chapterMap = new Map(outline.map((c) => [c.chapter, c]));
log(`outline.json 共 ${outline.length} 章`);

// ── 读取章节源文件 ─────────────────────────────────────────────────────────
const srcFiles = readdirSync(CHAPTERS)
  .filter((f) => /^\d+\.md$/i.test(f))
  .sort((a, b) => parseInt(a) - parseInt(b));

log(`chapters/ 下找到 ${srcFiles.length} 个章节文件\n`);

// ── 确保目标目录存在 ───────────────────────────────────────────────────────
if (!existsSync(DEST_DIR)) {
  if (DRY_RUN) {
    log(`[dry-run] 将创建目录：${DEST_DIR}`);
  } else {
    mkdirSync(DEST_DIR, { recursive: true });
    log(`已创建目录：${DEST_DIR}`);
  }
}

// ── 逐章处理 ───────────────────────────────────────────────────────────────
let created = 0, skipped = 0, missing = 0;

for (const srcFile of srcFiles) {
  const chNum = parseInt(srcFile, 10);
  const meta  = chapterMap.get(chNum);

  if (!meta) {
    warn(`章节 ${chNum} 在 outline.json 中无对应条目，跳过`);
    missing++;
    continue;
  }

  const title    = meta.title.trim();
  const numStr   = String(chNum).padStart(2, "0");
  const destName = `${numStr}-${sanitizeFilename(title)}.md`;
  const existing = findExistingByNum(DEST_DIR, chNum);

  if (existing && !FORCE) {
    log(`  skip  ${destName}${existing !== destName ? `  (已存在：${existing})` : ""}`);
    skipped++;
    continue;
  }

  const srcBody        = readFileSync(join(CHAPTERS, srcFile), "utf8").trimEnd();
  const bodyWithoutH1  = srcBody.replace(/^#[^\n]*\n?/, "").trimStart();
  const content        = `# 第${chNum}章 ${title}\n\n${bodyWithoutH1}\n`;

  if (DRY_RUN) {
    log(`  [dry] write ${destName}`);
  } else {
    writeFileSync(join(DEST_DIR, destName), content, "utf8");
    log(`  write ${destName}`);
  }
  created++;
}

// ── 汇总 ───────────────────────────────────────────────────────────────────
log(`\n完成：新写入 ${created} 章，跳过 ${skipped} 章，outline 缺失 ${missing} 章`);

if (!DRY_RUN && created > 0) {
  log("\n正在重新生成 blog list JSON...");
  try {
    execSync("node scripts/generate-blog-list.mjs", { cwd: BLOG_ROOT, stdio: "inherit" });
  } catch {
    warn("generate-blog-list.mjs 执行失败，请手动运行");
  }
}

// ── 工具函数 ───────────────────────────────────────────────────────────────
function findExistingByNum(dir, num) {
  const prefix = String(num).padStart(2, "0") + "-";
  try {
    return readdirSync(dir).find((f) => f.startsWith(prefix) && f.endsWith(".md")) ?? null;
  } catch { return null; }
}

function sanitizeFilename(name) {
  return name.replace(/[\/\\:*?"<>|]/g, "").trim();
}

function log(msg)  { console.log(msg); }
function warn(msg) { console.warn("⚠ " + msg); }
function fatal(msg) { console.error("✖ " + msg); process.exit(1); }
