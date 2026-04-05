"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.probeLiveSystemStatus = probeLiveSystemStatus;
const node_fs_1 = require("node:fs");
const promises_1 = __importDefault(require("node:fs/promises"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const openclawRoot = node_path_1.default.join(node_os_1.default.homedir(), ".openclaw");
const workspaceStatePath = node_path_1.default.join(openclawRoot, "workspace", ".openclaw", "workspace-state.json");
async function pathExists(targetPath) {
    try {
        await promises_1.default.access(targetPath);
        return true;
    }
    catch {
        return false;
    }
}
async function findBinary(binaryName) {
    const pathSegments = (process.env.PATH ?? "").split(node_path_1.default.delimiter).filter(Boolean);
    for (const segment of pathSegments) {
        const candidate = node_path_1.default.join(segment, binaryName);
        try {
            await promises_1.default.access(candidate, node_fs_1.constants.X_OK);
            return candidate;
        }
        catch {
            continue;
        }
    }
    return null;
}
async function readWorkspaceState() {
    try {
        const raw = await promises_1.default.readFile(workspaceStatePath, "utf8");
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
async function probeLiveSystemStatus() {
    const [openclawHomeExists, workspaceState, codexBinary, openclawBinary] = await Promise.all([
        pathExists(openclawRoot),
        readWorkspaceState(),
        findBinary("codex"),
        findBinary("openclaw")
    ]);
    const binaryCount = Number(Boolean(codexBinary)) + Number(Boolean(openclawBinary));
    const hasLiveSignal = openclawHomeExists || binaryCount > 0 || Boolean(workspaceState?.setupCompletedAt);
    return {
        source: hasLiveSignal ? "live" : "mock",
        status: {
            mode: hasLiveSignal ? "Studio Alpha (Hybrid)" : "Studio Alpha",
            bridge: hasLiveSignal ? "hybrid" : "mock",
            runtime: openclawHomeExists ? "ready" : "degraded"
        },
        checks: [
            {
                id: "check-openclaw-home",
                label: "OpenClaw Home",
                value: openclawHomeExists ? "Detected" : "Unavailable",
                detail: openclawRoot,
                tone: openclawHomeExists ? "positive" : "warning"
            },
            {
                id: "check-cli",
                label: "CLI Binaries",
                value: binaryCount === 2 ? "codex + openclaw" : binaryCount === 1 ? "Partial" : "Missing",
                detail: codexBinary && openclawBinary ? `${codexBinary} | ${openclawBinary}` : codexBinary ?? openclawBinary ?? "No CLI detected in PATH.",
                tone: binaryCount === 2 ? "positive" : binaryCount === 1 ? "neutral" : "warning"
            },
            {
                id: "check-workspace-state",
                label: "Workspace State",
                value: workspaceState?.setupCompletedAt ? "Seeded" : "Unavailable",
                detail: workspaceState?.setupCompletedAt
                    ? `setupCompletedAt=${workspaceState.setupCompletedAt}`
                    : "workspace-state.json not available.",
                tone: workspaceState?.setupCompletedAt ? "positive" : "warning"
            }
        ]
    };
}
