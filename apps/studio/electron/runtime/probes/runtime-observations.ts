import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const openclawRoot = path.join(os.homedir(), ".openclaw");
const openclawConfigPath = path.join(openclawRoot, "openclaw.json");
const mainAgentModelsPath = path.join(openclawRoot, "agents", "main", "agent", "models.json");
const cronJobsPath = path.join(openclawRoot, "cron", "jobs.json");
const cronRunsDirectory = path.join(openclawRoot, "cron", "runs");
const maxRecentCronRuns = 8;

interface OpenClawConfig {
  meta?: {
    lastTouchedAt?: string;
  };
  models?: {
    providers?: Record<string, { models?: Array<{ id?: string }> }>;
  };
  agents?: {
    defaults?: {
      workspace?: string;
      model?: {
        primary?: string;
      };
      models?: Record<string, { alias?: string }>;
    };
    list?: Array<{
      id?: string;
      model?: string;
      thinkingDefault?: string;
    }>;
  };
}

interface AgentModelsConfig {
  providers?: Record<string, { models?: Array<{ id?: string }> }>;
}

interface CronJobsFile {
  jobs?: Array<{
    id?: string;
  }>;
}

interface CronRunEntry {
  action?: string;
  status?: string;
  delivered?: boolean;
  durationMs?: number;
  error?: string;
  jobId?: string;
  model?: string;
  nextRunAtMs?: number;
  provider?: string;
  runAtMs?: number;
  sessionId?: string;
  summary?: string;
  ts?: number;
}

export interface RuntimeAgentObservation {
  id: string;
  model: string | null;
  workspace: string | null;
}

export interface RuntimeCronObservation {
  jobId: string;
  status: string;
  delivered: boolean;
  durationMs: number | null;
  error: string | null;
  model: string | null;
  provider: string | null;
  runAtMs: number;
  sessionId: string | null;
  summary: string | null;
}

export interface LiveRuntimeObservation {
  source: "live" | "mock";
  configPath: string;
  lastTouchedAt: string | null;
  configuredAgents: RuntimeAgentObservation[];
  defaultWorkspace: string | null;
  providerCount: number;
  modelCount: number;
  modelLabels: string[];
  cronJobsCount: number;
  cronTotalRuns: number;
  cronOkRuns: number;
  cronErrorRuns: number;
  cronDeliveredRuns: number;
  recentCronRuns: RuntimeCronObservation[];
  lastCronRunAtMs: number | null;
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function collectConfiguredModels(config: OpenClawConfig | null, fallbackModels: AgentModelsConfig | null): string[] {
  const labels = new Set<string>();

  const configProviders = config?.models?.providers ?? {};

  for (const [providerId, providerConfig] of Object.entries(configProviders)) {
    for (const model of providerConfig.models ?? []) {
      if (model.id) {
        labels.add(`${providerId}/${model.id}`);
      }
    }
  }

  for (const modelId of Object.keys(config?.agents?.defaults?.models ?? {})) {
    labels.add(modelId);
  }

  for (const providerConfig of Object.values(fallbackModels?.providers ?? {})) {
    for (const model of providerConfig.models ?? []) {
      if (model.id) {
        labels.add(model.id);
      }
    }
  }

  return Array.from(labels);
}

async function readCronRuns(): Promise<RuntimeCronObservation[]> {
  try {
    const entries = await fs.readdir(cronRunsDirectory, { withFileTypes: true });
    const runs = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
        .map(async (entry) => {
          const filePath = path.join(cronRunsDirectory, entry.name);
          const content = await fs.readFile(filePath, "utf8");

          return content
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
              try {
                return JSON.parse(line) as CronRunEntry;
              } catch {
                return null;
              }
            })
            .filter((item): item is CronRunEntry => item !== null)
            .filter((item) => (item.action ?? "finished") === "finished")
            .map((item) => ({
              jobId: item.jobId ?? "cron-job",
              status: item.status ?? "unknown",
              delivered: Boolean(item.delivered),
              durationMs: typeof item.durationMs === "number" ? item.durationMs : null,
              error: item.error ?? null,
              model: item.model ?? null,
              provider: item.provider ?? null,
              runAtMs: typeof item.runAtMs === "number" ? item.runAtMs : typeof item.ts === "number" ? item.ts : 0,
              sessionId: item.sessionId ?? null,
              summary: item.summary ?? null
            }) satisfies RuntimeCronObservation);
        })
    );

    return runs.flat().sort((left, right) => right.runAtMs - left.runAtMs);
  } catch {
    return [];
  }
}

export async function probeLiveRuntimeObservations(): Promise<LiveRuntimeObservation> {
  const [config, fallbackModels, cronJobs, cronRuns] = await Promise.all([
    readJsonFile<OpenClawConfig>(openclawConfigPath),
    readJsonFile<AgentModelsConfig>(mainAgentModelsPath),
    readJsonFile<CronJobsFile>(cronJobsPath),
    readCronRuns()
  ]);

  const configuredAgents =
    config?.agents?.list
      ?.map((agent) => ({
        id: agent.id ?? "main",
        model: agent.model ?? config?.agents?.defaults?.model?.primary ?? null,
        workspace: config?.agents?.defaults?.workspace ?? null
      }))
      .filter((agent, index, agents) => agent.id && agents.findIndex((candidate) => candidate.id === agent.id) === index) ?? [];

  if (configuredAgents.length === 0 && fallbackModels?.providers) {
    configuredAgents.push({
      id: "main",
      model: config?.agents?.defaults?.model?.primary ?? null,
      workspace: config?.agents?.defaults?.workspace ?? null
    });
  }

  const modelLabels = collectConfiguredModels(config, fallbackModels);
  const providerLabels = new Set<string>();

  for (const providerId of Object.keys(config?.models?.providers ?? {})) {
    providerLabels.add(providerId);
  }

  for (const providerId of Object.keys(fallbackModels?.providers ?? {})) {
    providerLabels.add(providerId);
  }

  const recentCronRuns = cronRuns.slice(0, maxRecentCronRuns);
  const hasLiveSignal =
    configuredAgents.length > 0 || modelLabels.length > 0 || recentCronRuns.length > 0 || Boolean(config?.meta?.lastTouchedAt);

  return {
    source: hasLiveSignal ? "live" : "mock",
    configPath: openclawConfigPath,
    lastTouchedAt: config?.meta?.lastTouchedAt ?? null,
    configuredAgents,
    defaultWorkspace: config?.agents?.defaults?.workspace ?? null,
    providerCount: providerLabels.size,
    modelCount: modelLabels.length,
    modelLabels,
    cronJobsCount: cronJobs?.jobs?.length ?? 0,
    cronTotalRuns: cronRuns.length,
    cronOkRuns: cronRuns.filter((run) => run.status === "ok").length,
    cronErrorRuns: cronRuns.filter((run) => run.status === "error").length,
    cronDeliveredRuns: cronRuns.filter((run) => run.delivered).length,
    recentCronRuns,
    lastCronRunAtMs: recentCronRuns[0]?.runAtMs ?? null
  };
}
