export const studioPageIds = ["dashboard", "home", "sessions", "agents", "codex", "skills", "settings"] as const;

export type StudioPageId = (typeof studioPageIds)[number];
export type StudioTone = "neutral" | "positive" | "warning";
export type StudioBoundaryLayer = "local-only" | "preview-host" | "withheld" | "future-executor";
export type StudioBoundaryHostState = "withheld" | "future-executor";
export type StudioBoundaryProgressStatus = "active" | "available" | "blocked" | "future";
export type StudioBoundaryCapabilityState = "ready" | "partial" | "blocked";
export type StudioBoundaryPreconditionState = "met" | "partial" | "missing";
export type StudioBoundaryPlanStepState = "planned" | "withheld" | "future";
export type StudioBoundaryExecutorSlotState = "planned" | "future";
export type StudioHostExecutorMode = "disabled" | "withheld";
export type StudioHostBridgeHandlerState = "registered" | "disabled";
export type StudioHostBridgeValidatorState = "registered";
export type StudioHostMutationIntent = "root-connect" | "bridge-attach" | "connector-activate" | "lane-apply";
export type StudioHostLifecycleStageId =
  | "collect-context"
  | "request-approval"
  | "write-audit"
  | "handoff-slot"
  | "mutate-host"
  | "verify-host"
  | "rollback-host";
export type StudioHostLifecycleStageState = "ready" | "planned" | "withheld" | "future";
export type StudioHostMutationSlotState = "planned" | "withheld";
export type StudioHostApprovalStatus = "planned" | "withheld";
export type StudioHostAuditStatus = "planned" | "withheld";
export type StudioHostRollbackStatus = "planned" | "future";
export type StudioHostPlaceholderApprovalDecision = "withheld" | "approved" | "denied" | "expired" | "aborted";
export type StudioHostPreviewValidationStatus = "valid" | "invalid";
export type StudioHostPreviewAuditStatus = "seeded" | "linked" | "rollback-linked";
export type StudioHostPreviewRollbackDisposition = "not-needed" | "available" | "required" | "incomplete";
export type StudioHostPreviewStubResultStatus = "blocked" | "abort" | "partial-apply" | "rollback-required" | "rollback-incomplete";
export type StudioHostPreviewTracePhase = "preview" | "slot" | "result" | "rollback";
export type StudioHostPreviewTraceStatus =
  | "mapped"
  | "accepted"
  | StudioHostPreviewStubResultStatus
  | StudioHostPreviewRollbackDisposition;
export type StudioHostTraceFocusReason = "preferred-slot" | "recommended-slot";
export type StudioHostTraceSlotValidatorState = StudioHostBridgeValidatorState | "missing";
export type StudioContractLinkKind =
  | "approval"
  | "lifecycle"
  | "rollback"
  | "release-artifact"
  | "audit"
  | "trace-slot"
  | "review-stage"
  | "reviewer-queue"
  | "decision-handoff"
  | "evidence-closeout"
  | "escalation-window"
  | "closeout-window"
  | "window-intent"
  | "orchestration-board"
  | "window-roster"
  | "shared-state-lane";
export type StudioReleaseApprovalPipelineMode = "review-only";
export type StudioReleaseApprovalPipelineStageStatus = "ready" | "in-review" | "planned" | "blocked";
export type StudioReleaseReviewPacketStatus = "drafted" | "ready" | "in-review" | "sealed" | "blocked";
export type StudioReleaseDecisionBatonState = "held" | "handoff-ready" | "awaiting-ack" | "blocked";
export type StudioReleaseEvidenceSealState = "open" | "pending-seal" | "sealed" | "blocked";
export type StudioReleaseReviewerQueueStatus = "active" | "handoff-ready" | "escalated" | "closed";
export type StudioReleaseReviewerQueueEntryStatus = "queued" | "active" | "awaiting-ack" | "escalated" | "closed";
export type StudioReleaseAcknowledgementState = "pending" | "acknowledged" | "overdue" | "blocked";
export type StudioReleaseEscalationWindowState = "watch" | "open" | "escalated" | "blocked";
export type StudioReleaseCloseoutWindowState = "scheduled" | "open" | "ready-to-seal" | "blocked";
export type StudioReleaseDeliveryChainPhase = "attestation" | "review" | "promotion" | "publish" | "rollback";
export type StudioHostFailureCode =
  | "policy-disabled"
  | "approval-missing"
  | "approval-denied"
  | "approval-expired"
  | "precondition-missing"
  | "ipc-slot-unavailable"
  | "handoff-invalid"
  | "host-aborted"
  | "partial-apply"
  | "rollback-required"
  | "rollback-incomplete";
export type StudioHostFailureDisposition = "blocked" | "abort" | "partial-apply" | "rollback";
export type StudioBoundaryBlockedReasonCode =
  | "policy-no-host-execution"
  | "approval-required"
  | "host-bridge-missing"
  | "executor-slot-missing"
  | "dedicated-root-missing"
  | "bridge-sources-partial"
  | "activation-target-missing"
  | "rollback-missing"
  | "lifecycle-runner-missing"
  | "smoke-coverage-missing";

export const studioChannels = {
  shellState: "studio:shell-state",
  sessions: "studio:sessions",
  codexTasks: "studio:codex-tasks",
  hostExecutorState: "studio:host-executor-state",
  hostBridgeState: "studio:host-bridge-state",
  hostPreviewHandoff: "studio:host-preview-handoff",
  runtimeItemDetail: "studio:runtime-item-detail",
  runtimeItemAction: "studio:runtime-item-action"
} as const;

export type StudioChannel = (typeof studioChannels)[keyof typeof studioChannels];

export const studioHostBridgeSlotChannels = {
  rootConnect: "studio:host-executor-slot:root-connect",
  bridgeAttach: "studio:host-executor-slot:bridge-attach",
  connectorActivate: "studio:host-executor-slot:connector-activate",
  laneApply: "studio:host-executor-slot:lane-apply"
} as const;

export type StudioHostBridgeSlotChannel = (typeof studioHostBridgeSlotChannels)[keyof typeof studioHostBridgeSlotChannels];

export interface StudioStat {
  label: string;
  value: string;
  tone: StudioTone;
}

export interface StudioMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: StudioTone;
}

export interface HomePanel {
  id: string;
  title: string;
  description: string;
  stats: StudioStat[];
}

export interface HomeActivity {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
}

export interface SessionSummary {
  id: string;
  title: string;
  workspace: string;
  status: "active" | "waiting" | "complete";
  updatedAt: string;
  owner: string;
}

export interface CodexTaskSummary {
  id: string;
  title: string;
  model: string;
  status: "running" | "queued" | "needs-review" | "recent" | "complete";
  target: string;
  updatedAt: string;
  source: "mock" | "runtime";
  workdir?: string;
  detail?: string;
  loopState?: "stable" | "continuing" | "recovering" | "interrupted" | "complete";
  turnCount?: number;
  continuation?: string;
  recoveryCount?: number;
  interruptionCount?: number;
}

export interface DashboardWorkstream {
  id: string;
  title: string;
  detail: string;
  owner: string;
  stage: string;
  updatedAt: string;
  tone: StudioTone;
}

export interface DashboardAlert {
  id: string;
  title: string;
  detail: string;
  tone: StudioTone;
}

export interface AgentSummary {
  id: string;
  name: string;
  role: string;
  model: string;
  workspace: string;
  status: SessionSummary["status"];
  focus: string;
  approvals: string;
  isolation?: string;
  handoff?: string;
  updatedAt: string;
}

export interface SkillCatalogItem {
  id: string;
  name: string;
  surface: string;
  status: string;
  source: "mock" | "bridge" | "runtime";
  detail: string;
  origin?: string;
  path?: string;
  tone: StudioTone;
}

export interface SkillCatalogSection {
  id: string;
  label: string;
  description: string;
  items: SkillCatalogItem[];
}

export interface SettingItem {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: StudioTone;
}

export interface SettingSection {
  id: string;
  title: string;
  description: string;
  items: SettingItem[];
}

export interface ShellStatus {
  mode: string;
  bridge: "mock" | "hybrid" | "live";
  runtime: "idle" | "ready" | "degraded";
}

export interface StudioBoundaryPolicySummary {
  posture: string;
  approvalMode: string;
  detail: string;
  protectedSurfaces: string[];
}

export interface StudioBoundaryProgressStep {
  id: string;
  layer: StudioBoundaryLayer;
  label: string;
  status: StudioBoundaryProgressStatus;
  detail: string;
}

export interface StudioBoundaryCapability {
  id: string;
  label: string;
  state: StudioBoundaryCapabilityState;
  detail: string;
}

export interface StudioBoundaryBlockedReason {
  code: StudioBoundaryBlockedReasonCode;
  layer: StudioBoundaryLayer;
  label: string;
  detail: string;
}

export interface StudioBoundaryPrecondition {
  id: string;
  label: string;
  state: StudioBoundaryPreconditionState;
  detail: string;
}

export interface StudioBoundaryPlanStep {
  id: string;
  label: string;
  state: StudioBoundaryPlanStepState;
  detail: string;
}

export interface StudioBoundaryExecutorSlot {
  id: string;
  label: string;
  state: StudioBoundaryExecutorSlotState;
  detail: string;
}

export interface StudioHostContractField {
  id: string;
  label: string;
  required: boolean;
  detail: string;
}

export interface StudioHostContractShape {
  title: string;
  summary: string;
  fields: StudioHostContractField[];
}

export interface StudioHostApprovalContract {
  status: StudioHostApprovalStatus;
  mode: string;
  summary: string;
  request: StudioHostContractShape;
  result: StudioHostContractShape;
}

export interface StudioHostAuditContract {
  status: StudioHostAuditStatus;
  mode: string;
  summary: string;
  event: StudioHostContractShape;
  retainedStages: string[];
}

export interface StudioHostRollbackStage {
  id: string;
  label: string;
  state: StudioHostLifecycleStageState;
  detail: string;
}

export interface StudioHostRollbackContract {
  status: StudioHostRollbackStatus;
  summary: string;
  context: StudioHostContractShape;
  stages: StudioHostRollbackStage[];
}

export interface StudioHostMutationHandoffContract {
  version: string;
  payloadType: string;
  resultType: string;
  payload: StudioHostContractShape;
  result: StudioHostContractShape;
}

export interface StudioHostMutationSlot {
  id: string;
  intent: StudioHostMutationIntent;
  label: string;
  channel: StudioHostBridgeSlotChannel;
  state: StudioHostMutationSlotState;
  defaultEnabled: boolean;
  detail: string;
  handoff: StudioHostMutationHandoffContract;
}

export interface StudioHostLifecycleStage {
  id: string;
  stage: StudioHostLifecycleStageId;
  label: string;
  state: StudioHostLifecycleStageState;
  detail: string;
}

export interface StudioHostMutationIntentSummary {
  id: string;
  intent: StudioHostMutationIntent;
  label: string;
  detail: string;
  protectedSurfaces: string[];
}

export interface StudioHostFailureCase {
  code: StudioHostFailureCode;
  label: string;
  disposition: StudioHostFailureDisposition;
  stage: StudioHostLifecycleStageId | "global";
  detail: string;
}

export interface StudioHostBridgeValidator {
  id: string;
  slotId: string;
  label: string;
  state: StudioHostBridgeValidatorState;
  detail: string;
  requiredPayloadFieldIds: string[];
  requiredResultFieldIds: string[];
}

export interface StudioHostBridgeSimulatedOutcome {
  id: string;
  label: string;
  status: StudioHostPreviewStubResultStatus;
  stage: StudioHostLifecycleStageId;
  failureCode: StudioHostFailureCode;
  failureDisposition: StudioHostFailureDisposition;
  rollbackDisposition: StudioHostPreviewRollbackDisposition;
  summary: string;
}

export interface StudioContractLink {
  id: string;
  label: string;
  kind: StudioContractLinkKind;
  target: string;
}

export interface StudioLinkedNote {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: StudioTone;
  links?: StudioContractLink[];
}

export interface StudioHostBridgeSlotHandler {
  id: string;
  slotId: string;
  label: string;
  channel: StudioHostBridgeSlotChannel;
  state: StudioHostBridgeHandlerState;
  defaultEnabled: boolean;
  detail: string;
  simulatedOutcomes: StudioHostBridgeSimulatedOutcome[];
}

export interface StudioHostTraceSlotState {
  slotId: string;
  label: string;
  intent: StudioHostMutationIntent;
  channel: StudioHostBridgeSlotChannel;
  handlerLabel: string;
  handlerState: StudioHostBridgeHandlerState;
  validatorLabel: string;
  validatorState: StudioHostTraceSlotValidatorState;
  requiredPayloadFieldCount: number;
  requiredResultFieldCount: number;
  primaryStatus: StudioHostPreviewStubResultStatus;
  primaryStage: StudioHostLifecycleStageId;
  terminalStatus: StudioHostPreviewStubResultStatus;
  terminalStage: StudioHostLifecycleStageId;
  failureCode: StudioHostFailureCode;
  failureDisposition: StudioHostFailureDisposition;
  rollbackDisposition: StudioHostPreviewRollbackDisposition;
  outcomeChain: StudioHostPreviewStubResultStatus[];
  summary: string;
  phases: StudioHostPreviewTraceStep[];
}

export interface StudioHostTraceState {
  focusSlotId: string;
  focusReason: StudioHostTraceFocusReason;
  slotRoster: StudioHostTraceSlotState[];
}

export interface StudioHostBridgeState {
  id: string;
  title: string;
  summary: string;
  mode: "disabled";
  defaultEnabled: boolean;
  previewHandoff: "placeholder";
  validators: StudioHostBridgeValidator[];
  slotHandlers: StudioHostBridgeSlotHandler[];
  trace: StudioHostTraceState;
}

export interface StudioHostExecutorState {
  id: string;
  title: string;
  summary: string;
  mode: StudioHostExecutorMode;
  transport: "electron-ipc-skeleton";
  defaultEnabled: boolean;
  handoffContractVersion: string;
  bridge: StudioHostBridgeState;
  intents: StudioHostMutationIntentSummary[];
  lifecycle: StudioHostLifecycleStage[];
  approval: StudioHostApprovalContract;
  audit: StudioHostAuditContract;
  rollback: StudioHostRollbackContract;
  releaseApprovalPipeline: StudioReleaseApprovalPipeline;
  failureTaxonomy: StudioHostFailureCase[];
  mutationSlots: StudioHostMutationSlot[];
}

export interface StudioHostMutationPreview {
  id: string;
  intent: StudioHostMutationIntent;
  slotId: string;
  title: string;
  summary: string;
  status: "withheld";
  currentLifecycleStage: StudioHostLifecycleStageId;
  requestedTarget: string;
  slot: StudioHostMutationSlot;
  lifecycle: StudioHostLifecycleStage[];
  approval: StudioHostApprovalContract;
  audit: StudioHostAuditContract;
  rollback: StudioHostRollbackContract;
  failureTaxonomy: StudioHostFailureCase[];
  handoff?: StudioHostPreviewHandoff;
}

export interface StudioHostPreviewSlotMapping {
  previewId: string;
  requestId: string;
  slotId: string;
  channel: StudioHostBridgeSlotChannel;
  requestedTarget: string;
  status: "mapped";
  summary: string;
}

export interface StudioHostPreviewValidation {
  status: StudioHostPreviewValidationStatus;
  summary: string;
  checkedFieldIds: string[];
  missingFieldIds: string[];
}

export interface StudioHostPreviewApprovalState {
  requestId: string;
  approvalId: string;
  decision: StudioHostPlaceholderApprovalDecision;
  scope: string;
  summary: string;
}

export interface StudioHostPreviewAuditState {
  eventId: string;
  correlationId: string;
  stage: StudioHostLifecycleStageId;
  status: StudioHostPreviewAuditStatus;
  summary: string;
}

export interface StudioHostPreviewRollbackState {
  planId: string;
  disposition: StudioHostPreviewRollbackDisposition;
  checkpoint: string;
  summary: string;
}

export interface StudioHostPreviewSlotResult {
  slotId: string;
  channel: StudioHostBridgeSlotChannel;
  status: StudioHostPreviewStubResultStatus;
  stage: StudioHostLifecycleStageId;
  failureCode: StudioHostFailureCode;
  failureDisposition: StudioHostFailureDisposition;
  auditCorrelationId: string;
  rollbackDisposition: StudioHostPreviewRollbackDisposition;
  summary: string;
}

export interface StudioHostPreviewTraceStep {
  id: string;
  phase: StudioHostPreviewTracePhase;
  stage: StudioHostLifecycleStageId;
  label: string;
  status: StudioHostPreviewTraceStatus;
  summary: string;
  notes: StudioLinkedNote[];
}

export interface StudioHostPreviewHandoff {
  id: string;
  previewId: string;
  intent: StudioHostMutationIntent;
  simulated: true;
  mapping: StudioHostPreviewSlotMapping;
  validation: StudioHostPreviewValidation;
  approval: StudioHostPreviewApprovalState;
  audit: StudioHostPreviewAuditState;
  rollback: StudioHostPreviewRollbackState;
  slotResult: StudioHostPreviewSlotResult;
  simulatedOutcomes: StudioHostBridgeSimulatedOutcome[];
  trace: StudioHostPreviewTraceStep[];
}

export interface StudioBoundarySummary {
  id: string;
  title: string;
  summary: string;
  currentLayer: StudioBoundaryLayer;
  nextLayer: StudioBoundaryLayer;
  hostState: StudioBoundaryHostState;
  tone: StudioTone;
  policy: StudioBoundaryPolicySummary;
  progression: StudioBoundaryProgressStep[];
  capabilities: StudioBoundaryCapability[];
  blockedReasons: StudioBoundaryBlockedReason[];
  requiredPreconditions: StudioBoundaryPrecondition[];
  withheldExecutionPlan: StudioBoundaryPlanStep[];
  futureExecutorSlots: StudioBoundaryExecutorSlot[];
  hostExecutor: StudioHostExecutorState;
}

export interface StudioInspectorRouteDetail {
  routeId: StudioPageId;
  label: string;
  summary: string;
}

export interface StudioInspectorFlowDetail {
  id: string;
  sequenceId: string;
  label: string;
  summary: string;
  recommendedActionId?: string;
  followUpActionIds: string[];
}

export interface StudioInspectorLinkage {
  routeId?: StudioPageId;
  workflowLaneId?: string;
  workspaceViewId?: StudioWorkspaceViewId;
  windowIntentId?: string;
  detachedPanelId?: string;
  focusedSlotId?: string;
  windowId?: string;
  sharedStateLaneId?: string;
  orchestrationBoardId?: string;
  reviewStageId?: string;
  reviewerQueueId?: string;
  decisionHandoffId?: string;
  evidenceCloseoutId?: string;
  escalationWindowId?: string;
  closeoutWindowId?: string;
  deliveryChainStageId?: string;
  observabilityMappingId?: string;
}

export interface StudioReleaseReviewPacket {
  id: string;
  label: string;
  status: StudioReleaseReviewPacketStatus;
  owner: string;
  summary: string;
  deliveryChainStageId: string;
  evidence: string[];
  reviewerNotes: StudioLinkedNote[];
}

export interface StudioReleaseDecisionHandoff {
  id: string;
  label: string;
  batonState: StudioReleaseDecisionBatonState;
  acknowledgementState: StudioReleaseAcknowledgementState;
  sourceOwner: string;
  targetOwner: string;
  posture: string;
  summary: string;
  deliveryChainStageId: string;
  packetId: string;
  reviewerQueueId: string;
  escalationWindowId: string;
  closeoutWindowId: string;
  pending: string[];
  reviewerNotes: StudioLinkedNote[];
}

export interface StudioReleaseEvidenceCloseout {
  id: string;
  label: string;
  sealingState: StudioReleaseEvidenceSealState;
  acknowledgementState: StudioReleaseAcknowledgementState;
  owner: string;
  summary: string;
  deliveryChainStageId: string;
  reviewerQueueId: string;
  closeoutWindowId: string;
  sealedEvidence: string[];
  pendingEvidence: string[];
  reviewerNotes: StudioLinkedNote[];
}

export interface StudioReleaseReviewerQueueEntry {
  id: string;
  label: string;
  owner: string;
  status: StudioReleaseReviewerQueueEntryStatus;
  acknowledgementState: StudioReleaseAcknowledgementState;
  summary: string;
  deliveryChainStageId: string;
  packetId: string;
  handoffId: string;
  closeoutId: string;
  windowId: string;
  sharedStateLaneId: string;
  pending: string[];
  reviewerNotes: StudioLinkedNote[];
}

export interface StudioReleaseReviewerQueue {
  id: string;
  label: string;
  status: StudioReleaseReviewerQueueStatus;
  owner: string;
  summary: string;
  deliveryChainStageId: string;
  stageId: string;
  packetId: string;
  handoffId: string;
  closeoutId: string;
  acknowledgementState: StudioReleaseAcknowledgementState;
  activeEntryId: string;
  windowId: string;
  sharedStateLaneId: string;
  entries: StudioReleaseReviewerQueueEntry[];
}

export interface StudioReleaseEscalationWindow {
  id: string;
  label: string;
  state: StudioReleaseEscalationWindowState;
  owner: string;
  summary: string;
  deliveryChainStageId: string;
  stageId: string;
  reviewerQueueId: string;
  handoffId: string;
  acknowledgementState: StudioReleaseAcknowledgementState;
  windowId: string;
  sharedStateLaneId: string;
  deadlineLabel: string;
  trigger: string;
  pending: string[];
  reviewerNotes: StudioLinkedNote[];
}

export interface StudioReleaseCloseoutWindow {
  id: string;
  label: string;
  state: StudioReleaseCloseoutWindowState;
  owner: string;
  summary: string;
  deliveryChainStageId: string;
  stageId: string;
  reviewerQueueId: string;
  closeoutId: string;
  acknowledgementState: StudioReleaseAcknowledgementState;
  windowId: string;
  sharedStateLaneId: string;
  deadlineLabel: string;
  sealedEvidence: string[];
  pendingEvidence: string[];
  reviewerNotes: StudioLinkedNote[];
}

export interface StudioReleaseOperatorReviewBoard {
  id: string;
  title: string;
  summary: string;
  posture: string;
  activeOwner: string;
  activeDeliveryChainStageId: string;
  activeReviewerQueueId: string;
  activeAcknowledgementState: StudioReleaseAcknowledgementState;
  activeEscalationWindowId: string;
  activeCloseoutWindowId: string;
  reviewerNotes: StudioLinkedNote[];
}

export interface StudioReleaseApprovalPipelineStage {
  id: string;
  label: string;
  status: StudioReleaseApprovalPipelineStageStatus;
  owner: string;
  summary: string;
  deliveryChainStageId: string;
  deliveryPhase: StudioReleaseDeliveryChainPhase;
  evidence: string[];
  linkedLifecycleStages: StudioHostLifecycleStageId[];
  linkedSlotIds: string[];
  reviewerQueueId: string;
  escalationWindowId: string;
  closeoutWindowId: string;
  packet: StudioReleaseReviewPacket;
  handoff: StudioReleaseDecisionHandoff;
  closeout: StudioReleaseEvidenceCloseout;
  notes: StudioLinkedNote[];
}

export interface StudioReleaseDeliveryChainArtifactGroup {
  id: string;
  label: string;
  summary: string;
  artifacts: string[];
}

export interface StudioReleaseDeliveryChainStage {
  id: string;
  label: string;
  phase: StudioReleaseDeliveryChainPhase;
  status: StudioReleaseApprovalPipelineStageStatus;
  owner: string;
  posture: string;
  summary: string;
  pipelineStageId: string;
  reviewerQueueId: string;
  decisionHandoffId: string;
  evidenceCloseoutId: string;
  escalationWindowId: string;
  closeoutWindowId: string;
  upstreamStageIds: string[];
  downstreamStageIds: string[];
  artifactGroups: StudioReleaseDeliveryChainArtifactGroup[];
  blockedBy: string[];
}

export interface StudioReleaseDeliveryChain {
  id: string;
  title: string;
  summary: string;
  mode: StudioReleaseApprovalPipelineMode;
  currentStageId: string;
  promotionStageIds: string[];
  publishStageIds: string[];
  rollbackStageIds: string[];
  stages: StudioReleaseDeliveryChainStage[];
  blockedBy: string[];
}

export interface StudioReleaseApprovalPipeline {
  id: string;
  title: string;
  summary: string;
  mode: StudioReleaseApprovalPipelineMode;
  currentStageId: string;
  reviewBoard: StudioReleaseOperatorReviewBoard;
  decisionHandoff: StudioReleaseDecisionHandoff;
  evidenceCloseout: StudioReleaseEvidenceCloseout;
  reviewerQueues: StudioReleaseReviewerQueue[];
  escalationWindows: StudioReleaseEscalationWindow[];
  closeoutWindows: StudioReleaseCloseoutWindow[];
  stages: StudioReleaseApprovalPipelineStage[];
  deliveryChain: StudioReleaseDeliveryChain;
  blockedBy: string[];
}

export interface StudioInspectorDrilldownLine extends StudioLinkedNote {
  id: string;
}

export interface StudioInspectorDrilldown {
  id: string;
  label: string;
  summary: string;
  lines: StudioInspectorDrilldownLine[];
}

export interface InspectorPlaceholder {
  title: string;
  summary: string;
  boundary: StudioBoundarySummary;
  route: StudioInspectorRouteDetail;
  flow: StudioInspectorFlowDetail;
  linkage: StudioInspectorLinkage;
  sections: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  drilldowns: StudioInspectorDrilldown[];
}

export interface DockItem {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: StudioTone;
  slotId?: string;
}

export type StudioCommandActionKind =
  | "navigate"
  | "focus-slot"
  | "show-boundary"
  | "show-trace"
  | "show-preview"
  | "focus-review-coverage"
  | "advance-workflow-lane"
  | "toggle-right-rail"
  | "toggle-bottom-dock"
  | "toggle-compact-mode"
  | "activate-workspace-view"
  | "stage-window-intent";
export type StudioCommandActionScope = "global" | "route" | "focus" | "layout" | "window";
export type StudioCommandActionSafety = "local-only" | "preview-host";
export type StudioCommandFlowSurface = "shell" | StudioPageId;
export type StudioCommandReviewSurfaceKind =
  | "review-packet"
  | "reviewer-queue"
  | "decision-handoff"
  | "evidence-closeout"
  | "decision-gate"
  | "closeout-window";
export type StudioKeyboardShortcutScope = "global" | "palette" | "route" | "flow";
export type StudioKeyboardShortcutTarget = "open-palette" | "close-palette" | "action" | "sequence" | "active-flow";
export type StudioRightRailTabId = "inspector" | "trace" | "windows";
export type StudioBottomDockTabId = "focus" | "activity" | "windows";
export type StudioWorkspaceViewId = "operator-shell" | "trace-deck" | "review-deck";
export type StudioWindowIntentTarget = "workspace-view" | "detached-panel";
export type StudioWindowIntentSource = "command-surface" | "layout" | "shell-contract";
export type StudioWindowIntentStatus = "ready" | "staged" | "focused";
export type StudioDetachedWorkspaceState = "anchored" | "candidate" | "detached-local";
export type StudioWindowIntentFocus = "secondary" | "primary";
export type StudioWindowPostureMode = "anchored-shell" | "detached-candidate" | "intent-focused";
export type StudioWindowSyncHealth = "synced" | "drift-watch" | "blocked";
export type StudioWindowOwnershipMode = "owned" | "shared-review" | "handoff";
export type StudioWindowRosterEntryKind = "main-shell" | "workspace" | "detached-candidate";
export type StudioWindowSharedStateLaneStatus = "active" | "handoff-ready" | "blocked";

export interface StudioCommandAction {
  id: string;
  label: string;
  description: string;
  kind: StudioCommandActionKind;
  scope: StudioCommandActionScope;
  safety: StudioCommandActionSafety;
  tone: StudioTone;
  keywords: string[];
  hotkey?: string;
  routeId?: StudioPageId;
  slotId?: string;
  rightRailTabId?: StudioRightRailTabId;
  bottomDockTabId?: StudioBottomDockTabId;
  workspaceViewId?: StudioWorkspaceViewId;
  windowIntentId?: string;
  reviewSurfaceKind?: StudioCommandReviewSurfaceKind;
  deliveryChainStageId?: string;
  windowId?: string;
  sharedStateLaneId?: string;
  orchestrationBoardId?: string;
  observabilityMappingId?: string;
}

export interface StudioCommandContext {
  id: StudioPageId | "global";
  label: string;
  summary: string;
  actionIds: string[];
}

export interface StudioCommandMatcher {
  routeIds?: StudioPageId[];
  workflowLaneIds?: string[];
  slotIds?: string[];
  workspaceViewIds?: StudioWorkspaceViewId[];
  windowIntentIds?: string[];
}

export interface StudioCommandActionGroup {
  id: string;
  label: string;
  summary: string;
  tone: StudioTone;
  actionIds: string[];
  match?: StudioCommandMatcher;
}

export interface StudioCommandSequence {
  id: string;
  label: string;
  summary: string;
  tone: StudioTone;
  safety: "local-only";
  actionIds: string[];
  recommendedActionId?: string;
  followUpActionIds: string[];
  match?: StudioCommandMatcher;
}

export interface StudioCommandContextualFlow {
  id: string;
  surfaceIds: StudioCommandFlowSurface[];
  label: string;
  summary: string;
  sequenceId: string;
  recommendedActionId?: string;
  followUpActionIds: string[];
  groupIds: string[];
  keyboardShortcutIds: string[];
  match?: StudioCommandMatcher;
}

export type StudioCommandNextStepKind = "route" | "workflow" | "focus" | "window" | "trace";
export type StudioCommandCompanionReviewPathKind =
  | "stage-companion"
  | "handoff-companion"
  | "rollback-companion"
  | "stabilization-companion";
export type StudioCommandCompanionReviewSequenceStepRole =
  | "current-review-surface"
  | "primary-companion"
  | "follow-up-companion";

export interface StudioCommandNextStep {
  id: string;
  label: string;
  detail: string;
  tone: StudioTone;
  kind: StudioCommandNextStepKind;
  actionId: string;
}

export interface StudioCommandNextStepBoard {
  id: string;
  label: string;
  summary: string;
  flowId: string;
  sequenceId: string;
  stepIds: string[];
  match?: StudioCommandMatcher;
}

export interface StudioCommandCompanionReviewPath {
  id: string;
  label: string;
  summary: string;
  tone: StudioTone;
  kind: StudioCommandCompanionReviewPathKind;
  sequenceId: string;
  sourceActionId: string;
  primaryActionId: string;
  followUpActionIds?: string[];
}

export interface StudioCommandCompanionReviewSequenceStep {
  id: string;
  actionId: string;
  role: StudioCommandCompanionReviewSequenceStepRole;
  summary: string;
}

export interface StudioCommandCompanionReviewSequence {
  id: string;
  label: string;
  summary: string;
  tone: StudioTone;
  steps: StudioCommandCompanionReviewSequenceStep[];
}

export interface StudioCommandActionDeckLane {
  id: string;
  label: string;
  summary: string;
  tone: StudioTone;
  actionIds: string[];
  primaryActionId: string;
  followUpActionIds?: string[];
  workspaceViewIds?: StudioWorkspaceViewId[];
  windowIntentIds?: string[];
  deliveryChainStageIds?: string[];
  focusDeliveryChainStageId?: string;
  windowIds?: string[];
  focusWindowId?: string;
  sharedStateLaneIds?: string[];
  focusSharedStateLaneId?: string;
  orchestrationBoardIds?: string[];
  focusOrchestrationBoardId?: string;
  observabilityMappingIds?: string[];
  focusObservabilityMappingId?: string;
  companionSequences?: StudioCommandCompanionReviewSequence[];
  companionReviewPaths?: StudioCommandCompanionReviewPath[];
}

export interface StudioCommandActionDeck {
  id: string;
  label: string;
  summary: string;
  tone: StudioTone;
  flowId: string;
  sequenceId: string;
  lanes: StudioCommandActionDeckLane[];
  match?: StudioCommandMatcher;
}

export interface StudioKeyboardShortcut {
  id: string;
  label: string;
  combo: string;
  key: string;
  scope: StudioKeyboardShortcutScope;
  target: StudioKeyboardShortcutTarget;
  actionId?: string;
  sequenceId?: string;
  altKey?: boolean;
  shiftKey?: boolean;
  metaOrCtrl?: boolean;
  preserveFocus?: boolean;
  closePalette?: boolean;
}

export interface StudioKeyboardRouting {
  title: string;
  summary: string;
  shortcuts: StudioKeyboardShortcut[];
}

export interface StudioCommandHistoryContract {
  title: string;
  summary: string;
  retention: number;
  emptyState: string;
}

export interface StudioCommandSurface {
  title: string;
  summary: string;
  placeholder: string;
  quickActionIds: string[];
  actions: StudioCommandAction[];
  contexts: StudioCommandContext[];
  actionGroups: StudioCommandActionGroup[];
  sequences: StudioCommandSequence[];
  contextualFlows: StudioCommandContextualFlow[];
  nextSteps: StudioCommandNextStep[];
  nextStepBoards: StudioCommandNextStepBoard[];
  actionDecks: StudioCommandActionDeck[];
  history: StudioCommandHistoryContract;
  keyboardRouting: StudioKeyboardRouting;
}

export interface StudioShellLayoutPersistence {
  storageKey: string;
  strategy: "localStorage";
  version: string;
  persistedFields: Array<keyof StudioShellLayoutState>;
}

export interface StudioRightRailTab {
  id: StudioRightRailTabId;
  label: string;
  summary: string;
}

export interface StudioBottomDockTab {
  id: StudioBottomDockTabId;
  label: string;
  summary: string;
}

export interface StudioShellLayoutState {
  rightRailVisible: boolean;
  bottomDockVisible: boolean;
  compactMode: boolean;
  rightRailTabId: StudioRightRailTabId;
  bottomDockTabId: StudioBottomDockTabId;
  workspaceViewId: StudioWorkspaceViewId;
}

export interface StudioShellLayout {
  title: string;
  summary: string;
  persistence: StudioShellLayoutPersistence;
  defaultState: StudioShellLayoutState;
  rightRailTabs: StudioRightRailTab[];
  bottomDockTabs: StudioBottomDockTab[];
}

export interface StudioWorkspaceView {
  id: StudioWorkspaceViewId;
  label: string;
  summary: string;
  defaultPageId: StudioPageId;
  rightRailTabId: StudioRightRailTabId;
  bottomDockTabId: StudioBottomDockTabId;
  detachState: StudioDetachedWorkspaceState;
  shellRole: string;
  intentIds: string[];
  detachedPanelIds: string[];
}

export interface StudioDetachedPanelPlaceholder {
  id: string;
  label: string;
  summary: string;
  sourceTabId: StudioRightRailTabId | StudioBottomDockTabId;
  workspaceViewId: StudioWorkspaceViewId;
  detachState: StudioDetachedWorkspaceState;
  shellRole: string;
  status: "placeholder";
}

export interface StudioWindowIntentPreviewLine {
  label: string;
  value: string;
}

export interface StudioWindowIntentPreview {
  title: string;
  summary: string;
  lines: StudioWindowIntentPreviewLine[];
}

export interface StudioWindowIntentShellLink {
  pageId: StudioPageId;
  rightRailTabId: StudioRightRailTabId;
  bottomDockTabId: StudioBottomDockTabId;
}

export type StudioWindowWorkflowPosture = "review" | "trace" | "preview";
export type StudioWindowWorkflowStepKind = "workspace-entry" | "detached-panel" | "work-posture";

export interface StudioWindowWorkflowStep {
  id: string;
  label: string;
  summary: string;
  kind: StudioWindowWorkflowStepKind;
  posture: StudioWindowWorkflowPosture;
  workspaceViewId?: StudioWorkspaceViewId;
  detachedPanelId?: string;
  windowIntentId?: string;
}

export interface StudioWindowWorkflowLane {
  id: string;
  label: string;
  summary: string;
  posture: StudioWindowWorkflowPosture;
  workspaceViewId: StudioWorkspaceViewId;
  detachedPanelId: string;
  windowIntentId: string;
  stepIds: string[];
}

export interface StudioWindowWorkflow {
  title: string;
  summary: string;
  activeLaneId: string;
  lanes: StudioWindowWorkflowLane[];
  steps: StudioWindowWorkflowStep[];
}

export type StudioWindowOrchestrationCheckpointKind =
  | "route"
  | "workflow-lane"
  | "command-flow"
  | "workspace"
  | "detached-panel"
  | "window-intent"
  | "focused-slot"
  | "handoff";

export interface StudioWindowOrchestrationCheckpoint {
  id: string;
  label: string;
  kind: StudioWindowOrchestrationCheckpointKind;
  value: string;
  detail: string;
  tone: StudioTone;
}

export interface StudioWindowOrchestrationBoard {
  id: string;
  label: string;
  summary: string;
  laneId: string;
  routeId: StudioPageId;
  sequenceId: string;
  workspaceViewId: StudioWorkspaceViewId;
  detachedPanelId: string;
  windowIntentId: string;
  focusedSlotId: string;
  reviewPosture: StudioWindowReviewPostureLink;
  recommendedActionId?: string;
  checkpointIds: string[];
}

export interface StudioWindowOrchestration {
  title: string;
  summary: string;
  activeBoardId: string;
  checkpoints: StudioWindowOrchestrationCheckpoint[];
  boards: StudioWindowOrchestrationBoard[];
}

export interface StudioWindowIntentWorkflowStep {
  label: string;
  posture: StudioWindowWorkflowPosture;
  summary: string;
}

export interface StudioWindowIntentReadinessCheck {
  id: string;
  label: string;
  value: string;
  tone: StudioTone;
}

export interface StudioWindowIntentReadiness {
  label: string;
  summary: string;
  checks: StudioWindowIntentReadinessCheck[];
}

export interface StudioWindowIntentHandoff {
  label: string;
  posture: StudioWindowWorkflowPosture;
  summary: string;
  destination: string;
  safeMode: "local-only";
}

export interface StudioWindowIntent {
  id: string;
  label: string;
  summary: string;
  target: StudioWindowIntentTarget;
  source: StudioWindowIntentSource;
  status: StudioWindowIntentStatus;
  focus: StudioWindowIntentFocus;
  safeMode: "local-only";
  preview: StudioWindowIntentPreview;
  shellLink: StudioWindowIntentShellLink;
  workflowStep: StudioWindowIntentWorkflowStep;
  readiness: StudioWindowIntentReadiness;
  handoff: StudioWindowIntentHandoff;
  reviewPosture: StudioWindowReviewPostureLink;
  workspaceViewId?: StudioWorkspaceViewId;
  detachedPanelId?: string;
  pageId?: StudioPageId;
}

export interface StudioWindowPostureSummary {
  mode: StudioWindowPostureMode;
  label: string;
  summary: string;
  activeWorkspaceViewId: StudioWorkspaceViewId;
  focusedIntentId?: string;
  activeDetachedPanelId?: string;
}

export interface StudioWindowOwnership {
  owner: string;
  mode: StudioWindowOwnershipMode;
  posture: string;
  summary: string;
}

export interface StudioWindowSyncState {
  health: StudioWindowSyncHealth;
  summary: string;
  updatedAt: string;
}

export interface StudioWindowLastHandoff {
  label: string;
  fromWindowId: string;
  toWindowId: string;
  summary: string;
  timestamp: string;
  linkedIntentId?: string;
  linkedSlotId?: string;
}

export interface StudioWindowRouteIntentLink {
  id: string;
  routeId: StudioPageId;
  workspaceViewId: StudioWorkspaceViewId;
  summary: string;
  windowIntentId?: string;
  detachedPanelId?: string;
}

export interface StudioWindowReviewPostureLink {
  stageId: string;
  stageLabel: string;
  deliveryChainStageId: string;
  deliveryPhase: StudioReleaseDeliveryChainPhase;
  reviewerQueueId: string;
  acknowledgementState: StudioReleaseAcknowledgementState;
  decisionHandoffId: string;
  evidenceCloseoutId: string;
  escalationWindowId: string;
  closeoutWindowId: string;
  summary: string;
}

export type StudioWindowReviewPostureRelationship =
  | "owns-current-posture"
  | "mirrors-current-posture"
  | "staged-for-handoff"
  | "blocked-upstream"
  | "escalation-shadow"
  | "blocked-decision-gate";

export interface StudioWindowObservabilitySignal {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: StudioTone;
}

export interface StudioWindowObservabilityMapping {
  id: string;
  label: string;
  relationship: StudioWindowReviewPostureRelationship;
  summary: string;
  owner: string;
  routeId: StudioPageId;
  workspaceViewId: StudioWorkspaceViewId;
  windowId: string;
  sharedStateLaneId: string;
  orchestrationBoardId: string;
  focusedSlotId: string;
  reviewPosture: StudioWindowReviewPostureLink;
  tone: StudioTone;
  windowIntentId?: string;
  detachedPanelId?: string;
}

export interface StudioWindowObservability {
  title: string;
  summary: string;
  activeMappingId: string;
  signals: StudioWindowObservabilitySignal[];
  mappings: StudioWindowObservabilityMapping[];
}

export interface StudioWindowLocalBlocker {
  id: string;
  label: string;
  detail: string;
  tone: StudioTone;
}

export interface StudioWindowSharedStateField {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: StudioTone;
}

export interface StudioWindowRosterEntry {
  id: string;
  label: string;
  kind: StudioWindowRosterEntryKind;
  summary: string;
  role: string;
  routeId: StudioPageId;
  workspaceViewId: StudioWorkspaceViewId;
  workflowLaneId: string;
  ownership: StudioWindowOwnership;
  sync: StudioWindowSyncState;
  lastHandoff: StudioWindowLastHandoff;
  routeLinks: StudioWindowRouteIntentLink[];
  reviewPosture: StudioWindowReviewPostureLink;
  blockers: StudioWindowLocalBlocker[];
  detachedPanelId?: string;
  windowIntentId?: string;
  focusedSlotId?: string;
}

export interface StudioWindowRoster {
  title: string;
  summary: string;
  activeWindowId: string;
  windows: StudioWindowRosterEntry[];
}

export interface StudioWindowSharedStateLane {
  id: string;
  label: string;
  summary: string;
  status: StudioWindowSharedStateLaneStatus;
  posture: StudioWindowWorkflowPosture;
  workflowLaneId: string;
  windowId: string;
  routeId: StudioPageId;
  workspaceViewId: StudioWorkspaceViewId;
  windowIntentId: string;
  focusedSlotId: string;
  ownership: StudioWindowOwnership;
  sync: StudioWindowSyncState;
  lastHandoff: StudioWindowLastHandoff;
  routeLinks: StudioWindowRouteIntentLink[];
  reviewPosture: StudioWindowReviewPostureLink;
  stateFields: StudioWindowSharedStateField[];
  blockers: StudioWindowLocalBlocker[];
  detachedPanelId?: string;
}

export interface StudioWindowSharedState {
  title: string;
  summary: string;
  activeLaneId: string;
  lanes: StudioWindowSharedStateLane[];
}

export interface StudioWindowing {
  title: string;
  summary: string;
  readiness: "contract-ready";
  posture: StudioWindowPostureSummary;
  roster: StudioWindowRoster;
  sharedState: StudioWindowSharedState;
  workflow: StudioWindowWorkflow;
  orchestration: StudioWindowOrchestration;
  observability: StudioWindowObservability;
  views: StudioWorkspaceView[];
  detachedPanels: StudioDetachedPanelPlaceholder[];
  windowIntents: StudioWindowIntent[];
}

export interface StudioDetailSection {
  id: string;
  title: string;
  lines: string[];
}

export type StudioRuntimeActionKind = "probe" | "validate" | "dry-run" | "execute-local" | "preview-host";
export type StudioRuntimeActionSafety = "read-only" | "dry-run" | "local-only" | "preview-host";

export interface StudioRuntimeAction {
  id: string;
  label: string;
  description: string;
  kind: StudioRuntimeActionKind;
  safety: StudioRuntimeActionSafety;
  refreshDetailOnSuccess: boolean;
}

export interface StudioRuntimeActionExecution {
  status: "completed" | "blocked";
  safety: StudioRuntimeActionSafety;
  detailRefresh: "required" | "not-needed";
}

export interface StudioRuntimeDetail {
  id: string;
  title: string;
  summary: string;
  source: "runtime" | "mock";
  path?: string;
  sections: StudioDetailSection[];
  notices?: string[];
  actions?: StudioRuntimeAction[];
  boundary?: StudioBoundarySummary;
  hostPreviews?: StudioHostMutationPreview[];
  tone: StudioTone;
}

export interface StudioRuntimeActionResult {
  itemId: string;
  actionId: string;
  action: StudioRuntimeAction;
  execution: StudioRuntimeActionExecution;
  title: string;
  summary: string;
  source: "runtime" | "mock";
  sections: StudioDetailSection[];
  notices?: string[];
  boundary?: StudioBoundarySummary;
  hostPreview?: StudioHostMutationPreview;
  hostHandoff?: StudioHostPreviewHandoff;
  tone: StudioTone;
}

export interface StudioShellState {
  appName: string;
  version: string;
  status: ShellStatus;
  boundary: StudioBoundarySummary;
  pages: Array<{
    id: StudioPageId;
    label: string;
    hint: string;
  }>;
  commandSurface: StudioCommandSurface;
  layout: StudioShellLayout;
  windowing: StudioWindowing;
  dashboard: {
    headline: string;
    metrics: StudioMetric[];
    workstreams: DashboardWorkstream[];
    alerts: DashboardAlert[];
    systemChecks: SettingItem[];
  };
  home: {
    headline: string;
    panels: HomePanel[];
    recentActivity: HomeActivity[];
  };
  sessions: SessionSummary[];
  agents: {
    summary: string;
    metrics: StudioMetric[];
    roster: AgentSummary[];
    recentActivity: HomeActivity[];
    delegationSummary: string;
    delegationNotes: SettingItem[];
  };
  codex: {
    summary: string;
    stats: StudioStat[];
    tasks: CodexTaskSummary[];
    observations: SettingItem[];
    loopSummary: string;
    loopStats: StudioStat[];
    loopSignals: SettingItem[];
    contextSummary: string;
    contextNotes: SettingItem[];
  };
  skills: {
    summary: string;
    sections: SkillCatalogSection[];
  };
  settings: {
    summary: string;
    sections: SettingSection[];
  };
  inspector: InspectorPlaceholder;
  dock: DockItem[];
}

export interface StudioApi {
  getShellState(): Promise<StudioShellState>;
  listSessions(): Promise<SessionSummary[]>;
  listCodexTasks(): Promise<CodexTaskSummary[]>;
  getHostExecutorState(): Promise<StudioHostExecutorState>;
  getHostBridgeState(): Promise<StudioHostBridgeState>;
  handoffHostPreview(itemId: string, actionId: string): Promise<StudioHostPreviewHandoff | null>;
  getRuntimeItemDetail(itemId: string): Promise<StudioRuntimeDetail | null>;
  runRuntimeItemAction(itemId: string, actionId: string): Promise<StudioRuntimeActionResult | null>;
}
export {
  selectStudioReleaseApprovalPipelineStage,
  selectStudioReleaseReviewerQueue,
  selectStudioReleaseEscalationWindow,
  selectStudioReleaseCloseoutWindow,
  selectStudioReleaseDeliveryChainStage,
  selectStudioWindowObservabilityActiveMapping,
  selectStudioWindowObservabilityMapping
} from "./selectors.js";
