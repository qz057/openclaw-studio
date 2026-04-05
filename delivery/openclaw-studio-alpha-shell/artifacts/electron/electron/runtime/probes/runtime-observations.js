"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.probeLiveRuntimeObservations = probeLiveRuntimeObservations;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const openclawRoot = node_path_1.default.join(node_os_1.default.homedir(), ".openclaw");
const openclawConfigPath = node_path_1.default.join(openclawRoot, "openclaw.json");
const mainAgentModelsPath = node_path_1.default.join(openclawRoot, "agents", "main", "agent", "models.json");
const cronJobsPath = node_path_1.default.join(openclawRoot, "cron", "jobs.json");
const cronRunsDirectory = node_path_1.default.join(openclawRoot, "cron", "runs");
const maxRecentCronRuns = 8;
async function readJsonFile(filePath) {
    try {
        const raw = await promises_1.default.readFile(filePath, "utf8");
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
function collectConfiguredModels(config, fallbackModels) {
    const labels = new Set();
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
async function readCronRuns() {
    try {
        const entries = await promises_1.default.readdir(cronRunsDirectory, { withFileTypes: true });
        const runs = await Promise.all(entries
            .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
            .map(async (entry) => {
            const filePath = node_path_1.default.join(cronRunsDirectory, entry.name);
            const content = await promises_1.default.readFile(filePath, "utf8");
            return content
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => {
                try {
                    return JSON.parse(line);
                }
                catch {
                    return null;
                }
            })
                .filter((item) => item !== null)
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
            }));
        }));
        return runs.flat().sort((left, right) => right.runAtMs - left.runAtMs);
    }
    catch {
        return [];
    }
}
async function probeLiveRuntimeObservations() {
    const [config, fallbackModels, cronJobs, cronRuns] = await Promise.all([
        readJsonFile(openclawConfigPath),
        readJsonFile(mainAgentModelsPath),
        readJsonFile(cronJobsPath),
        readCronRuns()
    ]);
    const configuredAgents = config?.agents?.list
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
    const providerLabels = new Set();
    for (const providerId of Object.keys(config?.models?.providers ?? {})) {
        providerLabels.add(providerId);
    }
    for (const providerId of Object.keys(fallbackModels?.providers ?? {})) {
        providerLabels.add(providerId);
    }
    const recentCronRuns = cronRuns.slice(0, maxRecentCronRuns);
    const hasLiveSignal = configuredAgents.length > 0 || modelLabels.length > 0 || recentCronRuns.length > 0 || Boolean(config?.meta?.lastTouchedAt);
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
