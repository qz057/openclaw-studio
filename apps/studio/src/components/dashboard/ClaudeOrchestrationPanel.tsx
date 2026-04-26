import { Activity, Bot, Check, ListChecks, MessageSquare, TerminalSquare, Waypoints } from "lucide-react";
import type { DashboardRealtimeViewModel } from "../../hooks/useDashboardRealtimeData";
import { LiveSessionStream } from "./LiveSessionStream";

interface ClaudeOrchestrationPanelProps {
  viewModel: DashboardRealtimeViewModel;
}

export function ClaudeOrchestrationPanel({ viewModel }: ClaudeOrchestrationPanelProps) {
  const steps = [
    { id: "intake", Icon: Check },
    { id: "context", Icon: Waypoints },
    { id: "run", Icon: Activity },
    { id: "terminal", Icon: TerminalSquare },
    { id: "report", Icon: ListChecks }
  ];

  return (
    <article className="dashboard-panel claude-orchestration-panel">
      <div className="dashboard-panel__header">
        <div>
          <p className="eyebrow">Claude 实时</p>
          <h2>协同节点</h2>
        </div>
        <span className="dashboard-linear-cursor" aria-hidden="true" />
      </div>
      <div className="claude-orchestration-panel__grid">
        <div className="claude-orchestration-panel__visual">
          <div className="claude-orchestration-panel__steps" aria-label="Claude 运行节点">
            {steps.map(({ id, Icon }, index) => (
              <span key={id} className={index < 2 ? "is-live" : ""}>
                <Icon size={16} strokeWidth={2.2} aria-hidden="true" />
              </span>
            ))}
          </div>
          <div className="claude-orchestration-panel__summary">
            <div>
              <Bot size={16} strokeWidth={2.2} aria-hidden="true" />
              <span>会话</span>
              <strong>{viewModel.claude.activeSessionCount}/{viewModel.claude.sessionCount}</strong>
            </div>
            <div>
              <MessageSquare size={16} strokeWidth={2.2} aria-hidden="true" />
              <span>消息</span>
              <strong>{viewModel.claude.messageCount}</strong>
            </div>
            <div>
              <Waypoints size={16} strokeWidth={2.2} aria-hidden="true" />
              <span>模型</span>
              <strong>{viewModel.claude.modelText}</strong>
            </div>
          </div>
          <div className="claude-orchestration-panel__routes">
            {viewModel.routeMap.map((route) => (
              <div key={route.id}>
                <span>{route.model}</span>
                <i style={{ "--route-load": `${route.loadPercent ?? 0}%` }} aria-hidden="true" />
                <strong>{route.loadPercent == null ? "未采样" : `${route.loadPercent}%`}</strong>
              </div>
            ))}
          </div>
          <div className="claude-orchestration-panel__meta">
            <span>{viewModel.claude.latestSessionTitle}</span>
            <span>{viewModel.claude.permissionText}</span>
            <span>{viewModel.claude.rootPath}</span>
          </div>
        </div>
        <LiveSessionStream title="Claude Code" eyebrow="会话流" items={viewModel.claudeStream} emptyText="Claude 消息未采样" />
      </div>
    </article>
  );
}
