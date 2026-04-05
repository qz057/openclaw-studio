import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { SessionSummary } from "@openclaw/shared";

const sessionDirectory = path.join(os.homedir(), ".openclaw", "agents", "main", "sessions");
const maxSessions = 6;

interface SessionEvent {
  type?: string;
  id?: string;
  timestamp?: string;
  cwd?: string;
  message?: {
    role?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  };
}

interface LiveSessionProbe {
  source: "live" | "mock";
  directory: string;
  sessions: SessionSummary[];
  totalDiscovered: number;
}

function parseJsonLine(line: string): SessionEvent | null {
  try {
    return JSON.parse(line) as SessionEvent;
  } catch {
    return null;
  }
}

function formatRelativeTime(timestampMs: number): string {
  const diffMs = Date.now() - timestampMs;

  if (diffMs < 60_000) {
    return "Just now";
  }

  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function deriveStatus(timestampMs: number): SessionSummary["status"] {
  const ageMs = Date.now() - timestampMs;

  if (ageMs < 8 * 60 * 60 * 1000) {
    return "active";
  }

  if (ageMs < 48 * 60 * 60 * 1000) {
    return "waiting";
  }

  return "complete";
}

function deriveWorkspace(cwd?: string): string {
  if (!cwd) {
    return "workspace";
  }

  const workspaceName = path.basename(cwd);
  return workspaceName || "workspace";
}

function deriveTitle(rawText: string | null, sessionId: string): string {
  if (!rawText) {
    return `Session ${sessionId.slice(0, 8)}`;
  }

  const candidate = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => line.replace(/^\[[^\]]+\]\s*/, ""))
    .filter(Boolean)
    .filter((line) => line !== "```")
    .filter((line) => !line.startsWith("Sender ("))
    .filter((line) => !line.startsWith("{"))
    .filter((line) => !line.startsWith("}"))
    .filter((line) => !line.startsWith('"'))
    .filter((line) => !/^Current time:/i.test(line))[0];

  const title = candidate ?? `Session ${sessionId.slice(0, 8)}`;
  return title.length > 72 ? `${title.slice(0, 69)}...` : title;
}

function getFirstUserText(events: SessionEvent[]): string | null {
  for (const event of events) {
    if (event.type !== "message" || event.message?.role !== "user") {
      continue;
    }

    const text = event.message.content
      ?.filter((content) => content.type === "text" && typeof content.text === "string")
      .map((content) => content.text?.trim() ?? "")
      .filter(Boolean)
      .join("\n");

    if (text) {
      return text;
    }
  }

  return null;
}

export async function probeLiveSessions(): Promise<LiveSessionProbe> {
  try {
    const entries = await fs.readdir(sessionDirectory, { withFileTypes: true });

    const filesWithStats = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
        .map(async (entry) => {
          const filePath = path.join(sessionDirectory, entry.name);
          const stats = await fs.stat(filePath);

          return {
            name: entry.name,
            path: filePath,
            stats
          };
        })
    );

    const latestFiles = filesWithStats.sort((left, right) => right.stats.mtimeMs - left.stats.mtimeMs).slice(0, maxSessions);

    const sessions = await Promise.all(
      latestFiles.map(async (file) => {
        const content = await fs.readFile(file.path, "utf8");
        const events = content
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => parseJsonLine(line))
          .filter((event): event is SessionEvent => event !== null);

        const sessionEvent = events.find((event) => event.type === "session");
        const sessionId = sessionEvent?.id ?? file.name.replace(/\.jsonl$/, "");
        const timestampMs = file.stats.mtimeMs;

        return {
          id: sessionId,
          title: deriveTitle(getFirstUserText(events), sessionId),
          workspace: deriveWorkspace(sessionEvent?.cwd),
          status: deriveStatus(timestampMs),
          updatedAt: formatRelativeTime(timestampMs),
          owner: "main"
        } satisfies SessionSummary;
      })
    );

    return {
      source: sessions.length > 0 ? "live" : "mock",
      directory: sessionDirectory,
      sessions,
      totalDiscovered: filesWithStats.length
    };
  } catch {
    return {
      source: "mock",
      directory: sessionDirectory,
      sessions: [],
      totalDiscovered: 0
    };
  }
}
