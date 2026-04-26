/**
 * Performance Monitor
 * 监控应用性能指标，包括内存使用、CPU使用、IPC延迟等
 */

import { EventEmitter } from "events";
import * as os from "os";
import { execFile, execFileSync } from "child_process";
import type { PerformanceMetrics, PerformanceAlert } from "@openclaw/shared";

type PerformanceGpuMetrics = NonNullable<PerformanceMetrics["gpu"]>;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export class PerformanceMonitor extends EventEmitter {
  private intervalId: NodeJS.Timeout | null = null;
  private lastCpuUsage = process.cpuUsage();
  private lastTimestamp = Date.now();
  private lastCpuPercent = 0;
  private metricsHistory: PerformanceMetrics[] = [];
  private lastGpuSample: PerformanceGpuMetrics | null = null;
  private lastGpuSampleAt = 0;
  private gpuSampleInFlight = false;
  private readonly maxHistorySize = 100;

  // 阈值配置
  private readonly thresholds = {
    memoryWarning: 500 * 1024 * 1024, // 500MB
    memoryCritical: 1024 * 1024 * 1024, // 1GB
    heapWarning: 0.8, // 80% of heap limit
    heapCritical: 0.9, // 90% of heap limit
    cpuWarning: 70, // 70%
    cpuCritical: 90, // 90%
  };

  start(intervalMs: number = 5000): void {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(() => {
      const metrics = this.collectMetrics();
      this.metricsHistory.push(metrics);

      // 保持历史记录在限制内
      if (this.metricsHistory.length > this.maxHistorySize) {
        this.metricsHistory.shift();
      }

      // 检查阈值并发出警报
      this.checkThresholds(metrics);

      // 发出指标事件
      this.emit("metrics", metrics);
    }, intervalMs);

    this.emit("started");
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.emit("stopped");
    }
  }

  getMetrics(): PerformanceMetrics {
    return this.collectMetrics();
  }

  getHistory(): PerformanceMetrics[] {
    return [...this.metricsHistory];
  }

  getAverageMetrics(count: number = 10): Partial<PerformanceMetrics> {
    const recent = this.metricsHistory.slice(-count);
    if (recent.length === 0) {
      return {};
    }

    const sum = recent.reduce(
      (acc, m) => ({
        heapUsed: acc.heapUsed + m.memory.heapUsed,
        rss: acc.rss + m.memory.rss,
        cpuPercent: acc.cpuPercent + m.cpu.percent,
      }),
      { heapUsed: 0, rss: 0, cpuPercent: 0 }
    );

    const last = recent[recent.length - 1];
    if (!last) {
      return {};
    }

    return {
      timestamp: last.timestamp,
      memory: {
        heapUsed: sum.heapUsed / recent.length,
        heapTotal: last.memory.heapTotal,
        external: last.memory.external,
        rss: sum.rss / recent.length,
      },
      cpu: {
        user: last.cpu.user,
        system: last.cpu.system,
        percent: sum.cpuPercent / recent.length,
      },
      system: last.system,
      process: last.process,
    };
  }

  private collectMetrics(): PerformanceMetrics {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage(this.lastCpuUsage);
    const now = Date.now();
    const elapsed = now - this.lastTimestamp;

    // 计算 CPU 使用百分比
    const totalCpuTime = cpuUsage.user + cpuUsage.system;
    const rawCpuPercent = elapsed >= 1_000 ? (totalCpuTime / (elapsed * 1000)) * 100 : this.lastCpuPercent;
    const cpuPercent = isFiniteNumber(rawCpuPercent) ? Math.min(rawCpuPercent, 100) : 0;
    this.lastCpuPercent = cpuPercent;

    this.lastCpuUsage = process.cpuUsage();
    this.lastTimestamp = now;

    return {
      timestamp: new Date(now).toISOString(),
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        percent: cpuPercent,
      },
      system: {
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        platform: os.platform(),
        arch: os.arch(),
      },
      gpu: this.collectGpuMetrics(now),
      process: {
        uptime: process.uptime(),
        pid: process.pid,
      },
    };
  }

  private collectGpuMetrics(now: number): PerformanceGpuMetrics {
    if (this.lastGpuSample && now - this.lastGpuSampleAt < 10_000) {
      return this.lastGpuSample;
    }

    if (process.platform !== "win32") {
      this.lastGpuSample = {
        percent: null,
        name: null,
        source: "unavailable",
        detail: "GPU sampler currently supports Windows performance counters only.",
        timestamp: new Date(now).toISOString(),
      };
      this.lastGpuSampleAt = now;
      return this.lastGpuSample;
    }

    if (!this.lastGpuSample || !this.lastGpuSample.name) {
      this.lastGpuSample = this.collectGpuAdapter(now);
      this.lastGpuSampleAt = now;
    }

    this.refreshGpuUtilization(now);

    return this.lastGpuSample;
  }

  private collectGpuAdapter(now: number): PerformanceGpuMetrics {
    const script = `
$ErrorActionPreference = "SilentlyContinue"
$adapter = Get-CimInstance Win32_VideoController | Sort-Object AdapterRAM -Descending | Select-Object -First 1
[pscustomobject]@{
  name = $adapter.Name
} | ConvertTo-Json -Compress
`;

    try {
      const raw = execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script], {
        encoding: "utf8",
        timeout: 1_500,
        windowsHide: true,
      }).trim();
      const parsed = JSON.parse(raw) as { name?: unknown };
      const name = typeof parsed.name === "string" && parsed.name.trim() ? parsed.name.trim() : null;

      return {
        percent: null,
        name,
        source: name ? "adapter" : "unavailable",
        detail: name ? "GPU adapter detected; utilization counter refresh pending" : "No GPU adapter detected",
        timestamp: new Date(now).toISOString(),
      };
    } catch (cause) {
      return {
        percent: null,
        name: null,
        source: "unavailable",
        detail: cause instanceof Error ? cause.message : String(cause),
        timestamp: new Date(now).toISOString(),
      };
    }
  }

  private refreshGpuUtilization(now: number): void {
    if (this.gpuSampleInFlight) {
      return;
    }

    this.gpuSampleInFlight = true;

    const script = `
$ErrorActionPreference = "SilentlyContinue"
$adapter = Get-CimInstance Win32_VideoController | Sort-Object AdapterRAM -Descending | Select-Object -First 1
$counter = Get-Counter "\\GPU Engine(*)\\Utilization Percentage" -ErrorAction SilentlyContinue
$sum = $null
if ($counter) {
  $sum = ($counter.CounterSamples | Where-Object { $_.CookedValue -gt 0 } | Measure-Object -Property CookedValue -Sum).Sum
}
$percent = $null
if ($null -ne $sum) {
  $percent = [math]::Min(100, [math]::Round([double]$sum, 1))
}
[pscustomobject]@{
  name = $adapter.Name
  percent = $percent
  source = $(if ($null -ne $percent) { "windows-performance-counter" } elseif ($adapter.Name) { "adapter" } else { "unavailable" })
} | ConvertTo-Json -Compress
`;

    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
      {
        encoding: "utf8",
        timeout: 7_000,
        windowsHide: true,
      },
      (error, stdout) => {
        const sampledAt = Date.now();

        if (error) {
          this.lastGpuSample = {
            percent: null,
            name: this.lastGpuSample?.name ?? null,
            source: this.lastGpuSample?.name ? "adapter" : "unavailable",
            detail: error.message,
            timestamp: new Date(sampledAt).toISOString(),
          };
          this.lastGpuSampleAt = sampledAt;
          this.gpuSampleInFlight = false;
          return;
        }

        try {
          const raw = stdout.trim();
          const parsed = JSON.parse(raw) as { name?: unknown; percent?: unknown; source?: unknown };
          const percent = isFiniteNumber(parsed.percent) ? Math.max(0, Math.min(100, parsed.percent)) : null;
          const name = typeof parsed.name === "string" && parsed.name.trim() ? parsed.name.trim() : this.lastGpuSample?.name ?? null;
          const source =
            parsed.source === "windows-performance-counter" || parsed.source === "adapter" || parsed.source === "unavailable"
              ? parsed.source
              : percent != null
                ? "windows-performance-counter"
                : name
                  ? "adapter"
                  : "unavailable";

          this.lastGpuSample = {
            percent,
            name,
            source,
            detail:
              source === "windows-performance-counter"
                ? "Windows GPU Engine utilization counter"
                : source === "adapter"
                  ? "GPU adapter detected; utilization counter unavailable"
                  : "No GPU adapter or utilization counter detected",
            timestamp: new Date(sampledAt).toISOString(),
          };
        } catch (cause) {
          this.lastGpuSample = {
            percent: null,
            name: this.lastGpuSample?.name ?? null,
            source: this.lastGpuSample?.name ? "adapter" : "unavailable",
            detail: cause instanceof Error ? cause.message : String(cause),
            timestamp: new Date(sampledAt).toISOString(),
          };
        } finally {
          this.lastGpuSampleAt = sampledAt;
          this.gpuSampleInFlight = false;
        }
      }
    );
  }

  private checkThresholds(metrics: PerformanceMetrics): void {
    const alerts: PerformanceAlert[] = [];
    const now = Date.now();

    // 检查内存使用
    if (metrics.memory.rss > this.thresholds.memoryCritical) {
      alerts.push({
        type: "memory",
        severity: "critical",
        message: `RSS 内存使用过高: ${(metrics.memory.rss / 1024 / 1024).toFixed(2)} MB`,
        value: metrics.memory.rss,
        threshold: this.thresholds.memoryCritical,
        timestamp: new Date(now).toISOString(),
      });
    } else if (metrics.memory.rss > this.thresholds.memoryWarning) {
      alerts.push({
        type: "memory",
        severity: "warning",
        message: `RSS 内存使用较高: ${(metrics.memory.rss / 1024 / 1024).toFixed(2)} MB`,
        value: metrics.memory.rss,
        threshold: this.thresholds.memoryWarning,
        timestamp: new Date(now).toISOString(),
      });
    }

    // 检查堆使用
    const heapUsageRatio = metrics.memory.heapUsed / metrics.memory.heapTotal;
    if (heapUsageRatio > this.thresholds.heapCritical) {
      alerts.push({
        type: "heap",
        severity: "critical",
        message: `堆内存使用过高: ${(heapUsageRatio * 100).toFixed(1)}%`,
        value: heapUsageRatio,
        threshold: this.thresholds.heapCritical,
        timestamp: new Date(now).toISOString(),
      });
    } else if (heapUsageRatio > this.thresholds.heapWarning) {
      alerts.push({
        type: "heap",
        severity: "warning",
        message: `堆内存使用较高: ${(heapUsageRatio * 100).toFixed(1)}%`,
        value: heapUsageRatio,
        threshold: this.thresholds.heapWarning,
        timestamp: new Date(now).toISOString(),
      });
    }

    // 检查 CPU 使用
    if (metrics.cpu.percent > this.thresholds.cpuCritical) {
      alerts.push({
        type: "cpu",
        severity: "critical",
        message: `CPU 使用过高: ${metrics.cpu.percent.toFixed(1)}%`,
        value: metrics.cpu.percent,
        threshold: this.thresholds.cpuCritical,
        timestamp: new Date(now).toISOString(),
      });
    } else if (metrics.cpu.percent > this.thresholds.cpuWarning) {
      alerts.push({
        type: "cpu",
        severity: "warning",
        message: `CPU 使用较高: ${metrics.cpu.percent.toFixed(1)}%`,
        value: metrics.cpu.percent,
        threshold: this.thresholds.cpuWarning,
        timestamp: new Date(now).toISOString(),
      });
    }

    // 发出警报
    alerts.forEach((alert) => {
      this.emit("alert", alert);
    });
  }
}

// 单例实例
let monitorInstance: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!monitorInstance) {
    monitorInstance = new PerformanceMonitor();
  }
  return monitorInstance;
}
