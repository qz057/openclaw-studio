import { Activity, CircleSlash, Power, ServerCog, Waypoints } from "lucide-react";
import type { DashboardRealtimeViewModel } from "../../hooks/useDashboardRealtimeData";
import { LiveSessionStream } from "./LiveSessionStream";

interface ClaudeOrchestrationPanelProps {
  viewModel: DashboardRealtimeViewModel;
}

export function ClaudeOrchestrationPanel({ viewModel }: ClaudeOrchestrationPanelProps) {
  const liveGatewayCount = viewModel.gatewayRail.filter((item) => item.source === "runtime-service").length;
  const visibleGateways = viewModel.gatewayRail.slice(0, 3);
  const visibleNodes = viewModel.routeMap.slice(0, 4);

  return (
    <article className="dashboard-panel claude-orchestration-panel">
      <div className="dashboard-panel__header">
        <div>
          <p className="eyebrow">网关实时</p>
          <h2>网关与节点</h2>
        </div>
        <span className="dashboard-linear-cursor" aria-hidden="true" />
      </div>
      <div className="claude-orchestration-panel__grid">
        <div className="claude-orchestration-panel__visual">
          <div className="gateway-node-panel__summary" aria-label="网关实时状态">
            <div>
              <ServerCog size={15} strokeWidth={2.2} aria-hidden="true" />
              <span>网关采样</span>
              <strong>{viewModel.gatewayRail.length > 0 ? `${liveGatewayCount}/${viewModel.gatewayRail.length}` : "未采样"}</strong>
            </div>
            <div>
              <Activity size={15} strokeWidth={2.2} aria-hidden="true" />
              <span>运行态</span>
              <strong>{viewModel.runtimeText}</strong>
            </div>
            <div>
              <Waypoints size={15} strokeWidth={2.2} aria-hidden="true" />
              <span>桥接</span>
              <strong>{viewModel.bridgeText}</strong>
            </div>
          </div>

          <div className="gateway-node-panel__gateway-list">
            {visibleGateways.map((item) => (
              <div key={item.id} className={`gateway-node-panel__gateway gateway-node-panel__gateway--${item.tone}`} title={item.detail}>
                <span className="gateway-node-panel__gateway-icon">
                  {item.tone === "warning" ? <CircleSlash size={13} strokeWidth={2.2} aria-hidden="true" /> : <Power size={13} strokeWidth={2.2} aria-hidden="true" />}
                </span>
                <span className="gateway-node-panel__gateway-copy">
                  <strong>{item.label}</strong>
                  <em>{item.value}</em>
                  <small>{item.detail}</small>
                </span>
              </div>
            ))}
          </div>

          <div className="gateway-node-panel__node-list" aria-label="实时节点负载">
            {visibleNodes.map((route) => (
              <div key={route.id} className="gateway-node-panel__node" title={`${route.label} · ${route.model} · ${route.detail}`}>
                <span className="gateway-node-panel__node-copy">
                  <strong>{route.label}</strong>
                  <em>{route.model}</em>
                </span>
                <i style={{ "--route-load": `${route.loadPercent ?? 0}%` }} aria-hidden="true" />
                <span>{route.loadPercent == null ? "未采样" : `${route.loadPercent}%`}</span>
              </div>
            ))}
          </div>
        </div>
        <LiveSessionStream title="Claude Code" eyebrow="会话流" items={viewModel.claudeStream} emptyText="Claude 消息未采样" />
      </div>
    </article>
  );
}
