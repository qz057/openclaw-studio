import fs from "node:fs/promises";
import path from "node:path";
import type { SettingItem } from "@openclaw/shared";

export interface StartupRoutingProbe {
  summary: string;
  items: SettingItem[];
}

async function readJson(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function probeStartupRouting(): Promise<StartupRoutingProbe> {
  const appRoot = path.resolve(__dirname, "..", "..", "..", "..");
  const repoRoot = path.resolve(appRoot, "..", "..");
  const { getPreflightSummary } = require(path.join(appRoot, "scripts", "studio-preflight.cjs")) as {
    getPreflightSummary: () => {
      buildReady: boolean;
      startReady: boolean;
      electron: { available: boolean };
      display: { available: boolean; source: string; detail: string };
      missingArtifacts: Array<{ label: string }>;
    };
  };

  const preflight = getPreflightSummary();
  const [appPackage, rootPackage] = await Promise.all([
    readJson(path.join(appRoot, "package.json")),
    readJson(path.join(repoRoot, "package.json"))
  ]);

  const appScripts = (appPackage?.scripts as Record<string, string> | undefined) ?? {};
  const rootScripts = (rootPackage?.scripts as Record<string, string> | undefined) ?? {};

  return {
    summary:
      `Startup routing now mirrors the local preflight chain inside Settings: build ${preflight.buildReady ? "ready" : "missing"}, ` +
      `Electron ${preflight.electron.available ? "ready" : "missing"}, display ${preflight.display.available ? preflight.display.source : "missing"}, ` +
      `and start ${preflight.startReady ? "ready" : "blocked"}.`,
    items: [
      {
        id: "settings-start-ready",
        label: "Startup path",
        value: preflight.startReady ? "Ready" : "Blocked",
        detail:
          preflight.missingArtifacts.length > 0
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
