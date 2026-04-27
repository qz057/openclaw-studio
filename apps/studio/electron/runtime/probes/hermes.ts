import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import type {
  StudioHermesConnectResult,
  StudioHermesDisconnectResult,
  StudioHermesEvent,
  StudioHermesHistoryEntry,
  StudioHermesMessage,
  StudioHermesMessageRole,
  StudioHermesSessionSummary,
  StudioHermesSnapshot,
  StudioHermesState,
  StudioTokenContextSummary
} from "@openclaw/shared";

const homeDirectory = os.homedir();

function resolveWslDistroName(): string {
  return process.env.OPENCLAW_STUDIO_WSL_DISTRO?.trim() || process.env.WSL_DISTRO_NAME?.trim() || "Ubuntu-24.04";
}

function resolveWslUserName(): string {
  return (
    process.env.OPENCLAW_STUDIO_WSL_USER?.trim() ||
    process.env.WSL_USER?.trim() ||
    process.env.USERNAME?.trim() ||
    os.userInfo().username
  );
}

function getWin32WslHermesRootCandidates(): string[] {
  const distro = resolveWslDistroName();
  const user = resolveWslUserName();
  return [`\\\\wsl$\\${distro}\\home\\${user}\\.hermes`, `\\\\wsl.localhost\\${distro}\\home\\${user}\\.hermes`];
}

function getDefaultWin32HermesRoot(): string {
  return path.win32.join("\\\\wsl$", resolveWslDistroName(), "home", resolveWslUserName(), ".hermes");
}

const hermesRoot: string =
  process.env.OPENCLAW_STUDIO_HERMES_ROOT?.trim() ||
  (process.platform === "win32" ? (getWin32WslHermesRootCandidates()[0] ?? getDefaultWin32HermesRoot()) : path.join(homeDirectory, ".hermes"));

function joinHermesPath(...segments: string[]): string {
  return hermesRoot.startsWith("\\\\") ? path.win32.join(hermesRoot, ...segments) : path.join(hermesRoot, ...segments);
}

const authPath = joinHermesPath("auth.json");
const gatewayStatePath = joinHermesPath("gateway_state.json");
const channelDirectoryPath = joinHermesPath("channel_directory.json");
const historyPath = joinHermesPath(".hermes_history");
const sessionsRoot = joinHermesPath("sessions");
const sessionsIndexPath = joinHermesPath("sessions", "sessions.json");
const maxSessionList = 20;
const maxMessageList = 200;
const maxHistoryList = 100;
const HERMES_CLI_TIMEOUT_MS = 300_000;
type HermesConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting" | "error";

interface HermesOrigin {
  platform?: string;
  chat_type?: string;
  chat_name?: string | null;
  chat_id?: string | null;
  user_name?: string | null;
  user_id?: string | null;
  thread_id?: string | null;
}

interface HermesSessionIndexEntry {
  session_key?: string;
  session_id?: string;
  created_at?: string;
  updated_at?: string;
  display_name?: string | null;
  platform?: string;
  chat_type?: string;
  origin?: HermesOrigin | null;
}

interface HermesSessionFile {
  session_id?: string;
  platform?: string;
  session_start?: string;
  last_updated?: string;
  message_count?: number;
  system_prompt?: string;
  tools?: unknown[];
  model?: string;
  messages?: Array<Record<string, unknown>>;
}

interface HermesGatewayPlatformState {
  state?: string;
  error_code?: string | null;
  error_message?: string | null;
  updated_at?: string | null;
}

interface HermesGatewayStateFile {
  pid?: number;
  kind?: string;
  gateway_state?: string;
  exit_reason?: string | null;
  active_agents?: number;
  platforms?: Record<string, HermesGatewayPlatformState>;
  updated_at?: string | null;
}

interface HermesApiDetailedHealth {
  status?: string;
  gateway_state?: string;
  platforms?: Record<string, HermesGatewayPlatformState>;
  active_agents?: number;
  exit_reason?: string | null;
  updated_at?: string | null;
  pid?: number;
}

interface HermesChannelDirectoryEntry {
  id?: string;
  name?: string;
  type?: string;
  thread_id?: string | null;
}

interface HermesChannelDirectoryFile {
  updated_at?: string | null;
  platforms?: Record<string, HermesChannelDirectoryEntry[]>;
}

type HermesSessionRecord = StudioHermesSessionSummary & {
  origin: HermesOrigin | null;
};

function parseIsoTimestamp(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPlatformLabel(platform: string | null | undefined): string {
  switch ((platform ?? "").toLowerCase()) {
    case "weixin":
      return "Weixin";
    case "telegram":
      return "Telegram";
    case "discord":
      return "Discord";
    case "cli":
      return "CLI";
    default:
      return platform ? platform.slice(0, 1).toUpperCase() + platform.slice(1) : "Hermes";
  }
}

function formatChatTypeLabel(chatType: string | null | undefined): string {
  switch ((chatType ?? "").toLowerCase()) {
    case "dm":
      return "DM";
    case "group":
      return "Group";
    case "channel":
      return "Channel";
    default:
      return chatType ? chatType.slice(0, 1).toUpperCase() + chatType.slice(1) : "Session";
  }
}

function pickSessionLabel(entry: HermesSessionIndexEntry): string {
  const origin = entry.origin ?? null;
  const explicitLabel = entry.display_name?.trim();

  if (explicitLabel) {
    return explicitLabel;
  }

  return (
    origin?.chat_name?.trim() ||
    origin?.user_name?.trim() ||
    origin?.chat_id?.trim() ||
    origin?.user_id?.trim() ||
    entry.session_key?.trim() ||
    "Hermes session"
  );
}

function createSessionTitle(entry: HermesSessionIndexEntry): string {
  const sessionLabel = pickSessionLabel(entry);
  const platform = formatPlatformLabel(entry.origin?.platform ?? entry.platform ?? null);
  const chatType = formatChatTypeLabel(entry.origin?.chat_type ?? entry.chat_type ?? null);
  return `${platform} · ${chatType} · ${sessionLabel}`;
}

function ensureHermesMessageRole(role: string | null | undefined): StudioHermesMessageRole {
  switch (role) {
    case "user":
    case "assistant":
    case "tool":
    case "system":
      return role;
    default:
      return "system";
  }
}

function normalizeHermesMessageContent(raw: unknown): string {
  if (typeof raw === "string") {
    return raw.trim();
  }

  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
      .join("\n")
      .trim();
  }

  if (raw && typeof raw === "object") {
    return JSON.stringify(raw, null, 2).trim();
  }

  return "";
}

function estimateTokenCount(text: string): number {
  const normalized = text.trim();

  if (!normalized) {
    return 0;
  }

  const cjkCount = (normalized.match(/[\u3400-\u9fff]/gu) ?? []).length;
  const latinSegments = normalized
    .replace(/[\u3400-\u9fff]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  return Math.max(1, Math.ceil(cjkCount * 1.15 + latinSegments.length * 1.35));
}

function createEstimatedTokenContextSummary(
  inputText: string,
  outputText: string,
  messageCount: number,
  updatedAt: string | null | undefined,
  contextWindowTokens: number | null,
  availableFunctionCount: number | null
): StudioTokenContextSummary {
  const inputTokens = estimateTokenCount(inputText);
  const outputTokens = estimateTokenCount(outputText);
  const totalTokens = inputTokens + outputTokens;
  const parsedUpdatedAt = parseIsoTimestamp(updatedAt);
  const contextPercent =
    contextWindowTokens && contextWindowTokens > 0
      ? Math.max(0, Math.min(100, Math.round((totalTokens / contextWindowTokens) * 100)))
      : null;

  return {
    source: "local-estimate",
    statusLabel: "本地估算",
    detail: `基于 Hermes session 文件的 system prompt 与 ${messageCount} 条消息估算；上游未写入 usage 字段。`,
    inputTokens,
    outputTokens,
    totalTokens,
    cacheReadTokens: null,
    cacheWriteTokens: null,
    cacheHitPercent: null,
    contextUsedTokens: totalTokens,
    contextWindowTokens,
    contextPercent,
    costUsd: null,
    compactions: null,
    toolCallCount: 0,
    availableFunctionCount,
    fileCount: null,
    updatedAt: parsedUpdatedAt ?? Date.now()
  };
}

function createHermesTokenContextSummary(sessionFile: HermesSessionFile): StudioTokenContextSummary {
  const messages = Array.isArray(sessionFile.messages) ? sessionFile.messages : [];
  const inputText = [
    typeof sessionFile.system_prompt === "string" ? sessionFile.system_prompt : "",
    ...messages
      .filter((message) => message.role !== "assistant")
      .map((message) => normalizeHermesMessageContent(message.content))
  ].join("\n\n");
  const outputText = messages
    .filter((message) => message.role === "assistant")
    .map((message) => normalizeHermesMessageContent(message.content))
    .join("\n\n");

  return createEstimatedTokenContextSummary(
    inputText,
    outputText,
    typeof sessionFile.message_count === "number" ? sessionFile.message_count : messages.length,
    sessionFile.last_updated ?? sessionFile.session_start ?? null,
    128_000,
    Array.isArray(sessionFile.tools) ? sessionFile.tools.length : 0
  );
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
  timeoutMs = HERMES_CLI_TIMEOUT_MS,
  maxCaptureChars = 128_000
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

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeApiHealthToGatewayState(health: HermesApiDetailedHealth): HermesGatewayStateFile | null {
  if (health.status !== "ok" && health.gateway_state !== "running") {
    return null;
  }

  return {
    pid: health.pid,
    kind: "hermes-api-server",
    gateway_state: health.gateway_state ?? "running",
    active_agents: health.active_agents ?? 0,
    exit_reason: health.exit_reason ?? null,
    platforms: health.platforms ?? {
      api_server: {
        state: "connected",
        error_code: null,
        error_message: null,
        updated_at: health.updated_at ?? null
      }
    },
    updated_at: health.updated_at ?? new Date().toISOString()
  };
}

async function readHermesApiHealthState(): Promise<HermesGatewayStateFile | null> {
  if (process.platform !== "win32") {
    return null;
  }

  const script = String.raw`endpoint="$(awk '
BEGIN { host="127.0.0.1"; port="8642"; section=0 }
/^api_server:[[:space:]]*$/ { section=1; next }
section && /^[^[:space:]]/ { section=0 }
section && $1 == "host:" { host=$2 }
section && $1 == "port:" { port=$2 }
END { print host ":" port }
' "$HOME/.hermes/config.yaml" 2>/dev/null || printf "127.0.0.1:8642")"
for attempt in 1 2 3; do
  body="$(curl -sS --max-time 5 "http://\${endpoint}/health/detailed" 2>/dev/null || true)"
  if [ -n "$body" ]; then
    printf "%s" "$body"
    exit 0
  fi
  sleep 0.75
done
exit 1`;

  try {
    const captured = await runCommandCapture(
      {
        command: "wsl.exe",
        args: ["-e", "bash", "-lc", script],
        env: {
          ...process.env
        },
        label: "Hermes API server health probe"
      },
      12_000,
      16_000
    );
    const parsed = JSON.parse(captured.stdout) as HermesApiDetailedHealth;
    return normalizeApiHealthToGatewayState(parsed);
  } catch {
    return null;
  }
}

async function resolveSessionFilePath(sessionId: string): Promise<string | null> {
  const candidateNames = [
    `session_${sessionId}.json`,
    `session_${sessionId}.jsonl`,
    `${sessionId}.json`,
    `${sessionId}.jsonl`
  ];

  for (const candidateName of candidateNames) {
    const candidatePath = path.join(sessionsRoot, candidateName);

    if (await pathExists(candidatePath)) {
      return candidatePath;
    }
  }

  return null;
}

async function readSessionFileMeta(sessionId: string): Promise<{
  filename: string;
  messageCount: number;
  createdAt: string | null;
  updatedAt: string | null;
  platform: string | null;
  tokenContext: StudioTokenContextSummary | null;
} | null> {
  const sessionFilePath = await resolveSessionFilePath(sessionId);

  if (!sessionFilePath) {
    return null;
  }

  if (sessionFilePath.endsWith(".json")) {
    const sessionFile = await readJsonFile<HermesSessionFile>(sessionFilePath);

    if (!sessionFile) {
      return null;
    }

    return {
      filename: path.basename(sessionFilePath),
      messageCount:
        typeof sessionFile.message_count === "number"
          ? sessionFile.message_count
          : Array.isArray(sessionFile.messages)
            ? sessionFile.messages.length
            : 0,
      createdAt: sessionFile.session_start ?? null,
      updatedAt: sessionFile.last_updated ?? null,
      platform: sessionFile.platform ?? null,
      tokenContext: createHermesTokenContextSummary(sessionFile)
    };
  }

  try {
    const lines = (await fs.readFile(sessionFilePath, "utf8"))
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    return {
      filename: path.basename(sessionFilePath),
      messageCount: lines.length,
      createdAt: null,
      updatedAt: null,
      platform: null,
      tokenContext: createEstimatedTokenContextSummary(
        lines.join("\n"),
        "",
        lines.length,
        null,
        null,
        0
      )
    };
  } catch {
    return null;
  }
}

async function readHermesSessions(): Promise<HermesSessionRecord[]> {
  const indexFile = await readJsonFile<Record<string, HermesSessionIndexEntry>>(sessionsIndexPath);

  if (!indexFile) {
    return [];
  }

  const entries = Object.values(indexFile)
    .filter((entry): entry is HermesSessionIndexEntry => Boolean(entry?.session_id))
    .sort((left, right) => {
      const rightUpdatedAt = parseIsoTimestamp(right.updated_at) ?? 0;
      const leftUpdatedAt = parseIsoTimestamp(left.updated_at) ?? 0;
      return rightUpdatedAt - leftUpdatedAt;
    })
    .slice(0, maxSessionList);

  const sessions = await Promise.all(
    entries.map(async (entry): Promise<HermesSessionRecord | null> => {
      const sessionId = entry.session_id;

      if (!sessionId) {
        return null;
      }

      const meta = await readSessionFileMeta(sessionId);
      const sessionLabel = pickSessionLabel(entry);

      return {
        id: sessionId,
        sessionKey: entry.session_key ?? null,
        filename: meta?.filename ?? `session_${sessionId}.json`,
        label: createSessionTitle(entry),
        sessionLabel,
        platform: entry.origin?.platform ?? entry.platform ?? meta?.platform ?? null,
        chatType: entry.origin?.chat_type ?? entry.chat_type ?? null,
        messageCount: meta?.messageCount ?? 0,
        createdAt: entry.created_at ?? meta?.createdAt ?? null,
        updatedAt: entry.updated_at ?? meta?.updatedAt ?? null,
        tokenContext: meta?.tokenContext ?? null,
        origin: entry.origin ?? null
      } satisfies HermesSessionRecord;
    })
  );

  return sessions.filter((session): session is HermesSessionRecord => session !== null);
}

async function readHermesHistory(): Promise<StudioHermesHistoryEntry[]> {
  if (!(await pathExists(historyPath))) {
    return [];
  }

  try {
    const lines = (await fs.readFile(historyPath, "utf8"))
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const entries: StudioHermesHistoryEntry[] = [];
    let currentTimestamp: string | null = null;

    for (const line of lines) {
      if (line.startsWith("# ")) {
        currentTimestamp = line.slice(2).trim() || null;
        continue;
      }

      if (!line.startsWith("+")) {
        continue;
      }

      const text = line.slice(1).trim();

      if (!text) {
        continue;
      }

      entries.push({
        id: `history-${entries.length + 1}`,
        text,
        timestamp: currentTimestamp
      });
    }

    return entries.slice(-maxHistoryList).reverse();
  } catch {
    return [];
  }
}

function parseJsonSessionMessages(sessionFile: HermesSessionFile): StudioHermesMessage[] {
  const messages = Array.isArray(sessionFile.messages) ? sessionFile.messages : [];

  return messages
    .map((message, index) => {
      const content = normalizeHermesMessageContent(message.content);

      if (!content) {
        return null;
      }

      const timestamp =
        typeof message.timestamp === "string"
          ? message.timestamp
          : typeof message.created_at === "string"
            ? message.created_at
            : null;

      return {
        id:
          typeof message.id === "string"
            ? message.id
            : typeof message.tool_call_id === "string"
              ? message.tool_call_id
              : `hermes-message-${index + 1}`,
        role: ensureHermesMessageRole(typeof message.role === "string" ? message.role : null),
        content,
        timestamp
      } satisfies StudioHermesMessage;
    })
    .filter((message): message is StudioHermesMessage => message !== null)
    .slice(-maxMessageList);
}

function parseJsonlSessionMessages(raw: string): StudioHermesMessage[] {
  const messages = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as Record<string, unknown>;
      } catch {
        return null;
      }
    })
    .filter((message): message is Record<string, unknown> => message !== null)
    .map((message, index) => {
      const content = normalizeHermesMessageContent(message.content ?? message.text ?? message.message);

      if (!content) {
        return null;
      }

      return {
        id: typeof message.id === "string" ? message.id : `hermes-jsonl-message-${index + 1}`,
        role: ensureHermesMessageRole(typeof message.role === "string" ? message.role : null),
        content,
        timestamp: typeof message.timestamp === "string" ? message.timestamp : null
      } satisfies StudioHermesMessage;
    })
    .filter((message): message is StudioHermesMessage => message !== null);

  return messages.slice(-maxMessageList);
}

export async function loadHermesSessionMessages(sessionId: string): Promise<StudioHermesMessage[]> {
  if (!sessionId.trim()) {
    return [];
  }

  const sessionFilePath = await resolveSessionFilePath(sessionId);

  if (!sessionFilePath) {
    return [];
  }

  if (sessionFilePath.endsWith(".json")) {
    const sessionFile = await readJsonFile<HermesSessionFile>(sessionFilePath);
    return sessionFile ? parseJsonSessionMessages(sessionFile) : [];
  }

  try {
    return parseJsonlSessionMessages(await fs.readFile(sessionFilePath, "utf8"));
  } catch {
    return [];
  }
}

function createHermesEvents(
  gatewayState: HermesGatewayStateFile | null,
  sessions: HermesSessionRecord[],
  history: StudioHermesHistoryEntry[]
): StudioHermesEvent[] {
  const events: StudioHermesEvent[] = [];

  if (gatewayState) {
    events.push({
      id: "hermes-gateway",
      type: "gateway",
      title: gatewayState.gateway_state === "running" ? "Gateway running" : "Gateway not running",
      detail:
        gatewayState.gateway_state === "running"
          ? `pid=${gatewayState.pid ?? "unknown"} · active agents=${gatewayState.active_agents ?? 0}`
          : "Gateway state file exists, but it is not marked running.",
      timestamp: gatewayState.updated_at ?? new Date().toISOString(),
      level: gatewayState.gateway_state === "running" ? "info" : "warning"
    });
  }

  const latestSession = sessions[0] ?? null;

  if (latestSession) {
    events.push({
      id: "hermes-session-latest",
      type: "session",
      title: "Latest session",
      detail: `${latestSession.label} · ${latestSession.messageCount} messages`,
      timestamp: latestSession.updatedAt ?? latestSession.createdAt ?? new Date().toISOString(),
      level: "info"
    });
  }

  const latestHistory = history[0] ?? null;

  if (latestHistory) {
    events.push({
      id: "hermes-history-latest",
      type: "history",
      title: "Latest command",
      detail: latestHistory.text,
      timestamp: latestHistory.timestamp ?? new Date().toISOString(),
      level: "info"
    });
  }

  return events.slice(0, 6);
}

function createHermesState(
  rootExists: boolean,
  authPresent: boolean,
  gatewayState: HermesGatewayStateFile | null,
  channelDirectory: HermesChannelDirectoryFile | null,
  sessions: HermesSessionRecord[],
  history: StudioHermesHistoryEntry[],
  connectionState: HermesConnectionState
): StudioHermesState {
  if (!rootExists) {
    return {
      source: "mock",
      availability: "blocked",
      canConnect: false,
      canDisconnect: false,
      readinessLabel: "未检测到 Hermes",
      disabledReason: "未发现 ~/.hermes 目录，Studio 无法读取 Hermes 运行态。",
      endpoint: null,
      sessionLabel: "未发现会话",
      transportLabel: "未接入",
      authLabel: "未检测到认证",
      lastEventAt: null,
      updatedAt: null,
      events: []
    };
  }

  const latestSession = sessions[0] ?? null;
  const platformState =
    gatewayState?.platforms &&
    Object.values(gatewayState.platforms).find((entry) => Boolean(entry?.state));
  const apiServerState = gatewayState?.platforms?.api_server?.state ?? null;
  const channelEntry =
    channelDirectory?.platforms &&
    Object.values(channelDirectory.platforms).flat().find((entry) => Boolean(entry?.id));
  const isManagerConnected = connectionState === "connected";
  const isManagerConnecting =
    connectionState === "connecting" || connectionState === "reconnecting";
  const hasFilesystemRuntime = authPresent || sessions.length > 0 || history.length > 0 || Boolean(gatewayState);
  const availability =
    isManagerConnected
      ? "connected"
      : isManagerConnecting
        ? "connecting"
      : gatewayState?.gateway_state === "running" || hasFilesystemRuntime
        ? "disconnected"
        : "blocked";
  const updatedAtCandidates = [
    parseIsoTimestamp(gatewayState?.updated_at),
    parseIsoTimestamp(platformState?.updated_at),
    parseIsoTimestamp(latestSession?.updatedAt),
    parseIsoTimestamp(latestSession?.createdAt),
    parseIsoTimestamp(history[0]?.timestamp)
  ].filter((value): value is number => value !== null);
  const updatedAt = updatedAtCandidates.length > 0 ? Math.max(...updatedAtCandidates) : null;

  return {
    source: "runtime",
    availability,
    canConnect: availability === "disconnected",
    canDisconnect: availability === "connected",
    readinessLabel:
      availability === "connected"
        ? "已连接"
        : availability === "connecting"
          ? "连接中"
        : availability === "disconnected"
          ? "待连接会话层"
          : "运行态受限",
    disabledReason: availability === "blocked" ? "未检测到 Hermes 运行时可用入口。请先确认 WSL ~/.hermes 与网关可用。" : null,
    endpoint: apiServerState ? `WSL Hermes API server · ${apiServerState}` : gatewayState ? "WSL Hermes gateway" : null,
    sessionLabel: latestSession?.sessionLabel ?? channelEntry?.name ?? channelEntry?.id ?? "Hermes session",
    transportLabel: apiServerState ? "WSL API server / filesystem" : gatewayState ? "WSL gateway / filesystem" : "WSL filesystem",
    authLabel: authPresent ? "已检测到认证" : "未检测到认证",
    lastEventAt: updatedAt,
    updatedAt,
    events: createHermesEvents(gatewayState, sessions, history)
  };
}

export async function loadHermesSnapshot(): Promise<StudioHermesSnapshot> {
  const { getHermesGatewayManager } = await import("../hermes-gateway");
  const manager = getHermesGatewayManager();

  const [rootExists, authPresent, gatewayStateFile, apiHealthState, channelDirectory, sessions, history] = await Promise.all([
    pathExists(hermesRoot),
    pathExists(authPath),
    readJsonFile<HermesGatewayStateFile>(gatewayStatePath),
    readHermesApiHealthState(),
    readJsonFile<HermesChannelDirectoryFile>(channelDirectoryPath),
    readHermesSessions(),
    readHermesHistory()
  ]);
  const gatewayState = apiHealthState ?? gatewayStateFile;
  const connectionState = manager.getConnectionState();

  return {
    state: createHermesState(rootExists, authPresent, gatewayState, channelDirectory, sessions, history, connectionState),
    sessions,
    history
  };
}

export async function loadHermesState(): Promise<StudioHermesState> {
  return (await loadHermesSnapshot()).state;
}

export async function connectHermesRuntime(): Promise<StudioHermesConnectResult> {
  const { getHermesGatewayManager } = await import("../hermes-gateway");
  const manager = getHermesGatewayManager();

  try {
    const connected = await manager.connect();
    const state = await loadHermesState();

    return {
      started: connected,
      state
    };
  } catch (error) {
    console.error("连接 Hermes 失败:", error);
    return {
      started: false,
      state: await loadHermesState()
    };
  }
}

export async function disconnectHermesRuntime(): Promise<StudioHermesDisconnectResult> {
  const { getHermesGatewayManager } = await import("../hermes-gateway");
  const manager = getHermesGatewayManager();

  try {
    const disconnected = await manager.disconnect();
    const state = await loadHermesState();

    return {
      stopped: disconnected,
      state
    };
  } catch (error) {
    console.error("断开 Hermes 失败:", error);
    return {
      stopped: false,
      state: await loadHermesState()
    };
  }
}

export async function sendHermesMessage(
  sessionId: string,
  content: string
): Promise<import("@openclaw/shared").StudioHermesSendMessageResult> {
  if (process.platform === "win32") {
    if (!sessionId.trim()) {
      return {
        sent: false,
        messageId: null,
        error: "会话 ID 不能为空"
      };
    }

    if (!content.trim()) {
      return {
        sent: false,
        messageId: null,
        error: "消息内容不能为空"
      };
    }

    try {
      const encodedContent = Buffer.from(content.trim(), "utf8").toString("base64");
      await runCommandCapture(
        {
          command: "wsl.exe",
          args: [
            "-e",
            "bash",
            "-lc",
            'MESSAGE="$(printf %s "$1" | base64 -d)"; hermes chat -Q --resume "$2" -q "$MESSAGE"',
            "--",
            encodedContent,
            sessionId.trim()
          ],
          env: {
            ...process.env
          },
          label: "hermes chat --resume <session> -q <message>"
        },
        HERMES_CLI_TIMEOUT_MS,
        256_000
      );

      return {
        sent: true,
        messageId: `wsl-cli-${Date.now()}`,
        error: null
      };
    } catch (error) {
      return {
        sent: false,
        messageId: null,
        error: error instanceof Error ? error.message : "发送消息失败"
      };
    }
  }

  const { getHermesGatewayManager } = await import("../hermes-gateway");
  const manager = getHermesGatewayManager();

  if (!manager.isConnected()) {
    return {
      sent: false,
      messageId: null,
      error: "Hermes 网关未连接"
    };
  }

  if (!sessionId.trim()) {
    return {
      sent: false,
      messageId: null,
      error: "会话 ID 不能为空"
    };
  }

  if (!content.trim()) {
    return {
      sent: false,
      messageId: null,
      error: "消息内容不能为空"
    };
  }

  try {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const message = {
      id: messageId,
      sessionId,
      role: "user" as const,
      content: content.trim(),
      timestamp: new Date().toISOString()
    };

    // 通过 WebSocket 发送消息
    await manager.sendMessage(message);

    // 将消息写入本地会话文件
    const sessionFilePath = await resolveSessionFilePath(sessionId);
    if (sessionFilePath && sessionFilePath.endsWith(".jsonl")) {
      try {
        await fs.appendFile(
          sessionFilePath,
          JSON.stringify(message) + "\n",
          "utf8"
        );
      } catch (error) {
        console.warn("写入本地会话文件失败:", error);
      }
    }

    return {
      sent: true,
      messageId,
      error: null
    };
  } catch (error) {
    console.error("发送 Hermes 消息失败:", error);
    return {
      sent: false,
      messageId: null,
      error: error instanceof Error ? error.message : "发送消息失败"
    };
  }
}

export function subscribeToHermesEvents(listener: (event: StudioHermesEvent) => void): () => void {
  const { getHermesGatewayManager } = require("../hermes-gateway");
  const manager = getHermesGatewayManager();
  manager.on("event", listener);
  return () => {
    manager.off("event", listener);
  };
}

/**
 * 从 WSL 加载 Hermes 会话列表
 */
export async function loadHermesSessionsFromWSL(): Promise<import("@openclaw/shared").StudioHermesLoadSessionsResult> {
  try {
    const { wslHermesReader } = await import("../wsl-hermes-reader");
    const sessions = await wslHermesReader.listSessions();

    const sessionSummaries: StudioHermesSessionSummary[] = sessions.map(session => ({
      id: session.id,
      sessionKey: session.id,
      filename: `${session.id}.json`,
      label: session.name,
      sessionLabel: session.name,
      platform: session.source ?? "cli",
      chatType: "direct",
      messageCount: session.messageCount ?? 0,
      createdAt: session.lastModified.toISOString(),
      updatedAt: session.lastModified.toISOString(),
      tokenContext: session.tokenContext ?? null
    }));

    return {
      success: true,
      sessions: sessionSummaries,
      error: null
    };
  } catch (error) {
    console.error("从 WSL 加载 Hermes 会话失败:", error);
    return {
      success: false,
      sessions: [],
      error: error instanceof Error ? error.message : "加载会话失败"
    };
  }
}

/**
 * 从 WSL 加载指定会话的消息
 */
export async function loadHermesSessionFromWSL(sessionId: string): Promise<import("@openclaw/shared").StudioHermesLoadSessionResult> {
  try {
    const { wslHermesReader } = await import("../wsl-hermes-reader");
    const session = await wslHermesReader.readSession(sessionId);

    if (!session) {
      return {
        success: false,
        messages: [],
        error: "会话不存在"
      };
    }

    const messages: StudioHermesMessage[] = session.messages.map((msg, index) => ({
      id: `${sessionId}-msg-${index}`,
      role: msg.role as StudioHermesMessageRole,
      content: msg.content,
      timestamp: msg.timestamp || null
    }));

    return {
      success: true,
      messages,
      error: null
    };
  } catch (error) {
    console.error(`从 WSL 加载会话 ${sessionId} 失败:`, error);
    return {
      success: false,
      messages: [],
      error: error instanceof Error ? error.message : "加载会话失败"
    };
  }
}

export async function createHermesSessionFromWSL(modelId?: string | null): Promise<StudioHermesSessionSummary> {
  const { wslHermesReader } = await import("../wsl-hermes-reader");
  const created = await wslHermesReader.createSession(modelId ?? null);

  return {
    id: created.id,
    sessionKey: created.id,
    filename: `${created.id}.json`,
    label: created.name,
    sessionLabel: created.name,
    platform: "cli",
    chatType: "direct",
    messageCount: 0,
    createdAt: created.lastModified.toISOString(),
    updatedAt: created.lastModified.toISOString(),
    tokenContext: null
  };
}
