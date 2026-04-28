import { Suspense, lazy, useEffect, useState } from "react";
import {
  Activity,
  Bot,
  Boxes,
  Code2,
  Command,
  Cpu,
  Gauge,
  History,
  LayoutDashboard,
  MessageSquare,
  Moon,
  PanelRight,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  TerminalSquare,
  Users
} from "lucide-react";
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
  type StudioWindowIntentStatus,
  type StudioHermesState,
  type SessionSummary
} from "@openclaw/shared";
import { loadHermesState, subscribeToHermesEvents } from "@openclaw/bridge";
import { applyPreviewHygiene } from "./preview-hygiene";
import { useStudioData } from "./hooks/useStudioData";
import { useDashboardRealtimeData, type DashboardRealtimeViewModel } from "./hooks/useDashboardRealtimeData";
import { DashboardPage, type DashboardThemeMode } from "./pages/DashboardPage";
import { GatewayRailStatus } from "./components/dashboard";
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
import {
  createPersistedWorkbenchState,
  replacePersistedWorkbenchState,
  readPersistedWorkbenchState,
  type PersistedWorkbenchState,
  type WorkbenchSessionFilter
} from "./components/workbench-persistence";
import {
  resolveWorkbenchResumeActionDescriptor,
  resolveWorkbenchResumeSurfacePatch,
  type WorkbenchResumeActionDescriptor
} from "./components/workbench-resume-action";
import { resolveCompanionRouteContext, type ReviewCoverageAction } from "./reviewCoverageRouteState";

const LazySessionsPage = lazy(async () => {
  const { SessionsPage } = await import("./pages/SessionsPage");
  return { default: SessionsPage };
});

const LazyChatPage = lazy(async () => {
  const { ChatPage } = await import("./pages/ChatPage");
  return { default: ChatPage };
});

const LazyHermesPage = lazy(async () => {
  const { HermesPage } = await import("./pages/HermesPage");
  return { default: HermesPage };
});

const LazyAgentsPage = lazy(async () => {
  const { AgentsPage } = await import("./pages/AgentsPage");
  return { default: AgentsPage };
});

const LazySkillsPage = lazy(async () => {
  const { SkillsPage } = await import("./pages/SkillsPage");
  return { default: SkillsPage };
});

const LazySettingsPage = lazy(async () => {
  const { SettingsPage } = await import("./pages/SettingsPage");
  return { default: SettingsPage };
});

import {
  resolvePage,
  resolveStartupPage,
  getRouteHashForPageId,
  visibleStudioPageIds,
  formatLiveSyncAge,
  dedupeCommandActions,
  dedupeById
} from "./lib/app-utils";
import { formatProductText } from "./lib/product-text";

applyPreviewHygiene();

function navigateToPage(pageId: StudioPageId) {
  window.location.hash = `#${getRouteHashForPageId(pageId)}`;
}

const LIVE_PAGE_IDS = new Set<StudioPageId>(["dashboard", "chat", "hermes", "sessions"]);
const UTILITY_PAGE_IDS = new Set<StudioPageId>(["skills", "settings", "agents"]);
type SessionSurfaceId = "openclaw" | "hermes";
const SESSION_SURFACES: Array<{ id: SessionSurfaceId; label: string; detail: string }> = [
  { id: "openclaw", label: "OpenClaw", detail: "当前活动" },
  { id: "hermes", label: "Hermes", detail: "记忆与网关" }
];

function resolveInitialSessionSurface(): SessionSurfaceId {
  if (typeof window === "undefined") {
    return "openclaw";
  }

  const route = window.location.hash.replace("#", "").trim().toLowerCase();
  if (route === "hermes") {
    return "hermes";
  }
  return "openclaw";
}

const PAGE_LABEL_ZH: Partial<Record<StudioPageId, string>> = {
  dashboard: "总览",
  home: "总览",
  chat: "OpenClaw",
  hermes: "Hermes",
  claude: "会话",
  sessions: "历史",
  agents: "高级诊断",
  codex: "总览",
  skills: "能力",
  settings: "配置"
};
const ADVANCED_REVIEW_DECK_QUERY_PARAM = "reviewDeck";
const ADVANCED_REVIEW_DECK_STORAGE_KEY = "openclaw-studio.reviewDeck";
const DASHBOARD_THEME_STORAGE_KEY = "openclaw-studio.dashboardTheme";

function getInitialDashboardTheme(): DashboardThemeMode {
  if (typeof window === "undefined") {
    return "night";
  }

  try {
    const persisted = window.localStorage.getItem(DASHBOARD_THEME_STORAGE_KEY);
    if (persisted === "night" || persisted === "day") {
      return persisted;
    }
  } catch {
    // Theme persistence is optional; fall back to the default theme when storage is unavailable.
  }

  return "night";
}

function isAdvancedReviewDeckEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const search = new URLSearchParams(window.location.search);
  if (search.get(ADVANCED_REVIEW_DECK_QUERY_PARAM) === "1") {
    return true;
  }

  try {
    return window.localStorage.getItem(ADVANCED_REVIEW_DECK_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

const PAGE_HINT_ZH: Partial<Record<StudioPageId, string>> = {
  dashboard: "运行健康",
  home: "运行健康",
  chat: "OpenClaw 与终端流",
  hermes: "记忆会话层",
  claude: "OpenClaw 与终端流",
  sessions: "历史与恢复",
  agents: "诊断与审查",
  codex: "运行健康",
  skills: "能力与接入",
  settings: "当前配置"
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
    mock: "模拟",
    hybrid: "混合",
    unavailable: "不可用",
    hidden: "隐藏",
    configured: "已配置",
    observed: "已发现",
    sparse: "稀疏",
    detected: "已检测",
    planned: "计划中",
    pending: "待处理",
    fallback: "回退",
    operational: "可用",
    indexed: "已索引",
    installed: "已安装",
    system: "系统",
    extension: "扩展",
    placeholder: "占位",
    active: "进行中",
    available: "可用",
    blocked: "阻塞",
    completed: "已完成",
    mapped: "已映射",
    accepted: "已接受",
    watch: "观察",
    "in-review": "复核中",
    "handoff-ready": "待交接",
    acknowledged: "已确认",
    overdue: "已逾期",
    escalated: "已升级",
    closed: "已关闭",
    open: "开启",
    scheduled: "已排程",
    "ready-to-seal": "待封存",
    held: "已持有",
    "awaiting-ack": "待确认",
    sealed: "已封存",
    drafted: "草稿",
    "pending-seal": "待封存",
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

function getPageIcon(pageId: StudioPageId) {
  const iconProps = { size: 17, strokeWidth: 2.2, "aria-hidden": true };

  switch (pageId) {
    case "dashboard":
      return <LayoutDashboard {...iconProps} />;
    case "chat":
      return <MessageSquare {...iconProps} />;
    case "hermes":
      return <TerminalSquare {...iconProps} />;
    case "claude":
      return <Bot {...iconProps} />;
    case "sessions":
      return <History {...iconProps} />;
    case "agents":
      return <Users {...iconProps} />;
    case "codex":
      return <Code2 {...iconProps} />;
    case "skills":
      return <Sparkles {...iconProps} />;
    case "settings":
      return <Settings {...iconProps} />;
    default:
      return <PanelRight {...iconProps} />;
  }
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

// formatLiveSyncAge is imported from ./lib/app-utils

// dedupeCommandActions and dedupeById are imported from ./lib/app-utils

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
      return "审查包";
    case "artifact-progression":
      return "产物进度";
    case "validator-bridge":
      return "校验桥";
    case "failure-path":
      return "失败路径";
    case "reviewer-queue":
      return "审查队列";
    case "decision-handoff":
      return "决策交接";
    case "evidence-closeout":
      return "证据收口";
    case "decision-gate":
      return "决策门";
    case "closeout-window":
      return "收口窗口";
    default:
      return "审查面";
  }
}

function formatCompanionReviewPathKind(
  kind: NonNullable<StudioShellState["commandSurface"]["actionDecks"][number]["lanes"][number]["companionReviewPaths"]>[number]["kind"]
): string {
  switch (kind) {
    case "stage-companion":
      return "阶段伴随";
    case "handoff-companion":
      return "交接伴随";
    case "rollback-companion":
      return "回滚伴随";
    default:
      return "稳定化伴随";
  }
}

function formatCompanionReviewSequenceStepRole(
  role: NonNullable<StudioShellState["commandSurface"]["actionDecks"][number]["lanes"][number]["companionSequences"]>[number]["steps"][number]["role"]
): string {
  switch (role) {
    case "current-review-surface":
      return "当前审查面";
    case "primary-companion":
      return "主伴随";
    default:
      return "后续伴随";
  }
}

function formatCompanionRouteStatePosture(
  posture: NonNullable<StudioShellState["commandSurface"]["actionDecks"][number]["lanes"][number]["companionRouteStates"]>[number]["posture"]
): string {
  return posture === "active-route" ? "当前路由" : "备选路由";
}

function formatCompanionRouteSequenceSwitchPosture(
  posture: NonNullable<
    NonNullable<StudioShellState["commandSurface"]["actionDecks"][number]["lanes"][number]["companionRouteStates"]>[number]["sequenceSwitches"][number]["posture"]
  >
): string {
  return posture === "active-sequence" ? "当前序列" : "可切换序列";
}

function formatCompanionRouteTransitionKind(kind: StudioCommandCompanionRouteTransitionKind): string {
  switch (kind) {
    case "switch-sequence":
      return "序列切换";
    case "stabilize-handoff":
      return "路径交接稳定化";
    case "resume-history":
      return "历史恢复";
    default:
      return "路由激活";
  }
}

function formatCompanionPathHandoffStability(stability: StudioCommandCompanionPathHandoffStability): string {
  switch (stability) {
    case "stable":
      return "稳定";
    case "restored":
      return "已恢复";
    default:
      return "观察中";
  }
}

function formatReplayReviewerSignoffStateLabel(state: "ready" | "watch" | "blocked" | undefined): string {
  switch (state) {
    case "ready":
      return "结论已定";
    case "blocked":
      return "结论阻塞";
    case "watch":
      return "复核中";
    default:
      return "暂无结论";
  }
}

function resolveReviewSurfaceRouteLabel(
  action: StudioCommandAction | null | undefined,
  windowing: StudioShellState["windowing"]
): string {
  const linkedIntent = action?.windowIntentId ? windowing.windowIntents.find((entry) => entry.id === action.windowIntentId) ?? null : null;
  const routeId = linkedIntent?.shellLink.pageId ?? action?.routeId ?? "无路由";
  const workspaceViewId = linkedIntent?.workspaceViewId ?? action?.workspaceViewId ?? "无工作区";
  const intentLabel = linkedIntent?.label ?? action?.windowIntentId ?? "无意图";

  return `${routeId} / ${workspaceViewId} / ${intentLabel}`;
}

function resolveReleaseBridgeValue(stageId: string | null | undefined): string | null {
  switch (stageId) {
    case "delivery-chain-promotion-readiness":
      return "打包应用连续性 / 校验桥 / bundle 封装";
    case "delivery-chain-publish-decision":
      return "安装包签名 QA 收口 / 已阻断发布门";
    case "delivery-chain-rollback-readiness":
      return "审批审计回滚 Stage C 入口 / 不执行";
    case "delivery-chain-operator-review":
      return "发布 QA 收口 / 审查证据封存";
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

interface AppWorkbenchAction {
  id: string;
  label: string;
  description: string;
  tone: "positive" | "warning" | "neutral";
  hotkey?: string;
  onTrigger: () => void;
}

interface AppWorkbenchStatusItem {
  id: string;
  label: string;
  value: string;
  meta?: string;
  tone: "positive" | "warning" | "neutral";
}

interface AppWorkbenchReadinessMetric {
  id: string;
  label: string;
  value: string;
  meta?: string;
}

interface AppWorkbenchReadinessCard {
  id: string;
  title: string;
  headline: string;
  summary: string;
  tone: "positive" | "warning" | "neutral";
  metrics: AppWorkbenchReadinessMetric[];
  actionLabel?: string;
  onOpen?: () => void;
  actions?: AppWorkbenchAction[];
}

interface AppWorkbenchWorkflowNode {
  id: string;
  title: string;
  summary: string;
  status: string;
  tone: "positive" | "warning" | "neutral";
  active: boolean;
  onEnter: () => void;
}

interface AppWorkbenchProps {
  commandBarAction: AppWorkbenchAction;
  primaryActions: AppWorkbenchAction[];
  statusItems: AppWorkbenchStatusItem[];
  readinessCards: AppWorkbenchReadinessCard[];
  workflowNodes: AppWorkbenchWorkflowNode[];
  nextActionPrimary: AppWorkbenchAction | null;
  nextActionSecondary: AppWorkbenchAction[];
  nextActionSummary: string;
  quickLaunchActions: AppWorkbenchAction[];
  selectedSessionId: string | null;
  sessionFilter: WorkbenchSessionFilter;
  onSessionAction: (session: SessionSummary) => void;
  onSessionFilterChange: (filter: WorkbenchSessionFilter) => void;
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
    return "不可用";
  }

  const labels = [
    progression.currentHandoff?.label ?? progression.currentSurface.artifactLedger?.label ?? null,
    progression.currentSurface.bundleSealingCheckpoint?.label ?? progression.currentStagedOutputStep?.label ?? null,
    progression.currentReviewPacketStep?.label ?? null,
    progression.currentValidatorReadout?.label ?? null,
    progression.currentFailureReadout?.label ?? null,
    progression.currentSurface.stageCCheckpoint?.label ?? null
  ].filter((label): label is string => Boolean(label));

  return labels.join(" -> ") || "不可用";
}

function formatArtifactCurrentToNextLabel(currentLabel: string | null, nextLabel: string | null, terminalLabel: string): string {
  if (currentLabel && nextLabel) {
    return `${currentLabel} -> ${nextLabel}`;
  }

  if (currentLabel) {
    return `${currentLabel} -> ${terminalLabel}`;
  }

  if (nextLabel) {
    return `下一步 ${nextLabel}`;
  }

  return terminalLabel;
}

function formatArtifactCurrentToNextSummary(progression: ArtifactCheckpointProgression | null): string {
  if (!progression) {
    return "当前没有可用的产物检查点进度。";
  }

  const segments = [
    progression.currentStagedOutputStep
      ? `staged output ${formatArtifactCurrentToNextLabel(
          progression.currentStagedOutputStep.label,
          progression.nextStagedOutputStep?.label ?? null,
          "最终 staged 步骤"
        )}`
      : progression.nextStagedOutputStep
        ? `staged output 下一步 ${progression.nextStagedOutputStep.label}`
        : null,
    progression.currentReviewPacketStep
      ? `审查包 ${formatArtifactCurrentToNextLabel(
          progression.currentReviewPacketStep.label,
          progression.nextReviewPacketStep?.label ?? null,
          "最终审查交接"
        )}`
      : progression.nextReviewPacketStep
        ? `审查包 下一步 ${progression.nextReviewPacketStep.label}`
        : null,
    progression.currentValidatorReadout
      ? `校验读数 ${formatArtifactCurrentToNextLabel(
          progression.currentValidatorReadout.label,
          progression.nextValidatorReadout?.label ?? null,
          "最终校验检查点"
        )}`
      : progression.nextValidatorReadout
        ? `校验读数 下一步 ${progression.nextValidatorReadout.label}`
        : null,
    progression.currentFailureReadout
      ? `失败分支 ${formatArtifactCurrentToNextLabel(
          progression.currentFailureReadout.label,
          progression.nextFailureReadout?.label ?? null,
          "最终失败分支"
        )}`
      : progression.nextFailureReadout
        ? `失败分支 下一步 ${progression.nextFailureReadout.label}`
        : null
  ].filter((segment): segment is string => Boolean(segment));

  return segments.join(" / ") || "当前交接还没有关联下游的 current-to-next 连续链。";
}

function formatArtifactSurfaceDescriptor(surface: ArtifactCheckpointProgressionSurface | null): string {
  if (!surface) {
    return "无观测路径";
  }

  return surface.observabilityMapping
    ? `${surface.observabilityMapping.label} / ${formatReviewPostureRelationship(surface.observabilityMapping.relationship)}`
    : surface.activeHandoff?.observabilityMappingId ?? "无观测路径";
}

function formatArtifactSurfaceContinuity(surface: ArtifactCheckpointProgressionSurface | null): string {
  if (!surface) {
    return "无连续审查面";
  }

  return (
    surface.reviewStateContinuityEntry?.label ??
    (surface.activeHandoff
      ? `${surface.window?.label ?? surface.activeHandoff.windowId} / ${surface.lane?.label ?? surface.activeHandoff.sharedStateLaneId}`
      : "无连续审查面")
  );
}

function formatArtifactSurfaceSpine(surface: ArtifactCheckpointProgressionSurface | null): string {
  if (!surface?.activeHandoff) {
    return "无窗口 / 通道 / 看板";
  }

  return `${surface.window?.label ?? surface.activeHandoff.windowId} -> ${
    surface.lane?.label ?? surface.activeHandoff.sharedStateLaneId
  } -> ${surface.board?.label ?? surface.activeHandoff.orchestrationBoardId}`;
}

function formatWorkflowStepKind(kind: WindowWorkflowStep["kind"]): string {
  switch (kind) {
    case "workspace-entry":
      return "工作区入口";
    case "detached-panel":
      return "独立面板候选";
    default:
      return "工作姿态";
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
  workbench: AppWorkbenchProps,
  chatSummary: {
    bridgeStatus: string;
    runtimeStatus: string;
    workspaceLabel: string;
    readinessLabel: string;
    gatewayStatus: string;
    networkStatus: string;
  },
  hermesReadinessLabel: string,
  dashboardRealtime: DashboardRealtimeViewModel
) {
  switch (activePage) {
    case "dashboard":
      return <DashboardPage viewModel={dashboardRealtime} />;
    case "chat":
      return <LazyChatPage {...chatSummary} />;
    case "sessions":
      return (
        <LazySessionsPage
          sessions={data.sessions}
          primaryActions={workbench.primaryActions}
          statusItems={workbench.statusItems}
          readinessCards={workbench.readinessCards}
          workflowNodes={workbench.workflowNodes}
          nextActionPrimary={workbench.nextActionPrimary}
          nextActionSecondary={workbench.nextActionSecondary}
          nextActionSummary={workbench.nextActionSummary}
          quickLaunchActions={workbench.quickLaunchActions}
          selectedSessionId={workbench.selectedSessionId}
          sessionFilter={workbench.sessionFilter}
          onSessionAction={workbench.onSessionAction}
          onSessionFilterChange={workbench.onSessionFilterChange}
        />
      );
    case "agents":
      return <LazyAgentsPage agents={data.agents} boundary={data.boundary} status={data.status} commandSurface={data.commandSurface} />;
    case "skills":
      return (
        <LazySkillsPage
          skills={data.skills}
          boundary={data.boundary}
          focusedSlotId={focusedSlot.focusedSlotId}
          onFocusedSlotChange={focusedSlot.onFocusedSlotChange}
        />
      );
    case "settings":
      return (
        <LazySettingsPage
          settings={data.settings}
        />
      );
    default:
      return null;
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

function AppStateScreen({ title, detail, tone }: { title: string; detail: string; tone: "loading" | "error" }) {
  return (
    <div className={`state-screen state-screen--${tone}`}>
      <article className="surface state-screen__card">
        <p className="eyebrow">{tone === "loading" ? "启动中" : "加载失败"}</p>
        <h1>{title}</h1>
        <p>{detail}</p>
      </article>
    </div>
  );
}

export function App() {
  const { data, error, syncError, isRefreshing, lastUpdatedAt } = useStudioData();
  const dashboardRealtime = useDashboardRealtimeData(data, lastUpdatedAt);
  const [hermesState, setHermesState] = useState<StudioHermesState | null>(null);
  const [activePage, setActivePage] = useState<StudioPageId>(resolveStartupPage);
  const [sessionSurface, setSessionSurface] = useState<SessionSurfaceId>("openclaw");
  const [dashboardThemeMode, setDashboardThemeMode] = useState<DashboardThemeMode>(getInitialDashboardTheme);
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
  const [workbenchState, setWorkbenchState] = useState<PersistedWorkbenchState>(readPersistedWorkbenchState);
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
  const workbenchSessionFilter = workbenchState.sessionFilter;
  const advancedReviewDeckEnabled = isAdvancedReviewDeckEnabled();
  const lastWorkbenchSessionId = workbenchState.lastSessionId;
  const lastWorkbenchActionId = workbenchState.lastActionId;

  useEffect(() => {
    document.documentElement.dataset.dashboardTheme = dashboardThemeMode;

    try {
      window.localStorage.setItem(DASHBOARD_THEME_STORAGE_KEY, dashboardThemeMode);
    } catch {
      // Theme persistence is nice-to-have; rendering should not depend on localStorage availability.
    }
  }, [dashboardThemeMode]);

  useEffect(() => {
    const syncRoute = () => {
      const nextPage = resolvePage();
      setActivePage(nextPage);
      if (nextPage === "hermes") {
        setSessionSurface("hermes");
      } else if (nextPage === "chat") {
        setSessionSurface(resolveInitialSessionSurface());
      }
    };

    window.addEventListener("hashchange", syncRoute);

    const startupPage = resolveStartupPage();

    if (resolvePage() !== startupPage || window.location.hash !== `#${getRouteHashForPageId(startupPage)}`) {
      navigateToPage(startupPage);
    } else {
      syncRoute();
    }

    return () => {
      window.removeEventListener("hashchange", syncRoute);
    };
  }, []);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.querySelector<HTMLElement>(".main-panel")?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }, [activePage, sessionSurface]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    const refreshHermesState = async () => {
      try {
        const nextHermesState = await loadHermesState();

        if (!cancelled) {
          setHermesState(nextHermesState);
        }
      } catch (cause) {
        if (!cancelled) {
          console.warn("[App] 读取 Hermes 状态失败:", cause);
        }
      }
    };

    const subscribeHermes = async () => {
      try {
        const nextUnsubscribe = await subscribeToHermesEvents(() => {
          void refreshHermesState();
        });

        if (cancelled) {
          nextUnsubscribe();
          return;
        }

        unsubscribe = nextUnsubscribe;
      } catch (cause) {
        if (!cancelled) {
          console.warn("[App] Hermes 事件订阅失败:", cause);
        }
      }
    };

    void refreshHermesState();
    void subscribeHermes();

    const interval = window.setInterval(() => {
      void refreshHermesState();
    }, 5_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      unsubscribe?.();
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
    return <AppStateScreen title="山谷智合数据加载失败" detail={error} tone="error" />;
  }

  if (!data) {
    return <AppStateScreen title="山谷智合加载中" detail="正在读取本地快照和运行态状态。" tone="loading" />;
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
  const pageById = new Map(data.pages.map((page) => [page.id, page]));
  const visiblePages = visibleStudioPageIds.map(
    (pageId) =>
      pageById.get(pageId) ?? {
        id: pageId,
        label: PAGE_LABEL_ZH[pageId] ?? pageId,
        hint: PAGE_HINT_ZH[pageId] ?? "工作台入口"
      }
  );
  const activePageMeta = visiblePages.find((page) => page.id === activePage) ?? {
    id: activePage,
    label: "Studio",
    hint: "工作台主壳"
  };
  const activePageLabel = getZhPageLabel(activePageMeta.id, activePageMeta.label);
  const activePageHint = getZhPageHint(activePageMeta.id, activePageMeta.hint);
  const latestCommandEntry = commandLog[0] ?? null;
  const livePages = visiblePages.filter((page) => LIVE_PAGE_IDS.has(page.id));
  const utilityPages = visiblePages.filter((page) => UTILITY_PAGE_IDS.has(page.id));
  const currentPageUsesSimpleShell = UTILITY_PAGE_IDS.has(activePage);
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
          label: "意图聚焦",
          summary: `${selectedWindowIntent.label} 正在驱动 ${workspaceView?.label ?? "当前主壳"}，同时 ${
            selectedDetachedPanel?.label ?? "关联分离候选"
          } 继续以仅本地方式保持可见。`,
          activeWorkspaceViewId: workspaceView?.id ?? data.windowing.posture.activeWorkspaceViewId,
          focusedIntentId: selectedWindowIntent.id,
          activeDetachedPanelId: selectedDetachedPanel?.id
        }
      : workspaceView?.detachState === "candidate" ||
          workspaceView?.detachState === "detached-local" ||
          (selectedDetachedPanel ? selectedDetachedPanel.detachState !== "anchored" : false)
        ? {
            mode: "detached-candidate" as const,
            label: workspaceView?.detachState === "detached-local" ? "本地分离" : "分离候选",
            summary: `${workspaceView?.label ?? "当前工作区"} 当前作为分离工作区候选运行，并把 ${
              selectedDetachedPanel?.label ?? "关联面板"
            } 继续回接到当前主壳。`,
            activeWorkspaceViewId: workspaceView?.id ?? data.windowing.posture.activeWorkspaceViewId,
            focusedIntentId: selectedWindowIntent?.id,
            activeDetachedPanelId: selectedDetachedPanel?.id
          }
        : {
            mode: "anchored-shell" as const,
            label: "锚定主壳",
            summary: `${workspaceView?.label ?? "当前工作区"} 仍附着在主壳上，分离姿态继续仅在本地暂存。`,
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
      ? "当前聚焦"
      : workflowIntent.localStatus === "staged"
        ? "已暂存"
        : "可进入当前壳层"
    : "不可用";
  const workflowReadinessSummary = workflowIntent
    ? workflowIntent.localStatus === "focused"
      ? `${workflowIntent.handoff.label} 已在当前主壳内激活，并保持仅本地。`
      : workflowIntent.localStatus === "staged"
        ? `${workflowIntent.workflowStep.label} 已暂存，可随时切入当前主壳。`
        : `${workflowIntent.workflowStep.label} 已就绪，但尚未并入当前主壳姿态。`
    : "当前还没有选中的流程意图。";
  const workflowLinkedShell = workflowIntent
    ? `${workflowIntent.shellLink.pageId} · ${workflowIntent.shellLink.rightRailTabId} / ${workflowIntent.shellLink.bottomDockTabId}`
    : "不可用";
  const gatewayCheck = data.dashboard.systemChecks.find((item) => item.id === "check-local-gateway") ?? null;
  const networkCheck = data.dashboard.systemChecks.find((item) => item.id === "check-network") ?? null;
  const hermesReadinessLabel = hermesState ? `Hermes · ${hermesState.readinessLabel}` : "Hermes · 状态加载中";
  const chatSummary = {
    bridgeStatus: `桥接 · ${getZhStatusValue(data.status.bridge)}`,
    runtimeStatus: `运行态 · ${getZhStatusValue(data.status.runtime)}`,
    workspaceLabel: `工作区 · ${formatProductText(workspaceView?.label, "不可用")}`,
    readinessLabel: "聊天状态 · 检查发送链路",
    gatewayStatus: gatewayCheck ? `${formatProductText(gatewayCheck.label)} · ${formatProductText(gatewayCheck.value)}` : `网关 · ${getZhStatusValue(data.status.bridge)}`,
    networkStatus: networkCheck ? `${formatProductText(networkCheck.label)} · ${formatProductText(networkCheck.value)}` : `网络 · ${getZhStatusValue(data.status.runtime)}`
  };
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
  const showAdvancedCommandSurface = activePage === "agents";
  const primaryCommandActionIds = [
    "command-open-dashboard",
    "command-open-session",
    "command-open-history",
    "command-open-capabilities",
    "command-open-settings",
    "command-open-diagnostics"
  ];
  const primaryCommandActions = dedupeCommandActions(primaryCommandActionIds.map((actionId) => actionById.get(actionId)));
  const activeContexts = data.commandSurface.contexts.filter((context) => context.id === "global" || context.id === activePage);
  const contextualActions = dedupeCommandActions(activeContexts.flatMap((context) => context.actionIds.map((actionId) => actionById.get(actionId))));
  const quickActions = dedupeCommandActions([
    ...data.commandSurface.quickActionIds.map((actionId) => actionById.get(actionId)),
    ...contextualActions.slice(0, 2)
  ]).slice(0, 6);
  const normalizedCommandQuery = commandQuery.trim().toLowerCase();
  const paletteActions =
    normalizedCommandQuery.length === 0
      ? showAdvancedCommandSurface
        ? contextualActions
        : primaryCommandActions
      : (showAdvancedCommandSurface ? data.commandSurface.actions : primaryCommandActions).filter((action) => {
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
    activeMaterializationArtifactSurface.artifactLedger ? "最终产物交接" : "不可用"
  );
  const artifactCurrentToNextSummary = formatArtifactCurrentToNextSummary(activeMaterializationArtifactProgression);
  const currentArtifactSurfaceDescriptor = formatArtifactSurfaceDescriptor(activeMaterializationArtifactSurface);
  const currentArtifactSurfaceContinuity = formatArtifactSurfaceContinuity(activeMaterializationArtifactSurface);
  const currentArtifactSurfaceSpine = formatArtifactSurfaceSpine(activeMaterializationArtifactSurface);
  const nextArtifactSurfaceDescriptor = nextMaterializationArtifactSurface
    ? formatArtifactSurfaceDescriptor(nextMaterializationArtifactSurface)
    : activeMaterializationArtifactSurface.artifactLedger
      ? "最终产物交接"
      : "不可用";
  const nextArtifactSurfaceContinuity = nextMaterializationArtifactSurface
    ? formatArtifactSurfaceContinuity(nextMaterializationArtifactSurface)
    : activeMaterializationArtifactSurface.artifactLedger
      ? "当前交接已到终点，因此没有继续关联下一个面的连续链。"
      : "不可用";
  const nextArtifactSurfaceSpine = nextMaterializationArtifactSurface
    ? formatArtifactSurfaceSpine(nextMaterializationArtifactSurface)
    : activeMaterializationArtifactSurface.artifactLedger
      ? "终点交接 / 无后续窗口主干"
      : "不可用";
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
            ? `恢复 ${previousRouteState.label} -> ${nextRouteState?.label ?? nextAction.label} 这条交接，同时保留上一条仅本地伴随通道。`
            : "恢复这个通道最近一次仅本地伴随交接，而不是只按当前审查面重新计算整条路由。",
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
      ? `第 ${activeCompanionSequenceCurrentStepIndex + 1} 步，共 ${activeCompanionSequence.steps.length} 步`
      : activeCompanionSequence
        ? `${activeCompanionSequence.steps.length} 个顺序步骤`
        : "暂无伴随序列";
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
        coverageLabel: `${nextStage?.label ?? entry.deliveryChainStageId ?? "无阶段"} / ${nextWindow?.label ?? entry.windowId ?? "无窗口"}`,
        routeLabel,
        pathLabel: `${nextLane?.label ?? entry.sharedStateLaneId ?? "无通道"} / ${
          nextBoard?.label ?? entry.orchestrationBoardId ?? "无看板"
        } / ${nextMapping?.label ?? entry.observabilityMappingId ?? "无观测路径"}`,
        sequenceLabel: nextSequence?.label,
        timestamp: entry.timestampLabel,
        action: nextAction
      };
    })
    .slice(0, data.commandSurface.history.retention);
  const activeReplayScenarioPack = activeActionDeckLane?.replayScenarioPack ?? null;
  const activeReplayScenarioLabel =
    activeCompanionRouteHistoryEntry?.scenarioLabel ?? activeCompanionRouteHistoryEntry?.label ?? activeReplayScenarioPack?.label ?? "暂无回放场景";
  const activeReplayScenarioVerdict =
    activeCompanionRouteHistoryEntry?.reviewerSignoff?.verdict ??
    activeCompanionRouteHistoryEntry?.reviewerSignoff?.label ??
    "暂无审查结论";
  const activeReplayScenarioNextHandoff =
    activeCompanionRouteHistoryEntry?.reviewerSignoff?.nextHandoff ??
    activeCompanionPathHandoff?.label ??
    "暂无稳定交接";
  const activeReplayScenarioEvidenceSummary = `${activeCompanionRouteHistoryEntry?.scenarioEvidenceItems?.length ?? 0} 条 dossier 项 / ${
    activeCompanionRouteHistoryEntry?.screenshotReviewItems?.length ?? 0
  } 张 storyboard 截图 / ${activeCompanionRouteHistoryEntry?.evidenceContinuityChecks?.length ?? 0} 条连续性检查`;
  const activeReplayScenarioReadingSummary =
    activeCompanionRouteHistoryEntry?.reviewerWalkthrough?.readingQueueSummary ??
    activeCompanionRouteHistoryEntry?.reviewerWalkthrough?.summary ??
    activeReplayScenarioPack?.summary ??
    "当前还没有暂存好的回放阅读顺序。";
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
    activeCompanionRouteHistoryEntry ? "路由回放" : null,
    resolvedReviewSurfaceAction?.label ?? "审查面",
    currentCloseoutWindow?.label ?? "收口窗口",
    activeObservabilityMapping?.label ?? "观测路径"
  ]
    .filter((label): label is string => Boolean(label))
    .join(" -> ");
  const activeReplayObservabilityCloseoutLabel =
    activeObservabilityMapping && resolvedCoverageWindow && resolvedCoverageLane && resolvedCoverageBoard
      ? `${activeObservabilityMapping.label} / ${resolvedCoverageWindow.label} -> ${resolvedCoverageLane.label} -> ${resolvedCoverageBoard.label}`
      : activeObservabilityMapping
        ? `${activeObservabilityMapping.label} / ${formatReviewPostureRelationship(activeObservabilityMapping.relationship)}`
        : "暂无观测收口路径";
  const activeReplayVerdictStateLabel = formatReplayReviewerSignoffStateLabel(activeCompanionRouteHistoryEntry?.reviewerSignoff?.state);
  const latestReplayRestoreEntryId = activeCompanionRouteHistoryEntry?.id ?? companionRouteHistoryItems[0]?.id ?? null;
  const windowsObservabilityAction = actionById.get("command-open-windows-observability");
  const activeFlowState: ContextualCommandStateLine[] = [
    {
      id: "flow-state-route",
      label: "当前路由",
      value: activePageLabel,
      tone: "neutral" as const
    },
    {
      id: "flow-state-workflow",
      label: "当前流程",
      value: selectedWorkflowLane?.label ?? "暂无流程通道",
      tone: workflowReadinessTone
    },
    {
      id: "flow-state-command",
      label: "当前命令流",
      value: activeContextualFlow?.label ?? activeSequence?.label ?? data.inspector.flow.label,
      tone: activeContextualFlow ? "positive" : "neutral"
    },
    {
      id: "flow-state-action-deck",
      label: "动作面板",
      value: activeActionDeck?.label ?? "暂无动作面板",
      tone: activeActionDeck?.tone ?? "neutral"
    },
    {
      id: "flow-state-workspace",
      label: "工作区",
      value: workspaceView?.label ?? "暂无工作区",
      tone:
        resolvedWindowPosture.mode === "intent-focused"
          ? "positive"
          : resolvedWindowPosture.mode === "detached-candidate"
            ? "warning"
            : "neutral"
    },
    {
      id: "flow-state-slot",
      label: "当前槽位",
      value: hostTraceFocus?.slot.label ?? "不可用",
      tone: hostTraceFocus ? (hostTraceFocus.slot.rollbackDisposition === "not-needed" ? "positive" : "warning") : "neutral"
    },
    {
      id: "flow-state-intent",
      label: "当前意图",
      value: selectedWindowIntent ? `${selectedWindowIntent.label} / ${formatIntentStatus(selectedWindowIntent.localStatus)}` : "暂无意图",
      tone: selectedWindowIntent ? workflowReadinessTone : "neutral"
    },
    {
      id: "flow-state-delivery",
      label: "交付覆盖",
      value: resolvedDeliveryCoverageStage
        ? `${resolvedDeliveryCoverageStage.label} / ${resolvedDeliveryCoverageStage.phase}`
        : "暂无交付阶段",
      tone:
        resolvedDeliveryCoverageStage?.status === "ready"
          ? "positive"
          : resolvedDeliveryCoverageStage
            ? "warning"
            : "neutral"
    },
    {
      id: "flow-state-review-surface",
      label: "审查表面",
      value: resolvedReviewSurfaceAction
        ? `${resolvedReviewSurfaceAction.label} / ${formatReviewSurfaceKind(resolvedReviewSurfaceAction.reviewSurfaceKind)}`
        : "暂无审查表面",
      tone: resolvedReviewSurfaceAction?.tone ?? "neutral"
    },
    {
      id: "flow-state-companion-sequence",
      label: "伴随序列",
      value: activeCompanionSequence ? `${activeCompanionSequence.label} / ${activeCompanionSequenceStepLabel}` : "暂无伴随序列",
      tone: activeCompanionSequence?.tone ?? "neutral"
    },
    {
      id: "flow-state-companion-route",
      label: "伴随路由",
      value: activeCompanionRouteState
        ? `${activeCompanionRouteState.label} / ${formatCompanionRouteStatePosture(activeCompanionRouteState.posture)}`
        : "暂无伴随路由",
      tone: activeCompanionRouteState?.tone ?? "neutral"
    },
    {
      id: "flow-state-path-handoff",
      label: "回放恢复",
      value: activeCompanionPathHandoff
        ? `${activeCompanionPathHandoff.label} / ${formatCompanionPathHandoffStability(activeCompanionPathHandoff.stability)}`
        : activeCompanionRouteHistoryEntry
          ? `${activeCompanionRouteHistoryEntry.label} / ${formatCompanionRouteTransitionKind(activeCompanionRouteHistoryEntry.transitionKind)}`
          : "暂无稳定交接",
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
      label: "回放记忆",
      value: companionRouteHistoryItems.length
        ? `${companionRouteHistoryItems.length} 条记录 / ${companionRouteHistoryItems[0]?.label ?? "最近交接"}`
        : "暂无记忆交接",
      tone: companionRouteHistoryItems.length ? "positive" : "neutral"
    },
    {
      id: "flow-state-observability",
      label: "观测路径",
      value: resolvedCoverageMapping
        ? `${resolvedCoverageMapping.label} / ${formatReviewPostureRelationship(resolvedCoverageMapping.relationship)}`
        : "暂无观测路径",
      tone: resolvedCoverageMapping ? resolvedCoverageMapping.tone : "neutral"
    },
    {
      id: "flow-state-multi-window-coverage",
      label: "覆盖路径",
      value: activeActionDeckLane
        ? `${(activeActionDeckLane.observabilityMappingIds ?? []).length} 条映射 / ${(activeActionDeckLane.companionRouteStates ?? []).length} 条路由 / ${(activeActionDeckLane.companionSequences ?? []).length} 条序列 / ${(activeActionDeckLane.companionReviewPaths ?? []).length} 条伴随路径，经由 ${activeActionDeckLane.label}`
        : "暂无映射审查通道",
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
      label: "分离候选",
      value: selectedDetachedPanel?.label ?? "暂无分离候选",
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
        detail: action?.description ?? "仅本地上下文动作。",
        state: recommendedActionIndex === -1 ? "completed" : index < recommendedActionIndex ? "completed" : index === recommendedActionIndex ? "next" : "pending",
        tone: action?.tone ?? "neutral"
      };
    }) ?? [];
  const commandPanel: ContextualCommandPanelProps = {
    eyebrow: activePageMeta.label,
    title: activeContextualFlow?.label ?? "命令编排",
    summary: activeContextualFlow?.summary ?? data.commandSurface.summary,
    flowLabel: activeSequence?.label ?? selectedWorkflowLane?.label ?? "仅本地流程",
    flowSummary: activeSequence?.summary ?? "路由感知编排会继续停留在壳层内部的仅本地边界内。",
    workflowLaneLabel: selectedWorkflowLane?.label,
    workspaceLabel: workspaceView?.label,
    focusedSlotLabel: hostTraceFocus?.slot.label,
    activeFlowState,
    actionDeckLabel: activeActionDeck?.label,
    actionDeckSummary: activeActionDeck?.summary,
    actionDeckLanes,
    reviewSurfaceItems,
    companionRouteStatesLabel: activeActionDeckLane?.label ? `${activeActionDeckLane.label} 伴随路由` : undefined,
    companionRouteStatesSummary:
      activeCompanionRouteState && companionRouteStateItems.length
        ? `${resolvedReviewSurfaceAction?.label ?? "当前审查面"} 当前通过 ${activeCompanionRouteState.label} 解析，${companionRouteStateItems.length} 个显式路由状态把当前路由、备选路由和可切换序列姿态继续挂在同一条仅本地路由、工作区、窗口、通道、看板与观测链上。`
        : undefined,
    companionRouteStateItems,
    companionRouteHistoryLabel: activeActionDeckLane?.label ? `${activeActionDeckLane.label} 路由回放恢复` : undefined,
    companionRouteHistorySummary:
      activeActionDeckLane && companionRouteHistoryItems.length
        ? `${activeActionDeckLane.label} 现在会记住 ${companionRouteHistoryItems.length} 条带类型的伴随交接，而${
            activeCompanionPathHandoff?.label ?? "当前路径交接"
          } 也会直接暴露路由回放恢复，因此同一条审查通道可以连同路由状态、序列与观测姿态一起回放上一次交接，而不会被压平回默认路径。`
        : undefined,
    companionRouteHistoryItems,
    companionSequenceLabel: activeCompanionSequence?.label,
    companionSequenceSummary:
      activeCompanionSequence && companionSequenceStepItems.length
        ? `${resolvedReviewSurfaceAction?.label ?? "当前审查面"} 当前处于 ${activeCompanionSequenceCurrentStep ? activeCompanionSequenceStepLabel.toLowerCase() : activeCompanionSequence.label}，因此当前、主伴随与后续覆盖会继续沿着同一条仅本地路由、工作区、窗口、通道、看板与观测链顺序排布，同时由 ${activeCompanionRouteState?.label ?? "当前路由状态"} 明确呈现序列切换。`
        : undefined,
    companionSequenceItems,
    companionSequenceStepItems,
    companionReviewPathsLabel: activeActionDeckLane?.label ? `${activeActionDeckLane.label} 伴随路径` : undefined,
    companionReviewPathsSummary:
      activeActionDeckLane && companionReviewPathItems.length
        ? `${resolvedReviewSurfaceAction?.label ?? "当前审查面"} 当前通过 ${activeCompanionRouteState?.label ?? activeCompanionSequence?.label ?? activeActionDeckLane.label} 解析，${companionReviewPathItems.length} 条显式伴随审查路径会把主 pivot 和后续 pivot 保持为可检查状态，而不是压平成一次映射跳转。`
        : undefined,
    companionReviewPathItems,
    multiWindowCoverageLabel: activeActionDeckLane?.label ?? resolvedReviewSurfaceAction?.label,
    multiWindowCoverageSummary:
      activeActionDeckLane && multiWindowCoverageItems.length
        ? `${resolvedReviewSurfaceAction?.label ?? "当前审查面"} 会通过 ${activeActionDeckLane.label} 继续显示 ${multiWindowCoverageItems.length} 条映射后的窗口、通道、看板与观测路径，同时 ${companionRouteStateItems.length} 个路由状态、${companionSequenceStepItems.length} 个顺序伴随步骤和 ${companionReviewPathItems.length} 条带类型伴随审查路径，会在仅本地命令流里把同一条导航序列保持清晰。`
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
  const reanchorWorkbenchAfterReviewAction = (
    activity: ActivityInput,
    surfacePatch?: Partial<Pick<StudioShellLayoutState, "rightRailTabId" | "bottomDockTabId">>,
    persistencePatch?: Partial<PersistedWorkbenchState>
  ) => {
    navigateToPage("sessions");
    applyLayoutPatch({
      rightRailVisible: true,
      bottomDockVisible: true,
      rightRailTabId: surfacePatch?.rightRailTabId ?? resolvedLayoutState.rightRailTabId,
      bottomDockTabId: surfacePatch?.bottomDockTabId ?? resolvedLayoutState.bottomDockTabId
    });
    if (persistencePatch) {
      persistWorkbenchState({
        lastPageId: "sessions",
        lastWorkspaceViewId: resolvedLayoutState.workspaceViewId,
        lastFocusedSlotId: resolvedFocusSlotId,
        ...persistencePatch
      });
    }
    recordActivity(activity);
  };
  const handleRunWorkbenchReviewSurfaceAction = (action: StudioCommandAction | null | undefined) => {
    if (!action || !isReviewCoverageAction(action)) {
      (reviewViewAction ?? inspectBoundaryAction ?? workbenchCommandBarAction).onTrigger();
      reanchorWorkbenchAfterReviewAction({
        label: "定位当前审查面",
        detail: "审查面板姿态已恢复，但当前没有可直接定位的审查面。",
        safety: "local-only"
      }, {
        rightRailTabId: "windows",
        bottomDockTabId: "windows"
      }, {
        lastActionId: "workbench-review-surface-focus",
        lastWorkspaceViewId: "review-deck"
      });
      return;
    }

    applyReviewCoverageAction(action, {
      record: false
    });
    reanchorWorkbenchAfterReviewAction({
      label: "定位当前审查面",
        detail: `${action.label} 已在不丢失当前审查面板姿态的前提下恢复到工作台。`,
        safety: "local-only"
      }, {
        rightRailTabId: action.rightRailTabId ?? "windows",
        bottomDockTabId: action.bottomDockTabId ?? "windows"
      }, {
        lastActionId: "workbench-review-surface-focus",
        lastWorkspaceViewId: action.workspaceViewId ?? "review-deck"
      });
  };
  const handleRunWorkbenchCompanionRouteHistory = (entryId: string | null | undefined) => {
    if (!entryId) {
      handleRunWorkbenchReviewSurfaceAction(resolvedReviewSurfaceAction);
      return;
    }

    handleRunCompanionRouteHistory(entryId);
    const historyEntry: CompanionRouteHistoryMemoryEntry | null = companionRouteHistory.find((entry) => entry.id === entryId) ?? null;
    reanchorWorkbenchAfterReviewAction({
      label: "恢复最近交接",
      detail: "最近一次记忆中的审查交接已恢复到工作台。",
      safety: "local-only"
    }, {
      rightRailTabId: "windows",
      bottomDockTabId: "windows"
    }, {
      lastActionId: "workbench-review-surface-handoff",
      lastWorkspaceViewId: "review-deck"
    });
  };
  const handleRunWorkbenchObservabilityAction = () => {
    if (windowsObservabilityAction) {
      executeCommand(windowsObservabilityAction);
      reanchorWorkbenchAfterReviewAction({
        label: "查看跨窗口协同",
        detail: `${resolvedCoverageMapping?.label ?? "跨窗口协同"} 已在保持当前工作台锚定的情况下展开。`,
        safety: "local-only"
      }, {
        rightRailTabId: windowsObservabilityAction.rightRailTabId ?? "windows",
        bottomDockTabId: windowsObservabilityAction.bottomDockTabId ?? "windows"
      }, {
        lastActionId: "workbench-review-surface-observability",
        lastWorkspaceViewId: "review-deck"
      });
      return;
    }

    (reviewViewAction ?? inspectBoundaryAction ?? workbenchCommandBarAction).onTrigger();
    reanchorWorkbenchAfterReviewAction({
      label: "查看跨窗口协同",
        detail: "审查面板的跨窗口协同视图已恢复到工作台。",
        safety: "local-only"
      }, {
        rightRailTabId: "windows",
        bottomDockTabId: "windows"
      }, {
        lastActionId: "workbench-review-surface-observability",
        lastWorkspaceViewId: "review-deck"
      });
  };
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
      label: "路由 → 命令流",
      value: `${activePageLabel} -> ${activeContextualFlow?.label ?? activeSequence?.label ?? "暂无活跃流程"}`,
      detail: "当前路由与命令流现在会以一条本地主壳链路统一展示，便于连续查看。"
    },
    {
      id: "cross-view-flow-board",
      label: "流程 → 下一步看板",
      value: `${activeSequence?.label ?? "暂无活跃序列"} -> ${activeNextStepBoard?.label ?? "暂无下一步看板"}`,
      detail: "推荐下一步与路由感知看板现在保持联动，不再以零散按钮出现。"
    },
    {
      id: "cross-view-action-deck",
      label: "动作面板 → 交付 / 窗口",
      value: activeActionDeck
        ? `${activeActionDeck.label} -> ${activeActionDeckDeliveryStageIds.length} 个阶段 / ${activeActionDeckWindowIds.length} 个窗口 / ${activeActionDeckBoardIds.length} 个看板`
        : "暂无动作面板",
      detail: "审查动作面板现在显式携带交付阶段与多窗口覆盖，不再让命令面与后续审查姿态脱节。"
    },
    {
      id: "cross-view-window-shell",
      label: "工作区 → 分离 → 意图",
      value: `${workspaceView?.label ?? "暂无工作区"} -> ${selectedDetachedPanel?.label ?? "暂无分离候选"} -> ${selectedWindowIntent?.label ?? "暂无意图"}`,
      detail: "工作区入口、分离候选与意图焦点会在主面板、窗口栏和底栏之间保持同步。"
    },
    {
      id: "cross-view-window-shared-state",
      label: "窗口名册 → 共享状态通道",
      value: `${activeWindowRosterEntry?.label ?? "暂无窗口"} -> ${activeSharedStateLane?.label ?? "暂无共享状态通道"}`,
      detail: "归属、同步健康度、最近交接和阻塞项现在都会显式展示，不再依赖当前标签页姿态去猜。"
    },
    {
      id: "cross-view-review-posture",
      label: "审查姿态归属",
      value: activeObservabilityMapping
        ? `${activeObservabilityMapping.owner} -> ${activeObservabilityMapping.reviewPosture.stageLabel}`
        : "暂无审查姿态",
      detail: "当前路由、窗口、通道、编排看板、审查队列、确认、升级、收尾和焦点槽位现在都会汇总到同一条观测行。"
    },
    {
      id: "cross-view-slot-release",
      label: "焦点槽位 → 发布姿态",
      value: `${hostTraceFocus?.slot.label ?? "暂无焦点槽位"} -> ${currentReleaseStage?.label ?? "操作审查看板"} / ${currentDecisionHandoff.posture}`,
      detail: "焦点槽位审查、操作看板归属、审查队列状态、升级时序、决策交接姿态、证据收尾与交付阶段查看器现在位于同一条 phase60 仅本地审查链路中。"
    }
  ];
  const inspectorCommandLinkage = [
    {
      id: "inspector-linkage-flow",
      label: "检查 → 命令流",
      value: activeContextualFlow?.label ?? activeSequence?.label ?? "暂无活跃流程",
      detail: "右侧检查栏现在会同步显示与上下文命令面一致的流程标签和推荐状态。"
    },
    {
      id: "inspector-linkage-board",
      label: "检查 → 下一步看板",
      value: activeNextStepBoard?.label ?? "暂无下一步看板",
      detail: "检查下钻项现在会和驱动当前页面的同一块路由感知下一步看板保持联动。"
    },
    {
      id: "inspector-linkage-action-deck",
      label: "检查 → 动作面板",
      value: activeActionDeck ? `${activeActionDeck.label} / ${activeActionDeck.lanes.length} 条通道` : "暂无动作面板",
      detail: "检查下钻项现在可以直接对照同一块映射交付阶段与窗口覆盖的审查动作面板。"
    },
    {
      id: "inspector-linkage-window",
      label: "检查 → 编排看板",
      value: `${selectedWorkflowLane?.label ?? "暂无流程通道"} / ${selectedWindowIntent?.label ?? "暂无意图"}`,
      detail: "流程通道、意图焦点与分离候选姿态现在会一起出现，不再散落在不同壳层区域。"
    },
    {
      id: "inspector-linkage-shared-state",
      label: "检查 → 共享状态通道",
      value: `${activeWindowRosterEntry?.label ?? "暂无窗口"} / ${activeSharedStateLane?.label ?? "暂无共享状态通道"}`,
      detail: "右侧检查栏现在会同步显示跨窗口看板中的窗口名册、同步健康度、最近交接、审查队列和操作审查姿态。"
    },
    {
      id: "inspector-linkage-review-posture",
      label: "检查 → 审查姿态",
      value: activeObservabilityMapping
        ? `${activeObservabilityMapping.label} / ${formatReviewPostureRelationship(activeObservabilityMapping.relationship)}`
        : "暂无审查姿态",
      detail: "右侧检查栏现在会直接指出当前由哪条路由、哪个窗口、哪条通道和哪块看板承接实时审查姿态，以及还有哪些窗口映射到这里。"
    }
  ];
  const inspectorReviewConsoleLines = [
    {
      id: "inspector-review-pack",
      label: "回放包",
      value: activeReplayScenarioPack
        ? `${activeReplayScenarioPack.label} / ${activeReplayScenarioPack.acceptancePosture}`
        : "暂无回放包",
      detail:
        activeReplayScenarioPack?.summary ??
        "当前活动审查通道上还没有挂接可供审查的回放包。"
    },
    {
      id: "inspector-review-verdict",
      label: "最终结论台",
      value: `${activeReplayScenarioLabel} / ${activeReplayScenarioVerdict}`,
      detail:
        activeCompanionRouteHistoryEntry?.reviewerSignoff?.summary ??
        "当前活动路由回放条目上还没有挂接审查结论摘要。"
    },
    {
      id: "inspector-review-route",
      label: "收口路由锚点",
      value: `${resolvedDeliveryCoverageStage?.label ?? "暂无阶段"} / ${resolvedCoverageWindow?.label ?? "暂无窗口"} / ${
        resolvedCoverageLane?.label ?? "暂无通道"
      } / ${resolvedCoverageBoard?.label ?? "暂无看板"}`,
      detail:
        activeCompanionRouteState?.summary ??
        "当前路由、窗口、通道和看板归属会根据当前审查覆盖选择自动推断。"
    },
    {
      id: "inspector-review-evidence",
      label: "证据链",
      value: activeReplayScenarioEvidenceSummary,
      detail: activeReplayScenarioReadingSummary
    },
    {
      id: "inspector-review-closeout-timeline",
      label: "验收收口时间线",
      value: activeReplayCloseoutTimelineLabel,
      detail:
        activeCompanionRouteHistoryEntry?.reviewerWalkthrough?.summary ??
        "当前活动路由回放条目上还没有挂接收口时间线。"
    },
    {
      id: "inspector-review-observability-closeout",
      label: "跨窗口收口",
      value: activeReplayObservabilityCloseoutLabel,
      detail:
        activeObservabilityMapping?.summary ??
        "当前还没有有效的审查姿态把结论收口回连到窗口观测图。"
    },
    {
      id: "inspector-review-handoff",
      label: "下一步交接",
      value: `${activeReplayVerdictStateLabel} / ${activeReplayScenarioNextHandoff}`,
      detail:
        activeCompanionPathHandoff?.summary ??
        activeCompanionRouteHistoryEntry?.summary ??
        "当前活动审查表面上还没有稳定的审查交接。"
    },
    {
      id: "inspector-review-pack-closeout",
      label: "回放包收口队列",
      value: `${activeReplayPackReadyCount} 个就绪 / ${activeReplayPackInReviewCount} 个复核中 / ${activeReplayPackBlockedCount} 个阻塞`,
      detail:
        activeReplayScenarioPack?.continuitySummary ??
        "当前活动审查通道上还没有挂接回放包收口队列。"
    }
  ];
  const releasePipelineDepth = [
    {
      id: "release-depth-manifest",
      label: "正式发布就绪度",
      value: "RELEASE-MANIFEST / BUILD-METADATA / REVIEW-MANIFEST",
      detail:
        "发布清单、构建元数据和审查清单会在操作审查闭环里保持联动，方便同时查看看板归属、队列、确认时序、交付阶段和跨窗口审查姿态。"
    },
    {
      id: "release-depth-delivery-chain",
      label: "交付链工作区",
      value: currentDeliveryStage ? `${currentDeliveryStage.label} / ${currentDeliveryStage.phase}` : "不可用",
      detail:
        "当前活动看板现在会解析成带类型的交付链阶段，因此证明材料接入、操作员审查、推进就绪度、发布门控和回滚就绪度会呈现为同一条交付流程，而不再像一串割裂的产物尾迹。"
    },
    {
      id: "release-depth-promotion-flow",
      label: "推进审查流程",
      value: "推进就绪度 / 分阶段应用收口",
      detail:
        "推进证据、应用就绪度、检查点、分阶段应用台账、命令单、确认台账、收口日志、签署单以及决策约束生命周期，现在都被收进一条明确的推进审查路径。"
    },
    {
      id: "release-depth-publish-flow",
      label: "发布审查流程",
      value: publishDeliveryStage ? `${publishDeliveryStage.label} / ${publishDeliveryStage.status}` : "不可用",
      detail:
        "签名元数据、公证计划、签名发布握手、发布说明、发布门控和推进门控，现在会一起呈现为面向发布的单一决策关口。"
    },
    {
      id: "release-depth-rollback-flow",
      label: "回滚审查流程",
      value: rollbackDeliveryStage ? `${rollbackDeliveryStage.label} / ${rollbackDeliveryStage.status}` : "不可用",
      detail:
        "发布回滚握手、恢复台账、演练手册、线上就绪契约、切换记录、结果报告和回执结算收口，现在会一起呈现为面向恢复的单一路径。"
    },
    {
      id: "release-depth-operator-review-board",
      label: "操作员审查看板",
      value: "OPERATOR-REVIEW-BOARD / RELEASE-APPROVAL-WORKFLOW",
      detail: "当前切片把审批路由提升为一等操作员看板，并持续挂住阶段归属、审查包姿态以及回连轨迹面和共享状态面的交叉链路。"
    },
    {
      id: "release-depth-reviewer-queue",
      label: "审查队列",
      value: "队列归属 / 确认状态",
      detail: "审查队列现在会直接暴露谁拥有当前看板、谁在等待确认，以及是哪条窗口/共享状态通道正在承载这条队列。"
    },
    {
      id: "release-depth-observability",
      label: "跨窗口观测映射",
      value: "路由 / 窗口 / 通道 / 看板归属",
      detail:
        "当前切片补上了一张明确的归属映射，因此壳层可以直接显示当前究竟是哪个路由、窗口、共享状态通道、编排看板、队列、确认状态、升级窗口、收口窗口和焦点槽位在持有审查姿态。"
    },
    {
      id: "release-depth-escalation-window",
      label: "升级窗口",
      value: "升级时限 / 触发条件",
      detail: "升级时序现在成为一等信息，不再只是 baton 上那类泛化 pending 文案的隐含含义。"
    },
    {
      id: "release-depth-closeout-window",
      label: "收口窗口",
      value: "收口时序 / 已封存或待处理",
      detail: "收口时序现在会被显式展示，并继续绑定在同一条队列和证据对象上，而不会藏进笼统的收口摘要里。"
    },
    {
      id: "release-depth-decision-handoff",
      label: "决策交接",
      value: "RELEASE-DECISION-HANDOFF / baton 姿态",
      detail: "决策交接现在是一级审查契约，因此 baton 姿态和下游归属会被明确呈现，而不再靠泛化生命周期文案来暗示。"
    },
    {
      id: "release-depth-evidence-closeout",
      label: "证据收口",
      value: "REVIEW-EVIDENCE-CLOSEOUT / 已封存证据 / 审查备注",
      detail: "证据收口现在会直接携带封存状态、待补证据和审查备注，而不再把收口姿态藏在更大的发布 JSON 列表里。"
    },
    {
      id: "release-depth-bundles",
      label: "打包装配骨架",
      value: "BUNDLE-MATRIX / BUNDLE-ASSEMBLY",
      detail: "各平台 bundle 目标依然保留了清晰的装配骨架，位于产物快照与后续实体化工作之间。"
    },
    {
      id: "release-depth-directory-materialization",
      label: "打包应用目录实体化",
      value: "PACKAGED-APP-DIRECTORY-SKELETON / PACKAGED-APP-DIRECTORY-MATERIALIZATION",
      detail:
        "打包应用目录方案现在会映射到明确的分平台 staging 根路径、启动器路径和校验 manifest，Stage Explorer 也会把它们读回成同一条仅本地实体化契约里的首个任务，而不会生成任何真实打包应用。"
    },
    {
      id: "release-depth-local-materialization-contract",
      label: "打包应用本地实体化契约",
      value: activeMaterializationPlatform
        ? `${formatPackagedAppPlatform(activeMaterializationPlatform.platform)} / ${formatMaterializationTaskState(activeMaterializationPlatform.taskState)}${
            activeMaterializationValidatorSurface.activeReadout
              ? ` / ${activeMaterializationValidatorSurface.activeReadout.label}`
              : activeStagedOutputStep
                ? ` / ${activeStagedOutputStep.label}`
                : activeMaterializationTask
                  ? ` / ${activeMaterializationTask.label}`
                  : ""
          }${activeMaterializationProgress ? ` / ${activeMaterializationProgress.completedTaskCount + 1}/${activeMaterializationProgress.totalTaskCount} 个检查点` : ""}`
        : "不可用",
      detail:
        "打包应用实体化契约现在会同时暴露分平台 staged-output 链路步骤、bundle 封装就绪度、本地推进进度以及与校验器联动的观测读数和任务证据、交付阶段映射，因此审查通道读起来像一条完整编排的本地交接主干，而不再只是平铺的路径元数据。"
    },
    {
      id: "release-depth-materialization-artifact-ledger",
      label: "实体化产物台账",
      value: activeMaterializationArtifactSurface.activeHandoff
        ? `${activeMaterializationArtifactSurface.activeHandoff.label} / ${formatMaterializationValidatorStatus(
            activeMaterializationArtifactSurface.activeHandoff.status
          )} / ${activeMaterializationArtifactSurface.sourceArtifacts.length} -> ${
            activeMaterializationArtifactSurface.targetArtifacts.length
          } 个产物`
        : "不可用",
      detail:
        "本地实体化契约现在带有一条从源输入到封装完成的产物台账，会把 renderer/Electron 构建输入与目录校验、staged-output manifest 以及 seal/integrity 元数据连到一起，因此 Stage Explorer、窗口看板和 inspector 都能读取同一条具体交接链，而不会暗示实际执行。"
    },
    {
      id: "release-depth-materialization-artifact-checkpoint-progression",
      label: "实体化产物检查点推进",
      value: activeMaterializationArtifactProgression.currentHandoff
        ? `${artifactCurrentToNextHandoffLabel} / ${
            activeMaterializationArtifactSurface.stageCCheckpoint?.label ??
            activeMaterializationArtifactSurface.bundleSealingCheckpoint?.label ??
            "无 Stage C 链路"
          }`
        : "不可用",
      detail:
        "产物台账现在会把当前交接、下一步交接以及与之关联的 seal / failure / Stage C 面统一保留为一条当前到下一步的仅本地推进链，而不再是几张松散相邻的检查点卡片。"
    },
    {
      id: "release-depth-materialization-validator-bridge",
      label: "实体化校验桥",
      value: activeMaterializationValidatorSurface.activeReadout
        ? `${activeMaterializationValidatorSurface.activeReadout.label} / ${formatMaterializationValidatorStatus(
            activeMaterializationValidatorSurface.activeReadout.status
          )} / ${activeMaterializationValidatorSurface.observabilityMapping?.label ?? activeMaterializationValidatorSurface.activeReadout.observabilityMappingId}`
        : "不可用",
      detail:
        "打包应用实体化契约现在带有一条校验器 / 观测桥，把当前仅本地切片映射到具体窗口、通道、看板和观测面，因此 inspector 与 windows 读数可以继续对齐到同一条推进契约上。"
    },
    {
      id: "release-depth-staged-output",
      label: "打包应用分阶段输出骨架",
      value: activeStagedOutputChain
        ? `${activeStagedOutputChain.steps.length} 个阶段输出步骤 / ${activeStagedOutputStep?.label ?? "无当前步骤"}`
        : "PACKAGED-APP-STAGED-OUTPUT-SKELETON",
      detail:
        "目录实体化现在会继续输送到明确的 staged-output 链路，其中包含 verification、output-manifest 和 checksum-manifest 检查点，而 Stage Explorer 会把它与同一份分平台实体化契约并排展示，不会生成真实打包产物。"
    },
    {
      id: "release-depth-bundle-sealing",
      label: "打包应用 Bundle 封装骨架",
      value: activeBundleSealingReadiness
        ? `${formatMaterializationTaskState(activeBundleSealingReadiness.taskState)} / ${activeBundleSealingReadiness.currentCheckpoint}`
        : "PACKAGED-APP-BUNDLE-SEALING-SKELETON",
      detail:
        "阶段输出现在会继续输送到明确的 bundle 封装就绪对象，包含当前检查点、seal 路径和下游关口联动，Stage Explorer 也会保持它可检查，而不会冻结或签署任何真实 bundle。"
    },
    {
      id: "release-depth-bundle-integrity",
      label: "已封装 Bundle 完整性契约",
      value: "SEALED-BUNDLE-INTEGRITY-CONTRACT",
      detail: "Bundle 封装元数据现在会继续输送到明确的完整性、摘要和审计检查点，但不会为任何真实打包 bundle 做证明。"
    },
    {
      id: "release-depth-integrity-attestation",
      label: "完整性证明证据",
      value: "INTEGRITY-ATTESTATION-EVIDENCE / SEALED-BUNDLE-INTEGRITY-CONTRACT",
      detail: "完整性契约现在会继续输送到明确的证明包、校验器输入和审计回执，但不会对任何线上发布做真实证明。"
    },
    {
      id: "release-depth-attestation-verification-packs",
      label: "证明校验包",
      value: "ATTESTATION-VERIFICATION-PACKS / INTEGRITY-ATTESTATION-EVIDENCE",
      detail: "完整性证明证据现在会继续输送到面向校验器的包、检查清单和审计交接负载，但不会真实执行任何线上校验。"
    },
    {
      id: "release-depth-attestation-apply-audit-packs",
      label: "证明应用审计包",
      value: "ATTESTATION-APPLY-AUDIT-PACKS / ATTESTATION-VERIFICATION-PACKS",
      detail: "校验包现在会继续输送到路由感知的应用审计 bundle、审查清单和回执，但不会真实执行任何校验或应用步骤。"
    },
    {
      id: "release-depth-attestation-apply-execution-packets",
      label: "证明应用执行包",
      value: "ATTESTATION-APPLY-EXECUTION-PACKETS / ATTESTATION-APPLY-AUDIT-PACKS",
      detail: "应用审计 bundle 现在会继续输送到经过操作员审看的执行包、包回执和预应用封套，但不会真实执行任何校验或应用步骤。"
    },
    {
      id: "release-depth-attestation-operator-worklists",
      label: "证明操作员工作清单",
      value: "ATTESTATION-OPERATOR-WORKLISTS / ATTESTATION-APPLY-EXECUTION-PACKETS",
      detail: "执行包现在会继续输送到按角色划分的接入队列、确认槽位和归属骨架，为后续派发 manifest 打底，但不会真实派发任何操作员动作。"
    },
    {
      id: "release-depth-attestation-operator-dispatch-manifests",
      label: "证明操作员派发清单",
      value: "ATTESTATION-OPERATOR-DISPATCH-MANIFESTS / ATTESTATION-OPERATOR-WORKLISTS",
      detail: "操作员工作清单现在会继续输送到明确的派发封套、确认时限和升级路径，但不会真实派发任何操作员动作。"
    },
    {
      id: "release-depth-attestation-operator-dispatch-packets",
      label: "证明操作员派发包",
      value: "ATTESTATION-OPERATOR-DISPATCH-PACKETS / ATTESTATION-OPERATOR-DISPATCH-MANIFESTS",
      detail: "派发清单现在会继续输送到按角色定向的包集合、确认负载和回执槽位，但不会真实派发任何操作员动作。"
    },
    {
      id: "release-depth-attestation-operator-dispatch-receipts",
      label: "证明操作员派发回执",
      value: "ATTESTATION-OPERATOR-DISPATCH-RECEIPTS / ATTESTATION-OPERATOR-DISPATCH-PACKETS",
      detail: "派发包现在会继续输送到确认采集、对账输入和升级收口锚点，但不会真实派发任何操作员动作。"
    },
    {
      id: "release-depth-attestation-operator-reconciliation-ledgers",
      label: "证明操作员对账台账",
      value: "ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS / ATTESTATION-OPERATOR-DISPATCH-RECEIPTS",
      detail:
        "派发回执现在会继续输送到操作员结算台账、未解决确认收口和可供审批的摘要，但不会对任何真实操作员动作执行对账。"
    },
    {
      id: "release-depth-attestation-operator-settlement-packs",
      label: "证明操作员结算包",
      value: "ATTESTATION-OPERATOR-SETTLEMENT-PACKS / ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS",
      detail:
        "对账台账现在会继续输送到操作员清算包、升级处置 bundle 和发布审批附件，但不会真实路由任何操作员结算。"
    },
    {
      id: "release-depth-attestation-operator-approval-routing-contracts",
      label: "证明操作员审批路由契约",
      value: "ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS / ATTESTATION-OPERATOR-SETTLEMENT-PACKS",
      detail:
        "结算包现在会继续输送到面向审查者的路由表、审批窗口和发布审批交接路径，但不会真实派发任何审批或执行动作。"
    },
    {
      id: "release-depth-attestation-operator-approval-orchestration",
      label: "证明操作员审批编排",
      value: "ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION / ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS",
      detail:
        "审批路由契约现在会继续输送到审查 baton 排序、审批法定人数时序和编排收口路径，但不会真实派发任何审批或执行动作。"
    },
    {
      id: "release-depth-installer-builders",
      label: "安装器目标构建骨架",
      value: "INSTALLER-TARGETS / INSTALLER-TARGET-BUILDER-SKELETON",
      detail: "安装器目标仍会清晰映射到仅供审查的构建器身份，而不再只是孤立元数据。"
    },
    {
      id: "release-depth-installer-execution",
      label: "安装器构建执行骨架",
      value: "INSTALLER-BUILDER-EXECUTION-SKELETON",
      detail: "未来的构建器命令、环境、输出和审查检查项现在都会先被声明，但不会调用任何真实构建器。"
    },
    {
      id: "release-depth-installer-orchestration",
      label: "安装器构建编排",
      value: "INSTALLER-BUILDER-ORCHESTRATION",
      detail: "分平台的构建执行骨架现在会被纳入明确的编排流程中，但不会调用任何真实构建器。"
    },
    {
      id: "release-depth-installer-channel-routing",
      label: "安装器通道路由",
      value: "INSTALLER-CHANNEL-ROUTING",
      detail: "仅供审查的安装器输出现在会映射到明确的 alpha/beta/stable 路由清单，但不会真实路由任何产物。"
    },
    {
      id: "release-depth-release-qa-closeout-readiness",
      label: "发布 QA 收口就绪度",
      value: "RELEASE-QA-CLOSEOUT-READINESS / RELEASE-CHECKLIST / RELEASE-SUMMARY",
      detail:
        "打包应用实体化连续性、安装器/签名/公证握手校验、清单证明和交付收口姿态，现在会一起保留为同一个仅本地 QA 面，而不会构建、签名或发布任何东西。"
    },
    {
      id: "release-depth-channel-promotion-evidence",
      label: "通道推进证据",
      value: "CHANNEL-PROMOTION-EVIDENCE / INSTALLER-CHANNEL-ROUTING",
      detail: "通道路由现在会继续输送到明确的 alpha -> beta -> stable 推进证据包，但不会真实推进任何产物。"
    },
    {
      id: "release-depth-promotion-apply-readiness",
      label: "推进应用就绪度",
      value: "PROMOTION-APPLY-READINESS / CHANNEL-PROMOTION-EVIDENCE",
      detail: "推进证据现在会继续输送到明确的应用就绪清单、审查者输入和通道预检包，但不会真实应用任何推进动作。"
    },
    {
      id: "release-depth-promotion-apply-manifests",
      label: "推进应用清单",
      value: "PROMOTION-APPLY-MANIFESTS / PROMOTION-APPLY-READINESS",
      detail: "推进就绪度现在会继续输送到明确的应用清单、发布顺序和回滚锚点，但不会真实应用任何推进动作。"
    },
    {
      id: "release-depth-promotion-execution-checkpoints",
      label: "推进执行检查点",
      value: "PROMOTION-EXECUTION-CHECKPOINTS / PROMOTION-APPLY-MANIFESTS",
      detail: "推进应用清单现在会继续输送到明确的检查点契约、保持点和回滚演练手册锚点，但不会真实执行任何推进动作。"
    },
    {
      id: "release-depth-promotion-operator-handoff-rails",
      label: "推进操作员交接轨",
      value: "PROMOTION-OPERATOR-HANDOFF-RAILS / PROMOTION-EXECUTION-CHECKPOINTS",
      detail: "推进执行检查点现在会继续输送到操作员路由轨、角色交接片段和回滚就绪锚点，但不会真实执行任何推进动作。"
    },
    {
      id: "release-depth-promotion-staged-apply-ledgers",
      label: "推进分阶段应用台账",
      value: "PROMOTION-STAGED-APPLY-LEDGERS / PROMOTION-OPERATOR-HANDOFF-RAILS",
      detail: "操作员交接轨现在会继续输送到有序的分阶段应用日志、冻结窗口和切换证据槽位，为后续 runsheet 打底，但不会真实应用任何推进动作。"
    },
    {
      id: "release-depth-promotion-staged-apply-runsheets",
      label: "推进分阶段应用执行单",
      value: "PROMOTION-STAGED-APPLY-RUNSHEETS / PROMOTION-STAGED-APPLY-LEDGERS",
      detail: "分阶段应用台账现在会继续输送到面向操作员的阶段顺序、保持点和切换 baton 脚本，但不会真实应用任何推进动作。"
    },
    {
      id: "release-depth-promotion-staged-apply-command-sheets",
      label: "推进分阶段应用命令单",
      value: "PROMOTION-STAGED-APPLY-COMMAND-SHEETS / PROMOTION-STAGED-APPLY-RUNSHEETS",
      detail: "执行单现在会继续输送到带门控的阶段命令、确认块和回执存根，但不会真实应用任何推进动作。"
    },
    {
      id: "release-depth-promotion-staged-apply-confirmation-ledgers",
      label: "推进分阶段应用确认台账",
      value: "PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS / PROMOTION-STAGED-APPLY-COMMAND-SHEETS",
      detail: "命令单现在会继续输送到阶段验收日志、切换确认块和收口输入，但不会真实应用任何推进动作。"
    },
    {
      id: "release-depth-promotion-staged-apply-closeout-journals",
      label: "推进分阶段应用收口日志",
      value: "PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS / PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS",
      detail:
        "确认台账现在会继续输送到阶段收口封条、恢复 baton 和面向发布的切换日志，但不会真实应用任何推进动作。"
    },
    {
      id: "release-depth-promotion-staged-apply-signoff-sheets",
      label: "推进分阶段应用签署单",
      value: "PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS / PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS",
      detail:
        "收口日志现在会继续输送到分阶段审批单、面向发布的包和 go/no-go 证据，但不会真实应用任何推进动作。"
    },
    {
      id: "release-depth-promotion-staged-apply-release-decision-enforcement-contracts",
      label: "推进分阶段应用发布决策约束契约",
      value: "PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS / PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS",
      detail:
        "签署单现在会继续输送到分阶段发布护栏、约束窗口和发布路径契约，但不会真实应用任何推进动作。"
    },
    {
      id: "release-depth-promotion-staged-apply-release-decision-enforcement-lifecycle",
      label: "推进分阶段应用发布决策约束生命周期",
      value: "PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE / PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS",
      detail:
        "发布决策约束契约现在会继续输送到生命周期检查点、审查 baton 切换和过期收口，但不会真实应用任何推进动作。"
    },
    {
      id: "release-depth-signing-publish",
      label: "签名与发布流水线",
      value: "SIGNING-METADATA / NOTARIZATION-PLAN / SIGNING-PUBLISH-PIPELINE",
      detail: "签名、公证、校验和、上传和发布阶段仍会作为一条结构化流水线契约持续可见。"
    },
    {
      id: "release-depth-signing-handshake",
      label: "签名发布门控握手",
      value: "SIGNING-PUBLISH-GATING-HANDSHAKE / RELEASE-APPROVAL-WORKFLOW",
      detail: "签名、发布、审批、完整性和推进证据现在会流经一条结构化握手契约，而不会真的审批或发布任何内容。"
    },
    {
      id: "release-depth-approval-bridge",
      label: "签名发布审批桥",
      value: "SIGNING-PUBLISH-APPROVAL-BRIDGE / RELEASE-APPROVAL-WORKFLOW / PUBLISH-GATES",
      detail: "门控握手、审批工作流和发布门控现在会通过一条可审阅的桥保持联动，而不会执行任何审批动作。"
    },
    {
      id: "release-depth-promotion-handshake",
      label: "签名发布推进握手",
      value: "SIGNING-PUBLISH-PROMOTION-HANDSHAKE / CHANNEL-PROMOTION-EVIDENCE / PUBLISH-GATES",
      detail: "通道路由、推进证据和发布门控现在会汇聚到一条专用的仅审查推进握手里。"
    },
    {
      id: "release-depth-publish-rollback",
      label: "发布回滚握手",
      value: "PUBLISH-ROLLBACK-HANDSHAKE / PROMOTION-GATES / RELEASE-NOTES",
      detail: "发布和推进审查现在会携带明确的回滚检查点与恢复通道交接元数据，而不会真实执行任何回滚。"
    },
    {
      id: "release-depth-rollback-recovery-ledger",
      label: "回滚恢复台账",
      value: "ROLLBACK-RECOVERY-LEDGER / PUBLISH-ROLLBACK-HANDSHAKE",
      detail: "回滚检查点现在会继续输送到明确的恢复台账、操作员备注和通道恢复清单，但不会恢复任何真实发布状态。"
    },
    {
      id: "release-depth-rollback-execution-rehearsal-ledger",
      label: "回滚执行演练台账",
      value: "ROLLBACK-EXECUTION-REHEARSAL-LEDGER / ROLLBACK-RECOVERY-LEDGER",
      detail: "回滚恢复台账现在会继续输送到演练清单、dry-run 轨迹和操作员演练备注，但不会真实执行任何线上回滚。"
    },
    {
      id: "release-depth-rollback-operator-drillbooks",
      label: "回滚操作员演练手册",
      value: "ROLLBACK-OPERATOR-DRILLBOOKS / ROLLBACK-EXECUTION-REHEARSAL-LEDGER",
      detail: "回滚演练台账现在会继续输送到操作员 drillbook、响应章节和交接清单，但不会真实操作任何线上发布状态。"
    },
    {
      id: "release-depth-rollback-live-readiness-contracts",
      label: "回滚线上就绪契约",
      value: "ROLLBACK-LIVE-READINESS-CONTRACTS / ROLLBACK-OPERATOR-DRILLBOOKS",
      detail: "回滚操作员演练手册现在会继续输送到线上进入就绪检查、恢复证明和操作员 go/no-go 契约，但不会启用任何真实线上回滚。"
    },
    {
      id: "release-depth-rollback-cutover-readiness-maps",
      label: "回滚切换就绪映射",
      value: "ROLLBACK-CUTOVER-READINESS-MAPS / ROLLBACK-LIVE-READINESS-CONTRACTS",
      detail: "回滚线上就绪契约现在会继续输送到通道/平台切换拓扑、检查点映射和 go/no-go 审查面，为后续交接方案打底，而不会改动任何线上发布状态。"
    },
    {
      id: "release-depth-rollback-cutover-handoff-plans",
      label: "回滚切换交接方案",
      value: "ROLLBACK-CUTOVER-HANDOFF-PLANS / ROLLBACK-CUTOVER-READINESS-MAPS",
      detail: "回滚切换就绪映射现在会继续输送到归属 baton 转移、回退路径和恢复交接章节，而不会改动任何线上发布状态。"
    },
    {
      id: "release-depth-rollback-cutover-execution-checklists",
      label: "回滚切换执行清单",
      value: "ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS / ROLLBACK-CUTOVER-HANDOFF-PLANS",
      detail: "回滚切换交接方案现在会继续输送到切换 go/no-go 单、平台检查点巡检和恢复确认，而不会改动任何线上发布状态。"
    },
    {
      id: "release-depth-rollback-cutover-execution-records",
      label: "回滚切换执行记录",
      value: "ROLLBACK-CUTOVER-EXECUTION-RECORDS / ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS",
      detail:
        "回滚切换执行清单现在会继续输送到带证据的切换收口记录、恢复状态发布和回滚结果输入，而不会改动任何线上发布状态。"
    },
    {
      id: "release-depth-rollback-cutover-outcome-reports",
      label: "回滚切换结果报告",
      value: "ROLLBACK-CUTOVER-OUTCOME-REPORTS / ROLLBACK-CUTOVER-EXECUTION-RECORDS",
      detail:
        "回滚切换执行记录现在会继续输送到恢复摘要、结果发布和面向回滚的收口报告，而不会改动任何线上发布状态。"
    },
    {
      id: "release-depth-rollback-cutover-publication-bundles",
      label: "回滚切换发布包",
      value: "ROLLBACK-CUTOVER-PUBLICATION-BUNDLES / ROLLBACK-CUTOVER-OUTCOME-REPORTS",
      detail:
        "结果报告现在会继续输送到发布说明附件、发布摘要和回滚发布包，而不会改动任何线上发布状态。"
    },
    {
      id: "release-depth-rollback-cutover-publication-receipt-closeout-contracts",
      label: "回滚切换发布回执收口契约",
      value: "ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS / ROLLBACK-CUTOVER-PUBLICATION-BUNDLES",
      detail:
        "发布包现在会继续输送到收口确认、发布收口契约和回滚恢复证据，而不会改动任何线上发布状态。"
    },
    {
      id: "release-depth-rollback-cutover-publication-receipt-settlement-closeout",
      label: "回滚切换发布回执结算收口",
      value: "ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT / ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS",
      detail:
        "发布回执收口契约现在会继续输送到结算台账、回执收口确认和面向恢复的收口证据，而不会改动任何线上发布状态。"
    },
    {
      id: "release-depth-approval-audit-rollback-entry-contract",
      label: "审批 / 审计 / 回滚入口契约",
      value:
        "APPROVAL-AUDIT-ROLLBACK-ENTRY-CONTRACT / ATTESTATION-APPLY-AUDIT-PACKS / ROLLBACK-LIVE-READINESS-CONTRACTS",
      detail:
        "首个安全 Stage C 入口现在会把检查点级证据、审批工作流映射、回滚线上就绪度、回执结算收口和交付 QA 证明一起保留为一份面向操作员且不执行的契约。"
    },
    {
      id: "release-depth-approval",
      label: "发布审批工作流",
      value: "RELEASE-APPROVAL-WORKFLOW / PUBLISH-GATES / PUBLISH-ROLLBACK-HANDSHAKE",
      detail: "发布审批仍然保持为仅元数据、可审阅的状态，并阻止任何真实签名、发布、回滚或 host 执行。"
    },
    {
      id: "release-depth-promotion",
      label: "发布推进门控",
      value: "RELEASE-NOTES / PUBLISH-GATES / PROMOTION-GATES / CHANNEL-PROMOTION-EVIDENCE",
      detail: "发布门控、推进证据和推进关口仍然保持拆分，以便未来 alpha -> beta -> stable 的推进路径拥有明确的审查契约。"
    },
    {
      id: "release-depth-safety",
      label: "安全姿态",
      value: "仅本地 / 不安装 / 不执行",
      detail:
        "回放、审查状态、打包任务、校验器读数和就绪度会串在同一条仅本地链路中，因此当前审查面、包交接、窗口 / 通道 / 看板、审查队列、收口时序和回滚契约都可以保持可读。"
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
        label: "审查面",
        value: `${formatReviewSurfaceKind(action.reviewSurfaceKind)} / ${stage?.label ?? action.deliveryChainStageId ?? "无阶段"}`
      });
    }

    const releaseBridgeValue = resolveReleaseBridgeValue(action.deliveryChainStageId);

    if (releaseBridgeValue) {
      lines.push({
        id: `${action.id}-detail-release-bridge`,
        label: "发布桥",
        value: releaseBridgeValue
      });
    }

    if (windowEntry || laneEntry || boardEntry) {
      lines.push({
        id: `${action.id}-detail-window-path`,
        label: "窗口路径",
        value: `${windowEntry?.label ?? action.windowId ?? "无窗口"} -> ${laneEntry?.label ?? action.sharedStateLaneId ?? "无通道"} -> ${
          boardEntry?.label ?? action.orchestrationBoardId ?? "无看板"
        }`
      });
    }

    if (mappingEntry) {
      lines.push({
        id: `${action.id}-detail-observability`,
        label: "观测映射",
        value: `${mappingEntry.label} / ${formatReviewPostureRelationship(mappingEntry.relationship)}`
      });
    }

    if (routeLabel !== "无路由 / 无工作区 / 无意图") {
      lines.push({
        id: `${action.id}-detail-route`,
        label: "路由上下文",
        value: routeLabel
      });
    }

    if (action.slotId || slotEntry) {
      lines.push({
        id: `${action.id}-detail-slot`,
        label: "焦点槽位",
        value: slotEntry?.label ?? action.slotId ?? "无槽位焦点"
      });
    }

    if (
      activeActionDeckLane?.replayScenarioPack &&
      action.deliveryChainStageId &&
      (activeActionDeckLane.deliveryChainStageIds ?? []).includes(action.deliveryChainStageId)
    ) {
      lines.push({
        id: `${action.id}-detail-pack`,
        label: "审查包",
        value: `${activeActionDeckLane.replayScenarioPack.label} / ${activeActionDeckLane.replayScenarioPack.acceptancePosture}`
      });
    }

    if ((action.reviewSurfaceKind || action.id === windowsObservabilityAction?.id) && activeCompanionRouteHistoryEntry?.reviewerSignoff) {
      lines.push({
        id: `${action.id}-detail-verdict`,
        label: "结论",
        value: `${activeReplayScenarioVerdict} / ${activeReplayVerdictStateLabel}`
      });
    }

    if ((action.reviewSurfaceKind || action.id === windowsObservabilityAction?.id) && currentCloseoutWindow) {
      lines.push({
        id: `${action.id}-detail-closeout`,
        label: "收口窗口",
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
    meta: options?.meta ?? [action.scope, action.safety, action.hotkey ?? "无快捷键"],
    detailLines: buildPaletteEntryDetailLines(action, options?.detailLines)
  });
  const primaryPaletteSection: CommandPaletteSection = {
    id: "section-primary-pages",
    label: "主入口",
    summary: "打开总览、会话、历史、能力、配置或高级诊断。",
    entries: primaryCommandActions.map((action) =>
      actionToPaletteEntry(action, {
        entryId: `section-primary-${action.id}`,
        badge: "一级页",
        meta: ["导航", action.hotkey ?? "无快捷键"]
      })
    )
  };
  const advancedPaletteSectionsBase: CommandPaletteSection[] = [
    {
      id: "section-flow",
      label: activeContextualFlow?.label ?? "推荐流程",
      summary: activeSequence?.summary ?? "围绕当前壳层姿态组织上下文动作。",
      entries: dedupeCommandActions([recommendedAction ?? undefined, ...followUpActions]).map((action, index) =>
        actionToPaletteEntry(action, {
          entryId: `section-flow-${index}-${action.id}`,
          badge: action.id === recommendedAction?.id ? "推荐下一步" : "后续动作"
        })
      )
    },
    {
      id: "section-next-step-board",
      label: activeNextStepBoard?.label ?? "路由感知下一步看板",
      summary: activeNextStepBoard?.summary ?? "把当前壳层姿态下的下一步持续挂接在同一看板里。",
      entries: nextStepItems.flatMap((item) =>
        item.action
          ? [
              actionToPaletteEntry(item.action, {
                entryId: `section-next-step-${item.id}`,
                badge: "下一步",
                description: item.detail,
                detailLines: [
                  {
                    id: `${item.id}-detail-board`,
                    label: "下一步看板",
                    value: activeNextStepBoard?.label ?? "本地编排看板"
                  }
                ]
              })
            ]
          : []
      )
    },
    {
      id: "section-review-surfaces",
      label: "审查面覆盖",
      summary: "把选中的审查面及其交付/窗口/通道/看板/观测映射一起联动展示。",
      entries: surfacedReviewCoverageActions.map((action) =>
        actionToPaletteEntry(action, {
          entryId: `section-review-surface-${action.id}`,
          badge: action.id === resolvedReviewSurfaceAction?.id ? "当前审查面" : formatReviewSurfaceKind(action.reviewSurfaceKind)
        })
      )
    },
    {
      id: "section-companion-route-state",
      label: activeCompanionRouteState?.label ?? "伴随路由状态",
      summary:
        activeCompanionRouteState?.summary ??
        "把当前路由、可切换路由和序列姿态与当前审查面并排保持可见。",
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
            ? `${sourceItem?.label ?? "伴随路由"} · ${sourceSwitch.postureLabel}`
            : sourceItem
              ? `${sourceItem.label} · ${sourceItem.postureLabel}`
              : "伴随路由",
          description: sourceSwitch?.detail ?? sourceItem?.detail ?? action.description
        });
      })
    },
    {
      id: "section-companion-route-history",
      label: activeActionDeckLane?.label ?? "路由回放恢复",
      summary:
        activeCompanionPathHandoff?.summary ??
        "已记录的伴随交接会作为路由回放恢复继续保留在同一条仅本地审查通道里。",
      entries: dedupeCommandActions(companionRouteHistoryItems.map((item) => item.action ?? undefined)).map((action) => {
        const sourceItem = companionRouteHistoryItems.find((item) => item.action?.id === action.id);

        return actionToPaletteEntry(action, {
          entryId: `section-companion-route-history-${sourceItem?.id ?? action.id}`,
          badge: sourceItem ? sourceItem.transitionLabel : "已记录交接",
          description: sourceItem?.detail ?? action.description,
          meta: sourceItem ? [sourceItem.coverageLabel, sourceItem.pathLabel, sourceItem.timestamp] : undefined,
          detailLines: sourceItem
            ? [
                { id: `${sourceItem.id}-route`, label: "路由回放", value: sourceItem.routeLabel },
                { id: `${sourceItem.id}-coverage`, label: "覆盖范围", value: sourceItem.coverageLabel },
                { id: `${sourceItem.id}-path`, label: "窗口路径", value: sourceItem.pathLabel }
              ]
            : undefined
        });
      })
    },
    {
      id: "section-companion-sequence",
      label: activeCompanionSequence?.label ?? "伴随序列",
      summary:
        activeCompanionSequence?.summary ??
        "把当前、主路径和后续审查覆盖串成一条仅本地可读的导航序列。",
      entries: dedupeCommandActions(companionSequenceStepItems.map((item) => item.action ?? undefined)).map((action) => {
        const sourceItem = companionSequenceStepItems.find((item) => item.action?.id === action.id);

        return actionToPaletteEntry(action, {
          entryId: `section-companion-sequence-${sourceItem?.id ?? action.id}`,
          badge: sourceItem ? `${sourceItem.stepLabel} · ${sourceItem.roleLabel}` : "伴随序列",
          description: sourceItem?.detail ?? action.description,
          meta: sourceItem ? [sourceItem.coverageLabel, sourceItem.pathLabel, sourceItem.stepLabel] : undefined
        });
      })
    },
    {
      id: "section-companion-review-paths",
      label: activeActionDeckLane?.label ?? "伴随审查路径",
      summary: "当前审查面会显式给出主路径和后续覆盖路径，而不再只依赖映射覆盖。",
      entries: dedupeCommandActions(companionReviewPathItems.map((item) => item.action ?? undefined)).map((action) => {
        const sourceItem = companionReviewPathItems.find((item) => item.action?.id === action.id);

        return actionToPaletteEntry(action, {
          entryId: `section-companion-review-path-${sourceItem?.id ?? action.id}`,
          badge: sourceItem ? `${sourceItem.kindLabel} · 来自 ${sourceItem.sourceLabel}` : "伴随路径",
          description: sourceItem?.detail ?? action.description,
          meta: sourceItem ? [sourceItem.coverageLabel, sourceItem.pathLabel, sourceItem.routeLabel] : undefined
        });
      })
    },
    {
      id: "section-multi-window-coverage",
      label: activeActionDeckLane?.label ?? "多窗口审查覆盖",
      summary:
        activeActionDeckLane && multiWindowCoverageItems.length
          ? `${multiWindowCoverageItems.length} 条映射窗口、通道、看板与观测行，会在当前交付通道里保持同一审查上下文可读。`
          : "映射后的观测路径会在仅本地主壳中保持同一审查上下文可见。",
      entries: multiWindowCoverageItems.flatMap((item) =>
        item.action
          ? [
              actionToPaletteEntry(item.action, {
                entryId: `section-multi-window-${item.id}`,
                badge: item.active ? "当前映射路径" : item.relationshipLabel,
                description: item.detail,
                meta: [item.coverageLabel, item.pathLabel, `${item.reviewSurfaceCount} 个已联动审查面`],
                detailLines: [
                  { id: `${item.id}-coverage`, label: "覆盖范围", value: item.coverageLabel },
                  { id: `${item.id}-path`, label: "窗口路径", value: item.pathLabel },
                  {
                    id: `${item.id}-surfaces`,
                    label: "已联动审查面",
                    value: item.reviewSurfaceLabels.join(" / ") || "无已联动审查面"
                  }
                ]
              })
            ]
          : []
      )
    },
    {
      id: "section-closeout-console",
      label: activeReplayScenarioPack?.label ?? "验收收口台",
      summary:
        activeCompanionRouteHistoryEntry?.reviewerSignoff?.summary ??
        "把结论焦点、验收收口时序和观测结算统一收进同一个仅本地命令面。",
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
              ? "结论路径"
              : action.id === resolvedReviewSurfaceAction?.id
                ? "验收收口"
                : action.id === windowsObservabilityAction?.id
                  ? "观测收口"
                  : "审查包后续动作",
          description:
            action.id === windowsObservabilityAction?.id
              ? "持续让多窗口收口看板可见，确保结论姿态、收口时序和观测结算保持对齐。"
              : action.description,
          meta: [
            activeReplayVerdictStateLabel,
            `${activeReplayPackReadyCount} 个就绪 / ${activeReplayPackInReviewCount} 个复核中`,
            currentCloseoutWindow ? `${currentCloseoutWindow.label} / ${currentCloseoutWindow.state}` : "无收口窗口"
          ],
          detailLines: [
            { id: `${action.id}-closeout-verdict`, label: "最终结论", value: `${activeReplayScenarioLabel} / ${activeReplayScenarioVerdict}` },
            { id: `${action.id}-closeout-timeline`, label: "收口时间线", value: activeReplayCloseoutTimelineLabel },
            {
              id: `${action.id}-closeout-observability`,
              label: "观测收口",
              value: activeReplayObservabilityCloseoutLabel
            }
          ]
        })
      )
    },
    {
      id: "section-context",
      label: "上下文动作",
      summary: "按路由、流程通道和焦点槽位感知当前可用动作。",
      entries: contextualActions.map((action) =>
        actionToPaletteEntry(action, {
          entryId: `section-context-${action.id}`,
          badge: "上下文"
        })
      )
    },
    {
      id: "section-all",
      label: "全部动作",
      summary: "按当前查询过滤后的完整仅本地命令清单。",
      entries: paletteActions.map((action) =>
        actionToPaletteEntry(action, {
          entryId: `section-all-${action.id}`,
          badge: "注册表"
        })
      )
    }
  ];
  const paletteSectionsBase: CommandPaletteSection[] = showAdvancedCommandSurface
    ? [primaryPaletteSection, ...advancedPaletteSectionsBase]
    : [primaryPaletteSection];
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
      ...(showAdvancedCommandSurface
        ? [
            resolvedDeliveryCoverageStage
              ? {
                  id: `palette-context-stage-${resolvedDeliveryCoverageStage.id}`,
                  label: `${resolvedDeliveryCoverageStage.label} / 交付阶段`
                }
              : null,
            resolvedReviewSurfaceAction
              ? {
                  id: `palette-context-surface-${resolvedReviewSurfaceAction.id}`,
                  label: `${resolvedReviewSurfaceAction.label} / 审查面`
                }
              : null,
            activeCompanionRouteState
              ? {
                  id: `palette-context-route-${activeCompanionRouteState.id}`,
                  label: `${activeCompanionRouteState.label} / 伴随路由`
                }
              : null,
            activeReplayScenarioPack
              ? {
                  id: `palette-context-pack-${activeReplayScenarioPack.id}`,
                  label: `${activeReplayScenarioPack.label} / 回放包`
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
          ]
        : [])
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
        `${formatReviewSurfaceKind(action.reviewSurfaceKind)} 覆盖已聚焦到 ${action.deliveryChainStageId ?? "当前审查姿态"}。`
      );
    }
  };

  const workflowStepCards: WorkflowStepCard[] = workflowSteps.map((step) => {
    if (step.kind === "workspace-entry") {
      const active = step.workspaceViewId === workspaceView?.id;

      return {
        step,
        state: active ? "entered" : "available",
        statusLabel: active ? "已进入" : "可用",
        actionLabel: active ? "重新同步工作区" : "进入工作区",
        activate: () => {
          if (!step.workspaceViewId) {
            return;
          }

          activateWorkspaceView(step.workspaceViewId, {
            activity: {
              label: step.label,
              detail: `${step.label} 已让壳层与 ${formatWorkflowPosture(step.posture)} 这一流程入口重新对齐。`,
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
        statusLabel: surfaced ? "已呈现" : "就绪",
        actionLabel: surfaced ? "刷新候选" : "呈现候选",
        activate: () => {
          if (!step.detachedPanelId) {
            return;
          }

          activateDetachedPanel(step.detachedPanelId, {
            label: step.label,
            detail: `${step.label} 已把 ${step.detachedPanelId} 呈现为当前独立流程候选。`,
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
        laneIntent?.localStatus === "focused" ? "已聚焦" : laneIntent?.localStatus === "staged" ? "已暂存" : "就绪",
      actionLabel: laneIntent?.localStatus === "focused" ? "刷新姿态" : "聚焦姿态",
      activate: () => {
        if (!step.windowIntentId) {
          return;
        }

        stageWindowIntent(step.windowIntentId, {
          status: "focused",
          activity: {
            label: step.label,
            detail: `${step.label} 已把 ${step.windowIntentId} 聚焦到 ${formatWorkflowPosture(step.posture)} 这一流程姿态中。`,
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
        recordCommand(action, `已为 ${action.slotId ?? action.routeId ?? "当前壳层"} 暂存预览姿态。`);
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
        recordCommand(action, `右侧栏已${resolvedLayoutState.rightRailVisible ? "隐藏" : "显示"}。`);
        break;
      case "toggle-bottom-dock":
        applyLayoutPatch({
          bottomDockVisible: !resolvedLayoutState.bottomDockVisible
        });
        recordCommand(action, `底部栏已${resolvedLayoutState.bottomDockVisible ? "隐藏" : "显示"}。`);
        break;
      case "toggle-compact-mode":
        applyLayoutPatch({
          compactMode: !resolvedLayoutState.compactMode
        });
        recordCommand(action, `紧凑模式已${resolvedLayoutState.compactMode ? "关闭" : "开启"}。`);
        break;
      case "activate-workspace-view":
        if (action.workspaceViewId) {
          activateWorkspaceView(action.workspaceViewId, {
            activity: {
              label: action.label,
              detail: `工作区视图已切换到 ${action.workspaceViewId}。`,
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
              detail: `窗口意图 ${action.windowIntentId} 已在本地聚焦。`,
              safety: action.safety
            }
          });
        }
        break;
      case "advance-workflow-lane":
        advanceWorkflowLane();
        recordCommand(action, `${selectedWorkflowLane?.label ?? "当前流程通道"} 已在本地推进。`);
        break;
      default:
        console.warn(`未识别的命令动作类型: ${(action as { kind: string }).kind}`);
        recordCommand(action, `暂不支持该按钮动作: ${(action as { kind: string }).kind}`);
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

  const openCommandPalette = (nextQuery = "") => {
    setPaletteReturnFocus(document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setCommandQuery(nextQuery);
    setSelectedPaletteEntryId(null);
    setCommandPaletteOpen(true);
  };

  const executePaletteEntry = (entryId: string) => {
    const entryActionId = paletteEntryById.get(entryId)?.actionId;
    const entryAction = entryActionId ? actionById.get(entryActionId) : undefined;
    if (entryAction) {
      executeCommand(entryAction);
    }
  };

  const toWorkbenchAction = (
    action: StudioCommandAction | undefined,
    overrides?: Partial<Pick<AppWorkbenchAction, "label" | "description" | "hotkey" | "tone">>
  ): AppWorkbenchAction | null => {
    if (!action) {
      return null;
    }

    return {
      id: action.id,
      label: overrides?.label ?? action.label,
      description: overrides?.description ?? action.description,
      tone: overrides?.tone ?? action.tone,
      hotkey: overrides?.hotkey ?? action.hotkey,
      onTrigger: () => {
        executeCommand(action);
      }
    };
  };

  const operatorViewAction = toWorkbenchAction(actionById.get("command-open-operator-view"));
  const traceViewAction = toWorkbenchAction(actionById.get("command-open-trace-view"));
  const reviewViewAction = toWorkbenchAction(actionById.get("command-open-review-view"));
  const openSessionAction = toWorkbenchAction(actionById.get("command-open-session"));
  const inspectBoundaryAction = toWorkbenchAction(actionById.get("command-inspect-boundary"));
  const showTraceAction = toWorkbenchAction(actionById.get("command-show-trace"));
  const focusLaneApplyAction = toWorkbenchAction(actionById.get("command-focus-lane-apply"));
  const latestSession = data.sessions[0] ?? null;
  const persistedResumeSession = lastWorkbenchSessionId ? data.sessions.find((session) => session.id === lastWorkbenchSessionId) ?? null : null;
  const resumeSession = persistedResumeSession ?? latestSession;
  const pendingSessionCount = data.sessions.filter((session) => session.status !== "complete").length;
  const reviewPendingCount = data.sessions.filter((session) => session.status === "waiting").length;
  const openPaletteShortcut = data.commandSurface.keyboardRouting.shortcuts.find((shortcut) => shortcut.target === "open-palette");
  const workbenchCommandBarAction: AppWorkbenchAction = {
    id: "workbench-open-command-palette",
    label: "打开命令面板",
    description: "搜索命令、流程、工作区与最近入口。",
    tone: "neutral",
    hotkey: openPaletteShortcut?.combo ?? "Ctrl/Cmd+K",
    onTrigger: () => {
      openCommandPalette("");
    }
  };

  const persistWorkbenchState = (patch: Partial<PersistedWorkbenchState>) => {
    setWorkbenchState((currentState) => {
      const nextState = createPersistedWorkbenchState(currentState, patch);
      replacePersistedWorkbenchState(nextState);
      return nextState;
    });
  };

  const resolveSessionWorkbenchAction = (session: SessionSummary): AppWorkbenchAction => {
    const haystack = `${session.title} ${session.workspace}`.toLowerCase();

    if (haystack.includes("review") || haystack.includes("boundary") || haystack.includes("bridge")) {
      return reviewViewAction ?? inspectBoundaryAction ?? workbenchCommandBarAction;
    }

    if (haystack.includes("trace")) {
      return showTraceAction ?? traceViewAction ?? workbenchCommandBarAction;
    }

    if (haystack.includes("layout") || haystack.includes("renderer") || haystack.includes("ui")) {
      return operatorViewAction ?? openSessionAction ?? workbenchCommandBarAction;
    }

    if (haystack.includes("bootstrap") || haystack.includes("launch") || haystack.includes("start")) {
      return openSessionAction ?? operatorViewAction ?? workbenchCommandBarAction;
    }

    if (session.status === "active") {
      return traceViewAction ?? operatorViewAction ?? openSessionAction ?? workbenchCommandBarAction;
    }

    if (session.status === "waiting") {
      return reviewViewAction ?? inspectBoundaryAction ?? workbenchCommandBarAction;
    }

    return openSessionAction ?? operatorViewAction ?? workbenchCommandBarAction;
  };

  const handleSessionAction = (session: SessionSummary) => {
    const targetAction = resolveSessionWorkbenchAction(session);
    persistWorkbenchState({
      lastSessionId: session.id,
      lastActionId: targetAction.id,
      lastPageId: activePage,
      lastWorkspaceViewId: resolvedLayoutState.workspaceViewId,
      lastFocusedSlotId: resolvedFocusSlotId
    });
    targetAction.onTrigger();
  };

  const persistedWorkbenchState = workbenchState;
  const persistedResumeCommandAction = lastWorkbenchActionId ? actionById.get(lastWorkbenchActionId) ?? null : null;
  const persistedResumePage = persistedWorkbenchState.lastPageId
    ? data.pages.find((page) => page.id === persistedWorkbenchState.lastPageId) ?? null
    : null;
  const persistedResumeWorkspace = persistedWorkbenchState.lastWorkspaceViewId
    ? data.windowing.views.find((view) => view.id === persistedWorkbenchState.lastWorkspaceViewId) ?? null
    : null;
  const persistedResumeSlot = persistedWorkbenchState.lastFocusedSlotId
    ? data.boundary.hostExecutor.bridge.trace.slotRoster.find((slot) => slot.slotId === persistedWorkbenchState.lastFocusedSlotId) ?? null
    : null;
  const rememberedResumeAction = resolveWorkbenchResumeActionDescriptor({
    actionId: lastWorkbenchActionId,
    commandAction: persistedResumeCommandAction
      ? {
          id: persistedResumeCommandAction.id,
          label: persistedResumeCommandAction.label,
          description: persistedResumeCommandAction.description,
          tone: persistedResumeCommandAction.tone
        }
      : null,
    lastPageId: persistedWorkbenchState.lastPageId,
    sessionTitle: resumeSession?.title ?? null,
    workspaceLabel: persistedResumeWorkspace?.label ?? null,
    pageLabel: persistedResumePage?.label ?? persistedWorkbenchState.lastPageId ?? null,
    slotLabel: persistedResumeSlot?.label ?? persistedWorkbenchState.lastFocusedSlotId ?? null,
    reviewSurfaceLabel: resolvedReviewSurfaceAction?.label ?? null,
    latestHandoffLabel: activeCompanionRouteHistoryEntry?.label ?? activeCompanionPathHandoff?.label ?? null,
    observabilityLabel: resolvedCoverageMapping?.label ?? windowsObservabilityAction?.description ?? null
  });

  const restorePersistedWorkbenchAnchor = (mode: "workspace" | "page" | "slot") => {
    const rememberedWorkspaceViewId = persistedResumeWorkspace?.id ?? persistedWorkbenchState.lastWorkspaceViewId ?? null;
    const rememberedPageId = persistedResumePage?.id ?? persistedWorkbenchState.lastPageId ?? null;
    const rememberedSlotId = persistedResumeSlot?.slotId ?? persistedWorkbenchState.lastFocusedSlotId ?? null;
    const rememberedSurfacePatch = resolveWorkbenchResumeSurfacePatch(rememberedResumeAction?.id ?? null, {
      rightRailTabId: resolvedLayoutState.rightRailTabId,
      bottomDockTabId: resolvedLayoutState.bottomDockTabId
    });

    if (!rememberedWorkspaceViewId && !rememberedPageId && !(mode === "slot" && rememberedSlotId)) {
      openCommandPalette("");
      return;
    }

    if (rememberedWorkspaceViewId) {
      activateWorkspaceView(rememberedWorkspaceViewId, {
        intentStatus: mode === "workspace" ? "focused" : "staged"
      });
    }

    if (rememberedPageId) {
      navigateToPage(rememberedPageId);
    }

    if (mode === "slot" && rememberedSlotId) {
      setFocusedSlotId(rememberedSlotId);
    }

    applyLayoutPatch({
      rightRailVisible: mode === "slot" ? true : resolvedLayoutState.rightRailVisible,
      bottomDockVisible: mode === "slot" ? true : resolvedLayoutState.bottomDockVisible,
      rightRailTabId: mode === "slot" ? "trace" : rememberedSurfacePatch.rightRailTabId,
      bottomDockTabId: mode === "slot" ? "focus" : rememberedSurfacePatch.bottomDockTabId
    });

    persistWorkbenchState({
      lastActionId:
        mode === "slot"
          ? "workbench-restore-last-slot"
          : mode === "page"
            ? "workbench-restore-last-page"
            : "workbench-resume-last-workspace",
      lastPageId: rememberedPageId,
      lastWorkspaceViewId: rememberedWorkspaceViewId,
      lastFocusedSlotId: rememberedSlotId
    });

    recordActivity({
      label:
        mode === "slot"
          ? "聚焦上次槽位"
          : mode === "page"
            ? "恢复记忆页面"
            : "恢复最近工作区",
      detail:
        mode === "slot"
          ? `${persistedResumeSlot?.label ?? rememberedSlotId ?? "记忆槽位"} 已按轨迹姿态恢复。`
          : mode === "page"
            ? `${persistedResumePage?.label ?? rememberedPageId ?? "记忆页面"} 已在 ${persistedResumeWorkspace?.label ?? rememberedWorkspaceViewId ?? "已存工作区"} 内恢复。`
            : `${persistedResumeWorkspace?.label ?? rememberedWorkspaceViewId ?? "已存工作区"} 已连同 ${persistedResumePage?.label ?? rememberedPageId ?? "其记忆页面"} 一起恢复。`,
        safety: "local-only"
    });
  };
  const runRememberedWorkbenchAction = (descriptor: WorkbenchResumeActionDescriptor | null) => {
    if (!descriptor) {
      openCommandPalette("");
      return;
    }

    switch (descriptor.kind) {
      case "command-palette":
        persistWorkbenchState({
          lastActionId: descriptor.id,
          lastPageId: activePage,
          lastWorkspaceViewId: resolvedLayoutState.workspaceViewId,
          lastFocusedSlotId: resolvedFocusSlotId
        });
        openCommandPalette("open ");
        return;
      case "restore-anchor":
        restorePersistedWorkbenchAnchor(descriptor.anchorMode ?? "workspace");
        return;
      case "review-surface-focus":
        handleRunWorkbenchReviewSurfaceAction(resolvedReviewSurfaceAction);
        return;
      case "review-surface-handoff":
        handleRunWorkbenchCompanionRouteHistory(latestReplayRestoreEntryId);
        return;
      case "review-surface-observability":
        handleRunWorkbenchObservabilityAction();
        return;
      case "command-action":
        if (persistedResumeCommandAction) {
          executeCommand(persistedResumeCommandAction);
          return;
        }

        openCommandPalette("");
        return;
    }
  };

  const workbenchPrimaryActions: AppWorkbenchAction[] = [
    {
      id: "workbench-new-session",
      label: "新建会话",
      description: "通过命令面板启动新的流程或任务。",
      tone: "positive",
      hotkey: openPaletteShortcut?.combo ?? "Ctrl/Cmd+K",
      onTrigger: () => {
        persistWorkbenchState({
          lastActionId: "workbench-new-session",
          lastPageId: activePage,
          lastWorkspaceViewId: resolvedLayoutState.workspaceViewId,
          lastFocusedSlotId: resolvedFocusSlotId
        });
        openCommandPalette("open ");
      }
    },
    {
      id: "workbench-resume-last",
      label: "恢复上次工作",
      description: resumeSession ? `${resumeSession.title} · ${resumeSession.updatedAt}` : "恢复最近一次工作轨迹。",
      tone: resumeSession?.status === "waiting" ? "warning" : "neutral",
      onTrigger: () => {
        if (resumeSession) {
          handleSessionAction(resumeSession);
          return;
        }

        openCommandPalette("");
      }
    }
  ];

  const workbenchStatusItems: AppWorkbenchStatusItem[] = [
    {
      id: "status-bridge",
      label: "桥接",
      value: getZhStatusValue(data.status.bridge),
      meta: data.status.mode,
      tone: data.status.bridge === "live" ? "positive" : data.status.bridge === "hybrid" ? "warning" : "neutral"
    },
    {
      id: "status-runtime",
      label: "运行态",
      value: getZhStatusValue(data.status.runtime),
      meta: `${data.version}`,
      tone: data.status.runtime === "ready" ? "positive" : "warning"
    },
    {
      id: "status-workspace",
      label: "工作区",
      value: workspaceView?.label ?? "操作壳层",
      meta: getZhStatusValue(resolvedWindowPosture.label),
      tone: "neutral"
    },
    {
      id: "status-focus",
      label: "聚焦",
      value: hostTraceFocus?.slot.label ?? resolvedFocusSlotId ?? "未聚焦",
      meta: getZhStatusValue(workflowReadinessLabel),
      tone: workflowReadinessTone
    },
    {
      id: "status-sync",
      label: "最近同步",
      value: commandLog[0]?.timestamp ?? data.sessions[0]?.updatedAt ?? "本地预览",
      meta: commandLog[0]?.label ?? "暂无最近操作",
      tone: "neutral"
    },
    {
      id: "status-pending",
      label: "待处理",
      value: `${pendingSessionCount} 项`,
      meta: reviewPendingCount ? `${reviewPendingCount} 项待复核` : "当前无待复核",
      tone: reviewPendingCount ? "warning" : "positive"
    }
  ];

  const workbenchReadinessCards: AppWorkbenchReadinessCard[] = [
    {
      id: "readiness-focused-slot",
      title: "聚焦槽位交接",
      headline: hostTraceFocus?.slot.label ?? "当前未聚焦槽位",
      summary: hostTraceFocus
        ? `${formatProductText(hostTraceFocus.previewSummary)} 当前工作台会把校验、结果与回滚 / 审计一起保留在同一张卡里，方便继续顺着当前槽位往下看。`
        : "当前还没有聚焦槽位；先从命令面板或轨迹台进入一条明确的执行链。",
      tone: hostTraceFocus ? (hostTraceFocus.usesHandoff ? "positive" : "neutral") : "warning",
      metrics: [
        {
          id: "focused-slot-validation",
          label: "校验",
          value: formatProductText(hostTraceFocus?.validationValue, "不可用"),
          meta: formatProductText(hostTraceFocus?.validationDetail)
        },
        {
          id: "focused-slot-result",
          label: "结果",
          value: formatProductText(hostTraceFocus?.resultValue, "不可用"),
          meta: formatProductText(hostTraceFocus?.resultDetail)
        },
        {
          id: "focused-slot-rollback",
          label: "回滚 / 审计",
          value: formatProductText(hostTraceFocus?.rollbackAuditValue, "不可用"),
          meta: formatProductText(hostTraceFocus?.rollbackAuditDetail)
        }
      ],
      actionLabel: "打开轨迹台",
      onOpen: () => {
        (showTraceAction ?? traceViewAction ?? workbenchCommandBarAction).onTrigger();
      }
    },
    {
      id: "readiness-delivery-anchor",
      title: "交付链锚点",
      headline: currentReleaseStage?.label ?? "操作复核看板",
      summary: `${currentDecisionHandoff.sourceOwner} -> ${currentDecisionHandoff.targetOwner} 这条交接链仍停留在仅审查 / 仅本地边界内，但当前阶段、队列与 baton 姿态已能在工作台首页直接看到。`,
      tone: currentReleaseStage?.status === "ready" ? "positive" : currentReleaseStage?.status === "blocked" ? "warning" : "neutral",
      metrics: [
        {
          id: "delivery-anchor-stage",
          label: "交付阶段",
          value: currentDeliveryStage?.label ?? "不可用",
          meta: currentDecisionHandoff.posture
        },
        {
          id: "delivery-anchor-queue",
          label: "审查队列",
          value: currentReviewerQueue?.label ?? "不可用",
          meta: currentReviewerQueue?.acknowledgementState ?? "暂无确认"
        },
        {
          id: "delivery-anchor-baton",
          label: "决策 baton",
          value: currentDecisionHandoff.batonState,
          meta: `${currentDecisionHandoff.sourceOwner} -> ${currentDecisionHandoff.targetOwner}`
        }
      ],
      actionLabel: "打开审查台",
      onOpen: () => {
        (reviewViewAction ?? inspectBoundaryAction ?? workbenchCommandBarAction).onTrigger();
      }
    },
    {
      id: "readiness-review-closeout",
      title: "审查收口",
      headline: currentCloseoutWindow?.deadlineLabel ?? "仅本地收口",
      summary: `当前证据封存与收口窗口仍保持仅审查边界；发布 / 回滚不会被误读成真实执行入口，但待处理 / 已封存姿态已经可以直接在工作台首页对齐。`,
      tone:
        currentEvidenceCloseout.pendingEvidence.length > 0
          ? "warning"
          : currentEvidenceCloseout.sealedEvidence.length > 0
            ? "positive"
            : "neutral",
      metrics: [
        {
          id: "review-closeout-seal",
          label: "证据封存",
          value: currentEvidenceCloseout.sealingState,
          meta: `${currentEvidenceCloseout.sealedEvidence.length} 已封存 / ${currentEvidenceCloseout.pendingEvidence.length} 待处理`
        },
        {
          id: "review-closeout-window",
          label: "收口窗口",
          value: currentCloseoutWindow?.state ?? "不可用",
          meta: currentCloseoutWindow?.deadlineLabel ?? "暂无截止时间"
        },
        {
          id: "review-closeout-reviewers",
          label: "队列姿态",
          value: currentReviewerQueue?.acknowledgementState ?? "不可用",
          meta: currentReviewerQueue?.label ?? "当前无活跃审查队列"
        }
      ],
      actionLabel: "查看收口状态",
      onOpen: () => {
        (reviewViewAction ?? inspectBoundaryAction ?? workbenchCommandBarAction).onTrigger();
      }
    },
    {
      id: "readiness-resume-anchor",
      title: "恢复锚点",
      headline: resumeSession?.title ?? "暂无记忆工作区",
      summary: resumeSession
        ? "保留一个主恢复入口：直接回到最近一次工作；页面、slot 与记忆动作仍由内部状态承接，但不再拆成多组并列按钮。"
        : "当前还没有可恢复的持久化工作锚点；先从上方动作或命令面板进入一条新流程。",
      tone: resumeSession ? (resumeSession.status === "waiting" ? "warning" : "positive") : "neutral",
      metrics: [
        {
          id: "resume-anchor-session",
          label: "最近会话",
          value: resumeSession?.title ?? "不可用",
          meta: resumeSession ? `${resumeSession.workspace} · ${resumeSession.updatedAt}` : "暂无已存会话"
        },
        {
          id: "resume-anchor-action",
          label: "记忆路由",
          value: persistedResumePage?.label ?? persistedWorkbenchState.lastPageId ?? "不可用",
          meta: `${persistedResumeWorkspace?.label ?? "暂无工作区"} / ${rememberedResumeAction?.label ?? "暂无记忆动作"}`
        }
      ],
      actionLabel: "恢复上次工作",
      onOpen: () => {
        restorePersistedWorkbenchAnchor("workspace");
      }
    },
    {
      id: "readiness-review-surface-resume",
      title: "审查面恢复",
      headline: resolvedReviewSurfaceAction?.label ?? "当前无活跃审查面",
      summary: resolvedReviewSurfaceAction
        ? "保留一个审查面入口：直接回到当前审查面；最近交接与可观测路径继续显示在指标里，但不再拆成多组并列按钮。"
        : "当前还没有明确的审查面；先进入审查台或从命令面板选择一个审查面。",
      tone: resolvedReviewSurfaceAction ? (latestReplayRestoreEntryId ? "positive" : "neutral") : "warning",
      metrics: [
        {
          id: "review-surface-resume-surface",
          label: "当前审查面",
          value: resolvedReviewSurfaceAction?.label ?? "不可用",
          meta: resolvedReviewSurfaceAction ? formatReviewSurfaceKind(resolvedReviewSurfaceAction.reviewSurfaceKind) : "暂无审查面"
        },
        {
          id: "review-surface-resume-handoff",
          label: "最近交接",
          value: activeCompanionRouteHistoryEntry?.label ?? activeCompanionPathHandoff?.label ?? "不可用",
          meta:
            activeCompanionRouteHistoryEntry?.transitionKind
              ? formatCompanionRouteTransitionKind(activeCompanionRouteHistoryEntry.transitionKind)
              : formatProductText(activeCompanionPathHandoff?.summary, "暂无记忆交接")
        },
        {
          id: "review-surface-resume-observability",
          label: "观测路径",
          value: resolvedCoverageMapping?.label ?? "不可用",
          meta:
            resolvedCoverageMapping
              ? formatReviewPostureRelationship(resolvedCoverageMapping.relationship)
              : "暂无观测路径"
        }
      ],
      actionLabel: resolvedReviewSurfaceAction ? "进入审查面" : "打开审查台",
      onOpen: () => {
        if (resolvedReviewSurfaceAction) {
          handleRunWorkbenchReviewSurfaceAction(resolvedReviewSurfaceAction);
          return;
        }

        (reviewViewAction ?? inspectBoundaryAction ?? workbenchCommandBarAction).onTrigger();
      }
    }
  ];

  const workbenchWorkflowNodes: AppWorkbenchWorkflowNode[] = [
    {
      id: "operator-shell",
      title: "操作壳层",
      summary: "保持导航锚点和边界检查入口，作为当前工作流的起点。",
      status: "已锚定",
      tone: "positive",
      active: workspaceView?.id === "operator-shell",
      onEnter: () => {
        (operatorViewAction ?? openSessionAction ?? workbenchCommandBarAction).onTrigger();
      }
    },
    {
      id: "trace-deck",
      title: "轨迹台",
      summary: "聚焦当前槽位与追踪链路，适合继续当前执行细节。",
      status: workspaceView?.id === "trace-deck" ? "已聚焦" : "就绪",
      tone: workspaceView?.id === "trace-deck" ? "positive" : "neutral",
      active: workspaceView?.id === "trace-deck",
      onEnter: () => {
        (traceViewAction ?? showTraceAction ?? workbenchCommandBarAction).onTrigger();
      }
    },
    {
      id: "review-deck",
      title: "审查台",
      summary: "集中处理边界复核、回滚准备和下一步交接判断。",
      status: workspaceView?.id === "review-deck" || reviewPendingCount ? "待复核" : "就绪",
      tone: workspaceView?.id === "review-deck" || reviewPendingCount ? "warning" : "neutral",
      active: workspaceView?.id === "review-deck",
      onEnter: () => {
        (reviewViewAction ?? inspectBoundaryAction ?? workbenchCommandBarAction).onTrigger();
      }
    }
  ];

  const workbenchNextActionPrimary =
    toWorkbenchAction(recommendedAction ?? undefined) ??
    (reviewViewAction ?? traceViewAction ?? openSessionAction ?? workbenchCommandBarAction);

  const workbenchNextActionSecondary = dedupeById(
    [inspectBoundaryAction, showTraceAction, reviewViewAction, focusLaneApplyAction].filter(
      (action): action is AppWorkbenchAction => Boolean(action)
    )
  );

  const workbenchQuickLaunchActions = dedupeById(
    [
      showTraceAction,
      reviewViewAction,
      inspectBoundaryAction,
      {
        id: "workbench-resume-shortcut",
        label: "恢复最近工作区",
        description: resumeSession ? `${resumeSession.title} · ${resumeSession.workspace}` : "恢复最近工作区入口。",
        tone: resumeSession?.status === "waiting" ? "warning" : "neutral",
        onTrigger: () => {
          if (resumeSession) {
            handleSessionAction(resumeSession);
            return;
          }

          openCommandPalette("");
        }
      },
      {
        id: "workbench-new-session-shortcut",
        label: "打开命令面板",
        description: "打开命令面板并启动新的流程或任务。",
        tone: "positive",
        onTrigger: () => {
          persistWorkbenchState({
            lastActionId: "workbench-new-session-shortcut",
            lastPageId: activePage,
            lastWorkspaceViewId: resolvedLayoutState.workspaceViewId,
            lastFocusedSlotId: resolvedFocusSlotId
          });
          openCommandPalette("open ");
        }
      }
    ].filter((action): action is AppWorkbenchAction => Boolean(action))
  );

  const workbenchProps: AppWorkbenchProps = {
    commandBarAction: workbenchCommandBarAction,
    primaryActions: workbenchPrimaryActions,
    statusItems: workbenchStatusItems,
    readinessCards: workbenchReadinessCards,
    workflowNodes: workbenchWorkflowNodes,
    nextActionPrimary: workbenchNextActionPrimary,
    nextActionSecondary: workbenchNextActionSecondary,
    nextActionSummary:
      activeContextualFlow?.summary ??
      activeSequence?.summary ??
      "先继续当前流程；如果没有明确动作，就从命令面板或快速启动区进入。",
    quickLaunchActions: workbenchQuickLaunchActions,
    selectedSessionId: lastWorkbenchSessionId,
    sessionFilter: workbenchSessionFilter,
    onSessionAction: handleSessionAction,
    onSessionFilterChange: (filter) => {
      persistWorkbenchState({ sessionFilter: filter });
    }
  };

  const conversationPageMode = activePage === "chat" || activePage === "hermes";
  const activeConversationSurface: SessionSurfaceId = activePage === "hermes" || sessionSurface === "hermes" ? "hermes" : "openclaw";
  const centerFocusMode = activePage === "sessions";
  const dashboardHomeMode = activePage === "dashboard";
  const showWorkbenchScaffolding = !dashboardHomeMode && !conversationPageMode && !centerFocusMode && !currentPageUsesSimpleShell;
  const showWorkbenchBlocks = showWorkbenchScaffolding && !dashboardHomeMode;
  const showRightRail = showWorkbenchBlocks && resolvedLayoutState.rightRailVisible;
  const showBottomDock = showWorkbenchBlocks && resolvedLayoutState.bottomDockVisible;
  const liveSyncTone = syncError ? "warning" : isRefreshing ? "active" : "positive";
  const liveSyncLabel = syncError ? "同步异常" : isRefreshing ? "正在同步" : "实时同步";
  const liveSyncDetail = syncError ? `最近快照 · ${formatLiveSyncAge(lastUpdatedAt)}` : formatLiveSyncAge(lastUpdatedAt);
  const nextDashboardThemeMode: DashboardThemeMode = dashboardThemeMode === "night" ? "day" : "night";
  const ThemeModeIcon = dashboardThemeMode === "night" ? Moon : Sun;
  const themeModeLabel = dashboardThemeMode === "night" ? "夜晚模式" : "白天模式";
  const themeModeTitle = nextDashboardThemeMode === "night" ? "切换到夜晚模式" : "切换到白天模式";
  const shellClassNames = [
    "studio-shell",
    resolvedLayoutState.compactMode ? "studio-shell--compact" : "",
    !showRightRail ? "studio-shell--no-right-rail" : "",
    !showBottomDock ? "studio-shell--no-bottom-dock" : "",
    conversationPageMode ? "studio-shell--conversation-page" : "",
    centerFocusMode ? "studio-shell--center-focus" : "",
    dashboardHomeMode ? "studio-shell--dashboard-home" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const handleConversationNavigate = (pageId: StudioPageId) => {
    setActivePage(pageId);
    navigateToPage(pageId);
  };
  const handleConversationSurfaceChange = (surface: SessionSurfaceId) => {
    setSessionSurface(surface);
    setActivePage(surface === "hermes" ? "hermes" : "chat");
    window.location.hash = surface === "hermes" ? "#hermes" : "#chat";
  };

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
            <span className="brand-mark" aria-hidden="true">
              <ShieldCheck size={22} strokeWidth={2.4} />
            </span>
            <div className="brand-block__copy">
              <strong>山谷智合</strong>
              <p>当前版本</p>
              <div className={`live-sync-pill live-sync-pill--${liveSyncTone}`}>
                <span className="live-sync-pill__dot" />
                <strong>{liveSyncLabel}</strong>
                <em>{liveSyncDetail}</em>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="theme-mode-switch"
            aria-label={themeModeTitle}
            title={themeModeTitle}
            onClick={() => {
              setDashboardThemeMode(nextDashboardThemeMode);
            }}
          >
            <ThemeModeIcon size={16} strokeWidth={2.2} aria-hidden="true" />
            <span>{themeModeLabel}</span>
          </button>
          <div className="nav-section">
            <span className="nav-section__label">主入口</span>
            <nav className="nav-list">
              {livePages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  className={page.id === activePage ? "nav-item nav-item--active" : "nav-item"}
                  onClick={() => {
                    setActivePage(page.id);
                    if (page.id === "chat") {
                      setSessionSurface("openclaw");
                    } else if (page.id === "hermes") {
                      setSessionSurface("hermes");
                    }
                    navigateToPage(page.id);
                  }}
                >
                  <span className="nav-item__icon">{getPageIcon(page.id)}</span>
                  <span className="nav-item__content">
                    <strong>{getZhPageLabel(page.id, page.label)}</strong>
                    <span>{getZhPageHint(page.id, page.hint)}</span>
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {utilityPages.length > 0 ? (
            <div className="nav-section nav-section--utility">
              <span className="nav-section__label">工具配置</span>
              <nav className="nav-list nav-list--utility">
                {utilityPages.map((page) => (
                  <button
                    key={page.id}
                    type="button"
                    className={page.id === activePage ? "nav-item nav-item--active" : "nav-item"}
                    onClick={() => {
                      setActivePage(page.id);
                      navigateToPage(page.id);
                    }}
                  >
                    <span className="nav-item__icon">{getPageIcon(page.id)}</span>
                    <span className="nav-item__content">
                      <strong>{getZhPageLabel(page.id, page.label)}</strong>
                      <span>{getZhPageHint(page.id, page.hint)}</span>
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          ) : null}
          <div className="left-nav__bottom">
            <GatewayRailStatus items={dashboardRealtime.gatewayRail} compact />
          </div>
        </aside>

        {showWorkbenchScaffolding ? (
          <header className="top-bar surface">
            <div className="top-bar__summary">
              <div>
                <p className="eyebrow">桌面入口</p>
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
                      <span>当前工作区</span>
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
                  <span>
                    <Command size={16} strokeWidth={2.2} aria-hidden="true" />
                    快捷入口
                  </span>
                  <strong>Ctrl/Cmd K</strong>
                </button>
                <p>打开快捷入口并执行常用操作。</p>
              </div>
              <div className="top-bar-status">
                <div className="status-badge">
                  <span className="status-badge__icon">
                    <Activity size={15} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <span>桥接</span>
                  <strong>{getZhStatusValue(data.status.bridge)}</strong>
                </div>
                <div className="status-badge">
                  <span className="status-badge__icon">
                    <Cpu size={15} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <span>运行态</span>
                  <strong>{getZhStatusValue(data.status.runtime)}</strong>
                </div>
                <div className="status-badge">
                  <span className="status-badge__icon">
                    <Boxes size={15} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <span>工作区</span>
                  <strong>{workspaceView?.label ?? "不可用"}</strong>
                </div>
                <div className="status-badge">
                  <span className="status-badge__icon">
                    <Gauge size={15} strokeWidth={2.2} aria-hidden="true" />
                  </span>
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
                  <RefreshCw size={16} strokeWidth={2.2} aria-hidden="true" />
                  <strong>{action.label}</strong>
                  <span>{getZhStatusValue(action.safety)}</span>
                </button>
              ))}
            </div>
          </header>
        ) : null}

        <main className="main-panel">
          {syncError ? <div className="runtime-sync-banner runtime-sync-banner--warning">实时同步失败，当前显示最近成功快照：{syncError}</div> : null}
          {showWorkbenchBlocks ? (
            <>
              <section className="foundation-strip">
                <article className="surface card foundation-card">
                  <div className="card-header card-header--stack">
                    <div>
                      <p className="eyebrow">快捷入口</p>
                      <h2>当前操作面板</h2>
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
                        <p className="eyebrow">当前进展</p>
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
                      <h2>当前布局</h2>
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
                      <p className="eyebrow">窗口状态</p>
                      <h2>窗口联动</h2>
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
              </section>

              <OperatorReviewBoard
                pipeline={releaseApprovalPipeline}
                windowing={data.windowing}
                eyebrow="高级审查"
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
                eyebrow="高级审查"
                title="交付链路"
                summary="把当前交付阶段、衔接关系与只读审查路径放在同一处查看。"
              />

              <section className="surface card window-workbench">
                <div className="card-header card-header--stack">
                  <div>
                    <p className="eyebrow">窗口时间线</p>
                    <h2>窗口联动台</h2>
                  </div>
                  <p>{data.windowing.workflow.summary}</p>
                </div>
                <div className="window-workbench__grid">
                  <article className="windowing-summary-card">
                    <span>当前流程通道</span>
                    <strong>{selectedWorkflowLane?.label ?? "无流程通道"}</strong>
                    <p>{selectedWorkflowLane?.summary ?? resolvedWindowPosture.summary}</p>
                    <div className="windowing-card__meta">
                      <span className="windowing-badge windowing-badge--active">{workflowWorkspace?.label ?? "无工作区"}</span>
                      <span className="windowing-badge">{workflowDetachedPanel?.label ?? "无独立面板"}</span>
                      <span className="windowing-badge">{workflowIntent ? formatWorkflowPosture(workflowIntent.workflowStep.posture) : "无姿态"}</span>
                      <span className="windowing-badge">仅本地</span>
                    </div>
                    <div className="windowing-card__actions">
                      <button type="button" className="secondary-button" onClick={() => advanceWorkflowLane()}>
                        推进一步
                      </button>
                    </div>
                  </article>

                  <article className="windowing-summary-card windowing-summary-card--active">
                    <span>审查归属</span>
                    <strong>
                      {activeObservabilityMapping
                        ? `${activeObservabilityMapping.label} / ${formatReviewPostureRelationship(activeObservabilityMapping.relationship)}`
                        : "暂无审查归属"}
                    </strong>
                    <p>
                      {activeObservabilityMapping?.summary ??
                        "当前还没有可见的跨窗口审查归属信息。"}
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
                    <span>就绪看板</span>
                    <strong>{workflowReadinessLabel}</strong>
                    <p>{workflowIntent?.readiness.summary ?? "选择一个窗口意图后查看当前就绪度。"}</p>
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
                    <span>交接状态</span>
                    <strong>{workflowIntent?.handoff.label ?? "暂无交接状态"}</strong>
                    <p>{workflowIntent?.handoff.summary ?? "选择一个窗口意图后查看当前交接状态。"}</p>
                    <div className="windowing-preview-list">
                      {(workflowIntent?.preview.lines ?? []).map((line) => (
                        <div key={`${workflowIntent?.id}-${line.label}`} className="windowing-preview-line">
                          <span>{line.label}</span>
                          <strong>{line.value}</strong>
                        </div>
                      ))}
                    </div>
                    <div className="windowing-card__actions">
                      <span className="windowing-badge">{workflowIntent?.handoff.destination ?? "暂无目标"}</span>
                      <span className="windowing-badge">{workflowLinkedShell}</span>
                    </div>
                  </article>
                </div>
                {advancedReviewDeckEnabled ? (
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
                    eyebrow="高级审查"
                    title="跨窗口协同"
                    summary="把窗口、共享状态、审查归属和本地阻塞统一放在同一块区域。"
                  />
                ) : (
                  <article className="windowing-summary-card">
                    <span>高级审查面板</span>
                    <strong>默认隐藏</strong>
                    <p>跨窗口审查、local-only review 与 release-contract 细节已收进受控入口，避免默认入口继续变成审计控制台。</p>
                    <div className="windowing-card__meta">
                      <span className="windowing-badge">?reviewDeck=1</span>
                      <span className="windowing-badge">localStorage: openclaw-studio.reviewDeck=1</span>
                    </div>
                  </article>
                )}

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
                  <span>工作区联动</span>
                  <strong>{workflowLinkedShell}</strong>
                  <p>
                    工作区入口、独立面板候选与当前姿态会在顶部、主区、检查栏和底栏保持一致。
                  </p>
                </article>
                <article className="windowing-summary-card">
                  <span>当前步骤</span>
                  <strong>{workflowIntent?.workflowStep.label ?? "暂无当前步骤"}</strong>
                  <p>{workflowIntent?.workflowStep.summary ?? "选择一个流程通道后查看当前步骤与交接准备度。"}</p>
                  <div className="windowing-card__meta">
                    <span className="windowing-badge">{workflowIntent ? formatWorkflowPosture(workflowIntent.workflowStep.posture) : "无姿态"}</span>
                    <span className={`windowing-badge${workflowIntent?.localStatus === "focused" ? " windowing-badge--active" : ""}`}>
                      {workflowIntent ? formatIntentStatus(workflowIntent.localStatus) : "无意图"}
                    </span>
                  </div>
                </article>
                <article className="windowing-summary-card">
                  <span>协同矩阵</span>
                  <strong>{selectedWorkflowLane?.label ?? "无流程通道"}</strong>
                  <p>
                    路由、命令流、工作区、独立面板、意图焦点与当前 slot 会集中显示在同一块区域。
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
            </>
          ) : null}

          <Suspense fallback={<PageLoadingState />}>
            {activePage === "chat" || activePage === "hermes" ? (
              <div className="conversation-page-stack">
                <div className="conversation-page-pane" hidden={activeConversationSurface !== "openclaw"}>
                  <LazyChatPage
                    {...chatSummary}
                    onNavigatePage={handleConversationNavigate}
                    onSessionSurfaceChange={handleConversationSurfaceChange}
                    themeMode={dashboardThemeMode}
                    onThemeModeChange={setDashboardThemeMode}
                  />
                </div>
                <div className="conversation-page-pane" hidden={activeConversationSurface !== "hermes"}>
                  <LazyHermesPage
                    {...chatSummary}
                    readinessLabel={hermesReadinessLabel}
                    onNavigatePage={handleConversationNavigate}
                    onSessionSurfaceChange={handleConversationSurfaceChange}
                    themeMode={dashboardThemeMode}
                    onThemeModeChange={setDashboardThemeMode}
                  />
                </div>
              </div>
            ) : (
              renderPage(
                activePage,
                data,
                {
                  focusedSlotId: resolvedFocusSlotId,
                  onFocusedSlotChange: setFocusedSlotId
                },
                workbenchProps,
                chatSummary,
                hermesReadinessLabel,
                dashboardRealtime
              )
            )}
          </Suspense>
        </main>

        {showRightRail ? (
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
                <BoundarySummaryCard boundary={data.inspector.boundary} compact nested eyebrow="检查" />
                <div className="inspector-list">
                  {inspectorSections.map((section) => (
                    <article key={section.id} className="inspector-card">
                      <span>{section.label}</span>
                      <strong>{section.value}</strong>
                    </article>
                  ))}
                </div>
                <article className="windowing-summary-card">
                  <span>检查与命令联动</span>
                  <strong>{activeContextualFlow?.label ?? activeSequence?.label ?? "暂无联动流程"}</strong>
                  <p>检查项会直接跟随当前命令流、下一步看板和当前编排姿态，不再只重复边界状态。</p>
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
                  <span>检查点推进</span>
                  <strong>
                    {activeMaterializationArtifactSurface.activeHandoff?.label ??
                      activeMaterializationArtifactSurface.artifactLedger?.label ??
                      "暂无产物交接"}
                  </strong>
                  <p>这里把当前与下一步的产物交接、封口、失败、Stage C 和下一表面连续性集中展示，但仍保持只读呈现。</p>
                  <div className="windowing-preview-list">
                    <div className="windowing-preview-line windowing-preview-line--stacked">
                      <span>当前交接</span>
                      <strong>
                        {activeMaterializationArtifactSurface.activeHandoff
                          ? `${activeMaterializationArtifactSurface.activeHandoff.label} / ${formatMaterializationValidatorStatus(
                              activeMaterializationArtifactSurface.activeHandoff.status
                            )}`
                          : "不可用"}
                      </strong>
                      <p>{activeMaterializationArtifactSurface.activeHandoff?.summary ?? "当前没有可用的产物交接摘要。"}</p>
                    </div>
                    <div className="windowing-preview-line windowing-preview-line--stacked">
                      <span>检查点路径</span>
                      <strong>{artifactCheckpointProgressionPath}</strong>
                      <p>{artifactCurrentToNextSummary}</p>
                    </div>
                    <div className="windowing-preview-line windowing-preview-line--stacked">
                      <span>当前与下一步交接</span>
                      <strong>{artifactCurrentToNextHandoffLabel}</strong>
                      <p>
                        {currentArtifactSurfaceContinuity}
                        {" / "}
                        {nextArtifactSurfaceContinuity}
                      </p>
                    </div>
                    <div className="windowing-preview-line windowing-preview-line--stacked">
                      <span>当前表面链路</span>
                      <strong>{currentArtifactSurfaceDescriptor}</strong>
                      <p>{currentArtifactSurfaceSpine}</p>
                    </div>
                    <div className="windowing-preview-line windowing-preview-line--stacked">
                      <span>下一表面链路</span>
                      <strong>{nextArtifactSurfaceDescriptor}</strong>
                      <p>{nextArtifactSurfaceSpine}</p>
                    </div>
                    <div className="windowing-preview-line windowing-preview-line--stacked">
                      <span>来源与目标</span>
                      <strong>
                        {activeMaterializationArtifactSurface.sourceArtifacts.length} 来源 /{" "}
                        {activeMaterializationArtifactSurface.targetArtifacts.length} 目标
                      </strong>
                      <p>
                        {activeMaterializationArtifactSurface.sourceArtifacts
                          .map((artifact) => artifact.label)
                          .concat(activeMaterializationArtifactSurface.targetArtifacts.map((artifact) => artifact.label))
                          .join(" / ") || "当前没有可用的产物链路。"}
                      </p>
                    </div>
                    <div className="windowing-preview-line windowing-preview-line--stacked">
                      <span>连续性映射</span>
                      <strong>
                        {activeMaterializationArtifactSurface.observabilityMapping?.label ??
                          activeMaterializationArtifactSurface.activeHandoff?.observabilityMappingId ??
                          "暂无观测路径"}
                      </strong>
                      <p>
                        {activeMaterializationArtifactSurface.reviewStateContinuityEntry?.label ??
                          (activeMaterializationArtifactSurface.activeHandoff
                            ? `${activeMaterializationArtifactSurface.window?.label ?? activeMaterializationArtifactSurface.activeHandoff.windowId} / ${
                                activeMaterializationArtifactSurface.lane?.label ??
                                activeMaterializationArtifactSurface.activeHandoff.sharedStateLaneId
                              }`
                            : "暂无连续性匹配")}
                      </p>
                    </div>
                    <div className="windowing-preview-line windowing-preview-line--stacked">
                      <span>封口检查点</span>
                      <strong>
                        {activeMaterializationArtifactSurface.bundleSealingCheckpoint
                          ? `${activeMaterializationArtifactSurface.bundleSealingCheckpoint.label} / ${formatMaterializationValidatorStatus(
                              activeMaterializationArtifactSurface.bundleSealingCheckpoint.status
                            )}`
                          : "不可用"}
                      </strong>
                      <p>
                        {activeMaterializationArtifactSurface.bundleSealingCheckpoint
                          ? `${activeMaterializationArtifactSurface.bundleSealingCheckpoint.artifactPath} / ${
                              activeMaterializationArtifactSurface.bundleSealingCheckpoint.detail
                            }`
                          : "当前交接未关联封口检查点。"}
                      </p>
                    </div>
                    <div className="windowing-preview-line windowing-preview-line--stacked">
                      <span>失败读数</span>
                      <strong>
                        {activeMaterializationArtifactSurface.failureReadout
                          ? `${activeMaterializationArtifactSurface.failureReadout.label} / ${formatFailureDisposition(
                              activeMaterializationArtifactSurface.failureReadout.failureDisposition
                            )}`
                          : "不可用"}
                      </strong>
                      <p>
                        {activeMaterializationArtifactSurface.failureReadout?.summary ??
                          "当前交接未关联失败读数。"}
                      </p>
                    </div>
                    <div className="windowing-preview-line windowing-preview-line--stacked">
                      <span>Stage C 链路</span>
                      <strong>
                        {activeMaterializationArtifactSurface.stageCCheckpoint
                          ? `${activeMaterializationArtifactSurface.stageCCheckpoint.label} / ${
                              activeMaterializationArtifactSurface.approvalWorkflowStage?.label ?? "暂无流程阶段"
                            }`
                          : "不可用"}
                      </strong>
                      <p>
                        {activeMaterializationArtifactSurface.releaseQaTrack?.label ??
                          "当前交接未关联 Stage C QA 路径。"}
                      </p>
                    </div>
                  </div>
                </article>
                <article className="windowing-summary-card">
                  <span>审查导航</span>
                  <strong>{activeReplayScenarioLabel}</strong>
                  <p>这里把回放包、结论上下文、路由锚点、证据链和交接焦点收敛到一个下一步入口，避免审查和观测入口重复堆叠。</p>
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
                    {recommendedAction ? (
                      <button
                        type="button"
                        className="quick-action-button quick-action-button--primary"
                        onClick={() => {
                          executeCommand(recommendedAction);
                        }}
                      >
                        {recommendedAction.label}
                      </button>
                    ) : resolvedReviewSurfaceAction ? (
                      <button
                        type="button"
                        className="quick-action-button quick-action-button--primary"
                        onClick={() => {
                          handleRunReviewSurfaceAction(resolvedReviewSurfaceAction);
                        }}
                      >
                        定位当前审查面
                      </button>
                    ) : latestReplayRestoreEntryId ? (
                      <button
                        type="button"
                        className="quick-action-button quick-action-button--primary"
                        onClick={() => {
                          handleRunCompanionRouteHistory(latestReplayRestoreEntryId);
                        }}
                      >
                        恢复最近交接
                      </button>
                    ) : windowsObservabilityAction ? (
                      <button
                        type="button"
                        className="quick-action-button quick-action-button--primary"
                        onClick={() => {
                          executeCommand(windowsObservabilityAction);
                        }}
                      >
                        查看跨窗口协同
                      </button>
                    ) : (
                      <button type="button" className="secondary-button" onClick={openCommandPalette}>
                        打开命令面板
                      </button>
                    )}
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
                eyebrow="轨迹"
                title="当前焦点轨迹"
                summary="当前 slot、处理器、校验器、结果、回滚和 slot 列表会集中显示在右侧，即使 host 执行仍处于禁用状态。"
              />
            ) : null}

            {resolvedLayoutState.rightRailTabId === "windows" ? (
              <div className="windowing-panel">
                <article className="windowing-summary-card">
                  <span>窗口姿态</span>
                  <strong>{resolvedWindowPosture.label}</strong>
                  <p>{resolvedWindowPosture.summary}</p>
                  <div className="windowing-card__meta">
                    <span className="windowing-badge windowing-badge--active">{workflowWorkspace?.label ?? "无工作区"}</span>
                    <span className="windowing-badge">{workflowDetachedPanel?.label ?? "无独立面板"}</span>
                    <span className="windowing-badge">{workflowIntent ? formatIntentStatus(workflowIntent.localStatus) : "无意图"}</span>
                  </div>
                </article>

                <article className="windowing-summary-card">
                  <span>流程时间线</span>
                  <strong>{selectedWorkflowLane?.label ?? "暂无流程通道"}</strong>
                  <p>{selectedWorkflowLane?.summary ?? "选择工作区、独立候选或窗口意图后，这里会同步当前流程通道。"}</p>
                  <div className="windowing-card__meta">
                    <span className={`windowing-badge${workflowReadinessTone === "positive" ? " windowing-badge--active" : ""}`}>{workflowReadinessLabel}</span>
                    <span className="windowing-badge">{workflowIntent?.handoff.label ?? "暂无交接状态"}</span>
                    <span className="windowing-badge">{workflowLinkedShell}</span>
                  </div>
                  <div className="windowing-card__actions">
                    <button type="button" className="secondary-button" onClick={() => advanceWorkflowLane()}>
                      推进流程
                    </button>
                  </div>
                </article>

                <article className="windowing-summary-card windowing-summary-card--active">
                  <span>审查归属</span>
                  <strong>
                    {activeObservabilityMapping
                      ? `${activeObservabilityMapping.label} / ${formatReviewPostureRelationship(activeObservabilityMapping.relationship)}`
                      : "暂无审查归属"}
                  </strong>
                  <p>
                    {activeObservabilityMapping?.summary ??
                      "当前没有可见的跨窗口审查归属信息，因此这里暂时无法标出由哪个表面承接当前审查。"}
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

                {advancedReviewDeckEnabled ? (
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
                    eyebrow="跨窗口"
                    title="跨窗口协同"
                    summary="把归属、编排看板、审查姿态、队列状态、确认状态、升级/收尾窗口、同步健康度、路由与工作区意图链路、交付阶段映射以及仅本地阻塞统一显示在当前协同通道里。"
                  />
                ) : (
                  <article className="windowing-summary-card">
                    <span>高级审查面板</span>
                    <strong>已收进受控入口</strong>
                    <p>当前默认协同页只保留主流程与基础状态。需要排查 local-only review / release-contract 细节时，再显式打开 reviewDeck 入口。</p>
                    <div className="windowing-card__meta">
                      <span className="windowing-badge">?reviewDeck=1</span>
                      <span className="windowing-badge">localStorage: openclaw-studio.reviewDeck=1</span>
                    </div>
                  </article>
                )}
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
                  <span>就绪看板</span>
                  <strong>{workflowReadinessLabel}</strong>
                  <p>{workflowIntent?.readiness.summary ?? "选择一个窗口意图后查看当前就绪度。"}</p>
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
                  <span>交接状态</span>
                  <strong>{workflowIntent?.handoff.label ?? "暂无交接状态"}</strong>
                  <p>{workflowIntent?.handoff.summary ?? "当前阶段保持仅本地交接。"}</p>
                  <div className="windowing-card__meta">
                    <span className="windowing-badge">{workflowIntent?.handoff.destination ?? "无目标"}</span>
                    <span className="windowing-badge">{workflowIntent?.handoff.safeMode ?? "仅本地"}</span>
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
                            detail: `${view.label} 已切换为当前独立面板候选。`,
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
                        <span className="windowing-badge">{view.intentIds.length} 个意图</span>
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
                            detail: `${intent.label} 已进入聚焦状态，并联动 ${intent.shellLink.pageId} 与 ${intent.shellLink.rightRailTabId}/${intent.shellLink.bottomDockTabId}。`,
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
                  <span>独立面板候选</span>
                  <strong>{selectedDetachedPanel?.label ?? "暂无独立候选"}</strong>
                  <p>独立面板候选会跟随当前流程通道，便于在不打开原生窗口的前提下集中查看审查、轨迹和预览状态。</p>
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
                          detail: `${panel.label} 已切换为 ${panel.workspaceViewId} 的当前独立面板候选。`,
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

        {showBottomDock ? (
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
