import { studioPageIds, type StudioPageId, type StudioCommandAction } from "@openclaw/shared";

export const visibleStudioPageIds = ["dashboard", "chat", "hermes", "sessions", "agents", "skills", "settings"] as const satisfies ReadonlyArray<StudioPageId>;

const visibleStudioPageIdSet = new Set<StudioPageId>(visibleStudioPageIds);

export function normalizePageId(pageId: string | null | undefined): StudioPageId {
  if (studioPageIds.includes(pageId as StudioPageId) && visibleStudioPageIdSet.has(pageId as StudioPageId)) {
    return pageId as StudioPageId;
  }

  return "dashboard";
}

export function resolvePage(): StudioPageId {
  const route = window.location.hash.replace("#", "");

  return normalizePageId(route);
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
