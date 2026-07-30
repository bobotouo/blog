---
title: 技术日报 2026-07-30
date: 2026-07-30 09:31:34
description: 自动抓取掘金关注页并生成的每日技术摘要
tags:
  - 技术
  - 掘金
  - 每日速览
---
> 数据来源：https://juejin.cn/following
> 参考来源：https://juejin.cn/recommended?sort=newest
> 生成时间：2026-07-30 09:31:34
> 抓取方式：使用 JUEJIN_COOKIE 抓取关注页

## 今日技术主题
- AI 与智能开发：相关信号 9 条
- 后端与架构：相关信号 2 条
- 性能与体验优化：相关信号 2 条

## 综合-最新（前10，筛 AI/Flutter）
- 为什么你的 AI 越聊越傻？从 Token 到 Agent，彻底搞懂 AI Agent的秘密㊙️（https://juejin.cn/post/7668140017316233266）
  - 摘要：相信很多开发者都有过类似经历。 刚开始使用 AI 的时候： AI 回复非常清晰。 但是聊了一段时间之后： 添加需求； 修改方案； 优化代码； 补充业务规则； 几十轮之后，AI 开始出现： 忘记之前规则
- 全栈开发者的 AI 模型选择指南：Kimi K3、Claude、GPT 分别适合什么场景（https://juejin.cn/post/7668134589201907718）
  - 摘要：为什么模型选择变成了一个问题 一年前，多数开发者的 AI 工具很简单。一个 ChatGPT Plus 订阅，或者一个 Claude Pro 账号，基本能覆盖大部分需求。
- 一次消息如何变成多步行动：拆开 OpenClaw 的 Agent Loop（https://juejin.cn/post/7668127355689140230）
  - 摘要：前两篇分别看清了 Agent Runtime 的分层（Mission011），也拆开了 Session、Transcript、Context、Compaction、Pruning、Memory（Mis
- OpenAI 官方教你怎么用 Codex，其实是在教你怎么写一份「Skill」（https://juejin.cn/post/7668113813384527924）
  - 摘要：OpenAI 官方的 Codex Manual 里有一套很明确的推荐用法——别把 Codex 当聊天框，把它当工程同事。
- Claude Code 源码分析（二)：CC 的心脏 queryLoop Agent主循环（https://juejin.cn/post/7668125456143843334）
  - 摘要：上一篇最后停在 launchRepl() 和 runHeadless()：一次会话已经准备好了，模型、权限、Tools、Skills、Agents 和 MCP 也已经装进了运行环境。 这篇文章讲一个最
- Agent 能完成一个任务，但它能持续追一个三个月的目标吗？（https://juejin.cn/post/7667863299439443968）
  - 摘要：从 cold email、发版优化和性能调优出发，讨论 Agent 如何借助 Run、Heartbeat 与 Goal 三层循环持续追踪长期结果。
- Prompt Engineering：让LLM听懂你的话 — 从硬编码到模板化到多段式（https://juejin.cn/post/7668031094248210468）
  - 摘要：先说结论 Prompt 是 Agent 的"操作系统"。 不是夸张 — Agent 的每一次决策、执行、校验，都靠 Prompt 告诉 LLM "你是谁、做什么、怎么做、不能做什么"。Prompt 写
- RAG 系统进化论（二）：Naive RAG，检索增强生成的最小闭环（https://juejin.cn/post/7668120258260500532）
  - 摘要：Naive RAG（基础 RAG）建立了检索增强生成的最小闭环。本文将通过一个具体问题，介绍文档加载、文本切块、Embedding（向量表示）、向量数据库、相似度检索和提示词增强如何协作，并解释为什么
- 鸿蒙应用开发之双向绑定实战：从 V1 到 V2 的完整迁移指南（https://juejin.cn/post/7668134589202120710）
  - 摘要：在 ArkTS 状态管理中，V1 和 V2 对双向绑定的实现方式有显著差异。本文将深入剖析这两种方案的核心区别，并通过完整的代码示例，带你掌握从 V1 到 V2 的迁移技巧。 一、什么是双向绑定 双向
- reactive 对象重新赋值后，表单为什么没有恢复默认值（https://juejin.cn/post/7668031094249046052）
  - 摘要：已打开详情页，但未提取到可靠摘要。

## 关注补充（未使用且不过旧）
- KotlinLLM 开源 ，一个可以在运行时自己生成永久 Kotlin 代码的 Agent 库（https://juejin.cn/post/7667863898348126271）
  - 摘要：JetBrains 这次还真搞出来一个有意思的东西，大概理解就是： 哎~这就很有意思了是不是？它居然想的是，把 LLM 从“每次运行都要调用的在线服务”，变成一种只有在程序遇到陌生场景时能够介入、然后

## 学习建议
- 先选择 1 篇偏“原理”与 1 篇偏“实战”的文章做组合学习。
- 阅读时同步记录可迁移到当前项目的实践点（如构建优化、组件抽象、测试策略）。
- 将今天的关键结论整理为团队可复用的 checklist 或脚手架模板。
