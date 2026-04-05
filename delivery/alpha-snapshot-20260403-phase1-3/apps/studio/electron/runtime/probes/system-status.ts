import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { SettingItem, ShellStatus } from "@openclaw/shared";

const openclawRoot = path.join(os.homedir(), ".openclaw");
const workspaceStatePath = path.join(openclawRoot, "workspace", ".openclaw", "workspace-state.json");

interface WorkspaceState {
  setupCompletedAt?: string;
}

export interface LiveSystemProbe {
  source: "live" | "mock";
  status: ShellStatus;
  checks: SettingItem[];
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function findBinary(binaryName: string): Promise<string | null> {
  const pathSegments = (process.env.PATH ?? "").split(path.delimiter).filter(Boolean);

  for (const segment of pathSegments) {
    const candidate = path.join(segment, binaryName);

    try {
      await fs.access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      continue;
    }
  }

  return null;
}

async function readWorkspaceState(): Promise<WorkspaceState | null> {
  try {
    const raw = await fs.readFile(workspaceStatePath, "utf8");
    return JSON.parse(raw) as WorkspaceState;
  } catch {
    return null;
  }
}

export async function probeLiveSystemStatus(): Promise<LiveSystemProbe> {
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
