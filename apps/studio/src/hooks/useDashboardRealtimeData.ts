import { useEffect, useMemo, useState } from "react";
import {
  getPerformanceMetrics,
  loadClaudeSessionMessages,
  loadClaudeSnapshot,
  loadHermesGatewayServiceState,
  loadHermesSessionMessages,
  loadHermesSnapshot,
  loadHermesState,
  loadOpenClawChatState,
  loadOpenClawGatewayServiceState,
  subscribeToPerformanceAlerts
} from "@openclaw/bridge";
import type {
  CodexTaskSummary,
  PerformanceAlert,
  PerformanceMetrics,
  SessionSummary,
  StudioClaudeMessage,
  StudioClaudeSessionSummary,
  StudioClaudeSnapshot,
  StudioGatewayServiceState,
  StudioHermesMessage,
  StudioHermesSnapshot,
  StudioHermesState,
  StudioOpenClawChatState,
  StudioShellState,
  StudioTone
} from "@openclaw/shared";

const REALTIME_REFRESH_INTERVAL_MS = 5_000;
const METRIC_REFRESH_INTERVAL_MS = 5_000;
const ROLLING_SAMPLE_LIMIT = 24;
const STREAM_LIMIT = 6;

export type DashboardDataSource = "snapshot" | "runtime-metric" | "runtime-service" | "rolling-buffer" | "collector-missing";

export interface DashboardSourceLine {
  label: string;
  value: string;
  source: DashboardDataSource;
}

export interface DashboardKpiItem {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: StudioTone;
  source: DashboardDataSource;
  progress: number | null;
  trendLabel: string;
  trendDirection: "up" | "down" | "flat" | "unknown";
  accent: "blue" | "cyan" | "purple" | "green" | "amber";
}

export interface DashboardServiceStatusItem {
  id: "openclaw" | "hermes" | "host";
  label: string;
  value: string;
  detail: string;
  tone: StudioTone;
  source: DashboardDataSource;
  lastCheckedAt: number | null;
}

export interface DashboardStreamItem {
  id: string;
  actor: string;
  title: string;
  detail: string;
  meta: string;
  timestamp: string;
  status: string;
  source: DashboardDataSource;
}

export interface DashboardRouteItem {
  id: string;
  label: string;
  model: string;
  load: number | null;
  loadPercent: number | null;
  detail: string;
  source: DashboardDataSource;
}

export interface DashboardTaskSlice {
  id: string;
  label: string;
  value: number;
  tone: StudioTone;
}

export interface DashboardResourceSample {
  timestamp: number;
  cpuPercent: number | null;
  memoryPercent: number | null;
  runningTasks: number;
  queuedTasks: number;
  totalTasks: number;
}

export interface DashboardResourceView {
  cpuPercent: number | null;
  memoryPercent: number | null;
  memoryUsedText: string;
  memoryTotalText: string;
  uptimeText: string;
  pidText: string;
  gpuText: string;
  platformText: string;
  samples: DashboardResourceSample[];
  alerts: PerformanceAlert[];
  source: DashboardDataSource;
}

export interface DashboardRealtimeViewModel {
  title: string;
  generatedAt: number | null;
  isLoading: boolean;
  syncError: string | null;
  version: string;
  statusText: string;
  bridgeText: string;
  runtimeText: string;
  periodLabel: string;
  refreshLabel: string;
  sourceLines: DashboardSourceLine[];
  gatewayRail: DashboardServiceStatusItem[];
  kpis: DashboardKpiItem[];
  codexStream: DashboardStreamItem[];
  claudeStream: DashboardStreamItem[];
  routeMap: DashboardRouteItem[];
  taskSlices: DashboardTaskSlice[];
  resources: DashboardResourceView;
  claude: {
    sessionCount: number;
    activeSessionCount: number;
    messageCount: number;
    latestSessionTitle: string;
    modelText: string;
    permissionText: string;
    rootPath: string;
    source: DashboardDataSource;
  };
  unavailableCollectors: DashboardSourceLine[];
}

interface RuntimeSidecarState {
  performance: PerformanceMetrics | null;
  openclawGateway: StudioGatewayServiceState | null;
  hermesGateway: StudioGatewayServiceState | null;
  hermesState: StudioHermesState | null;
  hermesSnapshot: StudioHermesSnapshot | null;
  hermesMessages: StudioHermesMessage[];
  claudeSnapshot: StudioClaudeSnapshot | null;
  claudeMessages: StudioClaudeMessage[];
  openclawChat: StudioOpenClawChatState | null;
  error: string | null;
  updatedAt: number | null;
  lastMetricDurationMs: number | null;
  lastRuntimeDurationMs: number | null;
  lastRuntimeSuccessCount: number;
  lastRuntimeRequestCount: number;
}

const initialSidecarState: RuntimeSidecarState = {
  performance: null,
  openclawGateway: null,
  hermesGateway: null,
  hermesState: null,
  hermesSnapshot: null,
  hermesMessages: [],
  claudeSnapshot: null,
  claudeMessages: [],
  openclawChat: null,
  error: null,
  updatedAt: null,
  lastMetricDurationMs: null,
  lastRuntimeDurationMs: null,
  lastRuntimeSuccessCount: 0,
  lastRuntimeRequestCount: 0
};

function formatStatusValue(value: string): string {
  const map: Record<string, string> = {
    ready: "就绪",
    idle: "空闲",
    degraded: "降级",
    live: "实时",
    hybrid: "混合",
    mock: "模拟",
    running: "运行中",
    queued: "排队",
    complete: "完成",
    recent: "最近",
    "needs-review": "待复核",
    active: "活动",
    waiting: "等待",
    disabled: "禁用",
    withheld: "已拦截",
    blocked: "阻塞"
  };

  return map[value.trim().toLowerCase()] ?? value;
}

function getServiceTone(label: string, running?: boolean): StudioTone {
  const normalized = label.toLowerCase();

  if (running || /(ready|live|connected|operational|就绪|实时|已连接|可用|运行中)/.test(normalized)) {
    return "positive";
  }

  if (/(blocked|disabled|fallback|mock|unknown|error|failed|未|不可|异常|失败|禁用|模拟|回退)/.test(normalized)) {
    return "warning";
  }

  return "neutral";
}

function compactServiceValue(value: string): string {
  return value.replace(/^[^·]+·\s*/, "");
}

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) {
    return "未采样";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

function formatUptime(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) {
    return "未采样";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${Math.max(1, minutes)}m`;
}

function formatPercent(value: number | null): string {
  return value == null ? "未采样" : `${Math.round(value)}%`;
}

function formatDurationMs(value: number | null): string {
  return value == null ? "未采样" : `${Math.max(1, Math.round(value))}ms`;
}

function calculatePercent(value: number, total: number): number | null {
  return total > 0 ? Math.round((value / total) * 100) : null;
}

function firstError(results: PromiseSettledResult<unknown>[]): string | null {
  const failed = results.find((result) => result.status === "rejected") as PromiseRejectedResult | undefined;

  if (!failed) {
    return null;
  }

  return failed.reason instanceof Error ? failed.reason.message : String(failed.reason);
}

function getTaskCounts(tasks: CodexTaskSummary[]) {
  const running = tasks.filter((task) => task.status === "running").length;
  const queued = tasks.filter((task) => task.status === "queued").length;
  const review = tasks.filter((task) => task.status === "needs-review").length;
  const complete = tasks.filter((task) => task.status === "complete").length;
  const recent = tasks.filter((task) => task.status === "recent").length;

  return {
    total: tasks.length,
    running,
    queued,
    review,
    complete,
    recent
  };
}

function getSessionCounts(sessions: SessionSummary[]) {
  const active = sessions.filter((session) => session.status === "active" || session.status === "waiting").length;
  const complete = sessions.filter((session) => session.status === "complete").length;

  return {
    total: sessions.length,
    active,
    complete
  };
}

function statusTone(status: CodexTaskSummary["status"]): StudioTone {
  if (status === "running" || status === "complete") {
    return "positive";
  }

  if (status === "queued" || status === "needs-review") {
    return "warning";
  }

  return "neutral";
}

function normalizeModel(model: string | null | undefined): string {
  return model?.trim() || "未采样";
}

function getLatestClaudeSession(snapshot: StudioClaudeSnapshot | null): StudioClaudeSessionSummary | null {
  if (!snapshot?.sessions.length) {
    return null;
  }

  return [...snapshot.sessions].sort((left, right) => right.updatedAt - left.updatedAt)[0] ?? null;
}

function formatClaudeSessionTitle(session: StudioClaudeSessionSummary | null): string {
  if (!session) {
    return "未采样";
  }

  return session.projectPath?.split(/[\\/]/).filter(Boolean).at(-1) ?? session.projectKey ?? session.id;
}

function getTaskCategory(task: CodexTaskSummary): string {
  const text = `${task.target} ${task.title}`.toLowerCase();

  if (/(data|metric|analysis|analytics|dashboard|chart|report|trend|csv|json|snapshot)/.test(text)) {
    return "data";
  }

  if (/(generate|content|copy|docs|document|markdown|page|visual|renderer|ui|layout)/.test(text)) {
    return "content";
  }

  if (/(query|answer|knowledge|context|review|audit|session|chat|claude|codex|hermes)/.test(text)) {
    return "knowledge";
  }

  return "automation";
}

function buildTaskSlices(tasks: CodexTaskSummary[]): DashboardTaskSlice[] {
  const labels: Record<string, string> = {
    data: "数据分析",
    content: "内容生成",
    knowledge: "知识问答",
    automation: "流程自动化"
  };
  const tones: Record<string, StudioTone> = {
    data: "neutral",
    content: "positive",
    knowledge: "warning",
    automation: "neutral"
  };
  const counts = tasks.reduce<Record<string, number>>((nextCounts, task) => {
    const category = getTaskCategory(task);
    nextCounts[category] = (nextCounts[category] ?? 0) + 1;
    return nextCounts;
  }, {});
  const slices: DashboardTaskSlice[] = Object.entries(labels).map(([id, label]) => ({
    id,
    label,
    value: counts[id] ?? 0,
    tone: tones[id] ?? "neutral"
  }));

  return slices;
}

function createCodexStream(tasks: CodexTaskSummary[]): DashboardStreamItem[] {
  return tasks.slice(0, STREAM_LIMIT).map((task) => ({
    id: task.id,
    actor: "Codex",
    title: task.title,
    detail: task.detail ?? task.target,
    meta: `${normalizeModel(task.model)} · ${task.target}`,
    timestamp: task.updatedAt,
    status: formatStatusValue(task.status),
    source: task.source === "runtime" ? "snapshot" : "snapshot"
  }));
}

function createClaudeStream(snapshot: StudioClaudeSnapshot | null, messages: StudioClaudeMessage[]): DashboardStreamItem[] {
  if (messages.length > 0) {
    return messages.slice(-STREAM_LIMIT).reverse().map((message) => ({
      id: message.id,
      actor: message.role === "assistant" ? "Claude" : message.role,
      title: message.kind === "tool_use" ? "工具调用" : message.kind === "tool_result" ? "工具结果" : "会话消息",
      detail: message.text || "空消息",
      meta: normalizeModel(message.model),
      timestamp: message.timestamp ?? "未知时间",
      status: message.role,
      source: "runtime-service"
    }));
  }

  return (snapshot?.sessions ?? []).slice(0, STREAM_LIMIT).map((session) => ({
    id: session.id,
    actor: "Claude",
    title: formatClaudeSessionTitle(session),
    detail: session.preview ?? "未读取到最近消息",
    meta: `${session.messageCount} 条消息`,
    timestamp: session.updatedAt ? new Date(session.updatedAt).toLocaleString("zh-CN") : "未知时间",
    status: session.active ? "活动" : "历史",
    source: "runtime-service"
  }));
}

function createServiceStatus(
  snapshot: StudioShellState,
  sidecar: RuntimeSidecarState
): DashboardServiceStatusItem[] {
  const hostExecutorMode = snapshot.boundary.hostExecutor.mode;
  const openclaw = sidecar.openclawGateway;
  const hermes = sidecar.hermesGateway;

  return [
    {
      id: "openclaw",
      label: "OpenClaw Gateway",
      value: compactServiceValue(openclaw?.statusLabel ?? formatStatusValue(snapshot.status.bridge)),
      detail: openclaw?.detail ?? "来自 5 秒 shell snapshot 的桥接状态",
      tone: getServiceTone(openclaw?.statusLabel ?? snapshot.status.bridge, openclaw?.running),
      source: openclaw ? "runtime-service" : "snapshot",
      lastCheckedAt: openclaw?.lastCheckedAt ?? null
    },
    {
      id: "hermes",
      label: "Hermes Gateway",
      value: compactServiceValue(hermes?.statusLabel ?? sidecar.hermesState?.readinessLabel ?? "状态加载中"),
      detail: hermes?.detail ?? sidecar.hermesState?.disabledReason ?? "Hermes 状态来自 runtime 只读探针",
      tone: getServiceTone(hermes?.statusLabel ?? sidecar.hermesState?.readinessLabel ?? "", hermes?.running),
      source: hermes || sidecar.hermesState ? "runtime-service" : "collector-missing",
      lastCheckedAt: hermes?.lastCheckedAt ?? sidecar.hermesState?.updatedAt ?? null
    },
    {
      id: "host",
      label: "Host Executor",
      value: formatStatusValue(hostExecutorMode),
      detail: snapshot.boundary.hostExecutor.summary,
      tone: hostExecutorMode === "disabled" || hostExecutorMode === "withheld" ? "warning" : "positive",
      source: "snapshot",
      lastCheckedAt: null
    }
  ];
}

function createRouteMap(
  snapshot: StudioShellState,
  sidecar: RuntimeSidecarState,
  taskCounts: ReturnType<typeof getTaskCounts>
): DashboardRouteItem[] {
  const claudeSessionCount = sidecar.claudeSnapshot?.sessions.length ?? null;
  const hermesSessionCount = sidecar.hermesSnapshot?.sessions.length ?? null;
  const openclawModel = normalizeModel(sidecar.openclawChat?.model ?? snapshot.codex.tasks[0]?.model);
  const codexModel = normalizeModel(snapshot.codex.tasks.find((task) => task.model)?.model);

  const routes: DashboardRouteItem[] = [
    {
      id: "openclaw",
      label: "OpenClaw",
      model: openclawModel,
      load: taskCounts.running + taskCounts.queued,
      loadPercent: null,
      detail: sidecar.openclawChat?.provider ? `provider: ${sidecar.openclawChat.provider}` : "聊天链路只读状态",
      source: sidecar.openclawChat ? "runtime-service" : "snapshot"
    },
    {
      id: "codex",
      label: "Codex",
      model: codexModel,
      load: taskCounts.total,
      loadPercent: null,
      detail: "任务数来自 shell snapshot",
      source: "snapshot"
    },
    {
      id: "claude",
      label: "Claude",
      model: normalizeModel(sidecar.claudeSnapshot?.settings.model),
      load: claudeSessionCount,
      loadPercent: null,
      detail: sidecar.claudeSnapshot ? "会话数来自 Claude snapshot" : "未采样",
      source: sidecar.claudeSnapshot ? "runtime-service" : "collector-missing"
    },
    {
      id: "hermes",
      label: "Hermes",
      model: sidecar.hermesState?.sessionLabel ?? "未采样",
      load: hermesSessionCount,
      loadPercent: null,
      detail: sidecar.hermesState?.endpoint ?? sidecar.hermesState?.transportLabel ?? "未采样",
      source: sidecar.hermesSnapshot || sidecar.hermesState ? "runtime-service" : "collector-missing"
    }
  ];
  const sampledTotal = routes.reduce((sum, route) => sum + (route.load ?? 0), 0);

  return routes.map((route) => ({
    ...route,
    loadPercent: route.load == null ? null : calculatePercent(route.load, sampledTotal)
  }));
}

function calculateHealthScore(snapshot: StudioShellState, gatewayRail: DashboardServiceStatusItem[], performance: PerformanceMetrics | null): number {
  const checks = [
    snapshot.status.runtime === "ready",
    snapshot.status.bridge === "live" || snapshot.status.bridge === "hybrid",
    gatewayRail.some((item) => item.id === "openclaw" && item.tone === "positive"),
    gatewayRail.some((item) => item.id === "hermes" && item.tone === "positive"),
    Boolean(performance)
  ];
  const passed = checks.filter(Boolean).length;

  return Math.round((passed / checks.length) * 100);
}

function createTaskTrend(samples: DashboardResourceSample[], currentTotal: number): Pick<DashboardKpiItem, "trendDirection" | "trendLabel"> {
  const baseline = samples.find((sample) => typeof sample.totalTasks === "number")?.totalTasks ?? currentTotal;
  const delta = currentTotal - baseline;

  if (delta === 0) {
    return { trendDirection: "flat", trendLabel: "rolling 0" };
  }

  return {
    trendDirection: delta > 0 ? "up" : "down",
    trendLabel: `${delta > 0 ? "+" : ""}${delta} rolling`
  };
}

function createKpis(
  snapshot: StudioShellState,
  sidecar: RuntimeSidecarState,
  taskCounts: ReturnType<typeof getTaskCounts>,
  sessionCounts: ReturnType<typeof getSessionCounts>,
  gatewayRail: DashboardServiceStatusItem[],
  samples: DashboardResourceSample[]
): DashboardKpiItem[] {
  const healthScore = calculateHealthScore(snapshot, gatewayRail, sidecar.performance);
  const taskTrend = createTaskTrend(samples, taskCounts.total);
  const waitingTasks = taskCounts.queued + taskCounts.review;
  const runtimeSampleRate =
    sidecar.lastRuntimeRequestCount > 0
      ? Math.round((sidecar.lastRuntimeSuccessCount / sidecar.lastRuntimeRequestCount) * 100)
      : null;
  const gatewayRuntimeCount = gatewayRail.filter((item) => item.source === "runtime-service").length;

  return [
    {
      id: "tasks",
      label: "任务总数",
      value: taskCounts.total.toLocaleString("zh-CN"),
      detail: `${taskCounts.running} 运行 · ${waitingTasks} 待处理 · ${taskCounts.complete} 完成`,
      tone: taskCounts.running > 0 ? "positive" : taskCounts.queued + taskCounts.review > 0 ? "warning" : "neutral",
      source: "snapshot",
      progress: taskCounts.total > 0 ? 100 : 0,
      trendLabel: taskTrend.trendLabel,
      trendDirection: taskTrend.trendDirection,
      accent: "blue"
    },
    {
      id: "success",
      label: "采样成功率",
      value: runtimeSampleRate == null ? "未采样" : `${runtimeSampleRate}%`,
      detail:
        sidecar.lastRuntimeRequestCount > 0
          ? `${sidecar.lastRuntimeSuccessCount}/${sidecar.lastRuntimeRequestCount} runtime 调用成功 · 会话 ${sessionCounts.active}/${sessionCounts.total}`
          : `会话 ${sessionCounts.active}/${sessionCounts.total} · 等待首个 runtime 批次`,
      tone: runtimeSampleRate == null ? "neutral" : runtimeSampleRate >= 80 ? "positive" : "warning",
      source: runtimeSampleRate == null ? "collector-missing" : "runtime-service",
      progress: runtimeSampleRate,
      trendLabel: runtimeSampleRate == null ? "等待采样" : "runtime sampled",
      trendDirection: runtimeSampleRate == null ? "unknown" : "up",
      accent: "cyan"
    },
    {
      id: "latency",
      label: "采样耗时",
      value: formatDurationMs(sidecar.lastRuntimeDurationMs ?? sidecar.lastMetricDurationMs),
      detail: `runtime ${formatDurationMs(sidecar.lastRuntimeDurationMs)} · metric ${formatDurationMs(sidecar.lastMetricDurationMs)} · gateway ${gatewayRuntimeCount}/2`,
      tone:
        sidecar.lastRuntimeDurationMs == null
          ? "neutral"
          : sidecar.lastRuntimeDurationMs > 5_000
            ? "warning"
            : "positive",
      source: sidecar.lastRuntimeDurationMs != null ? "runtime-service" : sidecar.lastMetricDurationMs != null ? "runtime-metric" : "collector-missing",
      progress:
        sidecar.lastRuntimeDurationMs == null
          ? null
          : Math.max(0, Math.min(100, 100 - Math.round(sidecar.lastRuntimeDurationMs / 100))),
      trendLabel: sidecar.lastRuntimeDurationMs == null ? "等待采样" : "latest batch",
      trendDirection: sidecar.lastRuntimeDurationMs == null ? "unknown" : "flat",
      accent: "purple"
    },
    {
      id: "health",
      label: "系统健康",
      value: `${healthScore}%`,
      detail: `${formatStatusValue(snapshot.status.runtime)} · ${formatStatusValue(snapshot.status.bridge)}`,
      tone: healthScore >= 80 ? "positive" : healthScore >= 50 ? "warning" : "neutral",
      source: sidecar.performance || gatewayRail.some((item) => item.source === "runtime-service") ? "runtime-service" : "snapshot",
      progress: healthScore,
      trendLabel: sidecar.performance ? "runtime connected" : "metric 未采样",
      trendDirection: sidecar.performance ? "up" : "unknown",
      accent: "green"
    }
  ];
}

function createResourceView(
  performance: PerformanceMetrics | null,
  samples: DashboardResourceSample[],
  alerts: PerformanceAlert[]
): DashboardResourceView {
  const memoryPercent =
    performance && performance.system.totalMemory > 0
      ? ((performance.system.totalMemory - performance.system.freeMemory) / performance.system.totalMemory) * 100
      : null;

  return {
    cpuPercent: performance?.cpu.percent ?? null,
    memoryPercent,
    memoryUsedText: performance ? formatBytes(performance.system.totalMemory - performance.system.freeMemory) : "未采样",
    memoryTotalText: formatBytes(performance?.system.totalMemory),
    uptimeText: formatUptime(performance?.process.uptime),
    pidText: performance?.process.pid ? String(performance.process.pid) : "未采样",
    gpuText: "未采样",
    platformText: performance ? `${performance.system.platform} / ${performance.system.arch}` : "未采样",
    samples,
    alerts,
    source: performance ? "runtime-metric" : "collector-missing"
  };
}

export function useDashboardRealtimeData(snapshot: StudioShellState | null, lastSnapshotAt: number | null): DashboardRealtimeViewModel {
  const [sidecar, setSidecar] = useState<RuntimeSidecarState>(initialSidecarState);
  const [samples, setSamples] = useState<DashboardResourceSample[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    const refreshMetrics = async () => {
      if (inFlight) {
        return;
      }

      inFlight = true;
      const startedAt = performance.now();
      try {
        const nextPerformance = await getPerformanceMetrics();

        if (!cancelled) {
          setSidecar((current) => ({
            ...current,
            performance: nextPerformance,
            lastMetricDurationMs: performance.now() - startedAt,
            updatedAt: Date.now()
          }));
        }
      } catch (cause: unknown) {
        if (!cancelled) {
          const message = cause instanceof Error ? cause.message : String(cause);
          setSidecar((current) => ({
            ...current,
            error: message
          }));
        }
      } finally {
        inFlight = false;
      }
    };

    void refreshMetrics();
    const interval = window.setInterval(() => {
      void refreshMetrics();
    }, METRIC_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    const refreshRuntime = async () => {
      if (inFlight) {
        return;
      }

      inFlight = true;
      const startedAt = performance.now();

      const results = await Promise.allSettled([
        loadOpenClawGatewayServiceState(),
        loadHermesGatewayServiceState(),
        loadHermesState(),
        loadHermesSnapshot(),
        loadClaudeSnapshot(),
        loadOpenClawChatState()
      ]);

      if (!cancelled) {
        const [openclawGateway, hermesGateway, hermesState, hermesSnapshot, claudeSnapshot, openclawChat] = results;
        const nextHermesSnapshot = hermesSnapshot.status === "fulfilled" ? hermesSnapshot.value : null;
        const nextClaudeSnapshot = claudeSnapshot.status === "fulfilled" ? claudeSnapshot.value : null;
        const latestHermesSession = nextHermesSnapshot?.sessions[0] ?? null;
        const latestClaudeSession = getLatestClaudeSession(nextClaudeSnapshot);
        const [hermesMessagesResult, claudeMessagesResult] = await Promise.allSettled([
          latestHermesSession ? loadHermesSessionMessages(latestHermesSession.id) : Promise.resolve([]),
          latestClaudeSession ? loadClaudeSessionMessages(latestClaudeSession.id) : Promise.resolve([])
        ]);
        const allResults = [...results, hermesMessagesResult, claudeMessagesResult];

        if (!cancelled) {
          setSidecar((current) => ({
            ...current,
            openclawGateway: openclawGateway.status === "fulfilled" ? openclawGateway.value : current.openclawGateway,
            hermesGateway: hermesGateway.status === "fulfilled" ? hermesGateway.value : current.hermesGateway,
            hermesState: hermesState.status === "fulfilled" ? hermesState.value : current.hermesState,
            hermesSnapshot: nextHermesSnapshot ?? current.hermesSnapshot,
            hermesMessages: hermesMessagesResult.status === "fulfilled" ? hermesMessagesResult.value : current.hermesMessages,
            claudeSnapshot: nextClaudeSnapshot ?? current.claudeSnapshot,
            claudeMessages: claudeMessagesResult.status === "fulfilled" ? claudeMessagesResult.value : current.claudeMessages,
            openclawChat: openclawChat.status === "fulfilled" ? openclawChat.value : current.openclawChat,
            error: firstError(allResults),
            lastRuntimeDurationMs: performance.now() - startedAt,
            lastRuntimeSuccessCount: allResults.filter((result) => result.status === "fulfilled").length,
            lastRuntimeRequestCount: allResults.length,
            updatedAt: Date.now()
          }));
        }
      }

      inFlight = false;
    };

    void refreshRuntime();
    const interval = window.setInterval(() => {
      void refreshRuntime();
    }, REALTIME_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    void subscribeToPerformanceAlerts((alert) => {
      setAlerts((current) => [alert, ...current].slice(0, 6));
    })
      .then((nextUnsubscribe) => {
        if (cancelled) {
          nextUnsubscribe();
        } else {
          unsubscribe = nextUnsubscribe;
        }
      })
      .catch((cause: unknown) => {
        const message = cause instanceof Error ? cause.message : String(cause);
        setSidecar((current) => ({
          ...current,
          error: message
        }));
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    const taskCounts = getTaskCounts(snapshot.codex.tasks);
    const memoryPercent =
      sidecar.performance && sidecar.performance.system.totalMemory > 0
        ? ((sidecar.performance.system.totalMemory - sidecar.performance.system.freeMemory) / sidecar.performance.system.totalMemory) * 100
        : null;

    setSamples((current) => [
      ...current.slice(-(ROLLING_SAMPLE_LIMIT - 1)),
      {
        timestamp: Date.now(),
        cpuPercent: sidecar.performance?.cpu.percent ?? null,
        memoryPercent,
        runningTasks: taskCounts.running,
        queuedTasks: taskCounts.queued + taskCounts.review,
        totalTasks: taskCounts.total
      }
    ]);
  }, [snapshot, sidecar.performance, lastSnapshotAt]);

  return useMemo<DashboardRealtimeViewModel>(() => {
    if (!snapshot) {
      return {
        title: "山谷智合实时运营驾驶舱",
        generatedAt: null,
        isLoading: true,
        syncError: sidecar.error,
        version: "未加载",
        statusText: "加载中",
        bridgeText: "加载中",
        runtimeText: "加载中",
        periodLabel: "近 24 小时",
        refreshLabel: "数据每 5 秒刷新",
        sourceLines: [],
        gatewayRail: [],
        kpis: [],
        codexStream: [],
        claudeStream: [],
        routeMap: [],
        taskSlices: [],
        resources: createResourceView(sidecar.performance, samples, alerts),
        claude: {
          sessionCount: 0,
          activeSessionCount: 0,
          messageCount: 0,
          latestSessionTitle: "未采样",
          modelText: "未采样",
          permissionText: "未采样",
          rootPath: "未采样",
          source: "collector-missing"
        },
        unavailableCollectors: []
      };
    }

    const taskCounts = getTaskCounts(snapshot.codex.tasks);
    const sessionCounts = getSessionCounts(snapshot.sessions);
    const claudeSnapshot = sidecar.claudeSnapshot;
    const latestClaudeSession = getLatestClaudeSession(claudeSnapshot);
    const activeClaudeSessions = claudeSnapshot?.sessions.filter((session) => session.active).length ?? 0;
    const gatewayRail = createServiceStatus(snapshot, sidecar);
    const hasGatewayServiceSample = gatewayRail.some((item) => item.source === "runtime-service");
    const unavailableCollectors: DashboardSourceLine[] = [
      { label: "模型容量/延迟", value: "未采样", source: "collector-missing" },
      { label: "GPU", value: "未采样", source: "collector-missing" }
    ];

    return {
      title: "山谷智合实时运营驾驶舱",
      generatedAt: sidecar.updatedAt ?? lastSnapshotAt,
      isLoading: false,
      syncError: sidecar.error,
      version: snapshot.version,
      statusText: formatStatusValue(snapshot.status.mode),
      bridgeText: formatStatusValue(snapshot.status.bridge),
      runtimeText: formatStatusValue(snapshot.status.runtime),
      periodLabel: "近 24 小时",
      refreshLabel: "数据每 5 秒刷新",
      sourceLines: [
        { label: "Shell snapshot", value: "5s refresh", source: "snapshot" },
        {
          label: "Runtime metric",
          value: sidecar.performance ? `connected · ${formatDurationMs(sidecar.lastMetricDurationMs)}` : "未采样",
          source: sidecar.performance ? "runtime-metric" : "collector-missing"
        },
        {
          label: "Gateway/Hermes",
          value:
            sidecar.lastRuntimeRequestCount > 0
              ? `${sidecar.lastRuntimeSuccessCount}/${sidecar.lastRuntimeRequestCount} ok · ${formatDurationMs(sidecar.lastRuntimeDurationMs)}`
              : hasGatewayServiceSample
                ? "runtime service"
                : "未采样",
          source: hasGatewayServiceSample || sidecar.lastRuntimeRequestCount > 0 ? "runtime-service" : "collector-missing"
        },
        { label: "Rolling buffer", value: `${samples.length} samples`, source: "rolling-buffer" }
      ],
      gatewayRail,
      kpis: createKpis(snapshot, sidecar, taskCounts, sessionCounts, gatewayRail, samples),
      codexStream: createCodexStream(snapshot.codex.tasks),
      claudeStream: createClaudeStream(claudeSnapshot, sidecar.claudeMessages),
      routeMap: createRouteMap(snapshot, sidecar, taskCounts),
      taskSlices: buildTaskSlices(snapshot.codex.tasks),
      resources: createResourceView(sidecar.performance, samples, alerts),
      claude: {
        sessionCount: claudeSnapshot?.sessions.length ?? 0,
        activeSessionCount: activeClaudeSessions,
        messageCount: sidecar.claudeMessages.length || latestClaudeSession?.messageCount || 0,
        latestSessionTitle: formatClaudeSessionTitle(latestClaudeSession),
        modelText: normalizeModel(claudeSnapshot?.settings.model),
        permissionText: claudeSnapshot?.settings.permissionMode ?? "未采样",
        rootPath: claudeSnapshot?.settings.rootPath ?? "未采样",
        source: claudeSnapshot ? "runtime-service" : "collector-missing"
      },
      unavailableCollectors
    };
  }, [alerts, lastSnapshotAt, samples, sidecar, snapshot]);
}
