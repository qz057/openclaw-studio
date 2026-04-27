import { ChevronDown } from "lucide-react";
import type { DashboardStreamItem } from "../../hooks/useDashboardRealtimeData";
import { formatProductText } from "../../lib/product-text";

interface LiveSessionStreamProps {
  title: string;
  eyebrow: string;
  items: DashboardStreamItem[];
  emptyText: string;
}

function getStreamMessage(item: DashboardStreamItem): string {
  const detail = item.detail.trim();
  const detailLooksLikeMetadata = /^(CLI\s|Local Codex session log\b)/i.test(detail) || detail.includes("latest response");

  return formatProductText(detail && !detailLooksLikeMetadata ? detail : item.title);
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
      <div className="live-session-stream__body" role="log" aria-live="polite" aria-label={`${title} 实时回复字幕滚动`}>
        {items.length > 0 ? (
          items.map((item, index) => {
            const message = getStreamMessage(item);

            return (
              <div
                key={item.id}
                className={index === 0 ? "live-session-line live-session-line--active" : "live-session-line"}
                title={`${message} · ${item.meta}`}
              >
                <span className="live-session-line__text">{message}</span>
                <span className="live-session-line__meta">
                  <span className="live-session-line__time">{formatProductText(item.timestamp)}</span>
                  <span className="live-session-line__actor">{item.actor.toUpperCase()}</span>
                  <span className="live-session-line__status">{formatProductText(item.status)}</span>
                  <span className="live-session-line__context">{formatProductText(item.meta)}</span>
                </span>
              </div>
            );
          })
        ) : (
          <div className="dashboard-empty-state dashboard-empty-state--mono">{emptyText}</div>
        )}
      </div>
    </article>
  );
}
