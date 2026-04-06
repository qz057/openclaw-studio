import type {
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
  selectStudioReleaseApprovalPipelineStage,
  selectStudioReleaseCloseoutWindow,
  selectStudioReleaseEscalationWindow,
  selectStudioReleaseReviewerQueue,
  selectStudioWindowObservabilityActiveMapping
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
  windowing?: StudioShellState["windowing"],
  activeLaneId?: string | null,
  activeWindowId?: string | null
) {
  const rollbackValue = focus
    ? focus.usesHandoff
      ? focus.rollbackAuditValue
      : `${focus.slot.rollbackDisposition} / ${focus.slot.terminalStatus}`
    : "Unavailable";
  const auditValue = focus ? (focus.usesHandoff ? focus.rollbackAuditDetail : "Placeholder linked") : "Unavailable";
  const currentReleaseStage = selectStudioReleaseApprovalPipelineStage(boundary.hostExecutor.releaseApprovalPipeline);
  const currentReviewerQueue = selectStudioReleaseReviewerQueue(boundary.hostExecutor.releaseApprovalPipeline, currentReleaseStage);
  const currentDecisionHandoff = boundary.hostExecutor.releaseApprovalPipeline.decisionHandoff;
  const currentEscalationWindow = selectStudioReleaseEscalationWindow(boundary.hostExecutor.releaseApprovalPipeline, currentReleaseStage);
  const currentEvidenceCloseout = boundary.hostExecutor.releaseApprovalPipeline.evidenceCloseout;
  const currentCloseoutWindow = selectStudioReleaseCloseoutWindow(boundary.hostExecutor.releaseApprovalPipeline, currentReleaseStage);
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
    (activeLane && windowing ? windowing.orchestration.boards.find((board) => board.laneId === activeLane.workflowLaneId) : undefined) ??
    (windowing ? windowing.orchestration.boards.find((board) => board.id === windowing.orchestration.activeBoardId) : undefined) ??
    null;
  const activeObservabilityMapping = windowing ? selectStudioWindowObservabilityActiveMapping(windowing) ?? null : null;

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
