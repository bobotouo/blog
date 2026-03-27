---
title: 技术日报 2026-03-25
date: 2026-03-25
description: 聚焦 LangChain.js 入门与 Nuxt 3 SSR 上下文问题，附带 Kotlin 近期特性汇总。
tags: [LLM, LangChain, Nuxt3, Kotlin, SSR, 前端]
---

# 技术日报 2026-03-25

## 今日结论
LangChain.js 入门链路清晰，适合快速构建 LLM 应用；Nuxt 3 在 SSR 场景下需特别注意异步边界后的上下文丢失问题；Kotlin 近两年版本迭代密集，建议存量项目评估特性升级收益。

## 技术主题
AI 工程化 / 前端 SSR 架构 / 语言特性演进

## 推荐阅读

1. **[1-认识 langchain.js](https://juejin.cn/post/7621026569315188762)**
   提供 LangChain.js 项目初始化及核心包、OpenAI 适配器安装的具体步骤。

2. **[2-使用 LLM 链和 Prompt 模板](https://juejin.cn/post/7620712495218376714)**
   讲解如何通过 Prompt 模板控制模型响应类型及对话流程，增强对 LLM 输出的可控性。

3. **[Nuxt 3 异步上下文指南：useNuxtApp() 与 await 的使用规范](https://juejin.cn/post/7620769530688454690)**
   分析 SSR 项目中 useNuxtApp() 在异步边界后丢失上下文的根因与修复方案。

4. **[Kotlin 在 2.0 - 2.3 都更新了什么特性，一口气带你看完这两年 Kotlin 更新](https://juejin.cn/post/7618764794955628607)**
   汇总 Kotlin 2.0 至 2.3 版本期间发布的新特性与语法更新，适合快速回顾。

## 可落地方向

1. **AI 应用原型验证**：参照 LangChain.js 指南初始化项目，尝试配置 Prompt 模板以规范输出格式。
2. **SSR 隐患排查**：检查 Nuxt 3 项目中是否存在 `await` 后调用 `useNuxtApp()` 或访问 Pinia Store 的代码，避免上下文丢失。
3. **技术栈评估**：回顾 Kotlin 近期特性，评估后端或 Android 项目升级版本以获得新语法支持的可行性。