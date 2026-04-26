import { useState } from "react";
import type { StudioShellState, StudioTone } from "@openclaw/shared";
import { formatProductText } from "../lib/product-text";

interface AgentsPageProps {
  agents: StudioShellState["agents"];
  boundary: StudioShellState["boundary"];
  status: StudioShellState["status"];
  commandSurface: StudioShellState["commandSurface"];
}

type DiagnosticsTabId = "runtime" | "bridge" | "boundary";

const DIAGNOSTIC_TABS: Array<{ id: DiagnosticsTabId; label: string; summary: string }> = [
  { id: "runtime", label: "运行态探针", summary: "网关、资源和最近运行信号" },
  { id: "bridge", label: "桥接与 IPC", summary: "桥接、命令面与通道状态" },
  { id: "boundary", label: "安全边界", summary: "宿主写入、审查链和恢复依据" }
];

function toneClass(tone: StudioTone | "active" | "blocked" | "ready" | string | undefined): string {
  if (tone === "positive" || tone === "ready") {
    return "positive";
  }
  if (tone === "warning" || tone === "blocked") {
    return "warning";
  }
  return "neutral";
}

export function AgentsPage({ agents, boundary, status, commandSurface }: AgentsPageProps) {
  const [activeTab, setActiveTab] = useState<DiagnosticsTabId>("runtime");
  const hostExecutor = boundary.hostExecutor;
  const bridge = hostExecutor.bridge;
  const releasePipeline = hostExecutor.releaseApprovalPipeline;
  const activeReleaseStage =
    releasePipeline.stages.find((stage) => stage.id === releasePipeline.currentStageId) ?? releasePipeline.stages[0] ?? null;
  const activeDeliveryStage =
    releasePipeline.deliveryChain.stages.find((stage) => stage.id === releasePipeline.deliveryChain.currentStageId) ??
    releasePipeline.deliveryChain.stages[0] ??
    null;
  const gatewayLikeActivities = agents.recentActivity.slice(0, 4);
  const bridgeRows = [
    { id: "bridge-mode", label: "桥接状态", value: status.bridge, detail: bridge.summary, tone: status.bridge === "live" ? "positive" : "warning" },
    { id: "ipc-slots", label: "IPC 槽位", value: `${bridge.slotHandlers.length} 个`, detail: "只在高级诊断里显示槽位和处理器细节。", tone: "neutral" },
    { id: "validators", label: "校验器", value: `${bridge.validators.length} 个`, detail: "用于判断动作是否具备执行前提。", tone: "neutral" },
    { id: "commands", label: "命令注册表", value: `${commandSurface.actions.length} 项`, detail: "主命令面板默认只展示一级入口。", tone: "positive" }
  ];
  const boundaryRows = [
    { id: "host", label: "Host Executor", value: hostExecutor.defaultEnabled ? "已启用" : "受保护", detail: hostExecutor.summary, tone: "warning" },
    { id: "policy", label: "安全策略", value: boundary.policy.posture, detail: boundary.policy.detail, tone: boundary.tone },
    { id: "release", label: "审查链", value: activeReleaseStage?.label ?? "不可用", detail: activeReleaseStage?.summary ?? releasePipeline.summary, tone: activeReleaseStage?.status === "ready" ? "positive" : "warning" },
    { id: "delivery", label: "发布/恢复链", value: activeDeliveryStage?.label ?? "不可用", detail: activeDeliveryStage?.summary ?? releasePipeline.deliveryChain.summary, tone: activeDeliveryStage?.status === "ready" ? "positive" : "warning" }
  ];

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">诊断与审查</p>
          <h1>高级诊断</h1>
        </div>
        <p className="page-summary">主界面只保留判断入口；运行态探针、桥接、审查链和安全边界集中在这里。</p>
      </div>

      <article className="surface card">
        <div className="card-header card-header--stack">
          <div>
            <h2>诊断摘要</h2>
            <p>宿主执行器：受保护，未启用真实宿主写入。需要查看细节时再切换下面的诊断分区。</p>
          </div>
        </div>
        <div className="metric-grid metric-grid--compact">
          {[
            ...agents.metrics.slice(0, 2),
            { id: "metric-boundary", label: "边界层", value: boundary.currentLayer, tone: boundary.tone },
            { id: "metric-release", label: "审查阶段", value: activeReleaseStage?.status ?? "unknown", tone: activeReleaseStage?.status === "ready" ? "positive" : "warning" }
          ].map((metric) => (
            <article key={metric.id} className="surface stat-pill stat-pill--neutral">
              <span>{formatProductText(metric.label)}</span>
              <strong>{formatProductText(metric.value)}</strong>
            </article>
          ))}
        </div>
      </article>

      <div className="diagnostics-tabs" role="tablist" aria-label="高级诊断分区">
        {DIAGNOSTIC_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? "diagnostics-tab diagnostics-tab--active" : "diagnostics-tab"}
            onClick={() => setActiveTab(tab.id)}
          >
            <strong>{tab.label}</strong>
            <span>{tab.summary}</span>
          </button>
        ))}
      </div>

      {activeTab === "runtime" ? (
        <div className="content-grid">
          <article className="surface card">
            <div className="card-header">
              <div>
                <h2>运行态探针</h2>
                <p>最近的代理、会话、网关和资源类信号。</p>
              </div>
              <span>{agents.roster.length} 条通道</span>
            </div>
            <div className="stack-list">
              {agents.roster.map((agent) => (
                <article key={agent.id} className="list-row list-row--stacked">
                  <div className="row-heading">
                    <div>
                      <strong>{formatProductText(agent.name)}</strong>
                      <p>{formatProductText(agent.role)}</p>
                    </div>
                    <span className={`status-chip status-chip--${agent.status}`}>{formatProductText(agent.status)}</span>
                  </div>
                  <p>{formatProductText(agent.focus)}</p>
                  <div className="live-mapping-grid">
                    <div className="live-mapping-item">
                      <span>来源</span>
                      <strong>{formatProductText(agent.source, "未知")}</strong>
                    </div>
                    <div className="live-mapping-item">
                      <span>提供方</span>
                      <strong>{formatProductText(agent.provider, "未知")}</strong>
                    </div>
                    <div className="live-mapping-item">
                      <span>会话数</span>
                      <strong>{typeof agent.sessionCount === "number" ? agent.sessionCount : "-"}</strong>
                    </div>
                    <div className="live-mapping-item">
                      <span>工作目录</span>
                      <strong>{formatProductText(agent.cwd ?? agent.workspace)}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="surface card">
            <div className="card-header">
              <div>
                <h2>最近诊断动态</h2>
                <p>按时间查看当前运行通道相关的最新变化。</p>
              </div>
            </div>
            <div className="timeline">
              {gatewayLikeActivities.map((item) => (
                <div key={item.id} className="timeline-item">
                  <div className="timeline-marker" />
                  <div>
                    <strong>{formatProductText(item.title)}</strong>
                    <p>{formatProductText(item.detail)}</p>
                  </div>
                  <span className="timestamp">{formatProductText(item.timestamp)}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      ) : null}

      {activeTab === "bridge" ? (
        <div className="content-grid">
          <article className="surface card">
            <div className="card-header">
              <div>
                <h2>桥接与 IPC</h2>
                <p>命令面、IPC 槽位和校验器只在这里展开。</p>
              </div>
            </div>
            <div className="stack-list">
              {bridgeRows.map((item) => (
                <article key={item.id} className="list-row list-row--stacked">
                  <div className="row-heading">
                    <strong>{item.label}</strong>
                    <span className={`tone-chip tone-chip--${toneClass(item.tone)}`}>{formatProductText(item.value)}</span>
                  </div>
                  <p>{formatProductText(item.detail)}</p>
                </article>
              ))}
            </div>
          </article>

          <article className="surface card">
            <div className="card-header">
              <div>
                <h2>命令入口分层</h2>
                <p>普通命令面板只显示一级入口；高级诊断页才显示完整诊断动作。</p>
              </div>
            </div>
            <div className="stack-list">
              {commandSurface.contexts.slice(0, 6).map((context) => (
                <article key={context.id} className="list-row list-row--stacked">
                  <div className="row-heading">
                    <strong>{formatProductText(context.label)}</strong>
                    <span>{context.actionIds.length} 项</span>
                  </div>
                  <p>{formatProductText(context.summary)}</p>
                </article>
              ))}
            </div>
          </article>
        </div>
      ) : null}

      {activeTab === "boundary" ? (
        <article className="surface card">
          <div className="card-header">
            <div>
              <h2>安全边界</h2>
              <p>宿主写入、审查链、发布链和恢复建议集中查看。</p>
            </div>
          </div>
          <div className="stack-list">
            {boundaryRows.map((item) => (
              <article key={item.id} className="list-row list-row--stacked">
                <div className="row-heading">
                  <strong>{formatProductText(item.label)}</strong>
                  <span className={`tone-chip tone-chip--${toneClass(item.tone)}`}>{formatProductText(item.value)}</span>
                </div>
                <p>{formatProductText(item.detail)}</p>
              </article>
            ))}
          </div>
        </article>
      ) : null}

      <article className="surface card">
        <div className="card-header">
          <div>
            <h2>协作提示</h2>
            <p>用当前运行通道与任务读数判断下一步排查方向。</p>
          </div>
        </div>
        <div className="stack-list">
          <article className="list-row list-row--stacked">
            <div className="row-heading">
              <strong>当前协作摘要</strong>
            </div>
            <p>{formatProductText(agents.delegationSummary)}</p>
          </article>
          {agents.delegationNotes.map((item) => (
            <article key={item.id} className="list-row list-row--stacked">
              <div className="row-heading">
                <strong>{formatProductText(item.label)}</strong>
                <span className={`tone-chip tone-chip--${item.tone}`}>{formatProductText(item.value)}</span>
              </div>
              <p>{formatProductText(item.detail)}</p>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
