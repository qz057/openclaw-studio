import { ChevronDown } from "lucide-react";
import type { DashboardStreamItem } from "../../hooks/useDashboardRealtimeData";
import { formatProductText } from "../../lib/product-text";

interface LiveSessionStreamProps {
  title: string;
  eyebrow: string;
  items: DashboardStreamItem[];
  emptyText: string;
}

export function LiveSessionStream({ title, eyebrow, items, emptyText }: LiveSessionStreamProps) {
  return (
    <article className="dashboard-panel live-session-stream">
      <div className="dashboard-panel__header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <button type="button" className="dashboard-session-filter">
          全部会话
          <ChevronDown size={14} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
      <div className="live-session-stream__body">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="live-session-line" title={`${item.title} · ${item.meta}`}>
              <span className="live-session-line__time">{formatProductText(item.timestamp)}</span>
              <span className="live-session-line__actor">{item.actor.toUpperCase()}</span>
              <span className="live-session-line__text">{formatProductText(item.detail || item.title)}</span>
              <span className="live-session-line__status">{formatProductText(item.status)}</span>
            </div>
          ))
        ) : (
          <div className="dashboard-empty-state dashboard-empty-state--mono">{emptyText}</div>
        )}
      </div>
    </article>
  );
}
