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
  label: string;
  status: StudioHostPreviewTraceStatus;
  summary: string;
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
  workflowLaneId?: string;
  workspaceViewId?: StudioWorkspaceViewId;
  windowIntentId?: string;
  detachedPanelId?: string;
  focusedSlotId?: string;
}

export interface StudioInspectorDrilldownLine {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: StudioTone;
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
  | "advance-workflow-lane"
  | "toggle-right-rail"
  | "toggle-bottom-dock"
  | "toggle-compact-mode"
  | "activate-workspace-view"
  | "stage-window-intent";
export type StudioCommandActionScope = "global" | "route" | "focus" | "layout" | "window";
export type StudioCommandActionSafety = "local-only" | "preview-host";
export type StudioCommandFlowSurface = "shell" | StudioPageId;
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

export interface StudioWindowing {
  title: string;
  summary: string;
  readiness: "contract-ready";
  posture: StudioWindowPostureSummary;
  workflow: StudioWindowWorkflow;
  orchestration: StudioWindowOrchestration;
  views: StudioWorkspaceView[];
  detachedPanels: StudioDetachedPanelPlaceholder[];
  windowIntents: StudioWindowIntent[];
}

export interface StudioDetailSection {
  id: string;
  title: string;
  lines: string[];
}

export interface StudioRuntimeAction {
  id: string;
  label: string;
  description: string;
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
  };
  codex: {
    summary: string;
    stats: StudioStat[];
    tasks: CodexTaskSummary[];
    observations: SettingItem[];
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

function scoreStudioHostTraceSlot(entry: StudioHostTraceSlotState): number {
  let score = entry.outcomeChain.length * 10;

  if (entry.rollbackDisposition === "incomplete") {
    score += 100;
  } else if (entry.rollbackDisposition === "required") {
    score += 80;
  } else if (entry.rollbackDisposition === "available") {
    score += 40;
  }

  switch (entry.primaryStatus) {
    case "rollback-required":
      score += 30;
      break;
    case "partial-apply":
      score += 20;
      break;
    case "abort":
      score += 10;
      break;
    default:
      break;
  }

  return score;
}

export function createStudioHostTraceSlotRoster(
  mutationSlots: StudioHostMutationSlot[],
  slotHandlers: StudioHostBridgeSlotHandler[],
  validators: StudioHostBridgeValidator[]
): StudioHostTraceSlotState[] {
  return slotHandlers
    .map((handler) => {
      const slot = mutationSlots.find((entry) => entry.id === handler.slotId);

      if (!slot || handler.simulatedOutcomes.length === 0) {
        return null;
      }

      const validator = validators.find((entry) => entry.slotId === handler.slotId);
      const [primaryOutcome, ...remainingOutcomes] = handler.simulatedOutcomes;

      if (!primaryOutcome) {
        return null;
      }

      const terminalOutcome = remainingOutcomes[remainingOutcomes.length - 1] ?? primaryOutcome;

      return {
        slotId: slot.id,
        label: slot.label,
        intent: slot.intent,
        channel: slot.channel,
        handlerLabel: handler.label,
        handlerState: handler.state,
        validatorLabel: validator?.label ?? "Missing validator",
        validatorState: validator?.state ?? "missing",
        requiredPayloadFieldCount: validator?.requiredPayloadFieldIds.length ?? 0,
        requiredResultFieldCount: validator?.requiredResultFieldIds.length ?? 0,
        primaryStatus: primaryOutcome.status,
        primaryStage: primaryOutcome.stage,
        terminalStatus: terminalOutcome.status,
        terminalStage: terminalOutcome.stage,
        failureCode: primaryOutcome.failureCode,
        failureDisposition: primaryOutcome.failureDisposition,
        rollbackDisposition: terminalOutcome.rollbackDisposition,
        outcomeChain: handler.simulatedOutcomes.map((outcome) => outcome.status),
        summary: `${slot.label} keeps ${primaryOutcome.status} -> ${terminalOutcome.rollbackDisposition} inside the disabled placeholder bridge flow.`
      };
    })
    .filter((entry): entry is StudioHostTraceSlotState => entry !== null);
}

export function selectStudioHostTraceFocusSlotId(slotRoster: StudioHostTraceSlotState[], preferredSlotId?: string | null): string | null {
  if (preferredSlotId && slotRoster.some((entry) => entry.slotId === preferredSlotId)) {
    return preferredSlotId;
  }

  const focused = [...slotRoster].sort((left, right) => scoreStudioHostTraceSlot(right) - scoreStudioHostTraceSlot(left))[0];
  return focused?.slotId ?? null;
}

export function createStudioHostTraceState(
  mutationSlots: StudioHostMutationSlot[],
  slotHandlers: StudioHostBridgeSlotHandler[],
  validators: StudioHostBridgeValidator[],
  preferredSlotId?: string | null
): StudioHostTraceState {
  const slotRoster = createStudioHostTraceSlotRoster(mutationSlots, slotHandlers, validators);
  const focusSlotId = selectStudioHostTraceFocusSlotId(slotRoster, preferredSlotId) ?? "";

  return {
    focusSlotId,
    focusReason: preferredSlotId && focusSlotId === preferredSlotId ? "preferred-slot" : "recommended-slot",
    slotRoster
  };
}

function createMockSimulatedOutcomes(slotId: string): StudioHostBridgeSimulatedOutcome[] {
  switch (slotId) {
    case "slot-root-connect":
      return [
        {
          id: "outcome-root-connect-blocked",
          label: "Blocked placeholder",
          status: "blocked",
          stage: "request-approval",
          failureCode: "approval-missing",
          failureDisposition: "blocked",
          rollbackDisposition: "not-needed",
          summary: "The default-disabled root-connect handler stops at approval and returns a blocked placeholder outcome."
        }
      ];
    case "slot-bridge-attach":
      return [
        {
          id: "outcome-bridge-attach-abort",
          label: "Abort placeholder",
          status: "abort",
          stage: "handoff-slot",
          failureCode: "handoff-invalid",
          failureDisposition: "abort",
          rollbackDisposition: "available",
          summary: "The default-disabled bridge-attach handler simulates a typed handoff abort without touching bridge state."
        }
      ];
    case "slot-connector-activate":
      return [
        {
          id: "outcome-connector-activate-partial",
          label: "Partial apply placeholder",
          status: "partial-apply",
          stage: "mutate-host",
          failureCode: "partial-apply",
          failureDisposition: "partial-apply",
          rollbackDisposition: "required",
          summary: "The disabled connector-activate handler simulates a partial apply so rollback requirements stay explicit."
        }
      ];
    case "slot-lane-apply":
      return [
        {
          id: "outcome-lane-apply-rollback-required",
          label: "Rollback required placeholder",
          status: "rollback-required",
          stage: "rollback-host",
          failureCode: "rollback-required",
          failureDisposition: "rollback",
          rollbackDisposition: "required",
          summary: "The disabled lane-apply handler simulates a rollback-required result instead of attempting any host apply."
        },
        {
          id: "outcome-lane-apply-rollback-incomplete",
          label: "Rollback incomplete placeholder",
          status: "rollback-incomplete",
          stage: "rollback-host",
          failureCode: "rollback-incomplete",
          failureDisposition: "rollback",
          rollbackDisposition: "incomplete",
          summary: "Rollback stays placeholder-only, so the follow-up simulated outcome remains rollback-incomplete."
        }
      ];
    default:
      return [];
  }
}

const mockHostBridgeState: StudioHostBridgeState = {
  id: "host-bridge-phase27",
  title: "Disabled host bridge skeleton",
  summary:
    "Phase 29 keeps the bridge default-disabled while layering detached workspace workflows, readiness-aware window intents, and shell-level posture feedback on top of the existing per-slot focus and trace flow.",
  mode: "disabled",
  defaultEnabled: false,
  previewHandoff: "placeholder",
  validators: [
    {
      id: "validator-root-connect",
      slotId: "slot-root-connect",
      label: "Root connect validator",
      state: "registered",
      detail: "Checks preview mapping, approval placeholder, audit seed, and rollback context before the disabled root-connect stub returns.",
      requiredPayloadFieldIds: ["payload-preview-id", "payload-request-id", "payload-target", "payload-approval", "payload-audit-seed", "payload-rollback"],
      requiredResultFieldIds: ["result-preview-id", "result-request-id", "result-status", "result-stage", "result-audit-id", "result-failure-code", "result-rollback-disposition"]
    },
    {
      id: "validator-bridge-attach",
      slotId: "slot-bridge-attach",
      label: "Bridge attach validator",
      state: "registered",
      detail: "Validates source-order handoff shape plus approval, audit, and rollback placeholder linkage for attach.",
      requiredPayloadFieldIds: ["payload-preview-id", "payload-request-id", "payload-source-order", "payload-approval", "payload-audit-seed", "payload-rollback"],
      requiredResultFieldIds: ["result-preview-id", "result-request-id", "result-status", "result-stage", "result-audit-id", "result-failure-code", "result-rollback-disposition"]
    },
    {
      id: "validator-connector-activate",
      slotId: "slot-connector-activate",
      label: "Connector activate validator",
      state: "registered",
      detail: "Validates activation target handoff plus failure, audit correlation, and rollback-required placeholder semantics.",
      requiredPayloadFieldIds: ["payload-preview-id", "payload-request-id", "payload-target", "payload-source-order", "payload-approval", "payload-audit-seed", "payload-rollback"],
      requiredResultFieldIds: ["result-preview-id", "result-request-id", "result-status", "result-stage", "result-audit-id", "result-failure-code", "result-rollback-disposition"]
    },
    {
      id: "validator-lane-apply",
      slotId: "slot-lane-apply",
      label: "Lane apply validator",
      state: "registered",
      detail: "Validates apply payload linkage across root overlay, approval, audit correlation, and rollback disposition placeholders.",
      requiredPayloadFieldIds: ["payload-preview-id", "payload-request-id", "payload-root-overlay", "payload-source-order", "payload-approval", "payload-audit-seed", "payload-rollback"],
      requiredResultFieldIds: ["result-preview-id", "result-request-id", "result-status", "result-stage", "result-audit-id", "result-failure-code", "result-rollback-disposition"]
    }
  ],
  slotHandlers: [
    {
      id: "handler-root-connect",
      slotId: "slot-root-connect",
      label: "Root connect placeholder handler",
      channel: studioHostBridgeSlotChannels.rootConnect,
      state: "registered",
      defaultEnabled: false,
      detail: "Electron bridge registers a default-disabled placeholder handler for dedicated-root connect.",
      simulatedOutcomes: createMockSimulatedOutcomes("slot-root-connect")
    },
    {
      id: "handler-bridge-attach",
      slotId: "slot-bridge-attach",
      label: "Bridge attach placeholder handler",
      channel: studioHostBridgeSlotChannels.bridgeAttach,
      state: "registered",
      defaultEnabled: false,
      detail: "Electron bridge registers a default-disabled placeholder handler for multi-source bridge attach.",
      simulatedOutcomes: createMockSimulatedOutcomes("slot-bridge-attach")
    },
    {
      id: "handler-connector-activate",
      slotId: "slot-connector-activate",
      label: "Connector activate placeholder handler",
      channel: studioHostBridgeSlotChannels.connectorActivate,
      state: "registered",
      defaultEnabled: false,
      detail: "Electron bridge registers a default-disabled placeholder handler for connector lifecycle activation.",
      simulatedOutcomes: createMockSimulatedOutcomes("slot-connector-activate")
    },
    {
      id: "handler-lane-apply",
      slotId: "slot-lane-apply",
      label: "Lane apply placeholder handler",
      channel: studioHostBridgeSlotChannels.laneApply,
      state: "registered",
      defaultEnabled: false,
      detail: "Electron bridge registers a default-disabled placeholder handler for rollback-aware lane apply.",
      simulatedOutcomes: createMockSimulatedOutcomes("slot-lane-apply")
    }
  ],
  trace: {
    focusSlotId: "",
    focusReason: "recommended-slot",
    slotRoster: []
  }
};

const mockHostExecutorState: StudioHostExecutorState = {
  id: "host-executor-phase27",
  title: "Disabled host bridge skeleton",
  summary:
    "Phase 29 keeps the typed executor contract default-disabled while adding detached workspace workflows, richer window-intent feedback, and shell-level multi-window UX without enabling host mutation.",
  mode: "disabled",
  transport: "electron-ipc-skeleton",
  defaultEnabled: false,
  handoffContractVersion: "phase29-windowing-v8",
  bridge: mockHostBridgeState,
  intents: [
    {
      id: "intent-root-connect",
      intent: "root-connect",
      label: "Root connect",
      detail: "Future handoff for dedicated MCP root registration and detach-aware connect.",
      protectedSurfaces: ["~/.openclaw MCP/runtime roots", "bridge registration state"]
    },
    {
      id: "intent-bridge-attach",
      intent: "bridge-attach",
      label: "Bridge attach",
      detail: "Future handoff for multi-source bridge registration and detach semantics.",
      protectedSurfaces: ["OpenClaw bridge registration", "plugin source bindings"]
    },
    {
      id: "intent-connector-activate",
      intent: "connector-activate",
      label: "Connector activate",
      detail: "Future handoff for connector lifecycle start/stop/reconcile on the host.",
      protectedSurfaces: ["external connector processes", "connector activation registry"]
    },
    {
      id: "intent-lane-apply",
      intent: "lane-apply",
      label: "Lane apply",
      detail: "Future handoff for rollback-aware lane apply across config, runtime state, and lifecycle.",
      protectedSurfaces: ["~/.openclaw config and runtime state", "service lifecycle"]
    }
  ],
  lifecycle: [
    {
      id: "lifecycle-context",
      stage: "collect-context",
      label: "Collect context",
      state: "ready",
      detail: "Renderer/runtime can already assemble sanitized targets, blockers, and preconditions without mutating the host."
    },
    {
      id: "lifecycle-approval",
      stage: "request-approval",
      label: "Request approval",
      state: "withheld",
      detail: "Approval remains modeled only as typed shape; no live permission grant path exists."
    },
    {
      id: "lifecycle-audit",
      stage: "write-audit",
      label: "Write audit seed",
      state: "planned",
      detail: "Future host executor would persist audit metadata before and after mutation attempts."
    },
    {
      id: "lifecycle-handoff",
      stage: "handoff-slot",
      label: "Handoff to IPC slot",
      state: "planned",
      detail: "Typed handoff payloads are defined, but no live mutation slot is enabled."
    },
    {
      id: "lifecycle-mutate",
      stage: "mutate-host",
      label: "Mutate host",
      state: "withheld",
      detail: "Host-side attach, activation, and apply remain policy-blocked."
    },
    {
      id: "lifecycle-verify",
      stage: "verify-host",
      label: "Verify host",
      state: "future",
      detail: "A later executor would verify resulting bridge, lifecycle, and apply state."
    },
    {
      id: "lifecycle-rollback",
      stage: "rollback-host",
      label: "Rollback host",
      state: "future",
      detail: "Rollback is modeled explicitly for failed, aborted, or partial-apply outcomes."
    }
  ],
  approval: {
    status: "withheld",
    mode: "Explicit operator approval required",
    summary: "Future host mutation must present a typed approval request and a typed approval result before any slot can run.",
    request: {
      title: "Approval request",
      summary: "The request shape captures why a mutation is needed, which surfaces are protected, and which rollback path would be used.",
      fields: [
        { id: "approval-intent", label: "Intent", required: true, detail: "One of root-connect, bridge-attach, connector-activate, or lane-apply." },
        { id: "approval-target", label: "Target", required: true, detail: "The resolved root, bridge, connector, or lane target that would be mutated." },
        { id: "approval-risk", label: "Risk summary", required: true, detail: "Human-readable reason, protected surfaces, and mutation scope." },
        { id: "approval-rollback", label: "Rollback plan id", required: true, detail: "Rollback plan reference proving how partial state would be unwound." },
        { id: "approval-requester", label: "Requester", required: true, detail: "The shell/runtime actor asking for host mutation." }
      ]
    },
    result: {
      title: "Approval result",
      summary: "A later host approval path would return structured scope, decision, and expiry metadata instead of an untyped yes/no.",
      fields: [
        { id: "approval-id", label: "Approval id", required: true, detail: "Stable identifier for correlating audit and rollback state." },
        { id: "approval-decision", label: "Decision", required: true, detail: "Approved, denied, expired, or aborted." },
        { id: "approval-scope", label: "Scope", required: true, detail: "The exact slot, intent, and protected surfaces covered by the grant." },
        { id: "approval-expiry", label: "Expires at", required: false, detail: "Optional timeout for one-shot or narrow approval windows." },
        { id: "approval-note", label: "Reviewer note", required: false, detail: "Optional operator rationale attached to the decision." }
      ]
    }
  },
  audit: {
    status: "planned",
    mode: "Structured audit envelope",
    summary: "Every future host mutation attempt should emit a typed audit event before handoff, after slot completion, and during rollback.",
    event: {
      title: "Audit event",
      summary: "Audit fields define the minimum trace envelope required for approval, execution, failure, and rollback review.",
      fields: [
        { id: "audit-event-id", label: "Event id", required: true, detail: "Stable audit identifier for one mutation attempt." },
        { id: "audit-intent", label: "Intent", required: true, detail: "The mutation intent being attempted." },
        { id: "audit-slot", label: "Slot", required: true, detail: "The executor slot or IPC channel assigned to the mutation." },
        { id: "audit-stage", label: "Lifecycle stage", required: true, detail: "Current lifecycle stage such as approval, handoff, execute, verify, or rollback." },
        { id: "audit-target", label: "Target", required: true, detail: "The resolved host target for the mutation." },
        { id: "audit-result", label: "Result", required: true, detail: "Outcome such as withheld, aborted, partial-apply, failed, or rolled-back." },
        { id: "audit-failure-code", label: "Failure code", required: false, detail: "Structured failure taxonomy code when the outcome is not successful." }
      ]
    },
    retainedStages: ["approval", "handoff", "execute", "verify", "rollback"]
  },
  rollback: {
    status: "planned",
    summary: "Rollback is modeled as an explicit stage plan with typed context, rather than a future note or free-form TODO.",
    context: {
      title: "Rollback context",
      summary: "Rollback needs enough typed state to unwind partial host changes predictably.",
      fields: [
        { id: "rollback-request-id", label: "Request id", required: true, detail: "Mutation request that must be unwound." },
        { id: "rollback-slot-id", label: "Slot id", required: true, detail: "Executor slot that produced the partial state." },
        { id: "rollback-root", label: "Root overlay", required: false, detail: "Root or overlay involved in the mutation." },
        { id: "rollback-bridge-order", label: "Bridge source order", required: false, detail: "Attach source order relevant to bridge rollback." },
        { id: "rollback-checkpoint", label: "Last safe checkpoint", required: true, detail: "Snapshot or checkpoint the rollback would return to." }
      ]
    },
    stages: [
      {
        id: "rollback-capture",
        label: "Capture checkpoint",
        state: "planned",
        detail: "Persist the last safe checkpoint before any host mutation starts."
      },
      {
        id: "rollback-detach",
        label: "Detach bridge",
        state: "future",
        detail: "Unwind partial bridge attach or root connect state."
      },
      {
        id: "rollback-deactivate",
        label: "Deactivate connector",
        state: "future",
        detail: "Stop or reconcile connector lifecycle if activation partially succeeded."
      },
      {
        id: "rollback-restore",
        label: "Restore runtime/config overlay",
        state: "future",
        detail: "Return config, overlay, and runtime metadata to the last safe checkpoint."
      },
      {
        id: "rollback-verify",
        label: "Verify rollback",
        state: "future",
        detail: "Confirm the host returned to a coherent post-rollback state."
      }
    ]
  },
  failureTaxonomy: [
    {
      code: "policy-disabled",
      label: "Policy disabled",
      disposition: "blocked",
      stage: "global",
      detail: "The shell policy blocks host mutation entirely in this phase."
    },
    {
      code: "approval-missing",
      label: "Approval missing",
      disposition: "blocked",
      stage: "request-approval",
      detail: "No valid approval result was attached to the handoff."
    },
    {
      code: "approval-denied",
      label: "Approval denied",
      disposition: "abort",
      stage: "request-approval",
      detail: "Operator explicitly denied the requested mutation."
    },
    {
      code: "approval-expired",
      label: "Approval expired",
      disposition: "abort",
      stage: "request-approval",
      detail: "Approval was granted but is no longer valid when the slot would execute."
    },
    {
      code: "precondition-missing",
      label: "Precondition missing",
      disposition: "blocked",
      stage: "collect-context",
      detail: "Resolved target, bridge order, activation target, or root overlay is incomplete."
    },
    {
      code: "ipc-slot-unavailable",
      label: "IPC slot unavailable",
      disposition: "blocked",
      stage: "handoff-slot",
      detail: "The future executor slot or channel is absent, disabled, or withheld."
    },
    {
      code: "handoff-invalid",
      label: "Handoff invalid",
      disposition: "abort",
      stage: "handoff-slot",
      detail: "The typed payload/result contract is incomplete or inconsistent."
    },
    {
      code: "host-aborted",
      label: "Host aborted",
      disposition: "abort",
      stage: "mutate-host",
      detail: "The host executor stopped the mutation before completion."
    },
    {
      code: "partial-apply",
      label: "Partial apply",
      disposition: "partial-apply",
      stage: "mutate-host",
      detail: "Some host-side changes may have been applied before the executor stopped."
    },
    {
      code: "rollback-required",
      label: "Rollback required",
      disposition: "rollback",
      stage: "rollback-host",
      detail: "The failure outcome requires rollback before the host can be considered coherent."
    },
    {
      code: "rollback-incomplete",
      label: "Rollback incomplete",
      disposition: "rollback",
      stage: "rollback-host",
      detail: "Rollback itself failed to restore the last safe checkpoint."
    }
  ],
  mutationSlots: [
    {
      id: "slot-root-connect",
      intent: "root-connect",
      label: "Root connect IPC slot",
      channel: studioHostBridgeSlotChannels.rootConnect,
      state: "withheld",
      defaultEnabled: false,
      detail: "Reserved IPC slot for dedicated-root connect and detach-aware rollback.",
      handoff: {
        version: "phase29-windowing-v8",
        payloadType: "StudioHostRootConnectPayload",
        resultType: "StudioHostRootConnectResult",
        payload: {
          title: "Root connect payload",
          summary: "Carries preview mapping, target resolution, approval, audit seed, and rollback context for the disabled root-connect bridge stub.",
          fields: [
            { id: "payload-preview-id", label: "Preview id", required: true, detail: "Host preview identifier mapped into the slot handoff." },
            { id: "payload-request-id", label: "Request id", required: true, detail: "Stable host mutation request identifier." },
            { id: "payload-target", label: "Resolved target", required: true, detail: "Dedicated root target or host-side connect candidate." },
            { id: "payload-approval", label: "Approval token", required: true, detail: "Typed approval result required before mutation." },
            { id: "payload-audit-seed", label: "Audit seed", required: true, detail: "Pre-execution audit metadata for the mutation." },
            { id: "payload-rollback", label: "Rollback context", required: true, detail: "Checkpoint and detach plan if the connect partially succeeds." }
          ]
        },
        result: {
          title: "Root connect result",
          summary: "Reports preview mapping, lifecycle stage, audit correlation, failure taxonomy, and rollback disposition.",
          fields: [
            { id: "result-preview-id", label: "Preview id", required: true, detail: "Preview identifier echoed by the disabled slot stub." },
            { id: "result-request-id", label: "Request id", required: true, detail: "Mutation request identifier echoed by the slot." },
            { id: "result-status", label: "Status", required: true, detail: "Blocked, aborted, partial-apply, failed, or rolled-back." },
            { id: "result-stage", label: "Lifecycle stage", required: true, detail: "Final lifecycle stage reached by the slot." },
            { id: "result-audit-id", label: "Audit event id", required: true, detail: "Audit correlation id emitted by the executor." },
            { id: "result-failure-code", label: "Failure code", required: false, detail: "Structured failure taxonomy code when not successful." },
            { id: "result-failure-disposition", label: "Failure disposition", required: false, detail: "Blocked, abort, partial-apply, or rollback linkage for the placeholder outcome." },
            { id: "result-rollback-disposition", label: "Rollback disposition", required: false, detail: "Whether rollback stayed unnecessary, available, required, or incomplete." }
          ]
        }
      }
    },
    {
      id: "slot-bridge-attach",
      intent: "bridge-attach",
      label: "Bridge attach IPC slot",
      channel: studioHostBridgeSlotChannels.bridgeAttach,
      state: "withheld",
      defaultEnabled: false,
      detail: "Reserved IPC slot for multi-source bridge attach, detach, and precedence validation.",
      handoff: {
        version: "phase29-windowing-v8",
        payloadType: "StudioHostBridgeAttachPayload",
        resultType: "StudioHostBridgeAttachResult",
        payload: {
          title: "Bridge attach payload",
          summary: "Carries preview mapping, ordered bridge sources, approval, audit seed, and detach rollback context.",
          fields: [
            { id: "payload-preview-id", label: "Preview id", required: true, detail: "Host preview identifier mapped into the slot handoff." },
            { id: "payload-request-id", label: "Request id", required: true, detail: "Stable host mutation request identifier." },
            { id: "payload-source-order", label: "Source order", required: true, detail: "Ordered cache/install/entry/load-path/root attach sources." },
            { id: "payload-root-overlay", label: "Root overlay", required: false, detail: "Optional root overlay applied during attach." },
            { id: "payload-approval", label: "Approval token", required: true, detail: "Typed approval result required before mutation." },
            { id: "payload-audit-seed", label: "Audit seed", required: true, detail: "Pre-execution audit metadata for the attach handoff." },
            { id: "payload-rollback", label: "Rollback context", required: true, detail: "Detach plan if partial bridge state is created." }
          ]
        },
        result: {
          title: "Bridge attach result",
          summary: "Reports preview mapping, attach outcome, audit correlation, failure taxonomy, and rollback disposition.",
          fields: [
            { id: "result-preview-id", label: "Preview id", required: true, detail: "Preview identifier echoed by the disabled slot stub." },
            { id: "result-request-id", label: "Request id", required: true, detail: "Mutation request identifier echoed by the slot." },
            { id: "result-status", label: "Status", required: true, detail: "Blocked, aborted, partial-apply, failed, or rolled-back." },
            { id: "result-stage", label: "Lifecycle stage", required: true, detail: "Final lifecycle stage reached by the slot." },
            { id: "result-audit-id", label: "Audit event id", required: true, detail: "Audit correlation id emitted by the executor." },
            { id: "result-failure-code", label: "Failure code", required: false, detail: "Structured failure taxonomy code when not successful." },
            { id: "result-failure-disposition", label: "Failure disposition", required: false, detail: "Blocked, abort, partial-apply, or rollback linkage for the placeholder outcome." },
            { id: "result-rollback-disposition", label: "Rollback disposition", required: false, detail: "Whether rollback stayed unnecessary, available, required, or incomplete." }
          ]
        }
      }
    },
    {
      id: "slot-connector-activate",
      intent: "connector-activate",
      label: "Connector activate IPC slot",
      channel: studioHostBridgeSlotChannels.connectorActivate,
      state: "withheld",
      defaultEnabled: false,
      detail: "Reserved IPC slot for lifecycle-aware connector activation and deactivation.",
      handoff: {
        version: "phase29-windowing-v8",
        payloadType: "StudioHostConnectorActivatePayload",
        resultType: "StudioHostConnectorActivateResult",
        payload: {
          title: "Connector activate payload",
          summary: "Carries preview mapping, activation target, approval, audit seed, and lifecycle rollback context.",
          fields: [
            { id: "payload-preview-id", label: "Preview id", required: true, detail: "Host preview identifier mapped into the slot handoff." },
            { id: "payload-request-id", label: "Request id", required: true, detail: "Stable host mutation request identifier." },
            { id: "payload-target", label: "Activation target", required: true, detail: "Connector target or process identity to activate." },
            { id: "payload-source-order", label: "Bridge source order", required: true, detail: "Bridge inputs expected to precede activation." },
            { id: "payload-approval", label: "Approval token", required: true, detail: "Typed approval result required before mutation." },
            { id: "payload-audit-seed", label: "Audit seed", required: true, detail: "Pre-execution audit metadata for the activation handoff." },
            { id: "payload-rollback", label: "Rollback context", required: true, detail: "Deactivate/reconcile plan if activation partially succeeds." }
          ]
        },
        result: {
          title: "Connector activate result",
          summary: "Reports preview mapping, activation lifecycle stage, audit correlation, failure classification, and rollback disposition.",
          fields: [
            { id: "result-preview-id", label: "Preview id", required: true, detail: "Preview identifier echoed by the disabled slot stub." },
            { id: "result-request-id", label: "Request id", required: true, detail: "Mutation request identifier echoed by the slot." },
            { id: "result-status", label: "Status", required: true, detail: "Blocked, aborted, partial-apply, failed, or rolled-back." },
            { id: "result-stage", label: "Lifecycle stage", required: true, detail: "Final lifecycle stage reached by the slot." },
            { id: "result-audit-id", label: "Audit event id", required: true, detail: "Audit correlation id emitted by the executor." },
            { id: "result-failure-code", label: "Failure code", required: false, detail: "Structured failure taxonomy code when not successful." },
            { id: "result-failure-disposition", label: "Failure disposition", required: false, detail: "Blocked, abort, partial-apply, or rollback linkage for the placeholder outcome." },
            { id: "result-rollback-disposition", label: "Rollback disposition", required: false, detail: "Whether rollback stayed unnecessary, available, required, or incomplete." }
          ]
        }
      }
    },
    {
      id: "slot-lane-apply",
      intent: "lane-apply",
      label: "Lane apply IPC slot",
      channel: studioHostBridgeSlotChannels.laneApply,
      state: "withheld",
      defaultEnabled: false,
      detail: "Reserved IPC slot for rollback-aware lane apply and verification.",
      handoff: {
        version: "phase29-windowing-v8",
        payloadType: "StudioHostLaneApplyPayload",
        resultType: "StudioHostLaneApplyResult",
        payload: {
          title: "Lane apply payload",
          summary: "Carries preview mapping, root overlay, bridge order, approval, audit seed, and rollback metadata for the disabled apply stub.",
          fields: [
            { id: "payload-preview-id", label: "Preview id", required: true, detail: "Host preview identifier mapped into the slot handoff." },
            { id: "payload-request-id", label: "Request id", required: true, detail: "Stable host mutation request identifier." },
            { id: "payload-root-overlay", label: "Root overlay", required: true, detail: "Resolved root overlay to apply." },
            { id: "payload-source-order", label: "Source order", required: true, detail: "Ordered lane/bridge inputs expected by apply." },
            { id: "payload-approval", label: "Approval token", required: true, detail: "Typed approval result required before mutation." },
            { id: "payload-audit-seed", label: "Audit seed", required: true, detail: "Pre-execution audit metadata for the lane-apply handoff." },
            { id: "payload-rollback", label: "Rollback context", required: true, detail: "Checkpoint/restore plan if apply partially succeeds." }
          ]
        },
        result: {
          title: "Lane apply result",
          summary: "Reports preview mapping, apply outcome, audit correlation, failure taxonomy, and rollback disposition.",
          fields: [
            { id: "result-preview-id", label: "Preview id", required: true, detail: "Preview identifier echoed by the disabled slot stub." },
            { id: "result-request-id", label: "Request id", required: true, detail: "Mutation request identifier echoed by the slot." },
            { id: "result-status", label: "Status", required: true, detail: "Blocked, aborted, partial-apply, failed, or rolled-back." },
            { id: "result-stage", label: "Lifecycle stage", required: true, detail: "Final lifecycle stage reached by the slot." },
            { id: "result-audit-id", label: "Audit event id", required: true, detail: "Audit correlation id emitted by the executor." },
            { id: "result-failure-code", label: "Failure code", required: false, detail: "Structured failure taxonomy code when not successful." },
            { id: "result-failure-disposition", label: "Failure disposition", required: false, detail: "Blocked, abort, partial-apply, or rollback linkage for the placeholder outcome." },
            { id: "result-rollback-disposition", label: "Rollback disposition", required: false, detail: "Whether rollback stayed unnecessary, available, required, or incomplete." }
          ]
        }
      }
    }
  ]
};

mockHostBridgeState.trace = createStudioHostTraceState(
  mockHostExecutorState.mutationSlots,
  mockHostBridgeState.slotHandlers,
  mockHostBridgeState.validators
);

const mockBoundarySummary: StudioBoundarySummary = {
  id: "shell-host-runtime-boundary",
  title: "Host/runtime boundary",
  summary:
    "Phase 29 keeps host execution withheld while extending the default-disabled bridge skeleton with detached workspace workflows, readiness-aware window intents, shell-level posture feedback, and finer-grained trace contracts.",
  currentLayer: "local-only",
  nextLayer: "preview-host",
  hostState: "withheld",
  tone: "warning",
  policy: {
    posture: "Alpha local-only",
    approvalMode: "Explicit host approval required",
    detail:
      "Studio may inspect runtime state, stage dry-runs, and mutate only in-app control state. Host writes, installs, service changes, and external process control remain blocked.",
    protectedSurfaces: ["~/.openclaw", "services/install/config", "external connector processes"]
  },
  progression: [
    {
      id: "layer-local-only",
      layer: "local-only",
      label: "Local-only",
      status: "active",
      detail: "Studio-local root select, bridge stage, activate, and apply mutate only in-memory state and execution history."
    },
    {
      id: "layer-preview-host",
      layer: "preview-host",
      label: "Preview-host",
      status: "available",
      detail: "Preview actions describe the future host path, policy gates, capability state, and enablement requirements without executing."
    },
    {
      id: "layer-withheld",
      layer: "withheld",
      label: "Withheld",
      status: "blocked",
      detail: "Live host execution remains blocked until approvals, a typed mutation bridge, and rollback-aware lifecycle handling exist."
    },
    {
      id: "layer-future-executor",
      layer: "future-executor",
      label: "Future executor",
      status: "future",
      detail: "Executor slots are now part of the contract, but no real host-side executor is wired into the Electron bridge."
    }
  ],
  capabilities: [
    {
      id: "cap-read-only",
      label: "Read-only detail",
      state: "ready",
      detail: "Runtime-backed Tools / MCP rows can expose sanitized typed detail payloads."
    },
    {
      id: "cap-dry-run",
      label: "Dry-run planning",
      state: "ready",
      detail: "Connect, attach, activate, and apply flows can stage plans, blockers, and predicted outcomes without mutation."
    },
    {
      id: "cap-local-only",
      label: "Studio-local controls",
      state: "ready",
      detail: "Execution can advance only inside the Studio-local control session and history."
    },
    {
      id: "cap-preview-host",
      label: "Host preview contract",
      state: "partial",
      detail: "Preview-host results now carry policy, capability, precondition, withheld-plan, and future-slot structure."
    },
    {
      id: "cap-host-executor",
      label: "Host executor bridge",
      state: "partial",
      detail: "A default-disabled host bridge skeleton now exists, but no live host mutation or lifecycle executor is enabled."
    }
  ],
  blockedReasons: [
    {
      code: "policy-no-host-execution",
      layer: "withheld",
      label: "Alpha policy blocks live host execution",
      detail: "This round forbids ~/.openclaw writes, install/config changes, restarts, and external process control."
    },
    {
      code: "approval-required",
      layer: "withheld",
      label: "Explicit approval is still missing",
      detail: "No host-side execution approval handshake is available in the current shell."
    },
    {
      code: "host-bridge-missing",
      layer: "withheld",
      label: "Typed host mutation bridge stays default-disabled",
      detail: "The Electron bridge now includes placeholder slot handlers and validators, but it still cannot perform live host mutations."
    },
    {
      code: "rollback-missing",
      layer: "future-executor",
      label: "Rollback-aware lifecycle handling is not defined in code",
      detail: "A future executor would need attach/deactivate/apply rollback semantics before any live enablement."
    }
  ],
  requiredPreconditions: [
    {
      id: "precondition-approval",
      label: "Approval handshake",
      state: "missing",
      detail: "A typed grant path must exist before host writes or lifecycle changes can be attempted."
    },
    {
      id: "precondition-bridge",
      label: "Host mutation bridge",
      state: "partial",
      detail: "Default-disabled IPC entry points now exist, but real host execution remains intentionally disabled."
    },
    {
      id: "precondition-lifecycle",
      label: "Lifecycle runner",
      state: "missing",
      detail: "The shell still lacks activate/deactivate/restart semantics for connector processes."
    },
    {
      id: "precondition-rollback",
      label: "Rollback-aware apply semantics",
      state: "missing",
      detail: "A failed live apply would need coordinated unwind across bridge state, config, and lifecycle."
    }
  ],
  withheldExecutionPlan: [
    {
      id: "withheld-plan-root",
      label: "Resolve root target",
      state: "planned",
      detail: "Scan dedicated MCP roots and select the highest-priority candidate or fallback path."
    },
    {
      id: "withheld-plan-bridge",
      label: "Compose bridge inputs",
      state: "planned",
      detail: "Assemble installs, entries, load paths, curated cache, and local overlays into a typed payload."
    },
    {
      id: "withheld-plan-approval",
      label: "Request host approval",
      state: "withheld",
      detail: "The shell has no approval contract for live host mutation in this round."
    },
    {
      id: "withheld-plan-execute",
      label: "Handoff to host executor",
      state: "future",
      detail: "The disabled bridge skeleton now maps preview handoff into slots, but a future executor would still own real connect, attach, activate, and apply with rollback support."
    }
  ],
  futureExecutorSlots: [
    {
      id: "slot-root-connect",
      label: "Root connect executor",
      state: "planned",
      detail: "Future slot for dedicated-root resolution, idempotent connect, and clean detach."
    },
    {
      id: "slot-bridge-attach",
      label: "Bridge attach executor",
      state: "planned",
      detail: "Future slot for multi-source bridge binding with precedence validation."
    },
    {
      id: "slot-lifecycle",
      label: "Connector lifecycle runner",
      state: "planned",
      detail: "Future slot for activate/deactivate semantics around external connector processes."
    },
    {
      id: "slot-lane-apply",
      label: "Lane apply coordinator",
      state: "planned",
      detail: "Future slot for config-aware apply plus rollback across runtime state and lifecycle."
    }
  ],
  hostExecutor: mockHostExecutorState
};

const mockCommandSurface: StudioCommandSurface = {
  title: "Command Palette",
  summary:
    "Phase 32 deepens the local-only command layer again: cross-view orchestration, sequence previews, active flow state, route-aware next-step boards, recent command history, and inspector-command linkage now stay tied to the current route, workflow lane, focused slot, and detached-window posture.",
  placeholder: "Search orchestration, navigation, next steps, flow state, detached workspace, or keyboard routes",
  quickActionIds: [
    "command-open-home",
    "command-inspect-boundary",
    "command-show-trace",
    "command-focus-lane-apply",
    "command-advance-workflow"
  ],
  actions: [
    {
      id: "command-open-dashboard",
      label: "Open Dashboard",
      description: "Navigate to the program health view.",
      kind: "navigate",
      scope: "route",
      safety: "local-only",
      tone: "neutral",
      keywords: ["dashboard", "home", "navigate", "route"],
      routeId: "dashboard",
      hotkey: "Alt+1"
    },
    {
      id: "command-open-home",
      label: "Open Home",
      description: "Navigate to the shell overview and recovery surface.",
      kind: "navigate",
      scope: "route",
      safety: "local-only",
      tone: "neutral",
      keywords: ["home", "overview", "navigate", "route"],
      routeId: "home",
      hotkey: "Alt+2"
    },
    {
      id: "command-open-skills",
      label: "Open Skills / Tools / MCP",
      description: "Navigate to the runtime inventory and preview surface.",
      kind: "navigate",
      scope: "route",
      safety: "local-only",
      tone: "neutral",
      keywords: ["skills", "tools", "mcp", "navigate", "preview"],
      routeId: "skills",
      hotkey: "Alt+6"
    },
    {
      id: "command-open-settings",
      label: "Open Settings",
      description: "Navigate to the shell policy and runtime posture view.",
      kind: "navigate",
      scope: "route",
      safety: "local-only",
      tone: "neutral",
      keywords: ["settings", "policy", "navigate", "runtime"],
      routeId: "settings",
      hotkey: "Alt+7"
    },
    {
      id: "command-inspect-boundary",
      label: "Inspect Boundary Contract",
      description: "Focus the right rail on boundary state and keep dock context visible.",
      kind: "show-boundary",
      scope: "layout",
      safety: "local-only",
      tone: "positive",
      keywords: ["inspect", "boundary", "right rail", "inspector"],
      rightRailTabId: "inspector",
      bottomDockTabId: "focus",
      hotkey: "Shift+I"
    },
    {
      id: "command-show-trace",
      label: "Show Focused Slot Trace",
      description: "Move the shell into trace-first posture for the current focused slot.",
      kind: "show-trace",
      scope: "focus",
      safety: "preview-host",
      tone: "positive",
      keywords: ["trace", "slot", "preview", "focus"],
      rightRailTabId: "trace",
      bottomDockTabId: "focus",
      hotkey: "Shift+T"
    },
    {
      id: "command-preview-lane-apply",
      label: "Preview Lane Apply Contract",
      description: "Jump to the Skills page and scope the shell to the lane apply placeholder path.",
      kind: "show-preview",
      scope: "focus",
      safety: "preview-host",
      tone: "warning",
      keywords: ["preview", "lane apply", "skills", "host", "placeholder"],
      routeId: "skills",
      slotId: "slot-lane-apply",
      rightRailTabId: "trace",
      bottomDockTabId: "focus"
    },
    {
      id: "command-focus-connector-activate",
      label: "Focus Connector Activate Slot",
      description: "Scope page summaries, inspector, and dock to the connector activate placeholder slot.",
      kind: "focus-slot",
      scope: "focus",
      safety: "local-only",
      tone: "neutral",
      keywords: ["focus", "connector", "activate", "slot"],
      slotId: "slot-connector-activate"
    },
    {
      id: "command-focus-lane-apply",
      label: "Focus Lane Apply Slot",
      description: "Scope the shell to the highest-risk rollback-aware placeholder slot.",
      kind: "focus-slot",
      scope: "focus",
      safety: "local-only",
      tone: "warning",
      keywords: ["focus", "lane apply", "rollback", "slot"],
      slotId: "slot-lane-apply"
    },
    {
      id: "command-advance-workflow",
      label: "Advance Current Workflow Lane",
      description: "Advance the selected local-only workflow lane by surfacing its next workspace, detached candidate, or handoff posture.",
      kind: "advance-workflow-lane",
      scope: "window",
      safety: "local-only",
      tone: "warning",
      keywords: ["workflow", "lane", "advance", "orchestration", "next action"],
      hotkey: "Shift+W"
    },
    {
      id: "command-toggle-right-rail",
      label: "Toggle Right Rail",
      description: "Show or hide the inspector/trace rail while keeping the layout state persisted.",
      kind: "toggle-right-rail",
      scope: "layout",
      safety: "local-only",
      tone: "neutral",
      keywords: ["layout", "right rail", "inspector", "toggle"],
      hotkey: "Alt+["
    },
    {
      id: "command-toggle-bottom-dock",
      label: "Toggle Bottom Dock",
      description: "Show or hide the bottom dock while keeping the layout state persisted.",
      kind: "toggle-bottom-dock",
      scope: "layout",
      safety: "local-only",
      tone: "neutral",
      keywords: ["layout", "bottom dock", "toggle", "panels"],
      hotkey: "Alt+]"
    },
    {
      id: "command-toggle-compact-mode",
      label: "Toggle Compact Mode",
      description: "Switch the shell into a denser layout and persist that preference.",
      kind: "toggle-compact-mode",
      scope: "layout",
      safety: "local-only",
      tone: "neutral",
      keywords: ["compact", "density", "layout", "persist"],
      hotkey: "Shift+M"
    },
    {
      id: "command-open-operator-view",
      label: "Activate Operator Shell View",
      description: "Restore the default shell composition for navigation and inspection.",
      kind: "activate-workspace-view",
      scope: "window",
      safety: "local-only",
      tone: "positive",
      keywords: ["workspace", "operator", "view", "layout"],
      workspaceViewId: "operator-shell"
    },
    {
      id: "command-open-trace-view",
      label: "Activate Trace Deck View",
      description: "Bias the shell toward the focused slot trace and preview posture.",
      kind: "activate-workspace-view",
      scope: "window",
      safety: "preview-host",
      tone: "warning",
      keywords: ["workspace", "trace", "view", "preview"],
      workspaceViewId: "trace-deck"
    },
    {
      id: "command-open-review-view",
      label: "Activate Review Deck View",
      description: "Bias the shell toward window intents, placeholders, and review posture.",
      kind: "activate-workspace-view",
      scope: "window",
      safety: "local-only",
      tone: "neutral",
      keywords: ["workspace", "review", "view", "windows"],
      workspaceViewId: "review-deck"
    },
    {
      id: "command-stage-inspector-window",
      label: "Stage Inspector Detach Intent",
      description: "Record the detached-inspector placeholder intent without opening a real window.",
      kind: "stage-window-intent",
      scope: "window",
      safety: "local-only",
      tone: "neutral",
      keywords: ["window", "detach", "inspector", "placeholder"],
      windowIntentId: "window-intent-inspector-detach"
    },
    {
      id: "command-stage-trace-window",
      label: "Stage Trace Workspace Intent",
      description: "Record a trace-deck window intent and switch the shell to window-aware posture.",
      kind: "stage-window-intent",
      scope: "window",
      safety: "local-only",
      tone: "warning",
      keywords: ["window", "trace", "workspace", "intent"],
      windowIntentId: "window-intent-trace-workspace"
    }
  ],
  contexts: [
    {
      id: "global",
      label: "Global quick actions",
      summary: "Safe actions that can run anywhere in the shell.",
      actionIds: [
        "command-open-home",
        "command-inspect-boundary",
        "command-show-trace",
        "command-advance-workflow",
        "command-toggle-right-rail",
        "command-toggle-bottom-dock",
        "command-toggle-compact-mode",
        "command-open-operator-view"
      ]
    },
    {
      id: "dashboard",
      label: "Dashboard route actions",
      summary: "Program-level actions for health, focus, and preview posture.",
      actionIds: [
        "command-open-dashboard",
        "command-open-operator-view",
        "command-focus-lane-apply",
        "command-inspect-boundary",
        "command-advance-workflow",
        "command-preview-lane-apply"
      ]
    },
    {
      id: "home",
      label: "Home route actions",
      summary: "Shell-level actions for restoring operator posture and handing off into the next boundary step.",
      actionIds: [
        "command-open-home",
        "command-open-operator-view",
        "command-inspect-boundary",
        "command-focus-lane-apply",
        "command-open-dashboard",
        "command-advance-workflow"
      ]
    },
    {
      id: "sessions",
      label: "Sessions route actions",
      summary: "Actions that pivot from queues back into operator review surfaces.",
      actionIds: ["command-open-dashboard", "command-show-trace", "command-open-review-view", "command-advance-workflow"]
    },
    {
      id: "agents",
      label: "Agents route actions",
      summary: "Actions that keep the shell in review and window-aware posture.",
      actionIds: ["command-open-review-view", "command-stage-inspector-window", "command-advance-workflow", "command-toggle-compact-mode"]
    },
    {
      id: "codex",
      label: "Codex route actions",
      summary: "Actions that bias the shell toward compact review and route switching.",
      actionIds: ["command-open-review-view", "command-toggle-compact-mode", "command-open-settings", "command-advance-workflow"]
    },
    {
      id: "skills",
      label: "Skills route actions",
      summary: "Actions that keep preview-host posture visible while the shell orchestrates a trace-first review flow locally.",
      actionIds: [
        "command-open-trace-view",
        "command-focus-lane-apply",
        "command-show-trace",
        "command-advance-workflow",
        "command-preview-lane-apply",
        "command-stage-trace-window",
        "command-focus-connector-activate"
      ]
    },
    {
      id: "settings",
      label: "Settings route actions",
      summary: "Actions for policy review, layout posture, and detached workspace behavior.",
      actionIds: [
        "command-open-settings",
        "command-open-review-view",
        "command-stage-trace-window",
        "command-advance-workflow",
        "command-toggle-compact-mode"
      ]
    }
  ],
  actionGroups: [
    {
      id: "group-route-routing",
      label: "Route Routing",
      summary: "Route-level shortcuts and page handoffs stay inside the local shell.",
      tone: "neutral",
      actionIds: ["command-open-dashboard", "command-open-home", "command-open-skills", "command-open-settings"]
    },
    {
      id: "group-focused-slot",
      label: "Focused Slot Orchestration",
      summary: "Inspector, trace, preview posture, and slot focus all stay tied to the current focused slot.",
      tone: "positive",
      actionIds: [
        "command-focus-lane-apply",
        "command-focus-connector-activate",
        "command-inspect-boundary",
        "command-show-trace",
        "command-preview-lane-apply"
      ]
    },
    {
      id: "group-workflow-lane",
      label: "Workflow Lane Actions",
      summary: "Advance the current lane and align workspace views, detached candidates, and local handoff posture.",
      tone: "warning",
      actionIds: [
        "command-advance-workflow",
        "command-open-operator-view",
        "command-open-trace-view",
        "command-open-review-view",
        "command-stage-inspector-window",
        "command-stage-trace-window"
      ]
    },
    {
      id: "group-layout-routing",
      label: "Layout Routing",
      summary: "Persisted shell layout routing stays keyboard-addressable and local-only.",
      tone: "neutral",
      actionIds: ["command-toggle-right-rail", "command-toggle-bottom-dock", "command-toggle-compact-mode"]
    }
  ],
  sequences: [
    {
      id: "sequence-dashboard-boundary-review",
      label: "Boundary Review Flow",
      summary: "Align the operator shell, focus the lane-apply slot, then move the dashboard into a boundary-first review posture without opening any host surface.",
      tone: "positive",
      safety: "local-only",
      actionIds: ["command-open-operator-view", "command-focus-lane-apply", "command-inspect-boundary", "command-advance-workflow"],
      recommendedActionId: "command-open-operator-view",
      followUpActionIds: ["command-show-trace", "command-stage-inspector-window"],
      match: {
        routeIds: ["dashboard"]
      }
    },
    {
      id: "sequence-home-operator-restore",
      label: "Operator Shell Restore",
      summary: "Use Home as a recovery surface: restore operator-shell posture, refresh the boundary rail, and line up the current focused slot for the next workflow handoff.",
      tone: "neutral",
      safety: "local-only",
      actionIds: ["command-open-operator-view", "command-inspect-boundary", "command-focus-lane-apply"],
      recommendedActionId: "command-open-operator-view",
      followUpActionIds: ["command-open-dashboard", "command-advance-workflow"],
      match: {
        routeIds: ["home"]
      }
    },
    {
      id: "sequence-skills-trace-review",
      label: "Trace Review Flow",
      summary: "Align Trace Deck, keep the lane-apply slot in scope, and route Skills into a trace-first local review posture with no host execution.",
      tone: "warning",
      safety: "local-only",
      actionIds: ["command-open-trace-view", "command-focus-lane-apply", "command-show-trace", "command-advance-workflow"],
      recommendedActionId: "command-open-trace-view",
      followUpActionIds: ["command-preview-lane-apply", "command-stage-trace-window"],
      match: {
        routeIds: ["skills"]
      }
    },
    {
      id: "sequence-settings-review-deck",
      label: "Review Deck Coordination",
      summary:
        "Keep Settings in a window-aware coordination posture: move into Review Deck, stage the inspector candidate, then advance the local orchestration board without opening a native window.",
      tone: "neutral",
      safety: "local-only",
      actionIds: ["command-open-review-view", "command-stage-inspector-window", "command-advance-workflow"],
      recommendedActionId: "command-open-review-view",
      followUpActionIds: ["command-toggle-right-rail", "command-stage-trace-window"],
      match: {
        routeIds: ["settings"]
      }
    }
  ],
  contextualFlows: [
    {
      id: "flow-dashboard-boundary-review",
      surfaceIds: ["shell", "dashboard"],
      label: "Dashboard Next Actions",
      summary: "Dashboard now exposes a boundary-first orchestration path driven by the current route, workflow lane, and focused slot instead of a flat list of buttons.",
      sequenceId: "sequence-dashboard-boundary-review",
      recommendedActionId: "command-open-operator-view",
      followUpActionIds: ["command-show-trace", "command-stage-inspector-window"],
      groupIds: ["group-focused-slot", "group-workflow-lane"],
      keyboardShortcutIds: ["keyboard-run-active-flow", "keyboard-open-dashboard", "keyboard-inspect-boundary"],
      match: {
        routeIds: ["dashboard"]
      }
    },
    {
      id: "flow-home-operator-restore",
      surfaceIds: ["shell", "home"],
      label: "Home Recommended Flow",
      summary: "Home now surfaces a contextual restore flow that can hand the shell back into boundary review without leaving local-only mode.",
      sequenceId: "sequence-home-operator-restore",
      recommendedActionId: "command-open-operator-view",
      followUpActionIds: ["command-open-dashboard", "command-advance-workflow"],
      groupIds: ["group-route-routing", "group-focused-slot"],
      keyboardShortcutIds: ["keyboard-run-active-flow", "keyboard-open-home", "keyboard-inspect-boundary"],
      match: {
        routeIds: ["home"]
      }
    },
    {
      id: "flow-skills-trace-review",
      surfaceIds: ["shell", "skills"],
      label: "Skills Contextual Flow",
      summary: "Skills now surfaces a trace-first orchestration path that keeps preview posture, workflow lane feedback, and focused-slot trace routing synchronized locally.",
      sequenceId: "sequence-skills-trace-review",
      recommendedActionId: "command-open-trace-view",
      followUpActionIds: ["command-preview-lane-apply", "command-stage-trace-window"],
      groupIds: ["group-focused-slot", "group-workflow-lane"],
      keyboardShortcutIds: ["keyboard-run-active-flow", "keyboard-open-skills", "keyboard-show-trace"],
      match: {
        routeIds: ["skills"]
      }
    },
    {
      id: "flow-settings-review-deck",
      surfaceIds: ["shell", "settings"],
      label: "Settings Coordination Flow",
      summary:
        "Settings now exposes a review-deck coordination flow so route, workflow lane, staged intent, and detached candidate feedback stay synchronized in one local orchestration board.",
      sequenceId: "sequence-settings-review-deck",
      recommendedActionId: "command-open-review-view",
      followUpActionIds: ["command-toggle-right-rail", "command-stage-trace-window"],
      groupIds: ["group-workflow-lane", "group-layout-routing"],
      keyboardShortcutIds: ["keyboard-run-active-flow", "keyboard-open-settings", "keyboard-run-review-sequence"],
      match: {
        routeIds: ["settings"]
      }
    }
  ],
  nextSteps: [
    {
      id: "next-step-dashboard-workspace",
      label: "Re-anchor operator workspace",
      detail: "Keep Dashboard tied to Operator Shell so boundary review and window orchestration stay aligned locally.",
      tone: "positive",
      kind: "workflow",
      actionId: "command-open-operator-view"
    },
    {
      id: "next-step-dashboard-slot",
      label: "Lock lane-apply focus",
      detail: "Pin the rollback-aware lane-apply slot before advancing the boundary flow.",
      tone: "warning",
      kind: "focus",
      actionId: "command-focus-lane-apply"
    },
    {
      id: "next-step-dashboard-window",
      label: "Stage inspector candidate",
      detail: "Surface the detached inspector placeholder as the local review candidate for this flow.",
      tone: "neutral",
      kind: "window",
      actionId: "command-stage-inspector-window"
    },
    {
      id: "next-step-home-restore",
      label: "Restore operator shell",
      detail: "Rebuild the default shell posture before handing work back into boundary review.",
      tone: "positive",
      kind: "workflow",
      actionId: "command-open-operator-view"
    },
    {
      id: "next-step-home-boundary",
      label: "Refresh inspector route",
      detail: "Bring the boundary rail back into scope for the current slot and workflow lane.",
      tone: "neutral",
      kind: "route",
      actionId: "command-inspect-boundary"
    },
    {
      id: "next-step-home-workflow",
      label: "Advance the next lane step",
      detail: "Move the active workflow lane to its next local handoff posture.",
      tone: "warning",
      kind: "workflow",
      actionId: "command-advance-workflow"
    },
    {
      id: "next-step-skills-trace",
      label: "Bias into Trace Deck",
      detail: "Switch to the trace-first workspace so preview posture and slot routing stay visible together.",
      tone: "warning",
      kind: "route",
      actionId: "command-open-trace-view"
    },
    {
      id: "next-step-skills-preview",
      label: "Preview lane-apply contract",
      detail: "Keep the preview-host placeholder visible without leaving local-only execution mode.",
      tone: "warning",
      kind: "trace",
      actionId: "command-preview-lane-apply"
    },
    {
      id: "next-step-skills-intent",
      label: "Focus trace workspace intent",
      detail: "Stage the trace workspace intent so window-aware review stays linked to the current route and slot.",
      tone: "positive",
      kind: "window",
      actionId: "command-stage-trace-window"
    },
    {
      id: "next-step-settings-review",
      label: "Move into Review Deck",
      detail: "Shift Settings into the review-first workspace so orchestration state is easier to inspect.",
      tone: "neutral",
      kind: "route",
      actionId: "command-open-review-view"
    },
    {
      id: "next-step-settings-inspector",
      label: "Stage boundary candidate",
      detail: "Keep the detached inspector candidate linked to the active review lane without creating a real window.",
      tone: "neutral",
      kind: "window",
      actionId: "command-stage-inspector-window"
    },
    {
      id: "next-step-settings-lane",
      label: "Advance review orchestration",
      detail: "Move the active review lane toward its next staged handoff posture.",
      tone: "warning",
      kind: "workflow",
      actionId: "command-advance-workflow"
    }
  ],
  nextStepBoards: [
    {
      id: "board-dashboard-boundary-review",
      label: "Dashboard Route-aware Next-step Board",
      summary: "Dashboard keeps the next actions anchored to the current route, lane-apply slot, and detached inspector candidate.",
      flowId: "flow-dashboard-boundary-review",
      sequenceId: "sequence-dashboard-boundary-review",
      stepIds: ["next-step-dashboard-workspace", "next-step-dashboard-slot", "next-step-dashboard-window"],
      match: {
        routeIds: ["dashboard"]
      }
    },
    {
      id: "board-home-operator-restore",
      label: "Home Route-aware Next-step Board",
      summary: "Home keeps restore, inspector refresh, and workflow advance actions grouped as one local-only operator recovery board.",
      flowId: "flow-home-operator-restore",
      sequenceId: "sequence-home-operator-restore",
      stepIds: ["next-step-home-restore", "next-step-home-boundary", "next-step-home-workflow"],
      match: {
        routeIds: ["home"]
      }
    },
    {
      id: "board-skills-trace-review",
      label: "Skills Route-aware Next-step Board",
      summary: "Skills keeps Trace Deck, preview posture, and trace workspace intent aligned in one next-step board.",
      flowId: "flow-skills-trace-review",
      sequenceId: "sequence-skills-trace-review",
      stepIds: ["next-step-skills-trace", "next-step-skills-preview", "next-step-skills-intent"],
      match: {
        routeIds: ["skills"]
      }
    },
    {
      id: "board-settings-review-deck",
      label: "Settings Route-aware Next-step Board",
      summary: "Settings groups review-deck entry, staged inspector candidate, and lane advance into one coordination board.",
      flowId: "flow-settings-review-deck",
      sequenceId: "sequence-settings-review-deck",
      stepIds: ["next-step-settings-review", "next-step-settings-inspector", "next-step-settings-lane"],
      match: {
        routeIds: ["settings"]
      }
    }
  ],
  history: {
    title: "Recent Command History",
    summary: "Recent local-only commands stay visible so route changes, flow advances, slot focus, and staged window intents remain auditable inside the shell.",
    retention: 8,
    emptyState: "No local command history yet."
  },
  keyboardRouting: {
    title: "Keyboard Routing",
    summary:
      "Phase 32 keeps keyboard routing local-only: palette open/close, contextual flow advance, direct sequence launch, route shortcuts, and slot/trace hotkeys all stay inside the shell UI while cross-view coordination remains reviewable.",
    shortcuts: [
      {
        id: "keyboard-open-palette",
        label: "Open command palette",
        combo: "Ctrl/Cmd+K",
        key: "k",
        scope: "global",
        target: "open-palette",
        metaOrCtrl: true,
        preserveFocus: true
      },
      {
        id: "keyboard-close-palette",
        label: "Close command palette",
        combo: "Esc",
        key: "Escape",
        scope: "palette",
        target: "close-palette",
        preserveFocus: true,
        closePalette: true
      },
      {
        id: "keyboard-run-active-flow",
        label: "Advance contextual flow",
        combo: "Alt+Enter",
        key: "Enter",
        scope: "flow",
        target: "active-flow",
        altKey: true
      },
      {
        id: "keyboard-open-dashboard",
        label: "Route to Dashboard",
        combo: "Alt+1",
        key: "1",
        scope: "route",
        target: "action",
        actionId: "command-open-dashboard",
        altKey: true
      },
      {
        id: "keyboard-open-home",
        label: "Route to Home",
        combo: "Alt+2",
        key: "2",
        scope: "route",
        target: "action",
        actionId: "command-open-home",
        altKey: true
      },
      {
        id: "keyboard-open-skills",
        label: "Route to Skills",
        combo: "Alt+6",
        key: "6",
        scope: "route",
        target: "action",
        actionId: "command-open-skills",
        altKey: true
      },
      {
        id: "keyboard-open-settings",
        label: "Route to Settings",
        combo: "Alt+7",
        key: "7",
        scope: "route",
        target: "action",
        actionId: "command-open-settings",
        altKey: true
      },
      {
        id: "keyboard-run-review-sequence",
        label: "Run review coordination sequence",
        combo: "Alt+0",
        key: "0",
        scope: "route",
        target: "sequence",
        sequenceId: "sequence-settings-review-deck",
        altKey: true
      },
      {
        id: "keyboard-inspect-boundary",
        label: "Inspect boundary",
        combo: "Shift+I",
        key: "i",
        scope: "global",
        target: "action",
        actionId: "command-inspect-boundary",
        shiftKey: true
      },
      {
        id: "keyboard-show-trace",
        label: "Show focused trace",
        combo: "Shift+T",
        key: "t",
        scope: "global",
        target: "action",
        actionId: "command-show-trace",
        shiftKey: true
      },
      {
        id: "keyboard-advance-workflow",
        label: "Advance workflow lane",
        combo: "Shift+W",
        key: "w",
        scope: "global",
        target: "action",
        actionId: "command-advance-workflow",
        shiftKey: true
      },
      {
        id: "keyboard-toggle-right-rail",
        label: "Toggle right rail",
        combo: "Alt+[",
        key: "[",
        scope: "global",
        target: "action",
        actionId: "command-toggle-right-rail",
        altKey: true
      },
      {
        id: "keyboard-toggle-bottom-dock",
        label: "Toggle bottom dock",
        combo: "Alt+]",
        key: "]",
        scope: "global",
        target: "action",
        actionId: "command-toggle-bottom-dock",
        altKey: true
      },
      {
        id: "keyboard-toggle-compact-mode",
        label: "Toggle compact mode",
        combo: "Shift+M",
        key: "m",
        scope: "global",
        target: "action",
        actionId: "command-toggle-compact-mode",
        shiftKey: true
      }
    ]
  }
};

const mockLayout: StudioShellLayout = {
  title: "Layout Persistence",
  summary:
    "Right rail visibility, bottom dock visibility, compact mode, selected tabs, and the current workspace view continue to persist in localStorage while phase32 layers deeper cross-view coordination and release-review boards on top of the same local-only shell posture.",
  persistence: {
    storageKey: "openclaw-studio.shell-layout",
    strategy: "localStorage",
    version: "phase32-layout-v4",
    persistedFields: ["rightRailVisible", "bottomDockVisible", "compactMode", "rightRailTabId", "bottomDockTabId", "workspaceViewId"]
  },
  defaultState: {
    rightRailVisible: true,
    bottomDockVisible: true,
    compactMode: false,
    rightRailTabId: "inspector",
    bottomDockTabId: "focus",
    workspaceViewId: "operator-shell"
  },
  rightRailTabs: [
    {
      id: "inspector",
      label: "Inspector",
      summary: "Boundary, policy, and slot posture."
    },
    {
      id: "trace",
      label: "Trace",
      summary: "Focused slot handler, validator, timeline, and preview posture."
    },
    {
      id: "windows",
      label: "Windows",
      summary: "Workspace views, detached panels, and window intents."
    }
  ],
  bottomDockTabs: [
    {
      id: "focus",
      label: "Focus Dock",
      summary: "Focused slot cards and roster."
    },
    {
      id: "activity",
      label: "Activity Dock",
      summary: "Recent command surface actions and persisted layout state."
    },
    {
      id: "windows",
      label: "Window Dock",
      summary: "Window intents and detached panel placeholders."
    }
  ]
};

const mockWindowing: StudioWindowing = {
  title: "Detached Workspace Behavior",
  summary:
    "Phase 32 turns detached workspace behavior into a clearer local orchestration shell: route, workflow lane, command flow, workspace entry, detached candidate, intent focus, focused-slot posture, and release-review posture now read like one coordination board while remaining local-only and non-executing.",
  readiness: "contract-ready",
  posture: {
    mode: "intent-focused",
    label: "Intent Focused",
    summary: "Trace Workspace Intent is focused locally, so the shell now reads like a workflow-driven multi-window workbench while remaining inside one safe process/window.",
    activeWorkspaceViewId: "trace-deck",
    focusedIntentId: "window-intent-trace-workspace",
    activeDetachedPanelId: "detached-trace"
  },
  workflow: {
    title: "Workflow Timeline",
    summary:
      "Each lane now expresses one local-only path: enter a workspace view, surface its detached candidate, then settle into review, trace, or preview posture without opening a real native window.",
    activeLaneId: "lane-trace-review",
    lanes: [
      {
        id: "lane-boundary-review",
        label: "Boundary Review Workflow",
        summary: "Move from the anchored operator shell into a detached inspector candidate, then hand off into a boundary review posture.",
        posture: "review",
        workspaceViewId: "operator-shell",
        detachedPanelId: "detached-inspector",
        windowIntentId: "window-intent-inspector-detach",
        stepIds: ["workflow-step-operator-shell", "workflow-step-detached-inspector", "workflow-step-boundary-review"]
      },
      {
        id: "lane-trace-review",
        label: "Trace Review Workflow",
        summary: "Move from Trace Deck into the detached trace candidate, then keep trace, rollback posture, and preview review in one shell flow.",
        posture: "trace",
        workspaceViewId: "trace-deck",
        detachedPanelId: "detached-trace",
        windowIntentId: "window-intent-trace-workspace",
        stepIds: ["workflow-step-trace-deck", "workflow-step-detached-trace", "workflow-step-trace-review"]
      },
      {
        id: "lane-preview-review",
        label: "Preview Review Workflow",
        summary: "Move from Review Deck into the detached preview candidate, then hold a preview-ready handoff posture for policy and readiness review.",
        posture: "preview",
        workspaceViewId: "review-deck",
        detachedPanelId: "detached-preview",
        windowIntentId: "window-intent-review-workspace",
        stepIds: ["workflow-step-review-deck", "workflow-step-detached-preview", "workflow-step-preview-review"]
      }
    ],
    steps: [
      {
        id: "workflow-step-operator-shell",
        label: "Enter Operator Shell",
        summary: "Keep navigation, focus scope, and boundary review anchored in the main shell.",
        kind: "workspace-entry",
        posture: "review",
        workspaceViewId: "operator-shell"
      },
      {
        id: "workflow-step-detached-inspector",
        label: "Surface Detached Inspector",
        summary: "Lift the boundary inspector into a detached candidate posture without opening a real window.",
        kind: "detached-panel",
        posture: "review",
        workspaceViewId: "operator-shell",
        detachedPanelId: "detached-inspector"
      },
      {
        id: "workflow-step-boundary-review",
        label: "Settle Boundary Review Posture",
        summary: "Keep inspector/windows tabs synchronized so policy review feels like a handoff-ready workstation step.",
        kind: "work-posture",
        posture: "review",
        workspaceViewId: "operator-shell",
        detachedPanelId: "detached-inspector",
        windowIntentId: "window-intent-inspector-detach"
      },
      {
        id: "workflow-step-trace-deck",
        label: "Enter Trace Deck",
        summary: "Move the shell into a trace-first workspace that keeps slot focus and rollback posture visible.",
        kind: "workspace-entry",
        posture: "trace",
        workspaceViewId: "trace-deck"
      },
      {
        id: "workflow-step-detached-trace",
        label: "Surface Detached Trace",
        summary: "Keep the trace candidate visible as a local detached surface for slot-level review and preview linkage.",
        kind: "detached-panel",
        posture: "trace",
        workspaceViewId: "trace-deck",
        detachedPanelId: "detached-trace"
      },
      {
        id: "workflow-step-trace-review",
        label: "Settle Trace Review Posture",
        summary: "Focus the trace workspace intent so the shell locks into a trace-heavy review flow without host execution.",
        kind: "work-posture",
        posture: "trace",
        workspaceViewId: "trace-deck",
        detachedPanelId: "detached-trace",
        windowIntentId: "window-intent-trace-workspace"
      },
      {
        id: "workflow-step-review-deck",
        label: "Enter Review Deck",
        summary: "Move into the review deck so window status, policy posture, and candidate panels lead the shell.",
        kind: "workspace-entry",
        posture: "preview",
        workspaceViewId: "review-deck"
      },
      {
        id: "workflow-step-detached-preview",
        label: "Surface Detached Preview",
        summary: "Keep the preview candidate ready for route-aware handoff review while staying inside one shell process.",
        kind: "detached-panel",
        posture: "preview",
        workspaceViewId: "review-deck",
        detachedPanelId: "detached-preview"
      },
      {
        id: "workflow-step-preview-review",
        label: "Settle Preview Review Posture",
        summary: "Hold a preview-ready handoff posture so review work can continue locally until a future executor exists.",
        kind: "work-posture",
        posture: "preview",
        workspaceViewId: "review-deck",
        detachedPanelId: "detached-preview",
        windowIntentId: "window-intent-review-workspace"
      }
    ]
  },
  orchestration: {
    title: "Local Orchestration Board",
    summary:
      "Phase 32 links route, workflow lane, command flow, focused slot, workspace, detached candidate, intent posture, and release-review posture into one local-only orchestration map so the shell reads like a staged multi-window board without opening a native window.",
    activeBoardId: "orchestration-board-trace-review",
    checkpoints: [
      {
        id: "orchestration-boundary-route",
        label: "Current route",
        kind: "route",
        value: "dashboard",
        detail: "Boundary review stays anchored to Dashboard so boundary-first posture and orchestration feedback are visible together.",
        tone: "neutral"
      },
      {
        id: "orchestration-boundary-lane",
        label: "Workflow lane",
        kind: "workflow-lane",
        value: "Boundary Review Workflow",
        detail: "The boundary lane keeps inspector detach posture, review readiness, and handoff posture grouped locally.",
        tone: "positive"
      },
      {
        id: "orchestration-boundary-flow",
        label: "Command flow",
        kind: "command-flow",
        value: "Boundary Review Flow",
        detail: "The current sequence keeps operator-shell restore, focused slot, and inspector review steps in one local flow.",
        tone: "positive"
      },
      {
        id: "orchestration-boundary-workspace",
        label: "Workspace view",
        kind: "workspace",
        value: "operator-shell",
        detail: "Operator Shell remains the route anchor for boundary review.",
        tone: "positive"
      },
      {
        id: "orchestration-boundary-panel",
        label: "Detached candidate",
        kind: "detached-panel",
        value: "detached-inspector",
        detail: "The detached inspector placeholder is the review candidate for this lane.",
        tone: "warning"
      },
      {
        id: "orchestration-boundary-intent",
        label: "Intent focus",
        kind: "window-intent",
        value: "window-intent-inspector-detach",
        detail: "The staged inspector intent keeps shell linkage visible without opening a real window.",
        tone: "warning"
      },
      {
        id: "orchestration-boundary-slot",
        label: "Focused slot",
        kind: "focused-slot",
        value: "slot-lane-apply",
        detail: "Lane apply remains the highest-risk focused slot for boundary review and rollback posture.",
        tone: "warning"
      },
      {
        id: "orchestration-trace-route",
        label: "Current route",
        kind: "route",
        value: "skills",
        detail: "Trace review stays tied to Skills so preview posture and slot routing remain visible together.",
        tone: "neutral"
      },
      {
        id: "orchestration-trace-lane",
        label: "Workflow lane",
        kind: "workflow-lane",
        value: "Trace Review Workflow",
        detail: "The trace lane keeps trace deck posture, detached trace, and intent focus synchronized.",
        tone: "positive"
      },
      {
        id: "orchestration-trace-flow",
        label: "Command flow",
        kind: "command-flow",
        value: "Trace Review Flow",
        detail: "The trace review sequence keeps trace deck, focused slot, and trace panel routing in one local-only command flow.",
        tone: "positive"
      },
      {
        id: "orchestration-trace-workspace",
        label: "Workspace view",
        kind: "workspace",
        value: "trace-deck",
        detail: "Trace Deck is the active workspace posture for the trace review lane.",
        tone: "positive"
      },
      {
        id: "orchestration-trace-panel",
        label: "Detached candidate",
        kind: "detached-panel",
        value: "detached-trace",
        detail: "Detached Trace remains surfaced as the current review candidate.",
        tone: "positive"
      },
      {
        id: "orchestration-trace-intent",
        label: "Intent focus",
        kind: "window-intent",
        value: "window-intent-trace-workspace",
        detail: "Trace Workspace Intent is focused locally and keeps the shell in intent-focused posture.",
        tone: "positive"
      },
      {
        id: "orchestration-trace-slot",
        label: "Focused slot",
        kind: "focused-slot",
        value: "slot-lane-apply",
        detail: "Lane apply stays in scope so rollback posture remains visible beside trace review.",
        tone: "warning"
      },
      {
        id: "orchestration-preview-route",
        label: "Current route",
        kind: "route",
        value: "settings",
        detail: "Preview review stays linked to Settings so policy, readiness, and review posture remain aligned.",
        tone: "neutral"
      },
      {
        id: "orchestration-preview-lane",
        label: "Workflow lane",
        kind: "workflow-lane",
        value: "Preview Review Workflow",
        detail: "The preview lane keeps review deck posture, detached preview, and readiness review grouped locally.",
        tone: "warning"
      },
      {
        id: "orchestration-preview-flow",
        label: "Command flow",
        kind: "command-flow",
        value: "Review Deck Coordination",
        detail: "The settings coordination sequence keeps review deck, detached inspector staging, and lane advance in one route-aware board.",
        tone: "neutral"
      },
      {
        id: "orchestration-preview-workspace",
        label: "Workspace view",
        kind: "workspace",
        value: "review-deck",
        detail: "Review Deck is the review-first workspace candidate for the preview lane.",
        tone: "warning"
      },
      {
        id: "orchestration-preview-panel",
        label: "Detached candidate",
        kind: "detached-panel",
        value: "detached-preview",
        detail: "Detached Preview remains ready for local handoff review.",
        tone: "warning"
      },
      {
        id: "orchestration-preview-intent",
        label: "Intent focus",
        kind: "window-intent",
        value: "window-intent-review-workspace",
        detail: "Review Workspace Intent keeps preview review staged without opening a native review window.",
        tone: "neutral"
      },
      {
        id: "orchestration-preview-slot",
        label: "Focused slot",
        kind: "focused-slot",
        value: "slot-connector-activate",
        detail: "Connector activate is the lighter-weight slot for preview/readiness review in this board.",
        tone: "neutral"
      }
    ],
    boards: [
      {
        id: "orchestration-board-boundary-review",
        label: "Boundary Review Orchestration",
        summary: "Dashboard, Boundary Review Workflow, detached inspector candidate, and lane-apply focus stay tied together as one route-aware review board.",
        laneId: "lane-boundary-review",
        routeId: "dashboard",
        sequenceId: "sequence-dashboard-boundary-review",
        workspaceViewId: "operator-shell",
        detachedPanelId: "detached-inspector",
        windowIntentId: "window-intent-inspector-detach",
        focusedSlotId: "slot-lane-apply",
        recommendedActionId: "command-stage-inspector-window",
        checkpointIds: [
          "orchestration-boundary-route",
          "orchestration-boundary-lane",
          "orchestration-boundary-flow",
          "orchestration-boundary-workspace",
          "orchestration-boundary-panel",
          "orchestration-boundary-intent",
          "orchestration-boundary-slot"
        ]
      },
      {
        id: "orchestration-board-trace-review",
        label: "Trace Review Orchestration",
        summary: "Skills, Trace Review Workflow, Trace Deck, detached trace, and lane-apply slot now read like one staged coordination board.",
        laneId: "lane-trace-review",
        routeId: "skills",
        sequenceId: "sequence-skills-trace-review",
        workspaceViewId: "trace-deck",
        detachedPanelId: "detached-trace",
        windowIntentId: "window-intent-trace-workspace",
        focusedSlotId: "slot-lane-apply",
        recommendedActionId: "command-open-trace-view",
        checkpointIds: [
          "orchestration-trace-route",
          "orchestration-trace-lane",
          "orchestration-trace-flow",
          "orchestration-trace-workspace",
          "orchestration-trace-panel",
          "orchestration-trace-intent",
          "orchestration-trace-slot"
        ]
      },
      {
        id: "orchestration-board-preview-review",
        label: "Preview Review Orchestration",
        summary: "Settings, Preview Review Workflow, Review Deck, detached preview, and review-workspace intent remain linked as one local-only coordination board.",
        laneId: "lane-preview-review",
        routeId: "settings",
        sequenceId: "sequence-settings-review-deck",
        workspaceViewId: "review-deck",
        detachedPanelId: "detached-preview",
        windowIntentId: "window-intent-review-workspace",
        focusedSlotId: "slot-connector-activate",
        recommendedActionId: "command-open-review-view",
        checkpointIds: [
          "orchestration-preview-route",
          "orchestration-preview-lane",
          "orchestration-preview-flow",
          "orchestration-preview-workspace",
          "orchestration-preview-panel",
          "orchestration-preview-intent",
          "orchestration-preview-slot"
        ]
      }
    ]
  },
  views: [
    {
      id: "operator-shell",
      label: "Operator Shell",
      summary: "Anchored shell view for navigation, inspection, and the first step of boundary review workflows.",
      defaultPageId: "dashboard",
      rightRailTabId: "inspector",
      bottomDockTabId: "focus",
      detachState: "anchored",
      shellRole: "Navigation anchor and workflow entry point",
      intentIds: ["window-intent-inspector-detach"],
      detachedPanelIds: ["detached-inspector"]
    },
    {
      id: "trace-deck",
      label: "Trace Deck",
      summary: "Trace-first detached workspace candidate for slot-level preview, rollback posture, and a more continuous review flow.",
      defaultPageId: "skills",
      rightRailTabId: "trace",
      bottomDockTabId: "focus",
      detachState: "detached-local",
      shellRole: "Trace-first workflow entry with detached-local posture",
      intentIds: ["window-intent-trace-workspace"],
      detachedPanelIds: ["detached-trace", "detached-preview"]
    },
    {
      id: "review-deck",
      label: "Review Deck",
      summary: "Window-aware review view for policy, readiness, and preview-oriented detached candidates.",
      defaultPageId: "settings",
      rightRailTabId: "windows",
      bottomDockTabId: "windows",
      detachState: "candidate",
      shellRole: "Review-first workflow entry for preview and handoff posture",
      intentIds: ["window-intent-review-workspace"],
      detachedPanelIds: ["detached-inspector", "detached-preview"]
    }
  ],
  detachedPanels: [
    {
      id: "detached-inspector",
      label: "Detached Inspector Placeholder",
      summary: "Boundary/policy panel surfaced as a detachable candidate and routed back into the current shell workflow.",
      sourceTabId: "inspector",
      workspaceViewId: "operator-shell",
      detachState: "candidate",
      shellRole: "Boundary review candidate and workflow handoff surface",
      status: "placeholder"
    },
    {
      id: "detached-trace",
      label: "Detached Trace Placeholder",
      summary: "Trace-first panel expressed as a local detached posture with slot focus, validator state, rollback posture, and workflow continuity.",
      sourceTabId: "trace",
      workspaceViewId: "trace-deck",
      detachState: "detached-local",
      shellRole: "Focused trace candidate and review surface",
      status: "placeholder"
    },
    {
      id: "detached-preview",
      label: "Detached Preview Placeholder",
      summary: "Preview panel candidate for route-aware command, intent readiness, and local-only handoff review.",
      sourceTabId: "windows",
      workspaceViewId: "review-deck",
      detachState: "candidate",
      shellRole: "Preview candidate and handoff review surface",
      status: "placeholder"
    }
  ],
  windowIntents: [
    {
      id: "window-intent-inspector-detach",
      label: "Detach Inspector Intent",
      summary: "Stage a boundary-first detached inspector candidate and keep the shell in a review-ready local-only workflow.",
      target: "detached-panel",
      source: "command-surface",
      status: "staged",
      focus: "secondary",
      safeMode: "local-only",
      preview: {
        title: "Inspector Detach Preview",
        summary: "Keep the dashboard shell anchored while lifting inspector review into a detached candidate workflow step.",
        lines: [
          { label: "Workspace", value: "operator-shell" },
          { label: "Panel candidate", value: "detached-inspector" },
          { label: "Workflow lane", value: "Boundary Review Workflow" },
          { label: "Shell linkage", value: "dashboard · inspector / windows" }
        ]
      },
      shellLink: {
        pageId: "dashboard",
        rightRailTabId: "windows",
        bottomDockTabId: "windows"
      },
      workflowStep: {
        label: "Boundary review posture",
        posture: "review",
        summary: "Use the detached inspector candidate as the second step of a boundary review workflow."
      },
      readiness: {
        label: "Readiness Board",
        summary: "Boundary review is ready when the operator shell stays anchored, the detached inspector candidate is surfaced, and windows feedback stays linked.",
        checks: [
          { id: "readiness-inspector-workspace", label: "Workspace entry", value: "Operator Shell anchored", tone: "positive" },
          { id: "readiness-inspector-panel", label: "Detached candidate", value: "Detached Inspector placeholder", tone: "warning" },
          { id: "readiness-inspector-shell", label: "Shell linkage", value: "dashboard · inspector / windows", tone: "neutral" }
        ]
      },
      handoff: {
        label: "Boundary Review Handoff",
        posture: "review",
        summary: "The shell is ready to hold a boundary review posture locally and hand the same context into a future native/detached surface later.",
        destination: "dashboard -> inspector/windows",
        safeMode: "local-only"
      },
      detachedPanelId: "detached-inspector",
      pageId: "dashboard"
    },
    {
      id: "window-intent-trace-workspace",
      label: "Trace Workspace Intent",
      summary: "Focus a trace-first detached workspace candidate rooted in the Skills preview surface and keep the lane in a trace review workflow.",
      target: "workspace-view",
      source: "command-surface",
      status: "focused",
      focus: "primary",
      safeMode: "local-only",
      preview: {
        title: "Trace Workspace Preview",
        summary: "Switch the shell into trace-deck posture, keep trace visible, and treat trace/preview panels as detached workflow surfaces.",
        lines: [
          { label: "Workspace", value: "trace-deck" },
          { label: "Workflow lane", value: "Trace Review Workflow" },
          { label: "Focused posture", value: "intent-focused" },
          { label: "Shell linkage", value: "skills · trace / windows" }
        ]
      },
      shellLink: {
        pageId: "skills",
        rightRailTabId: "trace",
        bottomDockTabId: "windows"
      },
      workflowStep: {
        label: "Trace review posture",
        posture: "trace",
        summary: "Use Trace Deck and the detached trace candidate to settle into a trace-heavy review posture."
      },
      readiness: {
        label: "Readiness Board",
        summary: "Trace review is ready when Trace Deck is active, the detached trace candidate stays surfaced, and trace/windows tabs remain synchronized.",
        checks: [
          { id: "readiness-trace-workspace", label: "Workspace entry", value: "Trace Deck active", tone: "positive" },
          { id: "readiness-trace-panel", label: "Detached candidate", value: "Detached Trace surfaced locally", tone: "positive" },
          { id: "readiness-trace-shell", label: "Shell linkage", value: "skills · trace / windows", tone: "neutral" }
        ]
      },
      handoff: {
        label: "Trace Review Handoff",
        posture: "trace",
        summary: "The shell is holding a trace-first review posture locally, ready to hand the same context into a future detached/native workflow when host execution is allowed.",
        destination: "skills -> trace/windows",
        safeMode: "local-only"
      },
      workspaceViewId: "trace-deck",
      pageId: "skills"
    },
    {
      id: "window-intent-review-workspace",
      label: "Review Workspace Intent",
      summary: "Keep a review-deck candidate ready for policy, readiness, and preview handoff posture without leaving local-only mode.",
      target: "workspace-view",
      source: "shell-contract",
      status: "ready",
      focus: "secondary",
      safeMode: "local-only",
      preview: {
        title: "Review Workspace Preview",
        summary: "Bias the shell toward window status, readiness review, and detached preview candidates.",
        lines: [
          { label: "Workspace", value: "review-deck" },
          { label: "Workflow lane", value: "Preview Review Workflow" },
          { label: "Candidate state", value: "detached-candidate" },
          { label: "Shell linkage", value: "settings · windows / windows" }
        ]
      },
      shellLink: {
        pageId: "settings",
        rightRailTabId: "windows",
        bottomDockTabId: "windows"
      },
      workflowStep: {
        label: "Preview review posture",
        posture: "preview",
        summary: "Use Review Deck and the detached preview candidate to hold a preview-first handoff posture."
      },
      readiness: {
        label: "Readiness Board",
        summary: "Preview review is ready when Review Deck is available, the detached preview candidate is surfaced, and window tabs stay linked for handoff review.",
        checks: [
          { id: "readiness-review-workspace", label: "Workspace entry", value: "Review Deck candidate", tone: "warning" },
          { id: "readiness-review-panel", label: "Detached candidate", value: "Detached Preview ready", tone: "warning" },
          { id: "readiness-review-shell", label: "Shell linkage", value: "settings · windows / windows", tone: "neutral" }
        ]
      },
      handoff: {
        label: "Preview Review Handoff",
        posture: "preview",
        summary: "The shell is ready to hold a preview-first review posture locally and later transfer the same state into a future detached/native review surface.",
        destination: "settings -> windows/windows",
        safeMode: "local-only"
      },
      workspaceViewId: "review-deck",
      pageId: "settings"
    }
  ]
};

export const mockShellState: StudioShellState = {
  appName: "OpenClaw Studio",
  version: "0.1.0-alpha",
  status: {
    mode: "Studio Alpha",
    bridge: "mock",
    runtime: "ready"
  },
  pages: [
    { id: "dashboard", label: "Dashboard", hint: "Program health, watchlist, and milestones" },
    { id: "home", label: "Home", hint: "Overview and launch state" },
    { id: "sessions", label: "Sessions", hint: "Workspace activity and handoffs" },
    { id: "agents", label: "Agents", hint: "Operator roster and queued lanes" },
    { id: "codex", label: "Codex", hint: "Task queue and operator context" },
    { id: "skills", label: "Skills", hint: "Skills, tools, and MCP inventory" },
    { id: "settings", label: "Settings", hint: "Workspace policy and runtime knobs" }
  ],
  commandSurface: mockCommandSurface,
  layout: mockLayout,
  windowing: mockWindowing,
  boundary: mockBoundarySummary,
  dashboard: {
    headline:
      "Phase 29 keeps the shell on a safe control boundary: runtime-backed detail, dry-runs, Studio-local execution, detached workspace workflows, readiness-aware window intents, and shell-level multi-window feedback are available, while real host execution remains explicitly withheld.",
    metrics: [
      {
        id: "metric-bridge",
        label: "Bridge Mode",
        value: "Mock IPC",
        detail: "Hybrid live probes exist, but host-side execution remains boundary-blocked.",
        tone: "warning"
      },
      {
        id: "metric-pages",
        label: "Primary Views",
        value: "7 routes",
        detail: "Dashboard, Home, Sessions, Agents, Codex, Skills, Settings.",
        tone: "positive"
      },
      {
        id: "metric-sessions",
        label: "Tracked Sessions",
        value: "3 sessions",
        detail: "Current shell is rendering typed queue data.",
        tone: "neutral"
      },
      {
        id: "metric-agents",
        label: "Agent Coverage",
        value: "2 active",
        detail: "Execution work stays inside Studio-local control state until a future host executor exists.",
        tone: "positive"
      }
    ],
    workstreams: [
      {
        id: "workstream-shell",
        title: "Phase 27 product foundations",
        detail:
          "Shared types, runtime detail/results, route-aware commands, persisted layout controls, and multi-window placeholders now describe a more product-grade shell without opening host execution.",
        owner: "Codex",
        stage: "Closed",
        updatedAt: "Today",
        tone: "positive"
      },
      {
        id: "workstream-ui",
        title: "Boundary UI closeout",
        detail: "Dashboard, Inspector, and Skills detail now share one boundary summary model and progression ladder.",
        owner: "Codex",
        stage: "In progress",
        updatedAt: "Now",
        tone: "positive"
      },
      {
        id: "workstream-live",
        title: "Future host executor",
        detail: "Approval, validator, audit, rollback, and disabled slot handlers are now wired with simulated outcomes, but no live host executor is enabled.",
        owner: "Codex",
        stage: "Next",
        updatedAt: "Queued",
        tone: "warning"
      }
    ],
    alerts: [
      {
        id: "alert-electron",
        title: "Electron optional dependency is environment-sensitive",
        detail: "This machine still needs Electron installed before the desktop shell can launch.",
        tone: "warning"
      },
      {
        id: "alert-bridge",
        title: "Host execution stays withheld",
        detail: "The shell can describe future host execution in detail, but it still cannot mutate ~/.openclaw, services, installs, or external processes.",
        tone: "neutral"
      },
      {
        id: "alert-layout",
        title: "Layout persistence is now product-visible",
        detail: "The shell now persists right rail, bottom dock, compact mode, selected tabs, and workspace view using a lightweight localStorage contract.",
        tone: "neutral"
      }
    ],
    systemChecks: [
      {
        id: "check-shell",
        label: "Desktop Shell",
        value: "Compiled",
        detail: "Electron main and preload build successfully.",
        tone: "positive"
      },
      {
        id: "check-renderer",
        label: "Renderer",
        value: "Smokeable",
        detail: "Offline smoke validates the built renderer artifact path.",
        tone: "positive"
      },
      {
        id: "check-runtime",
        label: "Runtime Source",
        value: "Mock runtime",
        detail: "Fallback mode still reflects the phase29 disabled bridge contract even when live probes are unavailable.",
        tone: "warning"
      }
    ]
  },
  home: {
    headline:
      "The validated shell now carries a structured phase29 disabled bridge contract with simulated outcomes, detached workspace workflows, persisted layout controls, and dock/inspector-synced window posture, without turning on live host-side execution.",
    panels: [
      {
        id: "system",
        title: "System",
        description: "Bridge contracts, Electron shell, and renderer shell are online.",
        stats: [
          { label: "Runtime", value: "Ready", tone: "positive" },
          { label: "Bridge", value: "Mock IPC", tone: "warning" },
          { label: "Workspace", value: "Monorepo", tone: "neutral" }
        ]
      },
      {
        id: "focus",
        title: "Focus",
        description: "Primary Studio views now share one boundary summary shape in addition to the wider shell state.",
        stats: [
          { label: "Pages", value: "7 active", tone: "positive" },
          { label: "Inspector", value: "Boundary live", tone: "positive" },
          { label: "Dock", value: "Focus linked", tone: "positive" }
        ]
      },
      {
        id: "validation",
        title: "Validation",
        description: "The current alpha is designed to stay buildable even when GUI launch is unavailable.",
        stats: [
          { label: "Typecheck", value: "Passing", tone: "positive" },
          { label: "Build", value: "Passing", tone: "positive" },
          { label: "Smoke", value: "Offline", tone: "neutral" }
        ]
      }
    ],
    recentActivity: [
      {
        id: "activity-1",
        title: "Workspace skeleton validated",
        detail: "Typecheck, build, and offline smoke now cover the current alpha path.",
        timestamp: "Today"
      },
      {
        id: "activity-2",
        title: "Route shell widened",
        detail: "Dashboard, Agents, Skills, and Settings are wired into the primary navigation.",
        timestamp: "Now"
      },
      {
        id: "activity-3",
        title: "Host runtime stays isolated",
        detail:
          "Phase29 expands the contract with route-aware commands, persisted layout controls, detached workspace workflows, and readiness-aware window intents while keeping live host-side mutation outside the renderer and outside scope.",
        timestamp: "Next"
      }
    ]
  },
  sessions: [
    {
      id: "SES-101",
      title: "Studio Alpha bootstrap",
      workspace: "openclaw-studio",
      status: "active",
      updatedAt: "2 min ago",
      owner: "Codex"
    },
    {
      id: "SES-087",
      title: "Bridge contract review",
      workspace: "shared/bridge",
      status: "waiting",
      updatedAt: "18 min ago",
      owner: "OpenClaw"
    },
    {
      id: "SES-044",
      title: "Renderer layout pass",
      workspace: "ui/layout",
      status: "complete",
      updatedAt: "1 hr ago",
      owner: "Codex"
    }
  ],
  agents: {
    summary: "Agent lanes are still demo-backed, but the shell now has enough structure to host live roster and approval status later.",
    metrics: [
      {
        id: "agent-metric-active",
        label: "Active Agents",
        value: "2",
        detail: "Primary execution lanes are occupied.",
        tone: "positive"
      },
      {
        id: "agent-metric-waiting",
        label: "Waiting Lanes",
        value: "1",
        detail: "Reserved for live bridge or review work.",
        tone: "warning"
      },
      {
        id: "agent-metric-models",
        label: "Model Mix",
        value: "3 models",
        detail: "Shows how roster cards can expose model coverage.",
        tone: "neutral"
      }
    ],
    roster: [
      {
        id: "AGT-14",
        name: "Shell Integrator",
        role: "Renderer shell owner",
        model: "gpt-5.4",
        workspace: "apps/studio",
        status: "active",
        focus: "Extending the route shell and page registry.",
        approvals: "None pending",
        updatedAt: "Now"
      },
      {
        id: "AGT-11",
        name: "Bridge Watcher",
        role: "Contracts and preload lane",
        model: "gpt-5.3-codex",
        workspace: "packages/bridge",
        status: "waiting",
        focus: "Tracking approval and future-executor requirements for withheld host-side actions.",
        approvals: "Waiting for runtime data surface",
        updatedAt: "14 min ago"
      },
      {
        id: "AGT-07",
        name: "Runtime Curator",
        role: "Electron runtime lane",
        model: "gpt-5.2",
        workspace: "electron/runtime",
        status: "complete",
        focus: "Mock runtime path is stable and buildable.",
        approvals: "Closed",
        updatedAt: "39 min ago"
      }
    ],
    recentActivity: [
      {
        id: "agent-activity-1",
        title: "Shell Integrator updated navigation",
        detail: "Route expansion stayed within the shared contract boundary.",
        timestamp: "Now"
      },
      {
        id: "agent-activity-2",
        title: "Bridge Watcher queued live probes",
        detail: "System status and sessions are the first safe real integrations.",
        timestamp: "Next"
      }
    ]
  },
  codex: {
    summary: "Codex task flow is still mostly mock-backed, but the page is structured to accept live session and config metadata without coupling the renderer to raw runtime files.",
    stats: [
      { label: "Task Source", value: "Mock", tone: "warning" },
      { label: "Active", value: "1 running", tone: "positive" },
      { label: "Auth", value: "Pending", tone: "neutral" },
      { label: "CLI", value: "Unknown", tone: "warning" }
    ],
    tasks: [
      {
        id: "CDX-21",
        title: "Build studio shell layout",
        model: "gpt-5.4",
        status: "running",
        target: "renderer/shell",
        updatedAt: "Now",
        source: "mock",
        workdir: "apps/studio",
        detail: "Mock task lane keeps the page stable until local Codex session data is available."
      },
      {
        id: "CDX-18",
        title: "Define typed preload surface",
        model: "gpt-5.3-codex",
        status: "needs-review",
        target: "bridge/contracts",
        updatedAt: "11 min ago",
        source: "mock",
        workdir: "packages/bridge",
        detail: "Illustrative review lane for future live approvals and trace metadata."
      },
      {
        id: "CDX-11",
        title: "Prepare runtime placeholders",
        model: "gpt-5.2",
        status: "queued",
        target: "electron/runtime",
        updatedAt: "Queued",
        source: "mock",
        workdir: "apps/studio/electron",
        detail: "Mock queue item shows fallback behavior when no live Codex signals are readable."
      }
    ],
    observations: [
      {
        id: "codex-observation-config",
        label: "Config",
        value: "Fallback",
        detail: "Local Codex config metadata will appear here once ~/.codex/config.toml is readable.",
        tone: "warning"
      },
      {
        id: "codex-observation-auth",
        label: "Auth",
        value: "Pending",
        detail: "Auth readiness will switch from placeholder to observed when local Codex auth is readable.",
        tone: "neutral"
      },
      {
        id: "codex-observation-paths",
        label: "Paths",
        value: "Typed fallback",
        detail: "Config and sessions roots stay placeholder-backed until the runtime probe can read them safely.",
        tone: "neutral"
      }
    ]
  },
  skills: {
    summary:
      "This combined inventory page now pairs runtime-backed detail with a shared phase29 boundary summary so users can see the current layer, blockers, focused-slot scope, simulated bridge linkage, window posture, and future executor requirements in one place.",
    sections: [
      {
        id: "skills-skill",
        label: "Skills",
        description: "Reusable procedural capabilities available to the Studio operator.",
        items: [
          {
            id: "skill-openai-docs",
            name: "openai-docs",
            surface: "Docs lookup",
            status: "Ready",
            source: "mock",
            detail: "Official docs guidance can be surfaced here when docs workflows are connected.",
            tone: "positive"
          },
          {
            id: "skill-plugin-creator",
            name: "plugin-creator",
            surface: "Scaffolding",
            status: "Indexed",
            source: "mock",
            detail: "Useful for local plugin creation flows once tool actions are exposed.",
            tone: "neutral"
          }
        ]
      },
      {
        id: "skills-tools",
        label: "Tools",
        description: "Shell-facing execution surfaces and runtime helpers.",
        items: [
          {
            id: "tool-ipc",
            name: "Typed IPC bridge",
            surface: "Bridge",
            status: "Operational",
            source: "bridge",
            detail: "Preload exposes the typed renderer API and mock runtime handlers.",
            tone: "positive"
          },
          {
            id: "tool-smoke",
            name: "Offline smoke",
            surface: "Validation",
            status: "Operational",
            source: "runtime",
            detail: "Confirms built artifacts without requiring Electron GUI launch in this sandbox.",
            tone: "positive"
          }
        ]
      },
      {
        id: "skills-mcp",
        label: "MCP",
        description: "External connector surfaces remain intentionally shallow in the alpha shell.",
        items: [
          {
            id: "mcp-runtime",
            name: "Runtime connector lane",
            surface: "MCP",
            status: "Planned",
            source: "mock",
            detail: "Reserved for future connector visibility after the live bridge is stable.",
            tone: "warning"
          }
        ]
      }
    ]
  },
  settings: {
    summary:
      "Settings stay read-only in the alpha shell, while the boundary contract now makes policy, approval, executor requirements, layout persistence, and multi-window readiness explicit.",
    sections: [
      {
        id: "settings-workspace",
        title: "Workspace",
        description: "Current shell and repo context.",
        items: [
          {
            id: "settings-root",
            label: "Workspace root",
            value: "openclaw-studio",
            detail: "Renderer, bridge, and shared contracts live in the monorepo.",
            tone: "neutral"
          },
          {
            id: "settings-version",
            label: "Alpha version",
            value: "0.1.0-alpha",
            detail: "Documentation and validation now match the current scaffold.",
            tone: "positive"
          }
        ]
      },
      {
        id: "settings-runtime",
        title: "Runtime",
        description: "Shell mode and integration posture.",
        items: [
          {
            id: "settings-bridge",
            label: "Bridge mode",
            value: "Mock",
            detail: "Can shift between mock and hybrid probes without ever enabling real host-side mutation in this phase.",
            tone: "warning"
          },
          {
            id: "settings-fallback",
            label: "Fallback policy",
            value: "Renderer-safe",
            detail: "Renderer keeps rendering if runtime access is unavailable.",
            tone: "positive"
          }
        ]
      },
      {
        id: "settings-safety",
        title: "Safety",
        description: "Execution boundaries for the alpha shell.",
        items: [
          {
            id: "settings-scope",
            label: "Runtime scope",
            value: "Local-only",
            detail: "Runtime-backed detail, dry-runs, and Studio-local execution are allowed; host-side writes and process control remain blocked.",
            tone: "positive"
          },
          {
            id: "settings-advanced",
            label: "Product foundations",
            value: "Phase45 active",
            detail:
              "Attestation apply execution packets, promotion operator handoff rails, rollback live-readiness contracts, release approval workflow, and promotion gating are active, but they remain local-only and non-executing.",
            tone: "positive"
          }
        ]
      }
    ]
  },
  inspector: {
    title: "Inspector",
    summary:
      "Boundary policy, active flow state, route-aware command detail, focused-slot posture, and window orchestration linkage stay visible here across the shell.",
    boundary: mockBoundarySummary,
    route: {
      routeId: "dashboard",
      label: "Dashboard",
      summary: "Dashboard remains the default route anchor for boundary review and orchestration feedback."
    },
    flow: {
      id: "flow-dashboard-boundary-review",
      sequenceId: "sequence-dashboard-boundary-review",
      label: "Dashboard Next Actions",
      summary: "Boundary Review Flow remains the default active flow for the right rail in the shared shell snapshot.",
      recommendedActionId: "command-open-operator-view",
      followUpActionIds: ["command-show-trace", "command-stage-inspector-window"]
    },
    linkage: {
      workflowLaneId: "lane-trace-review",
      workspaceViewId: "trace-deck",
      windowIntentId: "window-intent-trace-workspace",
      detachedPanelId: "detached-trace",
      focusedSlotId: "slot-lane-apply"
    },
    sections: [
      { id: "layer", label: "Current layer", value: "Local-only" },
      { id: "host", label: "Host state", value: "Withheld" },
      { id: "next", label: "Next layer", value: "Preview-host" },
      { id: "slot-focus", label: "Trace focus", value: "Lane apply IPC slot" },
      { id: "handler", label: "Handler state", value: "Registered / disabled" },
      { id: "validator", label: "Validator state", value: "Registered / slot-linked" },
      { id: "rollback", label: "Rollback posture", value: "Incomplete / rollback-incomplete" },
      { id: "audit", label: "Audit posture", value: "Placeholder linked" },
      { id: "blocked", label: "Blocked reasons", value: "4 active" },
      { id: "slots", label: "Future slots", value: "4 planned" }
    ],
    drilldowns: [
      {
        id: "drilldown-route-aware-detail",
        label: "Route-aware Detail",
        summary: "The inspector now calls out the exact route, command flow, and shell linkage driving the current right-rail posture.",
        lines: [
          {
            id: "drilldown-route-current",
            label: "Current route",
            value: "Dashboard",
            detail: "Dashboard remains the route anchor for boundary review and window-aware shell posture.",
            tone: "neutral"
          },
          {
            id: "drilldown-route-flow",
            label: "Current command flow",
            value: "Boundary Review Flow",
            detail: "The right rail follows the dashboard contextual flow rather than a flat boundary summary only.",
            tone: "positive"
          },
          {
            id: "drilldown-route-shell",
            label: "Shell linkage",
            value: "dashboard · inspector / windows",
            detail: "Inspector, windows tab, and dock remain synchronized with the active route.",
            tone: "neutral"
          }
        ]
      },
      {
        id: "drilldown-active-flow-insight",
        label: "Active Flow Insight",
        summary: "Focused slot, recommended action, validator posture, and follow-up path are surfaced together for the current flow.",
        lines: [
          {
            id: "drilldown-flow-slot",
            label: "Focused slot",
            value: "Lane apply IPC slot",
            detail: "Lane apply remains the highest-risk rollback-aware slot in the default shell snapshot.",
            tone: "warning"
          },
          {
            id: "drilldown-flow-recommended",
            label: "Recommended action",
            value: "Activate Trace Deck View",
            detail: "The next local-only move keeps trace posture and review orchestration in one shell board.",
            tone: "positive"
          },
          {
            id: "drilldown-flow-follow-up",
            label: "Follow-up path",
            value: "Show Focused Slot Trace -> Stage Trace Workspace Intent",
            detail: "Trace and window intent follow-ups stay linked without opening host execution.",
            tone: "neutral"
          }
        ]
      },
      {
        id: "drilldown-orchestration-state",
        label: "Orchestration State",
        summary: "Workflow lane, workspace, detached candidate, and intent focus now read like one staged coordination chain.",
        lines: [
          {
            id: "drilldown-orchestration-lane",
            label: "Workflow lane",
            value: "Trace Review Workflow",
            detail: "The shell is holding the trace review lane as the current orchestration posture.",
            tone: "positive"
          },
          {
            id: "drilldown-orchestration-workspace",
            label: "Workspace / detached candidate",
            value: "trace-deck -> detached-trace",
            detail: "Trace Deck and Detached Trace remain linked as one local detached workflow candidate.",
            tone: "positive"
          },
          {
            id: "drilldown-orchestration-intent",
            label: "Intent focus",
            value: "window-intent-trace-workspace",
            detail: "Intent focus stays local-only and keeps shell tabs synchronized for trace review.",
            tone: "warning"
          }
        ]
      }
    ]
  },
  dock: [
    {
      id: "dock-focus-slot",
      label: "Focus slot",
      value: "Lane apply IPC slot",
      detail: "Bottom dock follows the same per-slot focus as the inspector and trace roster.",
      tone: "neutral",
      slotId: "slot-lane-apply"
    },
    {
      id: "dock-focus-handler",
      label: "Handler",
      value: "Registered / disabled",
      detail: "Lane apply placeholder handler remains the focused disabled slot stub.",
      tone: "positive",
      slotId: "slot-lane-apply"
    },
    {
      id: "dock-focus-validator",
      label: "Validator",
      value: "Registered / slot-linked",
      detail: "Lane apply validator stays aligned with the focused slot payload/result contract.",
      tone: "positive",
      slotId: "slot-lane-apply"
    },
    {
      id: "dock-focus-result",
      label: "Result",
      value: "Rollback-required / rollback-host",
      detail: "The focused slot keeps its primary simulated result visible in the dock.",
      tone: "warning",
      slotId: "slot-lane-apply"
    },
    {
      id: "dock-focus-rollback",
      label: "Rollback / audit",
      value: "Incomplete / placeholder",
      detail: "Rollback disposition and audit posture stay synchronized with the current focused slot.",
      tone: "warning",
      slotId: "slot-lane-apply"
    }
  ]
};
