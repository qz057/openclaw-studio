import type { DashboardDataSource, DashboardRealtimeViewModel } from "../hooks/useDashboardRealtimeData";
import { ChevronDown, Moon, RefreshCw, Sun } from "lucide-react";
import {
  ClaudeOrchestrationPanel,
  CollectorDiagnosticsPanel,
  DashboardKpiStrip,
  LiveSessionStream,
  ModelRouteMap,
  ResourceUsagePanel,
  TaskTypeDonut
} from "../components/dashboard";

interface DashboardPageProps {
  viewModel: DashboardRealtimeViewModel;
  themeMode: DashboardThemeMode;
  onThemeModeChange: (mode: DashboardThemeMode) => void;
}

export type DashboardThemeMode = "night" | "day";

function formatSource(source: DashboardDataSource): string {
  const map: Record<DashboardDataSource, string> = {
    snapshot: "真实快照",
    "runtime-metric": "运行指标",
    "runtime-service": "运行服务",
    "rolling-buffer": "滚动缓存",
    "collector-missing": "未采样"
  };

  return map[source];
}

function formatUpdatedAt(timestamp: number | null): string {
  if (!timestamp) {
    return "等待首个样本";
  }

  const diffMs = Date.now() - timestamp;
  if (diffMs < 60_000) {
    return "刚刚同步";
  }

  return `${Math.floor(diffMs / 60_000)} 分钟前`;
}

export function DashboardPage({ viewModel, themeMode, onThemeModeChange }: DashboardPageProps) {
  const nextThemeMode: DashboardThemeMode = themeMode === "night" ? "day" : "night";
  const ThemeIcon = themeMode === "night" ? Sun : Moon;

  return (
    <section className="page dashboard-page">
      <div className="dashboard-cockpit-shell">
        <header className="dashboard-cockpit-header">
          <div className="dashboard-cockpit-header__title">
            <h1>总览</h1>
            <span className="dashboard-live-pill">
              <span />
              实时同步
            </span>
            <em>{viewModel.refreshLabel}</em>
          </div>
          <div className="dashboard-cockpit-header__actions">
            <button type="button" className="dashboard-range-button">
              {viewModel.periodLabel}
              <ChevronDown size={15} strokeWidth={2.2} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="dashboard-icon-button dashboard-theme-toggle"
              aria-label={themeMode === "night" ? "切换白天模式" : "切换夜晚模式"}
              title={themeMode === "night" ? "切换白天模式" : "切换夜晚模式"}
              onClick={() => {
                onThemeModeChange(nextThemeMode);
              }}
            >
              <ThemeIcon size={17} strokeWidth={2.2} aria-hidden="true" />
            </button>
            <button type="button" className="dashboard-icon-button" aria-label="刷新总览">
              <RefreshCw size={17} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="dashboard-contract-strip dashboard-contract-strip--audit" aria-label="总览实时数据源审计">
          <strong>{viewModel.title}</strong>
          <span>{viewModel.runtimeText} · {viewModel.bridgeText} · {formatUpdatedAt(viewModel.generatedAt)}</span>
          {viewModel.sourceLines.map((line) => (
            <div key={line.label}>
              <span>{line.label}</span>
              <strong>{line.value}</strong>
              <em>{formatSource(line.source)}</em>
            </div>
          ))}
        </div>

        <DashboardKpiStrip items={viewModel.kpis} />

        <div className="dashboard-cockpit-grid">
          <LiveSessionStream title="Codex" eyebrow="CODEX 任务流" items={viewModel.codexStream} emptyText="Codex 任务流暂未采样" />
          <ModelRouteMap routes={viewModel.routeMap} />
          <TaskTypeDonut slices={viewModel.taskSlices} />
          <ResourceUsagePanel resources={viewModel.resources} />
          <ClaudeOrchestrationPanel viewModel={viewModel} />
          <CollectorDiagnosticsPanel items={viewModel.collectorStatuses} syncError={viewModel.syncError} />
        </div>
      </div>
    </section>
  );
}
