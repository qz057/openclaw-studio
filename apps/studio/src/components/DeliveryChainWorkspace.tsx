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
  compact?: boolean;
  nested?: boolean;
  eyebrow?: string;
  title?: string;
  summary?: string;
}

type Tone = "positive" | "neutral" | "warning";

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
  const panelClassName = [
    nested ? "delivery-chain-workspace delivery-chain-workspace--nested" : "surface card delivery-chain-workspace",
    compact ? "delivery-chain-workspace--compact" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={panelClassName}>
      <div className="card-header card-header--stack">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title ?? "Delivery-chain Workspace"}</h2>
          <p>
            {summary ??
              "Stage Explorer ties the operator board, delivery stage, review artifacts, promotion/publish/rollback flow, blockers, handoff posture, and observability mapping into one local-only review surface."}
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
            <span>Path Handoff Stabilization</span>
            <strong>{activeCompanionPathHandoff?.label ?? activeCompanionRouteHistoryEntry?.label ?? "No stabilized handoff"}</strong>
            <p>
              The selected stage now keeps typed path handoff posture and remembered route transitions together, so returning to the same delivery lane
              restores the last companion path instead of flattening back to the default review surface.
            </p>
            <div className="workflow-readiness-list">
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Handoff stability</span>
                <strong>
                  {activeCompanionPathHandoff ? formatCompanionPathHandoffStability(activeCompanionPathHandoff.stability) : "No active handoff"}
                </strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Companion Route History</span>
                <strong>{relevantCompanionRouteHistoryEntries.length} remembered routes</strong>
              </div>
              <div className="workflow-readiness-line workflow-readiness-line--neutral">
                <span>Latest transition</span>
                <strong>
                  {activeCompanionRouteHistoryEntry
                    ? formatCompanionRouteTransitionKind(activeCompanionRouteHistoryEntry.transitionKind)
                    : "No remembered transition"}
                </strong>
              </div>
            </div>
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
                    {onRunReviewSurfaceAction && targetAction ? (
                      <div className="windowing-card__actions">
                        <button type="button" className="secondary-button" onClick={() => onRunReviewSurfaceAction(targetAction)}>
                          {active ? "Refresh handoff" : "Focus handoff"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {(compact ? relevantCompanionRouteHistoryEntries.slice(0, 2) : relevantCompanionRouteHistoryEntries).map((entry) => {
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
                    {onRunReviewSurfaceAction && targetAction ? (
                      <div className="windowing-card__actions">
                        <button type="button" className="secondary-button" onClick={() => onRunReviewSurfaceAction(targetAction)}>
                          {active ? "Refresh memory" : "Focus memory"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
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
