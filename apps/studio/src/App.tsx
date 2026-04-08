import { Suspense, lazy, useEffect, useState } from "react";
import {
  selectStudioReleaseCloseoutWindow,
  selectStudioReleaseDeliveryChainStage,
  selectStudioReleaseApprovalPipelineStage,
  selectStudioReleasePackagedAppMaterializationContractArtifactCheckpointProgression,
  selectStudioReleasePackagedAppMaterializationContractBundleSealingReadiness,
  selectStudioReleasePackagedAppMaterializationContractPlatform,
  selectStudioReleasePackagedAppMaterializationContractProgress,
  selectStudioReleasePackagedAppMaterializationContractStagedOutputChain,
  selectStudioReleasePackagedAppMaterializationContractStagedOutputStep,
  selectStudioReleasePackagedAppMaterializationContractTask,
  selectStudioReleasePackagedAppMaterializationContractValidatorObservabilitySurfaceMatch,
  selectStudioReleaseReviewerQueue,
  selectStudioWindowObservabilityActiveMapping,
  studioPageIds,
  type StudioCommandAction,
  type StudioCommandActionGroup,
  type StudioCommandCompanionPathHandoffStability,
  type StudioCommandCompanionRouteHistoryEntry,
  type StudioCommandCompanionRouteTransitionKind,
  type StudioCommandContextualFlow,
  type StudioCommandMatcher,
  type StudioCommandSequence,
  type StudioKeyboardShortcut,
  type StudioPageId,
  type StudioShellLayoutState,
  type StudioShellState,
  type StudioTone,
  type StudioWindowIntentStatus
} from "@openclaw/shared";
import { useStudioData } from "./hooks/useStudioData";
import { DashboardPage } from "./pages/DashboardPage";
import { BoundarySummaryCard } from "./components/BoundarySummaryCard";
import { HostTracePanel } from "./components/HostTracePanel";
import { OperatorReviewBoard } from "./components/OperatorReviewBoard";
import { DeliveryChainWorkspace } from "./components/DeliveryChainWorkspace";
import {
  WindowSharedStateBoard,
  resolveActiveWindowRosterEntry,
  resolveActiveWindowSharedStateLane
} from "./components/WindowSharedStateBoard";
import {
  CommandPalette,
  type CommandPaletteEntry,
  type CommandPaletteEntryDetailLine,
  type CommandPaletteSection,
  type CommandPaletteShortcutHint
} from "./components/CommandPalette";
import {
  ContextualCommandPanel,
  type ContextualCommandActionDeckLaneItem,
  type ContextualCommandCompanionRouteHistoryItem,
  type ContextualCommandCompanionRouteStateItem,
  type ContextualCommandCompanionSequenceItem,
  type ContextualCommandCompanionSequenceStepItem,
  type ContextualCommandCompanionReviewPathItem,
  type ContextualCommandMultiWindowCoverageItem,
  type ContextualCommandPanelProps,
  type ContextualCommandReviewSurfaceItem,
  type ContextualCommandStateLine,
  type ContextualCommandStep
} from "./components/ContextualCommandPanel";
import { createDockItems, createInspectorSections, getDefaultTraceFocusSlotId, resolveHostTraceFocus } from "./components/host-trace-state";
import { readPersistedFocusedSlotId, resolvePersistedFocusedSlotId, writePersistedFocusedSlotId } from "./components/focused-slot-persistence";
import {
  areShellLayoutStatesEqual,
  resolvePersistedShellLayoutState,
  writePersistedShellLayoutState
} from "./components/shell-layout-persistence";
import {
  createEmptyReviewCoverageSelectionMemory,
  readPersistedCompanionRouteMemory,
  writePersistedCompanionRouteMemory,
  type CompanionRouteHistoryMemoryEntry,
  type CompanionRouteMemoryState,
  type ReviewCoverageSelectionMemory
} from "./components/companion-route-history-persistence";
import { resolveCompanionRouteContext, type ReviewCoverageAction } from "./reviewCoverageRouteState";

const LazyHomePage = lazy(async () => {
  const { HomePage } = await import("./pages/HomePage");
  return { default: HomePage };
});

const LazySessionsPage = lazy(async () => {
  const { SessionsPage } = await import("./pages/SessionsPage");
  return { default: SessionsPage };
});

const LazyAgentsPage = lazy(async () => {
  const { AgentsPage } = await import("./pages/AgentsPage");
  return { default: AgentsPage };
});

const LazyCodexPage = lazy(async () => {
  const { CodexPage } = await import("./pages/CodexPage");
  return { default: CodexPage };
});

const LazySkillsPage = lazy(async () => {
  const { SkillsPage } = await import("./pages/SkillsPage");
  return { default: SkillsPage };
});

const LazySettingsPage = lazy(async () => {
  const { SettingsPage } = await import("./pages/SettingsPage");
  return { default: SettingsPage };
});

function resolvePage(): StudioPageId {
  const route = window.location.hash.replace("#", "");

  if (studioPageIds.includes(route as StudioPageId)) {
    return route as StudioPageId;
  }

  return "sessions";
}

function navigateToPage(pageId: StudioPageId) {
  window.location.hash = `#${pageId}`;
}

const PRIMARY_PAGE_IDS = new Set<StudioPageId>(["dashboard", "home", "sessions", "settings"]);
const PAGE_LABEL_ZH: Partial<Record<StudioPageId, string>> = {
  dashboard: "总览",
  home: "主页",
  sessions: "会话",
  agents: "代理",
  codex: "Codex",
  skills: "技能",
  settings: "设置"
};
const PAGE_HINT_ZH: Partial<Record<StudioPageId, string>> = {
  dashboard: "关键状态与摘要",
  home: "核心工作入口",
  sessions: "会话与任务进展",
  agents: "代理与能力",
  codex: "Codex 执行与日志",
  skills: "技能管理",
  settings: "偏好与配置"
};

function getZhPageLabel(pageId: StudioPageId, fallbackLabel: string): string {
  return PAGE_LABEL_ZH[pageId] ?? fallbackLabel;
}

function getZhPageHint(pageId: StudioPageId, fallbackHint: string): string {
  return PAGE_HINT_ZH[pageId] ?? fallbackHint;
}

function getZhStatusValue(value: string): string {
  const normalized = value.trim().toLowerCase();
  const map: Record<string, string> = {
    ready: "就绪",
    disabled: "禁用",
    hybrid: "混合",
    unavailable: "不可用",
    hidden: "隐藏",
    configured: "已配置",
    observed: "已发现",
    sparse: "稀疏",
    detected: "已检测",
    planned: "计划中",
    fallback: "回退",
    operational: "可用",
    indexed: "已索引",
    installed: "已安装",
    system: "系统",
    extension: "扩展",
    placeholder: "占位",
    active: "活动",
    available: "可用",
    blocked: "阻塞",
    completed: "已完成",
    mapped: "已映射",
    accepted: "已接受",
    watch: "观察",
    idle: "空闲",
    applied: "已应用",
    settled: "已结算",
    armed: "已就位",
    future: "未来",
    "anchored shell": "锚定主壳",
    "detached local": "本地分离",
    "detached candidate": "分离候选",
    "intent focused": "意图聚焦",
    "focused locally": "本地聚焦",
    "staged locally": "本地暂存",
    "ready for staging": "可暂存",
    "no intent": "无意图",
    "no workflow lane": "无流程通道",
    "local-only": "仅本地"
  };
  return map[normalized] ?? value;
}

function getZhRightRailTabLabel(tabId: StudioShellLayoutState["rightRailTabId"], fallbackLabel: string): string {
  const map: Record<StudioShellLayoutState["rightRailTabId"], string> = {
    inspector: "检查",
    trace: "追踪",
    windows: "窗口"
  };
  return map[tabId] ?? fallbackLabel;
}

function getZhBottomDockTabLabel(tabId: StudioShellLayoutState["bottomDockTabId"], fallbackLabel: string): string {
  const map: Record<StudioShellLayoutState["bottomDockTabId"], string> = {
    focus: "焦点",
    activity: "活动",
    windows: "窗口"
  };
  return map[tabId] ?? fallbackLabel;
}

function dedupeCommandActions(actions: Array<StudioCommandAction | undefined>): StudioCommandAction[] {
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

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  return items.filter((item, index, entries) => entries.findIndex((entry) => entry.id === item.id) === index);
}

function isReviewCoverageAction(
  action: StudioCommandAction | undefined
): action is StudioCommandAction & {
  kind: "focus-review-coverage";
} {
  return Boolean(action && action.kind === "focus-review-coverage");
}

function formatReviewSurfaceKind(kind: StudioCommandAction["reviewSurfaceKind"]): string {
  switch (kind) {
    case "review-packet":
      return "Review packet";
    case "artifact-progression":
      return "Artifact progression";
    case "validator-bridge":
      return "Validator bridge";
    case "failure-path":
      return "Failure path";
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
  kind: NonNullable<StudioShellState["commandSurface"]["actionDecks"][number]["lanes"][number]["companionReviewPaths"]>[number]["kind"]
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
  role: NonNullable<StudioShellState["commandSurface"]["actionDecks"][number]["lanes"][number]["companionSequences"]>[number]["steps"][number]["role"]
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
  posture: NonNullable<StudioShellState["commandSurface"]["actionDecks"][number]["lanes"][number]["companionRouteStates"]>[number]["posture"]
): string {
  return posture === "active-route" ? "Active route" : "Alternate route";
}

function formatCompanionRouteSequenceSwitchPosture(
  posture: NonNullable<
    NonNullable<StudioShellState["commandSurface"]["actionDecks"][number]["lanes"][number]["companionRouteStates"]>[number]["sequenceSwitches"][number]["posture"]
  >
): string {
  return posture === "active-sequence" ? "Active sequence" : "Switchable sequence";
}

function formatCompanionRouteTransitionKind(kind: StudioCommandCompanionRouteTransitionKind): string {
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

function formatCompanionPathHandoffStability(stability: StudioCommandCompanionPathHandoffStability): string {
  switch (stability) {
    case "stable":
      return "Stable";
    case "restored":
      return "Restored";
    default:
      return "Watch";
  }
}

function formatReplayReviewerSignoffStateLabel(state: "ready" | "watch" | "blocked" | undefined): string {
  switch (state) {
    case "ready":
      return "Verdict settled";
    case "blocked":
      return "Verdict blocked";
    case "watch":
      return "Verdict in review";
    default:
      return "No verdict";
  }
}

function resolveReviewSurfaceRouteLabel(
  action: StudioCommandAction | null | undefined,
  windowing: StudioShellState["windowing"]
): string {
  const linkedIntent = action?.windowIntentId ? windowing.windowIntents.find((entry) => entry.id === action.windowIntentId) ?? null : null;
  const routeId = linkedIntent?.shellLink.pageId ?? action?.routeId ?? "No route";
  const workspaceViewId = linkedIntent?.workspaceViewId ?? action?.workspaceViewId ?? "No workspace";
  const intentLabel = linkedIntent?.label ?? action?.windowIntentId ?? "No intent";

  return `${routeId} / ${workspaceViewId} / ${intentLabel}`;
}

function resolveReleaseBridgeValue(stageId: string | null | undefined): string | null {
  switch (stageId) {
    case "delivery-chain-promotion-readiness":
      return "Packaged-app continuity / validator bridge / bundle sealing";
    case "delivery-chain-publish-decision":
      return "Installer-signing QA closeout / blocked publish gate";
    case "delivery-chain-rollback-readiness":
      return "Approval-audit-rollback Stage C entry / non-executing";
    case "delivery-chain-operator-review":
      return "Release QA closeout / reviewer evidence sealing";
    default:
      return null;
  }
}

function matchesCommandMatcher(matcher: StudioCommandMatcher | undefined, context: CommandContextState): boolean {
  if (!matcher) {
    return true;
  }

  const checks: Array<[string[] | undefined, string | undefined]> = [
    [matcher.routeIds, context.routeId],
    [matcher.workflowLaneIds, context.workflowLaneId],
    [matcher.slotIds, context.slotId],
    [matcher.workspaceViewIds, context.workspaceViewId],
    [matcher.windowIntentIds, context.windowIntentId]
  ];

  return checks.every(([acceptedValues, currentValue]) => !acceptedValues?.length || (currentValue ? acceptedValues.includes(currentValue) : false));
}

function scoreCommandMatcher(matcher: StudioCommandMatcher | undefined, context: CommandContextState): number {
  if (!matcher) {
    return 0;
  }

  if (!matchesCommandMatcher(matcher, context)) {
    return -1;
  }

  let score = 0;

  if (matcher.routeIds?.includes(context.routeId)) {
    score += 8;
  }

  if (context.workflowLaneId && matcher.workflowLaneIds?.includes(context.workflowLaneId)) {
    score += 6;
  }

  if (context.slotId && matcher.slotIds?.includes(context.slotId)) {
    score += 5;
  }

  if (context.workspaceViewId && matcher.workspaceViewIds?.includes(context.workspaceViewId)) {
    score += 4;
  }

  if (context.windowIntentId && matcher.windowIntentIds?.includes(context.windowIntentId)) {
    score += 3;
  }

  return score;
}

interface ActionDeckLaneContext {
  workspaceViewId?: StudioShellLayoutState["workspaceViewId"];
  windowIntentId?: string;
  deliveryStageId?: string | null;
  windowId?: string | null;
  sharedStateLaneId?: string | null;
  orchestrationBoardId?: string | null;
  observabilityMappingId?: string | null;
  reviewSurfaceActionId?: string | null;
}

function scoreActionDeckLane(
  lane: StudioShellState["commandSurface"]["actionDecks"][number]["lanes"][number],
  context: ActionDeckLaneContext
): number {
  let score = 0;

  if (context.workspaceViewId && lane.workspaceViewIds?.includes(context.workspaceViewId)) {
    score += 4;
  }

  if (context.windowIntentId && lane.windowIntentIds?.includes(context.windowIntentId)) {
    score += 3;
  }

  if (context.deliveryStageId) {
    if (lane.focusDeliveryChainStageId === context.deliveryStageId) {
      score += 10;
    } else if (lane.deliveryChainStageIds?.includes(context.deliveryStageId)) {
      score += 6;
    }
  }

  if (context.windowId) {
    if (lane.focusWindowId === context.windowId) {
      score += 8;
    } else if (lane.windowIds?.includes(context.windowId)) {
      score += 4;
    }
  }

  if (context.sharedStateLaneId) {
    if (lane.focusSharedStateLaneId === context.sharedStateLaneId) {
      score += 8;
    } else if (lane.sharedStateLaneIds?.includes(context.sharedStateLaneId)) {
      score += 4;
    }
  }

  if (context.orchestrationBoardId) {
    if (lane.focusOrchestrationBoardId === context.orchestrationBoardId) {
      score += 8;
    } else if (lane.orchestrationBoardIds?.includes(context.orchestrationBoardId)) {
      score += 4;
    }
  }

  if (context.observabilityMappingId) {
    if (lane.focusObservabilityMappingId === context.observabilityMappingId) {
      score += 8;
    } else if (lane.observabilityMappingIds?.includes(context.observabilityMappingId)) {
      score += 4;
    }
  }

  if (context.reviewSurfaceActionId) {
    const reviewSurfaceActionIds = lane.actionIds.filter((actionId) => actionId === context.reviewSurfaceActionId);

    if (reviewSurfaceActionIds.length > 0) {
      score += lane.primaryActionId === context.reviewSurfaceActionId ? 12 : 6;
    }
  }

  return score;
}

function matchesKeyboardShortcut(shortcut: StudioKeyboardShortcut, event: KeyboardEvent): boolean {
  if (shortcut.key.toLowerCase() !== event.key.toLowerCase()) {
    return false;
  }

  if (Boolean(shortcut.altKey) !== event.altKey) {
    return false;
  }

  if (Boolean(shortcut.shiftKey) !== event.shiftKey) {
    return false;
  }

  const metaOrCtrlPressed = event.metaKey || event.ctrlKey;

  if (Boolean(shortcut.metaOrCtrl) !== metaOrCtrlPressed) {
    return false;
  }

  if (!shortcut.metaOrCtrl && metaOrCtrlPressed) {
    return false;
  }

  return true;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select" || target.isContentEditable;
}

interface AppFocusedSlotProps {
  focusedSlotId: string | null;
  onFocusedSlotChange: (slotId: string) => void;
}

interface AppWindowingSurfaceProps {
  activeRouteId: StudioPageId;
  activeWindowId: string | null;
  activeLaneId: string | null;
  activeBoardId: string | null;
  activeMappingId: string | null;
}

interface CommandContextState {
  routeId: StudioPageId;
  workflowLaneId?: string;
  slotId?: string;
  workspaceViewId?: StudioShellLayoutState["workspaceViewId"];
  windowIntentId?: string;
}

interface CommandLogEntry {
  id: string;
  label: string;
  detail: string;
  safety: StudioCommandAction["safety"];
  timestamp: string;
}

type WindowIntentStateMap = Record<string, StudioWindowIntentStatus>;
type LocalWindowIntent = StudioShellState["windowing"]["windowIntents"][number] & {
  localStatus: StudioWindowIntentStatus;
};
type CommandActionDeck = StudioShellState["commandSurface"]["actionDecks"][number];
type WindowWorkflowLane = StudioShellState["windowing"]["workflow"]["lanes"][number];
type WindowWorkflowStep = StudioShellState["windowing"]["workflow"]["steps"][number];
type WorkflowStepState = "available" | "entered" | "surfaced" | "staged" | "focused";

interface WorkflowStepCard {
  step: WindowWorkflowStep;
  state: WorkflowStepState;
  statusLabel: string;
  actionLabel: string;
  activate: () => void;
}

interface InsightLine {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: StudioTone;
}

interface InsightCard {
  id: string;
  label: string;
  summary: string;
  lines: InsightLine[];
}

interface ActivityInput {
  label: string;
  detail: string;
  safety: StudioCommandAction["safety"];
}

interface CommandSequenceProgress {
  recommendedAction: StudioCommandAction | null;
  steps: ContextualCommandStep[];
}

type ReviewCoverageSelection = ReviewCoverageSelectionMemory;

function createInitialCompanionRouteMemory(): CompanionRouteMemoryState {
  return (
    readPersistedCompanionRouteMemory() ?? {
      selection: createEmptyReviewCoverageSelectionMemory(),
      entries: []
    }
  );
}

function hasReviewCoverageSelection(selection: ReviewCoverageSelection | null | undefined): boolean {
  return Boolean(
    selection &&
      (selection.actionDeckLaneId ||
        selection.reviewSurfaceActionId ||
        selection.companionRouteStateId ||
        selection.companionSequenceId ||
        selection.deliveryStageId)
  );
}

function areReviewCoverageSelectionsEqual(left: ReviewCoverageSelection | null | undefined, right: ReviewCoverageSelection | null | undefined): boolean {
  if (!left || !right) {
    return left === right;
  }

  return (
    left.actionDeckLaneId === right.actionDeckLaneId &&
    left.companionRouteStateId === right.companionRouteStateId &&
    left.companionSequenceId === right.companionSequenceId &&
    left.companionRouteHistoryEntryId === right.companionRouteHistoryEntryId &&
    left.companionPathHandoffId === right.companionPathHandoffId &&
    left.reviewSurfaceActionId === right.reviewSurfaceActionId &&
    left.deliveryStageId === right.deliveryStageId &&
    left.windowId === right.windowId &&
    left.sharedStateLaneId === right.sharedStateLaneId &&
    left.orchestrationBoardId === right.orchestrationBoardId &&
    left.observabilityMappingId === right.observabilityMappingId
  );
}

function formatRecordedAt(recordedAt: string): string {
  const timestamp = new Date(recordedAt);

  if (Number.isNaN(timestamp.valueOf())) {
    return "Stored handoff";
  }

  return timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function resolveCompanionRouteTransitionKind(
  previousSelection: ReviewCoverageSelection | null | undefined,
  nextSelection: ReviewCoverageSelection,
  fallback: StudioCommandCompanionRouteTransitionKind = "activate-route"
): StudioCommandCompanionRouteTransitionKind {
  if (fallback !== "activate-route") {
    return fallback;
  }

  if (nextSelection.companionPathHandoffId && previousSelection?.companionPathHandoffId !== nextSelection.companionPathHandoffId) {
    return "stabilize-handoff";
  }

  if (
    previousSelection?.actionDeckLaneId === nextSelection.actionDeckLaneId &&
    previousSelection?.companionSequenceId &&
    nextSelection.companionSequenceId &&
    previousSelection.companionSequenceId !== nextSelection.companionSequenceId
  ) {
    return "switch-sequence";
  }

  if (
    previousSelection?.actionDeckLaneId === nextSelection.actionDeckLaneId &&
    previousSelection?.reviewSurfaceActionId === nextSelection.reviewSurfaceActionId &&
    previousSelection?.companionRouteStateId === nextSelection.companionRouteStateId
  ) {
    return "resume-history";
  }

  return "activate-route";
}

function createWindowIntentStateMap(
  windowing: StudioShellState["windowing"],
  preferred?: WindowIntentStateMap | null
): WindowIntentStateMap {
  const next: WindowIntentStateMap = {};

  for (const intent of windowing.windowIntents) {
    next[intent.id] = preferred?.[intent.id] ?? intent.status;
  }

  return next;
}

function areWindowIntentStateMapsEqual(left: WindowIntentStateMap, right: WindowIntentStateMap): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => left[key] === right[key]);
}

function formatDetachState(state: StudioShellState["windowing"]["views"][number]["detachState"]): string {
  switch (state) {
    case "anchored":
      return "锚定";
    case "candidate":
      return "候选";
    default:
      return "本地分离";
  }
}

function formatIntentStatus(status: StudioWindowIntentStatus): string {
  switch (status) {
    case "ready":
      return "就绪";
    case "staged":
      return "已暂存";
    default:
      return "已聚焦";
  }
}

function formatIntentFocus(focus: StudioShellState["windowing"]["windowIntents"][number]["focus"]): string {
  return focus === "primary" ? "主焦点" : "次焦点";
}

function formatWorkflowPosture(posture: StudioShellState["windowing"]["workflow"]["lanes"][number]["posture"]): string {
  switch (posture) {
    case "review":
      return "审查";
    case "trace":
      return "追踪";
    default:
      return "预览";
  }
}

function formatPackagedAppPlatform(
  platform: StudioShellState["boundary"]["hostExecutor"]["releaseApprovalPipeline"]["deliveryChain"]["packagedAppMaterializationContract"]["platforms"][number]["platform"]
): string {
  switch (platform) {
    case "windows":
      return "Windows";
    case "macos":
      return "macOS";
    default:
      return "Linux";
  }
}

function formatMaterializationTaskState(
  state: StudioShellState["boundary"]["hostExecutor"]["releaseApprovalPipeline"]["deliveryChain"]["packagedAppMaterializationContract"]["platforms"][number]["taskState"]
): string {
  switch (state) {
    case "review-ready":
      return "待审";
    case "reviewing":
      return "审查中";
    default:
      return "阻塞";
  }
}

function formatMaterializationValidatorStatus(status: "ready" | "watch" | "blocked"): string {
  switch (status) {
    case "ready":
      return "就绪";
    case "watch":
      return "观察";
    default:
      return "阻塞";
  }
}

function formatFailureDisposition(disposition: "blocked" | "abort" | "partial-apply" | "rollback"): string {
  switch (disposition) {
    case "blocked":
      return "阻塞";
    case "abort":
      return "中止";
    case "partial-apply":
      return "部分应用";
    default:
      return "回滚";
  }
}

function formatReviewPostureRelationship(
  relationship: StudioShellState["windowing"]["observability"]["mappings"][number]["relationship"]
): string {
  switch (relationship) {
    case "owns-current-posture":
      return "当前姿态主控";
    case "mirrors-current-posture":
      return "当前姿态镜像";
    case "staged-for-handoff":
      return "待交接";
    case "blocked-upstream":
      return "上游阻塞";
    case "escalation-shadow":
      return "升级影子链";
    default:
      return "决策门阻塞";
  }
}

type ArtifactCheckpointProgression = ReturnType<
  typeof selectStudioReleasePackagedAppMaterializationContractArtifactCheckpointProgression
>;
type ArtifactCheckpointProgressionSurface = ArtifactCheckpointProgression["currentSurface"];

function formatArtifactCheckpointProgressionPath(progression: ArtifactCheckpointProgression | null): string {
  if (!progression) {
    return "Unavailable";
  }

  const labels = [
    progression.currentHandoff?.label ?? progression.currentSurface.artifactLedger?.label ?? null,
    progression.currentSurface.bundleSealingCheckpoint?.label ?? progression.currentStagedOutputStep?.label ?? null,
    progression.currentReviewPacketStep?.label ?? null,
    progression.currentValidatorReadout?.label ?? null,
    progression.currentFailureReadout?.label ?? null,
    progression.currentSurface.stageCCheckpoint?.label ?? null
  ].filter((label): label is string => Boolean(label));

  return labels.join(" -> ") || "Unavailable";
}

function formatArtifactCurrentToNextLabel(currentLabel: string | null, nextLabel: string | null, terminalLabel: string): string {
  if (currentLabel && nextLabel) {
    return `${currentLabel} -> ${nextLabel}`;
  }

  if (currentLabel) {
    return `${currentLabel} -> ${terminalLabel}`;
  }

  if (nextLabel) {
    return `Up next ${nextLabel}`;
  }

  return terminalLabel;
}

function formatArtifactCurrentToNextSummary(progression: ArtifactCheckpointProgression | null): string {
  if (!progression) {
    return "No artifact checkpoint progression is available.";
  }

  const segments = [
    progression.currentStagedOutputStep
      ? `Staged output ${formatArtifactCurrentToNextLabel(
          progression.currentStagedOutputStep.label,
          progression.nextStagedOutputStep?.label ?? null,
          "Final staged step"
        )}`
      : progression.nextStagedOutputStep
        ? `Staged output up next ${progression.nextStagedOutputStep.label}`
        : null,
    progression.currentReviewPacketStep
      ? `Review packet ${formatArtifactCurrentToNextLabel(
          progression.currentReviewPacketStep.label,
          progression.nextReviewPacketStep?.label ?? null,
          "Final review handoff"
        )}`
      : progression.nextReviewPacketStep
        ? `Review packet up next ${progression.nextReviewPacketStep.label}`
        : null,
    progression.currentValidatorReadout
      ? `Validator ${formatArtifactCurrentToNextLabel(
          progression.currentValidatorReadout.label,
          progression.nextValidatorReadout?.label ?? null,
          "Final validator checkpoint"
        )}`
      : progression.nextValidatorReadout
        ? `Validator up next ${progression.nextValidatorReadout.label}`
        : null,
    progression.currentFailureReadout
      ? `Failure ${formatArtifactCurrentToNextLabel(
          progression.currentFailureReadout.label,
          progression.nextFailureReadout?.label ?? null,
          "Final failure branch"
        )}`
      : progression.nextFailureReadout
        ? `Failure up next ${progression.nextFailureReadout.label}`
        : null
  ].filter((segment): segment is string => Boolean(segment));

  return segments.join(" / ") || "No downstream current-to-next continuity is linked to the active handoff.";
}

function formatArtifactSurfaceDescriptor(surface: ArtifactCheckpointProgressionSurface | null): string {
  if (!surface) {
    return "No observability path";
  }

  return surface.observabilityMapping
    ? `${surface.observabilityMapping.label} / ${formatReviewPostureRelationship(surface.observabilityMapping.relationship)}`
    : surface.activeHandoff?.observabilityMappingId ?? "No observability path";
}

function formatArtifactSurfaceContinuity(surface: ArtifactCheckpointProgressionSurface | null): string {
  if (!surface) {
    return "No continuity surface";
  }

  return (
    surface.reviewStateContinuityEntry?.label ??
    (surface.activeHandoff
      ? `${surface.window?.label ?? surface.activeHandoff.windowId} / ${surface.lane?.label ?? surface.activeHandoff.sharedStateLaneId}`
      : "No continuity surface")
  );
}

function formatArtifactSurfaceSpine(surface: ArtifactCheckpointProgressionSurface | null): string {
  if (!surface?.activeHandoff) {
    return "No window / lane / board";
  }

  return `${surface.window?.label ?? surface.activeHandoff.windowId} -> ${
    surface.lane?.label ?? surface.activeHandoff.sharedStateLaneId
  } -> ${surface.board?.label ?? surface.activeHandoff.orchestrationBoardId}`;
}

function formatWorkflowStepKind(kind: WindowWorkflowStep["kind"]): string {
  switch (kind) {
    case "workspace-entry":
      return "Workspace Entry";
    case "detached-panel":
      return "Detached Candidate";
    default:
      return "Work Posture";
  }
}

function getWorkflowStateTone(state: WorkflowStepState): "positive" | "warning" | "neutral" {
  switch (state) {
    case "entered":
    case "surfaced":
    case "focused":
      return "positive";
    case "staged":
      return "warning";
    default:
      return "neutral";
  }
}

function renderPage(
  activePage: StudioPageId,
  data: StudioShellState,
  focusedSlot: AppFocusedSlotProps,
  commandPanel: ContextualCommandPanelProps,
  windowingSurface: AppWindowingSurfaceProps
) {
  switch (activePage) {
    case "dashboard":
      return (
        <DashboardPage
          dashboard={data.dashboard}
          boundary={data.boundary}
          windowing={data.windowing}
          status={data.status}
          focusedSlotId={focusedSlot.focusedSlotId}
          onFocusedSlotChange={focusedSlot.onFocusedSlotChange}
          commandPanel={commandPanel}
          windowingSurface={windowingSurface}
        />
      );
    case "home":
      return (
        <LazyHomePage
          state={data}
          focusedSlotId={focusedSlot.focusedSlotId}
          onFocusedSlotChange={focusedSlot.onFocusedSlotChange}
          commandPanel={commandPanel}
          windowingSurface={windowingSurface}
        />
      );
    case "sessions":
      return <LazySessionsPage sessions={data.sessions} />;
    case "agents":
      return <LazyAgentsPage agents={data.agents} />;
    case "codex":
      return (
        <LazyCodexPage
          summary={data.codex.summary}
          stats={data.codex.stats}
          tasks={data.codex.tasks}
          observations={data.codex.observations}
          loopSummary={data.codex.loopSummary}
          loopStats={data.codex.loopStats}
          loopSignals={data.codex.loopSignals}
          contextSummary={data.codex.contextSummary}
          contextNotes={data.codex.contextNotes}
        />
      );
    case "skills":
      return (
        <LazySkillsPage
          skills={data.skills}
          boundary={data.boundary}
          focusedSlotId={focusedSlot.focusedSlotId}
          onFocusedSlotChange={focusedSlot.onFocusedSlotChange}
          commandPanel={commandPanel}
        />
      );
    case "settings":
      return (
        <LazySettingsPage
          settings={data.settings}
          windowing={data.windowing}
          releaseApprovalPipeline={data.boundary.hostExecutor.releaseApprovalPipeline}
          windowingSurface={windowingSurface}
        />
      );
  }
}

function PageLoadingState() {
  return (
    <section className="page">
      <article className="surface card">
        <div className="card-header card-header--stack">
          <div>
            <p className="eyebrow">页面切换</p>
            <h2>页面加载中</h2>
          </div>
          <p>正在把所选页面载入当前本地预览工作台。</p>
        </div>
      </article>
    </section>
  );
}

export function App() {
  const { data, error } = useStudioData();
  const [activePage, setActivePage] = useState<StudioPageId>(() => resolvePage());
  const [paletteReturnFocus, setPaletteReturnFocus] = useState<HTMLElement | null>(null);
  const [focusedSlotId, setFocusedSlotId] = useState<string | null>(() => readPersistedFocusedSlotId());
  const [layoutState, setLayoutState] = useState<StudioShellLayoutState | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [selectedWindowIntentId, setSelectedWindowIntentId] = useState<string | null>(null);
  const [selectedDetachedPanelId, setSelectedDetachedPanelId] = useState<string | null>(null);
  const [windowIntentStates, setWindowIntentStates] = useState<WindowIntentStateMap>({});
  const [commandLog, setCommandLog] = useState<CommandLogEntry[]>([]);
  const [selectedPaletteEntryId, setSelectedPaletteEntryId] = useState<string | null>(null);
  const [showAllPages, setShowAllPages] = useState(false);
  const [userVisibilityOverrides, setUserVisibilityOverrides] = useState<{
    rightRailVisible: boolean | null;
    bottomDockVisible: boolean | null;
  }>({
    rightRailVisible: null,
    bottomDockVisible: null
  });
  const [companionRouteMemory, setCompanionRouteMemory] = useState<CompanionRouteMemoryState>(createInitialCompanionRouteMemory);
  const reviewCoverageSelection = companionRouteMemory.selection;
  const companionRouteHistory = companionRouteMemory.entries;

  useEffect(() => {
    const syncRoute = () => {
      setActivePage(resolvePage());
    };

    window.addEventListener("hashchange", syncRoute);
    syncRoute();

    return () => {
      window.removeEventListener("hashchange", syncRoute);
    };
  }, []);

  useEffect(() => {
    if (!data) {
      return;
    }

    const nextFocusedSlotId = resolvePersistedFocusedSlotId(data.boundary.hostExecutor, focusedSlotId);

    if (nextFocusedSlotId !== focusedSlotId) {
      setFocusedSlotId(nextFocusedSlotId);
      return;
    }

    writePersistedFocusedSlotId(nextFocusedSlotId);
  }, [data, focusedSlotId]);

  useEffect(() => {
    if (!data) {
      return;
    }

    setLayoutState((currentState) => {
      const nextState = resolvePersistedShellLayoutState(data, currentState);
      return areShellLayoutStatesEqual(currentState, nextState) ? currentState ?? nextState : nextState;
    });
  }, [data]);

  useEffect(() => {
    if (!data || !layoutState) {
      return;
    }

    writePersistedShellLayoutState(data, layoutState);
  }, [data, layoutState]);

  useEffect(() => {
    writePersistedCompanionRouteMemory(companionRouteMemory);
  }, [companionRouteMemory]);

  useEffect(() => {
    if (!data) {
      return;
    }

    const nextStates = createWindowIntentStateMap(data.windowing, windowIntentStates);

    if (!areWindowIntentStateMapsEqual(windowIntentStates, nextStates)) {
      setWindowIntentStates(nextStates);
    }
  }, [data, windowIntentStates]);

  useEffect(() => {
    if (!data) {
      return;
    }

    const defaultIntentId = data.windowing.posture.focusedIntentId ?? data.windowing.windowIntents[0]?.id ?? null;
    const nextIntentId =
      selectedWindowIntentId && data.windowing.windowIntents.some((intent) => intent.id === selectedWindowIntentId)
        ? selectedWindowIntentId
        : defaultIntentId;

    if (nextIntentId !== selectedWindowIntentId) {
      setSelectedWindowIntentId(nextIntentId);
    }
  }, [data, selectedWindowIntentId]);

  useEffect(() => {
    if (!data) {
      return;
    }

    const applyResponsiveLayout = () => {
      const shouldCompact = window.innerWidth < 1720;
      const shouldHideRightRail = window.innerWidth < 1700;
      const shouldHideBottomDock = window.innerWidth < 1500 || window.innerHeight < 920;

      setLayoutState((currentState) => {
        const baseState = resolvePersistedShellLayoutState(data, currentState);
        const nextState: StudioShellLayoutState = {
          ...baseState,
          compactMode: shouldCompact ? true : baseState.compactMode,
          rightRailVisible: shouldHideRightRail
            ? (userVisibilityOverrides.rightRailVisible ?? false)
            : (userVisibilityOverrides.rightRailVisible ?? baseState.rightRailVisible),
          bottomDockVisible: shouldHideBottomDock
            ? (userVisibilityOverrides.bottomDockVisible ?? false)
            : (userVisibilityOverrides.bottomDockVisible ?? baseState.bottomDockVisible)
        };

        if (areShellLayoutStatesEqual(baseState, nextState)) {
          return currentState ?? baseState;
        }

        return nextState;
      });
    };

    applyResponsiveLayout();
    window.addEventListener("resize", applyResponsiveLayout);

    return () => {
      window.removeEventListener("resize", applyResponsiveLayout);
    };
  }, [data, userVisibilityOverrides]);

  useEffect(() => {
    if (!data) {
      return;
    }

    const openPaletteShortcut =
      data.commandSurface.keyboardRouting.shortcuts.find((shortcut) => shortcut.target === "open-palette") ?? null;
    const closePaletteShortcut =
      data.commandSurface.keyboardRouting.shortcuts.find((shortcut) => shortcut.closePalette || shortcut.target === "close-palette") ?? null;

    if (!openPaletteShortcut && !closePaletteShortcut) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (openPaletteShortcut && matchesKeyboardShortcut(openPaletteShortcut, event)) {
        if (isTypingTarget(event.target) && !openPaletteShortcut.preserveFocus) {
          return;
        }

        event.preventDefault();
        setPaletteReturnFocus(document.activeElement instanceof HTMLElement ? document.activeElement : null);
        setCommandPaletteOpen(true);
        return;
      }

      if (commandPaletteOpen && closePaletteShortcut && matchesKeyboardShortcut(closePaletteShortcut, event)) {
        event.preventDefault();
        setCommandPaletteOpen(false);
        setCommandQuery("");
        paletteReturnFocus?.focus?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [data, commandPaletteOpen, paletteReturnFocus]);

  if (error) {
    return <div className="state-screen">OpenClaw Studio 数据加载失败：{error}</div>;
  }

  if (!data) {
    return <div className="state-screen">OpenClaw Studio 加载中…</div>;
  }

  const resolvedLayoutState = layoutState ?? resolvePersistedShellLayoutState(data);
  const defaultFocusedSlotId = getDefaultTraceFocusSlotId(data.boundary.hostExecutor);
  const resolvedFocusSlotId = focusedSlotId ?? defaultFocusedSlotId;
  const hostTraceFocus = resolveHostTraceFocus(data.boundary.hostExecutor, resolvedFocusSlotId);
  const releaseApprovalPipeline = data.boundary.hostExecutor.releaseApprovalPipeline;
  const currentReleaseStage = selectStudioReleaseApprovalPipelineStage(releaseApprovalPipeline);
  const currentDeliveryStage = selectStudioReleaseDeliveryChainStage(releaseApprovalPipeline, currentReleaseStage);
  const publishDeliveryStage = selectStudioReleaseDeliveryChainStage(releaseApprovalPipeline, "delivery-chain-publish-decision");
  const rollbackDeliveryStage = selectStudioReleaseDeliveryChainStage(releaseApprovalPipeline, "delivery-chain-rollback-readiness");
  const currentReviewerQueue = selectStudioReleaseReviewerQueue(releaseApprovalPipeline, currentReleaseStage);
  const currentCloseoutWindow = selectStudioReleaseCloseoutWindow(releaseApprovalPipeline, currentReleaseStage);
  const currentDecisionHandoff = releaseApprovalPipeline.decisionHandoff;
  const currentEvidenceCloseout = releaseApprovalPipeline.evidenceCloseout;
  const activeMaterializationPlatform =
    selectStudioReleasePackagedAppMaterializationContractPlatform(releaseApprovalPipeline.deliveryChain) ?? null;
  const activeMaterializationProgress =
    selectStudioReleasePackagedAppMaterializationContractProgress(releaseApprovalPipeline.deliveryChain, activeMaterializationPlatform?.id) ?? null;
  const activeStagedOutputChain =
    selectStudioReleasePackagedAppMaterializationContractStagedOutputChain(
      releaseApprovalPipeline.deliveryChain,
      activeMaterializationPlatform?.id
    ) ?? null;
  const activeStagedOutputStep =
    selectStudioReleasePackagedAppMaterializationContractStagedOutputStep(
      releaseApprovalPipeline.deliveryChain,
      activeMaterializationPlatform?.id
    ) ?? null;
  const activeBundleSealingReadiness =
    selectStudioReleasePackagedAppMaterializationContractBundleSealingReadiness(
      releaseApprovalPipeline.deliveryChain,
      activeMaterializationPlatform?.id
    ) ?? null;
  const activeMaterializationTask =
    selectStudioReleasePackagedAppMaterializationContractTask(releaseApprovalPipeline.deliveryChain, activeMaterializationPlatform?.id) ?? null;
  const activeMaterializationValidatorSurface =
    selectStudioReleasePackagedAppMaterializationContractValidatorObservabilitySurfaceMatch(
      releaseApprovalPipeline.deliveryChain,
      data.windowing,
      data.reviewStateContinuity,
      activeMaterializationPlatform?.id
    );
  const dockItems = createDockItems(hostTraceFocus);
  const activePageMeta = data.pages.find((page) => page.id === activePage) ?? {
    id: activePage,
    label: "Studio",
    hint: "Workspace shell"
  };
  const activePageLabel = getZhPageLabel(activePageMeta.id, activePageMeta.label);
  const activePageHint = getZhPageHint(activePageMeta.id, activePageMeta.hint);
  const latestCommandEntry = commandLog[0] ?? null;
  const primaryPages = data.pages.filter((page) => PRIMARY_PAGE_IDS.has(page.id));
  const secondaryPages = data.pages.filter((page) => !PRIMARY_PAGE_IDS.has(page.id));
  const visiblePages = showAllPages ? data.pages : primaryPages;
  const rightRailTab = data.layout.rightRailTabs.find((tab) => tab.id === resolvedLayoutState.rightRailTabId) ?? data.layout.rightRailTabs[0];
  const bottomDockTab = data.layout.bottomDockTabs.find((tab) => tab.id === resolvedLayoutState.bottomDockTabId) ?? data.layout.bottomDockTabs[0];
  const workspaceView =
    data.windowing.views.find((view) => view.id === resolvedLayoutState.workspaceViewId) ??
    data.windowing.views.find((view) => view.id === data.windowing.posture.activeWorkspaceViewId) ??
    data.windowing.views[0];
  const windowIntents: LocalWindowIntent[] = data.windowing.windowIntents.map((intent) => ({
    ...intent,
    localStatus: windowIntentStates[intent.id] ?? intent.status
  }));
  const selectedWindowIntent =
    windowIntents.find((intent) => intent.id === selectedWindowIntentId) ??
    windowIntents.find((intent) => intent.id === data.windowing.posture.focusedIntentId) ??
    windowIntents[0] ??
    null;
  const selectedDetachedPanel =
    data.windowing.detachedPanels.find((panel) => panel.id === selectedDetachedPanelId && panel.workspaceViewId === workspaceView?.id) ??
    data.windowing.detachedPanels.find((panel) => panel.id === selectedWindowIntent?.detachedPanelId) ??
    data.windowing.detachedPanels.find((panel) => panel.id === data.windowing.posture.activeDetachedPanelId) ??
    data.windowing.detachedPanels.find((panel) => panel.workspaceViewId === workspaceView?.id) ??
    data.windowing.detachedPanels[0] ??
    null;

  const resolvedWindowPosture =
    selectedWindowIntent && selectedWindowIntent.localStatus === "focused"
      ? {
          mode: "intent-focused" as const,
          label: "Intent Focused",
          summary: `${selectedWindowIntent.label} is driving ${workspaceView?.label ?? "the shell"} while ${
            selectedDetachedPanel?.label ?? "the linked detached candidate"
          } stays surfaced as a local-only workspace posture.`,
          activeWorkspaceViewId: workspaceView?.id ?? data.windowing.posture.activeWorkspaceViewId,
          focusedIntentId: selectedWindowIntent.id,
          activeDetachedPanelId: selectedDetachedPanel?.id
        }
      : workspaceView?.detachState === "candidate" ||
          workspaceView?.detachState === "detached-local" ||
          (selectedDetachedPanel ? selectedDetachedPanel.detachState !== "anchored" : false)
        ? {
            mode: "detached-candidate" as const,
            label: workspaceView?.detachState === "detached-local" ? "Detached Local" : "Detached Candidate",
            summary: `${workspaceView?.label ?? "Current workspace"} is behaving as a detached workspace candidate and keeps ${
              selectedDetachedPanel?.label ?? "its linked panel"
            } routed back into the current shell.`,
            activeWorkspaceViewId: workspaceView?.id ?? data.windowing.posture.activeWorkspaceViewId,
            focusedIntentId: selectedWindowIntent?.id,
            activeDetachedPanelId: selectedDetachedPanel?.id
          }
        : {
            mode: "anchored-shell" as const,
            label: "Anchored Shell",
            summary: `${workspaceView?.label ?? "Current workspace"} remains attached to the main shell, with detached behavior still staged locally.`,
            activeWorkspaceViewId: workspaceView?.id ?? data.windowing.posture.activeWorkspaceViewId,
            focusedIntentId: selectedWindowIntent?.id,
            activeDetachedPanelId: selectedDetachedPanel?.id
          };
  const selectedWorkflowLane =
    (selectedWindowIntent ? data.windowing.workflow.lanes.find((lane) => lane.windowIntentId === selectedWindowIntent.id) : undefined) ??
    data.windowing.workflow.lanes.find((lane) => lane.workspaceViewId === workspaceView?.id) ??
    data.windowing.workflow.lanes.find((lane) => lane.id === data.windowing.workflow.activeLaneId) ??
    data.windowing.workflow.lanes[0] ??
    null;
  const workflowWorkspace =
    (selectedWorkflowLane ? data.windowing.views.find((view) => view.id === selectedWorkflowLane.workspaceViewId) : undefined) ??
    workspaceView ??
    null;
  const workflowDetachedPanel =
    (selectedWorkflowLane ? data.windowing.detachedPanels.find((panel) => panel.id === selectedWorkflowLane.detachedPanelId) : undefined) ??
    selectedDetachedPanel ??
    null;
  const workflowIntent =
    (selectedWorkflowLane ? windowIntents.find((intent) => intent.id === selectedWorkflowLane.windowIntentId) : undefined) ??
    selectedWindowIntent ??
    null;
  const workflowSteps = selectedWorkflowLane
    ? selectedWorkflowLane.stepIds
        .map((stepId) => data.windowing.workflow.steps.find((step) => step.id === stepId))
        .filter((step): step is WindowWorkflowStep => Boolean(step))
    : [];
  const workflowReadinessTone = workflowIntent
    ? workflowIntent.localStatus === "focused"
      ? "positive"
      : workflowIntent.localStatus === "staged"
        ? "warning"
        : "neutral"
    : "neutral";
  const workflowReadinessLabel = workflowIntent
    ? workflowIntent.localStatus === "focused"
      ? "Focused locally"
      : workflowIntent.localStatus === "staged"
        ? "Staged locally"
        : "Ready for staging"
    : "Unavailable";
  const workflowReadinessSummary = workflowIntent
    ? workflowIntent.localStatus === "focused"
      ? `${workflowIntent.handoff.label} is active inside the shell and remains local-only.`
      : workflowIntent.localStatus === "staged"
        ? `${workflowIntent.workflowStep.label} is staged and ready to be focused locally.`
        : `${workflowIntent.workflowStep.label} is ready but not yet staged into the current shell posture.`
    : "No workflow intent is selected.";
  const workflowLinkedShell = workflowIntent
    ? `${workflowIntent.shellLink.pageId} · ${workflowIntent.shellLink.rightRailTabId} / ${workflowIntent.shellLink.bottomDockTabId}`
    : "Unavailable";
  const activeOrchestrationBoard =
    data.windowing.orchestration.boards.find((board) => board.laneId === selectedWorkflowLane?.id) ??
    data.windowing.orchestration.boards.find((board) => board.routeId === activePage) ??
    data.windowing.orchestration.boards.find((board) => board.id === data.windowing.orchestration.activeBoardId) ??
    data.windowing.orchestration.boards[0] ??
    null;
  const activeSharedStateLane =
    resolveActiveWindowSharedStateLane(data.windowing, undefined, activeOrchestrationBoard?.id ?? null, activePage) ??
    data.windowing.sharedState.lanes[0] ??
    null;
  const activeWindowRosterEntry =
    resolveActiveWindowRosterEntry(data.windowing, activeSharedStateLane?.windowId ?? null, activeSharedStateLane, activePage) ??
    data.windowing.roster.windows[0] ??
    null;
  const activeObservabilityMapping = selectStudioWindowObservabilityActiveMapping(data.windowing) ?? null;
  const actionById = new Map(data.commandSurface.actions.map((action) => [action.id, action]));
  const activeContexts = data.commandSurface.contexts.filter((context) => context.id === "global" || context.id === activePage);
  const contextualActions = dedupeCommandActions(activeContexts.flatMap((context) => context.actionIds.map((actionId) => actionById.get(actionId))));
  const quickActions = dedupeCommandActions([
    ...data.commandSurface.quickActionIds.map((actionId) => actionById.get(actionId)),
    ...contextualActions.slice(0, 2)
  ]).slice(0, 6);
  const normalizedCommandQuery = commandQuery.trim().toLowerCase();
  const paletteActions =
    normalizedCommandQuery.length === 0
      ? contextualActions
      : data.commandSurface.actions.filter((action) => {
          const haystack = [
            action.label,
            action.description,
            action.scope,
            action.safety,
            action.reviewSurfaceKind ?? "",
            action.deliveryChainStageId ?? "",
            ...action.keywords
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(normalizedCommandQuery);
        });
  const commandContext: CommandContextState = {
    routeId: activePage,
    workflowLaneId: selectedWorkflowLane?.id,
    slotId: resolvedFocusSlotId ?? undefined,
    workspaceViewId: workspaceView?.id,
    windowIntentId: selectedWindowIntent?.id
  };
  const activeActionGroups = data.commandSurface.actionGroups
    .filter((group) => matchesCommandMatcher(group.match, commandContext))
    .sort((left, right) => scoreCommandMatcher(right.match, commandContext) - scoreCommandMatcher(left.match, commandContext));
  const activeSequences = data.commandSurface.sequences
    .filter((sequence) => matchesCommandMatcher(sequence.match, commandContext))
    .sort((left, right) => scoreCommandMatcher(right.match, commandContext) - scoreCommandMatcher(left.match, commandContext));
  const activeContextualFlow =
    data.commandSurface.contextualFlows
      .filter((flow) => flow.surfaceIds.includes("shell") || flow.surfaceIds.includes(activePage))
      .filter((flow) => matchesCommandMatcher(flow.match, commandContext))
      .sort((left, right) => scoreCommandMatcher(right.match, commandContext) - scoreCommandMatcher(left.match, commandContext))[0] ?? null;
  const activeSequence =
    (activeContextualFlow ? data.commandSurface.sequences.find((sequence) => sequence.id === activeContextualFlow.sequenceId) : undefined) ??
    activeSequences[0] ??
    null;
  const recommendedAction =
    (activeContextualFlow?.recommendedActionId ? actionById.get(activeContextualFlow.recommendedActionId) : undefined) ??
    (activeSequence?.recommendedActionId ? actionById.get(activeSequence.recommendedActionId) : undefined) ??
    activeSequence?.actionIds.map((actionId) => actionById.get(actionId)).find((action): action is StudioCommandAction => Boolean(action)) ??
    null;
  const followUpActions = dedupeCommandActions([
    ...(activeContextualFlow?.followUpActionIds ?? []).map((actionId) => actionById.get(actionId)),
    ...(activeSequence?.followUpActionIds ?? []).map((actionId) => actionById.get(actionId))
  ]);
  const activeShortcuts = data.commandSurface.keyboardRouting.shortcuts.filter((shortcut) =>
    (activeContextualFlow?.keyboardShortcutIds ?? []).includes(shortcut.id)
  );
  const nextStepById = new Map(data.commandSurface.nextSteps.map((step) => [step.id, step]));
  const activeNextStepBoard =
    data.commandSurface.nextStepBoards
      .filter((board) => matchesCommandMatcher(board.match, commandContext))
      .sort((left, right) => {
        const leftScore =
          scoreCommandMatcher(left.match, commandContext) +
          (left.flowId === activeContextualFlow?.id ? 10 : 0) +
          (left.sequenceId === activeSequence?.id ? 6 : 0);
        const rightScore =
          scoreCommandMatcher(right.match, commandContext) +
          (right.flowId === activeContextualFlow?.id ? 10 : 0) +
          (right.sequenceId === activeSequence?.id ? 6 : 0);

        return rightScore - leftScore;
      })[0] ?? null;
  const activeActionDeck =
    data.commandSurface.actionDecks
      .filter((deck) => matchesCommandMatcher(deck.match, commandContext))
      .sort((left, right) => {
        const leftScore =
          scoreCommandMatcher(left.match, commandContext) +
          (left.flowId === activeContextualFlow?.id ? 10 : 0) +
          (left.sequenceId === activeSequence?.id ? 6 : 0);
        const rightScore =
          scoreCommandMatcher(right.match, commandContext) +
          (right.flowId === activeContextualFlow?.id ? 10 : 0) +
          (right.sequenceId === activeSequence?.id ? 6 : 0);

        return rightScore - leftScore;
      })[0] ?? null;
  const reviewCoverageActions: ReviewCoverageAction[] = data.commandSurface.actions.filter(isReviewCoverageAction);
  const activeMaterializationArtifactProgression =
    selectStudioReleasePackagedAppMaterializationContractArtifactCheckpointProgression(
      releaseApprovalPipeline.deliveryChain,
      data.windowing,
      data.reviewStateContinuity,
      activeActionDeck,
      reviewCoverageActions,
      activeMaterializationPlatform?.id
    );
  const activeMaterializationArtifactSurface = activeMaterializationArtifactProgression.currentSurface;
  const nextMaterializationArtifactSurface = activeMaterializationArtifactProgression.nextSurface;
  const artifactCheckpointProgressionPath = formatArtifactCheckpointProgressionPath(activeMaterializationArtifactProgression);
  const artifactCurrentToNextHandoffLabel = formatArtifactCurrentToNextLabel(
    activeMaterializationArtifactProgression.currentHandoff?.label ?? activeMaterializationArtifactSurface.artifactLedger?.label ?? null,
    activeMaterializationArtifactProgression.nextHandoff?.label ?? null,
    activeMaterializationArtifactSurface.artifactLedger ? "Final artifact handoff" : "Unavailable"
  );
  const artifactCurrentToNextSummary = formatArtifactCurrentToNextSummary(activeMaterializationArtifactProgression);
  const currentArtifactSurfaceDescriptor = formatArtifactSurfaceDescriptor(activeMaterializationArtifactSurface);
  const currentArtifactSurfaceContinuity = formatArtifactSurfaceContinuity(activeMaterializationArtifactSurface);
  const currentArtifactSurfaceSpine = formatArtifactSurfaceSpine(activeMaterializationArtifactSurface);
  const nextArtifactSurfaceDescriptor = nextMaterializationArtifactSurface
    ? formatArtifactSurfaceDescriptor(nextMaterializationArtifactSurface)
    : activeMaterializationArtifactSurface.artifactLedger
      ? "Final artifact handoff"
      : "Unavailable";
  const nextArtifactSurfaceContinuity = nextMaterializationArtifactSurface
    ? formatArtifactSurfaceContinuity(nextMaterializationArtifactSurface)
    : activeMaterializationArtifactSurface.artifactLedger
      ? "No next surface continuity is linked because the active handoff is terminal."
      : "Unavailable";
  const nextArtifactSurfaceSpine = nextMaterializationArtifactSurface
    ? formatArtifactSurfaceSpine(nextMaterializationArtifactSurface)
    : activeMaterializationArtifactSurface.artifactLedger
      ? "Terminal handoff / no next window spine"
      : "Unavailable";
  const activeActionDeckActionIds = [...new Set(activeActionDeck?.lanes.flatMap((lane) => lane.actionIds) ?? [])];
  const activeActionDeckDeliveryStageIds = [
    ...new Set(activeActionDeck?.lanes.flatMap((lane) => lane.deliveryChainStageIds ?? []) ?? [])
  ];
  const activeActionDeckWindowIds = [...new Set(activeActionDeck?.lanes.flatMap((lane) => lane.windowIds ?? []) ?? [])];
  const activeActionDeckBoardIds = [...new Set(activeActionDeck?.lanes.flatMap((lane) => lane.orchestrationBoardIds ?? []) ?? [])];
  const activeActionDeckReviewSurfaceActions: ReviewCoverageAction[] = dedupeCommandActions(
    activeActionDeck?.lanes.flatMap((lane) => lane.actionIds.map((actionId) => actionById.get(actionId))) ?? []
  ).filter(isReviewCoverageAction);
  const surfacedReviewCoverageActions: ReviewCoverageAction[] = activeActionDeckReviewSurfaceActions.length
    ? activeActionDeckReviewSurfaceActions
    : reviewCoverageActions;
  const selectedReviewSurfaceCandidate = reviewCoverageSelection.reviewSurfaceActionId
    ? actionById.get(reviewCoverageSelection.reviewSurfaceActionId)
    : undefined;
  const selectedReviewSurfaceAction = isReviewCoverageAction(selectedReviewSurfaceCandidate) ? selectedReviewSurfaceCandidate : null;
  const selectedCoverageStage =
    (reviewCoverageSelection.deliveryStageId
      ? selectStudioReleaseDeliveryChainStage(releaseApprovalPipeline, reviewCoverageSelection.deliveryStageId)
      : null) ?? null;
  const selectedCoverageWindow =
    data.windowing.roster.windows.find((entry) => entry.id === reviewCoverageSelection.windowId) ?? null;
  const selectedCoverageLane =
    data.windowing.sharedState.lanes.find((entry) => entry.id === reviewCoverageSelection.sharedStateLaneId) ?? null;
  const selectedCoverageBoard =
    data.windowing.orchestration.boards.find((entry) => entry.id === reviewCoverageSelection.orchestrationBoardId) ?? null;
  const selectedCoverageMapping =
    data.windowing.observability.mappings.find((entry) => entry.id === reviewCoverageSelection.observabilityMappingId) ?? null;
  const actionDeckLaneContext: ActionDeckLaneContext = {
    workspaceViewId: workspaceView?.id,
    windowIntentId: selectedWindowIntent?.id,
    deliveryStageId: selectedCoverageStage?.id ?? currentDeliveryStage?.id ?? null,
    windowId: selectedCoverageWindow?.id ?? activeWindowRosterEntry?.id ?? null,
    sharedStateLaneId: selectedCoverageLane?.id ?? activeSharedStateLane?.id ?? null,
    orchestrationBoardId: selectedCoverageBoard?.id ?? activeOrchestrationBoard?.id ?? null,
    observabilityMappingId: selectedCoverageMapping?.id ?? activeObservabilityMapping?.id ?? null,
    reviewSurfaceActionId: selectedReviewSurfaceAction?.id ?? null
  };
  const activeActionDeckLane =
    (reviewCoverageSelection.actionDeckLaneId
      ? activeActionDeck?.lanes.find((lane) => lane.id === reviewCoverageSelection.actionDeckLaneId)
      : undefined) ??
    [...(activeActionDeck?.lanes ?? [])].sort(
      (left, right) => scoreActionDeckLane(right, actionDeckLaneContext) - scoreActionDeckLane(left, actionDeckLaneContext)
    )[0] ??
    null;
  const resolvedReviewSurfaceAction =
    selectedReviewSurfaceAction ??
    dedupeCommandActions(
      activeActionDeckLane?.actionIds.map((actionId) => actionById.get(actionId)).filter(isReviewCoverageAction) ?? []
    ).find(isReviewCoverageAction) ??
    surfacedReviewCoverageActions[0] ??
    null;
  const resolvedDeliveryCoverageStage =
    selectedCoverageStage ??
    (activeActionDeckLane?.focusDeliveryChainStageId
      ? selectStudioReleaseDeliveryChainStage(releaseApprovalPipeline, activeActionDeckLane.focusDeliveryChainStageId)
      : null) ??
    currentDeliveryStage ??
    releaseApprovalPipeline.deliveryChain.stages[0] ??
    null;
  const resolvedCoverageWindow =
    selectedCoverageWindow ??
    (activeActionDeckLane?.focusWindowId
      ? data.windowing.roster.windows.find((entry) => entry.id === activeActionDeckLane.focusWindowId)
      : null) ??
    activeWindowRosterEntry ??
    data.windowing.roster.windows[0] ??
    null;
  const resolvedCoverageLane =
    selectedCoverageLane ??
    (activeActionDeckLane?.focusSharedStateLaneId
      ? data.windowing.sharedState.lanes.find((entry) => entry.id === activeActionDeckLane.focusSharedStateLaneId)
      : null) ??
    activeSharedStateLane ??
    data.windowing.sharedState.lanes[0] ??
    null;
  const resolvedCoverageBoard =
    selectedCoverageBoard ??
    (activeActionDeckLane?.focusOrchestrationBoardId
      ? data.windowing.orchestration.boards.find((entry) => entry.id === activeActionDeckLane.focusOrchestrationBoardId)
      : null) ??
    activeOrchestrationBoard ??
    data.windowing.orchestration.boards[0] ??
    null;
  const resolvedCoverageMapping =
    selectedCoverageMapping ??
    (activeActionDeckLane?.focusObservabilityMappingId
      ? data.windowing.observability.mappings.find((entry) => entry.id === activeActionDeckLane.focusObservabilityMappingId)
      : null) ??
    activeObservabilityMapping ??
    data.windowing.observability.mappings[0] ??
    null;
  const windowingSurface: AppWindowingSurfaceProps = {
    activeRouteId: activePage,
    activeWindowId: resolvedCoverageWindow?.id ?? null,
    activeLaneId: resolvedCoverageLane?.id ?? null,
    activeBoardId: resolvedCoverageBoard?.id ?? null,
    activeMappingId: resolvedCoverageMapping?.id ?? null
  };
  const inspectorSections = createInspectorSections(
    data.boundary,
    hostTraceFocus,
    {
      windowing: data.windowing,
      reviewStateContinuity: data.reviewStateContinuity,
      actionDeck: activeActionDeck,
      reviewSurfaceActions: reviewCoverageActions,
      activeLaneId: windowingSurface.activeLaneId,
      activeWindowId: windowingSurface.activeWindowId,
      activeBoardId: windowingSurface.activeBoardId,
      activeMappingId: windowingSurface.activeMappingId,
      activeReviewSurfaceActionId: resolvedReviewSurfaceAction?.id ?? null
    }
  );
  const nextStepItems =
    activeNextStepBoard?.stepIds.flatMap((stepId) => {
      const step = nextStepById.get(stepId);

      if (!step) {
        return [];
      }

      return [
        {
          id: step.id,
          label: step.label,
          detail: step.detail,
          tone: step.tone,
          action: actionById.get(step.actionId) ?? null
        }
      ];
    }) ?? [];
  const activeActionDeckLaneReviewSurfaceActions: ReviewCoverageAction[] = dedupeCommandActions(
    activeActionDeckLane?.actionIds.map((actionId) => actionById.get(actionId)) ?? []
  ).filter(isReviewCoverageAction);
  const activeActionDeckRouteStates = dedupeById((activeActionDeck?.lanes ?? []).flatMap((lane) => lane.companionRouteStates ?? []));
  const activeActionDeckSequences = dedupeById((activeActionDeck?.lanes ?? []).flatMap((lane) => lane.companionSequences ?? []));
  const persistedCompanionRouteEntries: StudioCommandCompanionRouteHistoryEntry[] = companionRouteHistory
    .filter((entry) =>
      entry.nextSelection.actionDeckLaneId ? activeActionDeck?.lanes.some((lane) => lane.id === entry.nextSelection.actionDeckLaneId) ?? false : false
    )
    .flatMap((entry) => {
      const nextSelection = entry.nextSelection;
      const previousSelection = entry.previousSelection;
      const nextActionCandidate = nextSelection.reviewSurfaceActionId ? actionById.get(nextSelection.reviewSurfaceActionId) : undefined;
      const nextAction = isReviewCoverageAction(nextActionCandidate) ? nextActionCandidate : null;

      if (!nextAction) {
        return [];
      }

      const nextRouteState =
        (nextSelection.companionRouteStateId
          ? activeActionDeckRouteStates.find((routeState) => routeState.id === nextSelection.companionRouteStateId)
          : undefined) ?? null;
      const previousRouteState =
        (previousSelection?.companionRouteStateId
          ? activeActionDeckRouteStates.find((routeState) => routeState.id === previousSelection.companionRouteStateId)
          : undefined) ?? null;

      return [
        {
          id: entry.id,
          label: nextRouteState?.label ?? nextAction.label,
          summary: previousRouteState
            ? `Resume the ${previousRouteState.label} -> ${nextRouteState?.label ?? nextAction.label} handoff without dropping the last local-only companion lane.`
            : "Resume the last local-only companion handoff for this lane instead of recomputing the route from the active surface only.",
          tone: nextRouteState?.tone ?? nextAction.tone ?? "neutral",
          transitionKind: resolveCompanionRouteTransitionKind(entry.previousSelection, nextSelection, entry.transitionKind),
          sourceActionId: entry.previousSelection?.reviewSurfaceActionId ?? nextAction.id,
          targetActionId: nextAction.id,
          routeStateId: nextSelection.companionRouteStateId ?? undefined,
          sequenceId: nextSelection.companionSequenceId ?? undefined,
          reviewPathId: nextRouteState?.activeReviewPathId,
          routeId: nextAction.routeId ?? nextRouteState?.routeId,
          workspaceViewId: nextAction.workspaceViewId ?? nextRouteState?.workspaceViewId,
          windowIntentId: nextAction.windowIntentId ?? nextRouteState?.windowIntentId,
          deliveryChainStageId: nextSelection.deliveryStageId ?? nextAction.deliveryChainStageId ?? nextRouteState?.deliveryChainStageId,
          windowId: nextSelection.windowId ?? nextAction.windowId ?? nextRouteState?.windowId,
          sharedStateLaneId: nextSelection.sharedStateLaneId ?? nextAction.sharedStateLaneId ?? nextRouteState?.sharedStateLaneId,
          orchestrationBoardId:
            nextSelection.orchestrationBoardId ?? nextAction.orchestrationBoardId ?? nextRouteState?.orchestrationBoardId,
          observabilityMappingId:
            nextSelection.observabilityMappingId ?? nextAction.observabilityMappingId ?? nextRouteState?.observabilityMappingId,
          timestampLabel: formatRecordedAt(entry.recordedAt)
        }
      ];
    });
  const {
    reviewSurfaceActionById,
    relevantCompanionSequences: activeActionDeckLaneCompanionSequences,
    activeCompanionSequence,
    activeCompanionSequenceCurrentStep,
    activeCompanionSequenceCurrentStepIndex,
    resolvedCompanionReviewPaths,
    activeCompanionReviewPath,
    relevantCompanionRouteStates,
    activeCompanionRouteState,
    activeSequenceSwitch,
    relevantCompanionPathHandoffs,
    activeCompanionPathHandoff,
    relevantCompanionRouteHistoryEntries,
    activeCompanionRouteHistoryEntry
  } = resolveCompanionRouteContext({
    lanes: activeActionDeckLane ? [activeActionDeckLane] : [],
    contextReviewSurfaceActions: activeActionDeckLaneReviewSurfaceActions.length
      ? activeActionDeckLaneReviewSurfaceActions
      : surfacedReviewCoverageActions,
    allReviewSurfaceActions: reviewCoverageActions,
    activeReviewSurfaceActionId: resolvedReviewSurfaceAction?.id ?? null,
    companionRouteStateId: reviewCoverageSelection.companionRouteStateId,
    companionSequenceId: reviewCoverageSelection.companionSequenceId,
    companionRouteHistoryEntryId: reviewCoverageSelection.companionRouteHistoryEntryId,
    companionPathHandoffId: reviewCoverageSelection.companionPathHandoffId,
    additionalCompanionRouteHistoryEntries: persistedCompanionRouteEntries
  });
  const activeCompanionSequenceStepLabel =
    activeCompanionSequence && activeCompanionSequenceCurrentStepIndex >= 0
      ? `Step ${activeCompanionSequenceCurrentStepIndex + 1} of ${activeCompanionSequence.steps.length}`
      : activeCompanionSequence
        ? `${activeCompanionSequence.steps.length} ordered steps`
        : "No companion sequence";
  const historyEntries = commandLog.slice(0, data.commandSurface.history.retention);
  const companionRouteHistoryItems: ContextualCommandCompanionRouteHistoryItem[] = relevantCompanionRouteHistoryEntries
    .map((entry) => {
      const nextActionCandidate = reviewSurfaceActionById.get(entry.targetActionId) ?? actionById.get(entry.targetActionId);
      const nextAction = isReviewCoverageAction(nextActionCandidate) ? nextActionCandidate : null;
      const sourceActionCandidate = reviewSurfaceActionById.get(entry.sourceActionId) ?? actionById.get(entry.sourceActionId);
      const sourceAction = isReviewCoverageAction(sourceActionCandidate) ? sourceActionCandidate : null;
      const nextRouteState = entry.routeStateId ? relevantCompanionRouteStates.find((routeState) => routeState.id === entry.routeStateId) ?? null : null;
      const nextSequence = entry.sequenceId ? activeActionDeckSequences.find((sequence) => sequence.id === entry.sequenceId) ?? null : null;
      const nextStage =
        (entry.deliveryChainStageId ? selectStudioReleaseDeliveryChainStage(releaseApprovalPipeline, entry.deliveryChainStageId) : null) ??
        (nextAction?.deliveryChainStageId ? selectStudioReleaseDeliveryChainStage(releaseApprovalPipeline, nextAction.deliveryChainStageId) : null);
      const nextWindow =
        (entry.windowId ? data.windowing.roster.windows.find((window) => window.id === entry.windowId) : undefined) ??
        (nextAction?.windowId ? data.windowing.roster.windows.find((window) => window.id === nextAction.windowId) : undefined) ??
        null;
      const nextLane =
        (entry.sharedStateLaneId ? data.windowing.sharedState.lanes.find((lane) => lane.id === entry.sharedStateLaneId) : undefined) ??
        (nextAction?.sharedStateLaneId ? data.windowing.sharedState.lanes.find((lane) => lane.id === nextAction.sharedStateLaneId) : undefined) ??
        null;
      const nextBoard =
        (entry.orchestrationBoardId ? data.windowing.orchestration.boards.find((board) => board.id === entry.orchestrationBoardId) : undefined) ??
        (nextAction?.orchestrationBoardId ? data.windowing.orchestration.boards.find((board) => board.id === nextAction.orchestrationBoardId) : undefined) ??
        null;
      const nextMapping =
        (entry.observabilityMappingId
          ? data.windowing.observability.mappings.find((mapping) => mapping.id === entry.observabilityMappingId)
          : undefined) ??
        (nextAction?.observabilityMappingId
          ? data.windowing.observability.mappings.find((mapping) => mapping.id === nextAction.observabilityMappingId)
          : undefined) ??
        null;
      const routeLabel = resolveReviewSurfaceRouteLabel(nextAction ?? sourceAction, data.windowing);
      const sourceLabel = sourceAction?.label ?? nextRouteState?.label ?? entry.sourceActionId;
      const targetLabel = nextAction?.label ?? nextRouteState?.label ?? entry.targetActionId;

      return {
        id: entry.id,
        label: nextRouteState?.label ?? targetLabel,
        detail: entry.summary,
        tone: nextRouteState?.tone ?? nextAction?.tone ?? entry.tone ?? "neutral",
        active: entry.id === activeCompanionRouteHistoryEntry?.id,
        transitionLabel: `${formatCompanionRouteTransitionKind(entry.transitionKind)} / ${sourceLabel} -> ${targetLabel}`,
        coverageLabel: `${nextStage?.label ?? entry.deliveryChainStageId ?? "No stage"} / ${nextWindow?.label ?? entry.windowId ?? "No window"}`,
        routeLabel,
        pathLabel: `${nextLane?.label ?? entry.sharedStateLaneId ?? "No lane"} / ${
          nextBoard?.label ?? entry.orchestrationBoardId ?? "No board"
        } / ${nextMapping?.label ?? entry.observabilityMappingId ?? "No observability path"}`,
        sequenceLabel: nextSequence?.label,
        timestamp: entry.timestampLabel,
        action: nextAction
      };
    })
    .slice(0, data.commandSurface.history.retention);
  const activeReplayScenarioPack = activeActionDeckLane?.replayScenarioPack ?? null;
  const activeReplayScenarioLabel =
    activeCompanionRouteHistoryEntry?.scenarioLabel ?? activeCompanionRouteHistoryEntry?.label ?? activeReplayScenarioPack?.label ?? "No replay scenario";
  const activeReplayScenarioVerdict =
    activeCompanionRouteHistoryEntry?.reviewerSignoff?.verdict ??
    activeCompanionRouteHistoryEntry?.reviewerSignoff?.label ??
    "No reviewer verdict";
  const activeReplayScenarioNextHandoff =
    activeCompanionRouteHistoryEntry?.reviewerSignoff?.nextHandoff ??
    activeCompanionPathHandoff?.label ??
    "No stabilized handoff";
  const activeReplayScenarioEvidenceSummary = `${activeCompanionRouteHistoryEntry?.scenarioEvidenceItems?.length ?? 0} dossier items / ${
    activeCompanionRouteHistoryEntry?.screenshotReviewItems?.length ?? 0
  } storyboard shots / ${activeCompanionRouteHistoryEntry?.evidenceContinuityChecks?.length ?? 0} continuity checks`;
  const activeReplayScenarioReadingSummary =
    activeCompanionRouteHistoryEntry?.reviewerWalkthrough?.readingQueueSummary ??
    activeCompanionRouteHistoryEntry?.reviewerWalkthrough?.summary ??
    activeReplayScenarioPack?.summary ??
    "No replay reading order is currently staged.";
  const activeReplayScenarioCheckpointReadyCount =
    activeCompanionRouteHistoryEntry?.reviewerSignoff?.checkpoints.filter((checkpoint) => checkpoint.state === "ready").length ?? 0;
  const activeReplayScenarioCheckpointCount = activeCompanionRouteHistoryEntry?.reviewerSignoff?.checkpoints.length ?? 0;
  const activeReplayPackEntries = dedupeById(
    relevantCompanionRouteHistoryEntries.filter((entry) =>
      Boolean(entry.scenarioLabel || entry.scenarioSummary || entry.reviewerSignoff || entry.reviewerWalkthrough)
    )
  );
  const activeReplayPackReadyCount = activeReplayPackEntries.filter((entry) => entry.reviewerSignoff?.state === "ready").length;
  const activeReplayPackBlockedCount = activeReplayPackEntries.filter((entry) => entry.reviewerSignoff?.state === "blocked").length;
  const activeReplayPackInReviewCount = Math.max(
    activeReplayPackEntries.length - activeReplayPackReadyCount - activeReplayPackBlockedCount,
    0
  );
  const activeReplayCloseoutTimelineLabel = [
    activeCompanionRouteHistoryEntry ? "Route replay" : null,
    resolvedReviewSurfaceAction?.label ?? "Review surface",
    currentCloseoutWindow?.label ?? "Closeout window",
    activeObservabilityMapping?.label ?? "Observability path"
  ]
    .filter((label): label is string => Boolean(label))
    .join(" -> ");
  const activeReplayObservabilityCloseoutLabel =
    activeObservabilityMapping && resolvedCoverageWindow && resolvedCoverageLane && resolvedCoverageBoard
      ? `${activeObservabilityMapping.label} / ${resolvedCoverageWindow.label} -> ${resolvedCoverageLane.label} -> ${resolvedCoverageBoard.label}`
      : activeObservabilityMapping
        ? `${activeObservabilityMapping.label} / ${formatReviewPostureRelationship(activeObservabilityMapping.relationship)}`
        : "No observability closeout path";
  const activeReplayVerdictStateLabel = formatReplayReviewerSignoffStateLabel(activeCompanionRouteHistoryEntry?.reviewerSignoff?.state);
  const latestReplayRestoreEntryId = activeCompanionRouteHistoryEntry?.id ?? companionRouteHistoryItems[0]?.id ?? null;
  const windowsObservabilityAction = actionById.get("command-open-windows-observability");
  const activeFlowState: ContextualCommandStateLine[] = [
    {
      id: "flow-state-route",
      label: "Current route",
      value: activePageMeta.label,
      tone: "neutral" as const
    },
    {
      id: "flow-state-workflow",
      label: "Current workflow",
      value: selectedWorkflowLane?.label ?? "No workflow lane",
      tone: workflowReadinessTone
    },
    {
      id: "flow-state-command",
      label: "Current command flow",
      value: activeContextualFlow?.label ?? activeSequence?.label ?? data.inspector.flow.label,
      tone: activeContextualFlow ? "positive" : "neutral"
    },
    {
      id: "flow-state-action-deck",
      label: "Action deck",
      value: activeActionDeck?.label ?? "No action deck",
      tone: activeActionDeck?.tone ?? "neutral"
    },
    {
      id: "flow-state-workspace",
      label: "Workspace",
      value: workspaceView?.label ?? "No workspace",
      tone:
        resolvedWindowPosture.mode === "intent-focused"
          ? "positive"
          : resolvedWindowPosture.mode === "detached-candidate"
            ? "warning"
            : "neutral"
    },
    {
      id: "flow-state-slot",
      label: "Focused slot",
      value: hostTraceFocus?.slot.label ?? "Unavailable",
      tone: hostTraceFocus ? (hostTraceFocus.slot.rollbackDisposition === "not-needed" ? "positive" : "warning") : "neutral"
    },
    {
      id: "flow-state-intent",
      label: "Intent focus",
      value: selectedWindowIntent ? `${selectedWindowIntent.label} / ${formatIntentStatus(selectedWindowIntent.localStatus)}` : "No intent",
      tone: selectedWindowIntent ? workflowReadinessTone : "neutral"
    },
    {
      id: "flow-state-delivery",
      label: "Delivery coverage",
      value: resolvedDeliveryCoverageStage
        ? `${resolvedDeliveryCoverageStage.label} / ${resolvedDeliveryCoverageStage.phase}`
        : "No delivery stage",
      tone:
        resolvedDeliveryCoverageStage?.status === "ready"
          ? "positive"
          : resolvedDeliveryCoverageStage
            ? "warning"
            : "neutral"
    },
    {
      id: "flow-state-review-surface",
      label: "Review surface",
      value: resolvedReviewSurfaceAction
        ? `${resolvedReviewSurfaceAction.label} / ${formatReviewSurfaceKind(resolvedReviewSurfaceAction.reviewSurfaceKind)}`
        : "No review surface",
      tone: resolvedReviewSurfaceAction?.tone ?? "neutral"
    },
    {
      id: "flow-state-companion-sequence",
      label: "Companion sequence",
      value: activeCompanionSequence ? `${activeCompanionSequence.label} / ${activeCompanionSequenceStepLabel}` : "No companion sequence",
      tone: activeCompanionSequence?.tone ?? "neutral"
    },
    {
      id: "flow-state-companion-route",
      label: "Companion route",
      value: activeCompanionRouteState
        ? `${activeCompanionRouteState.label} / ${formatCompanionRouteStatePosture(activeCompanionRouteState.posture)}`
        : "No companion route",
      tone: activeCompanionRouteState?.tone ?? "neutral"
    },
    {
      id: "flow-state-path-handoff",
      label: "Route Replay Restore",
      value: activeCompanionPathHandoff
        ? `${activeCompanionPathHandoff.label} / ${formatCompanionPathHandoffStability(activeCompanionPathHandoff.stability)}`
        : activeCompanionRouteHistoryEntry
          ? `${activeCompanionRouteHistoryEntry.label} / ${formatCompanionRouteTransitionKind(activeCompanionRouteHistoryEntry.transitionKind)}`
          : "No stabilized handoff",
      tone:
        activeCompanionPathHandoff?.stability === "stable" || activeCompanionPathHandoff?.stability === "restored"
          ? "positive"
          : activeCompanionPathHandoff
            ? "warning"
            : activeCompanionRouteHistoryEntry
              ? activeCompanionRouteHistoryEntry.tone
              : "neutral"
    },
    {
      id: "flow-state-companion-memory",
      label: "Route Replay Memory",
      value: companionRouteHistoryItems.length
        ? `${companionRouteHistoryItems.length} remembered / ${companionRouteHistoryItems[0]?.label ?? "Latest handoff"}`
        : "No remembered handoff",
      tone: companionRouteHistoryItems.length ? "positive" : "neutral"
    },
    {
      id: "flow-state-observability",
      label: "Observability path",
      value: resolvedCoverageMapping
        ? `${resolvedCoverageMapping.label} / ${formatReviewPostureRelationship(resolvedCoverageMapping.relationship)}`
        : "No active observability path",
      tone: resolvedCoverageMapping ? resolvedCoverageMapping.tone : "neutral"
    },
    {
      id: "flow-state-multi-window-coverage",
      label: "Coverage paths",
      value: activeActionDeckLane
        ? `${(activeActionDeckLane.observabilityMappingIds ?? []).length} mapped / ${(activeActionDeckLane.companionRouteStates ?? []).length} routes / ${(activeActionDeckLane.companionSequences ?? []).length} sequences / ${(activeActionDeckLane.companionReviewPaths ?? []).length} companion via ${activeActionDeckLane.label}`
        : "No mapped review lane",
      tone:
        ((activeActionDeckLane?.companionRouteStates?.length ?? 0) > 0 ||
          (activeActionDeckLane?.companionSequences?.length ?? 0) > 0 ||
          (activeActionDeckLane?.observabilityMappingIds?.length ?? 0) > 1)
          ? "positive"
          : activeActionDeckLane
            ? "neutral"
            : "warning"
    },
    {
      id: "flow-state-detached",
      label: "Detached candidate",
      value: selectedDetachedPanel?.label ?? "No detached candidate",
      tone: selectedDetachedPanel ? (selectedDetachedPanel.detachState === "detached-local" ? "positive" : "warning") : "neutral"
    }
  ];
  const actionDeckLanes: ContextualCommandActionDeckLaneItem[] =
    activeActionDeck?.lanes.map((lane) => {
      const primaryAction = actionById.get(lane.primaryActionId);
      const followUpActionLabels = (lane.followUpActionIds ?? [])
        .map((actionId) => actionById.get(actionId)?.label)
        .filter((label): label is string => Boolean(label));
      const laneScore = scoreActionDeckLane(lane, actionDeckLaneContext);
      const reviewSurfaceCount = lane.actionIds
        .map((actionId) => actionById.get(actionId))
        .filter(isReviewCoverageAction).length;

      return {
        id: lane.id,
        label: lane.label,
        detail: lane.summary,
        tone: lane.tone,
        active: (reviewCoverageSelection.actionDeckLaneId ? lane.id === reviewCoverageSelection.actionDeckLaneId : false) ||
          (!reviewCoverageSelection.actionDeckLaneId && lane.id === activeActionDeckLane?.id) ||
          laneScore > 0,
        primaryActionLabel: primaryAction?.label ?? lane.primaryActionId,
        followUpActionLabels,
        actionCount: lane.actionIds.length,
        stageCount: (lane.deliveryChainStageIds ?? []).length,
        windowCount: (lane.windowIds ?? []).length,
        boardCount: (lane.orchestrationBoardIds ?? []).length,
        reviewSurfaceCount,
        companionRouteStateCount: (lane.companionRouteStates ?? []).length,
        companionSequenceCount: (lane.companionSequences ?? []).length,
        companionPathCount: (lane.companionReviewPaths ?? []).length
      };
    }) ?? [];
  const reviewSurfaceItems: ContextualCommandReviewSurfaceItem[] = surfacedReviewCoverageActions.map((action) => {
    const reviewSurfaceStage = action.deliveryChainStageId
      ? selectStudioReleaseDeliveryChainStage(releaseApprovalPipeline, action.deliveryChainStageId)
      : null;
    const reviewSurfaceWindow = action.windowId
      ? data.windowing.roster.windows.find((entry) => entry.id === action.windowId)
      : null;
    const reviewSurfaceBoard = action.orchestrationBoardId
      ? data.windowing.orchestration.boards.find((entry) => entry.id === action.orchestrationBoardId)
      : null;

    return {
      id: action.id,
      label: action.label,
      detail: action.description,
      tone: action.tone,
      active: action.id === resolvedReviewSurfaceAction?.id,
      kindLabel: formatReviewSurfaceKind(action.reviewSurfaceKind),
      coverageLabel: `${reviewSurfaceStage?.label ?? action.deliveryChainStageId ?? "No stage"} / ${
        reviewSurfaceWindow?.label ?? action.windowId ?? "No window"
      } / ${reviewSurfaceBoard?.label ?? action.orchestrationBoardId ?? "No board"}`,
      action
    };
  });
  const companionRouteStateItems: ContextualCommandCompanionRouteStateItem[] = relevantCompanionRouteStates.map((routeState) => {
    const routeActionCandidate = actionById.get(routeState.currentActionId);
    const routeAction = isReviewCoverageAction(routeActionCandidate) ? routeActionCandidate : null;
    const routeStage = routeState.deliveryChainStageId
      ? selectStudioReleaseDeliveryChainStage(releaseApprovalPipeline, routeState.deliveryChainStageId)
      : routeAction?.deliveryChainStageId
        ? selectStudioReleaseDeliveryChainStage(releaseApprovalPipeline, routeAction.deliveryChainStageId)
        : null;
    const routeWindow = routeState.windowId
      ? data.windowing.roster.windows.find((entry) => entry.id === routeState.windowId) ?? null
      : routeAction?.windowId
        ? data.windowing.roster.windows.find((entry) => entry.id === routeAction.windowId) ?? null
        : null;
    const routeLane = routeState.sharedStateLaneId
      ? data.windowing.sharedState.lanes.find((entry) => entry.id === routeState.sharedStateLaneId) ?? null
      : routeAction?.sharedStateLaneId
        ? data.windowing.sharedState.lanes.find((entry) => entry.id === routeAction.sharedStateLaneId) ?? null
        : null;
    const routeBoard = routeState.orchestrationBoardId
      ? data.windowing.orchestration.boards.find((entry) => entry.id === routeState.orchestrationBoardId) ?? null
      : routeAction?.orchestrationBoardId
        ? data.windowing.orchestration.boards.find((entry) => entry.id === routeAction.orchestrationBoardId) ?? null
        : null;
    const routeMapping = routeState.observabilityMappingId
      ? data.windowing.observability.mappings.find((entry) => entry.id === routeState.observabilityMappingId) ?? null
      : routeAction?.observabilityMappingId
        ? data.windowing.observability.mappings.find((entry) => entry.id === routeAction.observabilityMappingId) ?? null
        : null;
    const routeSequence =
      activeActionDeckLaneCompanionSequences.find((sequence) => sequence.id === routeState.activeSequenceId) ??
      activeActionDeckLaneCompanionSequences.find((sequence) =>
        routeState.sequenceSwitches.some((switchItem) => switchItem.sequenceId === sequence.id)
      ) ??
      null;
    const routeIntent = routeState.windowIntentId
      ? windowIntents.find((intent) => intent.id === routeState.windowIntentId) ?? null
      : routeAction?.windowIntentId
        ? windowIntents.find((intent) => intent.id === routeAction.windowIntentId) ?? null
        : null;

    return {
      id: routeState.id,
      label: routeState.label,
      detail: routeState.summary,
      tone: routeState.tone,
      active: routeState.id === activeCompanionRouteState?.id,
      postureLabel: formatCompanionRouteStatePosture(routeState.posture),
      sequenceLabel: routeSequence?.label ?? routeState.activeSequenceId,
      coverageLabel: `${routeStage?.label ?? routeState.deliveryChainStageId ?? "No stage"} / ${
        routeWindow?.label ?? routeState.windowId ?? "No window"
      }`,
      pathLabel: `${routeLane?.label ?? routeState.sharedStateLaneId ?? "No lane"} / ${
        routeBoard?.label ?? routeState.orchestrationBoardId ?? "No board"
      } / ${routeMapping?.label ?? routeState.observabilityMappingId ?? "No observability path"}`,
      routeLabel: `${routeState.routeId ?? routeIntent?.shellLink.pageId ?? activePage} / ${
        routeState.workspaceViewId ?? routeIntent?.workspaceViewId ?? routeAction?.workspaceViewId ?? "No workspace"
      } / ${routeIntent?.label ?? routeState.windowIntentId ?? routeAction?.windowIntentId ?? "No intent"}`,
      switchItems: routeState.sequenceSwitches.map((switchItem) => {
        const switchActionCandidate = actionById.get(switchItem.targetActionId);
        const switchAction = isReviewCoverageAction(switchActionCandidate) ? switchActionCandidate : null;

        return {
          id: switchItem.id,
          label: switchItem.label,
          detail: switchItem.summary,
          tone: switchItem.tone,
          postureLabel: formatCompanionRouteSequenceSwitchPosture(switchItem.posture),
          action: switchAction
        };
      }),
      action: routeAction
    };
  });
  const companionSequenceItems: ContextualCommandCompanionSequenceItem[] = activeActionDeckLaneCompanionSequences.map((sequence) => {
    const sourceActionCandidate = actionById.get(sequence.steps[0]?.actionId ?? "");
    const sourceAction = isReviewCoverageAction(sourceActionCandidate) ? sourceActionCandidate : null;
    const sourceStage = sourceAction?.deliveryChainStageId
      ? selectStudioReleaseDeliveryChainStage(releaseApprovalPipeline, sourceAction.deliveryChainStageId)
      : null;
    const sourceWindow = sourceAction?.windowId
      ? data.windowing.roster.windows.find((entry) => entry.id === sourceAction.windowId) ?? null
      : null;

    return {
      id: sequence.id,
      label: sequence.label,
      detail: sequence.summary,
      tone: sequence.tone,
      active: sequence.id === activeCompanionSequence?.id || sequence.id === activeSequenceSwitch?.sequenceId,
      stepCount: sequence.steps.length,
      coverageLabel: `${sourceStage?.label ?? sourceAction?.deliveryChainStageId ?? "No stage"} / ${
        sourceWindow?.label ?? sourceAction?.windowId ?? "No window"
      }`,
      routeLabel: resolveReviewSurfaceRouteLabel(sourceAction, data.windowing),
      action: sourceAction
    };
  });
  const companionSequenceStepItems: ContextualCommandCompanionSequenceStepItem[] = (activeCompanionSequence?.steps ?? []).map((step, index) => {
    const stepActionCandidate = actionById.get(step.actionId);
    const stepAction = isReviewCoverageAction(stepActionCandidate) ? stepActionCandidate : null;
    const stepStage = stepAction?.deliveryChainStageId
      ? selectStudioReleaseDeliveryChainStage(releaseApprovalPipeline, stepAction.deliveryChainStageId)
      : null;
    const stepWindow = stepAction?.windowId
      ? data.windowing.roster.windows.find((entry) => entry.id === stepAction.windowId) ?? null
      : null;
    const stepLane = stepAction?.sharedStateLaneId
      ? data.windowing.sharedState.lanes.find((entry) => entry.id === stepAction.sharedStateLaneId) ?? null
      : null;
    const stepBoard = stepAction?.orchestrationBoardId
      ? data.windowing.orchestration.boards.find((entry) => entry.id === stepAction.orchestrationBoardId) ?? null
      : null;
    const stepMapping = stepAction?.observabilityMappingId
      ? data.windowing.observability.mappings.find((entry) => entry.id === stepAction.observabilityMappingId) ?? null
      : null;

    return {
      id: step.id,
      label: stepAction?.label ?? step.actionId,
      detail: step.summary,
      tone: stepAction?.tone ?? activeCompanionSequence?.tone ?? "neutral",
      active: step.actionId === resolvedReviewSurfaceAction?.id,
      roleLabel: formatCompanionReviewSequenceStepRole(step.role),
      stepLabel: `Step ${index + 1} of ${activeCompanionSequence?.steps.length ?? index + 1}`,
      coverageLabel: `${stepStage?.label ?? stepAction?.deliveryChainStageId ?? "No stage"} / ${stepWindow?.label ?? stepAction?.windowId ?? "No window"}`,
      pathLabel: `${stepLane?.label ?? stepAction?.sharedStateLaneId ?? "No lane"} / ${
        stepBoard?.label ?? stepAction?.orchestrationBoardId ?? "No board"
      } / ${stepMapping?.label ?? stepAction?.observabilityMappingId ?? "No observability path"}`,
      action: stepAction
    };
  });
  const multiWindowCoverageItems = [...new Set(activeActionDeckLane?.observabilityMappingIds ?? [])]
    .map<ContextualCommandMultiWindowCoverageItem | null>((mappingId) => {
      const mapping = data.windowing.observability.mappings.find((entry) => entry.id === mappingId);

      if (!mapping) {
        return null;
      }

      const mappingStage = selectStudioReleaseDeliveryChainStage(releaseApprovalPipeline, mapping.reviewPosture.deliveryChainStageId);
      const mappingWindow = data.windowing.roster.windows.find((entry) => entry.id === mapping.windowId) ?? null;
      const mappingLane = data.windowing.sharedState.lanes.find((entry) => entry.id === mapping.sharedStateLaneId) ?? null;
      const mappingBoard = data.windowing.orchestration.boards.find((entry) => entry.id === mapping.orchestrationBoardId) ?? null;
      const mappingReviewSurfaceActions = activeActionDeckLaneReviewSurfaceActions.filter(
        (action) =>
          action.observabilityMappingId === mapping.id ||
          (action.deliveryChainStageId === mapping.reviewPosture.deliveryChainStageId &&
            action.windowId === mapping.windowId &&
            action.sharedStateLaneId === mapping.sharedStateLaneId &&
            action.orchestrationBoardId === mapping.orchestrationBoardId)
      );
      const preferredAction =
        mappingReviewSurfaceActions.find((action) => action.id === resolvedReviewSurfaceAction?.id) ??
        mappingReviewSurfaceActions.find((action) => action.id === selectedReviewSurfaceAction?.id) ??
        mappingReviewSurfaceActions[0] ??
        null;

      return {
        id: mapping.id,
        label: mapping.label,
        detail: mapping.summary,
        tone: mapping.tone,
        active:
          mapping.id === resolvedCoverageMapping?.id ||
          mapping.id === resolvedReviewSurfaceAction?.observabilityMappingId ||
          mapping.id === activeActionDeckLane?.focusObservabilityMappingId,
        relationshipLabel: formatReviewPostureRelationship(mapping.relationship),
        coverageLabel: `${mappingStage?.label ?? mapping.reviewPosture.stageLabel} / ${mappingWindow?.label ?? mapping.windowId} / ${mapping.routeId}`,
        pathLabel: `${mappingLane?.label ?? mapping.sharedStateLaneId} / ${mappingBoard?.label ?? mapping.orchestrationBoardId}`,
        reviewSurfaceCount: mappingReviewSurfaceActions.length,
        reviewSurfaceLabels: mappingReviewSurfaceActions.map((action) => formatReviewSurfaceKind(action.reviewSurfaceKind)),
        action: preferredAction
      };
    })
    .filter((item): item is ContextualCommandMultiWindowCoverageItem => item !== null)
    .sort((left, right) => Number(right.active) - Number(left.active) || left.label.localeCompare(right.label));
  const companionReviewPathItems: ContextualCommandCompanionReviewPathItem[] = resolvedCompanionReviewPaths
    .map((path) => {
      const sourceActionCandidate = actionById.get(path.sourceActionId);
      const primaryActionCandidate = actionById.get(path.primaryActionId);
      const sourceAction = isReviewCoverageAction(sourceActionCandidate) ? sourceActionCandidate : null;
      const primaryAction = isReviewCoverageAction(primaryActionCandidate) ? primaryActionCandidate : null;
      const companionSequence = activeActionDeckLaneCompanionSequences.find((sequence) => sequence.id === path.sequenceId) ?? null;
      const primaryStage = primaryAction?.deliveryChainStageId
        ? selectStudioReleaseDeliveryChainStage(releaseApprovalPipeline, primaryAction.deliveryChainStageId)
        : null;
      const primaryWindow = primaryAction?.windowId
        ? data.windowing.roster.windows.find((entry) => entry.id === primaryAction.windowId) ?? null
        : null;
      const primaryLane = primaryAction?.sharedStateLaneId
        ? data.windowing.sharedState.lanes.find((entry) => entry.id === primaryAction.sharedStateLaneId) ?? null
        : null;
      const primaryBoard = primaryAction?.orchestrationBoardId
        ? data.windowing.orchestration.boards.find((entry) => entry.id === primaryAction.orchestrationBoardId) ?? null
        : null;
      const primaryMapping = primaryAction?.observabilityMappingId
        ? data.windowing.observability.mappings.find((entry) => entry.id === primaryAction.observabilityMappingId) ?? null
        : null;
      const followUpActionLabels = (path.followUpActionIds ?? [])
        .map((actionId) => actionById.get(actionId))
        .filter(isReviewCoverageAction)
        .map((action) => action.label);

      return {
        id: path.id,
        label: path.label,
        detail: path.summary,
        tone: path.tone,
        active:
          path.sourceActionId === resolvedReviewSurfaceAction?.id ||
          path.primaryActionId === resolvedReviewSurfaceAction?.id ||
          Boolean(resolvedReviewSurfaceAction?.id && path.followUpActionIds?.includes(resolvedReviewSurfaceAction.id)),
        kindLabel: formatCompanionReviewPathKind(path.kind),
        sourceLabel: sourceAction?.label ?? path.sourceActionId,
        primaryActionLabel: primaryAction?.label ?? path.primaryActionId,
        followUpActionLabels,
        coverageLabel: `${primaryStage?.label ?? primaryAction?.deliveryChainStageId ?? "No stage"} / ${
          primaryWindow?.label ?? primaryAction?.windowId ?? "No window"
        }`,
        pathLabel: `${primaryLane?.label ?? primaryAction?.sharedStateLaneId ?? "No lane"} / ${
          primaryBoard?.label ?? primaryAction?.orchestrationBoardId ?? "No board"
        } / ${primaryMapping?.label ?? primaryAction?.observabilityMappingId ?? "No observability path"}`,
        routeLabel: `${resolveReviewSurfaceRouteLabel(sourceAction, data.windowing)} -> ${resolveReviewSurfaceRouteLabel(primaryAction, data.windowing)}`,
        sequenceLabel: companionSequence?.label,
        action: primaryAction
      };
    })
    .sort((left, right) => Number(right.active) - Number(left.active) || left.label.localeCompare(right.label));
  const paletteShortcutHints: CommandPaletteShortcutHint[] = data.commandSurface.keyboardRouting.shortcuts.slice(0, 8).map((shortcut) => ({
    id: shortcut.id,
    combo: shortcut.combo,
    label: shortcut.label
  }));
  const recommendedActionIndex =
    recommendedAction && activeSequence ? activeSequence.actionIds.findIndex((actionId) => actionId === recommendedAction.id) : -1;
  const contextualSteps: ContextualCommandStep[] =
    activeSequence?.actionIds.map((actionId, index) => {
      const action = actionById.get(actionId);

      return {
        id: actionId,
        label: action?.label ?? actionId,
        detail: action?.description ?? "Local-only contextual action.",
        state: recommendedActionIndex === -1 ? "completed" : index < recommendedActionIndex ? "completed" : index === recommendedActionIndex ? "next" : "pending",
        tone: action?.tone ?? "neutral"
      };
    }) ?? [];
  const commandPanel: ContextualCommandPanelProps = {
    eyebrow: activePageMeta.label,
    title: activeContextualFlow?.label ?? "Command Orchestration",
    summary: activeContextualFlow?.summary ?? data.commandSurface.summary,
    flowLabel: activeSequence?.label ?? selectedWorkflowLane?.label ?? "Local-only flow",
    flowSummary: activeSequence?.summary ?? "Route-aware orchestration stays local-only inside the shell.",
    workflowLaneLabel: selectedWorkflowLane?.label,
    workspaceLabel: workspaceView?.label,
    focusedSlotLabel: hostTraceFocus?.slot.label,
    activeFlowState,
    actionDeckLabel: activeActionDeck?.label,
    actionDeckSummary: activeActionDeck?.summary,
    actionDeckLanes,
    reviewSurfaceItems,
    companionRouteStatesLabel: activeActionDeckLane?.label ? `${activeActionDeckLane.label} companion routes` : undefined,
    companionRouteStatesSummary:
      activeCompanionRouteState && companionRouteStateItems.length
        ? `${resolvedReviewSurfaceAction?.label ?? "The active review surface"} now resolves through ${activeCompanionRouteState.label}, where ${companionRouteStateItems.length} explicit route states keep active route, alternate routes, and switchable sequence posture tied to the same local-only route, workspace, window, lane, board, and observability chain.`
        : undefined,
    companionRouteStateItems,
    companionRouteHistoryLabel: activeActionDeckLane?.label ? `${activeActionDeckLane.label} route replay restore` : undefined,
    companionRouteHistorySummary:
      activeActionDeckLane && companionRouteHistoryItems.length
        ? `${activeActionDeckLane.label} now remembers ${companionRouteHistoryItems.length} typed companion handoffs, while ${
            activeCompanionPathHandoff?.label ?? "the active path handoff"
          } now exposes route replay restore, so the same review lane can replay the last handoff with its route state, sequence, and observability posture intact instead of flattening back to the default path.`
        : undefined,
    companionRouteHistoryItems,
    companionSequenceLabel: activeCompanionSequence?.label,
    companionSequenceSummary:
      activeCompanionSequence && companionSequenceStepItems.length
        ? `${resolvedReviewSurfaceAction?.label ?? "The active review surface"} is ${activeCompanionSequenceCurrentStep ? activeCompanionSequenceStepLabel.toLowerCase() : "inside"} ${activeCompanionSequence.label}, so current, primary, and follow-up coverage stay sequenced across the same local-only route, workspace, window, lane, board, and observability chain while ${activeCompanionRouteState?.label ?? "the active route state"} keeps sequence switching explicit.`
        : undefined,
    companionSequenceItems,
    companionSequenceStepItems,
    companionReviewPathsLabel: activeActionDeckLane?.label ? `${activeActionDeckLane.label} companion paths` : undefined,
    companionReviewPathsSummary:
      activeActionDeckLane && companionReviewPathItems.length
        ? `${resolvedReviewSurfaceAction?.label ?? "The active review surface"} now resolves through ${activeCompanionRouteState?.label ?? activeCompanionSequence?.label ?? activeActionDeckLane.label}, where ${companionReviewPathItems.length} explicit companion review paths keep primary and follow-up pivots inspectable instead of flattening them into one mapped jump.`
        : undefined,
    companionReviewPathItems,
    multiWindowCoverageLabel: activeActionDeckLane?.label ?? resolvedReviewSurfaceAction?.label,
    multiWindowCoverageSummary:
      activeActionDeckLane && multiWindowCoverageItems.length
        ? `${resolvedReviewSurfaceAction?.label ?? "The active review surface"} keeps ${multiWindowCoverageItems.length} mapped window, lane, board, and observability paths visible through ${activeActionDeckLane.label}, while ${companionRouteStateItems.length} route states, ${companionSequenceStepItems.length} ordered companion steps, and ${companionReviewPathItems.length} typed companion review paths keep the same navigation sequence explicit inside the local-only command flow.`
        : undefined,
    multiWindowCoverageItems,
    nextStepBoardLabel: activeNextStepBoard?.label,
    nextStepBoardSummary: activeNextStepBoard?.summary,
    nextStepItems,
    historyTitle: data.commandSurface.history.title,
    historySummary: data.commandSurface.history.summary,
    historyEntries,
    groupLabels: (activeContextualFlow?.groupIds ?? [])
      .map((groupId) => data.commandSurface.actionGroups.find((group) => group.id === groupId)?.label)
      .filter((label): label is string => Boolean(label)),
    recommendedAction,
    followUpActions,
    steps: contextualSteps,
    shortcuts: activeShortcuts,
    onRunFlow: () => {
      if (recommendedAction) {
        executeCommand(recommendedAction);
        return;
      }

      if (activeSequence?.actionIds[0]) {
        const fallbackAction = actionById.get(activeSequence.actionIds[0]);
        if (fallbackAction) {
          executeCommand(fallbackAction);
        }
      }
    },
    onRunAction: (action) => {
      executeCommand(action);
    },
    onRunActionDeckLane: (laneId) => {
      const lane = activeActionDeck?.lanes.find((entry) => entry.id === laneId);

      if (!lane) {
        return;
      }

      const rememberedSelection = resolveRememberedReviewCoverageSelection(lane.id);
      const rememberedActionCandidate = rememberedSelection?.reviewSurfaceActionId
        ? actionById.get(rememberedSelection.reviewSurfaceActionId)
        : undefined;
      const rememberedAction = isReviewCoverageAction(rememberedActionCandidate) ? rememberedActionCandidate : null;

      if (rememberedAction && rememberedSelection) {
        applyReviewCoverageAction(rememberedAction, {
          actionDeckLaneId: lane.id,
          selectionOverride: rememberedSelection,
          transitionKind: "resume-history"
        });
        return;
      }

      const primaryAction = actionById.get(lane.primaryActionId);
      if (isReviewCoverageAction(primaryAction)) {
        applyReviewCoverageAction(primaryAction, {
          actionDeckLaneId: lane.id
        });
      } else if (primaryAction) {
        const companionRouteStateId = resolveCompanionRouteStateId(lane, reviewCoverageSelection.reviewSurfaceActionId, lane.companionSequences?.[0]?.id ?? null);
        const companionSequenceId =
          resolveCompanionSequenceId(lane, reviewCoverageSelection.reviewSurfaceActionId, companionRouteStateId) ??
          lane.companionSequences?.[0]?.id ??
          null;
        commitReviewCoverageSelection(
          {
            actionDeckLaneId: lane.id,
            companionRouteStateId,
            companionSequenceId,
            companionRouteHistoryEntryId: resolveCompanionRouteHistoryEntryId(
              lane,
              reviewCoverageSelection.reviewSurfaceActionId,
              companionRouteStateId,
              companionSequenceId,
              resolveCompanionPathHandoffId(lane, reviewCoverageSelection.reviewSurfaceActionId, companionRouteStateId, companionSequenceId)
            ),
            companionPathHandoffId: resolveCompanionPathHandoffId(
              lane,
              reviewCoverageSelection.reviewSurfaceActionId,
              companionRouteStateId,
              companionSequenceId
            ),
            reviewSurfaceActionId: reviewCoverageSelection.reviewSurfaceActionId,
            deliveryStageId: lane.focusDeliveryChainStageId ?? lane.deliveryChainStageIds?.[0] ?? null,
            windowId: lane.focusWindowId ?? lane.windowIds?.[0] ?? null,
            sharedStateLaneId: lane.focusSharedStateLaneId ?? lane.sharedStateLaneIds?.[0] ?? null,
            orchestrationBoardId: lane.focusOrchestrationBoardId ?? lane.orchestrationBoardIds?.[0] ?? null,
            observabilityMappingId: lane.focusObservabilityMappingId ?? lane.observabilityMappingIds?.[0] ?? null
          },
          {
            recordHistory: false
          }
        );
        executeCommand(primaryAction);
      } else {
        const companionRouteStateId = resolveCompanionRouteStateId(lane, reviewCoverageSelection.reviewSurfaceActionId, lane.companionSequences?.[0]?.id ?? null);
        const companionSequenceId =
          resolveCompanionSequenceId(lane, reviewCoverageSelection.reviewSurfaceActionId, companionRouteStateId) ??
          lane.companionSequences?.[0]?.id ??
          null;
        commitReviewCoverageSelection(
          {
            actionDeckLaneId: lane.id,
            companionRouteStateId,
            companionSequenceId,
            companionRouteHistoryEntryId: resolveCompanionRouteHistoryEntryId(
              lane,
              reviewCoverageSelection.reviewSurfaceActionId,
              companionRouteStateId,
              companionSequenceId,
              resolveCompanionPathHandoffId(lane, reviewCoverageSelection.reviewSurfaceActionId, companionRouteStateId, companionSequenceId)
            ),
            companionPathHandoffId: resolveCompanionPathHandoffId(
              lane,
              reviewCoverageSelection.reviewSurfaceActionId,
              companionRouteStateId,
              companionSequenceId
            ),
            reviewSurfaceActionId: reviewCoverageSelection.reviewSurfaceActionId,
            deliveryStageId: lane.focusDeliveryChainStageId ?? lane.deliveryChainStageIds?.[0] ?? null,
            windowId: lane.focusWindowId ?? lane.windowIds?.[0] ?? null,
            sharedStateLaneId: lane.focusSharedStateLaneId ?? lane.sharedStateLaneIds?.[0] ?? null,
            orchestrationBoardId: lane.focusOrchestrationBoardId ?? lane.orchestrationBoardIds?.[0] ?? null,
            observabilityMappingId: lane.focusObservabilityMappingId ?? lane.observabilityMappingIds?.[0] ?? null
          },
          {
            recordHistory: false
          }
        );
      }
    },
    onRunCompanionSequence: handleRunCompanionSequence,
    onRunCompanionRouteHistory: handleRunCompanionRouteHistory
  };
  function handleRunReviewSurfaceAction(action: StudioCommandAction) {
    if (isReviewCoverageAction(action)) {
      applyReviewCoverageAction(action);
      return;
    }

    executeCommand(action);
  }
  function handleRunCompanionSequence(sequenceId: string) {
    const companionSequence = activeActionDeckLane?.companionSequences?.find((sequence) => sequence.id === sequenceId) ?? null;
    const sourceAction = companionSequence?.steps[0]?.actionId ? actionById.get(companionSequence.steps[0].actionId) : undefined;
    const companionRouteStateId = resolveCompanionRouteStateId(activeActionDeckLane, sourceAction?.id ?? null, sequenceId);

    if (isReviewCoverageAction(sourceAction)) {
      applyReviewCoverageAction(sourceAction, {
        actionDeckLaneId: activeActionDeckLane?.id ?? reviewCoverageSelection.actionDeckLaneId,
        companionRouteStateId,
        companionSequenceId: sequenceId,
        transitionKind: "switch-sequence"
      });
      return;
    }

    commitReviewCoverageSelection({
      actionDeckLaneId: activeActionDeckLane?.id ?? reviewCoverageSelection.actionDeckLaneId,
      companionRouteStateId,
      companionSequenceId: sequenceId,
      companionRouteHistoryEntryId: resolveCompanionRouteHistoryEntryId(
        activeActionDeckLane,
        reviewCoverageSelection.reviewSurfaceActionId,
        companionRouteStateId,
        sequenceId,
        resolveCompanionPathHandoffId(activeActionDeckLane, reviewCoverageSelection.reviewSurfaceActionId, companionRouteStateId, sequenceId)
      ),
      companionPathHandoffId: resolveCompanionPathHandoffId(
        activeActionDeckLane,
        reviewCoverageSelection.reviewSurfaceActionId,
        companionRouteStateId,
        sequenceId
      ),
      reviewSurfaceActionId: reviewCoverageSelection.reviewSurfaceActionId,
      deliveryStageId: reviewCoverageSelection.deliveryStageId,
      windowId: reviewCoverageSelection.windowId,
      sharedStateLaneId: reviewCoverageSelection.sharedStateLaneId,
      orchestrationBoardId: reviewCoverageSelection.orchestrationBoardId,
      observabilityMappingId: reviewCoverageSelection.observabilityMappingId
    }, {
      transitionKind: "switch-sequence"
    });
  }
  function handleRunCompanionRouteHistory(entryId: string) {
    const historyEntry: CompanionRouteHistoryMemoryEntry | null = companionRouteHistory.find((entry) => entry.id === entryId) ?? null;
    const nextSelection = historyEntry?.nextSelection ?? null;
    const historyActionCandidate = nextSelection?.reviewSurfaceActionId ? actionById.get(nextSelection.reviewSurfaceActionId) : undefined;

    if (nextSelection && isReviewCoverageAction(historyActionCandidate)) {
      applyReviewCoverageAction(historyActionCandidate, {
        actionDeckLaneId: nextSelection.actionDeckLaneId,
        selectionOverride: nextSelection,
        transitionKind: "resume-history"
      });
      return;
    }

    const contractHistoryEntry = relevantCompanionRouteHistoryEntries.find((entry) => entry.id === entryId) ?? null;
    const contractActionCandidate = contractHistoryEntry ? actionById.get(contractHistoryEntry.targetActionId) : undefined;

    if (contractHistoryEntry && isReviewCoverageAction(contractActionCandidate)) {
      const handoffId = resolveCompanionPathHandoffId(
        activeActionDeckLane,
        contractActionCandidate.id,
        contractHistoryEntry.routeStateId ?? null,
        contractHistoryEntry.sequenceId ?? null
      );

      applyReviewCoverageAction(contractActionCandidate, {
        actionDeckLaneId: activeActionDeckLane?.id ?? reviewCoverageSelection.actionDeckLaneId,
        companionRouteStateId: contractHistoryEntry.routeStateId ?? null,
        companionSequenceId: contractHistoryEntry.sequenceId ?? null,
        selectionOverride: {
          actionDeckLaneId: activeActionDeckLane?.id ?? reviewCoverageSelection.actionDeckLaneId,
          companionRouteStateId: contractHistoryEntry.routeStateId ?? null,
          companionSequenceId: contractHistoryEntry.sequenceId ?? null,
          companionRouteHistoryEntryId: contractHistoryEntry.id,
          companionPathHandoffId: handoffId,
          reviewSurfaceActionId: contractActionCandidate.id,
          deliveryStageId: contractHistoryEntry.deliveryChainStageId ?? contractActionCandidate.deliveryChainStageId ?? null,
          windowId: contractHistoryEntry.windowId ?? contractActionCandidate.windowId ?? null,
          sharedStateLaneId: contractHistoryEntry.sharedStateLaneId ?? contractActionCandidate.sharedStateLaneId ?? null,
          orchestrationBoardId: contractHistoryEntry.orchestrationBoardId ?? contractActionCandidate.orchestrationBoardId ?? null,
          observabilityMappingId: contractHistoryEntry.observabilityMappingId ?? contractActionCandidate.observabilityMappingId ?? null
        },
        transitionKind: "resume-history"
      });
    }
  }
  function handleSelectDeliveryStage(stageId: string) {
    const matchingAction =
      activeActionDeckReviewSurfaceActions.find((action) => action.deliveryChainStageId === stageId) ??
      reviewCoverageActions.find((action) => action.deliveryChainStageId === stageId) ??
      null;

    if (matchingAction) {
      applyReviewCoverageAction(matchingAction);
      return;
    }

    commitReviewCoverageSelection({
      actionDeckLaneId: reviewCoverageSelection.actionDeckLaneId,
      companionRouteStateId: null,
      companionSequenceId: null,
      companionRouteHistoryEntryId: null,
      companionPathHandoffId: null,
      reviewSurfaceActionId: null,
      deliveryStageId: stageId,
      windowId: reviewCoverageSelection.windowId,
      sharedStateLaneId: reviewCoverageSelection.sharedStateLaneId,
      orchestrationBoardId: reviewCoverageSelection.orchestrationBoardId,
      observabilityMappingId: reviewCoverageSelection.observabilityMappingId
    }, {
      recordHistory: false
    });
  }
  const crossViewCoordinationMatrix = [
    {
      id: "cross-view-route-flow",
      label: "Route -> Command flow",
      value: `${activePageMeta.label} -> ${activeContextualFlow?.label ?? activeSequence?.label ?? "No active flow"}`,
      detail: "The current route and the active command flow now stay reviewable as one local shell chain."
    },
    {
      id: "cross-view-flow-board",
      label: "Flow -> Next-step board",
      value: `${activeSequence?.label ?? "No active sequence"} -> ${activeNextStepBoard?.label ?? "No next-step board"}`,
      detail: "Recommended next actions and route-aware boards now stay linked instead of surfacing as isolated buttons."
    },
    {
      id: "cross-view-action-deck",
      label: "Action deck -> Delivery / windows",
      value: activeActionDeck
        ? `${activeActionDeck.label} -> ${activeActionDeckDeliveryStageIds.length} stages / ${activeActionDeckWindowIds.length} windows / ${activeActionDeckBoardIds.length} boards`
        : "No active action deck",
      detail:
        "Review-deck orchestration now carries explicit delivery-stage and multi-window coverage instead of leaving the command surface detached from downstream review posture."
    },
    {
      id: "cross-view-window-shell",
      label: "Workspace -> Detached -> Intent",
      value: `${workspaceView?.label ?? "No workspace"} -> ${selectedDetachedPanel?.label ?? "No detached candidate"} -> ${selectedWindowIntent?.label ?? "No intent"}`,
      detail: "Workspace entry, detached candidate, and intent focus stay synchronized across the main panel, windows rail, and dock."
    },
    {
      id: "cross-view-window-shared-state",
      label: "Window roster -> Shared-state lane",
      value: `${activeWindowRosterEntry?.label ?? "No window"} -> ${activeSharedStateLane?.label ?? "No shared-state lane"}`,
      detail: "Ownership, sync health, last handoff, and blockers now stay explicit instead of being implied by the active tab posture."
    },
    {
      id: "cross-view-review-posture",
      label: "Review Posture Ownership",
      value: activeObservabilityMapping
        ? `${activeObservabilityMapping.owner} -> ${activeObservabilityMapping.reviewPosture.stageLabel}`
        : "No active review posture",
      detail:
        "The active route, window, lane, orchestration board, reviewer queue, acknowledgement, escalation, closeout, and focused slot now resolve through one explicit observability row."
    },
    {
      id: "cross-view-slot-release",
      label: "Focused slot -> Release posture",
      value: `${hostTraceFocus?.slot.label ?? "No focused slot"} -> ${currentReleaseStage?.label ?? "Operator review board"} / ${currentDecisionHandoff.posture}`,
      detail:
        "Focused-slot review, operator board ownership, reviewer queue state, escalation timing, decision handoff posture, evidence closeout, and the delivery-chain stage explorer now sit in the same phase60 local-only review chain without enabling host execution, installer work, staged apply entry, cutover execution, or publish rollback."
    }
  ];
  const inspectorCommandLinkage = [
    {
      id: "inspector-linkage-flow",
      label: "Inspector -> Command flow",
      value: activeContextualFlow?.label ?? activeSequence?.label ?? "No active flow",
      detail: "The right rail now mirrors the same flow label and recommendation state used by the contextual command panel."
    },
    {
      id: "inspector-linkage-board",
      label: "Inspector -> Next-step board",
      value: activeNextStepBoard?.label ?? "No next-step board",
      detail: "Inspector drilldowns now stay tied to the same route-aware next-step board that drives the current page."
    },
    {
      id: "inspector-linkage-action-deck",
      label: "Inspector -> Action deck",
      value: activeActionDeck ? `${activeActionDeck.label} / ${activeActionDeck.lanes.length} lanes` : "No action deck",
      detail: "Inspector drilldowns can now be compared against the same review-deck action deck that maps delivery-stage and window coverage."
    },
    {
      id: "inspector-linkage-window",
      label: "Inspector -> Orchestration board",
      value: `${selectedWorkflowLane?.label ?? "No workflow lane"} / ${selectedWindowIntent?.label ?? "No intent"}`,
      detail: "Workflow lane, intent focus, and detached candidate posture are surfaced together instead of living in separate shell areas."
    },
    {
      id: "inspector-linkage-shared-state",
      label: "Inspector -> Shared-state lane",
      value: `${activeWindowRosterEntry?.label ?? "No window"} / ${activeSharedStateLane?.label ?? "No shared-state lane"}`,
      detail: "The right rail now mirrors the same window roster, sync health, last handoff, reviewer queue, and operator review posture shown in the phase60 cross-window board."
    },
    {
      id: "inspector-linkage-review-posture",
      label: "Inspector -> Review posture",
      value: activeObservabilityMapping
        ? `${activeObservabilityMapping.label} / ${formatReviewPostureRelationship(activeObservabilityMapping.relationship)}`
        : "No active review posture",
      detail: "The right rail now calls out which route, window, lane, and board currently own the live review posture and which other windows map to it."
    }
  ];
  const inspectorReviewConsoleLines = [
    {
      id: "inspector-review-pack",
      label: "Replay pack",
      value: activeReplayScenarioPack
        ? `${activeReplayScenarioPack.label} / ${activeReplayScenarioPack.acceptancePosture}`
        : "No replay pack",
      detail:
        activeReplayScenarioPack?.summary ??
        "No reviewer-facing replay pack is currently attached to the active review lane."
    },
    {
      id: "inspector-review-verdict",
      label: "Final Verdict Console",
      value: `${activeReplayScenarioLabel} / ${activeReplayScenarioVerdict}`,
      detail:
        activeCompanionRouteHistoryEntry?.reviewerSignoff?.summary ??
        "No reviewer verdict summary is currently attached to the active route replay entry."
    },
    {
      id: "inspector-review-route",
      label: "Settlement route anchor",
      value: `${resolvedDeliveryCoverageStage?.label ?? "No stage"} / ${resolvedCoverageWindow?.label ?? "No window"} / ${
        resolvedCoverageLane?.label ?? "No lane"
      } / ${resolvedCoverageBoard?.label ?? "No board"}`,
      detail:
        activeCompanionRouteState?.summary ??
        "Route, window, lane, and board ownership are currently inferred from the active review coverage selection."
    },
    {
      id: "inspector-review-evidence",
      label: "Evidence chain",
      value: activeReplayScenarioEvidenceSummary,
      detail: activeReplayScenarioReadingSummary
    },
    {
      id: "inspector-review-closeout-timeline",
      label: "Acceptance closeout timeline",
      value: activeReplayCloseoutTimelineLabel,
      detail:
        activeCompanionRouteHistoryEntry?.reviewerWalkthrough?.summary ??
        "No replay closeout timeline is currently attached to the active route replay entry."
    },
    {
      id: "inspector-review-observability-closeout",
      label: "Multi-window closeout",
      value: activeReplayObservabilityCloseoutLabel,
      detail:
        activeObservabilityMapping?.summary ??
        "No active review posture currently links verdict settlement back into the windows observability map."
    },
    {
      id: "inspector-review-handoff",
      label: "Next handoff",
      value: `${activeReplayVerdictStateLabel} / ${activeReplayScenarioNextHandoff}`,
      detail:
        activeCompanionPathHandoff?.summary ??
        activeCompanionRouteHistoryEntry?.summary ??
        "No stabilized reviewer handoff is currently attached to the active review surface."
    },
    {
      id: "inspector-review-pack-closeout",
      label: "Pack closeout queue",
      value: `${activeReplayPackReadyCount} ready / ${activeReplayPackInReviewCount} in review / ${activeReplayPackBlockedCount} blocked`,
      detail:
        activeReplayScenarioPack?.continuitySummary ??
        "No replay pack closeout queue is currently attached to the active review lane."
    }
  ];
  const releasePipelineDepth = [
    {
      id: "release-depth-manifest",
      label: "Formal Release Readiness",
      value: "RELEASE-MANIFEST / BUILD-METADATA / REVIEW-MANIFEST",
      detail:
        "Phase60 keeps the manifest spine and now layers a clearer delivery-chain workspace on top of the operator review loop, so board ownership, queues, acknowledgement timing, delivery stages, artifacts, and cross-window review posture stay linked without executing anything."
    },
    {
      id: "release-depth-delivery-chain",
      label: "Delivery-chain Workspace",
      value: currentDeliveryStage ? `${currentDeliveryStage.label} / ${currentDeliveryStage.phase}` : "Unavailable",
      detail:
        "The active board now resolves into a typed delivery-chain stage, so attestation intake, operator review, promotion readiness, publish gating, and rollback readiness read like one delivery workflow instead of a disconnected artifact tail."
    },
    {
      id: "release-depth-promotion-flow",
      label: "Promotion Review Flow",
      value: "promotion readiness / staged apply closeout",
      detail:
        "Promotion evidence, apply readiness, checkpoints, staged apply ledgers, command sheets, confirmation ledgers, closeout journals, signoff sheets, and decision-enforcement lifecycle now sit in one explicit promotion review path."
    },
    {
      id: "release-depth-publish-flow",
      label: "Publish Review Flow",
      value: publishDeliveryStage ? `${publishDeliveryStage.label} / ${publishDeliveryStage.status}` : "Unavailable",
      detail:
        "Signing metadata, notarization plan, signing-publish handshakes, release notes, publish gates, and promotion gates now read like one publish-facing decision gate."
    },
    {
      id: "release-depth-rollback-flow",
      label: "Rollback Review Flow",
      value: rollbackDeliveryStage ? `${rollbackDeliveryStage.label} / ${rollbackDeliveryStage.status}` : "Unavailable",
      detail:
        "Publish rollback handshake, recovery ledgers, rehearsal drillbooks, live-readiness contracts, cutover records, outcome reports, and receipt settlement closeout now read like one recovery-facing review path."
    },
    {
      id: "release-depth-operator-review-board",
      label: "Operator Review Board",
      value: "OPERATOR-REVIEW-BOARD / RELEASE-APPROVAL-WORKFLOW",
      detail: "The current slice turns approval routing into a first-class operator board with stage ownership, review packet posture, and cross-links back into trace and shared-state surfaces."
    },
    {
      id: "release-depth-reviewer-queue",
      label: "Reviewer Queue",
      value: "queue ownership / acknowledgement state",
      detail: "Reviewer queues now expose who owns the current board, who is waiting to acknowledge, and which window/shared-state lane is carrying the queue."
    },
    {
      id: "release-depth-observability",
      label: "Cross-window Observability Map",
      value: "route / window / lane / board ownership",
      detail:
        "The current slice adds an explicit ownership map so the shell can show which route, window, shared-state lane, orchestration board, queue, acknowledgement, escalation window, closeout window, and focused slot currently own the review posture."
    },
    {
      id: "release-depth-escalation-window",
      label: "Escalation Window",
      value: "escalation deadline / trigger",
      detail: "Escalation timing is now first-class instead of being implied by generic pending text on the baton."
    },
    {
      id: "release-depth-closeout-window",
      label: "Closeout Window",
      value: "closeout timing / sealed vs pending",
      detail: "Closeout timing is now explicit and stays tied to the same queue and evidence objects rather than hiding inside closeout summaries."
    },
    {
      id: "release-depth-decision-handoff",
      label: "Decision Handoff",
      value: "RELEASE-DECISION-HANDOFF / baton posture",
      detail: "Decision handoff is now a first-class review contract, so baton posture and downstream ownership are explicit instead of implied by generic lifecycle wording."
    },
    {
      id: "release-depth-evidence-closeout",
      label: "Evidence Closeout",
      value: "REVIEW-EVIDENCE-CLOSEOUT / sealed evidence / reviewer notes",
      detail: "Evidence closeout now carries sealing state, pending evidence, and reviewer notes directly instead of hiding closeout posture inside larger release JSON lists."
    },
    {
      id: "release-depth-bundles",
      label: "Bundle Assembly Skeleton",
      value: "BUNDLE-MATRIX / BUNDLE-ASSEMBLY",
      detail: "Per-platform bundle targets still have an explicit assembly skeleton between artifact snapshot and later materialization work."
    },
    {
      id: "release-depth-directory-materialization",
      label: "Packaged-app Directory Materialization",
      value: "PACKAGED-APP-DIRECTORY-SKELETON / PACKAGED-APP-DIRECTORY-MATERIALIZATION",
      detail:
        "Packaged app directory plans now map into explicit per-platform staging roots, launcher paths, and verification manifests, and the Stage Explorer reads them back as the first task inside the same local-only materialization contract without creating any real packaged app."
    },
    {
      id: "release-depth-local-materialization-contract",
      label: "Packaged-app Local Materialization Contract",
      value: activeMaterializationPlatform
        ? `${formatPackagedAppPlatform(activeMaterializationPlatform.platform)} / ${formatMaterializationTaskState(activeMaterializationPlatform.taskState)}${
            activeMaterializationValidatorSurface.activeReadout
              ? ` / ${activeMaterializationValidatorSurface.activeReadout.label}`
              : activeStagedOutputStep
                ? ` / ${activeStagedOutputStep.label}`
                : activeMaterializationTask
                  ? ` / ${activeMaterializationTask.label}`
                  : ""
          }${activeMaterializationProgress ? ` / ${activeMaterializationProgress.completedTaskCount + 1}/${activeMaterializationProgress.totalTaskCount} checkpoints` : ""}`
        : "Unavailable",
      detail:
        "The packaged-app materialization contract now exposes per-platform staged-output chain steps, bundle-sealing readiness, local progression, and validator-linked observability alongside task evidence and delivery-stage linkage, so the review lane reads like one orchestrated local handoff spine instead of only flat path metadata."
    },
    {
      id: "release-depth-materialization-artifact-ledger",
      label: "Materialization Artifact Ledger",
      value: activeMaterializationArtifactSurface.activeHandoff
        ? `${activeMaterializationArtifactSurface.activeHandoff.label} / ${formatMaterializationValidatorStatus(
            activeMaterializationArtifactSurface.activeHandoff.status
          )} / ${activeMaterializationArtifactSurface.sourceArtifacts.length} -> ${
            activeMaterializationArtifactSurface.targetArtifacts.length
          } artifacts`
        : "Unavailable",
      detail:
        "The local materialization contract now carries a source-to-seal artifact ledger that ties built renderer/Electron inputs to directory verification, staged-output manifests, and seal/integrity metadata, so the Stage Explorer, windows board, and inspector can read the same concrete handoff chain without implying execution."
    },
    {
      id: "release-depth-materialization-artifact-checkpoint-progression",
      label: "Materialization Artifact Checkpoint Progression",
      value: activeMaterializationArtifactProgression.currentHandoff
        ? `${artifactCurrentToNextHandoffLabel} / ${
            activeMaterializationArtifactSurface.stageCCheckpoint?.label ??
            activeMaterializationArtifactSurface.bundleSealingCheckpoint?.label ??
            "No Stage C link"
          }`
        : "Unavailable",
      detail:
        "The artifact ledger now keeps the active handoff, next handoff, and their linked seal / failure / Stage C surfaces readable as one current-to-next local-only progression instead of a loose set of adjacent checkpoint cards."
    },
    {
      id: "release-depth-materialization-validator-bridge",
      label: "Materialization Validator Bridge",
      value: activeMaterializationValidatorSurface.activeReadout
        ? `${activeMaterializationValidatorSurface.activeReadout.label} / ${formatMaterializationValidatorStatus(
            activeMaterializationValidatorSurface.activeReadout.status
          )} / ${activeMaterializationValidatorSurface.observabilityMapping?.label ?? activeMaterializationValidatorSurface.activeReadout.observabilityMappingId}`
        : "Unavailable",
      detail:
        "The packaged-app materialization contract now carries a validator / observability bridge that maps the current local-only slice onto concrete window, lane, board, and observability surfaces, so inspector and windows readouts can stay aligned with the same progression contract."
    },
    {
      id: "release-depth-staged-output",
      label: "Packaged-app Staged Output Skeleton",
      value: activeStagedOutputChain
        ? `${activeStagedOutputChain.steps.length} staged steps / ${activeStagedOutputStep?.label ?? "No active step"}`
        : "PACKAGED-APP-STAGED-OUTPUT-SKELETON",
      detail:
        "Directory materialization now feeds an explicit staged-output chain with verification, output-manifest, and checksum-manifest checkpoints, and the Stage Explorer keeps that sequence visible next to the same per-platform materialization contract without creating real packaged artifacts."
    },
    {
      id: "release-depth-bundle-sealing",
      label: "Packaged-app Bundle Sealing Skeleton",
      value: activeBundleSealingReadiness
        ? `${formatMaterializationTaskState(activeBundleSealingReadiness.taskState)} / ${activeBundleSealingReadiness.currentCheckpoint}`
        : "PACKAGED-APP-BUNDLE-SEALING-SKELETON",
      detail:
        "Staged outputs now feed an explicit bundle-sealing readiness object with current checkpoint, seal paths, and downstream gate linkage, and the Stage Explorer keeps that posture inspectable without freezing or signing any real packaged bundle."
    },
    {
      id: "release-depth-bundle-integrity",
      label: "Sealed-bundle Integrity Contract",
      value: "SEALED-BUNDLE-INTEGRITY-CONTRACT",
      detail: "Bundle sealing metadata now feeds explicit integrity, digest, and audit checkpoints without attesting any real packaged bundle."
    },
    {
      id: "release-depth-integrity-attestation",
      label: "Integrity Attestation Evidence",
      value: "INTEGRITY-ATTESTATION-EVIDENCE / SEALED-BUNDLE-INTEGRITY-CONTRACT",
      detail: "Integrity contracts now feed explicit attestation packets, verifier inputs, and audit receipts without attesting any live release for real."
    },
    {
      id: "release-depth-attestation-verification-packs",
      label: "Attestation Verification Packs",
      value: "ATTESTATION-VERIFICATION-PACKS / INTEGRITY-ATTESTATION-EVIDENCE",
      detail: "Integrity attestation evidence now feeds verifier-ready packs, checklists, and audit handoff payloads without executing any live verification for real."
    },
    {
      id: "release-depth-attestation-apply-audit-packs",
      label: "Attestation Apply Audit Packs",
      value: "ATTESTATION-APPLY-AUDIT-PACKS / ATTESTATION-VERIFICATION-PACKS",
      detail: "Verification packs now feed route-aware apply-audit bundles, review checklists, and receipts without executing any live verification or apply step for real."
    },
    {
      id: "release-depth-attestation-apply-execution-packets",
      label: "Attestation Apply Execution Packets",
      value: "ATTESTATION-APPLY-EXECUTION-PACKETS / ATTESTATION-APPLY-AUDIT-PACKS",
      detail: "Apply-audit bundles now feed operator-reviewed execution packets, packet receipts, and pre-apply envelopes without executing any live verification or apply step for real."
    },
    {
      id: "release-depth-attestation-operator-worklists",
      label: "Attestation Operator Worklists",
      value: "ATTESTATION-OPERATOR-WORKLISTS / ATTESTATION-APPLY-EXECUTION-PACKETS",
      detail: "Execution packets now feed per-role intake queues, acknowledgement slots, and ownership scaffolds that anchor later dispatch manifests without dispatching any live operator action for real."
    },
    {
      id: "release-depth-attestation-operator-dispatch-manifests",
      label: "Attestation Operator Dispatch Manifests",
      value: "ATTESTATION-OPERATOR-DISPATCH-MANIFESTS / ATTESTATION-OPERATOR-WORKLISTS",
      detail: "Operator worklists now feed explicit dispatch envelopes, acknowledgement deadlines, and escalation routes without dispatching any live operator action for real."
    },
    {
      id: "release-depth-attestation-operator-dispatch-packets",
      label: "Attestation Operator Dispatch Packets",
      value: "ATTESTATION-OPERATOR-DISPATCH-PACKETS / ATTESTATION-OPERATOR-DISPATCH-MANIFESTS",
      detail: "Dispatch manifests now feed role-targeted packet bundles, acknowledgement payloads, and receipt slots without dispatching any live operator action for real."
    },
    {
      id: "release-depth-attestation-operator-dispatch-receipts",
      label: "Attestation Operator Dispatch Receipts",
      value: "ATTESTATION-OPERATOR-DISPATCH-RECEIPTS / ATTESTATION-OPERATOR-DISPATCH-PACKETS",
      detail: "Dispatch packets now feed acknowledgement capture, reconciliation inputs, and escalation closeout anchors without dispatching any live operator action for real."
    },
    {
      id: "release-depth-attestation-operator-reconciliation-ledgers",
      label: "Attestation Operator Reconciliation Ledgers",
      value: "ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS / ATTESTATION-OPERATOR-DISPATCH-RECEIPTS",
      detail:
        "Dispatch receipts now feed operator settlement ledgers, unresolved acknowledgement closeout, and approval-ready summaries without reconciling any live operator action for real."
    },
    {
      id: "release-depth-attestation-operator-settlement-packs",
      label: "Attestation Operator Settlement Packs",
      value: "ATTESTATION-OPERATOR-SETTLEMENT-PACKS / ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS",
      detail:
        "Reconciliation ledgers now feed operator clearance packets, escalation disposition bundles, and release approval attachments without routing any live operator settlement for real."
    },
    {
      id: "release-depth-attestation-operator-approval-routing-contracts",
      label: "Attestation Operator Approval Routing Contracts",
      value: "ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS / ATTESTATION-OPERATOR-SETTLEMENT-PACKS",
      detail:
        "Settlement packs now feed reviewer-ready routing tables, approval windows, and release-approval handoff routes without dispatching any live approval or execution for real."
    },
    {
      id: "release-depth-attestation-operator-approval-orchestration",
      label: "Attestation Operator Approval Orchestration",
      value: "ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION / ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS",
      detail:
        "Approval routing contracts now feed reviewer baton sequencing, approval quorum timing, and orchestration closeout paths without dispatching any live approval or execution for real."
    },
    {
      id: "release-depth-installer-builders",
      label: "Installer-target Builder Skeleton",
      value: "INSTALLER-TARGETS / INSTALLER-TARGET-BUILDER-SKELETON",
      detail: "Installer targets still map cleanly to review-only builder identities instead of staying as isolated metadata."
    },
    {
      id: "release-depth-installer-execution",
      label: "Installer Builder Execution Skeleton",
      value: "INSTALLER-BUILDER-EXECUTION-SKELETON",
      detail: "Future builder commands, environments, outputs, and review checks are now declared without invoking any real builder."
    },
    {
      id: "release-depth-installer-orchestration",
      label: "Installer Builder Orchestration",
      value: "INSTALLER-BUILDER-ORCHESTRATION",
      detail: "Per-platform builder execution skeletons now sit inside explicit orchestration flows without invoking any real builder."
    },
    {
      id: "release-depth-installer-channel-routing",
      label: "Installer Channel Routing",
      value: "INSTALLER-CHANNEL-ROUTING",
      detail: "Review-only installer outputs now map into explicit alpha/beta/stable routing manifests without routing any artifact for real."
    },
    {
      id: "release-depth-release-qa-closeout-readiness",
      label: "Release QA Closeout Readiness",
      value: "RELEASE-QA-CLOSEOUT-READINESS / RELEASE-CHECKLIST / RELEASE-SUMMARY",
      detail:
        "Packaged-app materialization continuity, installer/signing/notarization handshake verification, checklist proof, and delivery closeout posture now stay grouped as one local-only QA surface without building, signing, or publishing anything."
    },
    {
      id: "release-depth-channel-promotion-evidence",
      label: "Channel Promotion Evidence",
      value: "CHANNEL-PROMOTION-EVIDENCE / INSTALLER-CHANNEL-ROUTING",
      detail: "Channel routing now feeds explicit alpha -> beta -> stable promotion evidence packets without promoting any artifact for real."
    },
    {
      id: "release-depth-promotion-apply-readiness",
      label: "Promotion Apply Readiness",
      value: "PROMOTION-APPLY-READINESS / CHANNEL-PROMOTION-EVIDENCE",
      detail: "Promotion evidence now feeds explicit apply-readiness manifests, reviewer inputs, and channel preflight packets without applying any promotion for real."
    },
    {
      id: "release-depth-promotion-apply-manifests",
      label: "Promotion Apply Manifests",
      value: "PROMOTION-APPLY-MANIFESTS / PROMOTION-APPLY-READINESS",
      detail: "Promotion readiness now feeds explicit apply manifests, rollout ordering, and rollback anchors without applying any promotion for real."
    },
    {
      id: "release-depth-promotion-execution-checkpoints",
      label: "Promotion Execution Checkpoints",
      value: "PROMOTION-EXECUTION-CHECKPOINTS / PROMOTION-APPLY-MANIFESTS",
      detail: "Promotion apply manifests now feed explicit checkpoint contracts, hold points, and rollback drillbook anchors without executing any promotion for real."
    },
    {
      id: "release-depth-promotion-operator-handoff-rails",
      label: "Promotion Operator Handoff Rails",
      value: "PROMOTION-OPERATOR-HANDOFF-RAILS / PROMOTION-EXECUTION-CHECKPOINTS",
      detail: "Promotion execution checkpoints now feed operator routing rails, role handoff segments, and rollback readiness anchors without executing any promotion for real."
    },
    {
      id: "release-depth-promotion-staged-apply-ledgers",
      label: "Promotion Staged-apply Ledgers",
      value: "PROMOTION-STAGED-APPLY-LEDGERS / PROMOTION-OPERATOR-HANDOFF-RAILS",
      detail: "Operator handoff rails now feed ordered staged apply journals, freeze windows, and cutover evidence slots that anchor later runsheets without applying any promotion for real."
    },
    {
      id: "release-depth-promotion-staged-apply-runsheets",
      label: "Promotion Staged-apply Runsheets",
      value: "PROMOTION-STAGED-APPLY-RUNSHEETS / PROMOTION-STAGED-APPLY-LEDGERS",
      detail: "Staged-apply ledgers now feed operator-ready stage sequencing, hold points, and cutover baton scripts without applying any promotion for real."
    },
    {
      id: "release-depth-promotion-staged-apply-command-sheets",
      label: "Promotion Staged-apply Command Sheets",
      value: "PROMOTION-STAGED-APPLY-COMMAND-SHEETS / PROMOTION-STAGED-APPLY-RUNSHEETS",
      detail: "Runsheets now feed gated stage commands, confirmation blocks, and receipt stubs without applying any promotion for real."
    },
    {
      id: "release-depth-promotion-staged-apply-confirmation-ledgers",
      label: "Promotion Staged-apply Confirmation Ledgers",
      value: "PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS / PROMOTION-STAGED-APPLY-COMMAND-SHEETS",
      detail: "Command sheets now feed stage acceptance journals, cutover confirmation blocks, and closeout inputs without applying any promotion for real."
    },
    {
      id: "release-depth-promotion-staged-apply-closeout-journals",
      label: "Promotion Staged-apply Closeout Journals",
      value: "PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS / PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS",
      detail:
        "Confirmation ledgers now feed stage closeout seals, recovery batons, and publish-ready cutover journals without applying any promotion for real."
    },
    {
      id: "release-depth-promotion-staged-apply-signoff-sheets",
      label: "Promotion Staged-apply Signoff Sheets",
      value: "PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS / PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS",
      detail:
        "Closeout journals now feed staged approver sheets, release-ready packets, and go/no-go evidence without applying any promotion for real."
    },
    {
      id: "release-depth-promotion-staged-apply-release-decision-enforcement-contracts",
      label: "Promotion Staged-apply Release Decision Enforcement Contracts",
      value: "PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS / PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS",
      detail:
        "Signoff sheets now feed staged release guardrails, enforcement windows, and publish-route contracts without applying any promotion for real."
    },
    {
      id: "release-depth-promotion-staged-apply-release-decision-enforcement-lifecycle",
      label: "Promotion Staged-apply Release Decision Enforcement Lifecycle",
      value: "PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE / PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS",
      detail:
        "Release decision enforcement contracts now feed lifecycle checkpoints, reviewer baton transitions, and expiry closeout without applying any promotion for real."
    },
    {
      id: "release-depth-signing-publish",
      label: "Signing & Publish Pipeline",
      value: "SIGNING-METADATA / NOTARIZATION-PLAN / SIGNING-PUBLISH-PIPELINE",
      detail: "Signing, notarization, checksums, upload, and publish stages are still visible as one structured pipeline contract."
    },
    {
      id: "release-depth-signing-handshake",
      label: "Signing-publish Gating Handshake",
      value: "SIGNING-PUBLISH-GATING-HANDSHAKE / RELEASE-APPROVAL-WORKFLOW",
      detail: "Signing, publish, approval, integrity, and promotion evidence now flow through a structured handshake contract without approving or publishing anything."
    },
    {
      id: "release-depth-approval-bridge",
      label: "Signing-publish Approval Bridge",
      value: "SIGNING-PUBLISH-APPROVAL-BRIDGE / RELEASE-APPROVAL-WORKFLOW / PUBLISH-GATES",
      detail: "Gating handshake, approval workflow, and publish gates are now linked through one reviewable bridge without executing any approval."
    },
    {
      id: "release-depth-promotion-handshake",
      label: "Signing-publish Promotion Handshake",
      value: "SIGNING-PUBLISH-PROMOTION-HANDSHAKE / CHANNEL-PROMOTION-EVIDENCE / PUBLISH-GATES",
      detail: "Channel routing, promotion evidence, and publish gates now converge in a dedicated review-only promotion handshake."
    },
    {
      id: "release-depth-publish-rollback",
      label: "Publish Rollback Handshake",
      value: "PUBLISH-ROLLBACK-HANDSHAKE / PROMOTION-GATES / RELEASE-NOTES",
      detail: "Publish and promotion review now carry explicit rollback checkpoints and recovery-channel handoff metadata without rolling anything back for real."
    },
    {
      id: "release-depth-rollback-recovery-ledger",
      label: "Rollback Recovery Ledger",
      value: "ROLLBACK-RECOVERY-LEDGER / PUBLISH-ROLLBACK-HANDSHAKE",
      detail: "Rollback checkpoints now feed explicit recovery ledgers, operator notes, and channel recovery manifests without recovering any live publish state."
    },
    {
      id: "release-depth-rollback-execution-rehearsal-ledger",
      label: "Rollback Execution Rehearsal Ledger",
      value: "ROLLBACK-EXECUTION-REHEARSAL-LEDGER / ROLLBACK-RECOVERY-LEDGER",
      detail: "Rollback recovery ledgers now feed rehearsal manifests, dry-run traces, and operator rehearsal notes without executing any live rollback for real."
    },
    {
      id: "release-depth-rollback-operator-drillbooks",
      label: "Rollback Operator Drillbooks",
      value: "ROLLBACK-OPERATOR-DRILLBOOKS / ROLLBACK-EXECUTION-REHEARSAL-LEDGER",
      detail: "Rollback rehearsal ledgers now feed operator drillbooks, response sections, and handoff checklists without operating on any live publish state for real."
    },
    {
      id: "release-depth-rollback-live-readiness-contracts",
      label: "Rollback Live-readiness Contracts",
      value: "ROLLBACK-LIVE-READINESS-CONTRACTS / ROLLBACK-OPERATOR-DRILLBOOKS",
      detail: "Rollback operator drillbooks now feed live-entry readiness checks, recovery proofs, and operator go/no-go contracts without enabling any live rollback for real."
    },
    {
      id: "release-depth-rollback-cutover-readiness-maps",
      label: "Rollback Cutover Readiness Maps",
      value: "ROLLBACK-CUTOVER-READINESS-MAPS / ROLLBACK-LIVE-READINESS-CONTRACTS",
      detail: "Rollback live-readiness contracts now feed channel/platform cutover topology, checkpoint maps, and go/no-go review surfaces that anchor later handoff plans without mutating any live publish state."
    },
    {
      id: "release-depth-rollback-cutover-handoff-plans",
      label: "Rollback Cutover Handoff Plans",
      value: "ROLLBACK-CUTOVER-HANDOFF-PLANS / ROLLBACK-CUTOVER-READINESS-MAPS",
      detail: "Rollback cutover readiness maps now feed owner baton transfers, fallback paths, and recovery handoff sections without mutating any live publish state."
    },
    {
      id: "release-depth-rollback-cutover-execution-checklists",
      label: "Rollback Cutover Execution Checklists",
      value: "ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS / ROLLBACK-CUTOVER-HANDOFF-PLANS",
      detail: "Rollback cutover handoff plans now feed cutover go/no-go sheets, platform checkpoint sweeps, and recovery confirmations without mutating any live publish state."
    },
    {
      id: "release-depth-rollback-cutover-execution-records",
      label: "Rollback Cutover Execution Records",
      value: "ROLLBACK-CUTOVER-EXECUTION-RECORDS / ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS",
      detail:
        "Rollback cutover execution checklists now feed evidence-backed cutover closeout records, recovery-state publications, and rollback outcome inputs without mutating any live publish state."
    },
    {
      id: "release-depth-rollback-cutover-outcome-reports",
      label: "Rollback Cutover Outcome Reports",
      value: "ROLLBACK-CUTOVER-OUTCOME-REPORTS / ROLLBACK-CUTOVER-EXECUTION-RECORDS",
      detail:
        "Rollback cutover execution records now feed recovery digests, outcome publications, and rollback-facing closeout reports without mutating any live publish state."
    },
    {
      id: "release-depth-rollback-cutover-publication-bundles",
      label: "Rollback Cutover Publication Bundles",
      value: "ROLLBACK-CUTOVER-PUBLICATION-BUNDLES / ROLLBACK-CUTOVER-OUTCOME-REPORTS",
      detail:
        "Outcome reports now feed release-note attachments, publication digests, and rollback publication bundles without mutating any live publish state."
    },
    {
      id: "release-depth-rollback-cutover-publication-receipt-closeout-contracts",
      label: "Rollback Cutover Publication Receipt Closeout Contracts",
      value: "ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS / ROLLBACK-CUTOVER-PUBLICATION-BUNDLES",
      detail:
        "Publication bundles now feed closeout acknowledgements, publication-closeout contracts, and rollback recovery evidence without mutating any live publish state."
    },
    {
      id: "release-depth-rollback-cutover-publication-receipt-settlement-closeout",
      label: "Rollback Cutover Publication Receipt Settlement Closeout",
      value: "ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT / ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS",
      detail:
        "Publication receipt closeout contracts now feed settlement ledgers, receipt closeout acknowledgements, and recovery-ready closeout evidence without mutating any live publish state."
    },
    {
      id: "release-depth-approval-audit-rollback-entry-contract",
      label: "Approval / Audit / Rollback Entry Contract",
      value:
        "APPROVAL-AUDIT-ROLLBACK-ENTRY-CONTRACT / ATTESTATION-APPLY-AUDIT-PACKS / ROLLBACK-LIVE-READINESS-CONTRACTS",
      detail:
        "The first safe Stage C entry now carries checkpoint-level evidence, approval workflow linkage, rollback live-readiness, receipt settlement closeout, and delivery QA proof as one non-executing operator-facing contract."
    },
    {
      id: "release-depth-approval",
      label: "Release Approval Workflow",
      value: "RELEASE-APPROVAL-WORKFLOW / PUBLISH-GATES / PUBLISH-ROLLBACK-HANDSHAKE",
      detail: "Release approval remains metadata-only and reviewable, blocking any live signing, publishing, rollback, or host execution."
    },
    {
      id: "release-depth-promotion",
      label: "Release Promotion Gating",
      value: "RELEASE-NOTES / PUBLISH-GATES / PROMOTION-GATES / CHANNEL-PROMOTION-EVIDENCE",
      detail: "Publish gates, promotion evidence, and promotion gates stay split so future alpha -> beta -> stable promotion has an explicit review contract."
    },
    {
      id: "release-depth-safety",
      label: "Safety posture",
      value: "local-only / non-installing / non-executing",
      detail:
        "Phase60 slice 36 keeps replay, review-state continuity, packaged-app materialization task-state linkage, validator / observability bridge readouts, a materialization Stage C readout chain, and typed Stage C readiness threaded through one local-only chain, so the active review surface, packet handoff, window / lane / board spine, reviewer queue, closeout timing, current task evidence, approval workflow stages, checkpoint linkage, rollback contracts, boundary handoff posture, materialization roots, staged-output handoff, bundle-sealing posture, and cross-window validator linkage stay readable without installing, publishing, signing, or enabling host-side execution."
    }
  ];
  const buildPaletteEntryDetailLines = (
    action: StudioCommandAction,
    prependLines: CommandPaletteEntryDetailLine[] = []
  ): CommandPaletteEntryDetailLine[] => {
    const stage = action.deliveryChainStageId
      ? selectStudioReleaseDeliveryChainStage(releaseApprovalPipeline, action.deliveryChainStageId)
      : null;
    const windowEntry = action.windowId ? data.windowing.roster.windows.find((entry) => entry.id === action.windowId) ?? null : null;
    const laneEntry = action.sharedStateLaneId
      ? data.windowing.sharedState.lanes.find((entry) => entry.id === action.sharedStateLaneId) ?? null
      : null;
    const boardEntry = action.orchestrationBoardId
      ? data.windowing.orchestration.boards.find((entry) => entry.id === action.orchestrationBoardId) ?? null
      : null;
    const mappingEntry = action.observabilityMappingId
      ? data.windowing.observability.mappings.find((entry) => entry.id === action.observabilityMappingId) ?? null
      : null;
    const slotEntry = action.slotId
      ? data.boundary.hostExecutor.bridge.trace.slotRoster.find((entry) => entry.slotId === action.slotId) ?? null
      : null;
    const routeLabel = resolveReviewSurfaceRouteLabel(action, data.windowing);
    const lines = [...prependLines];

    if (action.reviewSurfaceKind || stage) {
      lines.push({
        id: `${action.id}-detail-surface`,
        label: "Review surface",
        value: `${formatReviewSurfaceKind(action.reviewSurfaceKind)} / ${stage?.label ?? action.deliveryChainStageId ?? "No stage"}`
      });
    }

    const releaseBridgeValue = resolveReleaseBridgeValue(action.deliveryChainStageId);

    if (releaseBridgeValue) {
      lines.push({
        id: `${action.id}-detail-release-bridge`,
        label: "Release bridge",
        value: releaseBridgeValue
      });
    }

    if (windowEntry || laneEntry || boardEntry) {
      lines.push({
        id: `${action.id}-detail-window-path`,
        label: "Window path",
        value: `${windowEntry?.label ?? action.windowId ?? "No window"} -> ${laneEntry?.label ?? action.sharedStateLaneId ?? "No lane"} -> ${
          boardEntry?.label ?? action.orchestrationBoardId ?? "No board"
        }`
      });
    }

    if (mappingEntry) {
      lines.push({
        id: `${action.id}-detail-observability`,
        label: "Observability",
        value: `${mappingEntry.label} / ${formatReviewPostureRelationship(mappingEntry.relationship)}`
      });
    }

    if (routeLabel !== "No route / No workspace / No intent") {
      lines.push({
        id: `${action.id}-detail-route`,
        label: "Route context",
        value: routeLabel
      });
    }

    if (action.slotId || slotEntry) {
      lines.push({
        id: `${action.id}-detail-slot`,
        label: "Focused slot",
        value: slotEntry?.label ?? action.slotId ?? "No slot focus"
      });
    }

    if (
      activeActionDeckLane?.replayScenarioPack &&
      action.deliveryChainStageId &&
      (activeActionDeckLane.deliveryChainStageIds ?? []).includes(action.deliveryChainStageId)
    ) {
      lines.push({
        id: `${action.id}-detail-pack`,
        label: "Review pack",
        value: `${activeActionDeckLane.replayScenarioPack.label} / ${activeActionDeckLane.replayScenarioPack.acceptancePosture}`
      });
    }

    if ((action.reviewSurfaceKind || action.id === windowsObservabilityAction?.id) && activeCompanionRouteHistoryEntry?.reviewerSignoff) {
      lines.push({
        id: `${action.id}-detail-verdict`,
        label: "Verdict",
        value: `${activeReplayScenarioVerdict} / ${activeReplayVerdictStateLabel}`
      });
    }

    if ((action.reviewSurfaceKind || action.id === windowsObservabilityAction?.id) && currentCloseoutWindow) {
      lines.push({
        id: `${action.id}-detail-closeout`,
        label: "Closeout window",
        value: `${currentCloseoutWindow.label} / ${currentCloseoutWindow.state}`
      });
    }

    return lines.slice(0, 5);
  };
  const actionToPaletteEntry = (
    action: StudioCommandAction,
    options?: {
      entryId?: string;
      badge?: string;
      description?: string;
      meta?: string[];
      detailLines?: CommandPaletteEntryDetailLine[];
    }
  ): CommandPaletteEntry => ({
    id: options?.entryId ?? action.id,
    actionId: action.id,
    label: action.label,
    description: options?.description ?? action.description,
    tone: action.tone,
    badge: options?.badge,
    meta: options?.meta ?? [action.scope, action.safety, action.hotkey ?? "No hotkey"],
    detailLines: buildPaletteEntryDetailLines(action, options?.detailLines)
  });
  const paletteSectionsBase: CommandPaletteSection[] = [
    {
      id: "section-flow",
      label: activeContextualFlow?.label ?? "Recommended Flow",
      summary: activeSequence?.summary ?? "Context-aware orchestration for the current shell posture.",
      entries: dedupeCommandActions([recommendedAction ?? undefined, ...followUpActions]).map((action, index) =>
        actionToPaletteEntry(action, {
          entryId: `section-flow-${index}-${action.id}`,
          badge: action.id === recommendedAction?.id ? "Recommended Next Action" : "Follow-up"
        })
      )
    },
    {
      id: "section-next-step-board",
      label: activeNextStepBoard?.label ?? "Route-aware Next-step Board",
      summary: activeNextStepBoard?.summary ?? "Route-aware next steps stay linked to the current shell posture.",
      entries: nextStepItems.flatMap((item) =>
        item.action
          ? [
              actionToPaletteEntry(item.action, {
                entryId: `section-next-step-${item.id}`,
                badge: "Next step",
                description: item.detail,
                detailLines: [
                  {
                    id: `${item.id}-detail-board`,
                    label: "Next-step board",
                    value: activeNextStepBoard?.label ?? "Local orchestration board"
                  }
                ]
              })
            ]
          : []
      )
    },
    {
      id: "section-review-surfaces",
      label: "Review Surface Coverage",
      summary:
        "Typed coverage actions now move the selected review surface and its delivery/window/lane/board/observability linkage together.",
      entries: surfacedReviewCoverageActions.map((action) =>
        actionToPaletteEntry(action, {
          entryId: `section-review-surface-${action.id}`,
          badge: action.id === resolvedReviewSurfaceAction?.id ? "Active review surface" : formatReviewSurfaceKind(action.reviewSurfaceKind)
        })
      )
    },
    {
      id: "section-companion-route-state",
      label: activeCompanionRouteState?.label ?? "Companion Route State",
      summary:
        activeCompanionRouteState?.summary ??
        "Explicit companion route states keep active route, alternate routes, and switchable sequence posture visible alongside the current review surface.",
      entries: dedupeCommandActions(
        companionRouteStateItems.flatMap((item) => [item.action ?? undefined, ...item.switchItems.map((switchItem) => switchItem.action ?? undefined)])
      ).map((action) => {
        const sourceItem = companionRouteStateItems.find(
          (item) => item.action?.id === action.id || item.switchItems.some((switchItem) => switchItem.action?.id === action.id)
        );
        const sourceSwitch = sourceItem?.switchItems.find((switchItem) => switchItem.action?.id === action.id);

        return actionToPaletteEntry(action, {
          entryId: `section-companion-route-state-${sourceItem?.id ?? action.id}-${sourceSwitch?.id ?? action.id}`,
          badge: sourceSwitch
            ? `${sourceItem?.label ?? "Companion route"} · ${sourceSwitch.postureLabel}`
            : sourceItem
              ? `${sourceItem.label} · ${sourceItem.postureLabel}`
              : "Companion route",
          description: sourceSwitch?.detail ?? sourceItem?.detail ?? action.description
        });
      })
    },
    {
      id: "section-companion-route-history",
      label: activeActionDeckLane?.label ?? "Route Replay Restore",
      summary:
        activeCompanionPathHandoff?.summary ??
        "Remembered companion handoffs now stay available as route replay restore inside the same local-only review lane.",
      entries: dedupeCommandActions(companionRouteHistoryItems.map((item) => item.action ?? undefined)).map((action) => {
        const sourceItem = companionRouteHistoryItems.find((item) => item.action?.id === action.id);

        return actionToPaletteEntry(action, {
          entryId: `section-companion-route-history-${sourceItem?.id ?? action.id}`,
          badge: sourceItem ? sourceItem.transitionLabel : "Remembered handoff",
          description: sourceItem?.detail ?? action.description,
          meta: sourceItem ? [sourceItem.coverageLabel, sourceItem.pathLabel, sourceItem.timestamp] : undefined,
          detailLines: sourceItem
            ? [
                { id: `${sourceItem.id}-route`, label: "Route replay", value: sourceItem.routeLabel },
                { id: `${sourceItem.id}-coverage`, label: "Coverage", value: sourceItem.coverageLabel },
                { id: `${sourceItem.id}-path`, label: "Window path", value: sourceItem.pathLabel }
              ]
            : undefined
        });
      })
    },
    {
      id: "section-companion-sequence",
      label: activeCompanionSequence?.label ?? "Companion Sequence",
      summary:
        activeCompanionSequence?.summary ??
        "Ordered companion steps keep current, primary, and follow-up review coverage visible as one local-only navigation sequence.",
      entries: dedupeCommandActions(companionSequenceStepItems.map((item) => item.action ?? undefined)).map((action) => {
        const sourceItem = companionSequenceStepItems.find((item) => item.action?.id === action.id);

        return actionToPaletteEntry(action, {
          entryId: `section-companion-sequence-${sourceItem?.id ?? action.id}`,
          badge: sourceItem ? `${sourceItem.stepLabel} · ${sourceItem.roleLabel}` : "Companion sequence",
          description: sourceItem?.detail ?? action.description,
          meta: sourceItem ? [sourceItem.coverageLabel, sourceItem.pathLabel, sourceItem.stepLabel] : undefined
        });
      })
    },
    {
      id: "section-companion-review-paths",
      label: activeActionDeckLane?.label ?? "Companion Review Paths",
      summary:
        "The active review surface now exposes explicit companion review paths with primary and follow-up coverage pivots instead of relying on mapped coverage alone.",
      entries: dedupeCommandActions(companionReviewPathItems.map((item) => item.action ?? undefined)).map((action) => {
        const sourceItem = companionReviewPathItems.find((item) => item.action?.id === action.id);

        return actionToPaletteEntry(action, {
          entryId: `section-companion-review-path-${sourceItem?.id ?? action.id}`,
          badge: sourceItem ? `${sourceItem.kindLabel} from ${sourceItem.sourceLabel}` : "Companion path",
          description: sourceItem?.detail ?? action.description,
          meta: sourceItem ? [sourceItem.coverageLabel, sourceItem.pathLabel, sourceItem.routeLabel] : undefined
        });
      })
    },
    {
      id: "section-multi-window-coverage",
      label: activeActionDeckLane?.label ?? "Multi-window Review Coverage",
      summary:
        activeActionDeckLane && multiWindowCoverageItems.length
          ? `${multiWindowCoverageItems.length} mapped windows, lanes, boards, and observability rows keep the same reviewer context readable across the active delivery lane.`
          : "Mapped observability paths keep the same reviewer context visible across the local-only shell.",
      entries: multiWindowCoverageItems.flatMap((item) =>
        item.action
          ? [
              actionToPaletteEntry(item.action, {
                entryId: `section-multi-window-${item.id}`,
                badge: item.active ? "Active mapped path" : item.relationshipLabel,
                description: item.detail,
                meta: [item.coverageLabel, item.pathLabel, `${item.reviewSurfaceCount} linked surfaces`],
                detailLines: [
                  { id: `${item.id}-coverage`, label: "Coverage", value: item.coverageLabel },
                  { id: `${item.id}-path`, label: "Window path", value: item.pathLabel },
                  {
                    id: `${item.id}-surfaces`,
                    label: "Linked surfaces",
                    value: item.reviewSurfaceLabels.join(" / ") || "No linked review surfaces"
                  }
                ]
              })
            ]
          : []
      )
    },
    {
      id: "section-closeout-console",
      label: activeReplayScenarioPack?.label ?? "Acceptance Closeout Console",
      summary:
        activeCompanionRouteHistoryEntry?.reviewerSignoff?.summary ??
        "Verdict focus, acceptance closeout timing, and observability settlement stay grouped inside the same local-only command surface.",
      entries: dedupeCommandActions([
        activeCompanionRouteHistoryEntry ? actionById.get(activeCompanionRouteHistoryEntry.targetActionId) : undefined,
        resolvedReviewSurfaceAction ?? undefined,
        windowsObservabilityAction,
        activeCompanionSequence?.steps.length
          ? actionById.get(activeCompanionSequence.steps[activeCompanionSequence.steps.length - 1]?.actionId ?? "")
          : undefined
      ]).map((action, index) =>
        actionToPaletteEntry(action, {
          entryId: `section-closeout-console-${index}-${action.id}`,
          badge:
            action.id === activeCompanionRouteHistoryEntry?.targetActionId
              ? "Verdict path"
              : action.id === resolvedReviewSurfaceAction?.id
                ? "Acceptance closeout"
                : action.id === windowsObservabilityAction?.id
                  ? "Observability closeout"
                  : "Pack follow-up",
          description:
            action.id === windowsObservabilityAction?.id
              ? "Keep the multi-window closeout board visible so verdict posture, closeout timing, and observability settlement stay aligned."
              : action.description,
          meta: [
            activeReplayVerdictStateLabel,
            `${activeReplayPackReadyCount} ready / ${activeReplayPackInReviewCount} in review`,
            currentCloseoutWindow ? `${currentCloseoutWindow.label} / ${currentCloseoutWindow.state}` : "No closeout window"
          ],
          detailLines: [
            { id: `${action.id}-closeout-verdict`, label: "Final verdict", value: `${activeReplayScenarioLabel} / ${activeReplayScenarioVerdict}` },
            { id: `${action.id}-closeout-timeline`, label: "Closeout timeline", value: activeReplayCloseoutTimelineLabel },
            {
              id: `${action.id}-closeout-observability`,
              label: "Observability closeout",
              value: activeReplayObservabilityCloseoutLabel
            }
          ]
        })
      )
    },
    {
      id: "section-context",
      label: "Contextual Actions",
      summary: "Route, workflow lane, and focused-slot aware actions.",
      entries: contextualActions.map((action) =>
        actionToPaletteEntry(action, {
          entryId: `section-context-${action.id}`,
          badge: "Context"
        })
      )
    },
    {
      id: "section-all",
      label: "All Actions",
      summary: "Full local-only command registry filtered by the current query.",
      entries: paletteActions.map((action) =>
        actionToPaletteEntry(action, {
          entryId: `section-all-${action.id}`,
          badge: "Registry"
        })
      )
    }
  ];
  const matchesPaletteEntry = (entry: CommandPaletteEntry) => {
    if (!normalizedCommandQuery.length) {
      return true;
    }

    const haystack = [
      entry.label,
      entry.description,
      entry.badge ?? "",
      ...entry.meta,
      ...(entry.detailLines ?? []).flatMap((line) => [line.label, line.value])
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedCommandQuery);
  };
  const paletteSections: CommandPaletteSection[] = paletteSectionsBase
    .map((section) => ({
      ...section,
      entries: section.entries.filter(matchesPaletteEntry)
    }))
    .filter((section) => section.entries.length > 0);
  const paletteEntryById = new Map(paletteSections.flatMap((section) => section.entries.map((entry) => [entry.id, entry] as const)));
  const paletteEntryIds = paletteSections.flatMap((section) => section.entries.map((entry) => entry.id));
  const paletteContexts = dedupeById(
    [
      ...activeContexts.map((context) => ({
        id: context.id,
        label: context.label
      })),
      resolvedDeliveryCoverageStage
        ? {
            id: `palette-context-stage-${resolvedDeliveryCoverageStage.id}`,
            label: `${resolvedDeliveryCoverageStage.label} / delivery stage`
          }
        : null,
      resolvedReviewSurfaceAction
        ? {
            id: `palette-context-surface-${resolvedReviewSurfaceAction.id}`,
            label: `${resolvedReviewSurfaceAction.label} / review surface`
          }
        : null,
      activeCompanionRouteState
        ? {
            id: `palette-context-route-${activeCompanionRouteState.id}`,
            label: `${activeCompanionRouteState.label} / companion route`
          }
        : null,
      activeReplayScenarioPack
        ? {
            id: `palette-context-pack-${activeReplayScenarioPack.id}`,
            label: `${activeReplayScenarioPack.label} / replay pack`
          }
        : null,
      resolvedCoverageWindow && resolvedCoverageLane
        ? {
            id: `palette-context-window-${resolvedCoverageWindow.id}-${resolvedCoverageLane.id}`,
            label: `${resolvedCoverageWindow.label} -> ${resolvedCoverageLane.label}`
          }
        : null,
      resolvedCoverageMapping
        ? {
            id: `palette-context-mapping-${resolvedCoverageMapping.id}`,
            label: `${resolvedCoverageMapping.label} / ${formatReviewPostureRelationship(resolvedCoverageMapping.relationship)}`
          }
        : null
    ].filter((context): context is { id: string; label: string } => Boolean(context))
  );

  const applyLayoutPatch = (patch: Partial<StudioShellLayoutState>) => {
    if (typeof patch.rightRailVisible === "boolean" || typeof patch.bottomDockVisible === "boolean") {
      setUserVisibilityOverrides((current) => ({
        rightRailVisible: typeof patch.rightRailVisible === "boolean" ? patch.rightRailVisible : current.rightRailVisible,
        bottomDockVisible: typeof patch.bottomDockVisible === "boolean" ? patch.bottomDockVisible : current.bottomDockVisible
      }));
    }

    setLayoutState(resolvePersistedShellLayoutState(data, { ...resolvedLayoutState, ...patch }));
  };

  const recordActivity = ({ label, detail, safety }: ActivityInput) => {
    setCommandLog((entries) => [
      {
        id: `${label.toLowerCase().replace(/\s+/g, "-")}-${entries.length + 1}`,
        label,
        detail,
        safety,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })
      },
      ...entries
    ].slice(0, 8));
  };

  const recordCommand = (action: StudioCommandAction, detail: string) => {
    recordActivity({
      label: action.label,
      detail,
      safety: action.safety
    });
  };

  const syncWindowIntentState = (intentId: string, nextStatus: StudioWindowIntentStatus) => {
    setWindowIntentStates((current) => {
      const next = createWindowIntentStateMap(data.windowing, current);

      for (const intent of data.windowing.windowIntents) {
        if (intent.id === intentId) {
          next[intent.id] = nextStatus;
          continue;
        }

        if (next[intent.id] === "focused") {
          next[intent.id] = "staged";
        }
      }

      return next;
    });
  };

  const syncWorkspaceShell = (
    view: StudioShellState["windowing"]["views"][number],
    options?: {
      pageId?: StudioPageId;
      rightRailTabId?: StudioShellLayoutState["rightRailTabId"];
      bottomDockTabId?: StudioShellLayoutState["bottomDockTabId"];
      detachedPanelId?: string | null;
    }
  ) => {
    navigateToPage(options?.pageId ?? view.defaultPageId);
    applyLayoutPatch({
      workspaceViewId: view.id,
      rightRailVisible: resolvedLayoutState.rightRailVisible,
      bottomDockVisible: resolvedLayoutState.bottomDockVisible,
      rightRailTabId: options?.rightRailTabId ?? view.rightRailTabId,
      bottomDockTabId: options?.bottomDockTabId ?? view.bottomDockTabId
    });
    setSelectedDetachedPanelId(options?.detachedPanelId ?? view.detachedPanelIds[0] ?? null);
  };

  const activateWorkspaceView = (
    workspaceViewId: StudioShellLayoutState["workspaceViewId"],
    options?: {
      activity?: ActivityInput;
      intentStatus?: StudioWindowIntentStatus;
    }
  ) => {
    const view = data.windowing.views.find((entry) => entry.id === workspaceViewId);

    if (!view) {
      return;
    }

    const linkedIntent =
      windowIntents.find((intent) => view.intentIds.includes(intent.id)) ??
      windowIntents.find((intent) => intent.workspaceViewId === view.id) ??
      null;

    syncWorkspaceShell(view);

    if (linkedIntent) {
      setSelectedWindowIntentId(linkedIntent.id);
      syncWindowIntentState(linkedIntent.id, options?.intentStatus ?? "staged");
    }

    if (options?.activity) {
      recordActivity(options.activity);
    }
  };

  const stageWindowIntent = (
    windowIntentId: string,
    options?: {
      status?: StudioWindowIntentStatus;
      activity?: ActivityInput;
    }
  ) => {
    const intent = windowIntents.find((entry) => entry.id === windowIntentId);

    if (!intent) {
      return;
    }

    const targetView =
      (intent.workspaceViewId ? data.windowing.views.find((view) => view.id === intent.workspaceViewId) : undefined) ??
      (intent.detachedPanelId
        ? data.windowing.views.find((view) =>
            data.windowing.detachedPanels.some((panel) => panel.id === intent.detachedPanelId && panel.workspaceViewId === view.id)
          )
        : undefined) ??
      workspaceView;

    if (targetView) {
      syncWorkspaceShell(targetView, {
        pageId: intent.shellLink.pageId,
        rightRailTabId: intent.shellLink.rightRailTabId,
        bottomDockTabId: intent.shellLink.bottomDockTabId,
        detachedPanelId: intent.detachedPanelId ?? targetView.detachedPanelIds[0] ?? null
      });
    } else {
      navigateToPage(intent.shellLink.pageId);
      applyLayoutPatch({
        rightRailVisible: resolvedLayoutState.rightRailVisible,
        bottomDockVisible: resolvedLayoutState.bottomDockVisible,
        rightRailTabId: intent.shellLink.rightRailTabId,
        bottomDockTabId: intent.shellLink.bottomDockTabId
      });
    }

    setSelectedWindowIntentId(intent.id);
    if (intent.detachedPanelId) {
      setSelectedDetachedPanelId(intent.detachedPanelId);
    }
    syncWindowIntentState(intent.id, options?.status ?? "focused");

    if (options?.activity) {
      recordActivity(options.activity);
    }
  };

  const activateDetachedPanel = (panelId: string, activity?: ActivityInput) => {
    const panel = data.windowing.detachedPanels.find((entry) => entry.id === panelId);

    if (!panel) {
      return;
    }

    const targetView = data.windowing.views.find((view) => view.id === panel.workspaceViewId) ?? workspaceView ?? data.windowing.views[0];

    if (!targetView) {
      return;
    }

    const linkedIntent =
      windowIntents.find((intent) => intent.detachedPanelId === panel.id) ??
      windowIntents.find((intent) => targetView.intentIds.includes(intent.id)) ??
      null;

    syncWorkspaceShell(targetView, {
      pageId: linkedIntent?.shellLink.pageId ?? targetView.defaultPageId,
      rightRailTabId: linkedIntent?.shellLink.rightRailTabId ?? (panel.sourceTabId as StudioShellLayoutState["rightRailTabId"]),
      bottomDockTabId: "windows",
      detachedPanelId: panel.id
    });
    setSelectedDetachedPanelId(panel.id);

    if (linkedIntent) {
      setSelectedWindowIntentId(linkedIntent.id);
      syncWindowIntentState(linkedIntent.id, panel.detachState === "detached-local" ? "focused" : "staged");
    }

    if (activity) {
      recordActivity(activity);
    }
  };

  const advanceWorkflowLane = (lane = selectedWorkflowLane) => {
    if (!lane) {
      return;
    }

    if (workspaceView?.id !== lane.workspaceViewId) {
      activateWorkspaceView(lane.workspaceViewId, {
        activity: {
          label: `Advance ${lane.label}`,
          detail: `${lane.label} entered ${lane.workspaceViewId} as its workspace step.`,
          safety: "local-only"
        }
      });
      return;
    }

    if (selectedDetachedPanel?.id !== lane.detachedPanelId) {
      activateDetachedPanel(lane.detachedPanelId, {
        label: `Advance ${lane.label}`,
        detail: `${lane.label} surfaced ${lane.detachedPanelId} as the active detached candidate.`,
        safety: "local-only"
      });
      return;
    }

    const laneIntent = windowIntents.find((intent) => intent.id === lane.windowIntentId);

    if (laneIntent && laneIntent.localStatus !== "focused") {
      stageWindowIntent(laneIntent.id, {
        status: "focused",
        activity: {
          label: `Advance ${lane.label}`,
          detail: `${lane.label} focused ${laneIntent.label} into ${formatWorkflowPosture(lane.posture)} posture.`,
          safety: "local-only"
        }
      });
      return;
    }

    recordActivity({
      label: `${lane.label} stable`,
      detail: `${lane.label} is already holding a ${formatWorkflowPosture(lane.posture)} handoff posture locally.`,
      safety: "local-only"
    });
  };

  const resolveCompanionRouteStateId = (
    lane: CommandActionDeck["lanes"][number] | null | undefined,
    actionId: string | null,
    sequenceId?: string | null
  ) => {
    if (!lane) {
      return null;
    }

    const matchingRouteState =
      lane.companionRouteStates?.find(
        (routeState) =>
          Boolean(actionId) &&
          (routeState.currentActionId === actionId ||
            routeState.sourceActionId === actionId ||
            routeState.routeActionIds.includes(actionId as string))
      ) ??
      lane.companionRouteStates?.find(
        (routeState) =>
          Boolean(sequenceId) &&
          (routeState.activeSequenceId === sequenceId || routeState.sequenceSwitches.some((switchItem) => switchItem.sequenceId === sequenceId))
      ) ??
      null;

    return matchingRouteState?.id ?? null;
  };

  const resolveCompanionSequenceId = (
    lane: CommandActionDeck["lanes"][number] | null | undefined,
    actionId: string | null,
    routeStateId?: string | null
  ) => {
    if (!lane) {
      return null;
    }

    const matchingRouteState = routeStateId ? lane.companionRouteStates?.find((routeState) => routeState.id === routeStateId) ?? null : null;
    const matchingSwitch =
      matchingRouteState?.sequenceSwitches.find((switchItem) => Boolean(actionId) && switchItem.targetActionId === actionId) ?? null;

    return (
      matchingSwitch?.sequenceId ??
      matchingRouteState?.activeSequenceId ??
      lane.companionSequences?.find((sequence) => Boolean(actionId) && sequence.steps.some((step) => step.actionId === actionId))?.id ??
      null
    );
  };

  const resolveCompanionPathHandoffId = (
    lane: CommandActionDeck["lanes"][number] | null | undefined,
    actionId: string | null,
    routeStateId?: string | null,
    sequenceId?: string | null
  ) => {
    if (!lane) {
      return null;
    }

    return (
      (routeStateId
        ? lane.companionPathHandoffs?.find(
            (handoff) =>
              handoff.routeStateId === routeStateId &&
              (handoff.targetActionId === actionId || handoff.sourceActionId === actionId || handoff.followUpActionId === actionId)
          )?.id
        : undefined) ??
      (sequenceId
        ? lane.companionPathHandoffs?.find(
            (handoff) =>
              handoff.sequenceId === sequenceId &&
              (handoff.targetActionId === actionId || handoff.sourceActionId === actionId || handoff.followUpActionId === actionId)
          )?.id
        : undefined) ??
      lane.companionPathHandoffs?.find(
        (handoff) => handoff.targetActionId === actionId || handoff.sourceActionId === actionId || handoff.followUpActionId === actionId
      )?.id ??
      null
    );
  };

  const resolveCompanionRouteHistoryEntryId = (
    lane: CommandActionDeck["lanes"][number] | null | undefined,
    actionId: string | null,
    routeStateId?: string | null,
    sequenceId?: string | null,
    pathHandoffId?: string | null
  ) => {
    if (!lane) {
      return null;
    }

    const handoff = pathHandoffId ? lane.companionPathHandoffs?.find((entry) => entry.id === pathHandoffId) ?? null : null;

    return (
      lane.companionRouteHistory?.find(
        (entry) =>
          Boolean(actionId) &&
          entry.targetActionId === actionId &&
          (!routeStateId || entry.routeStateId === routeStateId) &&
          (!sequenceId || entry.sequenceId === sequenceId)
      )?.id ??
      (handoff ? lane.companionRouteHistory?.find((entry) => entry.reviewPathId === handoff.reviewPathId)?.id : undefined) ??
      lane.companionRouteHistory?.find(
        (entry) => Boolean(actionId) && (entry.targetActionId === actionId || entry.sourceActionId === actionId)
      )?.id ??
      null
    );
  };

  const resolveRememberedReviewCoverageSelection = (laneId: string | null | undefined): ReviewCoverageSelection | null => {
    if (!laneId) {
      return null;
    }

    if (reviewCoverageSelection.actionDeckLaneId === laneId && hasReviewCoverageSelection(reviewCoverageSelection)) {
      return reviewCoverageSelection;
    }

    return (
      companionRouteHistory.find(
        (entry) => entry.nextSelection.actionDeckLaneId === laneId && hasReviewCoverageSelection(entry.nextSelection)
      )?.nextSelection ?? null
    );
  };

  const commitReviewCoverageSelection = (
    nextSelection: ReviewCoverageSelection,
    options?: {
      recordHistory?: boolean;
      transitionKind?: StudioCommandCompanionRouteTransitionKind;
    }
  ) => {
    const nextSelectionSnapshot: ReviewCoverageSelection = {
      ...nextSelection
    };

    setCompanionRouteMemory((current) => {
      const selectionChanged = !areReviewCoverageSelectionsEqual(current.selection, nextSelectionSnapshot);
      const shouldRecordHistory =
        options?.recordHistory !== false &&
        selectionChanged &&
        nextSelectionSnapshot.actionDeckLaneId &&
        nextSelectionSnapshot.reviewSurfaceActionId &&
        (current.selection.actionDeckLaneId !== nextSelectionSnapshot.actionDeckLaneId ||
          current.selection.reviewSurfaceActionId !== nextSelectionSnapshot.reviewSurfaceActionId ||
          current.selection.companionRouteStateId !== nextSelectionSnapshot.companionRouteStateId ||
          current.selection.companionSequenceId !== nextSelectionSnapshot.companionSequenceId ||
          current.selection.companionPathHandoffId !== nextSelectionSnapshot.companionPathHandoffId);

      const previousSelectionSnapshot = hasReviewCoverageSelection(current.selection)
        ? {
            ...current.selection
          }
        : null;
      const nextEntries = shouldRecordHistory
        ? [
            {
              id: `companion-route-memory-${Date.now()}-${current.entries.length + 1}`,
              recordedAt: new Date().toISOString(),
              transitionKind: resolveCompanionRouteTransitionKind(previousSelectionSnapshot, nextSelectionSnapshot, options?.transitionKind),
              previousSelection: previousSelectionSnapshot,
              nextSelection: nextSelectionSnapshot
            },
            ...current.entries
          ].slice(0, data.commandSurface.history.retention)
        : current.entries;

      return {
        selection: nextSelectionSnapshot,
        entries: nextEntries
      };
    });
  };

  const applyReviewCoverageAction = (
    action: StudioCommandAction & {
      kind: "focus-review-coverage";
    },
    options?: {
      actionDeckLaneId?: string | null;
      companionRouteStateId?: string | null;
      companionSequenceId?: string | null;
      selectionOverride?: ReviewCoverageSelection | null;
      record?: boolean;
      transitionKind?: StudioCommandCompanionRouteTransitionKind;
    }
  ) => {
    const selectionOverride = options?.selectionOverride;
    const linkedLaneId =
      selectionOverride?.actionDeckLaneId ??
      options?.actionDeckLaneId ??
      activeActionDeck?.lanes.find((lane) => lane.actionIds.includes(action.id))?.id ??
      reviewCoverageSelection.actionDeckLaneId;
    const linkedLane =
      (linkedLaneId ? activeActionDeck?.lanes.find((lane) => lane.id === linkedLaneId) : undefined) ??
      activeActionDeck?.lanes.find((lane) => lane.actionIds.includes(action.id)) ??
      null;
    const companionRouteStateId =
      selectionOverride?.companionRouteStateId ??
      options?.companionRouteStateId ??
      resolveCompanionRouteStateId(linkedLane, action.id, selectionOverride?.companionSequenceId ?? options?.companionSequenceId ?? null);
    const companionSequenceId =
      selectionOverride?.companionSequenceId ??
      options?.companionSequenceId ??
      resolveCompanionSequenceId(linkedLane, action.id, companionRouteStateId) ??
      null;
    const companionPathHandoffId =
      selectionOverride?.companionPathHandoffId ??
      resolveCompanionPathHandoffId(linkedLane, action.id, companionRouteStateId, companionSequenceId);
    const companionRouteHistoryEntryId =
      selectionOverride?.companionRouteHistoryEntryId ??
      resolveCompanionRouteHistoryEntryId(linkedLane, action.id, companionRouteStateId, companionSequenceId, companionPathHandoffId);

    if (action.windowIntentId) {
      stageWindowIntent(action.windowIntentId, {
        status: "focused"
      });
    } else if (action.workspaceViewId) {
      activateWorkspaceView(action.workspaceViewId, {
        intentStatus: "focused"
      });
    } else if (action.routeId) {
      navigateToPage(action.routeId);
    }

    applyLayoutPatch({
      rightRailVisible: resolvedLayoutState.rightRailVisible,
      bottomDockVisible: resolvedLayoutState.bottomDockVisible,
      rightRailTabId: action.rightRailTabId ?? "windows",
      bottomDockTabId: action.bottomDockTabId ?? "windows"
    });

    commitReviewCoverageSelection(
      {
        actionDeckLaneId: linkedLaneId ?? null,
        companionRouteStateId,
        companionSequenceId,
        companionRouteHistoryEntryId,
        companionPathHandoffId,
        reviewSurfaceActionId: action.id,
        deliveryStageId: selectionOverride?.deliveryStageId ?? action.deliveryChainStageId ?? null,
        windowId: selectionOverride?.windowId ?? action.windowId ?? null,
        sharedStateLaneId: selectionOverride?.sharedStateLaneId ?? action.sharedStateLaneId ?? null,
        orchestrationBoardId: selectionOverride?.orchestrationBoardId ?? action.orchestrationBoardId ?? null,
        observabilityMappingId: selectionOverride?.observabilityMappingId ?? action.observabilityMappingId ?? null
      },
      {
        recordHistory: options?.record,
        transitionKind: options?.transitionKind
      }
    );

    if (options?.record !== false) {
      recordCommand(
        action,
        `${formatReviewSurfaceKind(action.reviewSurfaceKind)} coverage focused on ${action.deliveryChainStageId ?? "review posture"}.`
      );
    }
  };

  const workflowStepCards: WorkflowStepCard[] = workflowSteps.map((step) => {
    if (step.kind === "workspace-entry") {
      const active = step.workspaceViewId === workspaceView?.id;

      return {
        step,
        state: active ? "entered" : "available",
        statusLabel: active ? "Entered" : "Available",
        actionLabel: active ? "Re-sync workspace" : "Enter workspace",
        activate: () => {
          if (!step.workspaceViewId) {
            return;
          }

          activateWorkspaceView(step.workspaceViewId, {
            activity: {
              label: step.label,
              detail: `${step.label} aligned the shell with the ${formatWorkflowPosture(step.posture)} workflow entry.`,
              safety: "local-only"
            }
          });
        }
      };
    }

    if (step.kind === "detached-panel") {
      const surfaced = step.detachedPanelId === selectedDetachedPanel?.id;

      return {
        step,
        state: surfaced ? "surfaced" : "available",
        statusLabel: surfaced ? "Surfaced" : "Ready",
        actionLabel: surfaced ? "Refresh candidate" : "Surface candidate",
        activate: () => {
          if (!step.detachedPanelId) {
            return;
          }

          activateDetachedPanel(step.detachedPanelId, {
            label: step.label,
            detail: `${step.label} surfaced ${step.detachedPanelId} as the active detached workflow candidate.`,
            safety: "local-only"
          });
        }
      };
    }

    const laneIntent =
      (step.windowIntentId ? windowIntents.find((intent) => intent.id === step.windowIntentId) : undefined) ??
      workflowIntent ??
      null;
    const state: WorkflowStepState =
      laneIntent?.localStatus === "focused" ? "focused" : laneIntent?.localStatus === "staged" ? "staged" : "available";

    return {
      step,
      state,
      statusLabel:
        laneIntent?.localStatus === "focused" ? "Focused" : laneIntent?.localStatus === "staged" ? "Staged" : "Ready",
      actionLabel: laneIntent?.localStatus === "focused" ? "Refresh posture" : "Focus posture",
      activate: () => {
        if (!step.windowIntentId) {
          return;
        }

        stageWindowIntent(step.windowIntentId, {
          status: "focused",
          activity: {
            label: step.label,
            detail: `${step.label} focused ${step.windowIntentId} into ${formatWorkflowPosture(step.posture)} workflow posture.`,
            safety: "local-only"
          }
        });
      }
    };
  });

  const executeCommand = (action: StudioCommandAction) => {
    switch (action.kind) {
      case "navigate":
        if (action.routeId) {
          navigateToPage(action.routeId);
          recordCommand(action, `Navigated to ${action.routeId}.`);
        }
        break;
      case "focus-slot":
        if (action.slotId) {
          setFocusedSlotId(action.slotId);
          applyLayoutPatch({
            bottomDockVisible: true,
            bottomDockTabId: "focus"
          });
          recordCommand(action, `Focused ${action.slotId}.`);
        }
        break;
      case "show-boundary":
      case "show-trace": {
        const surfacedRightRailTab = action.rightRailTabId ?? resolvedLayoutState.rightRailTabId;
        const surfacedRailLabel =
          surfacedRightRailTab === "windows" ? "Windows" : surfacedRightRailTab === "trace" ? "Trace" : "Inspector";

        applyLayoutPatch({
          rightRailVisible: true,
          bottomDockVisible: true,
          rightRailTabId: surfacedRightRailTab,
          bottomDockTabId: action.bottomDockTabId ?? resolvedLayoutState.bottomDockTabId
        });
        recordCommand(action, `${surfacedRailLabel} rail surfaced.`);
        break;
      }
      case "show-preview":
        if (action.routeId) {
          navigateToPage(action.routeId);
        }

        if (action.slotId) {
          setFocusedSlotId(action.slotId);
        }

        applyLayoutPatch({
          rightRailVisible: true,
          bottomDockVisible: true,
          rightRailTabId: action.rightRailTabId ?? "trace",
          bottomDockTabId: action.bottomDockTabId ?? "focus"
        });
        recordCommand(action, `Preview posture staged for ${action.slotId ?? action.routeId ?? "shell"}.`);
        break;
      case "focus-review-coverage":
        if (isReviewCoverageAction(action)) {
          applyReviewCoverageAction(action);
        }
        break;
      case "toggle-right-rail":
        applyLayoutPatch({
          rightRailVisible: !resolvedLayoutState.rightRailVisible
        });
        recordCommand(action, `Right rail ${resolvedLayoutState.rightRailVisible ? "hidden" : "shown"}.`);
        break;
      case "toggle-bottom-dock":
        applyLayoutPatch({
          bottomDockVisible: !resolvedLayoutState.bottomDockVisible
        });
        recordCommand(action, `Bottom dock ${resolvedLayoutState.bottomDockVisible ? "hidden" : "shown"}.`);
        break;
      case "toggle-compact-mode":
        applyLayoutPatch({
          compactMode: !resolvedLayoutState.compactMode
        });
        recordCommand(action, `Compact mode ${resolvedLayoutState.compactMode ? "disabled" : "enabled"}.`);
        break;
      case "activate-workspace-view":
        if (action.workspaceViewId) {
          activateWorkspaceView(action.workspaceViewId, {
            activity: {
              label: action.label,
              detail: `Workspace view switched to ${action.workspaceViewId}.`,
              safety: action.safety
            }
          });
        }
        break;
      case "stage-window-intent":
        if (action.windowIntentId) {
          stageWindowIntent(action.windowIntentId, {
            status: "focused",
            activity: {
              label: action.label,
              detail: `Window intent ${action.windowIntentId} focused locally.`,
              safety: action.safety
            }
          });
        }
        break;
      case "advance-workflow-lane":
        advanceWorkflowLane();
        recordCommand(action, `${selectedWorkflowLane?.label ?? "Workflow lane"} advanced locally.`);
        break;
    }

    setCommandPaletteOpen(false);
    setCommandQuery("");
    paletteReturnFocus?.focus?.();
  };

  const movePaletteSelection = (direction: -1 | 1) => {
    if (!paletteEntryIds.length) {
      return;
    }

    const currentIndex = selectedPaletteEntryId ? paletteEntryIds.indexOf(selectedPaletteEntryId) : -1;
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + direction + paletteEntryIds.length) % paletteEntryIds.length;
    setSelectedPaletteEntryId(paletteEntryIds[nextIndex] ?? null);
  };

  const openCommandPalette = () => {
    setPaletteReturnFocus(document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setCommandPaletteOpen(true);
  };

  const executePaletteEntry = (entryId: string) => {
    const entryActionId = paletteEntryById.get(entryId)?.actionId;
    const entryAction = entryActionId ? actionById.get(entryActionId) : undefined;
    if (entryAction) {
      executeCommand(entryAction);
    }
  };

  const centerFocusMode = activePage === "sessions";
  const shellClassNames = [
    "studio-shell",
    resolvedLayoutState.compactMode ? "studio-shell--compact" : "",
    !resolvedLayoutState.rightRailVisible ? "studio-shell--no-right-rail" : "",
    !resolvedLayoutState.bottomDockVisible ? "studio-shell--no-bottom-dock" : "",
    centerFocusMode ? "studio-shell--center-focus" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <CommandPalette
        sections={paletteSections}
        contexts={paletteContexts}
        shortcuts={paletteShortcutHints}
        open={commandPaletteOpen}
        query={commandQuery}
        placeholder={data.commandSurface.placeholder}
        selectedEntryId={selectedPaletteEntryId}
        onClose={() => {
          setCommandPaletteOpen(false);
          setCommandQuery("");
          paletteReturnFocus?.focus?.();
        }}
        onExecuteEntry={executePaletteEntry}
        onQueryChange={setCommandQuery}
        onSelectEntry={setSelectedPaletteEntryId}
        onMoveSelection={movePaletteSelection}
      />

      <div className={shellClassNames}>
        <aside className="left-nav surface">
          <div className="brand-block">
            <span className="brand-mark">OC</span>
            <div>
              <strong>{data.appName}</strong>
              <p>预览模式</p>
            </div>
          </div>
          <nav className="nav-list">
            {visiblePages.map((page) => (
              <button
                key={page.id}
                type="button"
                className={page.id === activePage ? "nav-item nav-item--active" : "nav-item"}
                onClick={() => {
                  setActivePage(page.id);
                  navigateToPage(page.id);
                }}
              >
                <strong>{getZhPageLabel(page.id, page.label)}</strong>
                <span>{getZhPageHint(page.id, page.hint)}</span>
              </button>
            ))}
            {secondaryPages.length ? (
              <button
                type="button"
                className="secondary-button nav-more-toggle"
                onClick={() => {
                  setShowAllPages((current) => !current);
                }}
              >
                {showAllPages ? "收起次级页面" : `展开次级页面（+${secondaryPages.length}）`}
              </button>
            ) : null}
          </nav>
        </aside>

        <header className="top-bar surface">
          <div className="top-bar__summary">
            <div>
              <p className="eyebrow">桌面工作台</p>
              <h2>{activePageLabel}</h2>
              <p className="page-summary page-summary--tight">{activePageHint}</p>
            </div>
            <div className="workspace-view-strip">
              {data.windowing.views.map((view) => {
                const linkedIntent = windowIntents.find((intent) => view.intentIds.includes(intent.id));

                return (
                  <button
                    key={view.id}
                    type="button"
                    className={view.id === workspaceView?.id ? "workspace-view-chip workspace-view-chip--active" : "workspace-view-chip"}
                    onClick={() => {
                      activateWorkspaceView(view.id, {
                        activity: {
                          label: view.label,
                          detail: `${view.label} moved into ${formatDetachState(view.detachState)} posture.`,
                          safety: "local-only"
                        }
                      });
                    }}
                  >
                    <strong>{view.label}</strong>
                    <span>本地预览工作区</span>
                    <em className="workspace-view-chip__meta">
                      {formatDetachState(view.detachState)} · {linkedIntent ? formatIntentStatus(linkedIntent.localStatus) : "无意图"}
                    </em>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="top-bar__side">
            <div className="command-launcher">
              <button
                type="button"
                className="command-launcher__button"
                onClick={() => {
                  openCommandPalette();
                }}
              >
                <span>命令面板</span>
                <strong>Ctrl/Cmd K</strong>
              </button>
              <p>快捷入口：打开命令面板并执行常用操作。</p>
            </div>
            <div className="top-bar-status">
              <div className="status-badge">
                <span>桥接</span>
                <strong>{getZhStatusValue(data.status.bridge)}</strong>
              </div>
              <div className="status-badge">
                <span>运行态</span>
                <strong>{getZhStatusValue(data.status.runtime)}</strong>
              </div>
              <div className="status-badge">
                <span>工作区</span>
                <strong>{workspaceView?.label ?? "不可用"}</strong>
              </div>
              <div className="status-badge">
                <span>就绪度</span>
                <strong>{workflowReadinessLabel}</strong>
              </div>
            </div>
            <div className="workflow-chip-strip">
              <span className={`workflow-chip workflow-chip--${workflowReadinessTone}`}>{selectedWorkflowLane?.label ?? "无流程通道"}</span>
              <span className={`workflow-chip workflow-chip--${workflowReadinessTone}`}>{workflowReadinessLabel}</span>
            </div>
          </div>
          <div className="quick-actions-bar">
            {quickActions.slice(0, 4).map((action) => (
              <button
                key={action.id}
                type="button"
                className={`quick-action-button quick-action-button--${action.tone}`}
                onClick={() => {
                  executeCommand(action);
                }}
              >
                <strong>{action.label}</strong>
                <span>{getZhStatusValue(action.safety)}</span>
              </button>
            ))}
          </div>
        </header>

        <main className="main-panel">
          <section className="foundation-strip">
            <article className="surface card foundation-card">
              <div className="card-header card-header--stack">
                <div>
                  <p className="eyebrow">命令面板</p>
                  <h2>当前命令面板</h2>
                </div>
                <p>集中处理导航、检查与本地安全操作。</p>
              </div>
              <div className="foundation-card__metrics">
                <div className="foundation-pill">
                  <span>上下文</span>
                  <strong>{activeContexts.length}</strong>
                </div>
                <div className="foundation-pill">
                  <span>快捷操作</span>
                  <strong>{quickActions.length}</strong>
                </div>
                <div className="foundation-pill">
                  <span>窗口联动</span>
                  <strong>{windowIntents.filter((intent) => intent.localStatus !== "ready").length}</strong>
                </div>
                <div className="foundation-pill">
                  <span>最近操作</span>
                  <strong>{commandLog[0]?.label ?? "暂无"}</strong>
                </div>
              </div>
            </article>

            {activeActionDeck ? (
              <article className="surface card foundation-card">
                <div className="card-header card-header--stack">
                  <div>
                    <p className="eyebrow">当前阶段</p>
                    <h2>{activeActionDeck.label}</h2>
                  </div>
                  <p>{activeActionDeck.summary}</p>
                </div>
                <div className="foundation-card__metrics">
                  <div className="foundation-pill">
                    <span>流程通道</span>
                    <strong>{activeActionDeck.lanes.length}</strong>
                  </div>
                  <div className="foundation-pill">
                    <span>动作数</span>
                    <strong>{activeActionDeckActionIds.length}</strong>
                  </div>
                  <div className="foundation-pill">
                    <span>交付阶段</span>
                    <strong>{activeActionDeckDeliveryStageIds.length}</strong>
                  </div>
                  <div className="foundation-pill">
                    <span>窗口面</span>
                    <strong>{activeActionDeckWindowIds.length}</strong>
                  </div>
                </div>
                <div className="workflow-readiness-list">
                  {activeActionDeck.lanes.map((lane) => (
                    <div key={lane.id} className={`workflow-readiness-line workflow-readiness-line--${lane.tone}`}>
                      <span>{lane.label}</span>
                      <strong>
                        {lane.actionIds.length} 个动作 / {(lane.deliveryChainStageIds ?? []).length} 个阶段 / {(lane.windowIds ?? []).length} 个窗口
                      </strong>
                    </div>
                  ))}
                </div>
              </article>
            ) : null}

            <article className="surface card foundation-card">
              <div className="card-header card-header--stack">
                <div>
                  <p className="eyebrow">布局状态</p>
                  <h2>布局记忆</h2>
                </div>
                <p>记录右侧栏、底栏、紧凑模式与当前工作区的本地布局状态。</p>
              </div>
              <div className="foundation-card__metrics">
                <div className="foundation-pill">
                  <span>右侧栏</span>
                  <strong>
                    {resolvedLayoutState.rightRailVisible
                      ? getZhRightRailTabLabel(resolvedLayoutState.rightRailTabId, rightRailTab?.label ?? "检查")
                      : "隐藏"}
                  </strong>
                </div>
                <div className="foundation-pill">
                  <span>底栏</span>
                  <strong>
                    {resolvedLayoutState.bottomDockVisible
                      ? getZhBottomDockTabLabel(resolvedLayoutState.bottomDockTabId, bottomDockTab?.label ?? "活动")
                      : "隐藏"}
                  </strong>
                </div>
                <div className="foundation-pill">
                  <span>工作区</span>
                  <strong>{workspaceView?.label ?? "不可用"}</strong>
                </div>
                <div className="foundation-pill">
                  <span>模式</span>
                  <strong>{resolvedLayoutState.compactMode ? "紧凑" : "标准"}</strong>
                </div>
              </div>
              <div className="foundation-card__actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    applyLayoutPatch(data.layout.defaultState);
                  }}
                >
                  重置布局
                </button>
                <span>本地存储 · {data.layout.persistence.storageKey}</span>
              </div>
            </article>

            <article className="surface card foundation-card">
              <div className="card-header card-header--stack">
                <div>
                  <p className="eyebrow">窗口姿态</p>
                  <h2>窗口协同</h2>
                </div>
                <p>查看当前工作区、流程通道、就绪度与交接状态。</p>
              </div>
              <div className="foundation-card__metrics">
                <div className="foundation-pill">
                  <span>当前姿态</span>
                  <strong>{getZhStatusValue(resolvedWindowPosture.label)}</strong>
                </div>
                <div className="foundation-pill">
                  <span>流程通道</span>
                  <strong>{selectedWorkflowLane?.label ?? "不可用"}</strong>
                </div>
                <div className="foundation-pill">
                  <span>就绪度</span>
                  <strong>{getZhStatusValue(workflowReadinessLabel)}</strong>
                </div>
                <div className="foundation-pill">
                  <span>交接状态</span>
                  <strong>{workflowIntent?.handoff.label ? getZhStatusValue(workflowIntent.handoff.label) : "不可用"}</strong>
                </div>
              </div>
              <div className="foundation-card__actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    advanceWorkflowLane();
                  }}
                >
                  推进一步
                </button>
                <span>{workflowIntent?.preview.title ?? "暂无已暂存意图"}</span>
              </div>
            </article>

            <article className="surface card foundation-card">
              <div className="card-header card-header--stack">
                <div>
                  <p className="eyebrow">交付链深度</p>
                  <h2>交付链工作区</h2>
                </div>
                <p>这里集中展示当前评审链路的阶段、审核队列、发布门与回滚准备度，保持只读、本地、安全边界。</p>
              </div>
              <div className="foundation-card__metrics">
                <div className="foundation-pill">
                  <span>阶段</span>
                  <strong>Phase60</strong>
                </div>
                <div className="foundation-pill">
                  <span>当前交付阶段</span>
                  <strong>{currentDeliveryStage?.label ?? "不可用"}</strong>
                </div>
                <div className="foundation-pill">
                  <span>交付相位</span>
                  <strong>{currentDeliveryStage?.phase ?? "不可用"}</strong>
                </div>
                <div className="foundation-pill">
                  <span>审核队列</span>
                  <strong>{currentReviewerQueue?.label ?? "不可用"}</strong>
                </div>
                <div className="foundation-pill">
                  <span>确认状态</span>
                  <strong>{currentReviewerQueue?.acknowledgementState ? getZhStatusValue(currentReviewerQueue.acknowledgementState) : "不可用"}</strong>
                </div>
                <div className="foundation-pill">
                  <span>发布门</span>
                  <strong>{publishDeliveryStage?.status ? getZhStatusValue(publishDeliveryStage.status) : "不可用"}</strong>
                </div>
                <div className="foundation-pill">
                  <span>回滚阶段</span>
                  <strong>{rollbackDeliveryStage?.status ? getZhStatusValue(rollbackDeliveryStage.status) : "不可用"}</strong>
                </div>
                <div className="foundation-pill">
                  <span>决策交接</span>
                  <strong>{getZhStatusValue(currentDecisionHandoff.batonState)}</strong>
                </div>
                <div className="foundation-pill">
                  <span>证据收口</span>
                  <strong>{getZhStatusValue(currentEvidenceCloseout.sealingState)}</strong>
                </div>
              </div>
              <div className="workflow-readiness-list">
                <div className="workflow-readiness-line workflow-readiness-line--neutral">
                  <span>当前看板</span>
                  <strong>{currentReleaseStage?.label ?? "不可用"}</strong>
                </div>
                <div className="workflow-readiness-line workflow-readiness-line--neutral">
                  <span>队列归属</span>
                  <strong>{currentReviewerQueue ? `${currentReviewerQueue.owner} / ${getZhStatusValue(currentReviewerQueue.status)}` : "不可用"}</strong>
                </div>
                <div className="workflow-readiness-line workflow-readiness-line--neutral">
                  <span>推进路径</span>
                  <strong>{releaseApprovalPipeline.deliveryChain.promotionStageIds.length} 个关联阶段</strong>
                </div>
                <div className="workflow-readiness-line workflow-readiness-line--warning">
                  <span>发布 / 回滚</span>
                  <strong>{publishDeliveryStage?.label ?? "不可用"} / {rollbackDeliveryStage?.label ?? "不可用"}</strong>
                </div>
                <div className="workflow-readiness-line workflow-readiness-line--warning">
                  <span>阻塞项</span>
                  <strong>{releaseApprovalPipeline.deliveryChain.blockedBy.length} 个链路阻塞</strong>
                </div>
              </div>
              <div className="workflow-readiness-list">
                {releasePipelineDepth.map((item) => (
                  <div key={item.id} className="workflow-readiness-line workflow-readiness-line--neutral">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <OperatorReviewBoard
            pipeline={releaseApprovalPipeline}
            windowing={data.windowing}
            eyebrow="Phase60"
            title="操作审查面板"
            summary="把当前只读评审链路按操作面板方式展示，方便查看阶段归属、审核队列、确认状态与交接关系。"
          />

          <DeliveryChainWorkspace
            pipeline={releaseApprovalPipeline}
            boundary={data.boundary}
            windowing={data.windowing}
            reviewStateContinuity={data.reviewStateContinuity}
            actionDeck={activeActionDeck}
            reviewSurfaceActions={reviewCoverageActions}
            activeReviewSurfaceActionId={resolvedReviewSurfaceAction?.id ?? null}
            activeCompanionRouteStateId={activeCompanionRouteState?.id ?? null}
            activeCompanionSequenceId={activeCompanionSequence?.id ?? null}
            activeCompanionRouteHistoryEntryId={activeCompanionRouteHistoryEntry?.id ?? null}
            activeCompanionPathHandoffId={activeCompanionPathHandoff?.id ?? null}
            companionRouteHistoryEntries={persistedCompanionRouteEntries}
            selectedStageId={resolvedDeliveryCoverageStage?.id ?? null}
            onSelectStage={handleSelectDeliveryStage}
            onRunReviewSurfaceAction={handleRunReviewSurfaceAction}
            onRunCompanionSequence={handleRunCompanionSequence}
            onRunCompanionRouteHistory={handleRunCompanionRouteHistory}
            eyebrow="Phase60"
            title="Delivery-chain Workspace"
            summary="Phase60 slice41 keeps the artifact checkpoint chain in place, then deepens the same Stage Explorer with current-vs-next handoff continuity so each source-to-seal handoff carries its downstream staged-output, review-packet, validator, failure, and next-surface posture across the same local-only window/lane/board spine."
          />

          <section className="surface card window-workbench">
            <div className="card-header card-header--stack">
              <div>
                <p className="eyebrow">Workflow Timeline</p>
                <h2>Windowing Workbench</h2>
              </div>
              <p>{data.windowing.workflow.summary}</p>
            </div>
            <div className="window-workbench__grid">
              <article className="windowing-summary-card">
                <span>Current workflow lane</span>
                <strong>{selectedWorkflowLane?.label ?? "No workflow lane"}</strong>
                <p>{selectedWorkflowLane?.summary ?? resolvedWindowPosture.summary}</p>
                <div className="windowing-card__meta">
                  <span className="windowing-badge windowing-badge--active">{workflowWorkspace?.label ?? "No workspace"}</span>
                  <span className="windowing-badge">{workflowDetachedPanel?.label ?? "No detached panel"}</span>
                  <span className="windowing-badge">{workflowIntent ? formatWorkflowPosture(workflowIntent.workflowStep.posture) : "No posture"}</span>
                  <span className="windowing-badge">Local-only</span>
                </div>
                <div className="windowing-card__actions">
                  <button type="button" className="secondary-button" onClick={() => advanceWorkflowLane()}>
                    Advance Workflow
                  </button>
                </div>
              </article>

              <article className="windowing-summary-card windowing-summary-card--active">
                <span>Review Posture Ownership</span>
                <strong>
                  {activeObservabilityMapping
                    ? `${activeObservabilityMapping.label} / ${formatReviewPostureRelationship(activeObservabilityMapping.relationship)}`
                    : "No active review posture"}
                </strong>
                <p>
                  {activeObservabilityMapping?.summary ??
                    "Cross-window review posture ownership is unavailable, so the shell cannot show which window, lane, and board currently own the live review posture."}
                </p>
                <div className="windowing-preview-list">
                  {data.windowing.observability.signals.slice(0, 4).map((signal) => (
                    <div key={signal.id} className="windowing-preview-line windowing-preview-line--stacked">
                      <span>{signal.label}</span>
                      <strong>{signal.value}</strong>
                      <p>{signal.detail}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="windowing-summary-card">
                <span>Readiness Board</span>
                <strong>{workflowReadinessLabel}</strong>
                <p>{workflowIntent?.readiness.summary ?? "Select a window intent to see workflow readiness and linked shell posture."}</p>
                <div className="workflow-readiness-list">
                  {(workflowIntent?.readiness.checks ?? []).map((check) => (
                    <div key={check.id} className={`workflow-readiness-line workflow-readiness-line--${check.tone}`}>
                      <span>{check.label}</span>
                      <strong>{check.value}</strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className="windowing-summary-card">
                <span>Handoff Posture</span>
                <strong>{workflowIntent?.handoff.label ?? "No handoff posture"}</strong>
                <p>{workflowIntent?.handoff.summary ?? "Select a window intent to see its local-only handoff posture."}</p>
                <div className="windowing-preview-list">
                  {(workflowIntent?.preview.lines ?? []).map((line) => (
                    <div key={`${workflowIntent?.id}-${line.label}`} className="windowing-preview-line">
                      <span>{line.label}</span>
                      <strong>{line.value}</strong>
                    </div>
                  ))}
                </div>
                <div className="windowing-card__actions">
                  <span className="windowing-badge">{workflowIntent?.handoff.destination ?? "No linked destination"}</span>
                  <span className="windowing-badge">{workflowLinkedShell}</span>
                </div>
              </article>
            </div>
            <WindowSharedStateBoard
              windowing={data.windowing}
              boundary={data.boundary}
              reviewStateContinuity={data.reviewStateContinuity}
              releaseApprovalPipeline={releaseApprovalPipeline}
              actionDeck={activeActionDeck}
              reviewSurfaceActions={reviewCoverageActions}
              activeReviewSurfaceActionId={resolvedReviewSurfaceAction?.id ?? null}
              onRunReviewSurfaceAction={handleRunReviewSurfaceAction}
              activeCompanionSequenceId={activeCompanionSequence?.id ?? null}
              onRunCompanionSequence={handleRunCompanionSequence}
              activeRouteId={windowingSurface.activeRouteId}
              activeWindowId={windowingSurface.activeWindowId}
              activeLaneId={windowingSurface.activeLaneId}
              activeBoardId={windowingSurface.activeBoardId}
              activeMappingId={windowingSurface.activeMappingId}
              eyebrow="Phase60"
              title="Cross-window Coordination Board"
              summary="Window roster, shared-state lane ownership, orchestration board ownership, review posture ownership, reviewer queue posture, acknowledgement state, escalation windows, closeout windows, sync health, last handoff, route/workspace intent links, the delivery-chain workspace, and local-only blockers now stay visible inside the same shell runtime."
            />
            <div className="workflow-lane-strip">
              {data.windowing.workflow.lanes.map((lane) => (
                <button
                  key={lane.id}
                  type="button"
                  className={lane.id === selectedWorkflowLane?.id ? "workflow-lane-card workflow-lane-card--active" : "workflow-lane-card"}
                  onClick={() => {
                    advanceWorkflowLane(lane);
                  }}
                >
                  <strong>{lane.label}</strong>
                  <p>{lane.summary}</p>
                  <div className="windowing-card__meta">
                    <span className="windowing-badge">{formatWorkflowPosture(lane.posture)} posture</span>
                    <span className="windowing-badge">{lane.stepIds.length} steps</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="workflow-step-grid">
              {workflowStepCards.map((card) => (
                <article
                  key={card.step.id}
                  className={`workflow-step-card workflow-step-card--${getWorkflowStateTone(card.state)}${
                    card.state === "focused" || card.state === "surfaced" || card.state === "entered" ? " workflow-step-card--active" : ""
                  }`}
                >
                  <div className="workflow-step-card__meta">
                    <span>{formatWorkflowStepKind(card.step.kind)}</span>
                    <strong>{card.statusLabel}</strong>
                  </div>
                  <h3>{card.step.label}</h3>
                  <p>{card.step.summary}</p>
                  <div className="windowing-card__meta">
                    <span className="windowing-badge">{formatWorkflowPosture(card.step.posture)} posture</span>
                    {card.step.workspaceViewId ? <span className="windowing-badge">{card.step.workspaceViewId}</span> : null}
                    {card.step.detachedPanelId ? <span className="windowing-badge">{card.step.detachedPanelId}</span> : null}
                  </div>
                  <button type="button" className="secondary-button" onClick={card.activate}>
                    {card.actionLabel}
                  </button>
                </article>
              ))}
            </div>
            <div className="workflow-support-grid">
              <article className="windowing-summary-card">
                <span>Linked Shell Workflow</span>
                <strong>{workflowLinkedShell}</strong>
                <p>
                  Workspace entry, detached candidate surfacing, and work posture now drive the same shell linkage in the top bar, main panel, inspector,
                  and dock without opening any native external window.
                </p>
              </article>
              <article className="windowing-summary-card">
                <span>Workflow Step</span>
                <strong>{workflowIntent?.workflowStep.label ?? "No active workflow step"}</strong>
                <p>{workflowIntent?.workflowStep.summary ?? "Select a workflow lane to see its step-level posture and handoff readiness."}</p>
                <div className="windowing-card__meta">
                  <span className="windowing-badge">{workflowIntent ? formatWorkflowPosture(workflowIntent.workflowStep.posture) : "No posture"}</span>
                  <span className={`windowing-badge${workflowIntent?.localStatus === "focused" ? " windowing-badge--active" : ""}`}>
                    {workflowIntent ? formatIntentStatus(workflowIntent.localStatus) : "No intent"}
                  </span>
                </div>
              </article>
              <article className="windowing-summary-card">
                <span>Cross-view Coordination Matrix</span>
                <strong>{selectedWorkflowLane?.label ?? "No workflow lane"}</strong>
                <p>
                  Route, command flow, workspace, detached candidate, intent focus, and focused slot now stay grouped as one coordination matrix instead of
                  separate shell hints.
                </p>
                <div className="windowing-preview-list">
                  {crossViewCoordinationMatrix.map((item) => (
                    <div key={item.id} className="windowing-preview-line">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>

          <Suspense fallback={<PageLoadingState />}>
            {renderPage(
              activePage,
              data,
              {
                focusedSlotId: resolvedFocusSlotId,
                onFocusedSlotChange: setFocusedSlotId
              },
              commandPanel,
              windowingSurface
            )}
          </Suspense>
        </main>

        {resolvedLayoutState.rightRailVisible ? (
          <aside className="inspector surface">
            <div className="panel-title-row">
              <h2>{getZhRightRailTabLabel(resolvedLayoutState.rightRailTabId, rightRailTab?.label ?? data.inspector.title)}</h2>
              <span>{workspaceView?.label ?? "工作台"}</span>
            </div>
            <p className="panel-summary">{resolvedLayoutState.rightRailTabId === "inspector" ? "检查面板：显示当前上下文与关键状态。" : resolvedLayoutState.rightRailTabId === "trace" ? "追踪面板：查看焦点槽位与运行轨迹。" : "窗口面板：查看窗口协同与姿态。"}</p>
            <div className="shell-tab-strip">
              {data.layout.rightRailTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={tab.id === resolvedLayoutState.rightRailTabId ? "shell-tab shell-tab--active" : "shell-tab"}
                  onClick={() => {
                    applyLayoutPatch({
                      rightRailTabId: tab.id,
                      rightRailVisible: true
                    });
                  }}
                >
                  {getZhRightRailTabLabel(tab.id, tab.label)}
                </button>
              ))}
            </div>

            <div className="inspector-content-scroll">
            {resolvedLayoutState.rightRailTabId === "inspector" ? (
              <>
                <BoundarySummaryCard boundary={data.inspector.boundary} compact nested eyebrow="Inspector" />
                <div className="inspector-list">
                  {inspectorSections.map((section) => (
                    <article key={section.id} className="inspector-card">
                      <span>{section.label}</span>
                      <strong>{section.value}</strong>
                    </article>
                  ))}
                </div>
                <article className="windowing-summary-card">
                  <span>Inspector-Command Linkage</span>
                  <strong>{activeContextualFlow?.label ?? activeSequence?.label ?? "No active flow"}</strong>
                  <p>
                    Inspector drilldowns now mirror the active command flow, next-step board, and orchestration posture instead of only repeating boundary
                    state.
                  </p>
                  <div className="windowing-preview-list">
                    {inspectorCommandLinkage.map((item) => (
                      <div key={item.id} className="windowing-preview-line">
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </article>
                <article className="windowing-summary-card">
                  <span>Inspector Materialization Checkpoint Progression</span>
                  <strong>
                    {activeMaterializationArtifactSurface.activeHandoff?.label ??
                      activeMaterializationArtifactSurface.artifactLedger?.label ??
                      "No artifact handoff"}
                  </strong>
                  <p>
                    Inspector-side materialization coverage now carries the same current-vs-next artifact handoff progression as the delivery
                    workspace and windows board, then resolves the active surface into linked seal, failure, Stage C, and next-surface continuity
                    without implying execution.
                  </p>
                  <div className="windowing-preview-list">
                    <div className="windowing-preview-line windowing-preview-line--stacked">
                      <span>Current handoff</span>
                      <strong>
                        {activeMaterializationArtifactSurface.activeHandoff
                          ? `${activeMaterializationArtifactSurface.activeHandoff.label} / ${formatMaterializationValidatorStatus(
                              activeMaterializationArtifactSurface.activeHandoff.status
                            )}`
                          : "Unavailable"}
                      </strong>
                      <p>{activeMaterializationArtifactSurface.activeHandoff?.summary ?? "No artifact handoff summary is available."}</p>
                    </div>
                    <div className="windowing-preview-line windowing-preview-line--stacked">
                      <span>Artifact checkpoint progression</span>
                      <strong>{artifactCheckpointProgressionPath}</strong>
                      <p>{artifactCurrentToNextSummary}</p>
                    </div>
                    <div className="windowing-preview-line windowing-preview-line--stacked">
                      <span>Current vs next handoff</span>
                      <strong>{artifactCurrentToNextHandoffLabel}</strong>
                      <p>
                        {currentArtifactSurfaceContinuity}
                        {" / "}
                        {nextArtifactSurfaceContinuity}
                      </p>
                    </div>
                    <div className="windowing-preview-line windowing-preview-line--stacked">
                      <span>Current surface spine</span>
                      <strong>{currentArtifactSurfaceDescriptor}</strong>
                      <p>{currentArtifactSurfaceSpine}</p>
                    </div>
                    <div className="windowing-preview-line windowing-preview-line--stacked">
                      <span>Next surface spine</span>
                      <strong>{nextArtifactSurfaceDescriptor}</strong>
                      <p>{nextArtifactSurfaceSpine}</p>
                    </div>
                    <div className="windowing-preview-line windowing-preview-line--stacked">
                      <span>Source to Target</span>
                      <strong>
                        {activeMaterializationArtifactSurface.sourceArtifacts.length} source /{" "}
                        {activeMaterializationArtifactSurface.targetArtifacts.length} target
                      </strong>
                      <p>
                        {activeMaterializationArtifactSurface.sourceArtifacts
                          .map((artifact) => artifact.label)
                          .concat(activeMaterializationArtifactSurface.targetArtifacts.map((artifact) => artifact.label))
                          .join(" / ") || "No artifact chain is available."}
                      </p>
                    </div>
                    <div className="windowing-preview-line windowing-preview-line--stacked">
                      <span>Continuity surface</span>
                      <strong>
                        {activeMaterializationArtifactSurface.observabilityMapping?.label ??
                          activeMaterializationArtifactSurface.activeHandoff?.observabilityMappingId ??
                          "No observability path"}
                      </strong>
                      <p>
                        {activeMaterializationArtifactSurface.reviewStateContinuityEntry?.label ??
                          (activeMaterializationArtifactSurface.activeHandoff
                            ? `${activeMaterializationArtifactSurface.window?.label ?? activeMaterializationArtifactSurface.activeHandoff.windowId} / ${
                                activeMaterializationArtifactSurface.lane?.label ??
                                activeMaterializationArtifactSurface.activeHandoff.sharedStateLaneId
                              }`
                            : "No continuity match")}
                      </p>
                    </div>
                    <div className="windowing-preview-line windowing-preview-line--stacked">
                      <span>Artifact checkpoint chain</span>
                      <strong>
                        {activeMaterializationArtifactSurface.bundleSealingCheckpoint
                          ? `${activeMaterializationArtifactSurface.bundleSealingCheckpoint.label} / ${formatMaterializationValidatorStatus(
                              activeMaterializationArtifactSurface.bundleSealingCheckpoint.status
                            )}`
                          : "Unavailable"}
                      </strong>
                      <p>
                        {activeMaterializationArtifactSurface.bundleSealingCheckpoint
                          ? `${activeMaterializationArtifactSurface.bundleSealingCheckpoint.artifactPath} / ${
                              activeMaterializationArtifactSurface.bundleSealingCheckpoint.detail
                            }`
                          : "No seal checkpoint is linked to the active artifact handoff."}
                      </p>
                    </div>
                    <div className="windowing-preview-line windowing-preview-line--stacked">
                      <span>Artifact failure link</span>
                      <strong>
                        {activeMaterializationArtifactSurface.failureReadout
                          ? `${activeMaterializationArtifactSurface.failureReadout.label} / ${formatFailureDisposition(
                              activeMaterializationArtifactSurface.failureReadout.failureDisposition
                            )}`
                          : "Unavailable"}
                      </strong>
                      <p>
                        {activeMaterializationArtifactSurface.failureReadout?.summary ??
                          "No failure readout is linked to the active artifact handoff."}
                      </p>
                    </div>
                    <div className="windowing-preview-line windowing-preview-line--stacked">
                      <span>Artifact Stage C link</span>
                      <strong>
                        {activeMaterializationArtifactSurface.stageCCheckpoint
                          ? `${activeMaterializationArtifactSurface.stageCCheckpoint.label} / ${
                              activeMaterializationArtifactSurface.approvalWorkflowStage?.label ?? "No workflow stage"
                            }`
                          : "Unavailable"}
                      </strong>
                      <p>
                        {activeMaterializationArtifactSurface.releaseQaTrack?.label ??
                          "No Stage C QA track is linked to the active artifact handoff."}
                      </p>
                    </div>
                  </div>
                </article>
                <article className="windowing-summary-card">
                  <span>Inspector Review Navigation</span>
                  <strong>{activeReplayScenarioLabel}</strong>
                  <p>
                    Inspector-side reviewer navigation now carries the same replay pack, verdict context, route anchor, evidence chain, and handoff focus
                    as the delivery workspace and command palette.
                  </p>
                  <div className="windowing-preview-list">
                    {inspectorReviewConsoleLines.map((item) => (
                      <div key={item.id} className="windowing-preview-line windowing-preview-line--stacked">
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                        <p>{item.detail}</p>
                      </div>
                    ))}
                  </div>
                  <div className="windowing-card__actions">
                    <button type="button" className="secondary-button" onClick={openCommandPalette}>
                      Open Command Palette
                    </button>
                    {recommendedAction ? (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                          executeCommand(recommendedAction);
                        }}
                      >
                        Run Recommended Action
                      </button>
                    ) : null}
                    {resolvedReviewSurfaceAction ? (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                          handleRunReviewSurfaceAction(resolvedReviewSurfaceAction);
                        }}
                      >
                        Focus Active Review Surface
                      </button>
                    ) : null}
                    {latestReplayRestoreEntryId ? (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                          handleRunCompanionRouteHistory(latestReplayRestoreEntryId);
                        }}
                      >
                        Restore Latest Handoff
                      </button>
                    ) : null}
                    {windowsObservabilityAction ? (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                          executeCommand(windowsObservabilityAction);
                        }}
                      >
                        Inspect Cross-window Observability
                      </button>
                    ) : null}
                  </div>
                </article>
                {data.inspector.drilldowns.slice(0, 2).map((drilldown) => (
                  <article key={drilldown.id} className="windowing-summary-card">
                    <span>{drilldown.label}</span>
                    <strong>{drilldown.summary}</strong>
                    <div className="windowing-preview-list">
                      {drilldown.lines.map((line) => (
                        <div key={line.id} className="windowing-preview-line windowing-preview-line--stacked">
                          <span>{line.label}</span>
                          <strong>{line.value}</strong>
                          <p>{line.detail}</p>
                          {line.links?.length ? (
                            <div className="trace-note-links">
                              {line.links.map((link) => (
                                <span key={link.id} className="windowing-badge">
                                  {link.label}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </>
            ) : null}

            {resolvedLayoutState.rightRailTabId === "trace" ? (
              <HostTracePanel
                hostExecutor={data.inspector.boundary.hostExecutor}
                focusedSlotId={resolvedFocusSlotId}
                onFocusedSlotChange={setFocusedSlotId}
                compact
                nested
                eyebrow="Trace"
                title="Focused Slot Trace"
                summary="Current slot, handler, validator, result, rollback, and slot roster stay concentrated in the right rail even while host execution remains disabled."
              />
            ) : null}

            {resolvedLayoutState.rightRailTabId === "windows" ? (
              <div className="windowing-panel">
                <article className="windowing-summary-card">
                  <span>Window Posture</span>
                  <strong>{resolvedWindowPosture.label}</strong>
                  <p>{resolvedWindowPosture.summary}</p>
                  <div className="windowing-card__meta">
                    <span className="windowing-badge windowing-badge--active">{workflowWorkspace?.label ?? "No workspace"}</span>
                    <span className="windowing-badge">{workflowDetachedPanel?.label ?? "No detached panel"}</span>
                    <span className="windowing-badge">{workflowIntent ? formatIntentStatus(workflowIntent.localStatus) : "No intent"}</span>
                  </div>
                </article>

                <article className="windowing-summary-card">
                  <span>Workflow Timeline</span>
                  <strong>{selectedWorkflowLane?.label ?? "No workflow lane"}</strong>
                  <p>{selectedWorkflowLane?.summary ?? "Select a workspace, detached candidate, or intent to sync the workflow lane."}</p>
                  <div className="windowing-card__meta">
                    <span className={`windowing-badge${workflowReadinessTone === "positive" ? " windowing-badge--active" : ""}`}>{workflowReadinessLabel}</span>
                    <span className="windowing-badge">{workflowIntent?.handoff.label ?? "No handoff posture"}</span>
                    <span className="windowing-badge">{workflowLinkedShell}</span>
                  </div>
                  <div className="windowing-card__actions">
                    <button type="button" className="secondary-button" onClick={() => advanceWorkflowLane()}>
                      Advance Workflow
                    </button>
                  </div>
                </article>

                <article className="windowing-summary-card windowing-summary-card--active">
                  <span>Review Posture Ownership</span>
                  <strong>
                    {activeObservabilityMapping
                      ? `${activeObservabilityMapping.label} / ${formatReviewPostureRelationship(activeObservabilityMapping.relationship)}`
                      : "No active review posture"}
                  </strong>
                  <p>
                    {activeObservabilityMapping?.summary ??
                      "Cross-window review posture ownership is unavailable, so the windows rail cannot show which surface currently owns the review posture."}
                  </p>
                  <div className="windowing-preview-list">
                    {data.windowing.observability.signals.slice(0, 4).map((signal) => (
                      <div key={signal.id} className="windowing-preview-line windowing-preview-line--stacked">
                        <span>{signal.label}</span>
                        <strong>{signal.value}</strong>
                        <p>{signal.detail}</p>
                      </div>
                    ))}
                  </div>
                </article>

                <WindowSharedStateBoard
                  windowing={data.windowing}
                  boundary={data.boundary}
                  reviewStateContinuity={data.reviewStateContinuity}
                  releaseApprovalPipeline={releaseApprovalPipeline}
                  actionDeck={activeActionDeck}
                  reviewSurfaceActions={reviewCoverageActions}
                  activeReviewSurfaceActionId={resolvedReviewSurfaceAction?.id ?? null}
                  onRunReviewSurfaceAction={handleRunReviewSurfaceAction}
                  activeCompanionSequenceId={activeCompanionSequence?.id ?? null}
                  onRunCompanionSequence={handleRunCompanionSequence}
                  activeRouteId={windowingSurface.activeRouteId}
                  activeWindowId={windowingSurface.activeWindowId}
                  activeLaneId={windowingSurface.activeLaneId}
                  activeBoardId={windowingSurface.activeBoardId}
                  activeMappingId={windowingSurface.activeMappingId}
                  compact
                  nested
                  eyebrow="Phase60"
                  title="Cross-window Shared State"
                  summary="The windows rail now exposes explicit ownership, orchestration board linkage, review posture ownership, reviewer queue posture, acknowledgement state, escalation/closeout windows, sync health, route/workspace intent links, delivery-stage mapping, and local-only blockers for the active coordination lane."
                />

                <div className="workflow-step-grid workflow-step-grid--compact">
                  {workflowStepCards.map((card) => (
                    <article
                      key={card.step.id}
                      className={`workflow-step-card workflow-step-card--${getWorkflowStateTone(card.state)}${
                        card.state === "focused" || card.state === "surfaced" || card.state === "entered" ? " workflow-step-card--active" : ""
                      }`}
                    >
                      <div className="workflow-step-card__meta">
                        <span>{formatWorkflowStepKind(card.step.kind)}</span>
                        <strong>{card.statusLabel}</strong>
                      </div>
                      <h3>{card.step.label}</h3>
                      <p>{card.step.summary}</p>
                      <button type="button" className="secondary-button" onClick={card.activate}>
                        {card.actionLabel}
                      </button>
                    </article>
                  ))}
                </div>

                <article className="windowing-summary-card">
                  <span>Readiness Board</span>
                  <strong>{workflowReadinessLabel}</strong>
                  <p>{workflowIntent?.readiness.summary ?? "Readiness markers appear when a workflow intent is selected."}</p>
                  <div className="workflow-readiness-list">
                    {(workflowIntent?.readiness.checks ?? []).map((check) => (
                      <div key={check.id} className={`workflow-readiness-line workflow-readiness-line--${check.tone}`}>
                        <span>{check.label}</span>
                        <strong>{check.value}</strong>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="windowing-summary-card">
                  <span>Handoff Posture</span>
                  <strong>{workflowIntent?.handoff.label ?? "No handoff posture"}</strong>
                  <p>{workflowIntent?.handoff.summary ?? "Handoff posture stays local-only in this phase."}</p>
                  <div className="windowing-card__meta">
                    <span className="windowing-badge">{workflowIntent?.handoff.destination ?? "No destination"}</span>
                    <span className="windowing-badge">{workflowIntent?.handoff.safeMode ?? "local-only"}</span>
                  </div>
                </article>

                <div className="section-stack">
                  {data.windowing.views.map((view) => (
                    <button
                      key={view.id}
                      type="button"
                      className={view.id === workspaceView?.id ? "windowing-card windowing-card--active" : "windowing-card"}
                      onClick={() => {
                        activateWorkspaceView(view.id, {
                          activity: {
                            label: view.label,
                            detail: `${view.label} is now the active detached workspace candidate.`,
                            safety: "local-only"
                          }
                        });
                      }}
                    >
                      <strong>{view.label}</strong>
                      <p>{view.summary}</p>
                      <div className="windowing-card__meta">
                        <span className="windowing-badge">{formatDetachState(view.detachState)}</span>
                        <span className="windowing-badge">{view.shellRole}</span>
                        <span className="windowing-badge">{view.intentIds.length} intents</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="section-stack">
                  {windowIntents.map((intent) => (
                    <button
                      key={intent.id}
                      type="button"
                      className={intent.id === selectedWindowIntent?.id ? "windowing-card windowing-card--active" : "windowing-card"}
                      onClick={() => {
                        stageWindowIntent(intent.id, {
                          status: "focused",
                          activity: {
                            label: intent.label,
                            detail: `${intent.label} moved into focused intent posture with ${intent.shellLink.pageId} and ${intent.shellLink.rightRailTabId}/${intent.shellLink.bottomDockTabId} linked.`,
                            safety: "local-only"
                          }
                        });
                      }}
                    >
                      <strong>{intent.label}</strong>
                      <p>{intent.preview.summary}</p>
                      <div className="windowing-card__meta">
                        <span className="windowing-badge">{formatIntentStatus(intent.localStatus)}</span>
                        <span className="windowing-badge">{formatIntentFocus(intent.focus)}</span>
                        <span className="windowing-badge">{intent.target}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {selectedWindowIntent ? (
                  <article className="windowing-summary-card">
                    <span>{workflowIntent?.preview.title ?? selectedWindowIntent.preview.title}</span>
                    <strong>{workflowIntent?.label ?? selectedWindowIntent.label}</strong>
                    <p>{workflowIntent?.preview.summary ?? selectedWindowIntent.preview.summary}</p>
                    <div className="windowing-preview-list">
                      {(workflowIntent?.preview.lines ?? selectedWindowIntent.preview.lines).map((line) => (
                        <div key={`${workflowIntent?.id ?? selectedWindowIntent.id}-${line.label}`} className="windowing-preview-line">
                          <span>{line.label}</span>
                          <strong>{line.value}</strong>
                        </div>
                      ))}
                    </div>
                  </article>
                ) : null}

                <article className="windowing-summary-card">
                  <span>Detached Workspace Candidates</span>
                  <strong>{selectedDetachedPanel?.label ?? "No detached candidate"}</strong>
                  <p>
                    Detached Workspace Candidates stay tied to the active workflow lane so the shell can surface review, trace, and preview posture
                    without opening a real native window.
                  </p>
                </article>

                <div className="section-stack">
                  {data.windowing.detachedPanels.map((panel) => (
                    <button
                      key={panel.id}
                      type="button"
                      className={panel.id === selectedDetachedPanel?.id ? "windowing-card windowing-card--active" : "windowing-card"}
                      onClick={() => {
                        activateDetachedPanel(panel.id, {
                          label: panel.label,
                          detail: `${panel.label} is now the active detached workspace candidate for ${panel.workspaceViewId}.`,
                          safety: "local-only"
                        });
                      }}
                    >
                      <strong>{panel.label}</strong>
                      <p>{panel.summary}</p>
                      <div className="windowing-card__meta">
                        <span className="windowing-badge">{panel.workspaceViewId}</span>
                        <span className="windowing-badge">{formatDetachState(panel.detachState)}</span>
                        <span className="windowing-badge">{panel.shellRole}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            </div>
          </aside>
        ) : null}

        {resolvedLayoutState.bottomDockVisible ? (
          <section className="bottom-dock surface">
            <div className="panel-title-row">
              <h2>底部摘要</h2>
              <button
                type="button"
                className="secondary-button bottom-dock__collapse"
                onClick={() => {
                  applyLayoutPatch({
                    bottomDockVisible: false
                  });
                }}
              >
                收起底栏
              </button>
            </div>
            <p className="panel-summary">只保留页面、工作区和最近操作，避免底栏过长过杂。</p>

            <div className="bottom-dock-content-scroll">
              <div className="dock-list dock-list--summary">
                <article className="dock-card dock-card--neutral">
                  <span>当前页面</span>
                  <strong>{activePageLabel}</strong>
                  <p>{activePageHint}</p>
                </article>
                <article className="dock-card dock-card--neutral">
                  <span>工作区状态</span>
                  <strong>{workspaceView?.label ?? "不可用"}</strong>
                  <p>
                    就绪度：{workflowReadinessLabel} · 模式：{resolvedLayoutState.compactMode ? "紧凑" : "标准"}
                  </p>
                </article>
                <article className="dock-card dock-card--neutral">
                  <span>最近操作</span>
                  <strong>{latestCommandEntry?.timestamp ?? "暂无记录"}</strong>
                  <p>
                    {latestCommandEntry
                      ? `${getZhStatusValue(latestCommandEntry.safety)} · 已记录最近一次交互`
                      : "当前还没有最近操作记录"}
                  </p>
                </article>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
