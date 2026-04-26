import { CircleSlash, Power, ServerCog } from "lucide-react";
import type { DashboardServiceStatusItem } from "../../hooks/useDashboardRealtimeData";

interface GatewayRailStatusProps {
  items: DashboardServiceStatusItem[];
  compact?: boolean;
}

function formatTime(timestamp: number | null): string {
  if (!timestamp) {
    return "快照";
  }

  const diffMs = Date.now() - timestamp;
  if (diffMs < 60_000) {
    return "刚刚";
  }

  return `${Math.floor(diffMs / 60_000)}m 前`;
}

function formatCompactLabel(label: string): string {
  return label.replace(/\s*Gateway$/i, "");
}

export function GatewayRailStatus({ items, compact = false }: GatewayRailStatusProps) {
  const visibleItems = compact ? items.filter((item) => item.id !== "host") : items;
  const hostItem = items.find((item) => item.id === "host") ?? null;
  const liveServiceCount = visibleItems.filter((item) => item.source === "runtime-service").length;

  return (
    <section className={compact ? "gateway-rail gateway-rail--compact" : "gateway-rail"}>
      <div className="gateway-rail__header">
        <span className="gateway-rail__icon">
          <ServerCog size={16} strokeWidth={2.2} aria-hidden="true" />
        </span>
        <strong>网关连接</strong>
      </div>
      <div className="gateway-rail__list">
        {visibleItems.length > 0 ? (
          visibleItems.map((item) => (
            <div key={item.id} className={`gateway-rail__row gateway-rail__row--${item.tone}`}>
              <span className="gateway-rail__state">
                {item.tone === "warning" ? <CircleSlash size={13} strokeWidth={2.2} aria-hidden="true" /> : <Power size={13} strokeWidth={2.2} aria-hidden="true" />}
              </span>
              <span className="gateway-rail__copy">
                <strong>{compact ? formatCompactLabel(item.label) : item.label}</strong>
                <em>{item.value}</em>
                {!compact ? <small>{item.detail}</small> : null}
              </span>
              <span className="gateway-rail__time">{formatTime(item.lastCheckedAt)}</span>
            </div>
          ))
        ) : (
          <div className="gateway-rail__empty">状态加载中</div>
        )}
      </div>
      {compact ? (
        <div className="gateway-rail__metrics">
          <div>
            <span>采样</span>
            <strong>{visibleItems.length > 0 ? `${liveServiceCount}/${visibleItems.length}` : "未采样"}</strong>
          </div>
          <div>
            <span>宿主执行</span>
            <strong>{hostItem?.value ?? "未采样"}</strong>
          </div>
        </div>
      ) : null}
    </section>
  );
}
