import type { StudioCommandCompanionRouteTransitionKind } from "@openclaw/shared";

export interface ReviewCoverageSelectionMemory {
  actionDeckLaneId: string | null;
  companionRouteStateId: string | null;
  companionSequenceId: string | null;
  companionRouteHistoryEntryId: string | null;
  companionPathHandoffId: string | null;
  reviewSurfaceActionId: string | null;
  deliveryStageId: string | null;
  windowId: string | null;
  sharedStateLaneId: string | null;
  orchestrationBoardId: string | null;
  observabilityMappingId: string | null;
}

export interface CompanionRouteHistoryMemoryEntry {
  id: string;
  recordedAt: string;
  transitionKind: StudioCommandCompanionRouteTransitionKind;
  previousSelection: ReviewCoverageSelectionMemory | null;
  nextSelection: ReviewCoverageSelectionMemory;
}

export interface CompanionRouteMemoryState {
  selection: ReviewCoverageSelectionMemory;
  entries: CompanionRouteHistoryMemoryEntry[];
}

export const companionRouteMemoryStorageKey = "openclaw-studio.companion-route-memory";

export function createEmptyReviewCoverageSelectionMemory(): ReviewCoverageSelectionMemory {
  return {
    actionDeckLaneId: null,
    companionRouteStateId: null,
    companionSequenceId: null,
    companionRouteHistoryEntryId: null,
    companionPathHandoffId: null,
    reviewSurfaceActionId: null,
    deliveryStageId: null,
    windowId: null,
    sharedStateLaneId: null,
    orchestrationBoardId: null,
    observabilityMappingId: null
  };
}

function isSelectionMemoryCandidate(value: unknown): value is ReviewCoverageSelectionMemory {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ReviewCoverageSelectionMemory>;
  return (
    ("actionDeckLaneId" in candidate || "reviewSurfaceActionId" in candidate || "companionRouteStateId" in candidate) &&
    typeof candidate.actionDeckLaneId !== "undefined"
  );
}

function normalizeNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function normalizeSelectionMemory(value: unknown): ReviewCoverageSelectionMemory {
  if (!isSelectionMemoryCandidate(value)) {
    return createEmptyReviewCoverageSelectionMemory();
  }

  return {
    actionDeckLaneId: normalizeNullableString(value.actionDeckLaneId),
    companionRouteStateId: normalizeNullableString(value.companionRouteStateId),
    companionSequenceId: normalizeNullableString(value.companionSequenceId),
    companionRouteHistoryEntryId: normalizeNullableString(value.companionRouteHistoryEntryId),
    companionPathHandoffId: normalizeNullableString(value.companionPathHandoffId),
    reviewSurfaceActionId: normalizeNullableString(value.reviewSurfaceActionId),
    deliveryStageId: normalizeNullableString(value.deliveryStageId),
    windowId: normalizeNullableString(value.windowId),
    sharedStateLaneId: normalizeNullableString(value.sharedStateLaneId),
    orchestrationBoardId: normalizeNullableString(value.orchestrationBoardId),
    observabilityMappingId: normalizeNullableString(value.observabilityMappingId)
  };
}

function normalizeHistoryEntry(value: unknown): CompanionRouteHistoryMemoryEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<CompanionRouteHistoryMemoryEntry>;

  if (typeof candidate.id !== "string" || typeof candidate.recordedAt !== "string") {
    return null;
  }

  return {
    id: candidate.id,
    recordedAt: candidate.recordedAt,
    transitionKind:
      candidate.transitionKind === "switch-sequence" ||
      candidate.transitionKind === "stabilize-handoff" ||
      candidate.transitionKind === "resume-history"
        ? candidate.transitionKind
        : "activate-route",
    previousSelection: candidate.previousSelection ? normalizeSelectionMemory(candidate.previousSelection) : null,
    nextSelection: normalizeSelectionMemory(candidate.nextSelection)
  };
}

export function readPersistedCompanionRouteMemory(): CompanionRouteMemoryState | null {
  try {
    const rawValue = window.localStorage.getItem(companionRouteMemoryStorageKey);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as
      | {
          selection?: unknown;
          entries?: unknown[];
        }
      | null;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return {
      selection: normalizeSelectionMemory(parsed.selection),
      entries: Array.isArray(parsed.entries) ? parsed.entries.map(normalizeHistoryEntry).filter((entry): entry is CompanionRouteHistoryMemoryEntry => entry !== null) : []
    };
  } catch {
    return null;
  }
}

export function writePersistedCompanionRouteMemory(memory: CompanionRouteMemoryState) {
  try {
    window.localStorage.setItem(
      companionRouteMemoryStorageKey,
      JSON.stringify({
        version: 1,
        selection: memory.selection,
        entries: memory.entries
      })
    );
  } catch {
    // Ignore storage failures so the shell stays usable in restricted environments.
  }
}
