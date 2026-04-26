import { Boxes, Route } from "lucide-react";
import type { DashboardRouteItem } from "../../hooks/useDashboardRealtimeData";

interface ModelRouteMapProps {
  routes: DashboardRouteItem[];
}

function formatLoad(load: number | null): string {
  return load == null ? "未采样" : String(load);
}

function formatLoadPercent(route: DashboardRouteItem): string {
  if (route.loadPercent == null) {
    return "未采样";
  }

  return `${route.loadPercent}%`;
}

export function ModelRouteMap({ routes }: ModelRouteMapProps) {
  const totalRequests = routes.reduce((sum, route) => sum + (route.load ?? 0), 0);
  const sampledRoutes = routes.filter((route) => route.source !== "collector-missing" && route.loadPercent != null);
  const sampledPeakLoad = sampledRoutes.length > 0 ? Math.max(...sampledRoutes.map((route) => route.loadPercent ?? 0)) : null;

  return (
    <article className="dashboard-panel model-route-map">
      <div className="dashboard-panel__header">
        <div>
          <p className="eyebrow">MODEL ROUTES</p>
          <h2>模型路由</h2>
        </div>
        <span className="dashboard-source-chip">负载控制中</span>
      </div>
      <div className="model-route-map__canvas">
        <div className="model-route-map__entry">
          <span>请求入口</span>
          <strong>{formatLoad(totalRequests || null)}</strong>
          <em>snapshot / service</em>
        </div>
        <div className="model-route-map__hub">
          <Boxes size={28} strokeWidth={2.1} aria-hidden="true" />
        </div>
        <div className="model-route-map__routes">
          {routes.map((route) => (
            <div
              key={route.id}
              className={`model-route-row model-route-row--${route.id}`}
              style={{ "--route-load": `${route.loadPercent ?? 0}%` }}
            >
              <div className="model-route-row__mark">
                <Route size={16} strokeWidth={2.1} aria-hidden="true" />
              </div>
              <div className="model-route-row__copy">
                <strong>{route.model}</strong>
                <span>{route.label} · {route.detail}</span>
              </div>
              <div className="model-route-row__load">
                <span>{formatLoad(route.load)}</span>
                <em>{formatLoadPercent(route)}</em>
                <i aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="model-route-map__stats">
        <div>
          <span>总请求数</span>
          <strong>{formatLoad(totalRequests || null)}</strong>
        </div>
        <div>
          <span>可用通道</span>
          <strong>{routes.filter((route) => route.source !== "collector-missing").length}</strong>
        </div>
        <div>
          <span>采样峰值</span>
          <strong>{sampledPeakLoad == null ? "未采样" : `${sampledPeakLoad}%`}</strong>
        </div>
      </div>
    </article>
  );
}
