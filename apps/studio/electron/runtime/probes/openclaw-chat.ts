import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import type {
  StudioOpenClawChatAvailability,
  StudioOpenClawChatMessage,
  StudioOpenClawChatSessionRef,
  StudioOpenClawChatState,
  StudioOpenClawChatTurnResult
} from "@openclaw/shared";

const DEFAULT_TIMEOUT_MS = 180_000;
const MAX_CAPTURE_CHARS = 32_000;
const MAIN_SESSION_KEY = "agent:main:main";
const OPENCLAW_CHAT_COMMAND = "openclaw agent --agent main --json --message <prompt>";
const MAX_CHAT_MESSAGES = 40;
const MAX_SESSION_LINES = 400;
const SESSION_INDEX_PATH_SEGMENTS = [".openclaw", "agents", "main", "sessions", "sessions.json"] as const;

// 可用性检查缓存
let cachedReadiness: OpenClawChatReadiness | null = null;
let readinessCacheTime = 0;
const READINESS_CACHE_DURATION_MS = 30 * 1000; // 30 秒
const SESSION_DIRECTORY_PATH_SEGMENTS = [".openclaw", "agents", "main", "sessions"] as const;
const SESSION_FILE_SCAN_LIMIT = 12;
const WIN32_WSL_OPENCLAW_ROOT_CANDIDATES = [
  "\\\\wsl$\\Ubuntu-24.04\\home\\qz057\\.openclaw",
  "\\\\wsl.localhost\\Ubuntu-24.04\\home\\qz057\\.openclaw"
] as const;

interface OpenClawChatReadiness {
  availability: StudioOpenClawChatAvailability;
  canSend: boolean;
  readinessLabel: string;
  disabledReason: string | null;
  command: string;
}

interface OpenClawSessionEvent {
  id?: string;
  timestamp?: string;
  type?: string;
  message?: {
    role?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  };
}

interface OpenClawSessionSummary {
  key?: string;
  sessionId?: string;
  updatedAt?: number;
  model?: string;
  modelProvider?: string;
}

interface IndexedOpenClawSessionSummary extends OpenClawSessionSummary {
  key: string;
}

type SessionIndexEntry = Record<string, unknown>;

type SessionReadInvocation =
  | {
      command: string;
      args: string[];
      env: NodeJS.ProcessEnv;
      label: string;
      mode: "command";
    }
  | {
      command: string;
      args: string[];
      env: NodeJS.ProcessEnv;
      label: string;
      mode: "fs";
      path: string;
    };

function createChatState(
  readiness: OpenClawChatReadiness,
  overrides: Partial<Pick<StudioOpenClawChatState, "source" | "sessionKey" | "sessionId" | "model" | "provider" | "updatedAt" | "messages">> = {}
): StudioOpenClawChatState {
  return {
    source: overrides.source ?? "runtime",
    availability: readiness.availability,
    canSend: readiness.canSend,
    readinessLabel: readiness.readinessLabel,
    disabledReason: readiness.disabledReason,
    command: readiness.command,
    sessionKey: overrides.sessionKey ?? MAIN_SESSION_KEY,
    sessionId: overrides.sessionId ?? null,
    model: overrides.model ?? null,
    provider: overrides.provider ?? null,
    updatedAt: overrides.updatedAt ?? null,
    messages: overrides.messages ?? []
  };
}

function buildExplicitSessionKey(sessionId: string): string {
  return `agent:main:explicit:${sessionId.trim()}`;
}

function formatProbeFailure(cause: unknown): string {
  const rawMessage = cause instanceof Error ? cause.message : String(cause);
  const message = rawMessage.trim();
  const firstLine = message.split(/\r?\n/).find(Boolean) ?? message;

  if (firstLine.includes("ENOENT") || firstLine.includes("command not found")) {
    return process.platform === "win32"
      ? "未检测到 WSL 内的 openclaw 命令，当前不能从 Studio 发送到 OpenClaw。"
      : "未检测到 openclaw 命令，当前不能从 Studio 发送到 OpenClaw。";
  }

  if (firstLine.includes("wsl.exe")) {
    return "未检测到可用的 WSL 发送链路，当前不能从 Studio 发送到 OpenClaw。";
  }

  return `OpenClaw 发送链路不可用：${firstLine}`;
}

function buildAvailabilityCommand() {
  if (process.platform === "win32") {
    return {
      command: "wsl.exe",
      args: ["-e", "bash", "-lc", "command -v openclaw >/dev/null 2>&1"],
      env: {
        ...process.env
      },
      label: 'wsl.exe -e bash -lc "command -v openclaw"'
    };
  }

  return {
    command: "openclaw",
    args: ["--version"],
    env: {
      ...process.env
    },
    label: "openclaw --version"
  };
}

async function resolveChatReadiness(): Promise<OpenClawChatReadiness> {
  // 检查缓存是否有效
  const now = Date.now();
  if (cachedReadiness && (now - readinessCacheTime) < READINESS_CACHE_DURATION_MS) {
    return cachedReadiness;
  }

  try {
    await runCommandCapture(buildAvailabilityCommand(), 15_000, 8_000);
    const readiness: OpenClawChatReadiness = {
      availability: "ready",
      canSend: true,
      readinessLabel: "可发送",
      disabledReason: null,
      command: OPENCLAW_CHAT_COMMAND
    };

    // 更新缓存
    cachedReadiness = readiness;
    readinessCacheTime = now;

    return readiness;
  } catch (cause) {
    const readiness: OpenClawChatReadiness = {
      availability: "blocked",
      canSend: false,
      readinessLabel: "不可发送",
      disabledReason: formatProbeFailure(cause),
      command: OPENCLAW_CHAT_COMMAND
    };

    // 失败时也缓存，但时间较短
    cachedReadiness = readiness;
    readinessCacheTime = now;

    return readiness;
  }
}

function extractReply(parsed: Record<string, unknown>): string {
  const payloads = Array.isArray((parsed.result as { payloads?: unknown[] } | undefined)?.payloads)
    ? ((parsed.result as { payloads?: Array<{ text?: unknown }> }).payloads ?? [])
    : [];
  const textPayloads = payloads
    .map((payload) => (typeof payload?.text === "string" ? payload.text.trim() : ""))
    .filter(Boolean);

  if (textPayloads.length > 0) {
    return textPayloads.join("\n\n");
  }

  const fallbackReply =
    typeof parsed.summary === "string"
      ? parsed.summary
      : typeof (parsed.result as { summary?: unknown } | undefined)?.summary === "string"
        ? String((parsed.result as { summary?: unknown }).summary)
        : "";

  return fallbackReply.trim() || "OpenClaw did not return a reply payload.";
}

function sanitizeUserMessage(text: string): string {
  return text
    .replace(/^Sender \(untrusted metadata\):\s*```json[\s\S]*?```\s*/u, "")
    .replace(/^\[[^\]]+\]\s*/u, "")
    .trim();
}

function normalizeMessage(role: "user" | "assistant", text: string): string {
  const trimmed = text.trim();
  return role === "user" ? sanitizeUserMessage(trimmed) : trimmed;
}

function parseJsonLine(line: string): OpenClawSessionEvent | null {
  try {
    return JSON.parse(line) as OpenClawSessionEvent;
  } catch {
    return null;
  }
}

function parseJsonObject(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();

  if (!trimmed) {
    throw new Error("OpenClaw 未返回 JSON 输出。");
  }

  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch (error) {
    const lines = trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

    for (let index = lines.length - 1; index >= 0; index -= 1) {
      const candidate = lines[index];

      if (!candidate) {
        continue;
      }

      try {
        const parsed = JSON.parse(candidate);

        if (parsed && typeof parsed === "object") {
          return parsed as Record<string, unknown>;
        }
      } catch {
        continue;
      }
    }

    throw error;
  }
}

function extractMessageText(event: OpenClawSessionEvent): string | null {
  const text = event.message?.content
    ?.filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text?.trim() ?? "")
    .filter(Boolean)
    .join("\n\n");

  return text && text.trim().length > 0 ? text.trim() : null;
}

async function readUtf8File(targetPath: string): Promise<string> {
  return fs.readFile(targetPath, "utf8");
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function runCommandCapture(
  invocation: {
    command: string;
    args: string[];
    env: NodeJS.ProcessEnv;
    label: string;
  },
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

function normalizeSessionSummary(key: string, entry: SessionIndexEntry): OpenClawSessionSummary {
  return {
    key,
    sessionId: typeof entry.sessionId === "string" ? entry.sessionId : undefined,
    updatedAt: typeof entry.updatedAt === "number" ? entry.updatedAt : undefined,
    model: typeof entry.model === "string" ? entry.model : undefined,
    modelProvider: typeof entry.modelProvider === "string" ? entry.modelProvider : undefined
  };
}

function parseSessionSummaries(raw: string): IndexedOpenClawSessionSummary[] {
  const parsed = JSON.parse(raw) as Record<string, unknown>;

  if (Array.isArray((parsed as { sessions?: unknown[] }).sessions)) {
    return ((parsed as { sessions?: unknown[] }).sessions ?? [])
      .filter((entry): entry is SessionIndexEntry => Boolean(entry) && typeof entry === "object")
      .map((entry) => normalizeSessionSummary(typeof entry.key === "string" ? entry.key : "", entry))
      .filter((entry): entry is IndexedOpenClawSessionSummary => Boolean(entry.key));
  }

  return Object.entries(parsed)
    .filter(([, entry]) => Boolean(entry) && typeof entry === "object")
    .map(([key, entry]) => normalizeSessionSummary(key, entry as SessionIndexEntry))
    .filter((entry): entry is IndexedOpenClawSessionSummary => Boolean(entry.key));
}

function getSessionsDirectoryPath() {
  if (process.platform === "win32") {
    const win32Candidate = WIN32_WSL_OPENCLAW_ROOT_CANDIDATES[0];
    return path.win32.join(win32Candidate, "agents", "main", "sessions");
  }

  return path.join(os.homedir(), ...SESSION_DIRECTORY_PATH_SEGMENTS);
}

function getSessionIndexPath() {
  if (process.platform === "win32") {
    const win32Candidate = WIN32_WSL_OPENCLAW_ROOT_CANDIDATES[0];
    return path.win32.join(win32Candidate, "agents", "main", "sessions", "sessions.json");
  }

  return path.join(os.homedir(), ...SESSION_INDEX_PATH_SEGMENTS);
}

async function loadSessionSummariesSafe(): Promise<IndexedOpenClawSessionSummary[]> {
  try {
    if (process.platform === "win32") {
      for (const candidateRoot of WIN32_WSL_OPENCLAW_ROOT_CANDIDATES) {
        const candidatePath = path.win32.join(candidateRoot, "agents", "main", "sessions", "sessions.json");

        if (!(await pathExists(candidatePath))) {
          continue;
        }

        return parseSessionSummaries(await readUtf8File(candidatePath));
      }
    }

    return parseSessionSummaries(await readUtf8File(getSessionIndexPath()));
  } catch {
    return [];
  }
}

function buildReadSessionCommand(sessionPath: string): SessionReadInvocation {
  if (process.platform === "win32") {
    return {
      command: "wsl.exe",
      args: ["-e", "bash", "-lc", `tail -n ${MAX_SESSION_LINES} "$1"`, "--", sessionPath],
      env: {
        ...process.env
      },
      label: `wsl.exe -e bash -lc "tail -n ${MAX_SESSION_LINES} <session>"`,
      mode: "command"
    };
  }

  return {
    command: "",
    args: [],
    env: {
      ...process.env
    },
    label: `read ${sessionPath}`,
    mode: "fs",
    path: sessionPath
  };
}

function buildPrimarySessionCommand(sessionId: string): SessionReadInvocation {
  if (process.platform === "win32") {
    const candidatePath = path.win32.join(getSessionsDirectoryPath(), `${sessionId}.jsonl`);

    return {
      command: "",
      args: [],
      env: {
        ...process.env
      },
      label: `read ${candidatePath}`,
      mode: "fs",
      path: candidatePath
    };
  }

  const sessionPath = path.join(getSessionsDirectoryPath(), `${sessionId}.jsonl`);
  return {
    command: "",
    args: [],
    env: {
      ...process.env
    },
    label: `read ${sessionPath}`,
    mode: "fs",
    path: sessionPath
  };
}

function buildPrimarySessionCommandFallback(sessionId: string): SessionReadInvocation {
  if (process.platform === "win32") {
    return {
      command: "wsl.exe",
      args: [
        "-e",
        "bash",
        "-lc",
        `tail -n ${MAX_SESSION_LINES} "$HOME/.openclaw/agents/main/sessions/$1.jsonl"`,
        "--",
        sessionId
      ],
      env: {
        ...process.env
      },
      label: `wsl.exe -e bash -lc "tail -n ${MAX_SESSION_LINES} $HOME/.openclaw/.../<session>.jsonl"`,
      mode: "command"
    };
  }

  const sessionPath = path.join(os.homedir(), ...SESSION_DIRECTORY_PATH_SEGMENTS, `${sessionId}.jsonl`);
  return {
    command: "",
    args: [],
    env: {
      ...process.env
    },
    label: `read ${sessionPath}`,
    mode: "fs",
    path: sessionPath
  };
}

async function readSessionHistory(readCommand: SessionReadInvocation): Promise<string | null> {
  try {
    return readCommand.mode === "fs"
      ? await readUtf8File(readCommand.path)
      : (await runCommandCapture(readCommand, 30_000, 1_000_000)).stdout;
  } catch {
    return null;
  }
}

async function listRecentSessionPaths(): Promise<string[]> {
  if (process.platform === "win32") {
    try {
      const captured = await runCommandCapture(
        {
          command: "wsl.exe",
          args: [
            "-e",
            "bash",
            "-lc",
            `ls -t "$HOME/.openclaw/agents/main/sessions"/*.jsonl 2>/dev/null | head -n ${SESSION_FILE_SCAN_LIMIT}`
          ],
          env: {
            ...process.env
          },
          label: 'wsl.exe -e bash -lc "list recent session files"'
        },
        15_000,
        64_000
      );
      return captured.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  try {
    const directory = getSessionsDirectoryPath();
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const filesWithStats = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
        .map(async (entry) => {
          const targetPath = path.join(directory, entry.name);
          const stats = await fs.stat(targetPath);
          return { targetPath, mtimeMs: stats.mtimeMs };
        })
    );

    return filesWithStats
      .sort((left, right) => right.mtimeMs - left.mtimeMs)
      .slice(0, SESSION_FILE_SCAN_LIMIT)
      .map((entry) => entry.targetPath);
  } catch {
    return [];
  }
}

function resolveSessionIdFromPath(targetPath: string): string | null {
  const basename = targetPath.includes("/")
    ? path.posix.basename(targetPath, ".jsonl")
    : path.basename(targetPath, ".jsonl");

  return basename || null;
}

function deriveUpdatedAtFromMessages(messages: StudioOpenClawChatMessage[]): number | null {
  const latestTimestamp = messages[messages.length - 1]?.timestamp;

  if (!latestTimestamp) {
    return null;
  }

  const parsed = Date.parse(latestTimestamp);
  return Number.isFinite(parsed) ? parsed : null;
}

async function resolveReadableSessionHistory(primarySessionId: string): Promise<{
  sessionId: string;
  messages: StudioOpenClawChatMessage[];
  updatedAt: number | null;
} | null> {
  return resolveReadableSessionHistoryWithOptions(primarySessionId, true);
}

async function resolveReadableSessionHistoryWithOptions(
  primarySessionId: string,
  allowFallback: boolean
): Promise<{
  sessionId: string;
  messages: StudioOpenClawChatMessage[];
  updatedAt: number | null;
} | null> {
  const primaryReadCommand = buildPrimarySessionCommand(primarySessionId);

  const primaryRaw =
    primaryReadCommand.mode === "fs"
      ? (await pathExists(primaryReadCommand.path))
        ? await readSessionHistory(primaryReadCommand)
        : null
      : await readSessionHistory(primaryReadCommand);

  if (primaryRaw) {
    const primaryMessages = parseSessionMessages(primaryRaw);

    if (primaryMessages.length > 0) {
      return {
        sessionId: primarySessionId,
        messages: primaryMessages,
        updatedAt: deriveUpdatedAtFromMessages(primaryMessages)
      };
    }
  }

  if (process.platform === "win32") {
    const primaryFallbackRaw = await readSessionHistory(buildPrimarySessionCommandFallback(primarySessionId));

    if (primaryFallbackRaw) {
      const primaryMessages = parseSessionMessages(primaryFallbackRaw);

      if (primaryMessages.length > 0) {
        return {
          sessionId: primarySessionId,
          messages: primaryMessages,
          updatedAt: deriveUpdatedAtFromMessages(primaryMessages)
        };
      }
    }
  }

  if (!allowFallback) {
    return null;
  }

  const recentPaths = await listRecentSessionPaths();

  for (const candidatePath of recentPaths) {
    const candidateSessionId = resolveSessionIdFromPath(candidatePath);

    if (!candidateSessionId || candidateSessionId === primarySessionId) {
      continue;
    }

    const raw = await readSessionHistory(buildReadSessionCommand(candidatePath));

    if (!raw) {
      continue;
    }

    const messages = parseSessionMessages(raw);

    if (messages.length === 0) {
      continue;
    }

    return {
      sessionId: candidateSessionId,
      messages,
      updatedAt: deriveUpdatedAtFromMessages(messages)
    };
  }

  return null;
}

function parseSessionMessages(raw: string): StudioOpenClawChatMessage[] {
  const messages = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => parseJsonLine(line))
    .filter((event): event is OpenClawSessionEvent => event !== null)
    .flatMap((event) => {
      if (event.type !== "message") {
        return [];
      }

      const role = event.message?.role as "user" | "assistant" | undefined;

      if (role !== "user" && role !== "assistant") {
        return [];
      }

      const text = extractMessageText(event);

      if (!text) {
        return [];
      }

      const normalizedText = normalizeMessage(role, text);

      if (!normalizedText) {
        return [];
      }

      return [
        {
          id: event.id ?? `${role}-${event.timestamp ?? Math.random().toString(36).slice(2)}`,
          role,
          text: normalizedText,
          timestamp: event.timestamp ?? new Date().toISOString()
        }
      ];
    });

  return messages.slice(-MAX_CHAT_MESSAGES);
}

export function buildCommand(prompt: string, sessionId?: string | null) {
  if (process.platform === "win32") {
    const encodedPrompt = Buffer.from(prompt, "utf8").toString("base64");

    return {
      command: "wsl.exe",
      args: [
        "-e",
        "bash",
        "-lc",
        'MESSAGE="$(printf %s "$1" | base64 -d)"; if [ -n "$2" ]; then openclaw agent --agent main --json --session-id "$2" --message "$MESSAGE"; else openclaw agent --agent main --json --message "$MESSAGE"; fi',
        "--",
        encodedPrompt,
        sessionId ?? ""
      ],
      env: {
        ...process.env
      },
      label: OPENCLAW_CHAT_COMMAND
    };
  }

  return {
    command: "openclaw",
    args: [
      "agent",
      "--agent",
      "main",
      "--json",
      ...(sessionId ? ["--session-id", sessionId] : []),
      "--message",
      prompt
    ],
    env: {
      ...process.env
    },
    label: OPENCLAW_CHAT_COMMAND
  };
}

export function createOpenClawChatSession(): StudioOpenClawChatSessionRef {
  const sessionId = crypto.randomUUID();

  return {
    sessionId,
    sessionKey: buildExplicitSessionKey(sessionId)
  };
}

export async function sendOpenClawChatTurn(prompt: string, sessionId?: string | null): Promise<StudioOpenClawChatTurnResult> {
  const normalizedPrompt = prompt.trim();

  if (!normalizedPrompt) {
    throw new Error("消息内容不能为空。");
  }

  const readiness = await resolveChatReadiness();

  if (!readiness.canSend) {
    throw new Error(readiness.disabledReason ?? "OpenClaw chat is not ready.");
  }

  const invocation = buildCommand(normalizedPrompt, sessionId);
  const stdout = { value: "" };
  const stderr = { value: "" };
  const startedAt = Date.now();

  const captured = await runCommandCapture(invocation, DEFAULT_TIMEOUT_MS);
  stdout.value = captured.stdout;
  stderr.value = captured.stderr;

  try {
    const parsed = parseJsonObject(stdout.value);
    const resultMeta = (parsed.result as { meta?: { durationMs?: unknown; agentMeta?: Record<string, unknown> } } | undefined)?.meta;
    const agentMeta = resultMeta?.agentMeta ?? {};

    return {
      prompt: normalizedPrompt,
      reply: extractReply(parsed),
      source: "runtime",
      sessionId: typeof agentMeta.sessionId === "string" ? agentMeta.sessionId : null,
      provider: typeof agentMeta.provider === "string" ? agentMeta.provider : null,
      model: typeof agentMeta.model === "string" ? agentMeta.model : null,
      durationMs:
        typeof resultMeta?.durationMs === "number"
          ? resultMeta.durationMs
          : Date.now() - startedAt,
      command: invocation.label
    };
  } catch (error) {
    throw new Error(
      [
        "OpenClaw chat returned unreadable JSON.",
        error instanceof Error ? error.message : String(error),
        stdout.value.trim() || invocation.label
      ].join("\n")
    );
  }
}

export async function loadOpenClawChatState(sessionId?: string | null): Promise<StudioOpenClawChatState> {
  const readiness = await resolveChatReadiness();
  const summaries = await loadSessionSummariesSafe();

  if (sessionId?.trim()) {
    const explicitSessionId = sessionId.trim();
    const explicitSessionKey = buildExplicitSessionKey(explicitSessionId);
    const explicitSession =
      summaries.find((entry) => entry.key === explicitSessionKey || entry.sessionId === explicitSessionId) ?? null;
    const readableSessionId = explicitSession?.sessionId ?? explicitSessionId;
    const readableSession = await resolveReadableSessionHistoryWithOptions(readableSessionId, false);

    return createChatState(readiness, {
      sessionKey: explicitSession?.key ?? explicitSessionKey,
      sessionId: explicitSessionId,
      model: explicitSession?.model ?? null,
      provider: explicitSession?.modelProvider ?? null,
      updatedAt: readableSession?.updatedAt ?? (typeof explicitSession?.updatedAt === "number" ? explicitSession.updatedAt : null),
      messages: readableSession?.messages ?? []
    });
  }

  const mainSession = summaries.find((entry) => entry.key === MAIN_SESSION_KEY) ?? null;

  if (!mainSession?.sessionId) {
    return createChatState(readiness);
  }

  const readableSession = await resolveReadableSessionHistory(mainSession.sessionId);

  return createChatState(readiness, {
    sessionKey: mainSession.key ?? MAIN_SESSION_KEY,
    sessionId: readableSession?.sessionId ?? mainSession.sessionId,
    model: mainSession.model ?? null,
    provider: mainSession.modelProvider ?? null,
    updatedAt: readableSession?.updatedAt ?? (typeof mainSession.updatedAt === "number" ? mainSession.updatedAt : null),
    messages: readableSession?.messages ?? []
  });
}
