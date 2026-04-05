"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.probeLiveSessions = probeLiveSessions;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const agentsDirectory = node_path_1.default.join(node_os_1.default.homedir(), ".openclaw", "agents");
const maxSessions = 6;
function parseJsonLine(line) {
    try {
        return JSON.parse(line);
    }
    catch {
        return null;
    }
}
function formatRelativeTime(timestampMs) {
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
function parseTimestamp(timestamp) {
    if (!timestamp) {
        return null;
    }
    const parsed = Date.parse(timestamp);
    return Number.isFinite(parsed) ? parsed : null;
}
function deriveStatus(timestampMs) {
    const ageMs = Date.now() - timestampMs;
    if (ageMs < 8 * 60 * 60 * 1000) {
        return "active";
    }
    if (ageMs < 48 * 60 * 60 * 1000) {
        return "waiting";
    }
    return "complete";
}
function deriveWorkspace(cwd) {
    if (!cwd) {
        return "workspace";
    }
    const workspaceName = node_path_1.default.basename(cwd);
    return workspaceName || "workspace";
}
function deriveTitle(rawText, sessionId) {
    if (!rawText) {
        return `Session ${sessionId.slice(0, 8)}`;
    }
    const candidate = rawText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .map((line) => line.replace(/^\[[^\]]+\]\s*/, ""))
        .filter(Boolean)
        .filter((line) => !/^Conversation info/i.test(line))
        .filter((line) => line !== "```")
        .filter((line) => !line.startsWith("```"))
        .filter((line) => !line.startsWith("Sender ("))
        .filter((line) => !line.startsWith("{"))
        .filter((line) => !line.startsWith("}"))
        .filter((line) => !line.startsWith('"'))
        .filter((line) => !/^Current time:/i.test(line))[0];
    const title = candidate ?? `Session ${sessionId.slice(0, 8)}`;
    return title.length > 72 ? `${title.slice(0, 69)}...` : title;
}
function getFirstUserText(events) {
    for (const event of events) {
        if (event.type !== "message" || event.message?.role !== "user") {
            continue;
        }
        const text = event.message.content
            ?.filter((content) => content.type === "text" && typeof content.text === "string")
            .map((content) => content.text?.trim() ?? "")
            .filter(Boolean)
            .join("\n");
        if (text) {
            return text;
        }
    }
    return null;
}
function deriveSessionKind(firstUserText) {
    return firstUserText?.trim().startsWith("[cron:") ? "cron" : "interactive";
}
async function listSessionDirectories() {
    try {
        const entries = await promises_1.default.readdir(agentsDirectory, { withFileTypes: true });
        const directories = await Promise.all(entries
            .filter((entry) => entry.isDirectory())
            .map(async (entry) => {
            const directory = node_path_1.default.join(agentsDirectory, entry.name, "sessions");
            try {
                await promises_1.default.access(directory);
                return {
                    agentId: entry.name,
                    directory
                };
            }
            catch {
                return null;
            }
        }));
        return directories.filter((directory) => directory !== null);
    }
    catch {
        return [];
    }
}
async function probeLiveSessions() {
    try {
        const sessionDirectories = await listSessionDirectories();
        const filesWithStats = await Promise.all(sessionDirectories.flatMap((sessionDirectory) => Promise.resolve(promises_1.default.readdir(sessionDirectory.directory, { withFileTypes: true }).then((entries) => Promise.all(entries
            .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
            .map(async (entry) => {
            const filePath = node_path_1.default.join(sessionDirectory.directory, entry.name);
            const stats = await promises_1.default.stat(filePath);
            return {
                agentId: sessionDirectory.agentId,
                name: entry.name,
                path: filePath,
                stats
            };
        })))).catch(() => []))).then((files) => files.flat());
        const latestFiles = filesWithStats.sort((left, right) => right.stats.mtimeMs - left.stats.mtimeMs).slice(0, maxSessions);
        const sessionRecords = await Promise.all(latestFiles.map(async (file) => {
            const content = await promises_1.default.readFile(file.path, "utf8");
            const events = content
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => parseJsonLine(line))
                .filter((event) => event !== null);
            const sessionEvent = events.find((event) => event.type === "session");
            const sessionId = sessionEvent?.id ?? file.name.replace(/\.jsonl$/, "");
            const firstUserText = getFirstUserText(events);
            let timestampMs = file.stats.mtimeMs;
            let latestModel = null;
            let latestProvider = null;
            for (const event of events) {
                const parsedTimestamp = parseTimestamp(event.timestamp);
                if (parsedTimestamp !== null && parsedTimestamp > timestampMs) {
                    timestampMs = parsedTimestamp;
                }
                if (event.type === "model_change") {
                    latestModel = event.modelId ?? latestModel;
                    latestProvider = event.provider ?? latestProvider;
                }
                if (event.customType === "model-snapshot") {
                    latestModel = event.data?.modelId ?? latestModel;
                    latestProvider = event.data?.provider ?? latestProvider;
                }
            }
            return {
                id: sessionId,
                agentId: file.agentId,
                title: deriveTitle(firstUserText, sessionId),
                workspace: deriveWorkspace(sessionEvent?.cwd),
                status: deriveStatus(timestampMs),
                updatedAt: formatRelativeTime(timestampMs),
                updatedAtMs: timestampMs,
                owner: file.agentId,
                cwd: sessionEvent?.cwd ?? null,
                model: latestModel,
                provider: latestProvider,
                firstUserText,
                kind: deriveSessionKind(firstUserText)
            };
        }));
        const sessions = sessionRecords.map(({ id, title, workspace, status, updatedAt, owner }) => ({
            id,
            title,
            workspace,
            status,
            updatedAt,
            owner
        }));
        return {
            source: sessionRecords.length > 0 ? "live" : "mock",
            directory: agentsDirectory,
            sessions,
            sessionRecords,
            totalDiscovered: filesWithStats.length,
            agentCount: sessionDirectories.length
        };
    }
    catch {
        return {
            source: "mock",
            directory: agentsDirectory,
            sessions: [],
            sessionRecords: [],
            totalDiscovered: 0,
            agentCount: 0
        };
    }
}
