import { Archive, Clock3, ListChecks, MessageSquare, ShieldCheck, Target } from "lucide-react";
import type { DashboardKpiItem } from "../../hooks/useDashboardRealtimeData";

interface DashboardKpiStripProps {
  items: DashboardKpiItem[];
}

const iconMap = {
  tasks: Archive,
  sessions: MessageSquare,
  queue: ListChecks,
  success: Target,
  latency: Clock3,
  health: ShieldCheck
};

function formatSource(source: DashboardKpiItem["source"]): string {
  const map: Record<DashboardKpiItem["source"], string> = {
    snapshot: "快照",
    "runtime-metric": "指标",
    "runtime-service": "服务",
    "rolling-buffer": "滚动",
    "collector-missing": "未采样"
  };

  return map[source];
}

export function DashboardKpiStrip({ items }: DashboardKpiStripProps) {
  return (
    <div className="dashboard-top-kpis">
      {items.map((item) => {
        const Icon = iconMap[item.id as keyof typeof iconMap] ?? Target;
        const progress = item.progress ?? 0;

        return (
          <article
            key={item.id}
            className={`dashboard-top-kpi dashboard-top-kpi--${item.accent} dashboard-top-kpi--${item.tone}`}
            style={{ "--kpi-progress": `${progress}%` }}
          >
            <div className="dashboard-top-kpi__ring">
              <span className="dashboard-top-kpi__inner">
                <Icon size={27} strokeWidth={2.1} aria-hidden="true" />
              </span>
            </div>
            <div className="dashboard-top-kpi__copy">
              <div className="dashboard-top-kpi__meta">
                <span>{item.label}</span>
                <em>{formatSource(item.source)}</em>
              </div>
              <strong>{item.value}</strong>
              <p className={`dashboard-top-kpi__trend dashboard-top-kpi__trend--${item.trendDirection}`}>{item.trendLabel}</p>
              <p>{item.detail}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
