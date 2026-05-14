import type { Workflow } from "./types.js";

interface PromptInput {
  task: string;
  workspace: string;
  context?: string;
  previousOutput?: string;
  reviewOutput?: string;
  workflow?: Workflow;
}

function baseHeader(input: PromptInput): string {
  return [
    "你正在 Easy Agent 的多智能体协作流程中工作。",
    `工作区：${input.workspace}`,
    `用户任务：${input.task}`,
    ...(input.context ? ["", "当前任务上下文：", input.context] : []),
    "",
    "必须使用中文输出。",
    "输出要结构化、可交接、可审查。",
  ].join("\n");
}

export function buildClaudePlanPrompt(input: PromptInput): string {
  return [
    baseHeader(input),
    "",
    "你的角色：Claude Code，负责只读分析和制定执行计划。",
    "不要修改文件，不要运行会改变工作区状态的命令。",
    "",
    "请输出以下固定结构：",
    "PLAN_DECISION: ready",
    "任务目标：",
    "执行范围：",
    "允许修改：",
    "禁止事项：",
    "验收标准：",
    "建议执行步骤：",
    "风险与注意事项：",
  ].join("\n");
}

export function buildCodexExecutionPrompt(input: PromptInput): string {
  return [
    baseHeader(input),
    "",
    "你的角色：Codex，负责根据 Claude Code 的计划执行代码修改。",
    "你可以修改工作区文件，但必须严格限制在计划允许范围内。",
    "不要提交 git，不要 push，不要修改全局配置。",
    "",
    "Claude Code 计划如下：",
    input.previousOutput ?? "(无计划内容)",
    "",
    "完成后请输出以下固定结构：",
    "EXECUTION_RESULT: completed",
    "已完成内容：",
    "修改文件：",
    "测试结果：",
    "未完成事项：",
    "需要审查的问题：",
  ].join("\n");
}

export function buildCodexDirectExecutionPrompt(input: PromptInput): string {
  return [
    baseHeader(input),
    "",
    "你的角色：Codex，负责直接执行代码任务。",
    "你可以修改工作区文件，但不要提交 git，不要 push，不要修改全局配置。",
    "",
    "完成后请输出以下固定结构：",
    "EXECUTION_RESULT: completed",
    "已完成内容：",
    "修改文件：",
    "测试结果：",
    "未完成事项：",
    "需要审查的问题：",
  ].join("\n");
}

export function buildClaudeReviewPrompt(input: PromptInput): string {
  return [
    baseHeader(input),
    "",
    "你的角色：Claude Code，负责只读审查 Codex 的执行结果。",
    "不要修改文件，不要运行会改变工作区状态的命令。",
    "",
    "Codex 执行结果如下：",
    input.previousOutput ?? "(无执行结果)",
    "",
    "请检查代码变更、测试结果、遗漏和风险。",
    "输出第一行必须是以下二选一：",
    "REVIEW_DECISION: approve",
    "REVIEW_DECISION: request_changes",
    "",
    "然后输出：",
    "审查结论：",
    "主要问题：",
    "建议修改：",
    "测试建议：",
  ].join("\n");
}

export function buildClaudeExecutionPrompt(input: PromptInput): string {
  return [
    baseHeader(input),
    "",
    "你的角色：Claude Code，负责直接执行代码任务。",
    "你可以修改工作区文件，但不要提交 git，不要 push，不要修改全局配置。",
    "",
    "完成后请输出以下固定结构：",
    "EXECUTION_RESULT: completed",
    "已完成内容：",
    "修改文件：",
    "测试结果：",
    "未完成事项：",
    "需要审查的问题：",
  ].join("\n");
}

export function buildCodexReviewPrompt(input: PromptInput): string {
  return [
    baseHeader(input),
    "",
    "你的角色：Codex，负责只读审查 Claude Code 的执行结果。",
    "不要修改文件，不要运行会改变工作区状态的命令。",
    "",
    "Claude Code 执行结果如下：",
    input.previousOutput ?? "(无执行结果)",
    "",
    "输出第一行必须是以下二选一：",
    "REVIEW_DECISION: approve",
    "REVIEW_DECISION: request_changes",
    "",
    "然后输出：",
    "审查结论：",
    "主要问题：",
    "建议修改：",
    "测试建议：",
  ].join("\n");
}

export function buildReworkPrompt(input: PromptInput): string {
  return [
    baseHeader(input),
    "",
    "你的角色：执行方，负责根据审查意见返工。",
    "你可以修改工作区文件，但不要提交 git，不要 push，不要修改全局配置。",
    "",
    "上一次执行结果：",
    input.previousOutput ?? "(无执行结果)",
    "",
    "审查意见：",
    input.reviewOutput ?? "(无审查意见)",
    "",
    "完成后请输出以下固定结构：",
    "REWORK_RESULT: completed",
    "已修复内容：",
    "修改文件：",
    "测试结果：",
    "仍需关注：",
  ].join("\n");
}

export function parseReviewDecision(output: string): "approve" | "request_changes" {
  const firstLines = output.split(/\r?\n/).slice(0, 8).join("\n").toLowerCase();
  if (firstLines.includes("review_decision: request_changes")) return "request_changes";
  if (firstLines.includes("review_decision: approve")) return "approve";
  if (firstLines.includes("request_changes")) return "request_changes";
  return "approve";
}
