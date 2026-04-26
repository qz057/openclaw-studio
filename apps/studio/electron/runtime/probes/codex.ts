import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { CodexTaskSummary, SettingItem, StudioStat } from "@openclaw/shared";
import { analyzeCodexAgentLoop, buildCodexAgentLoopOverview, type CodexAgentLoopEvent } from "./codex-agent-loop";

const homeDirectory = os.homedir();
const codexRoot = path.join(homeDirectory, ".codex");
const codexConfigPath = path.join(codexRoot, "config.toml");
const codexAuthPath = path.join(codexRoot, "auth.json");
const codexSessionsRoot = path.join(codexRoot, "sessions");
const shellSnapshotsRoot = path.join(codexRoot, "shell_snapshots");
const maxRecentTasks = 6;
const runningWindowMs = 45 * 60 * 1000;

interface CodexSessionEvent {
  timestamp?: string;
  type?: string;
  payload?: {
    id?: string;
    timestamp?: string;
    cwd?: string;
    cli_version?: string;
    source?: string;
    model_provider?: string;
    type?: string;
    message?: string;
  };
  cwd?: string;
  model?: string;
  effort?: string;
  current_date?: string;
  timezone?: string;
}

interface ParsedCodexConfig {
  provider: string | null;
  model: string | null;
  reviewModel: string | null;
  reasoningEffort: string | null;
  requiresOpenAiAuth: boolean;
  pluginCount: number;
  enabledPluginCount: number;
}

export interface LiveCodexProbe {
  source: "live" | "mock";
  configPath: string;
  sessionsRoot: string;
  authPresent: boolean;
  configuredModel: string | null;
  reviewModel: string | null;
  provider: string | null;
  reasoningEffort: string | null;
  requiresOpenAiAuth: boolean;
  pluginCount: number;
  enabledPluginCount: number;
  latestCliVersion: string | null;
  shellSnapshotsCount: number;
  runningTasks: number;
  recentTasks: number;
  completedTasks: number;
  stats: StudioStat[];
  tasks: CodexTaskSummary[];
  loopSummary: string;
  loopStats: StudioStat[];
  loopSignals: SettingItem[];
}

function parseTimestamp(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatRelativeTime(timestampMs: number): string {
  const diffMs = Date.now() - timestampMs;

  if (diffMs < 60_000) {
    return "Just now";
  }

  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function shortenHomePath(rawPath: string | null | undefined): string {
  if (!rawPath) {
    return "不可用";
  }

  return rawPath.startsWith(homeDirectory) ? rawPath.replace(homeDirectory, "~") : rawPath;
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonlLines(filePath: string): Promise<CodexSessionEvent[]> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as CodexSessionEvent;
        } catch {
          return null;
        }
      })
      .filter((line): line is CodexSessionEvent => line !== null);
  } catch {
    return [];
  }
}

function parseTomlScalar(rawValue: string): boolean | string | null {
  const value = rawValue.trim();

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  if (value.startsWith("\"") && value.endsWith("\"")) {
    return value.slice(1, -1);
  }

  return value.length > 0 ? value : null;
}

async function readCodexConfig(): Promise<ParsedCodexConfig> {
  const defaultConfig: ParsedCodexConfig = {
    provider: null,
    model: null,
    reviewModel: null,
    reasoningEffort: null,
    requiresOpenAiAuth: false,
    pluginCount: 0,
    enabledPluginCount: 0
  };

  try {
    const raw = await fs.readFile(codexConfigPath, "utf8");
    const lines = raw.split(/\r?\n/);
    let currentSection: string | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const sectionMatch = trimmed.match(/^\[(.+)\]$/);

      if (sectionMatch) {
        currentSection = sectionMatch[1] ?? null;

        if (currentSection?.startsWith("plugins.")) {
          defaultConfig.pluginCount += 1;
        }

        continue;
      }

      const keyValueMatch = trimmed.match(/^([A-Za-z0-9_]+)\s*=\s*(.+)$/);

      if (!keyValueMatch) {
        continue;
      }

      const rawKey = keyValueMatch[1];
      const rawValue = keyValueMatch[2];

      if (!rawKey || rawValue === undefined) {
        continue;
      }

      const value = parseTomlScalar(rawValue);

      if (currentSection === null) {
        if (rawKey === "model_provider" && typeof value === "string") {
          defaultConfig.provider = value;
        }

        if (rawKey === "model" && typeof value === "string") {
          defaultConfig.model = value;
        }

        if (rawKey === "review_model" && typeof value === "string") {
          defaultConfig.reviewModel = value;
        }

        if (rawKey === "model_reasoning_effort" && typeof value === "string") {
          defaultConfig.reasoningEffort = value;
        }

        continue;
      }

      if (currentSection === `model_providers.${defaultConfig.provider}` && rawKey === "requires_openai_auth") {
        defaultConfig.requiresOpenAiAuth = value === true;
      }

      if (currentSection.startsWith("plugins.") && rawKey === "enabled" && value === true) {
        defaultConfig.enabledPluginCount += 1;
      }
    }

    return defaultConfig;
  } catch {
    return defaultConfig;
  }
}

async function countEntries(rootDirectory: string): Promise<number> {
  try {
    const entries = await fs.readdir(rootDirectory, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).length;
  } catch {
    return 0;
  }
}

async function listRecentSessionFiles(rootDirectory: string): Promise<Array<{ path: string; mtimeMs: number }>> {
  const files: Array<{ path: string; mtimeMs: number }> = [];

  async function walk(directory: string): Promise<void> {
    let entries;

    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }

    await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          await walk(entryPath);
          return;
        }

        if (!entry.isFile() || !entry.name.endsWith(".jsonl")) {
          return;
        }

        try {
          const stats = await fs.stat(entryPath);
          files.push({ path: entryPath, mtimeMs: stats.mtimeMs });
        } catch {
          return;
        }
      })
    );
  }

  await walk(rootDirectory);

  return files.sort((left, right) => right.mtimeMs - left.mtimeMs).slice(0, maxRecentTasks);
}

function deriveTarget(cwd: string | null | undefined): string {
  if (!cwd) {
    return "workspace";
  }

  return path.basename(cwd) || "workspace";
}

function readUserPrompt(events: CodexSessionEvent[]): string | null {
  for (const event of events) {
    if (event.type === "event_msg" && event.payload?.type === "user_message" && event.payload.message) {
      return event.payload.message;
    }
  }

  return null;
}

function deriveTitle(userPrompt: string | null, cwd: string | null | undefined, sessionId: string): string {
  if (!userPrompt) {
    return `Codex session ${sessionId.slice(0, 8)}`;
  }

  const firstLine = userPrompt
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .find((line) => !line.startsWith("```"));

  if (!firstLine) {
    return `Codex session ${sessionId.slice(0, 8)}`;
  }

  const workspaceName = deriveTarget(cwd);

  if (/^Continue work in /i.test(firstLine)) {
    return `Continue ${workspaceName}`;
  }

  if (/^You are continuing implementation in /i.test(firstLine)) {
    return `Continue ${workspaceName} implementation`;
  }

  if (/^You are building /i.test(firstLine)) {
    return `Build ${workspaceName}`;
  }

  if (/^You are working in /i.test(firstLine)) {
    return `Work in ${workspaceName}`;
  }

  const sanitized = firstLine.replace(/\s+/g, " ").replace(/[`"]/g, "").trim();
  return sanitized.length > 72 ? `${sanitized.slice(0, 69)}...` : sanitized;
}

function deriveModelLabel(
  provider: string | null | undefined,
  model: string | null | undefined,
  reasoningEffort: string | null | undefined
): string {
  const base = provider && model ? `${provider}/${model}` : model ?? provider ?? "Unknown";
  return reasoningEffort ? `${base} · ${reasoningEffort}` : base;
}

function deriveTaskStatus(events: CodexSessionEvent[], updatedAtMs: number): CodexTaskSummary["status"] {
  const lastEventMessage = [...events].reverse().find((event) => event.type === "event_msg");

  if (lastEventMessage?.payload?.type === "task_complete") {
    return "complete";
  }

  return Date.now() - updatedAtMs < runningWindowMs ? "running" : "recent";
}

function deriveDetail(
  cliVersion: string | null | undefined,
  lastEventType: string | null | undefined,
  source: string | null | undefined
): string {
  const parts = [];

  if (cliVersion) {
    parts.push(`CLI ${cliVersion}`);
  }

  if (lastEventType) {
    parts.push(`latest ${lastEventType.replace(/_/g, " ")}`);
  }

  if (source) {
    parts.push(source);
  }

  return parts.length > 0 ? parts.join(" · ") : "Local Codex session log";
}

function createCodexStats(probe: Omit<LiveCodexProbe, "stats">): StudioStat[] {
  return [
    {
      label: "Task Source",
      value: probe.tasks.length > 0 ? "Live sessions" : probe.source === "live" ? "Hybrid config" : "Mock",
      tone: probe.tasks.length > 0 ? "positive" : probe.source === "live" ? "neutral" : "warning"
    },
    {
      label: "Active",
      value: `${probe.runningTasks} running`,
      tone: probe.runningTasks > 0 ? "positive" : "neutral"
    },
    {
      label: "认证",
      value: probe.requiresOpenAiAuth ? (probe.authPresent ? "已配置" : "缺失") : "无需配置",
      tone: probe.requiresOpenAiAuth ? (probe.authPresent ? "positive" : "warning") : "neutral"
    },
    {
      label: "CLI 版本",
      value: probe.latestCliVersion ?? "未知",
      tone: probe.latestCliVersion ? "neutral" : "warning"
    }
  ];
}

function createLoopFallback(): Pick<LiveCodexProbe, "loopSummary" | "loopStats" | "loopSignals"> {
  const fallback = buildCodexAgentLoopOverview([]);
  return {
    loopSummary: fallback.summary,
    loopStats: fallback.stats,
    loopSignals: fallback.signals
  };
}

export async function probeLiveCodex(): Promise<LiveCodexProbe> {
  const [config, authPresent, sessionFiles, shellSnapshotsCount] = await Promise.all([
    readCodexConfig(),
    pathExists(codexAuthPath),
    listRecentSessionFiles(codexSessionsRoot),
    countEntries(shellSnapshotsRoot)
  ]);

  const tasksWithNulls: Array<{ task: CodexTaskSummary; loop: ReturnType<typeof analyzeCodexAgentLoop> } | null> = await Promise.all(
    sessionFiles.map(async (sessionFile) => {
      const events = await readJsonlLines(sessionFile.path);

      if (events.length === 0) {
        return null;
      }

      const sessionMeta = events.find((event) => event.type === "session_meta")?.payload;
      const turnContext = events.find((event) => event.type === "turn_context");
      const userPrompt = readUserPrompt(events);
      const latestTimestamp = events.reduce((latest, event) => {
        const parsed = parseTimestamp(event.timestamp ?? event.payload?.timestamp);
        return parsed !== null && parsed > latest ? parsed : latest;
      }, sessionFile.mtimeMs);
      const status = deriveTaskStatus(events, latestTimestamp);
      const workdir = sessionMeta?.cwd ?? turnContext?.cwd ?? null;
      const sessionId = sessionMeta?.id ?? path.basename(sessionFile.path, ".jsonl");
      const cliVersion = sessionMeta?.cli_version ?? null;
      const provider = sessionMeta?.model_provider ?? config.provider;
      const model = turnContext?.model ?? config.model ?? config.reviewModel;
      const reasoningEffort = turnContext?.effort ?? config.reasoningEffort;
      const lastEventType =
        [...events].reverse().find((event) => event.type === "event_msg")?.payload?.type ??
        [...events].reverse().find((event) => event.type === "response_item")?.payload?.type ??
        null;
      const loop = analyzeCodexAgentLoop(events as CodexAgentLoopEvent[], status, latestTimestamp);

      const task: CodexTaskSummary = {
        id: sessionId,
        title: deriveTitle(userPrompt, workdir, sessionId),
        model: deriveModelLabel(provider, model, reasoningEffort),
        status,
        target: deriveTarget(workdir),
        updatedAt: formatRelativeTime(latestTimestamp),
        source: "runtime",
        workdir: shortenHomePath(workdir),
        detail: deriveDetail(cliVersion, lastEventType, sessionMeta?.source),
        loopState: loop.state,
        turnCount: loop.turnCount,
        continuation: loop.continuation,
        recoveryCount: loop.recoveryCount,
        interruptionCount: loop.interruptionCount
      };

      return {
        task,
        loop
      };
    })
  );

  const tasksWithLoops = tasksWithNulls.filter(
    (entry): entry is { task: CodexTaskSummary; loop: ReturnType<typeof analyzeCodexAgentLoop> } => entry !== null
  );
  const tasks = tasksWithLoops.map((entry) => entry.task);
  const loopOverview = tasksWithLoops.length > 0 ? buildCodexAgentLoopOverview(tasksWithLoops.map((entry) => entry.loop)) : null;

  const runningTasks = tasks.filter((task) => task.status === "running").length;
  const recentTasks = tasks.filter((task) => task.status === "recent").length;
  const completedTasks = tasks.filter((task) => task.status === "complete").length;
  const latestCliVersion = tasks
    .map((task) => task.detail?.match(/CLI\s+([^\s]+)/)?.[1] ?? null)
    .find((value): value is string => value !== null) ?? null;
  const hasLiveSignal =
    tasks.length > 0 ||
    authPresent ||
    Boolean(config.model) ||
    Boolean(config.reviewModel) ||
    config.pluginCount > 0 ||
    shellSnapshotsCount > 0;

  const probeWithoutStats: Omit<LiveCodexProbe, "stats"> = {
    source: hasLiveSignal ? "live" : "mock",
    configPath: codexConfigPath,
    sessionsRoot: codexSessionsRoot,
    authPresent,
    configuredModel: config.model,
    reviewModel: config.reviewModel,
    provider: config.provider,
    reasoningEffort: config.reasoningEffort,
    requiresOpenAiAuth: config.requiresOpenAiAuth,
    pluginCount: config.pluginCount,
    enabledPluginCount: config.enabledPluginCount,
    latestCliVersion,
    shellSnapshotsCount,
    runningTasks,
    recentTasks,
    completedTasks,
    tasks,
    loopSummary: loopOverview?.summary ?? createLoopFallback().loopSummary,
    loopStats: loopOverview?.stats ?? createLoopFallback().loopStats,
    loopSignals: loopOverview?.signals ?? createLoopFallback().loopSignals
  };

  return {
    ...probeWithoutStats,
    stats: createCodexStats(probeWithoutStats)
  };
}
