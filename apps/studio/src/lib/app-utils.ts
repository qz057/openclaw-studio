import { studioPageIds, type StudioPageId, type StudioCommandAction } from "@openclaw/shared";

export const visibleStudioPageIds = ["dashboard", "chat", "sessions", "skills", "settings", "agents"] as const satisfies ReadonlyArray<StudioPageId>;

const visibleStudioPageIdSet = new Set<StudioPageId>(visibleStudioPageIds);

const routeAliases: Record<string, StudioPageId> = {
  session: "chat",
  conversations: "chat",
  hermes: "chat",
  claude: "chat",
  history: "sessions",
  capabilities: "skills",
  capability: "skills",
  configuration: "settings",
  config: "settings",
  diagnostics: "agents",
  home: "dashboard",
  codex: "dashboard"
};

const routeHashByPageId: Partial<Record<StudioPageId, string>> = {
  dashboard: "dashboard",
  chat: "session",
  sessions: "history",
  skills: "capabilities",
  settings: "settings",
  agents: "diagnostics"
};

export function normalizePageId(pageId: string | null | undefined): StudioPageId {
  const routeId = pageId?.trim().toLowerCase();
  const candidate = routeId ? routeAliases[routeId] ?? routeId : null;

  if (studioPageIds.includes(candidate as StudioPageId) && visibleStudioPageIdSet.has(candidate as StudioPageId)) {
    return candidate as StudioPageId;
  }

  return "dashboard";
}

export function getRouteHashForPageId(pageId: StudioPageId): string {
  const normalizedPageId = normalizePageId(pageId);
  return routeHashByPageId[normalizedPageId] ?? normalizedPageId;
}

export function resolvePage(): StudioPageId {
  const route = window.location.hash.replace("#", "");

  return normalizePageId(route);
}

export function resolveStartupPage(): StudioPageId {
  return "dashboard";
}

export function formatLiveSyncAge(timestampMs: number | null): string {
  if (!timestampMs) {
    return "等待同步";
  }

  const diffMs = Date.now() - timestampMs;

  if (diffMs < 15_000) {
    return "刚刚同步";
  }

  const seconds = Math.floor(diffMs / 1_000);

  if (seconds < 60) {
    return `${seconds} 秒前`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} 分钟前`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours} 小时前`;
}

export function dedupeCommandActions(actions: Array<StudioCommandAction | undefined>): StudioCommandAction[] {
  const seenIds = new Set<string>();
  const resolved: StudioCommandAction[] = [];

  for (const action of actions) {
    if (!action || seenIds.has(action.id)) {
      continue;
    }

    seenIds.add(action.id);
    resolved.push(action);
  }

  return resolved;
}

export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  return items.filter((item, index, entries) => entries.findIndex((entry) => entry.id === item.id) === index);
}
