import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import { createConnection } from "node:net";
import os from "node:os";
import path from "node:path";
import type { SettingItem, ShellStatus } from "@openclaw/shared";

const openclawRoot = path.join(os.homedir(), ".openclaw");
const workspaceStatePath = path.join(openclawRoot, "workspace", ".openclaw", "workspace-state.json");

// WSL IP 检测超时时间（毫秒）
const WSL_IP_DETECTION_TIMEOUT_MS = 5000;
const DEFAULT_OPENCLAW_GATEWAY_PORT = 18789;

// WSL IP 缓存
let cachedWslIPs: string[] | null = null;
let wslIPCacheTime = 0;
const WSL_IP_CACHE_DURATION_MS = 5 * 60 * 1000; // 5 分钟

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

async function getWslIpAddresses(): Promise<string[]> {
  if (process.platform !== "win32") {
    return [];
  }

  const now = Date.now();
  if (cachedWslIPs && now - wslIPCacheTime < WSL_IP_CACHE_DURATION_MS) {
    return cachedWslIPs;
  }

  try {
    const { spawn } = await import("node:child_process");
    const output = await new Promise<string>((resolve) => {
      const proc = spawn("wsl.exe", ["hostname", "-I"]);
      let stdout = "";
      let resolved = false;

      const finish = (value: string) => {
        if (resolved) {
          return;
        }
        resolved = true;
        resolve(value);
      };

      proc.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      proc.on("close", () => finish(stdout));
      proc.on("error", () => finish(""));
      setTimeout(() => {
        proc.kill();
        finish(stdout);
      }, WSL_IP_DETECTION_TIMEOUT_MS);
    });

    cachedWslIPs = uniqueValues(
      output
        .trim()
        .split(/\s+/)
        .filter((entry) => /^\d+\.\d+\.\d+\.\d+$/.test(entry))
    );
    wslIPCacheTime = now;
    return cachedWslIPs;
  } catch {
    cachedWslIPs = [];
    wslIPCacheTime = now;
    return [];
  }
}

export async function collectGatewayCandidateUrls(): Promise<string[]> {
  const configuredUrl = process.env.OPENCLAW_STUDIO_GATEWAY_URL?.trim();
  const baseCandidates = configuredUrl ? [configuredUrl] : [];
  const localCandidates = [`http://127.0.0.1:${DEFAULT_OPENCLAW_GATEWAY_PORT}/`, `http://localhost:${DEFAULT_OPENCLAW_GATEWAY_PORT}/`];
  const wslCandidates = (await getWslIpAddresses()).map((ip) => `http://${ip}:${DEFAULT_OPENCLAW_GATEWAY_PORT}/`);

  return uniqueValues([...baseCandidates, ...localCandidates, ...wslCandidates]);
}

const networkProbeUrl = process.env.OPENCLAW_STUDIO_NETWORK_PROBE_URL ?? "https://github.com/";

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

async function probeUrlReachability(
  url: string,
  options: {
    method?: "GET" | "HEAD";
    timeoutMs?: number;
  } = {}
): Promise<{ ok: boolean; status: number | null; detail: string }> {
  const timeoutMs = options.timeoutMs ?? 4_000;
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      signal: controller.signal
    });

    return {
      ok: response.ok,
      status: response.status,
      detail: `${response.status} ${response.statusText}`.trim()
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      detail: error instanceof Error ? error.message : String(error)
    };
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function getTcpTarget(url: string): { host: string; port: number } {
  const parsed = new URL(url);
  const port = parsed.port ? Number(parsed.port) : DEFAULT_OPENCLAW_GATEWAY_PORT;
  return {
    host: parsed.hostname,
    port
  };
}

async function probeTcpReachability(
  url: string,
  timeoutMs = 3_500
): Promise<{ ok: boolean; status: number | null; detail: string; url: string }> {
  const target = getTcpTarget(url);

  return await new Promise((resolve) => {
    let settled = false;
    const socket = createConnection({
      host: target.host,
      port: target.port
    });

    const finish = (ok: boolean, detail: string) => {
      if (settled) {
        return;
      }
      settled = true;
      socket.destroy();
      resolve({
        ok,
        status: null,
        detail,
        url
      });
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true, `TCP 可达 · ${target.host}:${target.port}`));
    socket.once("timeout", () => finish(false, `连接超时 · ${target.host}:${target.port}`));
    socket.once("error", (error) => finish(false, error.message));
  });
}

async function probeGatewayReachability(): Promise<{
  ok: boolean;
  status: number | null;
  detail: string;
  url: string;
  candidates: string[];
}> {
  const candidates = await collectGatewayCandidateUrls();
  const failures: string[] = [];

  for (const candidate of candidates) {
    const result = await probeTcpReachability(candidate);

    if (result.ok) {
      return {
        ...result,
        candidates
      };
    }

    failures.push(`${candidate} ${result.detail}`);
  }

  return {
    ok: false,
    status: null,
    detail: failures[0] ?? "未找到可探测的 Gateway 地址。",
    url: candidates[0] ?? `http://127.0.0.1:${DEFAULT_OPENCLAW_GATEWAY_PORT}/`,
    candidates
  };
}

export async function probeLiveSystemStatus(): Promise<LiveSystemProbe> {
  const [openclawHomeExists, workspaceState, codexBinary, openclawBinary, gatewayProbe, networkProbe] = await Promise.all([
    pathExists(openclawRoot),
    readWorkspaceState(),
    findBinary("codex"),
    findBinary("openclaw"),
    probeGatewayReachability(),
    probeUrlReachability(networkProbeUrl, { method: "HEAD", timeoutMs: 4_500 })
  ]);

  const binaryCount = Number(Boolean(codexBinary)) + Number(Boolean(openclawBinary));
  const hasLiveSignal = openclawHomeExists || binaryCount > 0 || Boolean(workspaceState?.setupCompletedAt) || gatewayProbe.ok;

  return {
    source: hasLiveSignal ? "live" : "mock",
    status: {
      mode: hasLiveSignal ? "Studio Alpha (Hybrid)" : "Studio Alpha",
      bridge: hasLiveSignal ? "hybrid" : "mock",
      runtime: openclawHomeExists || gatewayProbe.ok ? "ready" : "degraded"
    },
    checks: [
      {
        id: "check-openclaw-home",
        label: "OpenClaw 主目录",
        value: openclawHomeExists ? "已检测到" : "不可用",
        detail: openclawRoot,
        tone: openclawHomeExists ? "positive" : "warning"
      },
      {
        id: "check-cli",
        label: "命令行工具",
        value: binaryCount === 2 ? "codex + openclaw" : binaryCount === 1 ? "部分可用" : "未找到",
        detail: codexBinary && openclawBinary ? `${codexBinary} | ${openclawBinary}` : codexBinary ?? openclawBinary ?? "PATH 中未检测到 CLI 工具。",
        tone: binaryCount === 2 ? "positive" : binaryCount === 1 ? "neutral" : "warning"
      },
      {
        id: "check-local-gateway",
        label: "本地网关",
        value: gatewayProbe.ok ? "已连接" : "不可用",
        detail: `${gatewayProbe.url} · ${gatewayProbe.detail}${
          gatewayProbe.ok ? "" : ` · 候选=${gatewayProbe.candidates.join(", ")}`
        }`,
        tone: gatewayProbe.ok ? "positive" : "warning"
      },
      {
        id: "check-network",
        label: "网络连接",
        value: networkProbe.ok ? "可访问" : "受限",
        detail: `${networkProbeUrl} · ${networkProbe.detail}`,
        tone: networkProbe.ok ? "positive" : "warning"
      },
      {
        id: "check-workspace-state",
        label: "工作区状态",
        value: workspaceState?.setupCompletedAt ? "已初始化" : "不可用",
        detail: workspaceState?.setupCompletedAt
          ? `初始化时间=${workspaceState.setupCompletedAt}`
          : "workspace-state.json 不可用。",
        tone: workspaceState?.setupCompletedAt ? "positive" : "warning"
      }
    ]
  };
}
