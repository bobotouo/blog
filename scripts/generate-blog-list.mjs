/**
 * 构建时生成 public/blog-list.json 与 public/blog/<slug>.json，
 * 供静态站（GitHub Pages）博客列表页与文章页客户端请求。
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentDir = join(__dirname, "..", "content", "blog");
const publicDir = join(__dirname, "..", "public");
const blogJsonDir = join(publicDir, "blog");

// 静态站 base（如 /blog/）下，将 /uploads /images 等资源路径加上 base 前缀，否则图片 404
const staticBase = process.env.NUXT_APP_BASE_URL || "";
const assetPrefix = staticBase.replace(/\/$/, ""); // e.g. "/blog"

function rewriteAssetPaths(html) {
  if (!assetPrefix || typeof html !== "string") return html;
  return html
    .replace(/src="\/uploads\//g, `src="${assetPrefix}/uploads/`)
    .replace(/href="\/uploads\//g, `href="${assetPrefix}/uploads/`)
    .replace(/src="\/images\//g, `src="${assetPrefix}/images/`)
    .replace(/href="\/images\//g, `href="${assetPrefix}/images/`);
}

function rewriteAssetInMeta(value) {
  if (!assetPrefix || value == null) return value;
  if (typeof value === "string" && (value.startsWith("/uploads/") || value.startsWith("/images/"))) {
    return `${assetPrefix}${value}`;
  }
  if (Array.isArray(value)) {
    return value.map((v) => (typeof v === "string" && (v.startsWith("/uploads/") || v.startsWith("/images/")) ? `${assetPrefix}${v}` : v));
  }
  return value;
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const lines = match[1].trim().split(/\r?\n/);
  const obj = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const colon = line.indexOf(":");
    if (colon === -1) {
      i++;
      continue;
    }
    let key = line.slice(0, colon).trim();
    let value = line.slice(colon + 1).trim();
    if (value === "" && /^\s+-\s+/.test(lines[i + 1] || "")) {
      const arr = [];
      i++;
      while (i < lines.length && /^\s+-\s+/.test(lines[i])) {
        arr.push(lines[i].replace(/^\s+-\s+/, "").trim().replace(/^["']|["']$/g, ""));
        i++;
      }
      obj[key] = arr;
      continue;
    }
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/\\"/g, '"');
    } else if (value.startsWith("[") && value.endsWith("]")) {
      try {
        value = JSON.parse(value);
      } catch {
        value = value;
      }
    } else if (value === "true") value = true;
    else if (value === "false") value = false;
    obj[key] = value;
    i++;
  }
  return obj;
}

const files = readdirSync(contentDir, { withFileTypes: true })
  .filter((e) => e.isFile() && (e.name.endsWith(".md") || e.name.endsWith(".mdx")))
  .map((e) => e.name);

try {
  mkdirSync(blogJsonDir, { recursive: true });
} catch {}

const list = [];
for (const name of files) {
  const slug = name.replace(/\.(md|mdx)$/, "");
  const raw = readFileSync(join(contentDir, name), "utf-8");
  const fm = parseFrontmatter(raw);
  const date = fm.date ? (typeof fm.date === "string" ? fm.date : String(fm.date)) : "";
  const meta = {
    _path: `/blog/${slug}`,
    title: fm.title ?? slug,
    date,
    description: fm.description ?? undefined,
    tags: fm.tags ?? undefined,
    coverImage: rewriteAssetInMeta(fm.coverImage) ?? fm.coverImage,
  };
  list.push(meta);

  const bodyMatch = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)/);
  const bodyMd = bodyMatch ? bodyMatch[1].trim() : "";
  let bodyHtml = marked.parse(bodyMd, { async: false });
  bodyHtml = rewriteAssetPaths(typeof bodyHtml === "string" ? bodyHtml : String(bodyHtml));
  const article = { ...meta, body: bodyHtml };
  writeFileSync(join(blogJsonDir, `${slug}.json`), JSON.stringify(article), "utf-8");
}

list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
writeFileSync(join(publicDir, "blog-list.json"), JSON.stringify(list), "utf-8");
console.log("[generate-blog-list] wrote", list.length, "posts to blog-list.json and blog/<slug>.json");

// 快照列表 + 快照详情静态 JSON（静态站 snapshots 列表/详情页客户端回退）
const snapshotsDir = join(__dirname, "..", "content", "snapshots");
const snapshotsJsonDir = join(publicDir, "snapshots");
const snapshotFiles = readdirSync(snapshotsDir, { withFileTypes: true })
  .filter((e) => e.isFile() && (e.name.endsWith(".md") || e.name.endsWith(".mdx")))
  .map((e) => e.name);

try {
  mkdirSync(snapshotsJsonDir, { recursive: true });
} catch {}

const snapshotsList = [];
for (const name of snapshotFiles) {
  const slug = name.replace(/\.(md|mdx)$/, "");
  const raw = readFileSync(join(snapshotsDir, name), "utf-8");
  const fm = parseFrontmatter(raw);
  const date = fm.date ? (typeof fm.date === "string" ? fm.date : String(fm.date)) : "";
  const meta = {
    _path: `/snapshots/${slug}`,
    title: fm.title ?? slug,
    date,
    summary: fm.summary ?? undefined,
    images: rewriteAssetInMeta(fm.images) ?? fm.images,
    location: fm.location ?? undefined,
    mood: fm.mood ?? undefined,
    tags: fm.tags ?? undefined,
  };
  snapshotsList.push(meta);

  const bodyMatch = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)/);
  const bodyMd = bodyMatch ? bodyMatch[1].trim() : "";
  let bodyHtml = marked.parse(bodyMd, { async: false });
  bodyHtml = rewriteAssetPaths(typeof bodyHtml === "string" ? bodyHtml : String(bodyHtml));
  const detail = { ...meta, body: bodyHtml };
  writeFileSync(join(snapshotsJsonDir, `${slug}.json`), JSON.stringify(detail), "utf-8");
}
snapshotsList.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
writeFileSync(join(publicDir, "snapshots-list.json"), JSON.stringify(snapshotsList), "utf-8");
console.log("[generate-blog-list] wrote", snapshotsList.length, "snapshots to snapshots-list.json and snapshots/<slug>.json");
