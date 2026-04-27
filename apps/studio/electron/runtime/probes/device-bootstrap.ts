import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type {
  StudioDeviceBootstrapCheck,
  StudioDeviceBootstrapCheckStatus,
  StudioDeviceBootstrapCommand,
  StudioDeviceBootstrapOverall,
  StudioDeviceBootstrapState,
  StudioGatewayServiceState
} from "@openclaw/shared";
import { loadHermesGatewayServiceState, loadOpenClawGatewayServiceState } from "./gateway-services.js";
import { runSerializedProbe } from "./probe-command-queue.js";

const DEFAULT_TIMEOUT_MS = 12_000;
const MAX_CAPTURE_CHARS = 8_000;

interface CommandResult {
  ok: boolean;
  code: number | null;
  stdout: string;
  stderr: string;
  error: string | null;
  timedOut: boolean;
}

function trimEvidence(value: string | null | undefined, maxLength = 180): string | null {
  const normalized = (value ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return null;
  }

  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}...` : normalized;
}

function firstLine(value: string | null | undefined): string | null {
  const normalized = (value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  return normalized ?? null;
}

function appendCapture(current: string, chunk: Buffer): string {
  const next = current + chunk.toString("utf8");
  return next.length > MAX_CAPTURE_CHARS ? next.slice(-MAX_CAPTURE_CHARS) : next;
}

async function runCommandCapture(command: string, args: string[], timeoutMs = DEFAULT_TIMEOUT_MS): Promise<CommandResult> {
  return await runSerializedProbe(
    "device-bootstrap",
    () =>
      new Promise<CommandResult>((resolve) => {
        let stdout = "";
        let stderr = "";
        let settled = false;
        let child: ReturnType<typeof spawn> | null = null;
        let timeoutHandle: NodeJS.Timeout | null = null;

        const settle = (result: CommandResult) => {
          if (settled) {
            return;
          }
          settled = true;
          if (timeoutHandle) {
            clearTimeout(timeoutHandle);
          }
          resolve(result);
        };

        timeoutHandle = setTimeout(() => {
          child?.kill("SIGTERM");
          settle({
            ok: false,
            code: null,
            stdout,
            stderr,
            error: `${command} timed out after ${timeoutMs}ms.`,
            timedOut: true
          });
        }, timeoutMs);

        try {
          child = spawn(command, args, {
            stdio: ["ignore", "pipe", "pipe"],
            env: {
              ...process.env
            }
          });
        } catch (cause) {
          settle({
            ok: false,
            code: null,
            stdout,
            stderr,
            error: cause instanceof Error ? cause.message : String(cause),
            timedOut: false
          });
          return;
        }

        child.stdout?.on("data", (chunk: Buffer) => {
          stdout = appendCapture(stdout, chunk);
        });
        child.stderr?.on("data", (chunk: Buffer) => {
          stderr = appendCapture(stderr, chunk);
        });
        child.on("error", (cause) => {
          settle({
            ok: false,
            code: null,
            stdout,
            stderr,
            error: cause.message,
            timedOut: false
          });
        });
        child.on("exit", (code) => {
          settle({
            ok: code === 0,
            code,
            stdout,
            stderr,
            error: code === 0 ? null : firstLine(stderr) ?? firstLine(stdout) ?? `${command} exited with code ${code ?? 1}.`,
            timedOut: false
          });
        });
      })
  );
}

function runShell(script: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<CommandResult> {
  if (process.platform === "win32") {
    return runCommandCapture("wsl.exe", ["-e", "bash", "-lc", script], timeoutMs);
  }

  return runCommandCapture("bash", ["-lc", script], timeoutMs);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function createCheck(input: StudioDeviceBootstrapCheck): StudioDeviceBootstrapCheck {
  return input;
}

function statusToneSummary(status: StudioDeviceBootstrapCheckStatus): string {
  switch (status) {
    case "ready":
      return "已就绪";
    case "warning":
      return "需关注";
    case "missing":
      return "未检测到";
    case "blocked":
      return "已阻断";
  }
}

function commandDetail(result: CommandResult): string {
  return trimEvidence(result.stdout) ?? trimEvidence(result.stderr) ?? trimEvidence(result.error) ?? "命令没有返回可展示内容。";
}

function gatewayCheckFromState(
  serviceLabel: "OpenClaw" | "Hermes",
  serviceId: "openclaw" | "hermes",
  state: StudioGatewayServiceState
): StudioDeviceBootstrapCheck {
  return createCheck({
    id: `${serviceId}-gateway`,
    label: `${serviceLabel} Gateway`,
    status: state.running ? "ready" : "warning",
    summary: state.statusLabel,
    detail: state.detail,
    command:
      serviceId === "openclaw"
        ? 'wsl.exe -e bash -lc "openclaw gateway status --json"'
        : 'wsl.exe -e bash -lc "hermes gateway status --all --deep"',
    evidence: state.lastCheckedAt ? `checked ${new Date(state.lastCheckedAt).toLocaleString()}` : null
  });
}

function buildCommands(): StudioDeviceBootstrapCommand[] {
  return [
    {
      id: "host-wsl-status",
      label: "检查 WSL",
      shell: "powershell",
      command: "wsl.exe --status",
      detail: "确认目标设备是否能启动默认 WSL 发行版。",
      safety: "read-only"
    },
    {
      id: "openclaw-runtime-status",
      label: "检查 OpenClaw",
      shell: "wsl",
      command: 'wsl.exe -e bash -lc "command -v openclaw && openclaw gateway status --json"',
      detail: "验证 OpenClaw CLI 与 gateway 是否在目标设备可用。",
      safety: "read-only"
    },
    {
      id: "hermes-runtime-status",
      label: "检查 Hermes",
      shell: "wsl",
      command: 'wsl.exe -e bash -lc "command -v hermes && hermes status --all --deep"',
      detail: "验证 Hermes CLI、配置和会话状态是否可读。",
      safety: "read-only"
    },
    {
      id: "runtime-manifest",
      label: "导出非敏感清单",
      shell: "wsl",
      command:
        'wsl.exe -e bash -lc "mkdir -p ~/openclaw-studio-migration && { command -v openclaw >/dev/null && openclaw models status --json > ~/openclaw-studio-migration/openclaw-models-status.json || true; } && { command -v hermes >/dev/null && hermes status --all --deep > ~/openclaw-studio-migration/hermes-status.txt || true; }"',
      detail: "生成模型、运行态状态清单；不会打包 API key 或登录凭据。",
      safety: "setup"
    },
    {
      id: "secret-relogin",
      label: "目标机重新登录",
      shell: "manual",
      command: "在目标电脑重新执行 Codex/OpenClaw/Hermes 登录或写入加密凭据。",
      detail: "API key、auth.json、secretref 这类敏感材料不进入迁移包。",
      safety: "secret"
    }
  ];
}

function resolveOverall(checks: StudioDeviceBootstrapCheck[]): StudioDeviceBootstrapOverall {
  if (checks.some((check) => check.status === "blocked")) {
    return "blocked";
  }

  if (checks.some((check) => check.status === "missing" || check.status === "warning")) {
    return "partial";
  }

  return "ready";
}

function resolveSummary(overall: StudioDeviceBootstrapOverall): string {
  switch (overall) {
    case "ready":
      return "当前设备已具备 OpenClaw/Hermes 实时接入条件，可直接使用本机运行态。";
    case "blocked":
      return "当前设备缺少基础 Shell/WSL 条件，需先修复系统运行层再接入 OpenClaw/Hermes。";
    case "partial":
      return "当前设备已能识别部分运行态，缺失项需要在目标机安装、登录或启动后才能完整使用。";
  }
}

export async function loadDeviceBootstrapState(): Promise<StudioDeviceBootstrapState> {
  const checks: StudioDeviceBootstrapCheck[] = [];
  const hostHome = os.homedir();
  const checkedAt = Date.now();
  const hostCodexAuthPath = path.join(hostHome, ".codex", "auth.json");

  const hostShell =
    process.platform === "win32" ? await runCommandCapture("wsl.exe", ["--status"], 10_000) : await runCommandCapture("bash", ["-lc", "printf shell-ready"], 10_000);
  checks.push(
    createCheck({
      id: "shell",
      label: process.platform === "win32" ? "WSL 基础层" : "本机 Shell",
      status: hostShell.ok ? "ready" : "blocked",
      summary: hostShell.ok ? "Shell 可用" : "Shell 不可用",
      detail: hostShell.ok
        ? process.platform === "win32"
          ? "Windows 能调用 wsl.exe，后续会在 WSL 内读取 OpenClaw/Hermes。"
          : "当前系统能执行 bash，后续会在本机 HOME 下读取 OpenClaw/Hermes。"
        : commandDetail(hostShell),
      command: process.platform === "win32" ? "wsl.exe --status" : "bash -lc 'printf shell-ready'",
      evidence: commandDetail(hostShell)
    })
  );

  const runtimeHome = await runShell('printf "%s" "$HOME"', 8_000);
  const runtimeHomePath = firstLine(runtimeHome.stdout);
  checks.push(
    createCheck({
      id: "runtime-home",
      label: "运行态 HOME",
      status: runtimeHome.ok && runtimeHomePath ? "ready" : "blocked",
      summary: runtimeHomePath ? runtimeHomePath : statusToneSummary("blocked"),
      detail: runtimeHome.ok ? "已解析目标运行态的 HOME 目录。" : commandDetail(runtimeHome),
      path: runtimeHomePath,
      command: process.platform === "win32" ? 'wsl.exe -e bash -lc "printf \\"%s\\" \\"$HOME\\""' : 'bash -lc "printf \\"%s\\" \\"$HOME\\""',
      evidence: commandDetail(runtimeHome)
    })
  );

  const openclawCli = await runShell("command -v openclaw", 8_000);
  const openclawPath = firstLine(openclawCli.stdout);
  checks.push(
    createCheck({
      id: "openclaw-cli",
      label: "OpenClaw CLI",
      status: openclawCli.ok && openclawPath ? "ready" : "missing",
      summary: openclawPath ? "已安装" : "未检测到 openclaw",
      detail: openclawPath ? "OpenClaw 命令已在运行态 PATH 中。" : "目标设备需要先安装 OpenClaw CLI 或把 openclaw 加入 PATH。",
      path: openclawPath,
      command: 'wsl.exe -e bash -lc "command -v openclaw"',
      evidence: commandDetail(openclawCli)
    })
  );

  const openclawRoot = await runShell('test -d ~/.openclaw && printf "%s" "$HOME/.openclaw"', 8_000);
  const openclawRootPath = firstLine(openclawRoot.stdout);
  checks.push(
    createCheck({
      id: "openclaw-root",
      label: "OpenClaw 配置根",
      status: openclawRoot.ok && openclawRootPath ? "ready" : "missing",
      summary: openclawRootPath ? "配置根存在" : "未检测到 ~/.openclaw",
      detail: openclawRootPath ? "已找到 OpenClaw 配置与会话根目录。" : "目标设备需要初始化 OpenClaw，或迁移非敏感配置清单后重新登录。",
      path: openclawRootPath,
      command: 'wsl.exe -e bash -lc "test -d ~/.openclaw && printf \\"%s\\" \\"$HOME/.openclaw\\""',
      evidence: commandDetail(openclawRoot)
    })
  );

  const openclawAuth = await runShell('test -f ~/.openclaw/openclaw.json || test -f ~/.openclaw/agents/main/auth-profiles.json', 8_000);
  checks.push(
    createCheck({
      id: "openclaw-auth-ref",
      label: "OpenClaw 配置引用",
      status: openclawAuth.ok ? "ready" : "warning",
      summary: openclawAuth.ok ? "已发现配置引用" : "未确认模型/认证引用",
      detail: openclawAuth.ok
        ? "检测到 OpenClaw 主配置或 agent auth profile 文件；不会读取或展示密钥内容。"
        : "未确认 OpenClaw 模型/认证引用，目标设备可能需要重新配置 provider 与 secretref。",
      command: 'wsl.exe -e bash -lc "test -f ~/.openclaw/openclaw.json || test -f ~/.openclaw/agents/main/auth-profiles.json"',
      evidence: commandDetail(openclawAuth)
    })
  );

  if (openclawCli.ok && openclawPath) {
    checks.push(gatewayCheckFromState("OpenClaw", "openclaw", await loadOpenClawGatewayServiceState()));
  }

  const hermesCli = await runShell("command -v hermes", 8_000);
  const hermesPath = firstLine(hermesCli.stdout);
  checks.push(
    createCheck({
      id: "hermes-cli",
      label: "Hermes CLI",
      status: hermesCli.ok && hermesPath ? "ready" : "missing",
      summary: hermesPath ? "已安装" : "未检测到 hermes",
      detail: hermesPath ? "Hermes 命令已在运行态 PATH 中。" : "目标设备需要安装 Hermes 或把 hermes 加入 PATH。",
      path: hermesPath,
      command: 'wsl.exe -e bash -lc "command -v hermes"',
      evidence: commandDetail(hermesCli)
    })
  );

  const hermesRoot = await runShell('test -d ~/.hermes && printf "%s" "$HOME/.hermes"', 8_000);
  const hermesRootPath = firstLine(hermesRoot.stdout);
  checks.push(
    createCheck({
      id: "hermes-root",
      label: "Hermes 配置根",
      status: hermesRoot.ok && hermesRootPath ? "ready" : "missing",
      summary: hermesRootPath ? "配置根存在" : "未检测到 ~/.hermes",
      detail: hermesRootPath ? "已找到 Hermes 配置与会话根目录。" : "目标设备需要初始化 Hermes，或在迁移清单后重新配置。",
      path: hermesRootPath,
      command: 'wsl.exe -e bash -lc "test -d ~/.hermes && printf \\"%s\\" \\"$HOME/.hermes\\""',
      evidence: commandDetail(hermesRoot)
    })
  );

  const hermesAuth = await runShell('test -f ~/.hermes/auth.json || test -f ~/.hermes/config.yaml', 8_000);
  checks.push(
    createCheck({
      id: "hermes-auth-ref",
      label: "Hermes 登录/配置引用",
      status: hermesAuth.ok ? "ready" : "warning",
      summary: hermesAuth.ok ? "已发现配置引用" : "未确认登录/配置引用",
      detail: hermesAuth.ok ? "检测到 Hermes auth/config 文件；不会读取或展示 token 内容。" : "目标设备需要重新登录 Hermes 或恢复 config.yaml。",
      command: 'wsl.exe -e bash -lc "test -f ~/.hermes/auth.json || test -f ~/.hermes/config.yaml"',
      evidence: commandDetail(hermesAuth)
    })
  );

  if (hermesCli.ok && hermesPath) {
    checks.push(gatewayCheckFromState("Hermes", "hermes", await loadHermesGatewayServiceState()));
  }

  const hostCodexAuthExists = await fileExists(hostCodexAuthPath);
  const runtimeCodexAuth = await runShell("test -f ~/.codex/auth.json", 8_000);
  checks.push(
    createCheck({
      id: "codex-auth",
      label: "Codex 登录态",
      status: hostCodexAuthExists || runtimeCodexAuth.ok ? "ready" : "warning",
      summary: hostCodexAuthExists || runtimeCodexAuth.ok ? "已发现登录态文件" : "未发现登录态文件",
      detail: "只检测 auth.json 是否存在，不读取、不导出、不迁移其中内容。",
      path: hostCodexAuthExists ? hostCodexAuthPath : runtimeCodexAuth.ok ? "~/.codex/auth.json" : null,
      command: 'wsl.exe -e bash -lc "test -f ~/.codex/auth.json"',
      evidence: hostCodexAuthExists ? "host .codex/auth.json exists" : commandDetail(runtimeCodexAuth)
    })
  );

  const overall = resolveOverall(checks);

  return {
    source: "runtime",
    host: {
      platform: os.platform(),
      arch: os.arch(),
      homeDir: hostHome,
      checkedAt
    },
    overall,
    summary: resolveSummary(overall),
    checks,
    commands: buildCommands(),
    migration: {
      secretPolicy: "迁移包只包含非敏感运行态清单；API key、auth.json、secretref、gateway token 必须在目标设备重新登录或通过受保护凭据导入。",
      exportPlan: [
        "在源设备导出 OpenClaw 模型状态、Hermes 状态和版本信息清单。",
        "记录 WSL 发行版、OpenClaw/Hermes CLI 路径和 gateway 状态。",
        "跳过所有 auth、secret、token、key 文件。"
      ],
      importPlan: [
        "在目标设备安装 WSL、OpenClaw CLI 与 Hermes CLI。",
        "恢复非敏感配置清单后重新执行 Codex/OpenClaw/Hermes 登录。",
        "启动 OpenClaw/Hermes gateway，再返回本页刷新检测。"
      ],
      portableReadiness:
        overall === "ready"
          ? "当前设备已能直接读取本机运行态；打包后的程序在其他设备仍会按同一套检测重新识别。"
          : "其他设备会自动重新检测，但缺失的 CLI、WSL、登录态和密钥不会随安装包自动转移。"
    }
  };
}
