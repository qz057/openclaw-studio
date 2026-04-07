import type {
  StudioCommandAction,
  StudioCommandActionDeckLane,
  StudioCommandCompanionPathHandoff,
  StudioCommandCompanionReviewPath,
  StudioCommandCompanionReviewSequence,
  StudioCommandCompanionRouteHistoryEntry,
  StudioCommandCompanionRouteSequenceSwitch,
  StudioCommandCompanionRouteState
} from "@openclaw/shared";

export type ReviewCoverageAction = StudioCommandAction & {
  kind: "focus-review-coverage";
};

interface ResolveCompanionRouteContextOptions {
  lanes: StudioCommandActionDeckLane[];
  contextReviewSurfaceActions: ReviewCoverageAction[];
  allReviewSurfaceActions?: ReviewCoverageAction[];
  activeReviewSurfaceActionId?: string | null;
  companionRouteStateId?: string | null;
  companionSequenceId?: string | null;
  companionRouteHistoryEntryId?: string | null;
  companionPathHandoffId?: string | null;
  additionalCompanionRouteHistoryEntries?: StudioCommandCompanionRouteHistoryEntry[];
}

export interface ResolvedCompanionRouteContext {
  reviewSurfaceActionById: Map<string, ReviewCoverageAction>;
  relevantCompanionSequences: StudioCommandCompanionReviewSequence[];
  activeCompanionSequence: StudioCommandCompanionReviewSequence | null;
  activeCompanionSequenceCurrentStep: StudioCommandCompanionReviewSequence["steps"][number] | null;
  activeCompanionSequenceCurrentStepIndex: number;
  relevantCompanionReviewPaths: StudioCommandCompanionReviewPath[];
  resolvedCompanionReviewPaths: StudioCommandCompanionReviewPath[];
  activeCompanionReviewPath: StudioCommandCompanionReviewPath | null;
  relevantCompanionRouteStates: StudioCommandCompanionRouteState[];
  activeCompanionRouteState: StudioCommandCompanionRouteState | null;
  alternateCompanionRouteStates: StudioCommandCompanionRouteState[];
  activeSequenceSwitch: StudioCommandCompanionRouteSequenceSwitch | null;
  relevantCompanionPathHandoffs: StudioCommandCompanionPathHandoff[];
  activeCompanionPathHandoff: StudioCommandCompanionPathHandoff | null;
  relevantCompanionRouteHistoryEntries: StudioCommandCompanionRouteHistoryEntry[];
  activeCompanionRouteHistoryEntry: StudioCommandCompanionRouteHistoryEntry | null;
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  return items.filter((item, index, entries) => entries.findIndex((entry) => entry.id === item.id) === index);
}

function scoreSequence(
  sequence: StudioCommandCompanionReviewSequence,
  activeReviewSurfaceActionId: string | null | undefined,
  companionSequenceId: string | null | undefined
): number {
  let score = 0;

  if (companionSequenceId && sequence.id === companionSequenceId) {
    score += 8;
  }

  if (activeReviewSurfaceActionId && sequence.steps.some((step) => step.actionId === activeReviewSurfaceActionId)) {
    score += 6;
  }

  return score;
}

function scoreRouteState(
  routeState: StudioCommandCompanionRouteState,
  activeReviewSurfaceActionId: string | null | undefined,
  companionRouteStateId: string | null | undefined
): number {
  let score = 0;

  if (companionRouteStateId && routeState.id === companionRouteStateId) {
    score += 10;
  }

  if (activeReviewSurfaceActionId) {
    if (routeState.currentActionId === activeReviewSurfaceActionId) {
      score += 8;
    } else if (routeState.sourceActionId === activeReviewSurfaceActionId || routeState.routeActionIds.includes(activeReviewSurfaceActionId)) {
      score += 5;
    }
  }

  if (routeState.posture === "active-route") {
    score += 2;
  }

  return score;
}

function includesContextAction(
  actionIds: string[],
  contextActionIds: Set<string>,
  activeReviewSurfaceActionId: string | null | undefined
): boolean {
  return actionIds.some((actionId) => contextActionIds.has(actionId)) || Boolean(activeReviewSurfaceActionId && actionIds.includes(activeReviewSurfaceActionId));
}

function scorePathHandoff(
  handoff: StudioCommandCompanionPathHandoff,
  activeReviewSurfaceActionId: string | null | undefined,
  companionPathHandoffId: string | null | undefined
): number {
  let score = 0;

  if (companionPathHandoffId && handoff.id === companionPathHandoffId) {
    score += 10;
  }

  if (activeReviewSurfaceActionId) {
    if (handoff.targetActionId === activeReviewSurfaceActionId) {
      score += 8;
    } else if (handoff.sourceActionId === activeReviewSurfaceActionId || handoff.followUpActionId === activeReviewSurfaceActionId) {
      score += 5;
    }
  }

  if (handoff.stability === "stable") {
    score += 2;
  }

  return score;
}

function scoreRouteHistoryEntry(
  entry: StudioCommandCompanionRouteHistoryEntry,
  activeReviewSurfaceActionId: string | null | undefined,
  companionRouteHistoryEntryId: string | null | undefined
): number {
  let score = 0;

  if (companionRouteHistoryEntryId && entry.id === companionRouteHistoryEntryId) {
    score += 10;
  }

  if (activeReviewSurfaceActionId) {
    if (entry.targetActionId === activeReviewSurfaceActionId) {
      score += 8;
    } else if (entry.sourceActionId === activeReviewSurfaceActionId) {
      score += 4;
    }
  }

  if (entry.transitionKind === "resume-history") {
    score += 2;
  }

  return score;
}

export function resolveCompanionRouteContext({
  lanes,
  contextReviewSurfaceActions,
  allReviewSurfaceActions = contextReviewSurfaceActions,
  activeReviewSurfaceActionId = null,
  companionRouteStateId = null,
  companionSequenceId = null,
  companionRouteHistoryEntryId = null,
  companionPathHandoffId = null,
  additionalCompanionRouteHistoryEntries = []
}: ResolveCompanionRouteContextOptions): ResolvedCompanionRouteContext {
  const reviewSurfaceActionById = new Map(allReviewSurfaceActions.map((action) => [action.id, action]));
  const contextActionIds = new Set(contextReviewSurfaceActions.map((action) => action.id));
  const relevantCompanionSequences = dedupeById(lanes.flatMap((lane) => lane.companionSequences ?? []))
    .filter((sequence) => includesContextAction(sequence.steps.map((step) => step.actionId), contextActionIds, activeReviewSurfaceActionId))
    .sort(
      (left, right) =>
        scoreSequence(right, activeReviewSurfaceActionId, companionSequenceId) -
          scoreSequence(left, activeReviewSurfaceActionId, companionSequenceId) || left.label.localeCompare(right.label)
    );
  const relevantCompanionReviewPaths = dedupeById(lanes.flatMap((lane) => lane.companionReviewPaths ?? [])).filter((path) =>
    includesContextAction(
      [path.sourceActionId, path.primaryActionId, ...(path.followUpActionIds ?? [])],
      contextActionIds,
      activeReviewSurfaceActionId
    )
  );
  const relevantCompanionRouteStates = dedupeById(lanes.flatMap((lane) => lane.companionRouteStates ?? []))
    .filter((routeState) =>
      includesContextAction(
        [
          routeState.sourceActionId,
          routeState.currentActionId,
          ...routeState.routeActionIds,
          ...routeState.sequenceSwitches.map((switchItem) => switchItem.targetActionId)
        ],
        contextActionIds,
        activeReviewSurfaceActionId
      )
    )
    .sort(
      (left, right) =>
        scoreRouteState(right, activeReviewSurfaceActionId, companionRouteStateId) -
          scoreRouteState(left, activeReviewSurfaceActionId, companionRouteStateId) || left.label.localeCompare(right.label)
    );
  const activeCompanionRouteState =
    (companionRouteStateId
      ? relevantCompanionRouteStates.find((routeState) => routeState.id === companionRouteStateId)
      : undefined) ??
    relevantCompanionRouteStates.find((routeState) => routeState.currentActionId === activeReviewSurfaceActionId) ??
    relevantCompanionRouteStates.find((routeState) => routeState.sourceActionId === activeReviewSurfaceActionId) ??
    relevantCompanionRouteStates.find((routeState) => Boolean(activeReviewSurfaceActionId && routeState.routeActionIds.includes(activeReviewSurfaceActionId))) ??
    relevantCompanionRouteStates.find((routeState) => routeState.posture === "active-route") ??
    relevantCompanionRouteStates[0] ??
    null;
  const alternateCompanionRouteStates = relevantCompanionRouteStates.filter((routeState) => routeState.id !== activeCompanionRouteState?.id);
  const activeSequenceSwitch =
    activeCompanionRouteState?.sequenceSwitches.find((switchItem) => companionSequenceId && switchItem.sequenceId === companionSequenceId) ??
    activeCompanionRouteState?.sequenceSwitches.find((switchItem) => switchItem.targetActionId === activeReviewSurfaceActionId) ??
    activeCompanionRouteState?.sequenceSwitches.find((switchItem) => switchItem.sequenceId === activeCompanionRouteState.activeSequenceId) ??
    activeCompanionRouteState?.sequenceSwitches[0] ??
    null;
  const activeCompanionSequence =
    (activeSequenceSwitch ? relevantCompanionSequences.find((sequence) => sequence.id === activeSequenceSwitch.sequenceId) : undefined) ??
    (companionSequenceId ? relevantCompanionSequences.find((sequence) => sequence.id === companionSequenceId) : undefined) ??
    relevantCompanionSequences.find((sequence) => sequence.steps.some((step) => step.actionId === activeReviewSurfaceActionId)) ??
    relevantCompanionSequences[0] ??
    null;
  const activeCompanionSequenceCurrentStepIndex =
    activeCompanionSequence?.steps.findIndex((step) => step.actionId === activeReviewSurfaceActionId) ?? -1;
  const activeCompanionSequenceCurrentStep =
    activeCompanionSequence && activeCompanionSequenceCurrentStepIndex >= 0
      ? activeCompanionSequence.steps[activeCompanionSequenceCurrentStepIndex] ?? null
      : null;
  const explicitReviewPaths = dedupeById(
    [activeSequenceSwitch?.reviewPathId, activeCompanionRouteState?.activeReviewPathId]
      .filter((pathId): pathId is string => Boolean(pathId))
      .flatMap((pathId) => relevantCompanionReviewPaths.find((path) => path.id === pathId) ?? [])
  );
  const activeReviewSurfacePaths = relevantCompanionReviewPaths.filter((path) => path.sourceActionId === activeReviewSurfaceActionId);
  const activeRoutePaths = activeCompanionRouteState
    ? relevantCompanionReviewPaths.filter(
        (path) => path.id === activeCompanionRouteState.activeReviewPathId || path.sourceActionId === activeCompanionRouteState.currentActionId
      )
    : [];
  const activeSequencePaths = activeCompanionSequence
    ? relevantCompanionReviewPaths.filter((path) => path.sequenceId === activeCompanionSequence.id)
    : [];
  const resolvedCompanionReviewPaths = dedupeById(
    explicitReviewPaths.length
      ? [...explicitReviewPaths, ...activeReviewSurfacePaths, ...activeRoutePaths, ...activeSequencePaths]
      : activeReviewSurfacePaths.length
        ? activeReviewSurfacePaths
        : activeRoutePaths.length
          ? activeRoutePaths
          : activeSequencePaths.length
            ? activeSequencePaths
            : relevantCompanionReviewPaths
  );
  const activeCompanionReviewPath =
    explicitReviewPaths[0] ??
    resolvedCompanionReviewPaths.find((path) => path.sourceActionId === activeReviewSurfaceActionId) ??
    resolvedCompanionReviewPaths[0] ??
    null;
  const relevantCompanionPathHandoffs = dedupeById(lanes.flatMap((lane) => lane.companionPathHandoffs ?? []))
    .filter((handoff) =>
      includesContextAction(
        [handoff.sourceActionId, handoff.targetActionId, handoff.followUpActionId].filter((actionId): actionId is string => Boolean(actionId)),
        contextActionIds,
        activeReviewSurfaceActionId
      )
    )
    .sort(
      (left, right) =>
        scorePathHandoff(right, activeReviewSurfaceActionId, companionPathHandoffId) -
          scorePathHandoff(left, activeReviewSurfaceActionId, companionPathHandoffId) || left.label.localeCompare(right.label)
    );
  const activeCompanionPathHandoff =
    (companionPathHandoffId ? relevantCompanionPathHandoffs.find((handoff) => handoff.id === companionPathHandoffId) : undefined) ??
    relevantCompanionPathHandoffs.find((handoff) => handoff.reviewPathId === activeCompanionReviewPath?.id) ??
    relevantCompanionPathHandoffs.find((handoff) => handoff.routeStateId === activeCompanionRouteState?.id) ??
    relevantCompanionPathHandoffs.find((handoff) => handoff.targetActionId === activeReviewSurfaceActionId) ??
    relevantCompanionPathHandoffs[0] ??
    null;
  const relevantCompanionRouteHistoryEntries = dedupeById([
    ...additionalCompanionRouteHistoryEntries,
    ...lanes.flatMap((lane) => lane.companionRouteHistory ?? [])
  ])
    .filter((entry) =>
      includesContextAction([entry.sourceActionId, entry.targetActionId], contextActionIds, activeReviewSurfaceActionId)
    )
    .sort(
      (left, right) =>
        scoreRouteHistoryEntry(right, activeReviewSurfaceActionId, companionRouteHistoryEntryId) -
          scoreRouteHistoryEntry(left, activeReviewSurfaceActionId, companionRouteHistoryEntryId) || left.label.localeCompare(right.label)
    );
  const activeCompanionRouteHistoryEntry =
    (companionRouteHistoryEntryId
      ? relevantCompanionRouteHistoryEntries.find((entry) => entry.id === companionRouteHistoryEntryId)
      : undefined) ??
    relevantCompanionRouteHistoryEntries.find(
      (entry) =>
        entry.targetActionId === activeReviewSurfaceActionId &&
        (!entry.routeStateId || entry.routeStateId === activeCompanionRouteState?.id)
    ) ??
    relevantCompanionRouteHistoryEntries.find((entry) => entry.reviewPathId === activeCompanionReviewPath?.id) ??
    relevantCompanionRouteHistoryEntries[0] ??
    null;

  return {
    reviewSurfaceActionById,
    relevantCompanionSequences,
    activeCompanionSequence,
    activeCompanionSequenceCurrentStep,
    activeCompanionSequenceCurrentStepIndex,
    relevantCompanionReviewPaths,
    resolvedCompanionReviewPaths,
    activeCompanionReviewPath,
    relevantCompanionRouteStates,
    activeCompanionRouteState,
    alternateCompanionRouteStates,
    activeSequenceSwitch,
    relevantCompanionPathHandoffs,
    activeCompanionPathHandoff,
    relevantCompanionRouteHistoryEntries,
    activeCompanionRouteHistoryEntry
  };
}
