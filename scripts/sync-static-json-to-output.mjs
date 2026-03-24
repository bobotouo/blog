#!/usr/bin/env node
/**
 * 将 public 下构建脚本产出的 JSON 同步到 .output/public。
 * 目的：静态部署刷新时始终可读到 JSON（尤其是中文路径章节）。
 */
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const cwd = process.cwd();
const publicDir = join(cwd, "public");
const outputPublicDir = join(cwd, ".output", "public");

if (!existsSync(publicDir)) {
  console.log("[sync-static-json] skip: public/ does not exist");
  process.exit(0);
}

if (!existsSync(outputPublicDir)) {
  console.log("[sync-static-json] skip: .output/public does not exist");
  process.exit(0);
}

const copyTargets = [
  "blog-list.json",
  "ai-fiction-list.json",
  "ai-fiction-series.json",
  "snapshots-list.json",
  "blog",
  "ai-fiction",
  "snapshots",
];

const copied = [];
for (const rel of copyTargets) {
  const src = join(publicDir, rel);
  const dest = join(outputPublicDir, rel);
  if (!existsSync(src)) continue;
  const parent = join(dest, "..");
  mkdirSync(parent, { recursive: true });
  cpSync(src, dest, { recursive: true, force: true });
  copied.push(rel);
}

const top = readdirSync(outputPublicDir);
console.log(
  `[sync-static-json] copied ${copied.length} target(s): ${copied.join(", ") || "(none)"}`,
);
console.log(`[sync-static-json] .output/public entries: ${top.slice(0, 12).join(", ")}`);
