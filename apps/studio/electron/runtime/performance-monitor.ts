/**
 * Performance Monitor
 * 监控应用性能指标，包括内存使用、CPU使用、IPC延迟等
 */

import { EventEmitter } from "events";
import * as os from "os";
import type { PerformanceMetrics, PerformanceAlert } from "@openclaw/shared";

export class PerformanceMonitor extends EventEmitter {
  private intervalId: NodeJS.Timeout | null = null;
  private lastCpuUsage = process.cpuUsage();
  private lastTimestamp = Date.now();
  private metricsHistory: PerformanceMetrics[] = [];
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
    const cpuPercent = (totalCpuTime / (elapsed * 1000)) * 100;

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
        percent: Math.min(cpuPercent, 100),
      },
      system: {
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        platform: os.platform(),
        arch: os.arch(),
      },
      process: {
        uptime: process.uptime(),
        pid: process.pid,
      },
    };
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
