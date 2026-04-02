/**
 * 构建时生成 public/blog-list.json 与 public/blog/<slug>.json，
 * 供静态站（GitHub Pages）博客列表页与文章页客户端请求。
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const blogJsonDir = join(publicDir, "blog");
const fictionJsonDir = join(publicDir, "ai-fiction");

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

function collectMarkdownSlugs(dir, prefix = "") {
  const slugs = [];
  let entries = [];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return slugs;
  }
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      slugs.push(...collectMarkdownSlugs(abs, rel));
      continue;
    }
    if (entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".mdx"))) {
      slugs.push(rel.replace(/\.(md|mdx)$/, ""));
    }
  }
  return slugs;
}

function readMarkdownBySlug(contentDir, slug) {
  try {
    return readFileSync(join(contentDir, `${slug}.md`), "utf-8");
  } catch {
    return readFileSync(join(contentDir, `${slug}.mdx`), "utf-8");
  }
}

/** 有 frontmatter 时取正文；无 frontmatter 时整篇为正文（章节常见） */
function extractBodyMarkdown(raw) {
  const m = raw.match(/^---\r?\n[\s\S]*?\r?\n---\s*([\s\S]*)$/);
  if (m) return (m[1] ?? "").trim();
  return raw.trim();
}

function firstNonEmptyLine(text) {
  const line = text.split(/\r?\n/).find((l) => l.trim());
  if (!line) return "";
  // 去掉 Markdown 标题标记（# ## ### 等）
  return line.trim().replace(/^#{1,6}\s+/, "");
}

/** 同小说内章节排序：优先文件名前缀数字，否则中文 locale 自然序 */
function compareChapterFileName(a, b) {
  const fa = a.split("/").pop() || a;
  const fb = b.split("/").pop() || b;
  const na = fa.match(/^(\d+)/)?.[1];
  const nb = fb.match(/^(\d+)/)?.[1];
  if (na && nb && na !== nb) return Number(na) - Number(nb);
  return fa.localeCompare(fb, "zh-CN", { numeric: true });
}

function generateArticleSet({ contentFolder, routeBase, listName, detailDir }) {
  const contentDir = join(__dirname, "..", "content", contentFolder);
  const slugs = collectMarkdownSlugs(contentDir);

  try {
    mkdirSync(detailDir, { recursive: true });
  } catch {}

  const list = [];
  for (const slug of slugs) {
    const raw = readMarkdownBySlug(contentDir, slug);
    const fm = parseFrontmatter(raw);
    const date = fm.date ? (typeof fm.date === "string" ? fm.date : String(fm.date)) : "";
    const meta = {
      _path: `/${routeBase}/${slug}`,
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
    mkdirSync(dirname(join(detailDir, `${slug}.json`)), { recursive: true });
    writeFileSync(join(detailDir, `${slug}.json`), JSON.stringify(article), "utf-8");
  }

  list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  writeFileSync(join(publicDir, listName), JSON.stringify(list), "utf-8");
  console.log("[generate-blog-list] wrote", list.length, `posts to ${listName} and ${routeBase}/<slug>.json`);
}

/** 与 utils/fiction-status.ts 的 trimFictionStatus 一致：手填文案，仅 trim */
function trimFictionStatus(raw) {
  if (raw == null || raw === "") return undefined;
  const t = String(raw).trim();
  return t.length > 0 ? t : undefined;
}

function generateAiFictionSet() {
  const contentDir = join(__dirname, "..", "content", "ai-fiction");
  const slugs = collectMarkdownSlugs(contentDir);
  try {
    mkdirSync(fictionJsonDir, { recursive: true });
  } catch {}

  const chapters = [];
  const summariesByNovel = new Map();

  for (const slug of slugs) {
    const raw = readMarkdownBySlug(contentDir, slug);
    const fm = parseFrontmatter(raw);
    const date = fm.date ? (typeof fm.date === "string" ? fm.date : String(fm.date)) : "";
    const bodyMd = extractBodyMarkdown(raw);
    let bodyHtml = marked.parse(bodyMd, { async: false });
    bodyHtml = rewriteAssetPaths(typeof bodyHtml === "string" ? bodyHtml : String(bodyHtml));

    const isSummary = /(^|\/)summary$/.test(slug);
    const novelSlug = slug.includes("/") ? slug.slice(0, slug.lastIndexOf("/")) : slug;
    const novelName = novelSlug.split("/").pop() || novelSlug;

    if (isSummary) {
      summariesByNovel.set(novelSlug, {
        novelSlug,
        novelName,
        title: fm.novelTitle ?? fm.title ?? novelName,
        description: fm.description ?? "",
        coverImage: rewriteAssetInMeta(fm.coverImage) ?? fm.coverImage,
        tags: fm.tags ?? undefined,
        summaryBody: bodyHtml,
        status: trimFictionStatus(fm.status),
      });
      continue;
    }

    const chapterFile = slug.split("/").pop() || slug;
    const title = fm.title ?? (firstNonEmptyLine(bodyMd) || chapterFile);

    const meta = {
      _path: `/ai-fiction/${slug}`,
      title,
      date,
      description: fm.description ?? undefined,
      tags: fm.tags ?? undefined,
      coverImage: rewriteAssetInMeta(fm.coverImage) ?? fm.coverImage,
      novelSlug,
      novelName,
      chapterFile,
    };
    chapters.push(meta);
    const article = { ...meta, body: bodyHtml };
    mkdirSync(dirname(join(fictionJsonDir, `${slug}.json`)), { recursive: true });
    writeFileSync(join(fictionJsonDir, `${slug}.json`), JSON.stringify(article), "utf-8");
  }

  chapters.sort((a, b) => {
    const novelCmp = a.novelSlug.localeCompare(b.novelSlug, "zh-CN");
    if (novelCmp !== 0) return novelCmp;
    return compareChapterFileName(a.chapterFile, b.chapterFile);
  });
  writeFileSync(join(publicDir, "ai-fiction-list.json"), JSON.stringify(chapters), "utf-8");

  const chaptersByNovel = new Map();
  for (const chapter of chapters) {
    const list = chaptersByNovel.get(chapter.novelSlug) || [];
    list.push(chapter);
    chaptersByNovel.set(chapter.novelSlug, list);
  }

  const series = Array.from(chaptersByNovel.entries()).map(([novelSlug, list]) => {
    const summary = summariesByNovel.get(novelSlug);
    const sorted = [...list].sort((a, b) => compareChapterFileName(a.chapterFile, b.chapterFile));
    const first = sorted[0];
    const latest = sorted[sorted.length - 1];
    const chapterList = sorted.map((c) => ({
      _path: c._path,
      title: c.title,
      date: c.date,
      chapterFile: c.chapterFile,
    }));

    // 完整 bundle：供小说详情页 / 章节导航使用（含 chapters + summaryBody）
    const bundle = {
      novelSlug,
      novelName: summary?.title ?? first.novelName,
      indexPath: `/ai-fiction/${novelSlug}`,
      description: summary?.description ?? "",
      coverImage: summary?.coverImage ?? first.coverImage,
      tags: summary?.tags ?? undefined,
      summaryBody: summary?.summaryBody ?? "",
      status: summary?.status,
      chapterCount: sorted.length,
      chapters: chapterList,
      firstChapterPath: first._path,
      latestChapterPath: latest._path,
      latestChapterTitle: latest.title,
      latestChapterDate: latest.date,
    };

    // 写 per-novel bundle 文件（按 novelSlug 路径存放）
    const bundleDir = join(fictionJsonDir, novelSlug);
    mkdirSync(bundleDir, { recursive: true });
    writeFileSync(join(bundleDir, "bundle.json"), JSON.stringify(bundle), "utf-8");

    // lite 版：供列表页使用，不含 chapters / summaryBody
    return {
      novelSlug: bundle.novelSlug,
      novelName: bundle.novelName,
      indexPath: bundle.indexPath,
      description: bundle.description,
      coverImage: bundle.coverImage,
      tags: bundle.tags,
      status: bundle.status,
      chapterCount: bundle.chapterCount,
      firstChapterPath: bundle.firstChapterPath,
      latestChapterPath: bundle.latestChapterPath,
      latestChapterTitle: bundle.latestChapterTitle,
      latestChapterDate: bundle.latestChapterDate,
    };
  });
  series.sort((a, b) => (b.latestChapterDate || "").localeCompare(a.latestChapterDate || ""));
  writeFileSync(join(publicDir, "ai-fiction-series.json"), JSON.stringify(series), "utf-8");

  console.log(
    "[generate-blog-list] wrote",
    chapters.length,
    "chapters to ai-fiction-list.json and ai-fiction/<slug>.json,",
    series.length,
    "series to ai-fiction-series.json + per-novel bundle.json",
  );
}

generateArticleSet({
  contentFolder: "blog",
  routeBase: "blog",
  listName: "blog-list.json",
  detailDir: blogJsonDir,
});

generateAiFictionSet();

// 快照列表 + 快照详情静态 JSON（静态站 snapshots 列表/详情页客户端回退）
const snapshotsDir = join(__dirname, "..", "content", "snapshots");
const snapshotsJsonDir = join(publicDir, "snapshots");
const snapshotFiles = (() => {
  try {
    return readdirSync(snapshotsDir, { withFileTypes: true })
      .filter((e) => e.isFile() && (e.name.endsWith(".md") || e.name.endsWith(".mdx")))
      .map((e) => e.name);
  } catch {
    return [];
  }
})();

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
