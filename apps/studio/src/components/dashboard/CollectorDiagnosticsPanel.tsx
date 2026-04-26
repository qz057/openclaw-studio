import { AlertTriangle, CheckCircle2, Clock3, Radio } from "lucide-react";
import type { DashboardCollectorStatusItem, DashboardDataSource } from "../../hooks/useDashboardRealtimeData";

interface CollectorDiagnosticsPanelProps {
  items: DashboardCollectorStatusItem[];
  syncError: string | null;
}

function formatSource(source: DashboardDataSource): string {
  const map: Record<DashboardDataSource, string> = {
    snapshot: "快照",
    "runtime-metric": "指标",
    "runtime-service": "服务",
    "rolling-buffer": "滚动",
    "collector-missing": "未采集"
  };

  return map[source];
}

function formatCheckedAt(timestamp: number | null): string {
  if (!timestamp) {
    return "未检测";
  }

  return new Date(timestamp).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function getStatusIcon(item: DashboardCollectorStatusItem) {
  if (item.tone === "positive") {
    return CheckCircle2;
  }

  if (item.tone === "warning") {
    return AlertTriangle;
  }

  return Radio;
}

export function CollectorDiagnosticsPanel({ items, syncError }: CollectorDiagnosticsPanelProps) {
  return (
    <article className="dashboard-panel dashboard-collector-panel">
      <div className="dashboard-panel__header">
        <div>
          <p className="eyebrow">采集器</p>
          <h2>采集诊断</h2>
        </div>
        <span className="dashboard-source-chip">
          <Clock3 size={13} strokeWidth={2.2} aria-hidden="true" />
          5s
        </span>
      </div>

      <div className="dashboard-collector-panel__list">
        {items.map((item) => {
          const StatusIcon = getStatusIcon(item);

          return (
            <div key={item.id} className={`dashboard-collector-item dashboard-collector-item--${item.tone}`}>
              <span className="dashboard-collector-item__top">
                <strong>{item.label}</strong>
                <em>{formatSource(item.source)}</em>
              </span>
              <span className="dashboard-collector-item__status">
                <StatusIcon size={15} strokeWidth={2.2} aria-hidden="true" />
                {item.value}
              </span>
              <span className="dashboard-collector-item__detail">{item.detail}</span>
              <time>{formatCheckedAt(item.lastCheckedAt)}</time>
            </div>
          );
        })}
      </div>

      {syncError ? <p className="dashboard-sync-warning">最新采集错误：{syncError}</p> : null}
    </article>
  );
}
