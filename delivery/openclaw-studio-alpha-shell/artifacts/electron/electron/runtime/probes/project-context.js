"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.probeProjectContext = probeProjectContext;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const contextDocFiles = [
    { id: "readme", label: "README.md", relativePath: "README.md" },
    { id: "handoff", label: "HANDOFF.md", relativePath: "HANDOFF.md" },
    { id: "implementation", label: "IMPLEMENTATION-PLAN.md", relativePath: "IMPLEMENTATION-PLAN.md" }
];
async function pathExists(targetPath) {
    try {
        await promises_1.default.access(targetPath);
        return true;
    }
    catch {
        return false;
    }
}
async function findRepoRoot(startDirectory) {
    let current = startDirectory;
    for (;;) {
        const hasReadme = await pathExists(node_path_1.default.join(current, "README.md"));
        const hasStudioApp = await pathExists(node_path_1.default.join(current, "apps", "studio", "package.json"));
        const hasSharedPackage = await pathExists(node_path_1.default.join(current, "packages", "shared", "package.json"));
        if (hasReadme && hasStudioApp && hasSharedPackage) {
            return current;
        }
        const parent = node_path_1.default.dirname(current);
        if (parent === current) {
            return null;
        }
        current = parent;
    }
}
function extractDocSnippet(content) {
    const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => !line.startsWith("#"))
        .filter((line) => !line.startsWith("```"))
        .filter((line) => !line.startsWith("- "))
        .filter((line) => !line.startsWith("* "));
    const snippet = lines[0] ?? "No concise summary available.";
    return snippet.length > 180 ? `${snippet.slice(0, 177)}...` : snippet;
}
async function readDocSummary(repoRoot, relativePath) {
    const filePath = node_path_1.default.join(repoRoot, relativePath);
    try {
        const content = await promises_1.default.readFile(filePath, "utf8");
        return {
            present: true,
            snippet: extractDocSnippet(content)
        };
    }
    catch {
        return {
            present: false,
            snippet: "Unavailable"
        };
    }
}
async function readGitBranch(repoRoot) {
    try {
        const headPath = node_path_1.default.join(repoRoot, ".git", "HEAD");
        const rawHead = (await promises_1.default.readFile(headPath, "utf8")).trim();
        if (rawHead.startsWith("ref:")) {
            return rawHead.split("/").pop() ?? null;
        }
        return rawHead ? `detached:${rawHead.slice(0, 7)}` : null;
    }
    catch {
        return null;
    }
}
async function countDirectories(rootPath) {
    try {
        const entries = await promises_1.default.readdir(rootPath, { withFileTypes: true });
        return entries.filter((entry) => entry.isDirectory()).length;
    }
    catch {
        return 0;
    }
}
async function probeProjectContext(sessionProbe, codexProbe) {
    const repoRoot = await findRepoRoot(process.cwd());
    if (!repoRoot) {
        return {
            source: "mock",
            summary: "Repo-local context memory was unavailable, so the shell stayed on fallback context notes while keeping session and Codex observations separate.",
            notes: [
                {
                    id: "codex-context-repo",
                    label: "Repo context",
                    value: "Unavailable",
                    detail: "The runtime could not resolve the OpenClaw Studio repository root from the current working directory.",
                    tone: "warning"
                }
            ]
        };
    }
    const [docSummaries, branch, appCount, packageCount] = await Promise.all([
        Promise.all(contextDocFiles.map((entry) => readDocSummary(repoRoot, entry.relativePath))),
        readGitBranch(repoRoot),
        countDirectories(node_path_1.default.join(repoRoot, "apps")),
        countDirectories(node_path_1.default.join(repoRoot, "packages"))
    ]);
    const docsPresentCount = docSummaries.filter((summary) => summary.present).length;
    const latestSession = sessionProbe.sessionRecords[0] ?? null;
    const latestTask = codexProbe.tasks[0] ?? null;
    return {
        source: "live",
        summary: `Repo-local context assembly now combines ${docsPresentCount} stable project docs, ${branch ? `git branch ${branch}` : "no git branch metadata"}, ` +
            `${sessionProbe.sessions.length} recent sessions, and ${codexProbe.tasks.length} recent Codex tasks without introducing a separate memory store.`,
        notes: [
            {
                id: "codex-context-docs",
                label: "Docs",
                value: `${docsPresentCount} core docs`,
                detail: contextDocFiles
                    .map((entry, index) => `${entry.label}: ${docSummaries[index]?.snippet ?? "Unavailable"}`)
                    .join(" · "),
                tone: docsPresentCount === contextDocFiles.length ? "positive" : "neutral"
            },
            {
                id: "codex-context-git",
                label: "Git / Layout",
                value: branch ? `branch ${branch}` : "Git metadata unavailable",
                detail: `${repoRoot} · apps ${appCount} · packages ${packageCount}`,
                tone: branch ? "positive" : "neutral"
            },
            {
                id: "codex-context-session",
                label: "Session continuity",
                value: `${sessionProbe.sessions.length} sessions · ${codexProbe.tasks.length} Codex tasks`,
                detail: latestSession && latestTask
                    ? `${latestSession.title} -> ${latestTask.title}`
                    : latestSession
                        ? latestSession.title
                        : latestTask
                            ? latestTask.title
                            : "No recent session continuity signal was available.",
                tone: latestSession || latestTask ? "positive" : "neutral"
            },
            {
                id: "codex-context-focus",
                label: "Project focus",
                value: latestTask?.target ?? "Context docs",
                detail: docSummaries[1]?.snippet ?? docSummaries[0]?.snippet ?? "No project focus summary available.",
                tone: "neutral"
            }
        ]
    };
}
