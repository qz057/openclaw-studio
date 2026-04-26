import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type {
  StudioClaudeHistoryEntry,
  StudioClaudeMessage,
  StudioClaudeMessageKind,
  StudioClaudeMessageRole,
  StudioClaudeSessionSummary,
  StudioClaudeSettings,
  StudioClaudeSnapshot
} from "@openclaw/shared";

const CLAUDE_ROOT = path.join(os.homedir(), ".claude");
const CLAUDE_SETTINGS_PATH = path.join(CLAUDE_ROOT, "settings.json");
const CLAUDE_HISTORY_PATH = path.join(CLAUDE_ROOT, "history.jsonl");
const CLAUDE_PROJECTS_PATH = path.join(CLAUDE_ROOT, "projects");
const CLAUDE_RUNTIME_SESSIONS_PATH = path.join(CLAUDE_ROOT, "sessions");
const MAX_CLAUDE_SESSIONS = 60;
const MAX_CLAUDE_HISTORY = 120;
const MAX_CLAUDE_MESSAGES = 240;

interface ClaudeSettingsFile {
  model?: string;
  modelType?: string;
  availableModels?: string[];
  permissions?: {
    defaultMode?: string;
  };
}

interface ClaudeHistoryLine {
  display?: string;
  timestamp?: number;
  project?: string;
  sessionId?: string;
}

interface ClaudeRuntimeSessionMeta {
  pid?: number;
  sessionId?: string;
  cwd?: string;
}

interface ClaudeSessionIndexRecord {
  sessionId: string;
  projectKey: string;
  filePath: string;
  updatedAt: number;
  preview: string | null;
  messageCount: number;
  projectPath: string | null;
}

function toClaudeSettings(settings: ClaudeSettingsFile | null): StudioClaudeSettings {
  return {
    rootPath: CLAUDE_ROOT,
    settingsPath: CLAUDE_SETTINGS_PATH,
    historyPath: CLAUDE_HISTORY_PATH,
    model: settings?.model ?? null,
    modelType: settings?.modelType ?? null,
    availableModels: Array.isArray(settings?.availableModels) ? settings!.availableModels.filter((entry): entry is string => typeof entry === "string") : [],
    permissionMode: settings?.permissions?.defaultMode ?? null
  };
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
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

async function readJsonLines(filePath: string): Promise<Array<Record<string, unknown>>> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return raw
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
      .filter((entry): entry is Record<string, unknown> => entry !== null);
  } catch {
    return [];
  }
}

function normalizeText(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (value && typeof value === "object") {
    try {
      const serialized = JSON.stringify(value, null, 2).trim();
      return serialized.length > 0 ? serialized : null;
    } catch {
      return null;
    }
  }

  return null;
}

function buildClaudeMessage(
  id: string,
  role: StudioClaudeMessageRole,
  kind: StudioClaudeMessageKind,
  text: string | null,
  timestamp: string | null,
  model: string | null
): StudioClaudeMessage | null {
  if (!text) {
    return null;
  }

  return {
    id,
    role,
    kind,
    text,
    timestamp,
    model
  };
}

function extractUserMessageText(content: unknown): string | null {
  if (typeof content === "string") {
    return normalizeText(content);
  }

  if (!Array.isArray(content)) {
    return normalizeText(content);
  }

  const parts = content
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const typedItem = item as { type?: string; content?: unknown };

      if (typedItem.type === "tool_result") {
        return normalizeText(typedItem.content);
      }

      return normalizeText(item);
    })
    .filter((entry): entry is string => Boolean(entry));

  return parts.length > 0 ? parts.join("\n\n") : null;
}

function parseClaudeSessionMessages(lines: Array<Record<string, unknown>>): StudioClaudeMessage[] {
  const messages: StudioClaudeMessage[] = [];

  for (const entry of lines) {
    const type = typeof entry.type === "string" ? entry.type : null;
    const uuid = typeof entry.uuid === "string" ? entry.uuid : `${messages.length + 1}`;
    const timestamp = typeof entry.timestamp === "string" ? entry.timestamp : null;
    const model =
      typeof (entry.message as { model?: unknown } | undefined)?.model === "string"
        ? String((entry.message as { model?: unknown }).model)
        : null;

    if (type === "file-history-snapshot") {
      continue;
    }

    if (type === "system") {
      const systemText = normalizeText(entry.content);
      const systemMessage = buildClaudeMessage(uuid, "system", "system", systemText, timestamp, model);

      if (systemMessage) {
        messages.push(systemMessage);
      }

      continue;
    }

    if (type === "user") {
      const rawContent = (entry.message as { content?: unknown } | undefined)?.content;

      if (typeof rawContent === "string") {
        const userMessage = buildClaudeMessage(uuid, "user", "text", rawContent, timestamp, model);

        if (userMessage) {
          messages.push(userMessage);
        }

        continue;
      }

      if (Array.isArray(rawContent)) {
        for (let index = 0; index < rawContent.length; index += 1) {
          const item = rawContent[index];

          if (!item || typeof item !== "object") {
            continue;
          }

          const typedItem = item as { type?: string; content?: unknown };

          if (typedItem.type === "tool_result") {
            const toolMessage = buildClaudeMessage(
              `${uuid}-tool-${index + 1}`,
              "tool",
              "tool_result",
              normalizeText(typedItem.content),
              timestamp,
              model
            );

            if (toolMessage) {
              messages.push(toolMessage);
            }
          }
        }
      }

      continue;
    }

    if (type === "assistant") {
      const rawContent = (entry.message as { content?: unknown } | undefined)?.content;

      if (!Array.isArray(rawContent)) {
        const assistantText = normalizeText(rawContent);
        const assistantMessage = buildClaudeMessage(uuid, "assistant", "text", assistantText, timestamp, model);

        if (assistantMessage) {
          messages.push(assistantMessage);
        }

        continue;
      }

      for (let index = 0; index < rawContent.length; index += 1) {
        const item = rawContent[index];

        if (!item || typeof item !== "object") {
          continue;
        }

        const typedItem = item as {
          type?: string;
          text?: unknown;
          thinking?: unknown;
          name?: unknown;
          input?: unknown;
        };

        if (typedItem.type === "text") {
          const assistantMessage = buildClaudeMessage(
            `${uuid}-text-${index + 1}`,
            "assistant",
            "text",
            normalizeText(typedItem.text),
            timestamp,
            model
          );

          if (assistantMessage) {
            messages.push(assistantMessage);
          }

          continue;
        }

        if (typedItem.type === "thinking") {
          const thinkingMessage = buildClaudeMessage(
            `${uuid}-thinking-${index + 1}`,
            "assistant",
            "text",
            normalizeText(typedItem.thinking),
            timestamp,
            model
          );

          if (thinkingMessage) {
            messages.push(thinkingMessage);
          }

          continue;
        }

        if (typedItem.type === "tool_use") {
          const toolName = typeof typedItem.name === "string" ? typedItem.name : "tool";
          const toolInput = normalizeText(typedItem.input);
          const toolMessage = buildClaudeMessage(
            `${uuid}-tool-${index + 1}`,
            "assistant",
            "tool_use",
            `${toolName}${toolInput ? `\n${toolInput}` : ""}`,
            timestamp,
            model
          );

          if (toolMessage) {
            messages.push(toolMessage);
          }
        }
      }
    }
  }

  return messages.slice(-MAX_CLAUDE_MESSAGES);
}

async function loadClaudeHistory(): Promise<StudioClaudeHistoryEntry[]> {
  const lines = await readJsonLines(CLAUDE_HISTORY_PATH);

  return lines
    .map((entry, index) => {
      const line = entry as ClaudeHistoryLine;
      const display = typeof line.display === "string" ? line.display.trim() : "";
      const sessionId = typeof line.sessionId === "string" ? line.sessionId.trim() : "";
      const timestamp = typeof line.timestamp === "number" ? line.timestamp : 0;

      if (!display || !sessionId || !timestamp) {
        return null;
      }

      return {
        id: `claude-history-${index + 1}`,
        display,
        timestamp,
        projectPath: typeof line.project === "string" ? line.project : null,
        sessionId
      } satisfies StudioClaudeHistoryEntry;
    })
    .filter((entry): entry is StudioClaudeHistoryEntry => entry !== null)
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, MAX_CLAUDE_HISTORY);
}

async function loadActiveClaudeSessions(): Promise<Map<string, ClaudeRuntimeSessionMeta>> {
  const activeSessions = new Map<string, ClaudeRuntimeSessionMeta>();

  if (!(await pathExists(CLAUDE_RUNTIME_SESSIONS_PATH))) {
    return activeSessions;
  }

  const entries = await fs.readdir(CLAUDE_RUNTIME_SESSIONS_PATH, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }

    const sessionMeta = await readJsonFile<ClaudeRuntimeSessionMeta>(path.join(CLAUDE_RUNTIME_SESSIONS_PATH, entry.name));

    if (sessionMeta?.sessionId) {
      activeSessions.set(sessionMeta.sessionId, sessionMeta);
    }
  }

  return activeSessions;
}

async function collectClaudeSessionRecords(history: StudioClaudeHistoryEntry[]): Promise<ClaudeSessionIndexRecord[]> {
  const historyBySessionId = new Map<string, StudioClaudeHistoryEntry[]>();

  for (const entry of history) {
    const bucket = historyBySessionId.get(entry.sessionId);

    if (bucket) {
      bucket.push(entry);
    } else {
      historyBySessionId.set(entry.sessionId, [entry]);
    }
  }

  if (!(await pathExists(CLAUDE_PROJECTS_PATH))) {
    return [];
  }

  const projectEntries = await fs.readdir(CLAUDE_PROJECTS_PATH, { withFileTypes: true });
  const sessionFiles: Array<{ projectKey: string; filePath: string; updatedAt: number }> = [];

  for (const projectEntry of projectEntries) {
    if (!projectEntry.isDirectory()) {
      continue;
    }

    const projectPath = path.join(CLAUDE_PROJECTS_PATH, projectEntry.name);
    const files = await fs.readdir(projectPath, { withFileTypes: true });

    for (const fileEntry of files) {
      if (!fileEntry.isFile() || !fileEntry.name.endsWith(".jsonl")) {
        continue;
      }

      const fullPath = path.join(projectPath, fileEntry.name);
      const stats = await fs.stat(fullPath);
      sessionFiles.push({
        projectKey: projectEntry.name,
        filePath: fullPath,
        updatedAt: stats.mtimeMs
      });
    }
  }

  const recentFiles = sessionFiles.sort((left, right) => right.updatedAt - left.updatedAt).slice(0, MAX_CLAUDE_SESSIONS);
  const sessionRecords: ClaudeSessionIndexRecord[] = [];

  for (const file of recentFiles) {
    const sessionId = path.basename(file.filePath, ".jsonl");
    const lines = await readJsonLines(file.filePath);
    const messages = parseClaudeSessionMessages(lines);
    const historyEntries = historyBySessionId.get(sessionId) ?? [];
    const latestHistoryEntry = historyEntries.sort((left, right) => right.timestamp - left.timestamp)[0] ?? null;
    const firstUserMessage = messages.find((message) => message.role === "user")?.text ?? null;
    const projectPath =
      latestHistoryEntry?.projectPath ??
      lines
        .map((entry) => (typeof entry.cwd === "string" ? entry.cwd : null))
        .find((cwd): cwd is string => Boolean(cwd)) ??
      null;

    sessionRecords.push({
      sessionId,
      projectKey: file.projectKey,
      filePath: file.filePath,
      updatedAt: file.updatedAt,
      preview: latestHistoryEntry?.display ?? firstUserMessage,
      messageCount: messages.length,
      projectPath
    });
  }

  return sessionRecords;
}

export async function loadClaudeSnapshot(): Promise<StudioClaudeSnapshot> {
  const [settings, history, activeSessions] = await Promise.all([
    readJsonFile<ClaudeSettingsFile>(CLAUDE_SETTINGS_PATH),
    loadClaudeHistory(),
    loadActiveClaudeSessions()
  ]);
  const sessionRecords = await collectClaudeSessionRecords(history);

  return {
    settings: toClaudeSettings(settings),
    sessions: sessionRecords.map((record) => ({
      id: record.sessionId,
      projectKey: record.projectKey,
      projectPath: record.projectPath,
      filePath: record.filePath,
      messageCount: record.messageCount,
      updatedAt: record.updatedAt,
      preview: record.preview,
      active: activeSessions.has(record.sessionId),
      activePid: activeSessions.get(record.sessionId)?.pid ?? null
    })),
    history
  };
}

export async function loadClaudeSessionMessages(sessionId: string): Promise<StudioClaudeMessage[]> {
  if (!sessionId.trim()) {
    return [];
  }

  const snapshot = await loadClaudeSnapshot();
  const session = snapshot.sessions.find((entry) => entry.id === sessionId) ?? null;

  if (!session) {
    return [];
  }

  return parseClaudeSessionMessages(await readJsonLines(session.filePath));
}
