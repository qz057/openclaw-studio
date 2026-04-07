import type {
  StudioCommandAction,
  StudioCommandActionDeckLane,
  StudioCommandCompanionReviewPath,
  StudioCommandCompanionReviewSequence,
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

export function resolveCompanionRouteContext({
  lanes,
  contextReviewSurfaceActions,
  allReviewSurfaceActions = contextReviewSurfaceActions,
  activeReviewSurfaceActionId = null,
  companionRouteStateId = null,
  companionSequenceId = null
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
    activeSequenceSwitch
  };
}
