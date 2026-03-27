import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as cheerio from "cheerio";

/** 本地调试：项目根目录 `.env.local` / `.env`（已被 .gitignore），不覆盖已有环境变量 */
function loadLocalEnvFiles() {
  for (const name of [".env.local", ".env"]) {
    const p = join(process.cwd(), name);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, "utf-8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}
loadLocalEnvFiles();

/** OpenAI 兼容：base 为 `https://api.openai.com` 或已含 `/v1` 的 DashScope 等 */
function resolveChatCompletionsUrl(baseUrl) {
  const b = baseUrl.replace(/\/$/, "");
  if (b.endsWith("/v1")) return `${b}/chat/completions`;
  return `${b}/v1/chat/completions`;
}

const BLOG_DIR = join(process.cwd(), "content", "blog");
const JIN10_URL = "https://www.jin10.com/";
const JIN10_FLASH_API = "https://flash-api.jin10.com/get_flash_list";
const JUEJIN_FOLLOWING_URL = "https://juejin.cn/following";
const JUEJIN_RECOMMENDED_NEWEST_URL = "https://juejin.cn/recommended?sort=newest";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
const HTTP_TIMEOUT_MS = Number(process.env.DAILY_DIGEST_HTTP_TIMEOUT_MS || 30000);

function nowDateParts() {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return {
    date: `${yyyy}-${mm}-${dd}`,
    dateTime: `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`,
    compact: `${yyyy}${mm}${dd}`,
  };
}

async function fetchHtml(url, headers = {}) {
  const res = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      ...headers,
    },
  });

  if (!res.ok) {
    throw new Error(`抓取失败: ${url} => ${res.status}`);
  }
  return res.text();
}

async function fetchJin10FlashPage(maxTime = "", cookie = "", vip = "1") {
  const params = new URLSearchParams({
    channel: "-8200",
    vip,
  });
  if (maxTime) params.set("max_time", maxTime);

  const res = await fetch(`${JIN10_FLASH_API}?${params.toString()}`, {
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    headers: {
      "user-agent": USER_AGENT,
      accept: "application/json, text/plain, */*",
      referer: "https://www.jin10.com/",
      "x-app-id": "bVBF4FyRTn5NJF5n",
      "x-version": "1.0.0",
      ...(cookie ? { cookie } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`金十快讯接口请求失败: ${res.status}`);
  }
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
}

async function fetchJin10FlashByLoadMore(times = 12, cookie = "") {
  const all = [];
  let pagesFetched = 0;
  for (const vip of ["1", "0"]) {
    let maxTime = "";
    for (let i = 0; i < times; i += 1) {
      const page = await fetchJin10FlashPage(maxTime, cookie, vip);
      if (!page.length) break;
      pagesFetched += 1;
      all.push(...page);
      maxTime = page[page.length - 1]?.time || "";
      if (!maxTime) break;
    }
  }
  const uniqueRows = [];
  const seen = new Set();
  for (const row of all) {
    const data = row?.data || {};
    const text = String(data.title || data.vip_title || data.content || "").replace(/\s+/g, " ").trim();
    const key = `${row?.id || ""}|${row?.time || ""}|${text}`;
    if (!text || seen.has(key)) continue;
    seen.add(key);
    uniqueRows.push(row);
  }
  const firstTime = uniqueRows[0]?.time || "";
  const lastTime = uniqueRows[uniqueRows.length - 1]?.time || "";
  return {
    rows: uniqueRows,
    pagesFetched,
    totalRows: uniqueRows.length,
    timeRange: firstTime && lastTime ? `${firstTime} -> ${lastTime}` : "",
  };
}

async function fetchJuejinFollowFeed(cookie, limit = 20, cursor = "0") {
  if (!cookie) {
    throw new Error("缺少 JUEJIN_COOKIE，无法抓取掘金关注流。");
  }

  const res = await fetch(
    "https://api.juejin.cn/recommend_api/v1/article/recommend_follow_feed",
    {
      method: "POST",
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
      headers: {
        "user-agent": USER_AGENT,
        "content-type": "application/json",
        accept: "application/json, text/plain, */*",
        origin: "https://juejin.cn",
        referer: "https://juejin.cn/following",
        cookie,
      },
      body: JSON.stringify({
        id_type: 2,
        sort_type: 200,
        cursor,
        limit,
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`掘金接口请求失败: ${res.status}`);
  }

  const json = await res.json();
  if (json?.err_no !== 0) {
    throw new Error(`掘金接口返回异常: ${json?.err_msg || "unknown error"}`);
  }
  return {
    data: Array.isArray(json?.data) ? json.data : [],
    cursor: String(json?.cursor || ""),
    hasMore: Boolean(json?.has_more),
  };
}

async function fetchJuejinNewestFeed(limit = 10, cursor = "0") {
  const res = await fetch(
    "https://api.juejin.cn/recommend_api/v1/article/recommend_all_feed",
    {
      method: "POST",
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
      headers: {
        "user-agent": USER_AGENT,
        "content-type": "application/json",
        accept: "application/json, text/plain, */*",
        origin: "https://juejin.cn",
        referer: JUEJIN_RECOMMENDED_NEWEST_URL,
      },
      body: JSON.stringify({
        id_type: 2,
        sort_type: 300, // newest
        cursor,
        limit,
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`掘金最新接口请求失败: ${res.status}`);
  }
  const json = await res.json();
  if (json?.err_no !== 0) {
    throw new Error(`掘金最新接口返回异常: ${json?.err_msg || "unknown error"}`);
  }
  return {
    data: Array.isArray(json?.data) ? json.data : [],
    cursor: String(json?.cursor || ""),
    hasMore: Boolean(json?.has_more),
  };
}

async function fetchJuejinNewestFeedPaged(pageLimit = 20, pages = 3) {
  const all = [];
  let cursor = "0";
  for (let i = 0; i < pages; i += 1) {
    const res = await fetchJuejinNewestFeed(pageLimit, cursor);
    if (!res.data.length) break;
    all.push(...res.data);
    cursor = res.cursor || cursor;
    if (!res.hasMore) break;
  }
  return all;
}

async function fetchJuejinFollowFeedPaged(cookie, pageLimit = 20, pages = 3) {
  if (!cookie) return [];
  const all = [];
  let cursor = "0";
  for (let i = 0; i < pages; i += 1) {
    const res = await fetchJuejinFollowFeed(cookie, pageLimit, cursor);
    if (!res.data.length) break;
    all.push(...res.data);
    cursor = res.cursor || cursor;
    if (!res.hasMore) break;
  }
  return all;
}

async function fetchJuejinPostSummary(articleId, cookie = "") {
  const res = await fetch(`https://juejin.cn/post/${articleId}`, {
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      ...(cookie ? { cookie } : {}),
    },
  });
  if (!res.ok) {
    return "详情抓取失败，建议手动打开原文查看。";
  }
  const html = await res.text();
  const $ = cheerio.load(html);
  const metaDesc =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    "";
  const desc = String(metaDesc).replace(/\s+/g, " ").trim();
  if (desc) return desc.length > 100 ? `${desc.slice(0, 100)}...` : desc;

  const text = $("article p")
    .slice(0, 3)
    .map((_, el) => $(el).text().replace(/\s+/g, " ").trim())
    .get()
    .filter(Boolean)
    .join(" ");
  if (text) return text.length > 100 ? `${text.slice(0, 100)}...` : text;
  return "已打开详情页，但未提取到可靠摘要。";
}

function normalizeJuejinFeedItem(item) {
  const info = item?.article_info || item?.item_info?.article_info || null;
  const articleId = String(info?.article_id || "").trim();
  const title = String(info?.title || "").replace(/\s+/g, " ").trim();
  const ctimeRaw = info?.ctime;
  const ctimeMs =
    typeof ctimeRaw === "number"
      ? ctimeRaw < 1e12
        ? ctimeRaw * 1000
        : ctimeRaw
      : Number(ctimeRaw) < 1e12
        ? Number(ctimeRaw || 0) * 1000
        : Number(ctimeRaw || 0);
  if (!articleId || !title) return null;
  return {
    articleId,
    title,
    link: `https://juejin.cn/post/${articleId}`,
    ctimeMs: Number.isFinite(ctimeMs) ? ctimeMs : 0,
  };
}

function isAiOrFlutter(title) {
  return /(AI|AIGC|大模型|LLM|Agent|RAG|Flutter|Dart)/i.test(title);
}

function collectUsedJuejinArticleIds() {
  const used = new Set();
  const files = readdirSync(BLOG_DIR, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => e.name);

  for (const file of files) {
    const content = readFileSync(join(BLOG_DIR, file), "utf-8");
    const matches = content.matchAll(/https:\/\/juejin\.cn\/post\/(\d{6,})/g);
    for (const m of matches) used.add(m[1]);
  }
  return used;
}

function uniqueByArticleId(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (!item || seen.has(item.articleId)) continue;
    seen.add(item.articleId);
    out.push(item);
  }
  return out;
}

function uniqLimit(items, limit = 12) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = (item || "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
    if (out.length >= limit) break;
  }
  return out;
}

function summarizeByKeywords(lines, dict) {
  const stats = dict.map((g) => ({ ...g, score: 0 }));
  for (const line of lines) {
    for (const group of stats) {
      if (group.words.some((w) => line.includes(w))) {
        group.score += 1;
      }
    }
  }
  return stats
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => `- ${x.label}：相关信号 ${x.score} 条`);
}

function pickJin10Headlines(html) {
  const $ = cheerio.load(html);
  const candidates = [];
  $("strong, h1, h2, h3, h4, a, p").each((_, el) => {
    const t = $(el).text().replace(/\s+/g, " ").trim();
    if (!t) return;
    if (t.length < 10 || t.length > 80) return;
    if (
      /登录|注册|下载|设置|分享收藏|详情复制|推荐阅读|VIP|举报|专区|联系我们|隐私|声明|版权所有|TradingHero|公众号|抖音|微博|B站/.test(
        t,
      )
    )
      return;
    candidates.push(t);
  });
  const keyworded = candidates.filter((t) =>
    /(黄金|白银|原油|布伦特|WTI|加息|通胀|外交|伊朗|以色列|股|期货|美元|欧元|央行|投资|收购)/.test(t),
  );
  return uniqLimit(keyworded.length >= 6 ? keyworded : candidates, 12);
}

function pickJin10HeadlinesFromRows(rows) {
  const out = [];
  for (const row of rows) {
    const data = row?.data || {};
    const text = String(data.title || data.vip_title || data.content || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    if (text.length < 10 || text.length > 140) continue;
    if (
      /VIP专享|解锁|登录|注册|下载|联系我们|举报|隐私|版权|ICP备|公网安备|证书|声明|专区/.test(
        text,
      )
    )
      continue;

    const content = row?.time ? `[${row.time}] ${text}` : text;
    out.push(content);
  }
  // 全量展示：不再做关键词筛选与条数截断，仅保留基础去重
  return uniqLimit(out, Number.POSITIVE_INFINITY);
}

function buildFinanceMarkdown(dateTime, lines, stats = {}) {
  const date = dateTime.slice(0, 10);
  const themes = summarizeByKeywords(lines, [
    { label: "地缘与外交风险", words: ["伊朗", "以色列", "外交", "军事", "冲突", "通牒"] },
    { label: "能源价格波动", words: ["原油", "布伦特", "WTI", "天然气"] },
    { label: "贵金属与避险情绪", words: ["黄金", "白银", "现货黄金"] },
    { label: "央行与利率预期", words: ["央行", "加息", "通胀", "高盛"] },
    { label: "企业与资本动作", words: ["投资", "收购", "涨停", "公告", "伯克希尔"] },
  ]);

  return `---
title: 金融日报 ${date}
date: ${dateTime}
description: 自动抓取金十数据快讯并生成的每日金融局势摘要
tags:
  - 金融
  - 宏观
  - 每日简报
---
> 数据来源：${JIN10_URL}
> 抓取方式：市场快讯接口分页加载（模拟点击“加载更多”12次）
> 生成时间：${dateTime}
> 抓取统计：${stats.pagesFetched || 0} 页 / ${stats.totalRows || 0} 条，时间区间 ${stats.timeRange || "未知"}

## 今日要点
${themes.length > 0 ? themes.join("\n") : "- 市场快讯分布较分散，暂无单一主线压倒性占优。"}

## 重点快讯摘录
${lines.map((x) => `- ${x}`).join("\n")}

## 观察与解读
- 当前市场的主导变量仍以地缘政治与能源价格联动为主。
- 若原油维持高位，通胀预期可能继续抬升，进而影响后续货币政策节奏。
- 风险资产短期可能呈现高波动，建议持续关注事件驱动与流动性变化。
`;
}

function buildTechMarkdown(dateTime, selectedFromNewest, selectedFromFollowing, usedCookie) {
  const date = dateTime.slice(0, 10);
  const lines = [...selectedFromNewest, ...selectedFromFollowing].map(
    (x) => `${x.title} ${x.summary}`,
  );
  const themes = summarizeByKeywords(lines, [
    { label: "前端工程化", words: ["Vue", "React", "Next", "Nuxt", "Vite", "Webpack"] },
    { label: "AI 与智能开发", words: ["AI", "Agent", "LLM", "大模型", "RAG", "Copilot"] },
    { label: "后端与架构", words: ["Node", "Go", "Java", "微服务", "架构", "数据库"] },
    { label: "性能与体验优化", words: ["性能", "优化", "缓存", "渲染", "首屏"] },
    { label: "Flutter 生态", words: ["Flutter", "Dart"] },
  ]);

  return `---
title: 技术日报 ${date}
date: ${dateTime}
description: 自动抓取掘金关注页并生成的每日技术摘要
tags:
  - 技术
  - 掘金
  - 每日速览
---
> 数据来源：${JUEJIN_FOLLOWING_URL}
> 参考来源：${JUEJIN_RECOMMENDED_NEWEST_URL}
> 生成时间：${dateTime}
> 抓取方式：${usedCookie ? "使用 JUEJIN_COOKIE 抓取关注页" : "未配置登录 Cookie，抓取到公开可见内容"}

## 今日技术主题
${themes.length > 0 ? themes.join("\n") : "- 今日主题较分散，建议按兴趣挑选深入阅读。"}

## 综合-最新（前10，筛 AI/Flutter）
${
  selectedFromNewest.length > 0
    ? selectedFromNewest
        .map((x) => `- ${x.title}（${x.link}）\n  - 摘要：${x.summary}`)
        .join("\n")
    : "- 前10条里未筛到 AI/Flutter 相关文章。"
}

## 关注补充（未使用且不过旧）
${
  selectedFromFollowing.length > 0
    ? selectedFromFollowing
        .map((x) => `- ${x.title}（${x.link}）\n  - 摘要：${x.summary}`)
        .join("\n")
    : "- 关注流没有可补充的新文章（可能都已使用或较旧）。"
}

## 学习建议
- 先选择 1 篇偏“原理”与 1 篇偏“实战”的文章做组合学习。
- 阅读时同步记录可迁移到当前项目的实践点（如构建优化、组件抽象、测试策略）。
- 将今天的关键结论整理为团队可复用的 checklist 或脚手架模板。
`;
}

function dailyFilename(baseName) {
  return join(BLOG_DIR, `${baseName}.md`);
}

function cleanupSameDayVariants(compact) {
  const files = readdirSync(BLOG_DIR);
  const variantPattern = new RegExp(`^${compact}-(finance|tech)-digest-\\d+\\.md$`);
  for (const name of files) {
    if (!variantPattern.test(name)) continue;
    try {
      unlinkSync(join(BLOG_DIR, name));
    } catch (_) {
      // 忽略清理失败，避免影响主流程
    }
  }
}

function stripMarkdownFence(text) {
  const s = String(text || "").trim();
  const wrapped = s.match(/^```(?:markdown|md)?\s*([\s\S]*?)\s*```$/i);
  return wrapped ? wrapped[1].trim() : s;
}

/** 兼容部分推理模型输出的思考块，避免污染 Markdown 正文 */
function stripThinkBlocks(text) {
  const s = String(text || "");
  return s
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:thinking|reasoning)\s*[\s\S]*?```/gi, "")
    .trim();
}

function hasValidFrontmatter(markdown) {
  return /^---\r?\n[\s\S]*?\r?\n---\r?\n/.test(String(markdown || ""));
}

function includesAllSections(markdown, sectionTitles = []) {
  const s = String(markdown || "");
  return sectionTitles.every((title) => s.includes(`## ${title}`));
}

function extractFrontmatterTitle(markdown) {
  const m = String(markdown || "").match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return "";
  const titleLine = m[1]
    .split(/\r?\n/)
    .find((line) => line.trim().toLowerCase().startsWith("title:"));
  if (!titleLine) return "";
  return titleLine
    .split(":")
    .slice(1)
    .join(":")
    .trim()
    .replace(/^["']|["']$/g, "");
}

function buildFinanceLlmPrompt(dateTime, lines, stats) {
  const date = dateTime.slice(0, 10);
  return `请基于下面金融快讯，生成一篇中文 Markdown 日报，要求：
1) 必须输出完整 Markdown，包含 frontmatter（title/date/description/tags）。
1.1) frontmatter 的 title 必须严格为：金融日报 ${date}
2) 结构包含：今日结论、关键驱动、风险提示、重点快讯摘录。
3) 语气专业、克制，不夸张，不编造数据；如果信息不足要明确说明。
4) 在“重点快讯摘录”中保留原始时间与要点，控制在 20-40 条重点。
5) 不要输出与 Markdown 无关的解释文本。

生成时间：${dateTime}
抓取统计：${stats.pagesFetched} 页 / ${stats.totalRows} 条，时间区间 ${stats.timeRange}
来源：${JIN10_URL}

快讯列表：
${lines.map((x, i) => `${i + 1}. ${x}`).join("\n")}
`;
}

function buildTechLlmPrompt(dateTime, newest, following, usedCookie) {
  const date = dateTime.slice(0, 10);
  return `请基于下面技术文章信息，生成一篇中文 Markdown 日报，要求：
1) 必须输出完整 Markdown，包含 frontmatter（title/date/description/tags）。
1.1) frontmatter 的 title 必须严格为：技术日报 ${date}
2) 结构包含：今日结论、技术主题、推荐阅读（按优先级排序）、可落地方向。
3) 每条推荐阅读给出：标题、链接、一句话价值说明。
4) 语气偏工程实践，避免空话，不编造未提供的事实。
5) 不要输出与 Markdown 无关的解释文本。

生成时间：${dateTime}
数据源：${JUEJIN_FOLLOWING_URL}
参考源：${JUEJIN_RECOMMENDED_NEWEST_URL}
抓取方式：${usedCookie ? "使用 JUEJIN_COOKIE 抓取关注页 + 综合最新" : "仅综合最新"}

综合最新：
${newest.length ? newest.map((x, i) => `${i + 1}. ${x.title}\n链接: ${x.link}\n摘要: ${x.summary}`).join("\n\n") : "无"}

关注补充：
${following.length ? following.map((x, i) => `${i + 1}. ${x.title}\n链接: ${x.link}\n摘要: ${x.summary}`).join("\n\n") : "无"}
`;
}

async function generateMarkdownByLlm(
  systemPrompt,
  userPrompt,
  fallbackMarkdown,
  requiredSections = [],
  expectedTitle = "",
) {
  const apiKey = process.env.OPENAI_API_KEY || "";
  const enabled = (process.env.DAILY_DIGEST_ENABLE_LLM || "").toLowerCase() === "true";
  if (!enabled || !apiKey) return fallbackMarkdown;

  const model = process.env.DAILY_DIGEST_LLM_MODEL || "gpt-4o-mini";
  const llmBaseUrl = (process.env.DAILY_DIGEST_LLM_BASE_URL || "https://api.openai.com").replace(/\/$/, "");
  const chatUrl = resolveChatCompletionsUrl(llmBaseUrl);
  console.log(`[daily-digest] LLM enabled, model=${model}, base=${llmBaseUrl}`);

  try {
    const res = await fetch(chatUrl, {
      method: "POST",
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: [
              "你是日报写作助手，只输出可直接发布的中文 Markdown。",
              "禁止输出思考过程、解释、说明、致歉、代码块围栏。",
              "禁止输出 <think>...</think> 或任何推理痕迹。",
              "输出必须以 frontmatter 开头，并严格遵循用户给定结构。",
              systemPrompt,
            ].join("\n"),
          },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(`[daily-digest] LLM 生成失败(${res.status})，回退模板。${text ? ` ${text.slice(0, 200)}` : ""}`);
      return fallbackMarkdown;
    }

    const json = await res.json();
    const out = json?.choices?.[0]?.message?.content;
    const cleaned = stripMarkdownFence(stripThinkBlocks(out));
    if (!cleaned) return fallbackMarkdown;
    if (!hasValidFrontmatter(cleaned)) {
      console.warn("[daily-digest] LLM 输出缺少 frontmatter，回退模板。");
      return fallbackMarkdown;
    }
    if (!includesAllSections(cleaned, requiredSections)) {
      console.warn("[daily-digest] LLM 输出缺少必需章节，回退模板。");
      return fallbackMarkdown;
    }
    if (expectedTitle && extractFrontmatterTitle(cleaned) !== expectedTitle) {
      console.warn(`[daily-digest] LLM 输出标题不符合要求(期望: ${expectedTitle})，回退模板。`);
      return fallbackMarkdown;
    }
    if (cleaned.includes("<think>")) {
      console.warn("[daily-digest] LLM 输出包含 think 标签，回退模板。");
      return fallbackMarkdown;
    }
    return cleaned;
  } catch (err) {
    console.warn("[daily-digest] LLM 调用异常，回退模板：", err?.message || err);
    return fallbackMarkdown;
  }
}

async function run() {
  mkdirSync(BLOG_DIR, { recursive: true });
  const { dateTime, compact } = nowDateParts();

  const jin10Cookie = process.env.JIN10_COOKIE || "";
  const jin10Result = await fetchJin10FlashByLoadMore(12, jin10Cookie);
  const financeLines = pickJin10HeadlinesFromRows(jin10Result.rows);
  if (financeLines.length === 0) {
    throw new Error("未从金十市场快讯提取到有效内容。");
  }

  const juejinCookie = process.env.JUEJIN_COOKIE || "";
  const usedIds = collectUsedJuejinArticleIds();
  const newestFeed = await fetchJuejinNewestFeedPaged(20, 3);
  const newestTop10 = uniqueByArticleId(newestFeed.map(normalizeJuejinFeedItem).filter(Boolean)).slice(
    0,
    10,
  );
  const newestSelected = newestTop10.filter((x) => isAiOrFlutter(x.title));
  for (const item of newestSelected) {
    item.summary = await fetchJuejinPostSummary(item.articleId, juejinCookie);
  }

  let followingSelected = [];
  if (juejinCookie) {
    const followFeed = await fetchJuejinFollowFeedPaged(juejinCookie, 20, 3);
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const candidates = uniqueByArticleId(followFeed.map(normalizeJuejinFeedItem).filter(Boolean))
      .filter((x) => !usedIds.has(x.articleId))
      .filter((x) => !newestSelected.some((n) => n.articleId === x.articleId))
      .filter((x) => (x.ctimeMs ? now - x.ctimeMs <= sevenDaysMs : true))
      .slice(0, 5);

    for (const item of candidates) {
      item.summary = await fetchJuejinPostSummary(item.articleId, juejinCookie);
    }
    followingSelected = candidates;
  }

  if (newestSelected.length === 0 && followingSelected.length === 0) {
    throw new Error("未筛选到可用的掘金文章（AI/Flutter 或关注新增）。");
  }

  const financePath = dailyFilename(`${compact}-finance-digest`);
  const techPath = dailyFilename(`${compact}-tech-digest`);

  const financeFallback = buildFinanceMarkdown(dateTime, financeLines, jin10Result);
  const techFallback = buildTechMarkdown(dateTime, newestSelected, followingSelected, Boolean(juejinCookie));
  const financeFinal = await generateMarkdownByLlm(
    "你是资深金融编辑，负责将快讯整理成可发布的每日简报。",
    buildFinanceLlmPrompt(dateTime, financeLines.slice(0, 120), jin10Result),
    financeFallback,
    ["今日结论", "关键驱动", "风险提示", "重点快讯摘录"],
    `金融日报 ${dateTime.slice(0, 10)}`,
  );
  const techFinal = await generateMarkdownByLlm(
    "你是资深技术内容编辑，负责把文章素材整理为可发布的技术日报。",
    buildTechLlmPrompt(dateTime, newestSelected, followingSelected, Boolean(juejinCookie)),
    techFallback,
    ["今日结论", "技术主题", "推荐阅读", "可落地方向"],
    `技术日报 ${dateTime.slice(0, 10)}`,
  );

  cleanupSameDayVariants(compact);
  writeFileSync(financePath, financeFinal, "utf-8");
  writeFileSync(techPath, techFinal, "utf-8");

  console.log("[daily-digest] 生成完成:");
  console.log(" -", financePath);
  console.log(" -", techPath);
}

run().catch((err) => {
  console.error("[daily-digest] 失败:", err?.message || err);
  process.exit(1);
});
