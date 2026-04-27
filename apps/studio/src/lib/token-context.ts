import type { StudioTokenContextSummary } from "@openclaw/shared";
import type { ConversationChip } from "../components/conversation/ConversationShell";

export interface TokenContextDisplay {
  contextLabel: string;
  progress: number;
  rows: Array<{ label: string; value: string }>;
}

const integerFormatter = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 0
});

const costFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 4,
  minimumFractionDigits: 4,
  style: "currency"
});

function isFiniteMetric(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatInteger(value: number | null | undefined): string {
  return isFiniteMetric(value) ? integerFormatter.format(value) : "暂无真实值";
}

function formatPercent(value: number | null | undefined): string {
  return isFiniteMetric(value) ? `${Math.round(value)}%` : "暂无真实值";
}

function formatCost(value: number | null | undefined): string {
  return isFiniteMetric(value) ? costFormatter.format(value) : "暂无真实值";
}

function hasTokenContextValues(summary: StudioTokenContextSummary | null | undefined): summary is StudioTokenContextSummary {
  if (!summary || summary.source === "mock" || summary.source === "unavailable") {
    return false;
  }

  return [
    summary.inputTokens,
    summary.outputTokens,
    summary.totalTokens,
    summary.cacheReadTokens,
    summary.cacheWriteTokens,
    summary.contextUsedTokens,
    summary.contextPercent,
    summary.compactions,
    summary.toolCallCount,
    summary.availableFunctionCount
  ].some((value) => isFiniteMetric(value) && value > 0);
}

export function buildTokenContextDisplay(
  summary: StudioTokenContextSummary | null | undefined,
  unavailableLabel = "等待真实 token 数据"
): TokenContextDisplay {
  if (!hasTokenContextValues(summary)) {
    return {
      contextLabel: unavailableLabel,
      progress: 0,
      rows: [
        { label: "数据来源", value: "未检测到运行态 usage" },
        { label: "输入令牌", value: "暂无真实值" },
        { label: "输出令牌", value: "暂无真实值" },
        { label: "上下文", value: "暂无真实值" }
      ]
    };
  }

  const contextUsed = summary.contextUsedTokens ?? summary.totalTokens;
  const contextLabel =
    isFiniteMetric(contextUsed) && isFiniteMetric(summary.contextWindowTokens)
      ? `${formatInteger(contextUsed)} / ${formatInteger(summary.contextWindowTokens)}`
      : isFiniteMetric(summary.totalTokens)
        ? `${formatInteger(summary.totalTokens)} tokens`
        : summary.statusLabel;
  const progress =
    isFiniteMetric(summary.contextPercent)
      ? Math.max(0, Math.min(100, Math.round(summary.contextPercent)))
      : isFiniteMetric(contextUsed) && isFiniteMetric(summary.contextWindowTokens) && summary.contextWindowTokens > 0
        ? Math.max(0, Math.min(100, Math.round((contextUsed / summary.contextWindowTokens) * 100)))
        : 0;
  const cacheValue =
    isFiniteMetric(summary.cacheHitPercent)
      ? `${formatPercent(summary.cacheHitPercent)} · 读 ${formatInteger(summary.cacheReadTokens)} / 写 ${formatInteger(summary.cacheWriteTokens)}`
      : isFiniteMetric(summary.cacheReadTokens) || isFiniteMetric(summary.cacheWriteTokens)
        ? `读 ${formatInteger(summary.cacheReadTokens)} / 写 ${formatInteger(summary.cacheWriteTokens)}`
        : "暂无真实值";

  return {
    contextLabel,
    progress,
    rows: [
      { label: "输入令牌", value: formatInteger(summary.inputTokens) },
      { label: "输出令牌", value: formatInteger(summary.outputTokens) },
      { label: "总令牌", value: formatInteger(summary.totalTokens) },
      { label: "缓存", value: cacheValue },
      { label: "压缩次数", value: formatInteger(summary.compactions) },
      { label: "成本", value: formatCost(summary.costUsd) },
      { label: "数据来源", value: summary.statusLabel }
    ]
  };
}

export function buildTokenContextChips(summary: StudioTokenContextSummary | null | undefined): ConversationChip[] {
  if (!hasTokenContextValues(summary)) {
    return [];
  }

  const chips: ConversationChip[] = [];

  if (isFiniteMetric(summary.contextPercent)) {
    chips.push({ label: `上下文 ${formatPercent(summary.contextPercent)}`, tone: "active" });
  } else if (isFiniteMetric(summary.contextUsedTokens) && isFiniteMetric(summary.contextWindowTokens)) {
    chips.push({ label: `上下文 ${formatInteger(summary.contextUsedTokens)} / ${formatInteger(summary.contextWindowTokens)}`, tone: "active" });
  }

  if (isFiniteMetric(summary.totalTokens)) {
    chips.push({ label: `令牌 ${formatInteger(summary.totalTokens)}`, tone: summary.source === "local-estimate" ? "warning" : "positive" });
  }

  if (isFiniteMetric(summary.toolCallCount) && summary.toolCallCount > 0) {
    chips.push({ label: `工具调用 ${formatInteger(summary.toolCallCount)}`, tone: "neutral" });
  } else if (isFiniteMetric(summary.availableFunctionCount) && summary.availableFunctionCount > 0) {
    chips.push({ label: `可用工具 ${formatInteger(summary.availableFunctionCount)}`, tone: "neutral" });
  }

  chips.push({ label: summary.source === "local-estimate" ? "本地估算" : "真实 usage", tone: summary.source === "local-estimate" ? "warning" : "positive" });

  return chips;
}
