import { useEffect, useState } from "react";
import {
  selectStudioReleaseApprovalPipelineStage,
  selectStudioReleaseCloseoutWindow,
  selectStudioReleaseDeliveryChainStage,
  selectStudioReleaseEscalationWindow,
  selectStudioReleaseReviewerQueue,
  type StudioReleaseAcknowledgementState,
  type StudioReleaseApprovalPipeline,
  type StudioReleaseCloseoutWindowState,
  type StudioCommandAction,
  type StudioCommandActionDeck,
  type StudioCommandCompanionRouteHistoryEntry,
  type StudioReleaseEscalationWindowState,
  type StudioReleaseReviewerQueueStatus,
  type StudioShellState
} from "@openclaw/shared";
import { resolveCompanionRouteContext, type ReviewCoverageAction } from "../reviewCoverageRouteState";

interface DeliveryChainWorkspaceProps {
  pipeline: StudioReleaseApprovalPipeline;
  windowing?: StudioShellState["windowing"];
  actionDeck?: StudioCommandActionDeck | null;
  reviewSurfaceActions?: StudioCommandAction[];
  activeReviewSurfaceActionId?: string | null;
  activeCompanionRouteStateId?: string | null;
  activeCompanionSequenceId?: string | null;
  activeCompanionRouteHistoryEntryId?: string | null;
  activeCompanionPathHandoffId?: string | null;
  companionRouteHistoryEntries?: StudioCommandCompanionRouteHistoryEntry[];
  selectedStageId?: string | null;
  onSelectStage?: (stageId: string) => void;
  onRunReviewSurfaceAction?: (action: StudioCommandAction) => void;
  onRunCompanionSequence?: (sequenceId: string) => void;
  onRunCompanionRouteHistory?: (entryId: string) => void;
  compact?: boolean;
  nested?: boolean;
  eyebrow?: string;
  title?: string;
  summary?: string;
}

type Tone = "positive" | "neutral" | "warning";
type ReplayScenarioPackItem = {
  lane: StudioCommandActionDeck["lanes"][number];
  pack: NonNullable<StudioCommandActionDeck["lanes"][number]["replayScenarioPack"]>;
  entries: StudioCommandCompanionRouteHistoryEntry[];
};

type ReplayScenarioPassCard = {
  id: string;
  label: string;
  status: string;
  detail: string;
  tone: Tone;
};

type ReplayScenarioEvidenceItem = NonNullable<StudioCommandCompanionRouteHistoryEntry["scenarioEvidenceItems"]>[number];
type ReplayScenarioScreenshotItem = NonNullable<StudioCommandCompanionRouteHistoryEntry["screenshotReviewItems"]>[number];
type ReplayScenarioPackContinuityHandoff = NonNullable<
  NonNullable<StudioCommandActionDeck["lanes"][number]["replayScenarioPack"]>["continuityHandoffs"]
>[number];

type ReplayScreenshotCaptureGroup = {
  id: string;
  label: string;
  comparisonFrame: string;
  tone: Tone;
  readyCount: number;
  totalCount: number;
  items: NonNullable<StudioCommandCompanionRouteHistoryEntry["screenshotReviewItems"]>;
  linkedEvidenceItems: NonNullable<StudioCommandCompanionRouteHistoryEntry["scenarioEvidenceItems"]>;
};

type ReplayScenarioPassRecord = {
  id: string;
  stepLabel: string;
  label: string;
  status: string;
  owner: string;
  detail: string;
  tone: Tone;
  badges: string[];
};

type ReplayEvidenceTraceKind = "all" | "capture-group" | "evidence-item" | "continuity-handoff";

type ReplayEvidenceTrace = {
  id: string;
  kind: ReplayEvidenceTraceKind;
  label: string;
  summary: string;
  detail: string;
  tone: Tone;
  evidenceItemIds: string[];
  screenshotIds: string[];
  continuityHandoffIds: string[];
  hiddenEvidenceItemCount: number;
  hiddenScreenshotCount: number;
};

const ALL_REPLAY_EVIDENCE_TRACE_ID = "replay-evidence-trace-all";

function resolveStageTone(status: StudioReleaseApprovalPipeline["stages"][number]["status"]): Tone {
  switch (status) {
    case "ready":
      return "positive";
    case "in-review":
    case "planned":
      return "neutral";
    default:
      return "warning";
  }
}

function resolveAcknowledgementTone(state: StudioReleaseAcknowledgementState): Tone {
  switch (state) {
    case "acknowledged":
      return "positive";
    case "pending":
      return "neutral";
    default:
      return "warning";
  }
}

function resolveReviewerQueueTone(status: StudioReleaseReviewerQueueStatus): Tone {
  switch (status) {
    case "closed":
      return "positive";
    case "active":
    case "handoff-ready":
      return "neutral";
    default:
      return "warning";
  }
}

function resolveEscalationTone(state: StudioReleaseEscalationWindowState): Tone {
  switch (state) {
    case "watch":
      return "positive";
    case "open":
      return "neutral";
    default:
      return "warning";
  }
}

function resolveCloseoutWindowTone(state: StudioReleaseCloseoutWindowState): Tone {
  switch (state) {
    case "ready-to-seal":
      return "positive";
    case "scheduled":
    case "open":
      return "neutral";
    default:
      return "warning";
  }
}

function resolveBatonTone(state: StudioReleaseApprovalPipeline["stages"][number]["handoff"]["batonState"]): Tone {
  switch (state) {
    case "handoff-ready":
      return "positive";
    case "held":
    case "awaiting-ack":
      return "neutral";
    default:
      return "warning";
  }
}

function resolveSealTone(state: StudioReleaseApprovalPipeline["stages"][number]["closeout"]["sealingState"]): Tone {
  switch (state) {
    case "sealed":
      return "positive";
    case "open":
    case "pending-seal":
      return "neutral";
    default:
      return "warning";
  }
}

function formatReviewSurfaceKind(kind: StudioCommandAction["reviewSurfaceKind"]): string {
  switch (kind) {
    case "review-packet":
      return "Review packet";
    case "reviewer-queue":
      return "Reviewer queue";
    case "decision-handoff":
      return "Decision handoff";
    case "evidence-closeout":
      return "Evidence closeout";
    case "decision-gate":
      return "Decision gate";
    case "closeout-window":
      return "Closeout window";
    default:
      return "Review surface";
  }
}

function formatCompanionReviewPathKind(
  kind: NonNullable<StudioCommandActionDeck["lanes"][number]["companionReviewPaths"]>[number]["kind"]
): string {
  switch (kind) {
    case "stage-companion":
      return "Stage companion";
    case "handoff-companion":
      return "Handoff companion";
    case "rollback-companion":
      return "Rollback companion";
    default:
      return "Stabilization companion";
  }
}

function formatCompanionReviewSequenceStepRole(
  role: NonNullable<StudioCommandActionDeck["lanes"][number]["companionSequences"]>[number]["steps"][number]["role"]
): string {
  switch (role) {
    case "current-review-surface":
      return "Current surface";
    case "primary-companion":
      return "Primary companion";
    default:
      return "Follow-up companion";
  }
}

function formatCompanionRouteStatePosture(
  posture: NonNullable<StudioCommandActionDeck["lanes"][number]["companionRouteStates"]>[number]["posture"]
): string {
  return posture === "active-route" ? "Active route" : "Alternate route";
}

function formatCompanionRouteSequenceSwitchPosture(
  posture: NonNullable<
    NonNullable<StudioCommandActionDeck["lanes"][number]["companionRouteStates"]>[number]["sequenceSwitches"][number]["posture"]
  >
): string {
  return posture === "active-sequence" ? "Active sequence" : "Switchable sequence";
}

function formatCompanionRouteTransitionKind(kind: StudioCommandCompanionRouteHistoryEntry["transitionKind"]): string {
  switch (kind) {
    case "switch-sequence":
      return "Sequence switch";
    case "stabilize-handoff":
      return "Path handoff stabilization";
    case "resume-history":
      return "History resume";
    default:
      return "Route activation";
  }
}

function formatCompanionPathHandoffStability(
  stability: NonNullable<StudioCommandActionDeck["lanes"][number]["companionPathHandoffs"]>[number]["stability"]
): string {
  switch (stability) {
    case "stable":
      return "Stable";
    case "restored":
      return "Restored";
    default:
      return "Watch";
  }
}

function resolveReplayAcceptanceTone(
  state: NonNullable<StudioCommandCompanionRouteHistoryEntry["acceptanceChecks"]>[number]["state"]
): Tone {
  switch (state) {
    case "ready":
      return "positive";
    case "watch":
      return "neutral";
    default:
      return "warning";
  }
}

function resolveReplayScenarioEvidenceTone(
  posture: NonNullable<StudioCommandCompanionRouteHistoryEntry["scenarioEvidenceItems"]>[number]["posture"]
): Tone {
  switch (posture) {
    case "linked":
      return "positive";
    case "staged":
      return "neutral";
    default:
      return "warning";
  }
}

function formatReplayScenarioEvidencePosture(
  posture: NonNullable<StudioCommandCompanionRouteHistoryEntry["scenarioEvidenceItems"]>[number]["posture"]
): string {
  switch (posture) {
    case "linked":
      return "Linked";
    case "staged":
      return "Staged";
    default:
      return "Pending";
  }
}

function formatReplayScenarioEvidenceKind(
  kind: NonNullable<StudioCommandCompanionRouteHistoryEntry["scenarioEvidenceItems"]>[number]["kind"]
): string {
  switch (kind) {
    case "route-snapshot":
      return "Route snapshot";
    case "reviewer-notes":
      return "Reviewer notes";
    default:
      return "Comparison ledger";
  }
}

function resolveReplayEvidenceContinuityTone(
  state: NonNullable<StudioCommandCompanionRouteHistoryEntry["evidenceContinuityChecks"]>[number]["state"]
): Tone {
  switch (state) {
    case "ready":
      return "positive";
    case "watch":
      return "neutral";
    default:
      return "warning";
  }
}

function formatReplayEvidenceContinuityState(
  state: NonNullable<StudioCommandCompanionRouteHistoryEntry["evidenceContinuityChecks"]>[number]["state"]
): string {
  switch (state) {
    case "ready":
      return "Aligned";
    case "watch":
      return "Watch";
    default:
      return "Blocked";
  }
}

function resolveReplayScreenshotTone(
  posture: NonNullable<StudioCommandCompanionRouteHistoryEntry["screenshotReviewItems"]>[number]["posture"]
): Tone {
  switch (posture) {
    case "linked":
      return "positive";
    case "staged":
      return "neutral";
    default:
      return "warning";
  }
}

function formatReplayScreenshotPosture(
  posture: NonNullable<StudioCommandCompanionRouteHistoryEntry["screenshotReviewItems"]>[number]["posture"]
): string {
  switch (posture) {
    case "linked":
      return "Linked";
    case "staged":
      return "Staged";
    default:
      return "Required";
  }
}

function formatReplayScreenshotStoryboardRole(
  role: NonNullable<StudioCommandCompanionRouteHistoryEntry["screenshotReviewItems"]>[number]["storyboardRole"]
): string {
  switch (role) {
    case "baseline":
      return "Baseline";
    case "handoff":
      return "Handoff";
    case "return":
      return "Return";
    default:
      return "Re-entry";
  }
}

function formatReplayScreenshotShotIndex(
  shotIndex: NonNullable<StudioCommandCompanionRouteHistoryEntry["screenshotReviewItems"]>[number]["shotIndex"]
): string {
  return `Shot ${String(shotIndex).padStart(2, "0")}`;
}

function formatReplayEvidenceTraceKind(kind: ReplayEvidenceTraceKind): string {
  switch (kind) {
    case "capture-group":
      return "Capture group";
    case "evidence-item":
      return "Proof item";
    case "continuity-handoff":
      return "Continuity handoff";
    default:
      return "All evidence";
  }
}

function createReplayEvidenceTraceCaptureGroupId(groupId: string): string {
  return `replay-evidence-trace-capture-group-${groupId}`;
}

function createReplayEvidenceTraceEvidenceItemId(evidenceItemId: string): string {
  return `replay-evidence-trace-evidence-item-${evidenceItemId}`;
}

function createReplayEvidenceTraceContinuityHandoffId(handoffId: string): string {
  return `replay-evidence-trace-continuity-handoff-${handoffId}`;
}

function createReplayScreenshotCaptureGroups({
  screenshotItems,
  evidenceItems
}: {
  screenshotItems: NonNullable<StudioCommandCompanionRouteHistoryEntry["screenshotReviewItems"]>;
  evidenceItems: NonNullable<StudioCommandCompanionRouteHistoryEntry["scenarioEvidenceItems"]>;
}): ReplayScreenshotCaptureGroup[] {
  const evidenceById = new Map(evidenceItems.map((item) => [item.id, item]));
  const groups = new Map<
    string,
    {
      id: string;
      label: string;
      comparisonFrame: string;
      readyCount: number;
      totalCount: number;
      items: NonNullable<StudioCommandCompanionRouteHistoryEntry["screenshotReviewItems"]>;
      linkedEvidenceItems: NonNullable<StudioCommandCompanionRouteHistoryEntry["scenarioEvidenceItems"]>;
      linkedEvidenceIds: Set<string>;
      firstShotIndex: number;
    }
  >();

  screenshotItems.forEach((item, index) => {
    const label = item.captureGroup ?? item.surface;
    const comparisonFrame = item.comparisonFrame ?? item.surface;
    const key = `${label}::${comparisonFrame}`;
    const currentGroup = groups.get(key) ?? {
      id: `${item.id}-group-${index + 1}`,
      label,
      comparisonFrame,
      readyCount: 0,
      totalCount: 0,
      items: [],
      linkedEvidenceItems: [],
      linkedEvidenceIds: new Set<string>(),
      firstShotIndex: item.shotIndex
    };

    currentGroup.items.push(item);
    currentGroup.totalCount += 1;
    currentGroup.firstShotIndex = Math.min(currentGroup.firstShotIndex, item.shotIndex);

    if (item.posture !== "required") {
      currentGroup.readyCount += 1;
    }

    (item.linkedEvidenceItemIds ?? []).forEach((evidenceId) => {
      if (currentGroup.linkedEvidenceIds.has(evidenceId)) {
        return;
      }

      const evidenceItem = evidenceById.get(evidenceId);

      if (!evidenceItem) {
        return;
      }

      currentGroup.linkedEvidenceIds.add(evidenceId);
      currentGroup.linkedEvidenceItems.push(evidenceItem);
    });

    groups.set(key, currentGroup);
  });

  return Array.from(groups.values())
    .sort((left, right) => left.firstShotIndex - right.firstShotIndex || left.label.localeCompare(right.label))
    .map((group) => ({
      id: group.id,
      label: group.label,
      comparisonFrame: group.comparisonFrame,
      tone: resolveReplayProgressTone(group.readyCount, group.totalCount),
      readyCount: group.readyCount,
      totalCount: group.totalCount,
      items: [...group.items].sort((left, right) => left.shotIndex - right.shotIndex || left.label.localeCompare(right.label)),
      linkedEvidenceItems: group.linkedEvidenceItems
    }));
}

function countReplayLinkedProofItems(groups: ReplayScreenshotCaptureGroup[]): number {
  return new Set(groups.flatMap((group) => group.linkedEvidenceItems.map((item) => item.id))).size;
}

function createReplayEvidenceTraces({
  captureGroups,
  evidenceItems,
  screenshotItems,
  continuityHandoffs
}: {
  captureGroups: ReplayScreenshotCaptureGroup[];
  evidenceItems: ReplayScenarioEvidenceItem[];
  screenshotItems: ReplayScenarioScreenshotItem[];
  continuityHandoffs: ReplayScenarioPackContinuityHandoff[];
}): ReplayEvidenceTrace[] {
  const evidenceIdSet = new Set(evidenceItems.map((item) => item.id));
  const screenshotIdSet = new Set(screenshotItems.map((item) => item.id));
  const relevantHandoffs = continuityHandoffs.filter(
    (handoff) =>
      handoff.linkedEvidenceItemIds.some((itemId) => evidenceIdSet.has(itemId)) ||
      handoff.linkedScreenshotIds.some((itemId) => screenshotIdSet.has(itemId))
  );
  const readyEvidenceCount = evidenceItems.filter((item) => item.posture !== "pending").length;
  const readyScreenshotCount = screenshotItems.filter((item) => item.posture !== "required").length;
  const readyHandoffCount = relevantHandoffs.filter((handoff) => handoff.state === "ready").length;
  const traces: ReplayEvidenceTrace[] = [
    {
      id: ALL_REPLAY_EVIDENCE_TRACE_ID,
      kind: "all",
      label: "All acceptance evidence",
      summary: `${captureGroups.length} capture groups / ${relevantHandoffs.length} continuity handoffs`,
      detail: `${screenshotItems.length} storyboard shots · ${evidenceItems.length} proof items · ${relevantHandoffs.length} continuity handoffs`,
      tone: resolveReplayProgressTone(
        readyEvidenceCount + readyScreenshotCount + readyHandoffCount,
        evidenceItems.length + screenshotItems.length + relevantHandoffs.length
      ),
      evidenceItemIds: evidenceItems.map((item) => item.id),
      screenshotIds: screenshotItems.map((item) => item.id),
      continuityHandoffIds: relevantHandoffs.map((handoff) => handoff.id),
      hiddenEvidenceItemCount: 0,
      hiddenScreenshotCount: 0
    }
  ];

  captureGroups.forEach((group) => {
    const groupEvidenceIds = group.linkedEvidenceItems.map((item) => item.id);
    const groupScreenshotIds = group.items.map((item) => item.id);
    const groupContinuityHandoffIds = relevantHandoffs
      .filter(
        (handoff) =>
          handoff.linkedEvidenceItemIds.some((itemId) => groupEvidenceIds.includes(itemId)) ||
          handoff.linkedScreenshotIds.some((itemId) => groupScreenshotIds.includes(itemId))
      )
      .map((handoff) => handoff.id);

    traces.push({
      id: createReplayEvidenceTraceCaptureGroupId(group.id),
      kind: "capture-group",
      label: group.label,
      summary: group.comparisonFrame,
      detail: `${groupScreenshotIds.length} storyboard shots · ${groupEvidenceIds.length} proof items · ${groupContinuityHandoffIds.length} continuity handoffs`,
      tone: group.tone,
      evidenceItemIds: groupEvidenceIds,
      screenshotIds: groupScreenshotIds,
      continuityHandoffIds: groupContinuityHandoffIds,
      hiddenEvidenceItemCount: 0,
      hiddenScreenshotCount: 0
    });
  });

  evidenceItems.forEach((item) => {
    const linkedScreenshotIds = screenshotItems
      .filter((screenshot) => screenshot.linkedEvidenceItemIds?.includes(item.id))
      .map((screenshot) => screenshot.id);
    const continuityHandoffIds = relevantHandoffs
      .filter(
        (handoff) =>
          handoff.linkedEvidenceItemIds.includes(item.id) ||
          handoff.linkedScreenshotIds.some((itemId) => linkedScreenshotIds.includes(itemId))
      )
      .map((handoff) => handoff.id);

    traces.push({
      id: createReplayEvidenceTraceEvidenceItemId(item.id),
      kind: "evidence-item",
      label: item.label,
      summary: `${item.dossierSection} / ${item.owner}`,
      detail: `${linkedScreenshotIds.length} storyboard shots · ${continuityHandoffIds.length} continuity handoffs`,
      tone: resolveReplayScenarioEvidenceTone(item.posture),
      evidenceItemIds: [item.id],
      screenshotIds: linkedScreenshotIds,
      continuityHandoffIds,
      hiddenEvidenceItemCount: 0,
      hiddenScreenshotCount: 0
    });
  });

  relevantHandoffs.forEach((handoff) => {
    const localEvidenceItemIds = handoff.linkedEvidenceItemIds.filter((itemId) => evidenceIdSet.has(itemId));
    const localScreenshotIds = handoff.linkedScreenshotIds.filter((itemId) => screenshotIdSet.has(itemId));

    traces.push({
      id: createReplayEvidenceTraceContinuityHandoffId(handoff.id),
      kind: "continuity-handoff",
      label: handoff.label,
      summary: `${handoff.sourceLabel} -> ${handoff.targetLabel}`,
      detail: `${localScreenshotIds.length} storyboard shots · ${localEvidenceItemIds.length} proof items`,
      tone: resolveReplayEvidenceContinuityTone(handoff.state),
      evidenceItemIds: localEvidenceItemIds,
      screenshotIds: localScreenshotIds,
      continuityHandoffIds: [handoff.id],
      hiddenEvidenceItemCount: handoff.linkedEvidenceItemIds.length - localEvidenceItemIds.length,
      hiddenScreenshotCount: handoff.linkedScreenshotIds.length - localScreenshotIds.length
    });
  });

  return traces;
}

function createReplayScenarioPassRecords({
  entry,
  passCards,
  routeLabel,
  reviewerPosture,
  evidenceBundleStatusLabel,
  captureGroups,
  linkedProofCount
}: {
  entry: StudioCommandCompanionRouteHistoryEntry;
  passCards: ReplayScenarioPassCard[];
  routeLabel: string;
  reviewerPosture: string;
  evidenceBundleStatusLabel: string;
  captureGroups: ReplayScreenshotCaptureGroup[];
  linkedProofCount: number;
}): ReplayScenarioPassRecord[] {
  const routePass =
    passCards.find((pass) => pass.id.endsWith("-pass-route")) ??
    ({
      id: `${entry.id}-pass-route-fallback`,
      label: "Replay route",
      status: "Route staging",
      detail: "Route replay data is unavailable.",
      tone: "warning"
    } as ReplayScenarioPassCard);
  const checksPass =
    passCards.find((pass) => pass.id.endsWith("-pass-checks")) ??
    ({
      id: `${entry.id}-pass-checks-fallback`,
      label: "Pass checks",
      status: "Checks blocked",
      detail: "Acceptance checks are unavailable.",
      tone: "warning"
    } as ReplayScenarioPassCard);
  const capturePass =
    passCards.find((pass) => pass.id.endsWith("-pass-capture")) ??
    ({
      id: `${entry.id}-pass-capture-fallback`,
      label: "Capture set",
      status: "Capture blocked",
      detail: "Screenshot capture targets are unavailable.",
      tone: "warning"
    } as ReplayScenarioPassCard);
  const proofPass =
    passCards.find((pass) => pass.id.endsWith("-pass-proof")) ??
    ({
      id: `${entry.id}-pass-proof-fallback`,
      label: "Proof bundle",
      status: "Evidence pack pending",
      detail: "Proof-link data is unavailable.",
      tone: "warning"
    } as ReplayScenarioPassCard);

  return [
    {
      id: routePass.id,
      stepLabel: "Pass 01",
      label: "Restore replay route",
      status: routePass.status,
      owner: "Route replay contract",
      detail: routePass.detail,
      tone: routePass.tone,
      badges: [routeLabel, formatCompanionRouteTransitionKind(entry.transitionKind)]
    },
    {
      id: checksPass.id,
      stepLabel: "Pass 02",
      label: "Lock acceptance checks",
      status: checksPass.status,
      owner: "Scenario checklist review",
      detail: checksPass.detail,
      tone: checksPass.tone,
      badges: [`${entry.acceptanceChecks?.length ?? 0} acceptance checks`, reviewerPosture]
    },
    {
      id: capturePass.id,
      stepLabel: "Pass 03",
      label: "Review acceptance storyboard",
      status: capturePass.status,
      owner: "Screenshot storyboard review",
      detail: capturePass.detail,
      tone: capturePass.tone,
      badges: [`${captureGroups.length} capture groups`, `${linkedProofCount} proof links`]
    },
    {
      id: proofPass.id,
      stepLabel: "Pass 04",
      label: "Link proof bundle",
      status: proofPass.status,
      owner: "Evidence bundle linkage",
      detail: proofPass.detail,
      tone: proofPass.tone,
      badges: [evidenceBundleStatusLabel, `${linkedProofCount} linked proofs`]
    }
  ];
}

function resolveReplayProgressTone(readyCount: number, totalCount: number): Tone {
  if (totalCount === 0) {
    return "warning";
  }

  if (readyCount === totalCount) {
    return "positive";
  }

  if (readyCount > 0) {
    return "neutral";
  }

  return "warning";
}

function resolveReplayScenarioTone(
  readyChecks: number,
  totalChecks: number,
  readyScreenshots: number,
  totalScreenshots: number,
  readyEvidenceItems: number,
  totalEvidenceItems: number,
  readyContinuityChecks: number,
  totalContinuityChecks: number
): Tone {
  const checksTone = resolveReplayProgressTone(readyChecks, totalChecks);
  const screenshotsTone = resolveReplayProgressTone(readyScreenshots, totalScreenshots);
  const evidenceTone = resolveReplayProgressTone(readyEvidenceItems, totalEvidenceItems);
  const continuityTone = resolveReplayProgressTone(readyContinuityChecks, totalContinuityChecks);

  if (checksTone === "positive" && screenshotsTone === "positive" && evidenceTone === "positive" && continuityTone === "positive") {
    return "positive";
  }

  if (checksTone === "warning" && screenshotsTone === "warning" && evidenceTone === "warning" && continuityTone === "warning") {
    return "warning";
  }

  return "neutral";
}

function formatReplayScenarioStatusLabel(
  readyChecks: number,
  totalChecks: number,
  readyScreenshots: number,
  totalScreenshots: number,
  readyEvidenceItems: number,
  totalEvidenceItems: number,
  readyContinuityChecks: number,
  totalContinuityChecks: number
): string {
  const checksReady = totalChecks > 0 && readyChecks === totalChecks;
  const screenshotsReady = totalScreenshots > 0 && readyScreenshots === totalScreenshots;
  const evidenceReady = totalEvidenceItems > 0 && readyEvidenceItems === totalEvidenceItems;
  const continuityReady = totalContinuityChecks > 0 && readyContinuityChecks === totalContinuityChecks;

  if (checksReady && screenshotsReady && evidenceReady && continuityReady) {
    return "Ready for local acceptance";
  }

  if (checksReady && screenshotsReady && evidenceReady) {
    return "Continuity review pending";
  }

  if (checksReady && screenshotsReady) {
    return "Evidence pack pending";
  }

  if (checksReady) {
    return "Capture review pending";
  }

  if (readyChecks > 0 || readyScreenshots > 0 || readyEvidenceItems > 0 || readyContinuityChecks > 0) {
    return "Acceptance review in progress";
  }

  return "Acceptance evidence incomplete";
}

function formatReplayEvidencePackStatusLabel(readyEvidenceItems: number, totalEvidenceItems: number): string {
  if (totalEvidenceItems > 0 && readyEvidenceItems === totalEvidenceItems) {
    return "Evidence pack ready";
  }

  if (readyEvidenceItems > 0) {
    return "Evidence pack staging";
  }

  return "Evidence pack pending";
}

function formatReplayEvidenceContinuityStatusLabel(readyContinuityChecks: number, totalContinuityChecks: number): string {
  if (totalContinuityChecks > 0 && readyContinuityChecks === totalContinuityChecks) {
    return "Continuity aligned";
  }

  if (readyContinuityChecks > 0) {
    return "Continuity in review";
  }

  return "Continuity blocked";
}

function resolveReplayEvidenceBundleTone(
  readyEvidenceItems: number,
  totalEvidenceItems: number,
  readyContinuityChecks: number,
  totalContinuityChecks: number
): Tone {
  const evidenceTone = resolveReplayProgressTone(readyEvidenceItems, totalEvidenceItems);
  const continuityTone = resolveReplayProgressTone(readyContinuityChecks, totalContinuityChecks);

  if (evidenceTone === "positive" && continuityTone === "positive") {
    return "positive";
  }

  if (evidenceTone === "warning" && continuityTone === "warning") {
    return "warning";
  }

  return "neutral";
}

function formatReplayEvidenceBundleStatusLabel(
  readyEvidenceItems: number,
  totalEvidenceItems: number,
  readyContinuityChecks: number,
  totalContinuityChecks: number
): string {
  const evidenceReady = totalEvidenceItems > 0 && readyEvidenceItems === totalEvidenceItems;
  const continuityReady = totalContinuityChecks > 0 && readyContinuityChecks === totalContinuityChecks;

  if (evidenceReady && continuityReady) {
    return "Evidence bundle linked";
  }

  if (readyEvidenceItems > 0 || readyContinuityChecks > 0) {
    return "Evidence bundle staged";
  }

  return "Evidence bundle pending";
}

function formatCompanionRouteState(action: StudioCommandAction | null | undefined, windowing?: StudioShellState["windowing"]): string {
  const linkedIntent = action?.windowIntentId
    ? windowing?.windowIntents.find((entry) => entry.id === action.windowIntentId) ?? null
    : null;
  const routeId = linkedIntent?.shellLink.pageId ?? action?.routeId ?? "No route";
  const workspaceViewId = linkedIntent?.workspaceViewId ?? action?.workspaceViewId ?? "No workspace";
  const intentLabel = linkedIntent?.label ?? action?.windowIntentId ?? "No intent";

  return `${routeId} / ${workspaceViewId} / ${intentLabel}`;
}

function isReviewCoverageAction(
  action: StudioCommandAction | undefined
): action is StudioCommandAction & {
  kind: "focus-review-coverage";
} {
  return Boolean(action && action.kind === "focus-review-coverage");
}

function formatReviewPostureRelationship(
  relationship: StudioShellState["windowing"]["observability"]["mappings"][number]["relationship"]
): string {
  switch (relationship) {
    case "owns-current-posture":
      return "Owns current posture";
    case "mirrors-current-posture":
      return "Mirrors current posture";
    case "staged-for-handoff":
      return "Staged for handoff";
    case "blocked-upstream":
      return "Blocked upstream";
    case "escalation-shadow":
      return "Escalation shadow";
    default:
      return "Blocked decision gate";
  }
}

function resolveArtifactCoverage(
  artifact: string,
  stage: StudioReleaseApprovalPipeline["stages"][number] | null,
  closeoutWindow: StudioReleaseApprovalPipeline["closeoutWindows"][number] | null
) {
  const badges: string[] = [];

  if (stage?.evidence.includes(artifact)) {
    badges.push("stage evidence");
  }

  if (stage?.packet.evidence.includes(artifact)) {
    badges.push("review packet");
  }

  if (stage?.closeout.sealedEvidence.includes(artifact)) {
    badges.push("sealed closeout");
  }

  if (stage?.closeout.pendingEvidence.includes(artifact)) {
    badges.push("pending closeout");
  }

  if (closeoutWindow?.sealedEvidence.includes(artifact)) {
    badges.push("window sealed");
  }

  if (closeoutWindow?.pendingEvidence.includes(artifact)) {
    badges.push("window pending");
  }

  if (badges.includes("sealed closeout") || badges.includes("window sealed")) {
    return {
      label: "sealed evidence",
      detail: badges.join(" / "),
      tone: "positive" as Tone,
      badges
    };
  }

  if (badges.includes("pending closeout") || badges.includes("window pending")) {
    return {
      label: "pending closeout",
      detail: badges.join(" / "),
      tone: "warning" as Tone,
      badges
    };
  }

  if (badges.length > 0) {
    return {
      label: "linked review artifact",
      detail: badges.join(" / "),
      tone: "neutral" as Tone,
      badges
    };
  }

  return {
    label: "delivery reference",
    detail: "Grouped in the delivery chain so the stage can be reviewed end-to-end even when the current packet does not carry it directly.",
    tone: "neutral" as Tone,
    badges: ["delivery reference"]
  };
}

export function DeliveryChainWorkspace({
  pipeline,
  windowing,
  actionDeck,
  reviewSurfaceActions = [],
  activeReviewSurfaceActionId,
  activeCompanionRouteStateId,
  activeCompanionSequenceId,
  activeCompanionRouteHistoryEntryId,
  activeCompanionPathHandoffId,
  companionRouteHistoryEntries = [],
  selectedStageId: controlledStageId,
  onSelectStage,
  onRunReviewSurfaceAction,
  onRunCompanionSequence,
  onRunCompanionRouteHistory,
  compact = false,
  nested = false,
  eyebrow = "Delivery",
  title,
  summary
}: DeliveryChainWorkspaceProps) {
  const currentPipelineStage = selectStudioReleaseApprovalPipelineStage(pipeline) ?? pipeline.stages[0] ?? null;
  const currentDeliveryStage = selectStudioReleaseDeliveryChainStage(pipeline, currentPipelineStage ?? undefined) ?? pipeline.deliveryChain.stages[0] ?? null;
  const [localSelectedStageId, setLocalSelectedStageId] = useState<string>(currentDeliveryStage?.id ?? pipeline.deliveryChain.currentStageId);
  const [selectedArtifactGroupId, setSelectedArtifactGroupId] = useState<string | null>(null);
  const [activeReplayEvidenceTraceId, setActiveReplayEvidenceTraceId] = useState<string>(ALL_REPLAY_EVIDENCE_TRACE_ID);
  const selectedStageId = controlledStageId ?? localSelectedStageId;

  useEffect(() => {
    if (!pipeline.deliveryChain.stages.some((stage) => stage.id === selectedStageId)) {
      setLocalSelectedStageId(currentDeliveryStage?.id ?? pipeline.deliveryChain.currentStageId);
    }
  }, [currentDeliveryStage?.id, pipeline.deliveryChain.currentStageId, pipeline.deliveryChain.stages, selectedStageId]);

  const selectedDeliveryStage =
    selectStudioReleaseDeliveryChainStage(pipeline, selectedStageId) ??
    selectStudioReleaseDeliveryChainStage(pipeline, currentPipelineStage ?? undefined) ??
    pipeline.deliveryChain.stages[0] ??
    null;
  const selectedPipelineStage =
    pipeline.stages.find((stage) => stage.id === selectedDeliveryStage?.pipelineStageId) ??
    pipeline.stages.find((stage) => stage.deliveryChainStageId === selectedDeliveryStage?.id) ??
    currentPipelineStage;

  useEffect(() => {
    if (!selectedDeliveryStage) {
      if (selectedArtifactGroupId !== null) {
        setSelectedArtifactGroupId(null);
      }

      return;
    }

    if (!selectedArtifactGroupId || !selectedDeliveryStage.artifactGroups.some((group) => group.id === selectedArtifactGroupId)) {
      setSelectedArtifactGroupId(selectedDeliveryStage.artifactGroups[0]?.id ?? null);
    }
  }, [selectedArtifactGroupId, selectedDeliveryStage]);

  const selectedReviewerQueue = selectedPipelineStage ? selectStudioReleaseReviewerQueue(pipeline, selectedPipelineStage) ?? null : null;
  const selectedEscalationWindow = selectedPipelineStage ? selectStudioReleaseEscalationWindow(pipeline, selectedPipelineStage) ?? null : null;
  const selectedCloseoutWindow = selectedPipelineStage ? selectStudioReleaseCloseoutWindow(pipeline, selectedPipelineStage) ?? null : null;
  const selectedArtifactGroup =
    selectedDeliveryStage?.artifactGroups.find((group) => group.id === selectedArtifactGroupId) ??
    selectedDeliveryStage?.artifactGroups[0] ??
    null;
  const stageMappings =
    windowing?.observability.mappings.filter((mapping) => mapping.reviewPosture.deliveryChainStageId === selectedDeliveryStage?.id) ?? [];
  const activeStageMapping =
    stageMappings.find((mapping) => mapping.id === windowing?.observability.activeMappingId) ?? stageMappings[0] ?? null;
  const reviewFlowLadder = pipeline.deliveryChain.stages.map((stage) => {
    const pipelineStage = pipeline.stages.find((entry) => entry.id === stage.pipelineStageId) ?? null;
    const reviewerQueue = pipelineStage ? selectStudioReleaseReviewerQueue(pipeline, pipelineStage) ?? null : null;
    const closeoutWindow = pipelineStage ? selectStudioReleaseCloseoutWindow(pipeline, pipelineStage) ?? null : null;
    const observabilityPaths =
      windowing?.observability.mappings.filter((mapping) => mapping.reviewPosture.deliveryChainStageId === stage.id).length ?? 0;

    return {
      stage,
      pipelineStage,
      reviewerQueue,
      closeoutWindow,
      observabilityPaths
    };
  });
  const upstreamStages = (selectedDeliveryStage?.upstreamStageIds ?? [])
    .map((stageId) => selectStudioReleaseDeliveryChainStage(pipeline, stageId))
    .filter((stage): stage is NonNullable<typeof stage> => Boolean(stage));
  const downstreamStages = (selectedDeliveryStage?.downstreamStageIds ?? [])
    .map((stageId) => selectStudioReleaseDeliveryChainStage(pipeline, stageId))
    .filter((stage): stage is NonNullable<typeof stage> => Boolean(stage));
  const activeQueueEntry =
    selectedReviewerQueue?.entries.find((entry) => entry.id === selectedReviewerQueue.activeEntryId) ?? selectedReviewerQueue?.entries[0] ?? null;
  const publishStage = selectStudioReleaseDeliveryChainStage(pipeline, "delivery-chain-publish-decision") ?? null;
  const rollbackStage = selectStudioReleaseDeliveryChainStage(pipeline, "delivery-chain-rollback-readiness") ?? null;
  const stageReviewSurfaceActions = reviewSurfaceActions
    .filter(isReviewCoverageAction)
    .filter((action) => action.deliveryChainStageId === selectedDeliveryStage?.id);
  const activeStageReviewSurfaceAction =
    stageReviewSurfaceActions.find((action) => action.id === activeReviewSurfaceActionId) ?? stageReviewSurfaceActions[0] ?? null;
  const relevantActionDeckLanes =
    actionDeck?.lanes.filter((lane) => (selectedDeliveryStage ? (lane.deliveryChainStageIds ?? []).includes(selectedDeliveryStage.id) : false)) ?? [];
  const relevantActionDeckActionIds = [...new Set(relevantActionDeckLanes.flatMap((lane) => lane.actionIds))];
  const relevantActionDeckWindowIds = [...new Set(relevantActionDeckLanes.flatMap((lane) => lane.windowIds ?? []))];
  const relevantActionDeckBoardIds = [...new Set(relevantActionDeckLanes.flatMap((lane) => lane.orchestrationBoardIds ?? []))];
  const relevantActionDeckSequenceIds = [...new Set(relevantActionDeckLanes.flatMap((lane) => (lane.companionSequences ?? []).map((sequence) => sequence.id)))];
  const {
    reviewSurfaceActionById,
    relevantCompanionSequences,
    activeCompanionSequence,
    activeCompanionSequenceCurrentStepIndex,
    resolvedCompanionReviewPaths,
    activeCompanionReviewPath,
    relevantCompanionRouteStates,
    activeCompanionRouteState,
    relevantCompanionPathHandoffs,
    activeCompanionPathHandoff,
    relevantCompanionRouteHistoryEntries,
    activeCompanionRouteHistoryEntry
  } = resolveCompanionRouteContext({
    lanes: relevantActionDeckLanes,
    contextReviewSurfaceActions: stageReviewSurfaceActions,
    allReviewSurfaceActions: reviewSurfaceActions.filter(isReviewCoverageAction),
    activeReviewSurfaceActionId: activeStageReviewSurfaceAction?.id ?? null,
    companionRouteStateId: activeCompanionRouteStateId,
    companionSequenceId: activeCompanionSequenceId,
    companionRouteHistoryEntryId: activeCompanionRouteHistoryEntryId,
    companionPathHandoffId: activeCompanionPathHandoffId,
    additionalCompanionRouteHistoryEntries: companionRouteHistoryEntries
  });
  const replayRestoreEntry = activeCompanionRouteHistoryEntry ?? relevantCompanionRouteHistoryEntries[0] ?? null;
  const replayRestoreRouteState =
    (replayRestoreEntry?.routeStateId
      ? relevantCompanionRouteStates.find((routeState) => routeState.id === replayRestoreEntry.routeStateId) ?? null
      : null) ??
    activeCompanionRouteState ??
    null;
  const replayRestoreSequence =
    (replayRestoreEntry?.sequenceId
      ? relevantCompanionSequences.find((sequence) => sequence.id === replayRestoreEntry.sequenceId) ?? null
      : null) ??
    activeCompanionSequence ??
    null;
  const replayRestoreAction =
    (replayRestoreEntry ? reviewSurfaceActionById.get(replayRestoreEntry.targetActionId) ?? null : null) ??
    (replayRestoreRouteState ? reviewSurfaceActionById.get(replayRestoreRouteState.currentActionId) ?? null : null) ??
    activeStageReviewSurfaceAction ??
    null;
  const replayRestoreStage =
    (replayRestoreEntry?.deliveryChainStageId ? selectStudioReleaseDeliveryChainStage(pipeline, replayRestoreEntry.deliveryChainStageId) : null) ??
    (replayRestoreAction?.deliveryChainStageId ? selectStudioReleaseDeliveryChainStage(pipeline, replayRestoreAction.deliveryChainStageId) : null) ??
    (replayRestoreRouteState?.deliveryChainStageId ? selectStudioReleaseDeliveryChainStage(pipeline, replayRestoreRouteState.deliveryChainStageId) : null) ??
    selectedDeliveryStage;
  const replayRestoreWindow =
    (replayRestoreEntry?.windowId ? windowing?.roster.windows.find((entry) => entry.id === replayRestoreEntry.windowId) ?? null : null) ??
    (replayRestoreAction?.windowId ? windowing?.roster.windows.find((entry) => entry.id === replayRestoreAction.windowId) ?? null : null) ??
    (replayRestoreRouteState?.windowId ? windowing?.roster.windows.find((entry) => entry.id === replayRestoreRouteState.windowId) ?? null : null) ??
    null;
  const replayRestoreLane =
    (replayRestoreEntry?.sharedStateLaneId
      ? windowing?.sharedState.lanes.find((entry) => entry.id === replayRestoreEntry.sharedStateLaneId) ?? null
      : null) ??
    (replayRestoreAction?.sharedStateLaneId
      ? windowing?.sharedState.lanes.find((entry) => entry.id === replayRestoreAction.sharedStateLaneId) ?? null
      : null) ??
    (replayRestoreRouteState?.sharedStateLaneId
      ? windowing?.sharedState.lanes.find((entry) => entry.id === replayRestoreRouteState.sharedStateLaneId) ?? null
      : null) ??
    null;
  const replayRestoreBoard =
    (replayRestoreEntry?.orchestrationBoardId
      ? windowing?.orchestration.boards.find((entry) => entry.id === replayRestoreEntry.orchestrationBoardId) ?? null
      : null) ??
    (replayRestoreAction?.orchestrationBoardId
      ? windowing?.orchestration.boards.find((entry) => entry.id === replayRestoreAction.orchestrationBoardId) ?? null
      : null) ??
    (replayRestoreRouteState?.orchestrationBoardId
      ? windowing?.orchestration.boards.find((entry) => entry.id === replayRestoreRouteState.orchestrationBoardId) ?? null
      : null) ??
    null;
  const replayRestoreMapping =
    (replayRestoreEntry?.observabilityMappingId
      ? windowing?.observability.mappings.find((entry) => entry.id === replayRestoreEntry.observabilityMappingId) ?? null
      : null) ??
    (replayRestoreAction?.observabilityMappingId
      ? windowing?.observability.mappings.find((entry) => entry.id === replayRestoreAction.observabilityMappingId) ?? null
      : null) ??
    (replayRestoreRouteState?.observabilityMappingId
      ? windowing?.observability.mappings.find((entry) => entry.id === replayRestoreRouteState.observabilityMappingId) ?? null
      : null) ??
    activeStageMapping;
  const replayScenarioPacks: ReplayScenarioPackItem[] = relevantActionDeckLanes.flatMap((lane) => {
    if (!lane.replayScenarioPack) {
      return [];
    }

    const entries = relevantCompanionRouteHistoryEntries.filter((entry) =>
      (lane.companionRouteHistory ?? []).some((laneEntry) => laneEntry.id === entry.id)
    );

    return entries.length ? [{ lane, pack: lane.replayScenarioPack, entries }] : [];
  });
  const activeReplayScenarioPack =
    replayScenarioPacks.find((item) => item.entries.some((entry) => entry.id === replayRestoreEntry?.id)) ?? replayScenarioPacks[0] ?? null;
  const activeReplayScenarioEntry =
    (replayRestoreEntry && activeReplayScenarioPack?.entries.find((entry) => entry.id === replayRestoreEntry.id)) ??
    activeReplayScenarioPack?.entries[0] ??
    null;
  const activeReplayScenarioPackEntries = activeReplayScenarioPack?.entries ?? [];
  const activeReplayScenarioPackEntryById = new Map(activeReplayScenarioPackEntries.map((entry) => [entry.id, entry]));
  const activeReplayScenarioAcceptanceChecks = activeReplayScenarioEntry?.acceptanceChecks ?? [];
  const activeReplayScenarioAcceptanceReady = activeReplayScenarioAcceptanceChecks.filter((check) => check.state === "ready").length;
  const activeReplayScenarioEvidenceItems = activeReplayScenarioEntry?.scenarioEvidenceItems ?? [];
  const activeReplayScenarioEvidenceReady = activeReplayScenarioEvidenceItems.filter((item) => item.posture !== "pending").length;
  const activeReplayScenarioContinuityChecks = activeReplayScenarioEntry?.evidenceContinuityChecks ?? [];
  const activeReplayScenarioContinuityReady = activeReplayScenarioContinuityChecks.filter((check) => check.state === "ready").length;
  const activeReplayScenarioScreenshotItems = activeReplayScenarioEntry?.screenshotReviewItems ?? [];
  const activeReplayScenarioScreenshotReady = activeReplayScenarioScreenshotItems.filter((item) => item.posture !== "required").length;
  const activeReplayScenarioEvidenceItemById = new Map(activeReplayScenarioEvidenceItems.map((item) => [item.id, item]));
  const activeReplayScenarioScreenshotItemById = new Map(activeReplayScenarioScreenshotItems.map((item) => [item.id, item]));
  const activeReplayScenarioPackAcceptanceChecks = activeReplayScenarioPackEntries.flatMap((entry) => entry.acceptanceChecks ?? []);
  const activeReplayScenarioPackAcceptanceReady = activeReplayScenarioPackAcceptanceChecks.filter((check) => check.state === "ready").length;
  const activeReplayScenarioPackEvidenceItems = activeReplayScenarioPackEntries.flatMap((entry) => entry.scenarioEvidenceItems ?? []);
  const activeReplayScenarioPackEvidenceReady = activeReplayScenarioPackEvidenceItems.filter((item) => item.posture !== "pending").length;
  const activeReplayScenarioPackContinuityChecks = activeReplayScenarioPackEntries.flatMap((entry) => entry.evidenceContinuityChecks ?? []);
  const activeReplayScenarioPackContinuityReady = activeReplayScenarioPackContinuityChecks.filter((check) => check.state === "ready").length;
  const activeReplayScenarioPackScreenshotItems = activeReplayScenarioPackEntries.flatMap((entry) => entry.screenshotReviewItems ?? []);
  const activeReplayScenarioPackScreenshotReady = activeReplayScenarioPackScreenshotItems.filter((item) => item.posture !== "required").length;
  const activeReplayScenarioPackEvidenceItemById = new Map(activeReplayScenarioPackEvidenceItems.map((item) => [item.id, item]));
  const activeReplayScenarioPackScreenshotItemById = new Map(activeReplayScenarioPackScreenshotItems.map((item) => [item.id, item]));
  const activeReplayScenarioPackContinuityHandoffs: ReplayScenarioPackContinuityHandoff[] =
    activeReplayScenarioPack?.pack.continuityHandoffs ?? [];
  const activeReplayScenarioPackContinuityHandoffReady = activeReplayScenarioPackContinuityHandoffs.filter(
    (handoff) => handoff.state === "ready"
  ).length;
  const activeReplayScenarioPackContinuityHandoffTone = resolveReplayProgressTone(
    activeReplayScenarioPackContinuityHandoffReady,
    activeReplayScenarioPackContinuityHandoffs.length
  );
  const activeReplayScenarioPackContinuityHandoffStatusLabel = formatReplayEvidenceContinuityStatusLabel(
    activeReplayScenarioPackContinuityHandoffReady,
    activeReplayScenarioPackContinuityHandoffs.length
  );
  const activeReplayScenarioPackContinuityLinkedEvidenceCount = new Set(
    activeReplayScenarioPackContinuityHandoffs.flatMap((handoff) => handoff.linkedEvidenceItemIds)
  ).size;
  const activeReplayScenarioPackContinuityLinkedCaptureCount = new Set(
    activeReplayScenarioPackContinuityHandoffs.flatMap((handoff) => handoff.linkedScreenshotIds)
  ).size;
  const activeReplayScenarioTone = resolveReplayScenarioTone(
    activeReplayScenarioAcceptanceReady,
    activeReplayScenarioAcceptanceChecks.length,
    activeReplayScenarioScreenshotReady,
    activeReplayScenarioScreenshotItems.length,
    activeReplayScenarioEvidenceReady,
    activeReplayScenarioEvidenceItems.length,
    activeReplayScenarioContinuityReady,
    activeReplayScenarioContinuityChecks.length
  );
  const activeReplayScenarioStatusLabel = formatReplayScenarioStatusLabel(
    activeReplayScenarioAcceptanceReady,
    activeReplayScenarioAcceptanceChecks.length,
    activeReplayScenarioScreenshotReady,
    activeReplayScenarioScreenshotItems.length,
    activeReplayScenarioEvidenceReady,
    activeReplayScenarioEvidenceItems.length,
    activeReplayScenarioContinuityReady,
    activeReplayScenarioContinuityChecks.length
  );
  const activeReplayScenarioPackTone = resolveReplayScenarioTone(
    activeReplayScenarioPackAcceptanceReady,
    activeReplayScenarioPackAcceptanceChecks.length,
    activeReplayScenarioPackScreenshotReady,
    activeReplayScenarioPackScreenshotItems.length,
    activeReplayScenarioPackEvidenceReady,
    activeReplayScenarioPackEvidenceItems.length,
    activeReplayScenarioPackContinuityReady,
    activeReplayScenarioPackContinuityChecks.length
  );
  const activeReplayScenarioPackStatusLabel = formatReplayScenarioStatusLabel(
    activeReplayScenarioPackAcceptanceReady,
    activeReplayScenarioPackAcceptanceChecks.length,
    activeReplayScenarioPackScreenshotReady,
    activeReplayScenarioPackScreenshotItems.length,
    activeReplayScenarioPackEvidenceReady,
    activeReplayScenarioPackEvidenceItems.length,
    activeReplayScenarioPackContinuityReady,
    activeReplayScenarioPackContinuityChecks.length
  );
  const activeReplayScenarioEvidenceStatusLabel = formatReplayEvidencePackStatusLabel(
    activeReplayScenarioEvidenceReady,
    activeReplayScenarioEvidenceItems.length
  );
  const activeReplayScenarioContinuityStatusLabel = formatReplayEvidenceContinuityStatusLabel(
    activeReplayScenarioContinuityReady,
    activeReplayScenarioContinuityChecks.length
  );
  const activeReplayScenarioEvidenceBundleTone = resolveReplayEvidenceBundleTone(
    activeReplayScenarioEvidenceReady,
    activeReplayScenarioEvidenceItems.length,
    activeReplayScenarioContinuityReady,
    activeReplayScenarioContinuityChecks.length
  );
  const activeReplayScenarioEvidenceBundleStatusLabel = formatReplayEvidenceBundleStatusLabel(
    activeReplayScenarioEvidenceReady,
    activeReplayScenarioEvidenceItems.length,
    activeReplayScenarioContinuityReady,
    activeReplayScenarioContinuityChecks.length
  );
  const activeReplayScenarioPackEvidenceBundleStatusLabel = formatReplayEvidenceBundleStatusLabel(
    activeReplayScenarioPackEvidenceReady,
    activeReplayScenarioPackEvidenceItems.length,
    activeReplayScenarioPackContinuityReady,
    activeReplayScenarioPackContinuityChecks.length
  );
  const activeReplayScenarioReviewerPosture =
    activeReplayScenarioEntry?.reviewerPosture ?? activeReplayScenarioPack?.pack.reviewerPosture ?? "No reviewer posture";
  const activeReplayScenarioEvidencePosture =
    activeReplayScenarioEntry?.evidencePosture ?? activeReplayScenarioPack?.pack.evidencePosture ?? "No evidence posture";
  const activeReplayScenarioRouteLabel = replayRestoreRouteState?.label ?? activeReplayScenarioEntry?.routeStateId ?? "No route snapshot";
  const createReplayScenarioPassCards = ({
    entry,
    routeLabel,
    routeReady,
    readyChecks,
    totalChecks,
    readyEvidence,
    totalEvidence,
    readyContinuity,
    totalContinuity,
    readyScreenshots,
    totalScreenshots
  }: {
    entry: StudioCommandCompanionRouteHistoryEntry;
    routeLabel: string;
    routeReady: boolean;
    readyChecks: number;
    totalChecks: number;
    readyEvidence: number;
    totalEvidence: number;
    readyContinuity: number;
    totalContinuity: number;
    readyScreenshots: number;
    totalScreenshots: number;
  }): ReplayScenarioPassCard[] => [
    {
      id: `${entry.id}-pass-route`,
      label: "Replay route",
      status: routeReady ? "Route restored" : "Route staging",
      detail: routeReady
        ? `${routeLabel} / ${formatCompanionRouteTransitionKind(entry.transitionKind)}`
        : "Route snapshot, replay target, or sequence context is still incomplete.",
      tone: routeReady ? "positive" : routeLabel !== "No route snapshot" ? "neutral" : "warning"
    },
    {
      id: `${entry.id}-pass-checks`,
      label: "Pass checks",
      status:
        totalChecks > 0 && readyChecks === totalChecks
          ? "Checks ready"
          : readyChecks > 0
            ? "Checks in review"
            : "Checks blocked",
      detail: `${readyChecks} / ${totalChecks} acceptance checks ready`,
      tone: resolveReplayProgressTone(readyChecks, totalChecks)
    },
    {
      id: `${entry.id}-pass-proof`,
      label: "Proof bundle",
      status: formatReplayEvidenceBundleStatusLabel(readyEvidence, totalEvidence, readyContinuity, totalContinuity),
      detail: `${readyEvidence} / ${totalEvidence} evidence items staged · ${readyContinuity} / ${totalContinuity} continuity anchors aligned`,
      tone: resolveReplayEvidenceBundleTone(readyEvidence, totalEvidence, readyContinuity, totalContinuity)
    },
    {
      id: `${entry.id}-pass-capture`,
      label: "Capture set",
      status:
        totalScreenshots > 0 && readyScreenshots === totalScreenshots
          ? "Capture set ready"
          : readyScreenshots > 0
            ? "Capture staging"
            : "Capture blocked",
      detail: `${readyScreenshots} / ${totalScreenshots} screenshot targets staged`,
      tone: resolveReplayProgressTone(readyScreenshots, totalScreenshots)
    }
  ];
  const activeReplayScenarioPassCards = activeReplayScenarioEntry
    ? createReplayScenarioPassCards({
        entry: activeReplayScenarioEntry,
        routeLabel: activeReplayScenarioRouteLabel,
        routeReady: Boolean(replayRestoreEntry && replayRestoreSequence && replayRestoreAction && replayRestoreRouteState),
        readyChecks: activeReplayScenarioAcceptanceReady,
        totalChecks: activeReplayScenarioAcceptanceChecks.length,
        readyEvidence: activeReplayScenarioEvidenceReady,
        totalEvidence: activeReplayScenarioEvidenceItems.length,
        readyContinuity: activeReplayScenarioContinuityReady,
        totalContinuity: activeReplayScenarioContinuityChecks.length,
        readyScreenshots: activeReplayScenarioScreenshotReady,
        totalScreenshots: activeReplayScenarioScreenshotItems.length
      })
    : [];
  const activeReplayScenarioCaptureGroups = createReplayScreenshotCaptureGroups({
    screenshotItems: activeReplayScenarioScreenshotItems,
    evidenceItems: activeReplayScenarioEvidenceItems
  });
  const activeReplayScenarioRelevantContinuityHandoffs = activeReplayScenarioPackContinuityHandoffs.filter(
    (handoff) =>
      handoff.linkedEvidenceItemIds.some((itemId) => activeReplayScenarioEvidenceItemById.has(itemId)) ||
      handoff.linkedScreenshotIds.some((itemId) => activeReplayScenarioScreenshotItemById.has(itemId))
  );
  const activeReplayScenarioEvidenceTraces = createReplayEvidenceTraces({
    captureGroups: activeReplayScenarioCaptureGroups,
    evidenceItems: activeReplayScenarioEvidenceItems,
    screenshotItems: activeReplayScenarioScreenshotItems,
    continuityHandoffs: activeReplayScenarioRelevantContinuityHandoffs
  });
  const activeReplayScenarioReadyCaptureGroupCount = activeReplayScenarioCaptureGroups.filter((group) => group.tone === "positive").length;
  const activeReplayScenarioLinkedProofCount = countReplayLinkedProofItems(activeReplayScenarioCaptureGroups);
  const activeReplayScenarioPassRecords = activeReplayScenarioEntry
    ? createReplayScenarioPassRecords({
        entry: activeReplayScenarioEntry,
        passCards: activeReplayScenarioPassCards,
        routeLabel: activeReplayScenarioRouteLabel,
        reviewerPosture: activeReplayScenarioReviewerPosture,
        evidenceBundleStatusLabel: activeReplayScenarioEvidenceBundleStatusLabel,
        captureGroups: activeReplayScenarioCaptureGroups,
        linkedProofCount: activeReplayScenarioLinkedProofCount
      })
    : [];
  const activeReplayScenarioReadyPassCount = activeReplayScenarioPassCards.filter((pass) => pass.tone === "positive").length;
  const activeReplayScenarioPackReadyPassCount = activeReplayScenarioPackEntries.reduce((total, entry) => {
    const targetAction = reviewSurfaceActionById.get(entry.targetActionId) ?? null;
    const scenarioRouteState = entry.routeStateId
      ? relevantCompanionRouteStates.find((routeState) => routeState.id === entry.routeStateId) ?? null
      : null;
    const readyChecks = entry.acceptanceChecks?.filter((check) => check.state === "ready").length ?? 0;
    const evidenceItems = entry.scenarioEvidenceItems ?? [];
    const readyEvidence = evidenceItems.filter((item) => item.posture !== "pending").length;
    const continuityChecks = entry.evidenceContinuityChecks ?? [];
    const readyContinuity = continuityChecks.filter((check) => check.state === "ready").length;
    const screenshotItems = entry.screenshotReviewItems ?? [];
    const readyScreenshots = screenshotItems.filter((item) => item.posture !== "required").length;
    const passCards = createReplayScenarioPassCards({
      entry,
      routeLabel: scenarioRouteState?.label ?? entry.routeStateId ?? "No route snapshot",
      routeReady: Boolean(scenarioRouteState && entry.sequenceId && targetAction),
      readyChecks,
      totalChecks: entry.acceptanceChecks?.length ?? 0,
      readyEvidence,
      totalEvidence: evidenceItems.length,
      readyContinuity,
      totalContinuity: continuityChecks.length,
      readyScreenshots,
      totalScreenshots: screenshotItems.length
    });

    return total + passCards.filter((pass) => pass.tone === "positive").length;
  }, 0);
  const activeReplayScenarioPackCaptureMetrics = activeReplayScenarioPackEntries.reduce(
    (totals, entry) => {
      const captureGroups = createReplayScreenshotCaptureGroups({
        screenshotItems: entry.screenshotReviewItems ?? [],
        evidenceItems: entry.scenarioEvidenceItems ?? []
      });

      return {
        groupCount: totals.groupCount + captureGroups.length,
        readyGroupCount: totals.readyGroupCount + captureGroups.filter((group) => group.tone === "positive").length,
        linkedProofCount: totals.linkedProofCount + countReplayLinkedProofItems(captureGroups)
      };
    },
    {
      groupCount: 0,
      readyGroupCount: 0,
      linkedProofCount: 0
    }
  );
  const activeReplayScenarioPackTotalPassCount = activeReplayScenarioPackEntries.length * 4;
  const replayAcceptanceChecksReady =
    Number(Boolean(replayRestoreEntry)) +
    Number(Boolean(replayRestoreSequence?.steps.length)) +
    Number(Boolean(replayRestoreAction)) +
    Number(Boolean(replayRestoreWindow && replayRestoreLane && replayRestoreBoard && replayRestoreMapping)) +
    1;
  const activeReplayEvidenceTrace =
    activeReplayScenarioEvidenceTraces.find((trace) => trace.id === activeReplayEvidenceTraceId) ??
    activeReplayScenarioEvidenceTraces[0] ??
    null;
  const activeReplayEvidenceTraceEvidenceIds = new Set(activeReplayEvidenceTrace?.evidenceItemIds ?? []);
  const activeReplayEvidenceTraceScreenshotIds = new Set(activeReplayEvidenceTrace?.screenshotIds ?? []);
  const activeReplayEvidenceTraceContinuityHandoffIds = new Set(activeReplayEvidenceTrace?.continuityHandoffIds ?? []);
  const activeReplayEvidenceTracePackOnlyLinkCount =
    (activeReplayEvidenceTrace?.hiddenEvidenceItemCount ?? 0) + (activeReplayEvidenceTrace?.hiddenScreenshotCount ?? 0);
  const hasActiveReplayEvidenceTraceFilter = Boolean(activeReplayEvidenceTrace && activeReplayEvidenceTrace.kind !== "all");
  const panelClassName = [
    nested ? "delivery-chain-workspace delivery-chain-workspace--nested" : "surface card delivery-chain-workspace",
    compact ? "delivery-chain-workspace--compact" : ""
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    setActiveReplayEvidenceTraceId(ALL_REPLAY_EVIDENCE_TRACE_ID);
  }, [activeReplayScenarioEntry?.id]);

  const toggleReplayEvidenceTrace = (traceId: string) => {
    setActiveReplayEvidenceTraceId((currentTraceId) =>
      currentTraceId === traceId ? ALL_REPLAY_EVIDENCE_TRACE_ID : traceId
    );
  };

  return (
    <article className={panelClassName}>
      <div className="card-header card-header--stack">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title ?? "Delivery-chain Workspace"}</h2>
          <p>
            {summary ??
              "Stage Explorer ties the operator board, delivery stage, review artifacts, replay scenario packs, screenshot pass records, capture review flows, proof-linked evidence bundles, promotion/publish/rollback flow, blockers, handoff posture, and observability mapping into one local-only review surface."}
          </p>
        </div>
        <div className="windowing-card__meta">
          <span className="windowing-badge windowing-badge--active">{selectedDeliveryStage?.label ?? "No delivery stage"}</span>
          <span className="windowing-badge">
            {selectedDeliveryStage ? `${selectedDeliveryStage.phase} / ${selectedDeliveryStage.status}` : "No delivery posture"}
          </span>
          <span className="windowing-badge">
            {selectedReviewerQueue ? `${selectedReviewerQueue.label} / ack ${selectedReviewerQueue.acknowledgementState}` : "No reviewer queue"}
          </span>
          <span className="windowing-badge">
            {activeStageMapping ? `${formatReviewPostureRelationship(activeStageMapping.relationship)} / ${activeStageMapping.routeId}` : "No observability mapping"}
          </span>
        </div>
      </div>

      <div className="delivery-chain-workspace__metrics">
        <div className="foundation-pill">
          <span>Current stage</span>
          <strong>{currentDeliveryStage?.label ?? "Unavailable"}</strong>
        </div>
        <div className="foundation-pill">
          <span>Selected owner</span>
          <strong>{selectedDeliveryStage?.owner ?? "Unavailable"}</strong>
        </div>
        <div className="foundation-pill">
          <span>Artifact groups</span>
          <strong>{selectedDeliveryStage?.artifactGroups.length ?? 0} groups</strong>
        </div>
        <div className="foundation-pill">
          <span>Observability paths</span>
          <strong>{stageMappings.length} mapped surfaces</strong>
        </div>
      </div>

      <div className="panel-title-row">
        <h3>Stage Explorer</h3>
        <span>{pipeline.deliveryChain.stages.length} stages</span>
      </div>

      <div className="delivery-chain-workspace__stage-strip">
        {pipeline.deliveryChain.stages.map((stage) => {
          const stagePipeline = pipeline.stages.find((entry) => entry.id === stage.pipelineStageId) ?? null;
          const stageQueue = stagePipeline ? selectStudioReleaseReviewerQueue(pipeline, stagePipeline) ?? null : null;
          const active = stage.id === selectedDeliveryStage?.id;

          return (
            <button
              key={stage.id}
              type="button"
              className={`workflow-step-card workflow-step-card--${resolveStageTone(stage.status)}${active ? " workflow-step-card--active" : ""}`}
              onClick={() => {
                setLocalSelectedStageId(stage.id);
                onSelectStage?.(stage.id);
              }}
            >
              <div className="workflow-step-card__meta">
                <span>{stage.phase}</span>
                <strong>{stage.status}</strong>
              </div>
              <h3>{stage.label}</h3>
              <p>{stage.posture}</p>
              <div className="windowing-card__meta">
                <span className={`windowing-badge${active ? " windowing-badge--active" : ""}`}>{stage.owner}</span>
                <span className="windowing-badge">{stage.artifactGroups.length} groups</span>
                <span className="windowing-badge">{stage.blockedBy.length} blockers</span>
                <span className="windowing-badge">{stageQueue ? stageQueue.acknowledgementState : "no queue"}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="panel-title-row">
        <h3>Review Flow Ladder</h3>
        <span>{reviewFlowLadder.length} staged checkpoints</span>
      </div>

      <div className="workflow-step-grid">
        {reviewFlowLadder.map(({ stage, pipelineStage, reviewerQueue, closeoutWindow, observabilityPaths }) => {
          const active = stage.id === selectedDeliveryStage?.id;

          return (
            <article
              key={`${stage.id}-ladder`}
              className={`workflow-step-card workflow-step-card--${resolveStageTone(stage.status)}${active ? " workflow-step-card--active" : ""}`}
            >
              <div className="workflow-step-card__meta">
                <span>{stage.phase}</span>
                <strong>{stage.status}</strong>
              </div>
              <h3>{stage.label}</h3>
              <p>
                Review Flow Ladder keeps queue posture, baton posture, closeout state, and mapped window coverage visible for every delivery-chain stage
                instead of making the operator board the only obvious checkpoint.
              </p>
              <div className="windowing-card__meta">
                <span className={`windowing-badge${active ? " windowing-badge--active" : ""}`}>{stage.owner}</span>
                <span className="windowing-badge">{reviewerQueue ? reviewerQueue.acknowledgementState : "no queue"}</span>
                <span className="windowing-badge">{observabilityPaths} mapped surfaces</span>
              </div>
              <div className="workflow-readiness-list">
                <div className={`workflow-readiness-line workflow-readiness-line--${resolveReviewerQueueTone(reviewerQueue?.status ?? "escalated")}`}>
                  <span>Reviewer queue</span>
                  <strong>{reviewerQueue ? `${reviewerQueue.status} / ${reviewerQueue.owner}` : "No reviewer queue"}</strong>
                </div>
                <div className={`workflow-readiness-line workflow-readiness-line--${resolveAcknowledgementTone(reviewerQueue?.acknowledgementState ?? "blocked")}`}>
                  <span>Acknowledgement</span>
                  <strong>{reviewerQueue?.acknowledgementState ?? "Unavailable"}</strong>
                </div>
                <div className={`workflow-readiness-line workflow-readiness-line--${resolveBatonTone(pipelineStage?.handoff.batonState ?? "blocked")}`}>
                  <span>Decision baton</span>
                  <strong>{pipelineStage ? `${pipelineStage.handoff.batonState} / ${pipelineStage.handoff.targetOwner}` : "Unavailable"}</strong>
                </div>
                <div className={`workflow-readiness-line workflow-readiness-line--${resolveCloseoutWindowTone(closeoutWindow?.state ?? "blocked")}`}>
                  <span>Closeout window</span>
                  <strong>{closeoutWindow ? `${closeoutWindow.state} / ${closeoutWindow.deadlineLabel}` : "Unavailable"}</strong>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="delivery-chain-workspace__detail-grid">
        <article className="windowing-summary-card windowing-summary-card--active">
          <span>Selected Delivery Stage</span>
          <strong>{selectedDeliveryStage?.label ?? "No selected stage"}</strong>
          <p>
            {selectedDeliveryStage?.summary ??
              "Select a delivery-chain stage to inspect ownership, linked artifacts, review posture, and downstream gates."}
          </p>
          <div className="workflow-readiness-list">
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveStageTone(selectedDeliveryStage?.status ?? "blocked")}`}>
              <span>Stage posture</span>
              <strong>{selectedDeliveryStage ? `${selectedDeliveryStage.status} / ${selectedDeliveryStage.posture}` : "Unavailable"}</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--neutral">
              <span>Pipeline board</span>
              <strong>{selectedPipelineStage?.label ?? "Unavailable"}</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--neutral">
              <span>Owner / queue</span>
              <strong>{selectedReviewerQueue ? `${selectedDeliveryStage?.owner ?? "owner"} / ${selectedReviewerQueue.owner}` : "Unavailable"}</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--neutral">
              <span>Lifecycle / slots</span>
              <strong>
                {selectedPipelineStage
                  ? `${selectedPipelineStage.linkedLifecycleStages.length} lifecycle / ${selectedPipelineStage.linkedSlotIds.length} slot`
                  : "Unavailable"}
              </strong>
            </div>
          </div>
          {!compact && selectedPipelineStage ? (
            <div className="windowing-preview-list">
              <div className="windowing-preview-line">
                <span>Linked lifecycle</span>
                <strong>{selectedPipelineStage.linkedLifecycleStages.join(" / ")}</strong>
              </div>
              <div className="windowing-preview-line">
                <span>Linked slots</span>
                <strong>{selectedPipelineStage.linkedSlotIds.join(" / ")}</strong>
              </div>
            </div>
          ) : null}
        </article>

        <article className="windowing-summary-card">
          <span>Related Review Surfaces</span>
          <strong>{selectedPipelineStage?.packet.label ?? "No review packet"}</strong>
          <p>
            {selectedPipelineStage
              ? "Delivery-chain stage selection now resolves the exact packet, queue, handoff, closeout, escalation window, and closeout window that shape the current review posture."
              : "No review surface metadata is available for the selected stage."}
          </p>
          <div className="workflow-readiness-list">
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveReviewerQueueTone(selectedReviewerQueue?.status ?? "escalated")}`}>
              <span>Reviewer queue</span>
              <strong>{selectedReviewerQueue ? `${selectedReviewerQueue.status} / ${selectedReviewerQueue.owner}` : "Unavailable"}</strong>
            </div>
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveAcknowledgementTone(selectedPipelineStage?.handoff.acknowledgementState ?? "blocked")}`}>
              <span>Decision handoff</span>
              <strong>{selectedPipelineStage ? `${selectedPipelineStage.handoff.batonState} / ${selectedPipelineStage.handoff.acknowledgementState}` : "Unavailable"}</strong>
            </div>
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveSealTone(selectedPipelineStage?.closeout.sealingState ?? "blocked")}`}>
              <span>Evidence closeout</span>
              <strong>{selectedPipelineStage ? `${selectedPipelineStage.closeout.sealingState} / ${selectedPipelineStage.closeout.owner}` : "Unavailable"}</strong>
            </div>
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveEscalationTone(selectedEscalationWindow?.state ?? "blocked")}`}>
              <span>Escalation window</span>
              <strong>{selectedEscalationWindow ? `${selectedEscalationWindow.state} / ${selectedEscalationWindow.deadlineLabel}` : "Unavailable"}</strong>
            </div>
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveCloseoutWindowTone(selectedCloseoutWindow?.state ?? "blocked")}`}>
              <span>Closeout window</span>
              <strong>{selectedCloseoutWindow ? `${selectedCloseoutWindow.state} / ${selectedCloseoutWindow.deadlineLabel}` : "Unavailable"}</strong>
            </div>
          </div>
          {!compact && selectedReviewerQueue ? (
            <div className="windowing-preview-list">
              <div className="windowing-preview-line">
                <span>Active queue entry</span>
                <strong>{activeQueueEntry ? `${activeQueueEntry.owner} / ${activeQueueEntry.status}` : "Unavailable"}</strong>
              </div>
              <div className="windowing-preview-line">
                <span>Review packet</span>
                <strong>{selectedPipelineStage ? `${selectedPipelineStage.packet.status} / ${selectedPipelineStage.packet.owner}` : "Unavailable"}</strong>
              </div>
            </div>
          ) : null}
        </article>

        <article className="windowing-summary-card">
          <span>Observability Mapping</span>
          <strong>
            {activeStageMapping
              ? `${activeStageMapping.label} / ${formatReviewPostureRelationship(activeStageMapping.relationship)}`
              : "No mapped review posture"}
          </strong>
          <p>
            {activeStageMapping?.summary ??
              "No route, window, lane, board, and focused-slot mapping is currently attached to the selected delivery stage."}
          </p>
          <div className="workflow-readiness-list">
            <div className="workflow-readiness-line workflow-readiness-line--neutral">
              <span>Mapped surfaces</span>
              <strong>{stageMappings.length} posture paths</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--neutral">
              <span>Primary owner</span>
              <strong>{activeStageMapping?.owner ?? selectedDeliveryStage?.owner ?? "Unavailable"}</strong>
            </div>
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveAcknowledgementTone(activeStageMapping?.reviewPosture.acknowledgementState ?? "blocked")}`}>
              <span>Queue / acknowledgement</span>
              <strong>
                {activeStageMapping
                  ? `${activeStageMapping.reviewPosture.reviewerQueueId} / ${activeStageMapping.reviewPosture.acknowledgementState}`
                  : "Unavailable"}
              </strong>
            </div>
          </div>
          {stageMappings.length > 0 ? (
            <div className="windowing-preview-list">
              {(compact ? stageMappings.slice(0, 2) : stageMappings).map((mapping) => {
                const mappingWindow = windowing?.roster.windows.find((entry) => entry.id === mapping.windowId);
                const mappingLane = windowing?.sharedState.lanes.find((lane) => lane.id === mapping.sharedStateLaneId);
                const mappingBoard = windowing?.orchestration.boards.find((board) => board.id === mapping.orchestrationBoardId);

                return (
                  <div key={mapping.id} className="windowing-preview-line windowing-preview-line--stacked">
                    <span>{mapping.label}</span>
                    <strong>
                      {mapping.routeId} / {mappingWindow?.label ?? mapping.windowId}
                    </strong>
                    <p>
                      {formatReviewPostureRelationship(mapping.relationship)} / {mappingLane?.label ?? mapping.sharedStateLaneId} /{" "}
                      {mappingBoard?.label ?? mapping.orchestrationBoardId} / {mapping.focusedSlotId}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : null}
        </article>
      </div>

      <div className="delivery-chain-workspace__explorer-grid">
        {actionDeck ? (
          <article className="windowing-summary-card">
            <span>Command-surface Action Deck</span>
            <strong>{actionDeck.label}</strong>
            <p>
              {relevantActionDeckLanes.length > 0
                ? "The selected delivery stage is covered by the same review-deck action deck that drives workspace entry, windows observability, and local handoff stabilization."
                : actionDeck.summary}
            </p>
            <div className="workflow-readiness-list">
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Stage lanes</span>
                <strong>{relevantActionDeckLanes.length} matching lanes</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Actions</span>
                <strong>{relevantActionDeckActionIds.length} linked actions</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Window coverage</span>
                <strong>{relevantActionDeckWindowIds.length} windows / {relevantActionDeckBoardIds.length} boards</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Companion sequences</span>
                <strong>{relevantActionDeckSequenceIds.length} ordered sequences</strong>
              </div>
            </div>
            {relevantActionDeckLanes.length > 0 ? (
              <div className="windowing-preview-list">
                {relevantActionDeckLanes.map((lane) => {
                  const coveredWindows = (lane.windowIds ?? [])
                    .map((windowId) => windowing?.roster.windows.find((entry) => entry.id === windowId)?.label ?? windowId)
                    .join(" / ");
                  const coveredBoards = (lane.orchestrationBoardIds ?? [])
                    .map((boardId) => windowing?.orchestration.boards.find((entry) => entry.id === boardId)?.label ?? boardId)
                    .join(" / ");

                  return (
                    <div key={lane.id} className="windowing-preview-line windowing-preview-line--stacked">
                      <span>{lane.label}</span>
                      <strong>{lane.actionIds.length} actions / {(lane.deliveryChainStageIds ?? []).length} stages</strong>
                      <p>{lane.summary}</p>
                      <div className="trace-note-links">
                        <span className={`windowing-badge${lane.tone === "positive" ? " windowing-badge--active" : ""}`}>
                          {coveredWindows || "No mapped windows"}
                        </span>
                        <span className="windowing-badge">{coveredBoards || "No mapped boards"}</span>
                        <span className="windowing-badge">{(lane.companionSequences ?? []).length} companion sequences</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </article>
        ) : null}

        {stageReviewSurfaceActions.length > 0 ? (
          <article className="windowing-summary-card">
            <span>Review Surface Navigator</span>
            <strong>{activeStageReviewSurfaceAction?.label ?? "No review surface"}</strong>
            <p>
              Coverage actions now move the selected stage together with its window, shared-state lane, orchestration board, and observability path
              instead of leaving review surfaces buried inside separate cards.
            </p>
            <div className="workflow-readiness-list">
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Stage surfaces</span>
                <strong>{stageReviewSurfaceActions.length} local-only pivots</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Active kind</span>
                <strong>{formatReviewSurfaceKind(activeStageReviewSurfaceAction?.reviewSurfaceKind)}</strong>
              </div>
            </div>
            <div className="windowing-preview-list">
              {(compact ? stageReviewSurfaceActions.slice(0, 3) : stageReviewSurfaceActions).map((action) => (
                <div key={action.id} className="windowing-preview-line windowing-preview-line--stacked">
                  <span>{formatReviewSurfaceKind(action.reviewSurfaceKind)}</span>
                  <strong>{action.label}</strong>
                  <p>{action.description}</p>
                  {onRunReviewSurfaceAction ? (
                    <div className="windowing-card__actions">
                      <button type="button" className="secondary-button" onClick={() => onRunReviewSurfaceAction(action)}>
                        {action.id === activeReviewSurfaceActionId ? "Refresh surface" : "Focus surface"}
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </article>
        ) : null}

        {activeCompanionRouteState ? (
          <article className="windowing-summary-card">
            <span>Companion Route State</span>
            <strong>{activeCompanionRouteState.label}</strong>
            <p>
              The selected stage now resolves through an explicit companion route state, so active route, alternate routes, and switchable sequence
              posture stay attached to the same local-only review coverage chain.
            </p>
            <div className="workflow-readiness-list">
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Route posture</span>
                <strong>{formatCompanionRouteStatePosture(activeCompanionRouteState.posture)}</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Alternate routes</span>
                <strong>{Math.max(relevantCompanionRouteStates.length - 1, 0)} linked routes</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Switchable sequences</span>
                <strong>
                  {
                    activeCompanionRouteState.sequenceSwitches.filter((switchItem) => switchItem.posture === "switchable-sequence").length
                  }{" "}
                  switch targets
                </strong>
              </div>
            </div>
            <div className="windowing-preview-list">
              {(compact ? relevantCompanionRouteStates.slice(0, 2) : relevantCompanionRouteStates).map((routeState) => {
                const routeAction = reviewSurfaceActionById.get(routeState.currentActionId) ?? null;
                const routeStage = routeState.deliveryChainStageId
                  ? selectStudioReleaseDeliveryChainStage(pipeline, routeState.deliveryChainStageId)
                  : routeAction?.deliveryChainStageId
                    ? selectStudioReleaseDeliveryChainStage(pipeline, routeAction.deliveryChainStageId)
                    : null;
                const routeWindow = routeState.windowId
                  ? windowing?.roster.windows.find((entry) => entry.id === routeState.windowId) ?? null
                  : routeAction?.windowId
                    ? windowing?.roster.windows.find((entry) => entry.id === routeAction.windowId) ?? null
                    : null;
                const routeLane = routeState.sharedStateLaneId
                  ? windowing?.sharedState.lanes.find((entry) => entry.id === routeState.sharedStateLaneId) ?? null
                  : routeAction?.sharedStateLaneId
                    ? windowing?.sharedState.lanes.find((entry) => entry.id === routeAction.sharedStateLaneId) ?? null
                    : null;
                const routeBoard = routeState.orchestrationBoardId
                  ? windowing?.orchestration.boards.find((entry) => entry.id === routeState.orchestrationBoardId) ?? null
                  : routeAction?.orchestrationBoardId
                    ? windowing?.orchestration.boards.find((entry) => entry.id === routeAction.orchestrationBoardId) ?? null
                    : null;
                const routeMapping = routeState.observabilityMappingId
                  ? windowing?.observability.mappings.find((entry) => entry.id === routeState.observabilityMappingId) ?? null
                  : routeAction?.observabilityMappingId
                    ? windowing?.observability.mappings.find((entry) => entry.id === routeAction.observabilityMappingId) ?? null
                    : null;
                const routeSequence = relevantCompanionSequences.find((sequence) => sequence.id === routeState.activeSequenceId) ?? null;
                const active = routeState.id === activeCompanionRouteState.id;

                return (
                  <div key={routeState.id} className="windowing-preview-line windowing-preview-line--stacked">
                    <span>{formatCompanionRouteStatePosture(routeState.posture)}</span>
                    <strong>{active ? `${routeState.label} / active route` : routeState.label}</strong>
                    <p>{routeState.summary}</p>
                    <div className="trace-note-links">
                      <span className={`windowing-badge${active ? " windowing-badge--active" : ""}`}>
                        {routeSequence?.label ?? routeState.activeSequenceId}
                      </span>
                      <span className="windowing-badge">
                        {routeStage?.label ?? routeState.deliveryChainStageId ?? "No stage"} / {routeWindow?.label ?? routeState.windowId ?? "No window"}
                      </span>
                      <span className="windowing-badge">
                        {routeLane?.label ?? routeState.sharedStateLaneId ?? "No lane"} / {routeBoard?.label ?? routeState.orchestrationBoardId ?? "No board"}
                      </span>
                      <span className="windowing-badge">{routeMapping?.label ?? routeState.observabilityMappingId ?? "No observability path"}</span>
                      {routeState.sequenceSwitches.map((switchItem) => (
                        <span key={switchItem.id} className="windowing-badge">
                          {formatCompanionRouteSequenceSwitchPosture(switchItem.posture)} / {switchItem.label}
                        </span>
                      ))}
                    </div>
                    {onRunReviewSurfaceAction && routeAction ? (
                      <div className="windowing-card__actions">
                        <button type="button" className="secondary-button" onClick={() => onRunReviewSurfaceAction(routeAction)}>
                          {active ? "Refresh route" : "Focus route"}
                        </button>
                        {routeState.sequenceSwitches
                          .filter((switchItem) => switchItem.targetActionId !== routeAction.id)
                          .map((switchItem) => {
                            const switchAction = reviewSurfaceActionById.get(switchItem.targetActionId) ?? null;

                            if (!switchAction) {
                              return null;
                            }

                            return (
                              <button
                                key={switchItem.id}
                                type="button"
                                className="secondary-button"
                                onClick={() => onRunReviewSurfaceAction(switchAction)}
                              >
                                {switchItem.label}
                              </button>
                            );
                          })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </article>
        ) : null}

        {activeCompanionPathHandoff || relevantCompanionRouteHistoryEntries.length > 0 ? (
          <article className="windowing-summary-card">
            <span>Route Replay Board</span>
            <strong>{replayRestoreEntry?.label ?? activeCompanionPathHandoff?.label ?? "No replay target"}</strong>
            <p>
              The selected stage now turns remembered route transitions into an acceptance-facing restore surface, so product testing can restore the
              last handoff, replay the active companion sequence, load a replay scenario pack, step through screenshot pass records, review grouped
              capture comparisons, and verify the same review surface plus window / lane / board / observability contract without leaving local-only
              review posture.
            </p>
            <div className="windowing-card__meta">
              <span className="windowing-badge windowing-badge--active">{replayAcceptanceChecksReady} / 5 checks ready</span>
              <span className="windowing-badge">{replayRestoreRouteState?.label ?? "No route snapshot"}</span>
              <span className="windowing-badge">{replayRestoreStage?.label ?? "No delivery stage"}</span>
              {activeReplayScenarioPack ? <span className="windowing-badge">{activeReplayScenarioPack.pack.label}</span> : null}
            </div>
            <div className="workflow-readiness-list">
              <div
                className={`workflow-readiness-line workflow-readiness-line--${
                  replayRestoreEntry ? "positive" : activeCompanionPathHandoff ? "neutral" : "warning"
                }`}
              >
                <span>Restore latest handoff</span>
                <strong>
                  {replayRestoreEntry
                    ? `${formatCompanionRouteTransitionKind(replayRestoreEntry.transitionKind)} / ${replayRestoreEntry.timestampLabel}`
                    : "No remembered restore target"}
                </strong>
              </div>
              <div className={`workflow-readiness-line workflow-readiness-line--${replayRestoreSequence ? "positive" : "warning"}`}>
                <span>Replay active sequence</span>
                <strong>
                  {replayRestoreSequence
                    ? `${replayRestoreSequence.label} / ${replayRestoreSequence.steps.length} steps`
                    : "No replay sequence"}
                </strong>
              </div>
              <div className={`workflow-readiness-line workflow-readiness-line--${replayRestoreAction ? "positive" : "warning"}`}>
                <span>Replay surface</span>
                <strong>
                  {replayRestoreAction
                    ? `${replayRestoreAction.label} / ${formatReviewSurfaceKind(replayRestoreAction.reviewSurfaceKind)}`
                    : "No replay surface"}
                </strong>
              </div>
              <div
                className={`workflow-readiness-line workflow-readiness-line--${
                  replayRestoreWindow && replayRestoreLane && replayRestoreBoard && replayRestoreMapping ? "positive" : "warning"
                }`}
              >
                <span>Coverage contract</span>
                <strong>
                  {replayRestoreWindow && replayRestoreLane && replayRestoreBoard && replayRestoreMapping
                    ? `${replayRestoreWindow.label} / ${replayRestoreLane.label} / ${replayRestoreBoard.label}`
                    : "Window, lane, board, or observability linkage is incomplete"}
                </strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--positive">
                <span>Safety posture</span>
                <strong>local-only / review-only</strong>
              </div>
            </div>
            <div className="windowing-card__actions">
              {onRunCompanionRouteHistory && replayRestoreEntry ? (
                <button type="button" className="secondary-button" onClick={() => onRunCompanionRouteHistory(replayRestoreEntry.id)}>
                  Restore latest handoff
                </button>
              ) : null}
              {onRunCompanionSequence && replayRestoreSequence ? (
                <button type="button" className="secondary-button" onClick={() => onRunCompanionSequence(replayRestoreSequence.id)}>
                  Replay active sequence
                </button>
              ) : null}
              {onRunReviewSurfaceAction && replayRestoreAction ? (
                <button type="button" className="secondary-button" onClick={() => onRunReviewSurfaceAction(replayRestoreAction)}>
                  Focus replay surface
                </button>
              ) : null}
            </div>
            <div className="windowing-preview-list">
              <div className="windowing-preview-line windowing-preview-line--stacked">
                <span>Acceptance Scoreboard</span>
                <strong>{replayAcceptanceChecksReady} / 5 replay checks ready</strong>
                <p>
                  Restore the latest handoff, replay the current companion sequence, confirm the replay surface, and verify the same stage, window,
                  lane, board, and observability path stay attached before the product review console, screenshot pass records, and proof-linked
                  capture flow are read.
                </p>
                <div className="trace-note-links">
                  <span className="windowing-badge">{relevantCompanionRouteHistoryEntries.length} remembered routes</span>
                  <span className="windowing-badge">{relevantCompanionPathHandoffs.length} stabilized handoffs</span>
                  <span className="windowing-badge">{relevantCompanionSequences.length} replay sequences</span>
                </div>
              </div>
              <div className="windowing-preview-line windowing-preview-line--stacked">
                <span>Acceptance route snapshot</span>
                <strong>{replayRestoreRouteState?.label ?? "No route snapshot"}</strong>
                <p>
                  {replayRestoreStage?.label ?? "No stage"} / {replayRestoreWindow?.label ?? "No window"} /{" "}
                  {replayRestoreLane?.label ?? "No lane"} / {replayRestoreBoard?.label ?? "No board"}
                </p>
                <div className="trace-note-links">
                  {replayRestoreSequence ? <span className="windowing-badge">{replayRestoreSequence.label}</span> : null}
                  <span className="windowing-badge">{replayRestoreMapping?.label ?? "No observability path"}</span>
                  {activeCompanionPathHandoff ? (
                    <span className="windowing-badge">
                      {activeCompanionPathHandoff.label} / {formatCompanionPathHandoffStability(activeCompanionPathHandoff.stability)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            {activeReplayScenarioPack ? (
              <>
                <div className="delivery-chain-workspace__acceptance-metrics">
                  <div className="foundation-pill">
                    <span>Review pack status</span>
                    <strong>{activeReplayScenarioPackStatusLabel}</strong>
                  </div>
                  <div className="foundation-pill">
                    <span>Acceptance passes</span>
                    <strong>
                      {activeReplayScenarioPackReadyPassCount} / {activeReplayScenarioPackTotalPassCount} ready
                    </strong>
                  </div>
                  <div className="foundation-pill">
                    <span>Evidence bundle</span>
                    <strong>{activeReplayScenarioPackEvidenceBundleStatusLabel}</strong>
                  </div>
                  <div className="foundation-pill">
                    <span>Acceptance continuity</span>
                    <strong>
                      {activeReplayScenarioPackContinuityHandoffReady} / {activeReplayScenarioPackContinuityHandoffs.length} handoffs aligned
                    </strong>
                  </div>
                  <div className="foundation-pill">
                    <span>Capture review flow</span>
                    <strong>
                      {activeReplayScenarioPackCaptureMetrics.readyGroupCount} / {activeReplayScenarioPackCaptureMetrics.groupCount} groups ready
                    </strong>
                  </div>
                  <div className="foundation-pill">
                    <span>Proof links</span>
                    <strong>{activeReplayScenarioPackCaptureMetrics.linkedProofCount} linked items</strong>
                  </div>
                </div>
                <div className="delivery-chain-workspace__acceptance-grid">
                  <article
                    className={`windowing-summary-card${activeReplayScenarioPackTone === "positive" ? " windowing-summary-card--active" : ""}`}
                  >
                    <span>Product Review Console</span>
                    <strong>{activeReplayScenarioPack.pack.label}</strong>
                    <p>{activeReplayScenarioPack.pack.summary}</p>
                    <div className="trace-note-links">
                      <span className={`windowing-badge${activeReplayScenarioPackTone === "positive" ? " windowing-badge--active" : ""}`}>
                        {activeReplayScenarioPackStatusLabel}
                      </span>
                      <span className="windowing-badge">{activeReplayScenarioPack.pack.acceptancePosture}</span>
                      <span className="windowing-badge">{activeReplayScenarioPack.pack.safety}</span>
                    </div>
                    <div className="windowing-preview-list">
                      <div className="windowing-preview-line">
                        <span>Active scenario</span>
                        <strong>{activeReplayScenarioEntry?.scenarioLabel ?? activeReplayScenarioEntry?.label ?? "No scenario selected"}</strong>
                      </div>
                      <div className="windowing-preview-line windowing-preview-line--stacked">
                        <span>Reviewer brief</span>
                        <strong>{activeReplayScenarioReviewerPosture}</strong>
                        <p>{activeReplayScenarioPack.pack.acceptancePosture}</p>
                      </div>
                      <div className="windowing-preview-line windowing-preview-line--stacked">
                        <span>Pass progression</span>
                        <strong>
                          {activeReplayScenarioReadyPassCount} / {activeReplayScenarioPassRecords.length || 0} screenshot passes ready
                        </strong>
                        <p>
                          {activeReplayScenarioStatusLabel} · {activeReplayScenarioReadyCaptureGroupCount} /{" "}
                          {activeReplayScenarioCaptureGroups.length || 0} capture groups aligned · {activeReplayScenarioLinkedProofCount} proof links staged
                          · {activeReplayScenarioPackContinuityHandoffReady} / {activeReplayScenarioPackContinuityHandoffs.length} continuity handoffs aligned
                        </p>
                      </div>
                      <div className="windowing-preview-line windowing-preview-line--stacked">
                        <span>Product-review route frame</span>
                        <strong>{replayRestoreRouteState?.label ?? "No route snapshot"}</strong>
                        <p>
                          {replayRestoreStage?.label ?? "No stage"} / {replayRestoreWindow?.label ?? "No window"} /{" "}
                          {replayRestoreLane?.label ?? "No lane"} / {replayRestoreBoard?.label ?? "No board"}
                        </p>
                        <div className="trace-note-links">
                          {replayRestoreSequence ? <span className="windowing-badge">{replayRestoreSequence.label}</span> : null}
                          <span className="windowing-badge">{replayRestoreMapping?.label ?? "No observability path"}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                  {activeReplayScenarioEntry ? (
                    <article
                      className={`windowing-summary-card${
                        activeReplayEvidenceTrace?.tone === "positive" ? " windowing-summary-card--active" : ""
                      }`}
                    >
                      <span>Evidence Trace Lens</span>
                      <strong>{activeReplayEvidenceTrace?.label ?? "All acceptance evidence"}</strong>
                      <p>
                        Focus one proof trail at a time so storyboard shots, dossier items, and continuity handoffs stay readable without dropping
                        the full local-only review pack.
                      </p>
                      <div className="trace-note-links">
                        <span
                          className={`windowing-badge${
                            activeReplayEvidenceTrace && activeReplayEvidenceTrace.kind !== "all" ? " windowing-badge--active" : ""
                          }`}
                        >
                          {formatReplayEvidenceTraceKind(activeReplayEvidenceTrace?.kind ?? "all")}
                        </span>
                        <span className="windowing-badge">
                          {activeReplayEvidenceTrace?.screenshotIds.length ?? 0} storyboard shots
                        </span>
                        <span className="windowing-badge">{activeReplayEvidenceTrace?.evidenceItemIds.length ?? 0} proof items</span>
                        <span className="windowing-badge">
                          {activeReplayEvidenceTrace?.continuityHandoffIds.length ?? 0} continuity handoffs
                        </span>
                        {activeReplayEvidenceTracePackOnlyLinkCount > 0 ? (
                          <span className="windowing-badge">{activeReplayEvidenceTracePackOnlyLinkCount} pack-only links</span>
                        ) : null}
                      </div>
                      <div className="windowing-preview-line windowing-preview-line--stacked">
                        <span>Focused acceptance evidence</span>
                        <strong>{activeReplayEvidenceTrace?.detail ?? "All acceptance evidence remains visible."}</strong>
                        <p>
                          {activeReplayEvidenceTrace?.summary ??
                            "All storyboard shots, proof items, and continuity handoffs remain visible while the acceptance pack stays local-only."}
                        </p>
                      </div>
                      <div className="focus-pill-row">
                        {activeReplayScenarioEvidenceTraces.map((trace) => (
                          <button
                            key={trace.id}
                            type="button"
                            className={`focus-pill${trace.id === activeReplayEvidenceTrace?.id ? " focus-pill--active" : ""}`}
                            onClick={() => setActiveReplayEvidenceTraceId(trace.id)}
                          >
                            <span>{formatReplayEvidenceTraceKind(trace.kind)}</span>
                            <strong>{trace.label}</strong>
                            <small>{trace.summary}</small>
                          </button>
                        ))}
                      </div>
                    </article>
                  ) : null}
                  {activeReplayScenarioEntry ? (
                    <article className={`windowing-summary-card${activeReplayScenarioTone === "positive" ? " windowing-summary-card--active" : ""}`}>
                      <span>Screenshot Pass Records</span>
                      <strong>Acceptance pass progression</strong>
                      <p>{activeReplayScenarioEntry.scenarioSummary ?? activeReplayScenarioEntry.summary}</p>
                      <div className="trace-note-links">
                        <span className={`windowing-badge${activeReplayScenarioTone === "positive" ? " windowing-badge--active" : ""}`}>
                          {activeReplayScenarioReadyPassCount} / {activeReplayScenarioPassRecords.length} passes ready
                        </span>
                        <span className="windowing-badge">{activeReplayScenarioStatusLabel}</span>
                        <span className="windowing-badge">{activeReplayScenarioEvidenceBundleStatusLabel}</span>
                        <span className="windowing-badge">{activeReplayScenarioReviewerPosture}</span>
                        <span className="windowing-badge">{activeReplayScenarioEvidencePosture}</span>
                      </div>
                      <div className="delivery-chain-workspace__pass-record-list">
                        {activeReplayScenarioPassRecords.map((pass) => (
                          <div
                            key={pass.id}
                            className={`delivery-chain-workspace__pass-record delivery-chain-workspace__pass-record--${pass.tone}`}
                          >
                            <div className="delivery-chain-workspace__pass-record-header">
                              <span>{pass.stepLabel}</span>
                              <strong>{pass.status}</strong>
                            </div>
                            <div className="delivery-chain-workspace__pass-record-body">
                              <h3>{pass.label}</h3>
                              <p>{pass.detail}</p>
                            </div>
                            <div className="trace-note-links">
                              <span className="windowing-badge">{pass.owner}</span>
                              {pass.badges.map((badge) => (
                                <span key={`${pass.id}-${badge}`} className="windowing-badge">
                                  {badge}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="delivery-chain-workspace__acceptance-status-list">
                        {activeReplayScenarioAcceptanceChecks.length ? (
                          activeReplayScenarioAcceptanceChecks.map((check) => (
                            <div
                              key={check.id}
                              className={`workflow-readiness-line workflow-readiness-line--${resolveReplayAcceptanceTone(check.state)}`}
                            >
                              <span>{check.label}</span>
                              <strong>{check.detail}</strong>
                            </div>
                          ))
                        ) : (
                          <div className="workflow-readiness-line workflow-readiness-line--warning">
                            <span>Pass checks</span>
                            <strong>No pass checks defined for this acceptance card.</strong>
                          </div>
                        )}
                      </div>
                    </article>
                  ) : null}
                  {activeReplayScenarioEntry ? (
                    <article className="windowing-summary-card">
                      <span>Acceptance Storyboard</span>
                      <strong>
                        {activeReplayScenarioScreenshotReady} / {activeReplayScenarioScreenshotItems.length || 0} storyboard shots staged
                      </strong>
                      <p>
                        Capture Review Flow now lays each screenshot pass out as an ordered storyboard so viewport, framing, reviewer focus, and
                        proof linkage stay reviewable before any reviewer signoff is considered complete.
                      </p>
                      <div className="trace-note-links">
                        <span className={`windowing-badge${activeReplayScenarioTone !== "warning" ? " windowing-badge--active" : ""}`}>
                          {activeReplayScenarioStatusLabel}
                        </span>
                        <span className="windowing-badge">{activeReplayScenarioEvidenceBundleStatusLabel}</span>
                        <span className="windowing-badge">
                          {activeReplayScenarioReadyCaptureGroupCount} / {activeReplayScenarioCaptureGroups.length || 0} groups aligned
                        </span>
                        <span className="windowing-badge">{activeReplayScenarioLinkedProofCount} proof links</span>
                        <span className="windowing-badge">{activeReplayScenarioPack.pack.safety}</span>
                      </div>
                      <div className="delivery-chain-workspace__storyboard">
                        {activeReplayScenarioCaptureGroups.length ? (
                          (compact ? activeReplayScenarioCaptureGroups.slice(0, 1) : activeReplayScenarioCaptureGroups).map((group) => {
                            const traceId = createReplayEvidenceTraceCaptureGroupId(group.id);
                            const activeTrace = activeReplayEvidenceTrace?.id === traceId;
                            const groupInTrace =
                              !hasActiveReplayEvidenceTraceFilter ||
                              group.items.some((item) => activeReplayEvidenceTraceScreenshotIds.has(item.id)) ||
                              group.linkedEvidenceItems.some((item) => activeReplayEvidenceTraceEvidenceIds.has(item.id));

                            return (
                              <section
                                key={group.id}
                                className={`delivery-chain-workspace__storyboard-group delivery-chain-workspace__storyboard-group--${group.tone}${
                                  hasActiveReplayEvidenceTraceFilter
                                    ? groupInTrace
                                      ? " delivery-chain-workspace__trace-card--focused"
                                      : " delivery-chain-workspace__trace-card--muted"
                                    : ""
                                }`}
                              >
                                <div className="delivery-chain-workspace__storyboard-group-header">
                                  <div>
                                    <span>{group.label}</span>
                                    <strong>{group.comparisonFrame}</strong>
                                  </div>
                                  <span className={`windowing-badge${group.tone === "positive" ? " windowing-badge--active" : ""}`}>
                                    {group.readyCount} / {group.totalCount} staged
                                  </span>
                                </div>
                                <div className="trace-note-links">
                                  <span className="windowing-badge">{group.linkedEvidenceItems.length} proof links</span>
                                  {group.linkedEvidenceItems.map((item) => (
                                    <span key={`${group.id}-${item.id}`} className="windowing-badge">
                                      {item.dossierSection}
                                    </span>
                                  ))}
                                  <button
                                    type="button"
                                    className={`secondary-button delivery-chain-workspace__trace-toggle${
                                      activeTrace ? " delivery-chain-workspace__trace-toggle--active" : ""
                                    }`}
                                    onClick={() => toggleReplayEvidenceTrace(traceId)}
                                  >
                                    {activeTrace ? "Show all evidence" : "Focus capture group"}
                                  </button>
                                </div>
                                <div className="delivery-chain-workspace__storyboard-strip">
                                  {group.items.map((item) => {
                                    const linkedEvidenceItems = (item.linkedEvidenceItemIds ?? [])
                                      .map((evidenceId) => activeReplayScenarioEvidenceItemById.get(evidenceId))
                                      .filter((linkedItem): linkedItem is ReplayScenarioEvidenceItem => Boolean(linkedItem));
                                    const itemInTrace =
                                      !hasActiveReplayEvidenceTraceFilter ||
                                      activeReplayEvidenceTraceScreenshotIds.has(item.id) ||
                                      linkedEvidenceItems.some((linkedItem) => activeReplayEvidenceTraceEvidenceIds.has(linkedItem.id));

                                    return (
                                      <article
                                        key={item.id}
                                        className={`delivery-chain-workspace__storyboard-shot delivery-chain-workspace__storyboard-shot--${resolveReplayScreenshotTone(
                                          item.posture
                                        )}${
                                          hasActiveReplayEvidenceTraceFilter
                                            ? itemInTrace
                                              ? " delivery-chain-workspace__trace-card--focused"
                                              : " delivery-chain-workspace__trace-card--muted"
                                            : ""
                                        }`}
                                      >
                                        <div className="delivery-chain-workspace__storyboard-shot-header">
                                          <span>
                                            {formatReplayScreenshotShotIndex(item.shotIndex)} /{" "}
                                            {formatReplayScreenshotStoryboardRole(item.storyboardRole)}
                                          </span>
                                          <strong>{formatReplayScreenshotPosture(item.posture)}</strong>
                                        </div>
                                        <h3>{item.label}</h3>
                                        <p>{item.detail}</p>
                                        <div className="delivery-chain-workspace__storyboard-shot-fields">
                                          <div className="delivery-chain-workspace__storyboard-shot-field">
                                            <span>Viewport</span>
                                            <strong>{item.viewport}</strong>
                                          </div>
                                          <div className="delivery-chain-workspace__storyboard-shot-field">
                                            <span>Focus</span>
                                            <strong>{item.focus}</strong>
                                          </div>
                                          <div className="delivery-chain-workspace__storyboard-shot-field delivery-chain-workspace__storyboard-shot-field--wide">
                                            <span>Framing</span>
                                            <strong>{item.framing}</strong>
                                          </div>
                                        </div>
                                        <div className="trace-note-links">
                                          <span className={`windowing-badge${item.posture !== "required" ? " windowing-badge--active" : ""}`}>
                                            {item.surface}
                                          </span>
                                          <span className="windowing-badge">{formatReplayScreenshotStoryboardRole(item.storyboardRole)}</span>
                                          {linkedEvidenceItems.map((linkedItem) => (
                                            <span key={`${item.id}-${linkedItem.id}`} className="windowing-badge">
                                              {linkedItem.label}
                                            </span>
                                          ))}
                                        </div>
                                      </article>
                                    );
                                  })}
                                </div>
                              </section>
                            );
                          })
                        ) : (
                          <div className="windowing-preview-line windowing-preview-line--stacked">
                            <span>Acceptance Storyboard</span>
                            <strong>No screenshot comparison groups are defined for this acceptance card.</strong>
                          </div>
                        )}
                      </div>
                    </article>
                  ) : null}
                  <article
                    className={`windowing-summary-card${
                      activeReplayScenarioPackContinuityHandoffTone === "positive" ? " windowing-summary-card--active" : ""
                    }`}
                  >
                    <span>Acceptance Evidence Continuity</span>
                    <strong>{activeReplayScenarioPackContinuityHandoffStatusLabel}</strong>
                    <p>{activeReplayScenarioPack.pack.continuitySummary}</p>
                    <div className="trace-note-links">
                      <span
                        className={`windowing-badge${
                          activeReplayScenarioPackContinuityHandoffTone === "positive" ? " windowing-badge--active" : ""
                        }`}
                      >
                        {activeReplayScenarioPackContinuityHandoffReady} / {activeReplayScenarioPackContinuityHandoffs.length} handoffs aligned
                      </span>
                      <span className="windowing-badge">{activeReplayScenarioPackContinuityLinkedEvidenceCount} proof anchors</span>
                      <span className="windowing-badge">{activeReplayScenarioPackContinuityLinkedCaptureCount} capture anchors</span>
                      <span className="windowing-badge">{activeReplayScenarioPack.pack.safety}</span>
                    </div>
                    <div className="delivery-chain-workspace__continuity-list">
                      {(compact
                        ? activeReplayScenarioPackContinuityHandoffs.slice(0, 2)
                        : activeReplayScenarioPackContinuityHandoffs
                      ).map((handoff) => {
                        const sourceScenario = handoff.sourceScenarioId
                          ? activeReplayScenarioPackEntryById.get(handoff.sourceScenarioId) ?? null
                          : null;
                        const targetScenario = handoff.targetScenarioId
                          ? activeReplayScenarioPackEntryById.get(handoff.targetScenarioId) ?? null
                          : null;
                        const linkedEvidenceItems = handoff.linkedEvidenceItemIds
                          .map((itemId) => activeReplayScenarioPackEvidenceItemById.get(itemId))
                          .filter((item): item is ReplayScenarioEvidenceItem => Boolean(item));
                        const linkedScreenshots = handoff.linkedScreenshotIds
                          .map((itemId) => activeReplayScenarioPackScreenshotItemById.get(itemId))
                          .filter((item): item is ReplayScenarioScreenshotItem => Boolean(item));
                        const sourceScenarioLabel = sourceScenario?.scenarioLabel ?? sourceScenario?.label ?? null;
                        const targetScenarioLabel = targetScenario?.scenarioLabel ?? targetScenario?.label ?? null;
                        const scenarioContext =
                          sourceScenarioLabel && targetScenarioLabel
                            ? sourceScenarioLabel === targetScenarioLabel
                              ? sourceScenarioLabel
                              : `${sourceScenarioLabel} -> ${targetScenarioLabel}`
                            : sourceScenarioLabel ?? targetScenarioLabel ?? activeReplayScenarioPack.pack.label;
                        const handoffTone = resolveReplayEvidenceContinuityTone(handoff.state);
                        const traceId = createReplayEvidenceTraceContinuityHandoffId(handoff.id);
                        const activeTrace = activeReplayEvidenceTrace?.id === traceId;
                        const handoffInTrace =
                          !hasActiveReplayEvidenceTraceFilter ||
                          activeReplayEvidenceTraceContinuityHandoffIds.has(handoff.id) ||
                          handoff.linkedEvidenceItemIds.some((itemId) => activeReplayEvidenceTraceEvidenceIds.has(itemId)) ||
                          handoff.linkedScreenshotIds.some((itemId) => activeReplayEvidenceTraceScreenshotIds.has(itemId));

                        return (
                          <div
                            key={handoff.id}
                            className={`delivery-chain-workspace__continuity-handoff delivery-chain-workspace__continuity-handoff--${handoffTone}${
                              hasActiveReplayEvidenceTraceFilter
                                ? handoffInTrace
                                  ? " delivery-chain-workspace__trace-card--focused"
                                  : " delivery-chain-workspace__trace-card--muted"
                                : ""
                            }`}
                          >
                            <div className="delivery-chain-workspace__continuity-handoff-header">
                              <div>
                                <span>{handoff.sourceLabel}</span>
                                <strong>{handoff.targetLabel}</strong>
                              </div>
                              <span className={`windowing-badge${handoffTone === "positive" ? " windowing-badge--active" : ""}`}>
                                {formatReplayEvidenceContinuityState(handoff.state)}
                              </span>
                            </div>
                            <p>{handoff.detail}</p>
                            <div className="trace-note-links">
                              <span className="windowing-badge">{scenarioContext}</span>
                              <span className="windowing-badge">{linkedEvidenceItems.length} proof anchors</span>
                              <span className="windowing-badge">{linkedScreenshots.length} capture anchors</span>
                              <button
                                type="button"
                                className={`secondary-button delivery-chain-workspace__trace-toggle${
                                  activeTrace ? " delivery-chain-workspace__trace-toggle--active" : ""
                                }`}
                                onClick={() => toggleReplayEvidenceTrace(traceId)}
                              >
                                {activeTrace ? "Show all evidence" : "Focus handoff"}
                              </button>
                            </div>
                            <div className="windowing-preview-list">
                              {linkedEvidenceItems.length ? (
                                <div className="windowing-preview-line windowing-preview-line--stacked">
                                  <span>Proof anchors</span>
                                  <strong>{linkedEvidenceItems.map((item) => item.label).join(" / ")}</strong>
                                </div>
                              ) : null}
                              {linkedScreenshots.length ? (
                                <div className="windowing-preview-line windowing-preview-line--stacked">
                                  <span>Capture lineage</span>
                                  <strong>{linkedScreenshots.map((item) => item.label).join(" / ")}</strong>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                  {activeReplayScenarioEntry ? (
                    <article className={`windowing-summary-card${activeReplayScenarioEvidenceBundleTone === "positive" ? " windowing-summary-card--active" : ""}`}>
                      <span>Proof-linked Evidence Bundle</span>
                      <strong>{activeReplayScenarioEvidenceBundleStatusLabel}</strong>
                      <p>
                        Route proof, reviewer notes, continuity anchors, and screenshot proof links stay grouped as one local-only evidence bundle so
                        the acceptance layer reads like a finished product review surface.
                      </p>
                      <div className="trace-note-links">
                        <span className={`windowing-badge${activeReplayScenarioEvidenceReady > 0 ? " windowing-badge--active" : ""}`}>
                          {activeReplayScenarioEvidenceStatusLabel}
                        </span>
                        <span className={`windowing-badge${activeReplayScenarioContinuityReady > 0 ? " windowing-badge--active" : ""}`}>
                          {activeReplayScenarioContinuityStatusLabel}
                        </span>
                        <span className="windowing-badge">{activeReplayScenarioLinkedProofCount} linked proofs</span>
                        <span className="windowing-badge">{activeReplayScenarioEvidencePosture}</span>
                        <span className="windowing-badge">{activeReplayScenarioPack.pack.safety}</span>
                      </div>
                      <div className="windowing-preview-line windowing-preview-line--stacked">
                        <span>Evidence Dossier</span>
                        <strong>
                          {activeReplayScenarioEvidenceItems.length} proof items / {activeReplayScenarioLinkedProofCount} linked captures
                        </strong>
                        <p>
                          Route snapshots, reviewer notes, and comparison ledgers stay grouped with explicit owners and dossier sections so the
                          acceptance pack reads like a review packet instead of a loose set of badges.
                        </p>
                      </div>
                      <div className="delivery-chain-workspace__evidence-dossier-list">
                        {activeReplayScenarioEvidenceItems.length ? (
                          (compact ? activeReplayScenarioEvidenceItems.slice(0, 2) : activeReplayScenarioEvidenceItems).map((item) => {
                            const linkedScreenshots = activeReplayScenarioScreenshotItems.filter((screenshot) =>
                              screenshot.linkedEvidenceItemIds?.includes(item.id)
                            );
                            const traceId = createReplayEvidenceTraceEvidenceItemId(item.id);
                            const activeTrace = activeReplayEvidenceTrace?.id === traceId;
                            const itemInTrace =
                              !hasActiveReplayEvidenceTraceFilter ||
                              activeReplayEvidenceTraceEvidenceIds.has(item.id) ||
                              linkedScreenshots.some((screenshot) => activeReplayEvidenceTraceScreenshotIds.has(screenshot.id));

                            return (
                              <article
                                key={item.id}
                                className={`delivery-chain-workspace__evidence-dossier-item delivery-chain-workspace__evidence-dossier-item--${resolveReplayScenarioEvidenceTone(
                                  item.posture
                                )}${
                                  hasActiveReplayEvidenceTraceFilter
                                    ? itemInTrace
                                      ? " delivery-chain-workspace__trace-card--focused"
                                      : " delivery-chain-workspace__trace-card--muted"
                                    : ""
                                }`}
                              >
                                <div className="delivery-chain-workspace__evidence-dossier-header">
                                  <div>
                                    <span>
                                      {formatReplayScenarioEvidencePosture(item.posture)} / {formatReplayScenarioEvidenceKind(item.kind)}
                                    </span>
                                    <strong>{item.label}</strong>
                                  </div>
                                  <span
                                    className={`windowing-badge${
                                      resolveReplayScenarioEvidenceTone(item.posture) !== "warning" ? " windowing-badge--active" : ""
                                    }`}
                                  >
                                    {item.owner}
                                  </span>
                                </div>
                                <p>{item.detail}</p>
                                <div className="delivery-chain-workspace__evidence-dossier-fields">
                                  <div className="delivery-chain-workspace__evidence-dossier-field">
                                    <span>Dossier section</span>
                                    <strong>{item.dossierSection}</strong>
                                  </div>
                                  <div className="delivery-chain-workspace__evidence-dossier-field">
                                    <span>Artifact</span>
                                    <strong>{item.artifact}</strong>
                                  </div>
                                </div>
                                <div className="trace-note-links">
                                  <span className="windowing-badge">{activeReplayScenarioEvidenceBundleStatusLabel}</span>
                                  {linkedScreenshots.length ? (
                                    <span className="windowing-badge">{linkedScreenshots.length} linked captures</span>
                                  ) : null}
                                  {linkedScreenshots.map((screenshot) => (
                                    <span key={`${item.id}-${screenshot.id}`} className="windowing-badge">
                                      {formatReplayScreenshotShotIndex(screenshot.shotIndex)}
                                    </span>
                                  ))}
                                  <button
                                    type="button"
                                    className={`secondary-button delivery-chain-workspace__trace-toggle${
                                      activeTrace ? " delivery-chain-workspace__trace-toggle--active" : ""
                                    }`}
                                    onClick={() => toggleReplayEvidenceTrace(traceId)}
                                  >
                                    {activeTrace ? "Show all evidence" : "Focus proof item"}
                                  </button>
                                </div>
                              </article>
                            );
                          })
                        ) : (
                          <div className="windowing-preview-line windowing-preview-line--stacked">
                            <span>Evidence Dossier</span>
                            <strong>No scenario evidence items are defined for this acceptance card.</strong>
                          </div>
                        )}
                      </div>
                      <div className="delivery-chain-workspace__acceptance-status-list">
                        {activeReplayScenarioContinuityChecks.length ? (
                          activeReplayScenarioContinuityChecks.map((check) => (
                            <div
                              key={check.id}
                              className={`workflow-readiness-line workflow-readiness-line--${resolveReplayEvidenceContinuityTone(check.state)}`}
                            >
                              <span>{check.label}</span>
                              <strong>
                                {check.handoff} / {formatReplayEvidenceContinuityState(check.state)}
                              </strong>
                            </div>
                          ))
                        ) : (
                          <div className="workflow-readiness-line workflow-readiness-line--warning">
                            <span>Continuity</span>
                            <strong>No evidence continuity checks are defined for this acceptance card.</strong>
                          </div>
                        )}
                      </div>
                    </article>
                  ) : null}
                </div>
              </>
            ) : null}
            <div className="windowing-preview-list">
              {(compact ? relevantCompanionPathHandoffs.slice(0, 2) : relevantCompanionPathHandoffs).map((handoff) => {
                const targetAction = reviewSurfaceActionById.get(handoff.targetActionId) ?? null;
                const handoffStage = handoff.deliveryChainStageId
                  ? selectStudioReleaseDeliveryChainStage(pipeline, handoff.deliveryChainStageId)
                  : targetAction?.deliveryChainStageId
                    ? selectStudioReleaseDeliveryChainStage(pipeline, targetAction.deliveryChainStageId)
                    : null;
                const handoffWindow = handoff.windowId
                  ? windowing?.roster.windows.find((entry) => entry.id === handoff.windowId) ?? null
                  : targetAction?.windowId
                    ? windowing?.roster.windows.find((entry) => entry.id === targetAction.windowId) ?? null
                    : null;
                const handoffLane = handoff.sharedStateLaneId
                  ? windowing?.sharedState.lanes.find((entry) => entry.id === handoff.sharedStateLaneId) ?? null
                  : targetAction?.sharedStateLaneId
                    ? windowing?.sharedState.lanes.find((entry) => entry.id === targetAction.sharedStateLaneId) ?? null
                    : null;
                const handoffBoard = handoff.orchestrationBoardId
                  ? windowing?.orchestration.boards.find((entry) => entry.id === handoff.orchestrationBoardId) ?? null
                  : targetAction?.orchestrationBoardId
                    ? windowing?.orchestration.boards.find((entry) => entry.id === targetAction.orchestrationBoardId) ?? null
                    : null;
                const handoffMapping = handoff.observabilityMappingId
                  ? windowing?.observability.mappings.find((entry) => entry.id === handoff.observabilityMappingId) ?? null
                  : targetAction?.observabilityMappingId
                    ? windowing?.observability.mappings.find((entry) => entry.id === targetAction.observabilityMappingId) ?? null
                    : null;
                const linkedHistoryEntry =
                  relevantCompanionRouteHistoryEntries.find(
                    (entry) =>
                      entry.reviewPathId === handoff.reviewPathId ||
                      (entry.routeStateId === handoff.routeStateId && entry.targetActionId === handoff.targetActionId)
                  ) ?? null;
                const active = handoff.id === activeCompanionPathHandoff?.id;

                return (
                  <div key={handoff.id} className="windowing-preview-line windowing-preview-line--stacked">
                    <span>{formatCompanionPathHandoffStability(handoff.stability)}</span>
                    <strong>{active ? `${handoff.label} / active handoff` : handoff.label}</strong>
                    <p>{handoff.summary}</p>
                    <div className="trace-note-links">
                      <span className={`windowing-badge${active ? " windowing-badge--active" : ""}`}>
                        {handoffStage?.label ?? handoff.deliveryChainStageId ?? "No stage"} / {handoffWindow?.label ?? handoff.windowId ?? "No window"}
                      </span>
                      <span className="windowing-badge">
                        {handoffLane?.label ?? handoff.sharedStateLaneId ?? "No lane"} / {handoffBoard?.label ?? handoff.orchestrationBoardId ?? "No board"}
                      </span>
                      <span className="windowing-badge">{handoffMapping?.label ?? handoff.observabilityMappingId ?? "No observability path"}</span>
                    </div>
                    {onRunCompanionRouteHistory && linkedHistoryEntry ? (
                      <div className="windowing-card__actions">
                        <button type="button" className="secondary-button" onClick={() => onRunCompanionRouteHistory(linkedHistoryEntry.id)}>
                          Restore handoff
                        </button>
                      </div>
                    ) : onRunReviewSurfaceAction && targetAction ? (
                      <div className="windowing-card__actions">
                        <button type="button" className="secondary-button" onClick={() => onRunReviewSurfaceAction(targetAction)}>
                          {active ? "Refresh handoff" : "Focus handoff"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {!activeReplayScenarioPack
                ? (compact ? relevantCompanionRouteHistoryEntries.slice(0, 2) : relevantCompanionRouteHistoryEntries).map((entry) => {
                    const targetAction = reviewSurfaceActionById.get(entry.targetActionId) ?? null;
                    const active = entry.id === activeCompanionRouteHistoryEntry?.id;

                    return (
                      <div key={entry.id} className="windowing-preview-line windowing-preview-line--stacked">
                        <span>{entry.timestampLabel}</span>
                        <strong>{active ? `${entry.label} / active memory` : entry.label}</strong>
                        <p>{entry.summary}</p>
                        <div className="trace-note-links">
                          <span className={`windowing-badge${active ? " windowing-badge--active" : ""}`}>
                            {formatCompanionRouteTransitionKind(entry.transitionKind)}
                          </span>
                          {entry.sequenceId ? <span className="windowing-badge">{entry.sequenceId}</span> : null}
                        </div>
                        {onRunCompanionRouteHistory ? (
                          <div className="windowing-card__actions">
                            <button type="button" className="secondary-button" onClick={() => onRunCompanionRouteHistory(entry.id)}>
                              {active ? "Refresh restore" : "Restore memory"}
                            </button>
                          </div>
                        ) : onRunReviewSurfaceAction && targetAction ? (
                          <div className="windowing-card__actions">
                            <button type="button" className="secondary-button" onClick={() => onRunReviewSurfaceAction(targetAction)}>
                              {active ? "Refresh memory" : "Focus memory"}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                : null}
            </div>
            {activeReplayScenarioPack ? (
              <>
                <div className="panel-title-row">
                  <h3>Review Pack Scenarios</h3>
                  <span>
                    {activeReplayScenarioPack.entries.length} cards / {activeReplayScenarioPackReadyPassCount} ready passes
                  </span>
                </div>
                <div className={compact ? "workflow-step-grid workflow-step-grid--compact" : "workflow-step-grid"}>
                  {activeReplayScenarioPack.entries.map((entry) => {
                    const targetAction = reviewSurfaceActionById.get(entry.targetActionId) ?? null;
                    const scenarioRouteState = entry.routeStateId
                      ? relevantCompanionRouteStates.find((routeState) => routeState.id === entry.routeStateId) ?? null
                      : null;
                    const scenarioStage = entry.deliveryChainStageId
                      ? selectStudioReleaseDeliveryChainStage(pipeline, entry.deliveryChainStageId)
                      : targetAction?.deliveryChainStageId
                        ? selectStudioReleaseDeliveryChainStage(pipeline, targetAction.deliveryChainStageId)
                        : null;
                    const readyChecks = entry.acceptanceChecks?.filter((check) => check.state === "ready").length ?? 0;
                    const evidenceItems = entry.scenarioEvidenceItems ?? [];
                    const readyEvidence = evidenceItems.filter((item) => item.posture !== "pending").length;
                    const continuityChecks = entry.evidenceContinuityChecks ?? [];
                    const readyContinuity = continuityChecks.filter((check) => check.state === "ready").length;
                    const screenshotItems = entry.screenshotReviewItems ?? [];
                    const readyScreenshots = screenshotItems.filter((item) => item.posture !== "required").length;
                    const captureGroups = createReplayScreenshotCaptureGroups({
                      screenshotItems,
                      evidenceItems
                    });
                    const readyCaptureGroups = captureGroups.filter((group) => group.tone === "positive").length;
                    const linkedProofCount = countReplayLinkedProofItems(captureGroups);
                    const continuityHandoffCount = activeReplayScenarioPack.pack.continuityHandoffs.filter(
                      (handoff) => handoff.sourceScenarioId === entry.id || handoff.targetScenarioId === entry.id
                    ).length;
                    const passCards = createReplayScenarioPassCards({
                      entry,
                      routeLabel: scenarioRouteState?.label ?? entry.routeStateId ?? "No route snapshot",
                      routeReady: Boolean(scenarioRouteState && entry.sequenceId && targetAction),
                      readyChecks,
                      totalChecks: entry.acceptanceChecks?.length ?? 0,
                      readyEvidence,
                      totalEvidence: evidenceItems.length,
                      readyContinuity,
                      totalContinuity: continuityChecks.length,
                      readyScreenshots,
                      totalScreenshots: screenshotItems.length
                    });
                    const readyPassCount = passCards.filter((pass) => pass.tone === "positive").length;
                    const scenarioTone = resolveReplayScenarioTone(
                      readyChecks,
                      entry.acceptanceChecks?.length ?? 0,
                      readyScreenshots,
                      screenshotItems.length,
                      readyEvidence,
                      evidenceItems.length,
                      readyContinuity,
                      continuityChecks.length
                    );
                    const scenarioStatusLabel = formatReplayScenarioStatusLabel(
                      readyChecks,
                      entry.acceptanceChecks?.length ?? 0,
                      readyScreenshots,
                      screenshotItems.length,
                      readyEvidence,
                      evidenceItems.length,
                      readyContinuity,
                      continuityChecks.length
                    );
                    const active = entry.id === replayRestoreEntry?.id;

                    return (
                      <article
                        key={entry.id}
                        className={`workflow-step-card workflow-step-card--${scenarioTone}${active ? " workflow-step-card--active" : ""}`}
                      >
                        <div className="workflow-step-card__meta">
                          <span>{entry.timestampLabel}</span>
                          <strong>{scenarioStatusLabel}</strong>
                        </div>
                        <h3>{entry.scenarioLabel ?? entry.label}</h3>
                        <p>{entry.scenarioSummary ?? entry.summary}</p>
                        <div className="trace-note-links">
                          <span className={`windowing-badge${active ? " windowing-badge--active" : ""}`}>
                            {scenarioStage?.label ?? entry.deliveryChainStageId ?? "No stage"}
                          </span>
                          <span className="windowing-badge">{scenarioRouteState?.label ?? entry.routeStateId ?? "No route state"}</span>
                          <span className="windowing-badge">
                            {readyPassCount} / {passCards.length} passes ready
                          </span>
                          <span className="windowing-badge">
                            {readyScreenshots} / {screenshotItems.length} screenshot targets staged
                          </span>
                          <span className="windowing-badge">
                            {readyCaptureGroups} / {captureGroups.length} capture groups ready
                          </span>
                          <span className="windowing-badge">{continuityHandoffCount} continuity handoffs</span>
                        </div>
                        <div className="trace-note-links">
                          <span className="windowing-badge">
                            {entry.reviewerPosture ?? activeReplayScenarioPack.pack.reviewerPosture}
                          </span>
                          <span className="windowing-badge">
                            {formatReplayEvidenceBundleStatusLabel(readyEvidence, evidenceItems.length, readyContinuity, continuityChecks.length)}
                          </span>
                          <span className="windowing-badge">
                            {entry.evidencePosture ?? activeReplayScenarioPack.pack.evidencePosture}
                          </span>
                          <span className="windowing-badge">
                            {readyEvidence} / {evidenceItems.length} proof items staged
                          </span>
                          <span className="windowing-badge">{linkedProofCount} proof links</span>
                          <span className="windowing-badge">{formatCompanionRouteTransitionKind(entry.transitionKind)}</span>
                        </div>
                        {onRunCompanionRouteHistory ? (
                          <div className="windowing-card__actions">
                            <button type="button" className="secondary-button" onClick={() => onRunCompanionRouteHistory(entry.id)}>
                              {active ? "Refresh scenario" : "Load scenario"}
                            </button>
                          </div>
                        ) : onRunReviewSurfaceAction && targetAction ? (
                          <div className="windowing-card__actions">
                            <button type="button" className="secondary-button" onClick={() => onRunReviewSurfaceAction(targetAction)}>
                              {active ? "Refresh scenario" : "Focus scenario"}
                            </button>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </>
            ) : null}
          </article>
        ) : null}

        {activeCompanionSequence ? (
          <article className="windowing-summary-card">
            <span>Companion Sequence Navigator</span>
            <strong>{activeCompanionSequence.label}</strong>
            <p>
              The selected stage now resolves into an ordered companion sequence, so current review surface, primary companion, and follow-up coverage stay
              visible as one local-only navigation relay.
            </p>
            <div className="workflow-readiness-list">
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Ordered steps</span>
                <strong>{activeCompanionSequence.steps.length} sequence steps</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Current step</span>
                <strong>
                  {activeCompanionSequenceCurrentStepIndex >= 0
                    ? `Step ${activeCompanionSequenceCurrentStepIndex + 1} of ${activeCompanionSequence.steps.length}`
                    : "No active sequence step"}
                </strong>
              </div>
            </div>
            {relevantCompanionSequences.length > 1 ? (
              <div className="windowing-preview-list">
                {relevantCompanionSequences.map((sequence) => {
                  const sourceAction = reviewSurfaceActionById.get(sequence.steps[0]?.actionId ?? "") ?? null;
                  const sourceStage = sourceAction
                    ? selectStudioReleaseDeliveryChainStage(pipeline, sourceAction.deliveryChainStageId ?? "")
                    : null;
                  const sourceWindow = sourceAction?.windowId
                    ? windowing?.roster.windows.find((entry) => entry.id === sourceAction.windowId) ?? null
                    : null;
                  const active = sequence.id === activeCompanionSequence.id;

                  return (
                    <div key={sequence.id} className="windowing-preview-line windowing-preview-line--stacked">
                      <span>Companion Sequence Switcher</span>
                      <strong>{active ? `${sequence.label} / active sequence` : sequence.label}</strong>
                      <p>{sequence.summary}</p>
                      <div className="trace-note-links">
                        <span className={`windowing-badge${active ? " windowing-badge--active" : ""}`}>{sequence.steps.length} steps</span>
                        <span className="windowing-badge">
                          {sourceStage?.label ?? sourceAction?.deliveryChainStageId ?? "No stage"} / {sourceWindow?.label ?? sourceAction?.windowId ?? "No window"}
                        </span>
                        <span className="windowing-badge">{formatCompanionRouteState(sourceAction, windowing)}</span>
                      </div>
                      {onRunCompanionSequence && sourceAction ? (
                        <div className="windowing-card__actions">
                          <button type="button" className="secondary-button" onClick={() => onRunCompanionSequence(sequence.id)}>
                            {active ? "Refresh sequence" : "Switch sequence"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
            <div className="windowing-preview-list">
              {(compact ? activeCompanionSequence.steps.slice(0, 3) : activeCompanionSequence.steps).map((step, index) => {
                const stepAction = reviewSurfaceActionById.get(step.actionId) ?? null;
                const stepStage = stepAction?.deliveryChainStageId
                  ? selectStudioReleaseDeliveryChainStage(pipeline, stepAction.deliveryChainStageId)
                  : null;
                const stepWindow = stepAction?.windowId
                  ? windowing?.roster.windows.find((entry) => entry.id === stepAction.windowId) ?? null
                  : null;
                const stepLane = stepAction?.sharedStateLaneId
                  ? windowing?.sharedState.lanes.find((entry) => entry.id === stepAction.sharedStateLaneId) ?? null
                  : null;
                const stepBoard = stepAction?.orchestrationBoardId
                  ? windowing?.orchestration.boards.find((entry) => entry.id === stepAction.orchestrationBoardId) ?? null
                  : null;
                const stepMapping = stepAction?.observabilityMappingId
                  ? windowing?.observability.mappings.find((entry) => entry.id === stepAction.observabilityMappingId) ?? null
                  : null;
                const active = step.actionId === activeStageReviewSurfaceAction?.id;

                return (
                  <div key={step.id} className="windowing-preview-line windowing-preview-line--stacked">
                    <span>
                      Step {index + 1} of {activeCompanionSequence.steps.length}
                    </span>
                    <strong>{active ? `${stepAction?.label ?? step.actionId} / current step` : stepAction?.label ?? step.actionId}</strong>
                    <p>{step.summary}</p>
                    <div className="trace-note-links">
                      <span className={`windowing-badge${active ? " windowing-badge--active" : ""}`}>
                        {formatCompanionReviewSequenceStepRole(step.role)}
                      </span>
                      <span className="windowing-badge">
                        {stepStage?.label ?? stepAction?.deliveryChainStageId ?? "No stage"} / {stepWindow?.label ?? stepAction?.windowId ?? "No window"}
                      </span>
                      <span className="windowing-badge">
                        {stepLane?.label ?? stepAction?.sharedStateLaneId ?? "No lane"} / {stepBoard?.label ?? stepAction?.orchestrationBoardId ?? "No board"}
                      </span>
                      <span className="windowing-badge">{stepMapping?.label ?? stepAction?.observabilityMappingId ?? "No observability path"}</span>
                      <span className="windowing-badge">{formatCompanionRouteState(stepAction, windowing)}</span>
                    </div>
                    {onRunReviewSurfaceAction && stepAction ? (
                      <div className="windowing-card__actions">
                        <button type="button" className="secondary-button" onClick={() => onRunReviewSurfaceAction(stepAction)}>
                          {active ? "Refresh step" : "Focus step"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </article>
        ) : null}

        {resolvedCompanionReviewPaths.length > 0 ? (
          <article className="windowing-summary-card">
            <span>Companion Review Paths</span>
            <strong>{activeCompanionReviewPath?.label ?? "No companion review path"}</strong>
            <p>
              The selected stage now keeps explicit companion review paths under the active sequence, so source-to-primary/follow-up pivots stay inspectable
              instead of collapsing into one mapped jump.
            </p>
            <div className="workflow-readiness-list">
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Explicit paths</span>
                <strong>{resolvedCompanionReviewPaths.length} stage-linked paths</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Current source</span>
                <strong>{activeStageReviewSurfaceAction?.label ?? "No active source surface"}</strong>
              </div>
            </div>
            <div className="windowing-preview-list">
              {(compact ? resolvedCompanionReviewPaths.slice(0, 2) : resolvedCompanionReviewPaths).map((path) => {
                const sourceAction = reviewSurfaceActionById.get(path.sourceActionId) ?? null;
                const primaryAction = reviewSurfaceActionById.get(path.primaryActionId) ?? null;
                const companionSequence = relevantCompanionSequences.find((sequence) => sequence.id === path.sequenceId) ?? null;
                const followUpActions = (path.followUpActionIds ?? [])
                  .map((actionId) => reviewSurfaceActionById.get(actionId) ?? null)
                  .filter((action): action is ReviewCoverageAction => Boolean(action));
                const primaryStage = primaryAction
                  ? selectStudioReleaseDeliveryChainStage(pipeline, primaryAction.deliveryChainStageId ?? "")
                  : null;
                const primaryWindow = primaryAction?.windowId
                  ? windowing?.roster.windows.find((entry) => entry.id === primaryAction.windowId) ?? null
                  : null;
                const primaryLane = primaryAction?.sharedStateLaneId
                  ? windowing?.sharedState.lanes.find((entry) => entry.id === primaryAction.sharedStateLaneId) ?? null
                  : null;
                const primaryBoard = primaryAction?.orchestrationBoardId
                  ? windowing?.orchestration.boards.find((entry) => entry.id === primaryAction.orchestrationBoardId) ?? null
                  : null;
                const active =
                  path.sourceActionId === activeStageReviewSurfaceAction?.id ||
                  path.primaryActionId === activeStageReviewSurfaceAction?.id ||
                  Boolean(activeStageReviewSurfaceAction?.id && path.followUpActionIds?.includes(activeStageReviewSurfaceAction.id));

                return (
                  <div key={path.id} className="windowing-preview-line windowing-preview-line--stacked">
                    <span>{formatCompanionReviewPathKind(path.kind)}</span>
                    <strong>{active ? `${path.label} / current source` : path.label}</strong>
                    <p>{path.summary}</p>
                    <div className="trace-note-links">
                      <span className={`windowing-badge${active ? " windowing-badge--active" : ""}`}>{sourceAction?.label ?? path.sourceActionId}</span>
                      <span className="windowing-badge">{primaryAction?.label ?? path.primaryActionId}</span>
                      {companionSequence ? <span className="windowing-badge">{companionSequence.label}</span> : null}
                      <span className="windowing-badge">
                        {primaryStage?.label ?? primaryAction?.deliveryChainStageId ?? "No stage"} / {primaryWindow?.label ?? primaryAction?.windowId ?? "No window"}
                      </span>
                      <span className="windowing-badge">
                        {primaryLane?.label ?? primaryAction?.sharedStateLaneId ?? "No lane"} / {primaryBoard?.label ?? primaryAction?.orchestrationBoardId ?? "No board"}
                      </span>
                      <span className="windowing-badge">
                        {formatCompanionRouteState(sourceAction, windowing)}
                        {" -> "}
                        {formatCompanionRouteState(primaryAction, windowing)}
                      </span>
                      {followUpActions.map((action) => (
                        <span key={`${path.id}-${action.id}`} className="windowing-badge">
                          {action.label}
                        </span>
                      ))}
                    </div>
                    {onRunReviewSurfaceAction && primaryAction ? (
                      <div className="windowing-card__actions">
                        <button type="button" className="secondary-button" onClick={() => onRunReviewSurfaceAction(primaryAction)}>
                          {primaryAction.label}
                        </button>
                        {followUpActions.map((action) => (
                          <button key={action.id} type="button" className="secondary-button" onClick={() => onRunReviewSurfaceAction(action)}>
                            {action.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </article>
        ) : null}

        <article className="windowing-summary-card">
          <span>Delivery Flow</span>
          <strong>{selectedDeliveryStage?.label ?? "No selected stage"}</strong>
          <p>
            Selected stage posture stays anchored to upstream evidence, downstream gates, and explicit promotion/publish/rollback branches instead of a flat artifact list.
          </p>
          <div className="workflow-readiness-list">
            <div className="workflow-readiness-line workflow-readiness-line--neutral">
              <span>Upstream stages</span>
              <strong>{upstreamStages.length > 0 ? upstreamStages.map((stage) => stage.label).join(" -> ") : "Chain entry"}</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--neutral">
              <span>Downstream stages</span>
              <strong>{downstreamStages.length > 0 ? downstreamStages.map((stage) => stage.label).join(" -> ") : "No downstream stage"}</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--neutral">
              <span>Promotion path</span>
              <strong>{pipeline.deliveryChain.promotionStageIds.map((stageId) => selectStudioReleaseDeliveryChainStage(pipeline, stageId)?.label ?? stageId).join(" / ")}</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--warning">
              <span>Publish gate</span>
              <strong>{publishStage ? `${publishStage.label} / ${publishStage.status}` : "Unavailable"}</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--warning">
              <span>Rollback path</span>
              <strong>{rollbackStage ? `${rollbackStage.label} / ${rollbackStage.status}` : "Unavailable"}</strong>
            </div>
          </div>
        </article>

        <article className="windowing-summary-card">
          <span>Artifact Coverage</span>
          <strong>{selectedArtifactGroup?.label ?? "No artifact group"}</strong>
          <p>
            {selectedArtifactGroup?.summary ??
              "Select a delivery stage to inspect grouped review artifacts and how they line up with packet evidence and closeout posture."}
          </p>
          {selectedDeliveryStage ? (
            <div className="delivery-chain-workspace__artifact-groups">
              {selectedDeliveryStage.artifactGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className={group.id === selectedArtifactGroup?.id ? "windowing-card windowing-card--active" : "windowing-card"}
                  onClick={() => {
                    setSelectedArtifactGroupId(group.id);
                  }}
                >
                  <span>{group.label}</span>
                  <strong>{group.artifacts.length} artifacts</strong>
                  <p>{group.summary}</p>
                </button>
              ))}
            </div>
          ) : null}
          {selectedArtifactGroup ? (
            <div className="windowing-preview-list">
              {(compact ? selectedArtifactGroup.artifacts.slice(0, 4) : selectedArtifactGroup.artifacts).map((artifact) => {
                const coverage = resolveArtifactCoverage(artifact, selectedPipelineStage ?? null, selectedCloseoutWindow ?? null);

                return (
                  <div key={artifact} className="windowing-preview-line windowing-preview-line--stacked">
                    <span>{coverage.label}</span>
                    <strong>{artifact}</strong>
                    <p>{coverage.detail}</p>
                    <div className="trace-note-links">
                      {coverage.badges.map((badge) => (
                        <span key={`${artifact}-${badge}`} className={`windowing-badge${coverage.tone === "positive" ? " windowing-badge--active" : ""}`}>
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </article>

        <article className="windowing-summary-card">
          <span>Blockers / Handoff Posture</span>
          <strong>{selectedPipelineStage?.handoff.label ?? "No handoff posture"}</strong>
          <p>
            Blockers stay connected to the selected stage handoff, active queue entry, and evidence closeout so delayed promotion, publish, and rollback posture can be reviewed from one place.
          </p>
          <div className="workflow-readiness-list">
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveBatonTone(selectedPipelineStage?.handoff.batonState ?? "blocked")}`}>
              <span>Handoff posture</span>
              <strong>{selectedPipelineStage ? `${selectedPipelineStage.handoff.batonState} / ${selectedPipelineStage.handoff.targetOwner}` : "Unavailable"}</strong>
            </div>
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveAcknowledgementTone(activeQueueEntry?.acknowledgementState ?? "blocked")}`}>
              <span>Active acknowledgement</span>
              <strong>{activeQueueEntry ? `${activeQueueEntry.acknowledgementState} / ${activeQueueEntry.owner}` : "Unavailable"}</strong>
            </div>
            <div className={`workflow-readiness-line workflow-readiness-line--${resolveSealTone(selectedPipelineStage?.closeout.sealingState ?? "blocked")}`}>
              <span>Closeout posture</span>
              <strong>{selectedPipelineStage ? `${selectedPipelineStage.closeout.sealingState} / ${selectedPipelineStage.closeout.pendingEvidence.length} pending` : "Unavailable"}</strong>
            </div>
            <div className="workflow-readiness-line workflow-readiness-line--warning">
              <span>Stage blockers</span>
              <strong>{selectedDeliveryStage?.blockedBy.length ?? 0} active blockers</strong>
            </div>
          </div>
          <div className="windowing-preview-list">
            {(compact ? selectedDeliveryStage?.blockedBy.slice(0, 3) ?? [] : selectedDeliveryStage?.blockedBy ?? []).map((blocker) => (
              <div key={blocker} className="windowing-preview-line windowing-preview-line--stacked">
                <span>Blocker</span>
                <strong>{blocker}</strong>
              </div>
            ))}
            {(compact ? selectedPipelineStage?.handoff.pending.slice(0, 3) ?? [] : selectedPipelineStage?.handoff.pending ?? []).map((pending) => (
              <div key={pending} className="windowing-preview-line windowing-preview-line--stacked">
                <span>Pending handoff</span>
                <strong>{pending}</strong>
              </div>
            ))}
          </div>
        </article>
      </div>
    </article>
  );
}
