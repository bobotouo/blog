import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as cheerio from "cheerio";

/** 本地调试：读取 .env.local / .env，不覆盖已有环境变量 */
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

const BLOG_DIR = join(process.cwd(), "content", "blog");
const HTTP_TIMEOUT_MS = Number(process.env.DAILY_DIGEST_HTTP_TIMEOUT_MS || 30000);
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// twitter-api45.p.rapidapi.com 的通用请求函数
async function rapidApiFetch(rapidApiKey, rapidApiHost, path) {
  const url = `https://${rapidApiHost}${path}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-key": rapidApiKey,
      "x-rapidapi-host": rapidApiHost,
    },
  });
  if (!res.ok) {
    throw new Error(`RapidAPI 请求失败 ${path}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

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

// ---------------------------------------------------------------------------
// RapidAPI twitter-api45 抓取
// Host: twitter-api45.p.rapidapi.com
// ---------------------------------------------------------------------------

/**
 * 获取热门趋势话题
 * GET /trends.php
 * 响应: { trends: [{ name, description, context }] }
 */
async function fetchTrendsViaRapidApi(rapidApiKey, rapidApiHost) {
  const json = await rapidApiFetch(rapidApiKey, rapidApiHost, "/trends.php");
  const raw = json?.trends || (Array.isArray(json) ? json : []);
  return raw
    .filter((t) => t?.name)
    .slice(0, 20)
    .map((t) => ({
      name: String(t.name || "").trim(),
      volume: Number(t.tweet_volume || 0),
      description: String(t.description || "").trim(),
    }));
}

/**
 * 搜索推文（按热度/最新排序）
 * GET /search.php?query=AI&count=10&type=Top
 * 响应: { status, timeline: [{ tweet_id, screen_name, text, favorites, retweets }] }
 */
async function fetchTweetsByQueryViaRapidApi(rapidApiKey, rapidApiHost, query, count = 8) {
  const params = new URLSearchParams({ query, count: String(count), type: "Top" });
  let json;
  try {
    json = await rapidApiFetch(rapidApiKey, rapidApiHost, `/search.php?${params.toString()}`);
  } catch (err) {
    console.warn(`[twitter-digest] 搜索 "${query}" 失败:`, err?.message);
    return [];
  }
  return normalizeTweets(json, count);
}

/**
 * 搜索社区热点推文
 * GET /search_communities_top.php?query=AI
 */
async function fetchCommunityTweetsByQuery(rapidApiKey, rapidApiHost, query, count = 5) {
  const params = new URLSearchParams({ query });
  let json;
  try {
    json = await rapidApiFetch(
      rapidApiKey,
      rapidApiHost,
      `/search_communities_top.php?${params.toString()}`,
    );
  } catch {
    return [];
  }
  return normalizeTweets(json, count);
}

/**
 * 从推文的 extended_entities / entities 中提取媒体（图片 + 视频）
 * 返回: [{ type: 'photo'|'video'|'animated_gif', thumb, videoUrl }]
 */
function extractMedia(t) {
  const mediaList = [
    ...(t?.extended_entities?.media || []),
    ...(t?.entities?.media || []),
  ];
  const seen = new Set();
  const result = [];
  for (const m of mediaList) {
    const thumb = m?.media_url_https || m?.media_url || "";
    if (!thumb || seen.has(thumb)) continue;
    seen.add(thumb);

    if (m.type === "photo") {
      result.push({ type: "photo", thumb, videoUrl: null });
    } else if (m.type === "video" || m.type === "animated_gif") {
      // 取最高码率的 mp4
      const variants = m?.video_info?.variants || [];
      const best = variants
        .filter((v) => v.content_type === "video/mp4")
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
      result.push({ type: m.type, thumb, videoUrl: best?.url || null });
    }
  }
  return result;
}

/**
 * 统一解析 twitter-api45 的推文响应
 * timeline 中每条: { tweet_id, screen_name, text, favorites, retweets, lang }
 * 只保留中文（zh）和英文（en）推文
 */
function normalizeTweets(json, count = 10) {
  const timeline = json?.timeline || json?.results || (Array.isArray(json) ? json : []);
  return timeline
    .filter((t) => {
      const text = String(t?.text || t?.full_text || "");
      if (!text) return false;
      // 优先使用 API 返回的 lang 字段（最可靠）
      const lang = String(t?.lang || "").toLowerCase();
      if (lang && lang !== "und") {
        return lang === "en" || lang === "zh" || lang === "zho";
      }
      // 无 lang 字段时，降级用字符比例判断
      const nonAscii = text.replace(/[\x00-\x7F]/g, "").length;
      return nonAscii / text.length < 0.4;
    })
    .slice(0, count)
    .map((t) => {
      const username = t.screen_name || t.author?.username || t.user?.screen_name || "";
      const tweetId = t.tweet_id || t.id_str || t.id || "";
      return {
        text: String(t.text || t.full_text || "").replace(/\s+/g, " ").trim(),
        author: username,
        likes: Number(t.favorites || t.favorite_count || t.likes || 0),
        retweets: Number(t.retweets || t.retweet_count || 0),
        url: username && tweetId ? `https://x.com/${username}/status/${tweetId}` : "",
        media: extractMedia(t),
      };
    });
}

// ---------------------------------------------------------------------------
// Fallback：trends24.in 抓取热门话题
// ---------------------------------------------------------------------------

/**
 * 从 trends24.in 抓取全球或美国热门话题（无需 API key）
 */
async function fetchTrendsViaTrends24() {
  const url = "https://trends24.in/united-states/";
  const res = await fetch(url, {
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) {
    throw new Error(`trends24.in 请求失败: ${res.status}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);
  const trends = [];
  // trends24.in 的 #trend-list 或 .trend-card__list 下的 a 标签
  $(".trend-card__list a, #trend-list a, ol.trend-card__list li a").each((_, el) => {
    const name = $(el).text().replace(/\s+/g, " ").trim();
    if (name && name.length > 1 && name.length < 60) {
      trends.push({ name, volume: 0 });
    }
  });
  // 备用：查找包含 # 的链接
  if (trends.length === 0) {
    $("a").each((_, el) => {
      const href = $(el).attr("href") || "";
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (href.includes("trends24.in") && text.startsWith("#") && text.length < 60) {
        trends.push({ name: text, volume: 0 });
      }
    });
  }
  const seen = new Set();
  return trends.filter((t) => {
    if (seen.has(t.name)) return false;
    seen.add(t.name);
    return true;
  }).slice(0, 20);
}

// ---------------------------------------------------------------------------
// 话题筛选
// ---------------------------------------------------------------------------

const TECH_KEYWORDS =
  /(AI|GPT|LLM|Claude|Gemini|OpenAI|Apple|Google|Microsoft|Meta|GitHub|developer|coding|software|tech|startup|robot|machine learning|ChatGPT|Copilot|model|API|React|Python|JavaScript)/i;
const FINANCE_KEYWORDS =
  /(stock|market|crypto|bitcoin|eth|USD|Fed|inflation|interest rate|NYSE|Nasdaq|S&P|economy|earnings|recession|gold|oil|price|rate)/i;

/** 过滤掉明显非英文的话题（含土耳其语、韩文、阿拉伯文、中文等非 ASCII 字符集） */
function isEnglishTopic(name) {
  // 保留：纯 ASCII + 少量 #& 符号；排除包含大量非拉丁字符的
  const nonAsciiRatio = (name.replace(/[\x00-\x7F]/g, "").length) / name.length;
  return nonAsciiRatio < 0.3;
}

/**
 * 从趋势列表中筛选出英文、科技、金融话题
 */
function selectTopics(trends, maxTopics = 10) {
  const englishTrends = trends.filter((t) => isEnglishTopic(t.name));
  const techTopics = englishTrends.filter((t) => TECH_KEYWORDS.test(t.name));
  const financeTopics = englishTrends.filter(
    (t) => FINANCE_KEYWORDS.test(t.name) && !TECH_KEYWORDS.test(t.name),
  );
  const otherEnglish = englishTrends.filter(
    (t) => !TECH_KEYWORDS.test(t.name) && !FINANCE_KEYWORDS.test(t.name),
  );

  const selected = [
    ...techTopics.slice(0, 4),
    ...financeTopics.slice(0, 3),
    ...otherEnglish.slice(0, 3),
  ];

  // 不够时从所有英文话题补充
  const usedNames = new Set(selected.map((t) => t.name));
  for (const t of englishTrends) {
    if (selected.length >= maxTopics) break;
    if (!usedNames.has(t.name)) {
      selected.push(t);
      usedNames.add(t.name);
    }
  }
  return selected.slice(0, maxTopics);
}

// ---------------------------------------------------------------------------
// 关键词搜索配置（以用户兴趣为主：AI / Flutter / 编程 / 科技 / 金融 / 外设）
// ---------------------------------------------------------------------------

// 核心查询：每次运行必抓，保证内容质量
const CORE_QUERIES = [
  { label: "AI 大模型", query: "AI LLM ChatGPT Claude Gemini" },
  { label: "AI 产品动态", query: "AI agent tool launch product" },
  { label: "Flutter 开发", query: "Flutter Dart mobile app development" },
  { label: "编程开发", query: "coding programming developer software" },
  { label: "科技新闻", query: "tech news Apple Google Microsoft" },
  { label: "金融市场", query: "stock market crypto bitcoin finance" },
  { label: "电脑外设", query: "keyboard mouse monitor PC hardware peripheral" },
];

// 补充查询（推文总数不足时才用）
const SEARCH_QUERIES = [
  { label: "AI 创业融资", query: "AI startup funding raise" },
  { label: "宏观经济", query: "economy Fed interest rate inflation" },
  { label: "开源项目", query: "open source github release" },
];

// ---------------------------------------------------------------------------
// LLM 调用（与 daily-digest.mjs 逻辑保持一致）
// ---------------------------------------------------------------------------

function resolveChatCompletionsUrl(baseUrl) {
  const b = baseUrl.replace(/\/$/, "");
  if (b.endsWith("/v1")) return `${b}/chat/completions`;
  return `${b}/v1/chat/completions`;
}

function stripMarkdownFence(text) {
  const s = String(text || "").trim();
  const wrapped = s.match(/^```(?:markdown|md)?\s*([\s\S]*?)\s*```$/i);
  return wrapped ? wrapped[1].trim() : s;
}

function stripThinkBlocks(text) {
  return String(text || "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:thinking|reasoning)\s*[\s\S]*?```/gi, "")
    .trim();
}

/**
 * 从 LLM 输出中提取 Markdown：
 * 部分模型（如 qwen）会在正文前输出思考内容（无标签），
 * 通过寻找第一个 "---" 截断掉前置噪声。
 */
function extractMarkdown(text) {
  const s = stripMarkdownFence(stripThinkBlocks(String(text || "")));
  // 找到第一个 frontmatter 开始位置
  const idx = s.indexOf("\n---\n");
  if (idx !== -1 && !s.startsWith("---")) {
    return s.slice(idx + 1).trim(); // 截掉前面的思考内容
  }
  return s;
}

function hasValidFrontmatter(markdown) {
  const s = String(markdown || "");
  if (/^---\r?\n[\s\S]*?\r?\n---/.test(s)) return true;
  return /^---/.test(s) && /\ntitle:/.test(s);
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
  return titleLine.split(":").slice(1).join(":").trim().replace(/^["']|["']$/g, "");
}

async function generateMarkdownByLlm(systemPrompt, userPrompt, fallbackMarkdown, requiredSections = [], expectedTitle = "") {
  const apiKey = process.env.OPENAI_API_KEY || "";
  const enabled = (process.env.DAILY_DIGEST_ENABLE_LLM || "").toLowerCase() === "true";
  if (!enabled || !apiKey) {
    console.log("[twitter-digest] LLM 未启用，使用模板输出。");
    return fallbackMarkdown;
  }

  const model = process.env.DAILY_DIGEST_LLM_MODEL || "gpt-4o-mini";
  const llmBaseUrl = (process.env.DAILY_DIGEST_LLM_BASE_URL || "https://api.openai.com").replace(/\/$/, "");
  const chatUrl = resolveChatCompletionsUrl(llmBaseUrl);
  console.log(`[twitter-digest] LLM enabled, model=${model}, base=${llmBaseUrl}`);

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
      console.warn(`[twitter-digest] LLM 生成失败(${res.status})，回退模板。${text ? ` ${text.slice(0, 200)}` : ""}`);
      return fallbackMarkdown;
    }

    const json = await res.json();
    const out = json?.choices?.[0]?.message?.content;
    const cleaned = extractMarkdown(out);
    if (!cleaned) {
      console.warn("[twitter-digest] LLM 输出为空，回退模板。");
      return fallbackMarkdown;
    }
    console.log("[twitter-digest] LLM 输出前 200 字符:", cleaned.slice(0, 200).replace(/\n/g, "\\n"));
    if (!hasValidFrontmatter(cleaned)) {
      console.warn("[twitter-digest] LLM 输出缺少 frontmatter，回退模板。");
      return fallbackMarkdown;
    }
    if (!includesAllSections(cleaned, requiredSections)) {
      console.warn("[twitter-digest] LLM 输出缺少必需章节，回退模板。");
      return fallbackMarkdown;
    }
    if (expectedTitle && extractFrontmatterTitle(cleaned) !== expectedTitle) {
      console.warn(`[twitter-digest] LLM 输出标题不符合要求(期望: ${expectedTitle})，回退模板。`);
      return fallbackMarkdown;
    }
    if (cleaned.includes("<think>")) {
      console.warn("[twitter-digest] LLM 输出包含 think 标签，回退模板。");
      return fallbackMarkdown;
    }
    return cleaned;
  } catch (err) {
    console.warn("[twitter-digest] LLM 调用异常，回退模板：", err?.message || err);
    return fallbackMarkdown;
  }
}

// ---------------------------------------------------------------------------
// Markdown 模板
// ---------------------------------------------------------------------------

/**
 * 将单条推文渲染为 Markdown blockquote，含图片/视频缩略图
 */
function renderTweetBlock(t) {
  const meta = [t.likes ? `❤️ ${t.likes}` : "", t.retweets ? `🔁 ${t.retweets}` : ""]
    .filter(Boolean)
    .join("  ");
  const link = t.url ? `[→ 原推文](${t.url})` : "";
  const header = `> **@${t.author || "匿名"}**  ${meta}  ${link}`;
  const body = `> ${t.text.replace(/\n/g, "\n> ")}`;

  // 媒体：最多展示 2 个
  const mediaLines = (t.media || []).slice(0, 2).map((m) => {
    if (m.type === "photo") {
      return `> ![](${m.thumb})`;
    }
    // 视频/GIF：展示缩略图，点击跳转原推文（Markdown 不能直接播放视频）
    const videoLink = t.url || m.videoUrl || "";
    return videoLink
      ? `> [![▶ 点击观看视频](${m.thumb})](${videoLink})`
      : `> ![](${m.thumb})`;
  });

  return [header, ">", body, ...mediaLines].join("\n");
}

function buildTwitterFallbackMarkdown(dateTime, topics, allTweets, dataSource) {
  const date = dateTime.slice(0, 10);
  const topicLines = topics.map((t) =>
    t.volume > 0 ? `- **${t.name}**（约 ${t.volume.toLocaleString()} 条推文）` : `- **${t.name}**`,
  );

  const tweetBlocks = allTweets.slice(0, 20).map((t) => renderTweetBlock(t));

  return `---
title: X 热点 ${date}
date: ${dateTime}
description: 自动抓取 X/Twitter 热门话题并由 AI 整理的每日速览
tags:
  - Twitter
  - 热点
  - 每日速览
---
> 数据来源：${dataSource}
> 生成时间：${dateTime}

## 今日结论

今日 X/Twitter 热门话题涵盖科技、金融与社会热点，以下为精选摘要。

## 热门话题

${topicLines.length > 0 ? topicLines.join("\n") : "- 暂未获取到热门话题数据。"}

## 精选推文

${tweetBlocks.length > 0 ? tweetBlocks.join("\n\n") : "- 暂未获取到推文数据。"}

## 洞察与解读

- 科技方向：AI 与大模型相关话题仍持续引发广泛讨论，关注落地场景与产品迭代。
- 市场动态：宏观经济数据与政策预期是市场情绪的主要驱动力。
- 建议持续追踪高热度话题，结合多来源信息做出判断。
`;
}

function buildTwitterLlmPrompt(dateTime, topics, allTweets, dataSource) {
  const date = dateTime.slice(0, 10);
  const topicsText = topics
    .map((t) => (t.volume > 0 ? `${t.name}（约 ${t.volume.toLocaleString()} 条）` : t.name))
    .join("、");

  const tweetsText = allTweets
    .slice(0, 30)
    .map((t, i) => {
      const mediaLines = (t.media || []).slice(0, 2).map((m) => {
        if (m.type === "photo") return `   图片: ${m.thumb}`;
        const vl = t.url || m.videoUrl || "";
        return `   视频缩略图: ${m.thumb}${vl ? `  视频链接: ${vl}` : ""}`;
      });
      return `${i + 1}. @${t.author || "匿名"}${t.likes ? ` [❤️${t.likes}]` : ""}${t.retweets ? ` [🔁${t.retweets}]` : ""}
   原文链接: ${t.url || "无"}
   内容: ${t.text}${mediaLines.length ? "\n" + mediaLines.join("\n") : ""}`;
    })
    .join("\n\n");

  return `请基于下面 X/Twitter 热点数据，生成一篇中文 Markdown 日报，要求：
1) 必须输出完整 Markdown，包含 frontmatter（title/date/description/tags）。
   - title 必须严格为：X 热点 ${date}
   - date 必须严格为：${dateTime}
   - tags 包含：Twitter、热点、每日速览
2) 结构必须包含以下章节（按序）：今日结论、热门话题、精选推文、洞察与解读。
3) 今日结论：2-3 句话概括今日 X 上的整体舆论走向。
4) 热门话题：列出 8-12 个话题，每个附一句话说明（结合推文内容）。
5) 精选推文：挑选 8-15 条最具代表性的，每条格式如下：
   - 使用 blockquote（> 开头）展示
   - 第一行：**@作者**  ❤️互动数  [→ 原推文](链接)
   - 第二行：空的 >
   - 第三行：推文内容摘要（中文改写或直接引用）
   - 如果有图片（"图片:"字段），在内容下方用 > ![](图片URL) 嵌入（最多2张）
   - 如果有视频（"视频缩略图:"字段），在内容下方用 > [![▶ 点击观看视频](缩略图URL)](原推文URL) 嵌入
6) 洞察与解读：分科技、市场、社会三个维度给出判断，语气克制专业，不编造数据。
7) 全文使用中文，专有名词（AI、GPT 等）保留英文。
8) 只输出 Markdown，不要任何额外解释文字。

生成时间：${dateTime}
数据来源：${dataSource}

今日热门话题（共 ${topics.length} 个）：
${topicsText}

推文原始数据（共 ${allTweets.length} 条，以下为前 30 条）：
${tweetsText}
`;
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------

async function run() {
  mkdirSync(BLOG_DIR, { recursive: true });
  const { date, dateTime, compact } = nowDateParts();

  const rapidApiKey = process.env.RAPIDAPI_KEY || "";
  const rapidApiHost = process.env.RAPIDAPI_TWITTER_HOST || "twitter-api45.p.rapidapi.com";

  let trends = [];
  let allTweets = [];
  let dataSource = "";

  if (rapidApiKey) {
    // --- 主路径：RapidAPI ---
    console.log("[twitter-digest] 使用 RapidAPI 抓取热门话题...");
    dataSource = `RapidAPI (${rapidApiHost})`;
    try {
      trends = await fetchTrendsViaRapidApi(rapidApiKey, rapidApiHost);
      console.log(`[twitter-digest] 获取到 ${trends.length} 个热门话题`);
    } catch (err) {
      console.warn("[twitter-digest] RapidAPI trends 失败，尝试 fallback：", err?.message);
    }
    await sleep(1000);

    const selected = selectTopics(trends, 10);

    // 1. 优先搜索英文趋势话题推文（每个话题 3 条）
    for (const topic of selected) {
      try {
        const tweets = await fetchTweetsByQueryViaRapidApi(rapidApiKey, rapidApiHost, topic.name, 3);
        allTweets.push(...tweets);
        console.log(`[twitter-digest] 话题 "${topic.name}" 获取 ${tweets.length} 条推文`);
      } catch (err) {
        console.warn(`[twitter-digest] 搜索话题 "${topic.name}" 失败:`, err?.message);
      }
      await sleep(1000);
    }

    // 2. 始终抓取核心科技/金融关键词推文，保证内容质量
    for (const { label, query } of CORE_QUERIES) {
      try {
        const tweets = await fetchTweetsByQueryViaRapidApi(rapidApiKey, rapidApiHost, query, 5);
        allTweets.push(...tweets);
        console.log(`[twitter-digest] 核心 "${label}" 获取 ${tweets.length} 条推文`);
      } catch (err) {
        console.warn(`[twitter-digest] 核心 "${label}" 失败:`, err?.message);
      }
      await sleep(1000);
    }

    // 3. 社区热点补充（AI/Tech/Finance）
    for (const q of ["AI", "Tech", "Finance"]) {
      try {
        const tweets = await fetchCommunityTweetsByQuery(rapidApiKey, rapidApiHost, q, 5);
        allTweets.push(...tweets);
        console.log(`[twitter-digest] 社区 "${q}" 补充 ${tweets.length} 条推文`);
      } catch (err) {
        console.warn(`[twitter-digest] 社区 "${q}" 搜索失败:`, err?.message);
      }
      await sleep(1000);
    }

    // 4. 推文仍不足时用额外关键词补充
    if (allTweets.length < 15) {
      console.log("[twitter-digest] 推文不足，使用额外关键词补充...");
      for (const { label, query } of SEARCH_QUERIES) {
        try {
          const tweets = await fetchTweetsByQueryViaRapidApi(rapidApiKey, rapidApiHost, query, 5);
          allTweets.push(...tweets);
          console.log(`[twitter-digest] "${label}" 补充 ${tweets.length} 条推文`);
        } catch (err) {
          console.warn(`[twitter-digest] "${label}" 搜索失败:`, err?.message);
        }
        await sleep(1000);
      }
    }
  } else {
    // --- 备用路径：trends24.in 抓取话题 ---
    console.log("[twitter-digest] 未配置 RAPIDAPI_KEY，使用 trends24.in fallback...");
    dataSource = "trends24.in (无需 API key，无推文原文)";
    try {
      trends = await fetchTrendsViaTrends24();
      console.log(`[twitter-digest] trends24.in 获取到 ${trends.length} 个热门话题`);
    } catch (err) {
      console.warn("[twitter-digest] trends24.in 抓取失败：", err?.message);
      trends = [
        { name: "#AI", volume: 0 },
        { name: "#Tech", volume: 0 },
        { name: "#Finance", volume: 0 },
      ];
    }
    // 无 RapidAPI 时没有推文内容，仅展示话题列表
    allTweets = [];
  }

  // 去重推文
  const seenTexts = new Set();
  const uniqueTweets = allTweets.filter((t) => {
    const key = t.text.slice(0, 50);
    if (seenTexts.has(key)) return false;
    seenTexts.add(key);
    return true;
  });

  if (trends.length === 0 && uniqueTweets.length === 0) {
    throw new Error("未获取到任何话题或推文数据，请检查 API key 或网络连接。");
  }

  const selectedTopics = selectTopics(trends, 12);

  const fallbackMarkdown = buildTwitterFallbackMarkdown(dateTime, selectedTopics, uniqueTweets, dataSource);
  const llmPrompt = buildTwitterLlmPrompt(dateTime, selectedTopics, uniqueTweets, dataSource);
  const expectedTitle = `X 热点 ${date}`;

  const finalMarkdown = await generateMarkdownByLlm(
    "你是社交媒体内容分析师，擅长将 X/Twitter 热点整理为简洁专业的中文日报。",
    llmPrompt,
    fallbackMarkdown,
    ["今日结论", "热门话题", "精选推文", "洞察与解读"],
    expectedTitle,
  );

  const outputPath = join(BLOG_DIR, `${compact}-twitter-digest.md`);
  writeFileSync(outputPath, finalMarkdown, "utf-8");
  console.log("[twitter-digest] 生成完成:", outputPath);
}

run().catch((err) => {
  console.error("[twitter-digest] 失败:", err?.message || err);
  process.exit(1);
});
