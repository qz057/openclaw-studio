import type {
  StudioCommandAction,
  StudioCommandActionDeck,
  DockItem,
  StudioBoundarySummary,
  StudioHostExecutorState,
  StudioHostMutationIntent,
  StudioHostMutationPreview,
  StudioHostPreviewHandoff,
  StudioHostPreviewTraceStep,
  StudioHostTraceSlotState,
  StudioShellState,
  StudioTone
} from "@openclaw/shared";
import {
  selectStudioReleaseApprovalAuditRollbackEntryCheckpoint,
  selectStudioReleaseApprovalPipelineStage,
  selectStudioReleaseApprovalWorkflowStage,
  selectStudioReleaseCloseoutWindow,
  selectStudioReleaseDeliveryChainStage,
  selectStudioReleaseEscalationWindow,
  selectStudioReleasePackagedAppMaterializationContractFailureSurfaceMatch,
  selectStudioReleasePackagedAppMaterializationContractPlatform,
  selectStudioReleasePackagedAppMaterializationContractValidatorObservabilityBridge,
  selectStudioReleasePackagedAppMaterializationContractValidatorObservabilitySurfaceMatch,
  selectStudioReleaseQaCloseoutReadinessTrack,
  selectStudioReleaseRollbackLiveReadinessContract,
  selectStudioReviewStateContinuityEntry,
  selectStudioReleaseReviewerQueue,
  selectStudioWindowObservabilityMapping
} from "@openclaw/shared";

export interface ResolvedHostTraceFocus {
  slot: StudioHostTraceSlotState;
  usesHandoff: boolean;
  previewLabel: string;
  previewSummary: string;
  validationValue: string;
  validationDetail: string;
  resultValue: string;
  resultDetail: string;
  rollbackAuditValue: string;
  rollbackAuditDetail: string;
  summary: string;
  trace: StudioHostPreviewTraceStep[];
}

function createSyntheticTrace(slot: StudioHostTraceSlotState): ResolvedHostTraceFocus["trace"] {
  return slot.phases.length > 0 ? slot.phases : [];
}

export function resolveHostTraceTone(status: string): StudioTone {
  switch (status) {
    case "registered":
    case "valid":
    case "not-needed":
      return "positive";
    case "blocked":
    case "mapped":
      return "neutral";
    default:
      return "warning";
  }
}

export function formatHostTraceIntent(intent: StudioHostMutationIntent): string {
  switch (intent) {
    case "root-connect":
      return "Root connect";
    case "bridge-attach":
      return "Bridge attach";
    case "connector-activate":
      return "Connector activate";
    case "connector-lifecycle":
      return "Connector lifecycle";
    case "rollback-settlement":
      return "Rollback settlement";
    default:
      return "Lane apply";
  }
}

function formatBoundaryLayerLabel(value: StudioBoundarySummary["currentLayer"]): string {
  switch (value) {
    case "local-only":
      return "Local-only";
    case "preview-host":
      return "Preview-host";
    case "withheld":
      return "Withheld";
    default:
      return "Future executor";
  }
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

function formatMaterializationValidatorStatus(status: "ready" | "watch" | "blocked"): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "watch":
      return "Watch";
    default:
      return "Blocked";
  }
}

function formatFailureDisposition(disposition: "blocked" | "abort" | "partial-apply" | "rollback"): string {
  switch (disposition) {
    case "blocked":
      return "Blocked";
    case "abort":
      return "Abort";
    case "partial-apply":
      return "Partial apply";
    default:
      return "Rollback";
  }
}

export function getDefaultTraceFocusSlotId(hostExecutor: StudioHostExecutorState): string | null {
  return hostExecutor.bridge.trace.focusSlotId || hostExecutor.bridge.trace.slotRoster[0]?.slotId || null;
}

export function resolveHostTraceFocus(
  hostExecutor: StudioHostExecutorState,
  focusedSlotId?: string | null,
  hostHandoff?: StudioHostPreviewHandoff | null,
  hostPreview?: StudioHostMutationPreview | null
): ResolvedHostTraceFocus | null {
  const slotRoster = hostExecutor.bridge.trace.slotRoster;
  const nextSlotId = focusedSlotId || hostHandoff?.mapping.slotId || getDefaultTraceFocusSlotId(hostExecutor);
  const slot = slotRoster.find((entry) => entry.slotId === nextSlotId) ?? slotRoster[0];

  if (!slot) {
    return null;
  }

  const usesHandoff = Boolean(hostHandoff && hostHandoff.mapping.slotId === slot.slotId);

  if (usesHandoff && hostHandoff) {
    return {
      slot,
      usesHandoff: true,
      previewLabel: hostPreview?.requestedTarget ?? hostHandoff.mapping.requestedTarget,
      previewSummary: hostPreview?.title ?? hostHandoff.mapping.summary,
      validationValue: hostHandoff.validation.status,
      validationDetail: `${slot.validatorLabel} · ${hostHandoff.validation.checkedFieldIds.length} checked fields`,
      resultValue: `${hostHandoff.slotResult.status} / ${hostHandoff.slotResult.stage}`,
      resultDetail: `${hostHandoff.slotResult.failureCode} · ${hostHandoff.slotResult.failureDisposition}`,
      rollbackAuditValue: `${hostHandoff.slotResult.rollbackDisposition} / ${hostHandoff.audit.status}`,
      rollbackAuditDetail: hostHandoff.audit.correlationId,
      summary: hostHandoff.slotResult.summary,
      trace: hostHandoff.trace.length > 0 ? hostHandoff.trace : createSyntheticTrace(slot)
    };
  }

  return {
    slot,
    usesHandoff: false,
    previewLabel: hostPreview?.requestedTarget ?? "shell overview",
    previewSummary: hostPreview?.title ?? "Preview-host path remains disabled and descriptive only.",
    validationValue: `${slot.validatorState} / slot-linked`,
    validationDetail: `${slot.validatorLabel} · ${slot.requiredPayloadFieldCount} payload / ${slot.requiredResultFieldCount} result fields`,
    resultValue: `${slot.primaryStatus} / ${slot.primaryStage}`,
    resultDetail: `${slot.failureCode} · ${slot.failureDisposition}`,
    rollbackAuditValue: `${slot.rollbackDisposition} / placeholder`,
    rollbackAuditDetail: "placeholder audit correlation",
    summary: slot.summary,
    trace: createSyntheticTrace(slot)
  };
}

export function createInspectorSections(
  boundary: StudioBoundarySummary,
  focus: ResolvedHostTraceFocus | null,
  options?: {
    windowing?: StudioShellState["windowing"];
    reviewStateContinuity?: StudioShellState["reviewStateContinuity"];
    actionDeck?: StudioCommandActionDeck | null;
    reviewSurfaceActions?: StudioCommandAction[] | null;
    activeLaneId?: string | null;
    activeWindowId?: string | null;
    activeBoardId?: string | null;
    activeMappingId?: string | null;
    activeReviewSurfaceActionId?: string | null;
  }
) {
  const windowing = options?.windowing;
  const activeLaneId = options?.activeLaneId;
  const activeWindowId = options?.activeWindowId;
  const activeBoardId = options?.activeBoardId;
  const activeMappingId = options?.activeMappingId;
  const activeReviewSurfaceActionId = options?.activeReviewSurfaceActionId;
  const rollbackValue = focus
    ? focus.usesHandoff
      ? focus.rollbackAuditValue
      : `${focus.slot.rollbackDisposition} / ${focus.slot.terminalStatus}`
    : "Unavailable";
  const auditValue = focus ? (focus.usesHandoff ? focus.rollbackAuditDetail : "Placeholder linked") : "Unavailable";
  const currentReleaseStage = selectStudioReleaseApprovalPipelineStage(boundary.hostExecutor.releaseApprovalPipeline);
  const currentReviewerQueue = selectStudioReleaseReviewerQueue(boundary.hostExecutor.releaseApprovalPipeline, currentReleaseStage);
  const currentDeliveryStage = selectStudioReleaseDeliveryChainStage(boundary.hostExecutor.releaseApprovalPipeline, currentReleaseStage);
  const currentDecisionHandoff = boundary.hostExecutor.releaseApprovalPipeline.decisionHandoff;
  const currentEscalationWindow = selectStudioReleaseEscalationWindow(boundary.hostExecutor.releaseApprovalPipeline, currentReleaseStage);
  const currentEvidenceCloseout = boundary.hostExecutor.releaseApprovalPipeline.evidenceCloseout;
  const currentCloseoutWindow = selectStudioReleaseCloseoutWindow(boundary.hostExecutor.releaseApprovalPipeline, currentReleaseStage);
  const publishDeliveryStage = selectStudioReleaseDeliveryChainStage(boundary.hostExecutor.releaseApprovalPipeline, "delivery-chain-publish-decision");
  const rollbackDeliveryStage = selectStudioReleaseDeliveryChainStage(boundary.hostExecutor.releaseApprovalPipeline, "delivery-chain-rollback-readiness");
  const activeMaterializationPlatform =
    selectStudioReleasePackagedAppMaterializationContractPlatform(boundary.hostExecutor.releaseApprovalPipeline.deliveryChain) ?? null;
  const activeMaterializationValidatorBridge =
    selectStudioReleasePackagedAppMaterializationContractValidatorObservabilityBridge(
      boundary.hostExecutor.releaseApprovalPipeline.deliveryChain,
      activeMaterializationPlatform?.id
    ) ?? null;
  const activeMaterializationValidatorSurface =
    selectStudioReleasePackagedAppMaterializationContractValidatorObservabilitySurfaceMatch(
      boundary.hostExecutor.releaseApprovalPipeline.deliveryChain,
      windowing,
      options?.reviewStateContinuity,
      activeMaterializationPlatform?.id
    );
  const activeMaterializationFailureSurface =
    selectStudioReleasePackagedAppMaterializationContractFailureSurfaceMatch(
      boundary.hostExecutor.releaseApprovalPipeline.deliveryChain,
      windowing,
      options?.reviewStateContinuity,
      options?.actionDeck,
      options?.reviewSurfaceActions,
      activeMaterializationPlatform?.id
    );
  const stageCReadiness = boundary.hostExecutor.releaseApprovalPipeline.deliveryChain.stageCReadiness;
  const stageCQaTrack = selectStudioReleaseQaCloseoutReadinessTrack(boundary.hostExecutor.releaseApprovalPipeline.deliveryChain);
  const stageCWorkflowStage = selectStudioReleaseApprovalWorkflowStage(boundary.hostExecutor.releaseApprovalPipeline.deliveryChain);
  const stageCCheckpoint = selectStudioReleaseApprovalAuditRollbackEntryCheckpoint(boundary.hostExecutor.releaseApprovalPipeline.deliveryChain);
  const rollbackReadinessContract = selectStudioReleaseRollbackLiveReadinessContract(boundary.hostExecutor.releaseApprovalPipeline.deliveryChain);
  const activeLane =
    (activeLaneId ? windowing?.sharedState.lanes.find((lane) => lane.id === activeLaneId) : undefined) ??
    (windowing ? windowing.sharedState.lanes.find((lane) => lane.id === windowing.sharedState.activeLaneId) : undefined) ??
    null;
  const activeWindow =
    (activeWindowId ? windowing?.roster.windows.find((entry) => entry.id === activeWindowId) : undefined) ??
    (activeLane && windowing ? windowing.roster.windows.find((entry) => entry.id === activeLane.windowId) : undefined) ??
    (windowing ? windowing.roster.windows.find((entry) => entry.id === windowing.roster.activeWindowId) : undefined) ??
    null;
  const activeBoard =
    (activeBoardId ? windowing?.orchestration.boards.find((board) => board.id === activeBoardId) : undefined) ??
    (activeLane && windowing ? windowing.orchestration.boards.find((board) => board.laneId === activeLane.workflowLaneId) : undefined) ??
    (windowing ? windowing.orchestration.boards.find((board) => board.id === windowing.orchestration.activeBoardId) : undefined) ??
    null;
  const activeObservabilityMapping = windowing ? selectStudioWindowObservabilityMapping(windowing, activeMappingId) ?? null : null;
  const activeReviewContinuity = options?.reviewStateContinuity
    ? selectStudioReviewStateContinuityEntry(options.reviewStateContinuity, {
        reviewSurfaceActionId: activeReviewSurfaceActionId,
        observabilityMappingId: activeMappingId,
        sharedStateLaneId: activeLaneId,
        orchestrationBoardId: activeBoardId,
        windowId: activeWindowId
      }) ?? null
    : null;
  const reviewContinuityValue = activeReviewContinuity
    ? `${activeReviewContinuity.label} / ${
        activeReviewContinuity.readouts.find((line) => line.id === "continuity-spine")?.value ?? "No continuity spine"
      }`
    : "Unavailable";
  const continuityCloseoutValue =
    activeReviewContinuity?.readouts.find((line) => line.id === "closeout-timing")?.value ?? "Unavailable";
  const mappedReviewPathValue =
    activeReviewContinuity?.readouts.find((line) => line.id === "mapped-review-path")?.value ?? "Unavailable";
  const stageCBoundaryValue = `${formatBoundaryLayerLabel(stageCReadiness.boundaryLinkage.currentBoundaryLayer)} -> ${formatBoundaryLayerLabel(stageCReadiness.boundaryLinkage.nextBoundaryLayer)}`;
  const stageCBoundaryCounts = `${stageCReadiness.boundaryLinkage.withheldPlanStepIds.length} withheld / ${stageCReadiness.boundaryLinkage.futureExecutorSlotIds.length} future`;

  return [
    {
      id: "layer",
      label: "Current layer",
      value: formatBoundaryLayerLabel(boundary.currentLayer)
    },
    {
      id: "host",
      label: "Host state",
      value: boundary.hostState === "future-executor" ? "Future executor" : "Withheld"
    },
    {
      id: "next",
      label: "Next layer",
      value: formatBoundaryLayerLabel(boundary.nextLayer)
    },
    {
      id: "slot-focus",
      label: "Trace focus",
      value: focus?.slot.label ?? "Unavailable"
    },
    {
      id: "handler",
      label: "Handler state",
      value: focus ? `${focus.slot.handlerState} / disabled` : "Unavailable"
    },
    {
      id: "validator",
      label: "Validator state",
      value: focus ? focus.validationValue : "Unavailable"
    },
    {
      id: "approval-pipeline",
      label: "Operator review board",
      value: currentReleaseStage ? `${currentReleaseStage.label} / ${currentReleaseStage.status}` : "Unavailable"
    },
    {
      id: "delivery-chain",
      label: "Delivery chain",
      value: currentDeliveryStage ? `${currentDeliveryStage.label} / ${currentDeliveryStage.phase}` : "Unavailable"
    },
    {
      id: "reviewer-queue",
      label: "Reviewer queue",
      value: currentReviewerQueue ? `${currentReviewerQueue.label} / ${currentReviewerQueue.status}` : "Unavailable"
    },
    {
      id: "ack-state",
      label: "Acknowledgement",
      value: currentReviewerQueue ? `${currentReviewerQueue.acknowledgementState} / ${currentReviewerQueue.owner}` : "Unavailable"
    },
    {
      id: "decision-handoff",
      label: "Decision handoff",
      value: `${currentDecisionHandoff.batonState} / ${currentDecisionHandoff.targetOwner}`
    },
    {
      id: "escalation-window",
      label: "Escalation window",
      value: currentEscalationWindow ? `${currentEscalationWindow.label} / ${currentEscalationWindow.state}` : "Unavailable"
    },
    {
      id: "evidence-closeout",
      label: "Evidence closeout",
      value: `${currentEvidenceCloseout.sealingState} / ${currentEvidenceCloseout.owner}`
    },
    {
      id: "closeout-window",
      label: "Closeout window",
      value: currentCloseoutWindow ? `${currentCloseoutWindow.label} / ${currentCloseoutWindow.state}` : "Unavailable"
    },
    {
      id: "release-qa-closeout",
      label: "QA closeout",
      value: stageCQaTrack ? `${stageCQaTrack.label} / ${stageCQaTrack.status}` : "Unavailable"
    },
    {
      id: "publish-rollback",
      label: "Publish / rollback",
      value:
        publishDeliveryStage && rollbackDeliveryStage
          ? `${publishDeliveryStage.status} publish / ${rollbackDeliveryStage.status} rollback`
          : "Unavailable"
    },
    {
      id: "stage-c-entry",
      label: "Stage C entry",
      value: stageCCheckpoint ? `${stageCCheckpoint.label} / ${stageCCheckpoint.state}` : "Unavailable"
    },
    {
      id: "stage-c-workflow",
      label: "Approval workflow",
      value: stageCWorkflowStage ? `${stageCWorkflowStage.label} / ${stageCWorkflowStage.status}` : "Unavailable"
    },
    {
      id: "stage-c-rollback",
      label: "Rollback readiness",
      value: rollbackReadinessContract ? `${rollbackReadinessContract.from} -> ${rollbackReadinessContract.to} / ${rollbackReadinessContract.status}` : "Unavailable"
    },
    {
      id: "stage-c-boundary",
      label: "Boundary bridge",
      value: `${stageCBoundaryValue} / ${stageCBoundaryCounts}`
    },
    {
      id: "materialization-validator",
      label: "Materialization bridge",
      value: activeMaterializationValidatorBridge
        ? `${activeMaterializationValidatorSurface.activeReadout?.label ?? activeMaterializationValidatorBridge.label} / ${
            activeMaterializationValidatorSurface.activeReadout
              ? formatMaterializationValidatorStatus(activeMaterializationValidatorSurface.activeReadout.status)
              : "Unavailable"
          }`
        : "Unavailable"
    },
    {
      id: "materialization-observability",
      label: "Materialization observability",
      value: activeMaterializationValidatorSurface.activeReadout
        ? `${activeMaterializationValidatorSurface.observabilityMapping?.label ?? activeMaterializationValidatorSurface.activeReadout.observabilityMappingId} / ${
            activeMaterializationValidatorSurface.lane?.label ?? activeMaterializationValidatorSurface.activeReadout.sharedStateLaneId
          }`
        : "Unavailable"
    },
    {
      id: "materialization-continuity",
      label: "Materialization continuity",
      value: activeMaterializationValidatorSurface.activeReadout
        ? activeMaterializationValidatorSurface.reviewStateContinuityEntry?.label ??
          `${activeMaterializationValidatorSurface.window?.label ?? activeMaterializationValidatorSurface.activeReadout.windowId} / ${
            activeMaterializationValidatorSurface.board?.label ?? activeMaterializationValidatorSurface.activeReadout.orchestrationBoardId
          }`
        : "Unavailable"
    },
    {
      id: "materialization-failure",
      label: "Materialization failure",
      value: activeMaterializationFailureSurface.activeReadout
        ? `${activeMaterializationFailureSurface.activeReadout.label} / ${formatFailureDisposition(
            activeMaterializationFailureSurface.activeReadout.failureDisposition
          )}`
        : "Unavailable"
    },
    {
      id: "failure-surface",
      label: "Failure surface",
      value: activeMaterializationFailureSurface.primaryAction
        ? `${activeMaterializationFailureSurface.observabilityMapping?.label ?? activeMaterializationFailureSurface.primaryAction.observabilityMappingId} / ${
            activeMaterializationFailureSurface.lane?.label ?? activeMaterializationFailureSurface.primaryAction.sharedStateLaneId
          }`
        : "Unavailable"
    },
    {
      id: "failure-continuity",
      label: "Failure continuity",
      value: activeMaterializationFailureSurface.primaryAction
        ? activeMaterializationFailureSurface.reviewStateContinuityEntry?.label ??
          `${activeMaterializationFailureSurface.window?.label ?? activeMaterializationFailureSurface.primaryAction.windowId} / ${
            activeMaterializationFailureSurface.board?.label ?? activeMaterializationFailureSurface.primaryAction.orchestrationBoardId
          }`
        : "Unavailable"
    },
    {
      id: "window-focus",
      label: "Window focus",
      value: activeWindow?.label ?? "Unavailable"
    },
    {
      id: "shared-state",
      label: "Shared-state lane",
      value: activeLane ? `${activeLane.label} / ${activeLane.sync.health}` : "Unavailable"
    },
    {
      id: "orchestration-board",
      label: "Orchestration board",
      value: activeBoard ? `${activeBoard.label} / ${activeBoard.reviewPosture.stageLabel}` : "Unavailable"
    },
    {
      id: "review-posture",
      label: "Review posture owner",
      value: activeObservabilityMapping
        ? `${activeObservabilityMapping.owner} / ${formatReviewPostureRelationship(activeObservabilityMapping.relationship)}`
        : "Unavailable"
    },
    {
      id: "review-continuity",
      label: "Review continuity",
      value: reviewContinuityValue
    },
    {
      id: "continuity-closeout",
      label: "Closeout timing",
      value: continuityCloseoutValue
    },
    {
      id: "mapped-review-path",
      label: "Mapped review path",
      value: mappedReviewPathValue
    },
    {
      id: "rollback",
      label: "Rollback posture",
      value: rollbackValue
    },
    {
      id: "audit",
      label: "Audit posture",
      value: auditValue
    },
    {
      id: "blocked",
      label: "Blocked reasons",
      value: `${boundary.blockedReasons.length} active`
    },
    {
      id: "slots",
      label: "Future slots",
      value: `${boundary.futureExecutorSlots.length} planned`
    }
  ];
}

export function createDockItems(focus: ResolvedHostTraceFocus | null): DockItem[] {
  if (!focus) {
    return [];
  }

  return [
    {
      id: "dock-focus-slot",
      label: "Focus slot",
      value: focus.slot.label,
      detail: "Bottom dock follows the same per-slot focus as the inspector and trace roster.",
      tone: "neutral",
      slotId: focus.slot.slotId
    },
    {
      id: "dock-focus-handler",
      label: "Handler",
      value: `${focus.slot.handlerState} / disabled`,
      detail: focus.slot.handlerLabel,
      tone: resolveHostTraceTone(focus.slot.handlerState),
      slotId: focus.slot.slotId
    },
    {
      id: "dock-focus-validator",
      label: "Validator",
      value: focus.validationValue,
      detail: focus.validationDetail,
      tone: resolveHostTraceTone(focus.slot.validatorState),
      slotId: focus.slot.slotId
    },
    {
      id: "dock-focus-result",
      label: "Result",
      value: focus.resultValue,
      detail: focus.resultDetail,
      tone: resolveHostTraceTone(focus.slot.primaryStatus),
      slotId: focus.slot.slotId
    },
    {
      id: "dock-focus-rollback",
      label: "Rollback / audit",
      value: focus.rollbackAuditValue,
      detail: focus.rollbackAuditDetail,
      tone: resolveHostTraceTone(focus.slot.rollbackDisposition),
      slotId: focus.slot.slotId
    }
  ];
}
