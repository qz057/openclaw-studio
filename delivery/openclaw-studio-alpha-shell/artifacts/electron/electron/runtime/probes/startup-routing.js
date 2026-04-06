"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.probeStartupRouting = probeStartupRouting;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
async function readJson(filePath) {
    try {
        return JSON.parse(await promises_1.default.readFile(filePath, "utf8"));
    }
    catch {
        return null;
    }
}
async function probeStartupRouting() {
    const appRoot = node_path_1.default.resolve(__dirname, "..", "..", "..", "..");
    const repoRoot = node_path_1.default.resolve(appRoot, "..", "..");
    const { getPreflightSummary } = require(node_path_1.default.join(appRoot, "scripts", "studio-preflight.cjs"));
    const preflight = getPreflightSummary();
    const [appPackage, rootPackage] = await Promise.all([
        readJson(node_path_1.default.join(appRoot, "package.json")),
        readJson(node_path_1.default.join(repoRoot, "package.json"))
    ]);
    const appScripts = appPackage?.scripts ?? {};
    const rootScripts = rootPackage?.scripts ?? {};
    return {
        summary: `Startup routing now mirrors the local preflight chain inside Settings: build ${preflight.buildReady ? "ready" : "missing"}, ` +
            `Electron ${preflight.electron.available ? "ready" : "missing"}, display ${preflight.display.available ? preflight.display.source : "missing"}, ` +
            `and start ${preflight.startReady ? "ready" : "blocked"}.`,
        items: [
            {
                id: "settings-start-ready",
                label: "Startup path",
                value: preflight.startReady ? "Ready" : "Blocked",
                detail: preflight.missingArtifacts.length > 0
                    ? `Missing artifacts: ${preflight.missingArtifacts.map((artifact) => artifact.label).join(" · ")}.`
                    : "Renderer, Electron main/preload/runtime, and the local start chain are all present.",
                tone: preflight.startReady ? "positive" : "warning"
            },
            {
                id: "settings-display",
                label: "Display route",
                value: preflight.display.available ? preflight.display.source : "missing",
                detail: preflight.display.detail,
                tone: preflight.display.available ? "neutral" : "warning"
            },
            {
                id: "settings-command-path",
                label: "Command path",
                value: `${Object.keys(rootScripts).length} root / ${Object.keys(appScripts).length} app scripts`,
                detail: ["start", "start:smoke", "smoke", "release:plan"]
                    .map((scriptName) => `${scriptName} ${rootScripts[scriptName] || appScripts[scriptName] ? "present" : "missing"}`)
                    .join(" · "),
                tone: rootScripts.start && rootScripts["start:smoke"] && rootScripts.smoke ? "positive" : "neutral"
            }
        ]
    };
}
