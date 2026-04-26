import { spawn } from "node:child_process";
import type { StudioGatewayServiceMutationResult, StudioGatewayServiceState } from "@openclaw/shared";

const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_CAPTURE_CHARS = 128_000;

interface CommandInvocation {
  command: string;
  args: string[];
  env: NodeJS.ProcessEnv;
  label: string;
}

async function runCommandCapture(
  invocation: CommandInvocation,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxCaptureChars = MAX_CAPTURE_CHARS
): Promise<{ stdout: string; stderr: string }> {
  const stdout = { value: "" };
  const stderr = { value: "" };

  return await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(invocation.command, invocation.args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: invocation.env
    });

    const timeoutHandle = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`${invocation.label} timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout.value += chunk.toString();
      if (stdout.value.length > maxCaptureChars) {
        stdout.value = stdout.value.slice(-maxCaptureChars);
      }
    });

    child.stderr.on("data", (chunk) => {
      stderr.value += chunk.toString();
      if (stderr.value.length > maxCaptureChars) {
        stderr.value = stderr.value.slice(-maxCaptureChars);
      }
    });

    child.on("error", (error) => {
      clearTimeout(timeoutHandle);
      reject(error);
    });

    child.on("exit", (code) => {
      clearTimeout(timeoutHandle);

      if (code !== 0) {
        reject(
          new Error(
            [
              `${invocation.label} exited with code ${code ?? 1}.`,
              stderr.value.trim() || stdout.value.trim() || invocation.label
            ].join("\n")
          )
        );
        return;
      }

      resolve({
        stdout: stdout.value,
        stderr: stderr.value
      });
    });
  });
}

function createGatewayServiceState(
  serviceId: "openclaw" | "hermes",
  running: boolean,
  statusLabel: string,
  detail: string
): StudioGatewayServiceState {
  return {
    serviceId,
    running,
    statusLabel,
    detail,
    source: "runtime",
    lastCheckedAt: Date.now(),
    startAllowed: !running,
    stopAllowed: running
  };
}

function extractFirstLine(cause: unknown): string {
  const message = cause instanceof Error ? cause.message : String(cause);
  return message.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? "操作失败。";
}

function describeGatewayNextStep(serviceId: "openclaw" | "hermes", message: string, action: "status" | "start" | "stop"): string {
  if (/wsl\.exe|ENOENT/i.test(message)) {
    return "下一步：确认 Windows 能启动 WSL，并在 WSL 中执行对应命令复测。";
  }

  if (/command not found|not recognized|找不到/i.test(message)) {
    return serviceId === "hermes"
      ? "下一步：在 WSL 安装 Hermes 或把 hermes 加入 PATH，然后重新读取状态。"
      : "下一步：在 WSL 安装 OpenClaw CLI 或把 openclaw 加入 PATH，然后重新读取状态。";
  }

  if (/timed out|timeout/i.test(message)) {
    return `下一步：在 WSL 手动运行 ${serviceId === "hermes" ? "hermes gateway" : "openclaw gateway"} ${action}，确认命令是否被网络、认证或后台服务阻塞。`;
  }

  if (/permission|denied|权限/i.test(message)) {
    return "下一步：检查 WSL 内服务权限和当前用户权限，必要时用同一用户手动执行命令。";
  }

  return `下一步：在 WSL 手动运行 ${serviceId === "hermes" ? "hermes gateway" : "openclaw gateway"} ${action} 查看完整输出。`;
}

function formatGatewayMutationError(serviceId: "openclaw" | "hermes", cause: unknown, action: "start" | "stop"): string {
  const message = extractFirstLine(cause);
  return `${message} ${describeGatewayNextStep(serviceId, message, action)}`;
}

function formatGatewayError(serviceId: "openclaw" | "hermes", cause: unknown): StudioGatewayServiceState {
  const message = extractFirstLine(cause);
  const normalizedMessage = message.trim();

  if (serviceId === "hermes" && /command not found|not recognized|ENOENT|找不到/i.test(normalizedMessage)) {
    return createGatewayServiceState("hermes", false, "Hermes CLI 不可用", "未检测到 hermes 命令，请先在 WSL 环境安装 Hermes 或把它加入 PATH。");
  }

  return createGatewayServiceState(serviceId, false, "状态未知", `${normalizedMessage} ${describeGatewayNextStep(serviceId, normalizedMessage, "status")}`);
}

export async function loadOpenClawGatewayServiceState(): Promise<StudioGatewayServiceState> {
  try {
    const captured = await runCommandCapture(
      {
        command: "wsl.exe",
        args: ["-e", "bash", "-lc", "openclaw gateway status --json"],
        env: {
          ...process.env
        },
        label: "openclaw gateway status --json"
      },
      30_000
    );

    const parsed = JSON.parse(captured.stdout) as {
      service?: {
        runtime?: {
          status?: string;
          state?: string;
        };
      };
      rpc?: {
        ok?: boolean;
        url?: string;
        error?: string;
      };
      port?: {
        status?: string;
        hints?: string[];
      };
      gateway?: {
        probeUrl?: string;
      };
    };

    const running =
      parsed.service?.runtime?.status === "running" ||
      parsed.service?.runtime?.state === "active" ||
      parsed.rpc?.ok === true;

    const detail =
      parsed.rpc?.ok === true
        ? `RPC 可达 · ${parsed.rpc.url ?? parsed.gateway?.probeUrl ?? "ws://127.0.0.1"}`
        : parsed.rpc?.error
          ? `服务进程${running ? "已运行" : "未运行"}，但 RPC 探针失败：${parsed.rpc.error}。下一步：确认 gateway token/认证配置与 CLI probe 使用同一份 ~/.openclaw/openclaw.json。`
          : parsed.port?.hints?.[0] ?? (running ? "服务进程已运行，但端口/RPC 探针未返回可用结果。" : "Gateway 服务当前未运行。");

    return createGatewayServiceState("openclaw", running, running ? "Gateway 已运行" : "Gateway 未运行", detail);
  } catch (cause) {
    return formatGatewayError("openclaw", cause);
  }
}

export async function startOpenClawGatewayService(): Promise<StudioGatewayServiceMutationResult> {
  try {
    await runCommandCapture(
      {
        command: "wsl.exe",
        args: ["-e", "bash", "-lc", "openclaw gateway start --json || openclaw gateway start"],
        env: {
          ...process.env
        },
        label: "openclaw gateway start"
      },
      60_000
    );
  } catch (cause) {
    return {
      applied: false,
      error: formatGatewayMutationError("openclaw", cause, "start"),
      state: await loadOpenClawGatewayServiceState()
    };
  }

  const state = await loadOpenClawGatewayServiceState();

  if (!state.running) {
    return {
      applied: false,
      error: state.detail || "启动命令已返回，但 Gateway 仍未进入运行状态。",
      state
    };
  }

  return {
    applied: true,
    error: null,
    state
  };
}

export async function stopOpenClawGatewayService(): Promise<StudioGatewayServiceMutationResult> {
  try {
    await runCommandCapture(
      {
        command: "wsl.exe",
        args: ["-e", "bash", "-lc", "openclaw gateway stop --json || openclaw gateway stop"],
        env: {
          ...process.env
        },
        label: "openclaw gateway stop"
      },
      60_000
    );
  } catch (cause) {
    return {
      applied: false,
      error: formatGatewayMutationError("openclaw", cause, "stop"),
      state: await loadOpenClawGatewayServiceState()
    };
  }

  const state = await loadOpenClawGatewayServiceState();

  if (state.running) {
    return {
      applied: false,
      error: state.detail || "停止命令已返回，但 Gateway 仍处于运行状态。",
      state
    };
  }

  return {
    applied: true,
    error: null,
    state
  };
}

export async function loadHermesGatewayServiceState(): Promise<StudioGatewayServiceState> {
  try {
    const captured = await runCommandCapture(
      {
        command: "wsl.exe",
        args: ["-e", "bash", "-lc", "hermes gateway status"],
        env: {
          ...process.env
        },
        label: "hermes gateway status"
      },
      30_000
    );

    const combined = `${captured.stdout}\n${captured.stderr}`;
    const running = /active \(running\)|gateway service is running/i.test(combined);
    const detailLine =
      combined
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => /Main PID:|gateway service is running|Loaded:|Active:/i.test(line)) ?? "Hermes gateway 状态已检查。";

    return createGatewayServiceState("hermes", running, running ? "Gateway 已运行" : "Gateway 未运行", detailLine);
  } catch (cause) {
    return formatGatewayError("hermes", cause);
  }
}

export async function startHermesGatewayService(): Promise<StudioGatewayServiceMutationResult> {
  try {
    await runCommandCapture(
      {
        command: "wsl.exe",
        args: ["-e", "bash", "-lc", "hermes gateway start"],
        env: {
          ...process.env
        },
        label: "hermes gateway start"
      },
      60_000
    );
  } catch (cause) {
    return {
      applied: false,
      error: formatGatewayMutationError("hermes", cause, "start"),
      state: await loadHermesGatewayServiceState()
    };
  }

  const state = await loadHermesGatewayServiceState();

  if (!state.running) {
    return {
      applied: false,
      error: state.detail || "启动命令已返回，但 Hermes Gateway 仍未进入运行状态。",
      state
    };
  }

  return {
    applied: true,
    error: null,
    state
  };
}

export async function stopHermesGatewayService(): Promise<StudioGatewayServiceMutationResult> {
  try {
    await runCommandCapture(
      {
        command: "wsl.exe",
        args: ["-e", "bash", "-lc", "hermes gateway stop"],
        env: {
          ...process.env
        },
        label: "hermes gateway stop"
      },
      60_000
    );
  } catch (cause) {
    return {
      applied: false,
      error: formatGatewayMutationError("hermes", cause, "stop"),
      state: await loadHermesGatewayServiceState()
    };
  }

  const state = await loadHermesGatewayServiceState();

  if (state.running) {
    return {
      applied: false,
      error: state.detail || "停止命令已返回，但 Hermes Gateway 仍处于运行状态。",
      state
    };
  }

  return {
    applied: true,
    error: null,
    state
  };
}
