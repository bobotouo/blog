---
title: 技术日报 2026-10-15
date: 2026-10-15 12:29:29
description: 自动抓取掘金关注页并生成的每日技术摘要
tags:
  - 技术
  - 掘金
  - 每日速览
---
> 数据来源：https://juejin.cn/following
> 参考来源：https://juejin.cn/recommended?sort=newest
> 生成时间：2026-10-15 12:29:29
> 抓取方式：使用 JUEJIN_COOKIE 抓取关注页

## 今日技术主题
- AI 与智能开发：相关信号 8 条
- Flutter 生态：相关信号 2 条
- 后端与架构：相关信号 1 条

## 综合-最新（前10，筛 AI/Flutter）
- 用 Pydantic AI 从零搭建一个能干活的 AI Agent（https://juejin.cn/post/7696693474243756067）
  - 摘要：很多人第一次写 AI Agent，写完都有点失望。 代码确实能跑，模型也确实在说话，但往下走两步就露馅了： 返回的是一段字符串，你得自己 json.loads()，还得写一堆兜底防止它今天返回 JSO
- Kestrel_VLLM_CUDA -09 · full-GPU decode：单 token 全设备（https://juejin.cn/post/7696388135438663743）
  - 摘要：09 · full-GPU decode：单 token 全设备 一句话：decode 一个 token 只付一次 H2D（embedding）+ 一次 D2H（logits），中间所有层、所有中间量
- 基于 AI 的 Web 与 App 端到端测试实践（https://juejin.cn/post/7696505327530704906）
  - 摘要：ego-lite（Web）+ Patrol（Flutter App）+ Agent 编排，搭一套能跑起来的动态验证工作流
- 别再熬夜做 PPT 了！输入一个主题，AI 帮你把整套幻灯片做好，还能随便改字（https://juejin.cn/post/7696387828729135145）
  - 摘要：1. 一句话：这是要做什么？ 你有没有过这种经历：老板丢来一个主题，让你今晚出一套 PPT。你打开 PowerPoint，从空白页开始，一页一页排版、调字号、找配图……两小时过去了，才做了 5 页。
- team AI使用总结（https://juejin.cn/post/7696696661667201060）
  - 摘要：安装 TeamAI CLI 初始化（团队管理员） 加入团队（团队成员） 选择项目和角色 问题 cmd中执行指令 teamai init http://gitlab.shuixing.com/ipd/i
- RAG 混合检索实战：向量 + BM25 怎么用 RRF 融合（https://juejin.cn/post/7696691157294039080）
  - 摘要：一、先复现问题：精确术语是向量检索的天敌 测试环境： 用户查询：XLC-300 质保期多久 结果：top10 里没有那条文档。排前面的全是「XLC-500 质保政策」「数控设备通用质保条款」。 原因不
- Prompt Injection｜我的Agent被严重的prompt injection持续攻击了一下，我梳理了全过程并总结了防御措施（https://juejin.cn/post/7696713457148379190）
  - 摘要：Prompt Injection｜我的Agent被严重的prompt injection持续攻击了一下，我梳理了全过程并总结了防御措施 昨天我的两个AI执行窗在跑web检索被疑似间接注入
- RINO：让AI用物理结构自学，1%标注数据实现全监督效果（https://juejin.cn/post/7696783367953547315）
  - 摘要：**摘要：**本文从高能物理研究中标注成本高、模拟偏差大的困境出发，介绍RINO（无需标签的重正化群蒸馏）如何利用喷注天然的多尺度层级结构实现自监督学习，从而大幅降低标注成本并提升迁移能力。文章进一步
- MCP 是什么？按 2026-07-28 新版规范讲清架构、调用流程和配置（https://juejin.cn/post/7696703140126769215）
  - 摘要：按 MCP 2026-07-28 新版规范讲清 Host、Client、Server 架构和工具调用流程，为什么改成无状态，以及 Claude Code、Codex 的配置写法和安全注意事项
- 电脑如何录屏幕视频和声音？从工具到代码，7 种方案帮你彻底搞定（https://juejin.cn/post/7696500704472580123）
  - 摘要：录屏没声音、卡顿、文件过大怎么办？本文从截屏与编码原理讲起，详解分辨率、帧率等核心参数，提供图形工具与 Python 代码共 7 套方案，涵盖 GDI、DXGI、FFmpeg 等技术路径，附实测对比。

## 关注补充（未使用且不过旧）
- Flutter Android 改动：APK 不再允许通过 Intent 动态修改 Engine 参数（https://juejin.cn/post/7696437668125851674）
  - 摘要：最近刚刚合并了两个新的 PR #190870 和 #191924，直接禁止了之前应用启动时，外部传入的 Android Intent 可以携带 Flutter Engine 的底层参数的能力，包括引擎

## 学习建议
- 先选择 1 篇偏“原理”与 1 篇偏“实战”的文章做组合学习。
- 阅读时同步记录可迁移到当前项目的实践点（如构建优化、组件抽象、测试策略）。
- 将今天的关键结论整理为团队可复用的 checklist 或脚手架模板。
