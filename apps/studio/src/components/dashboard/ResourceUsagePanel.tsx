import { Cpu, HardDrive, Microchip } from "lucide-react";
import type { DashboardResourceSample, DashboardResourceView } from "../../hooks/useDashboardRealtimeData";

interface ResourceUsagePanelProps {
  resources: DashboardResourceView;
}

function isFiniteNumber(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatPercent(value: number | null): string {
  return isFiniteNumber(value) ? `${Math.round(value)}%` : "未采样";
}

function barHeight(value: number | null): string {
  return `${Math.max(3, Math.min(100, isFiniteNumber(value) ? value : 0))}%`;
}

function formatSampleLabel(sample: DashboardResourceSample, index: number, total: number): string {
  if (sample.timestamp) {
    return new Date(sample.timestamp).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  return total <= 1 ? "now" : `-${total - index - 1}`;
}

export function ResourceUsagePanel({ resources }: ResourceUsagePanelProps) {
  const samples = resources.samples.slice(-7);
  const hasGpuSamples = samples.some((sample) => isFiniteNumber(sample.gpuPercent));

  return (
    <article className="dashboard-panel resource-usage-panel">
      <div className="dashboard-panel__header">
        <div>
          <p className="eyebrow">RESOURCES</p>
          <h2>资源使用趋势</h2>
        </div>
        <span className="dashboard-source-chip">{resources.source === "collector-missing" ? "未采样" : "metric"}</span>
      </div>
      <div className="resource-chart-legend">
        <span className="resource-chart-legend__cpu">CPU (%)</span>
        <span className="resource-chart-legend__gpu">GPU (%)</span>
        <span className="resource-chart-legend__memory">内存 (%)</span>
      </div>
      <div className="resource-bar-chart">
        {samples.length > 0 ? (
          samples.map((sample, index) => (
            <div key={`${sample.timestamp}-${index}`} className="resource-bar-group">
              <div className="resource-bar-group__bars">
                <i className="resource-bar resource-bar--cpu" style={{ "--bar-height": barHeight(sample.cpuPercent) }} title={`CPU ${formatPercent(sample.cpuPercent)}`} />
                <i
                  className={isFiniteNumber(sample.gpuPercent) ? "resource-bar resource-bar--gpu" : "resource-bar resource-bar--gpu resource-bar--missing"}
                  style={{ "--bar-height": barHeight(sample.gpuPercent) }}
                  title={`GPU ${formatPercent(sample.gpuPercent)}`}
                />
                <i className="resource-bar resource-bar--memory" style={{ "--bar-height": barHeight(sample.memoryPercent) }} title={`内存 ${formatPercent(sample.memoryPercent)}`} />
              </div>
              <span>{formatSampleLabel(sample, index, samples.length)}</span>
            </div>
          ))
        ) : (
          <div className="dashboard-empty-state">资源 rolling buffer 等待首个样本</div>
        )}
      </div>
      <div className="resource-usage-panel__grid">
        <div className="resource-meter">
          <Cpu size={16} strokeWidth={2.2} aria-hidden="true" />
          <span>CPU</span>
          <strong>{formatPercent(resources.cpuPercent)}</strong>
        </div>
        <div className="resource-meter">
          <HardDrive size={16} strokeWidth={2.2} aria-hidden="true" />
          <span>内存</span>
          <strong>{formatPercent(resources.memoryPercent)}</strong>
        </div>
        <div className="resource-meter">
          <Microchip size={16} strokeWidth={2.2} aria-hidden="true" />
          <span>GPU</span>
          <strong>{resources.gpuText}</strong>
        </div>
      </div>
      <div className="resource-usage-panel__meta">
        <span>内存 {resources.memoryUsedText} / {resources.memoryTotalText}</span>
        <span>进程 {resources.pidText}</span>
        <span>运行 {resources.uptimeText}</span>
        <span>{resources.platformText}</span>
        <span>GPU {resources.gpuDetailText}</span>
        <span>{hasGpuSamples ? "GPU utilization sampled" : "GPU utilization waiting"}</span>
      </div>
      {resources.alerts.length > 0 ? (
        <div className="resource-alert-list">
          {resources.alerts.slice(0, 3).map((alert) => (
            <span key={`${alert.type}-${alert.timestamp}`}>{alert.message}</span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
