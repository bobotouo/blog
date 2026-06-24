#!/usr/bin/env node
/** 构建时把 giscus 组件脚本放到 public/，评论页可从同源 CDN 加载 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const moduleSrc = join(root, "node_modules", "giscus", "dist", "giscus.mjs");
const moduleDest = join(publicDir, "giscus-widget.mjs");

mkdirSync(publicDir, { recursive: true });

if (existsSync(moduleSrc)) {
  copyFileSync(moduleSrc, moduleDest);
  console.log("[vendor-giscus] copied giscus-widget.mjs → public/");
} else {
  console.warn("[vendor-giscus] skip: node_modules/giscus/dist/giscus.mjs not found");
}

try {
  const res = await fetch("https://giscus.app/client.js", {
    signal: AbortSignal.timeout(15000),
  });
  if (res.ok) {
    writeFileSync(join(publicDir, "giscus-client.js"), await res.text(), "utf-8");
    console.log("[vendor-giscus] mirrored giscus-client.js → public/");
  } else {
    console.warn("[vendor-giscus] skip client.js mirror:", res.status);
  }
} catch (err) {
  console.warn("[vendor-giscus] skip client.js mirror:", err?.message || err);
}
