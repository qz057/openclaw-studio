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

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function resolveRuntimePreflight(appRoot: string) {
  const artifacts = [
    { label: "Renderer HTML", path: path.join(appRoot, "dist-renderer", "index.html") },
    { label: "Electron main", path: path.join(appRoot, "dist-electron", "electron", "main.js") },
    { label: "Electron preload", path: path.join(appRoot, "dist-electron", "electron", "preload.js") },
    { label: "Electron runtime", path: path.join(appRoot, "dist-electron", "electron", "runtime", "studio-runtime.js") }
  ];

  const artifactStates = await Promise.all(
    artifacts.map(async (artifact) => ({
      ...artifact,
      exists: await pathExists(artifact.path)
    }))
  );
  const missingArtifacts = artifactStates.filter((artifact) => !artifact.exists);

  let display: { available: boolean; source: string; detail: string };

  if (process.platform !== "linux") {
    display = {
      available: true,
      source: "not-required",
      detail: "Display preflight is only enforced on Linux/WSL."
    };
  } else {
    const displayEnv = process.env.DISPLAY;
    const waylandDisplay = process.env.WAYLAND_DISPLAY;

    if (displayEnv || waylandDisplay) {
      display = {
        available: true,
        source: "environment",
        detail: displayEnv ? `DISPLAY=${displayEnv}` : `WAYLAND_DISPLAY=${waylandDisplay}`
      };
    } else {
      display = {
        available: false,
        source: "missing",
        detail: "No DISPLAY or WAYLAND_DISPLAY is set for the current Linux session."
      };
    }
  }

  const electron = {
    available: Boolean(process.versions.electron)
  };
  const buildReady = missingArtifacts.length === 0;
  const startReady = buildReady && electron.available && display.available;

  return {
    buildReady,
    startReady,
    electron,
    display,
    missingArtifacts
  };
}

export async function probeStartupRouting(): Promise<StartupRoutingProbe> {
  const appRoot = path.resolve(__dirname, "..", "..", "..", "..");
  const repoRoot = path.resolve(appRoot, "..", "..");
  const [preflight, appPackage, rootPackage] = await Promise.all([
    resolveRuntimePreflight(appRoot),
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
