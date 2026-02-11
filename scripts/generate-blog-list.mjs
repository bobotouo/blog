/**
 * 构建时生成 public/blog-list.json，供静态站（GitHub Pages）博客列表页客户端请求。
 * 仅使用 Node 内置模块，解析 content/blog/*.md 的 frontmatter。
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentDir = join(__dirname, "..", "content", "blog");
const outPath = join(__dirname, "..", "public", "blog-list.json");

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const lines = match[1].trim().split(/\r?\n/);
  const obj = {};
  for (const line of lines) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    let key = line.slice(0, colon).trim();
    let value = line.slice(colon + 1).trim();
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
  }
  return obj;
}

const files = readdirSync(contentDir, { withFileTypes: true })
  .filter((e) => e.isFile() && (e.name.endsWith(".md") || e.name.endsWith(".mdx")))
  .map((e) => e.name);

const list = [];
for (const name of files) {
  const slug = name.replace(/\.(md|mdx)$/, "");
  const raw = readFileSync(join(contentDir, name), "utf-8");
  const fm = parseFrontmatter(raw);
  const date = fm.date ? (typeof fm.date === "string" ? fm.date : String(fm.date)) : "";
  list.push({
    _path: `/blog/${slug}`,
    title: fm.title ?? slug,
    date,
    description: fm.description ?? undefined,
    tags: fm.tags ?? undefined,
    coverImage: fm.coverImage ?? undefined,
  });
}

list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
writeFileSync(outPath, JSON.stringify(list), "utf-8");
console.log("[generate-blog-list] wrote", list.length, "posts to", outPath);
