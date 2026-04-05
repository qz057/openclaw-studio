import { useEffect, useState } from "react";
import {
  studioPageIds,
  type StudioCommandAction,
  type StudioCommandActionGroup,
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
import { HomePage } from "./pages/HomePage";
import { SessionsPage } from "./pages/SessionsPage";
import { AgentsPage } from "./pages/AgentsPage";
import { CodexPage } from "./pages/CodexPage";
import { SkillsPage } from "./pages/SkillsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { BoundarySummaryCard } from "./components/BoundarySummaryCard";
import { HostTracePanel } from "./components/HostTracePanel";
import {
  CommandPalette,
  type CommandPaletteEntry,
  type CommandPaletteSection,
  type CommandPaletteShortcutHint
} from "./components/CommandPalette";
import {
  ContextualCommandPanel,
  type ContextualCommandPanelProps,
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

function resolvePage(): StudioPageId {
  const route = window.location.hash.replace("#", "");

  if (studioPageIds.includes(route as StudioPageId)) {
    return route as StudioPageId;
  }

  return "dashboard";
}

function navigateToPage(pageId: StudioPageId) {
  window.location.hash = `#${pageId}`;
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
      return "Anchored";
    case "candidate":
      return "Candidate";
    default:
      return "Detached Local";
  }
}

function formatIntentStatus(status: StudioWindowIntentStatus): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "staged":
      return "Staged";
    default:
      return "Focused";
  }
}

function formatIntentFocus(focus: StudioShellState["windowing"]["windowIntents"][number]["focus"]): string {
  return focus === "primary" ? "Primary focus" : "Secondary focus";
}

function formatWorkflowPosture(posture: StudioShellState["windowing"]["workflow"]["lanes"][number]["posture"]): string {
  switch (posture) {
    case "review":
      return "Review";
    case "trace":
      return "Trace";
    default:
      return "Preview";
  }
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
  commandPanel: ContextualCommandPanelProps
) {
  switch (activePage) {
    case "dashboard":
      return (
        <DashboardPage
          dashboard={data.dashboard}
          boundary={data.boundary}
          status={data.status}
          focusedSlotId={focusedSlot.focusedSlotId}
          onFocusedSlotChange={focusedSlot.onFocusedSlotChange}
          commandPanel={commandPanel}
        />
      );
    case "home":
      return (
        <HomePage
          state={data}
          focusedSlotId={focusedSlot.focusedSlotId}
          onFocusedSlotChange={focusedSlot.onFocusedSlotChange}
          commandPanel={commandPanel}
        />
      );
    case "sessions":
      return <SessionsPage sessions={data.sessions} />;
    case "agents":
      return <AgentsPage agents={data.agents} />;
    case "codex":
      return <CodexPage summary={data.codex.summary} stats={data.codex.stats} tasks={data.codex.tasks} observations={data.codex.observations} />;
    case "skills":
      return (
        <SkillsPage
          skills={data.skills}
          boundary={data.boundary}
          focusedSlotId={focusedSlot.focusedSlotId}
          onFocusedSlotChange={focusedSlot.onFocusedSlotChange}
          commandPanel={commandPanel}
        />
      );
    case "settings":
      return <SettingsPage settings={data.settings} />;
  }
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

  if (error) {
    return <div className="state-screen">Failed to load OpenClaw Studio data: {error}</div>;
  }

  if (!data) {
    return <div className="state-screen">Loading OpenClaw Studio...</div>;
  }

  const resolvedLayoutState = layoutState ?? resolvePersistedShellLayoutState(data);
  const defaultFocusedSlotId = getDefaultTraceFocusSlotId(data.boundary.hostExecutor);
  const resolvedFocusSlotId = focusedSlotId ?? defaultFocusedSlotId;
  const hostTraceFocus = resolveHostTraceFocus(data.boundary.hostExecutor, resolvedFocusSlotId);
  const inspectorSections = createInspectorSections(data.boundary, hostTraceFocus);
  const dockItems = createDockItems(hostTraceFocus);
  const activePageMeta = data.pages.find((page) => page.id === activePage) ?? {
    id: activePage,
    label: "Studio",
    hint: "Workspace shell"
  };
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
          const haystack = [action.label, action.description, action.scope, action.safety, ...action.keywords].join(" ").toLowerCase();
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
  const historyEntries = commandLog.slice(0, data.commandSurface.history.retention);
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
      id: "flow-state-detached",
      label: "Detached candidate",
      value: selectedDetachedPanel?.label ?? "No detached candidate",
      tone: selectedDetachedPanel ? (selectedDetachedPanel.detachState === "detached-local" ? "positive" : "warning") : "neutral"
    }
  ];
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
    }
  };
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
      id: "cross-view-window-shell",
      label: "Workspace -> Detached -> Intent",
      value: `${workspaceView?.label ?? "No workspace"} -> ${selectedDetachedPanel?.label ?? "No detached candidate"} -> ${selectedWindowIntent?.label ?? "No intent"}`,
      detail: "Workspace entry, detached candidate, and intent focus stay synchronized across the main panel, windows rail, and dock."
    },
    {
      id: "cross-view-slot-release",
      label: "Focused slot -> Release posture",
      value: `${hostTraceFocus?.slot.label ?? "No focused slot"} -> phase41 sealed-bundle integrity contract`,
      detail: "Focused-slot review and release review now sit in the same local-only handoff story without enabling host execution, installer work, promotion routing, or publish rollback."
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
      id: "inspector-linkage-window",
      label: "Inspector -> Orchestration board",
      value: `${selectedWorkflowLane?.label ?? "No workflow lane"} / ${selectedWindowIntent?.label ?? "No intent"}`,
      detail: "Workflow lane, intent focus, and detached candidate posture are surfaced together instead of living in separate shell areas."
    }
  ];
  const releasePipelineDepth = [
    {
      id: "release-depth-manifest",
      label: "Formal Release Readiness",
      value: "RELEASE-MANIFEST / BUILD-METADATA / REVIEW-MANIFEST",
      detail: "Phase41 keeps the manifest spine and extends it into sealed-bundle integrity, channel promotion evidence, and publish rollback metadata without executing anything."
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
      detail: "Packaged app directory plans now map into explicit per-platform staging roots, launcher paths, and verification manifests without creating any real packaged app."
    },
    {
      id: "release-depth-staged-output",
      label: "Packaged-app Staged Output Skeleton",
      value: "PACKAGED-APP-STAGED-OUTPUT-SKELETON",
      detail: "Directory materialization now feeds explicit staged outputs and manifests without creating real packaged artifacts."
    },
    {
      id: "release-depth-bundle-sealing",
      label: "Packaged-app Bundle Sealing Skeleton",
      value: "PACKAGED-APP-BUNDLE-SEALING-SKELETON",
      detail: "Staged outputs now feed explicit sealing manifests and integrity checkpoints without freezing or signing any real packaged bundle."
    },
    {
      id: "release-depth-bundle-integrity",
      label: "Sealed-bundle Integrity Contract",
      value: "SEALED-BUNDLE-INTEGRITY-CONTRACT",
      detail: "Bundle sealing metadata now feeds explicit integrity, digest, and audit checkpoints without attesting any real packaged bundle."
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
      id: "release-depth-channel-promotion-evidence",
      label: "Channel Promotion Evidence",
      value: "CHANNEL-PROMOTION-EVIDENCE / INSTALLER-CHANNEL-ROUTING",
      detail: "Channel routing now feeds explicit alpha -> beta -> stable promotion evidence packets without promoting any artifact for real."
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
      detail: "Phase41 increases release structure only; it still does not install, publish, sign, promote channels, roll back publish state, or enable host-side execution."
    }
  ];
  const actionToPaletteEntry = (action: StudioCommandAction, badge?: string): CommandPaletteEntry => ({
    id: action.id,
    label: action.label,
    description: action.description,
    tone: action.tone,
    badge,
    meta: [action.scope, action.safety, action.hotkey ?? "No hotkey"]
  });
  const paletteSections: CommandPaletteSection[] = [
    {
      id: "section-flow",
      label: activeContextualFlow?.label ?? "Recommended Flow",
      summary: activeSequence?.summary ?? "Context-aware orchestration for the current shell posture.",
      entries: dedupeCommandActions([recommendedAction ?? undefined, ...followUpActions]).map((action) =>
        actionToPaletteEntry(action, action.id === recommendedAction?.id ? "Recommended Next Action" : "Follow-up")
      )
    },
    {
      id: "section-next-step-board",
      label: activeNextStepBoard?.label ?? "Route-aware Next-step Board",
      summary: activeNextStepBoard?.summary ?? "Route-aware next steps stay linked to the current shell posture.",
      entries: nextStepItems.flatMap((item) => (item.action ? [actionToPaletteEntry(item.action, "Next step")] : []))
    },
    {
      id: "section-context",
      label: "Contextual Actions",
      summary: "Route, workflow lane, and focused-slot aware actions.",
      entries: contextualActions.map((action) => actionToPaletteEntry(action, "Context"))
    },
    {
      id: "section-all",
      label: "All Actions",
      summary: "Full local-only command registry filtered by the current query.",
      entries: paletteActions.map((action) => actionToPaletteEntry(action, "Registry"))
    }
  ].filter((section) => section.entries.length > 0);
  const paletteEntryIds = paletteSections.flatMap((section) => section.entries.map((entry) => entry.id));

  const applyLayoutPatch = (patch: Partial<StudioShellLayoutState>) => {
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
      rightRailVisible: true,
      bottomDockVisible: true,
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
        rightRailVisible: true,
        bottomDockVisible: true,
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
      case "show-trace":
        applyLayoutPatch({
          rightRailVisible: true,
          bottomDockVisible: true,
          rightRailTabId: action.rightRailTabId ?? resolvedLayoutState.rightRailTabId,
          bottomDockTabId: action.bottomDockTabId ?? resolvedLayoutState.bottomDockTabId
        });
        recordCommand(action, `${action.kind === "show-boundary" ? "Inspector" : "Trace"} rail surfaced.`);
        break;
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

  useEffect(() => {
    if (!commandPaletteOpen) {
      if (selectedPaletteEntryId !== null) {
        setSelectedPaletteEntryId(null);
      }
      return;
    }

    const nextSelectedEntryId = paletteEntryIds[0] ?? null;
    if (!selectedPaletteEntryId || !paletteEntryIds.includes(selectedPaletteEntryId)) {
      setSelectedPaletteEntryId(nextSelectedEntryId);
    }
  }, [commandPaletteOpen, paletteEntryIds, selectedPaletteEntryId]);

  const movePaletteSelection = (direction: -1 | 1) => {
    if (!paletteEntryIds.length) {
      return;
    }

    const currentIndex = selectedPaletteEntryId ? paletteEntryIds.indexOf(selectedPaletteEntryId) : -1;
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + direction + paletteEntryIds.length) % paletteEntryIds.length;
    setSelectedPaletteEntryId(paletteEntryIds[nextIndex] ?? null);
  };

  const executePaletteEntry = (entryId: string) => {
    const entryAction = actionById.get(entryId);
    if (entryAction) {
      executeCommand(entryAction);
    }
  };

  useEffect(() => {
    const shortcuts = data.commandSurface.keyboardRouting.shortcuts;

    const handleKeyDown = (event: KeyboardEvent) => {
      const matchedShortcut = shortcuts.find((shortcut) => matchesKeyboardShortcut(shortcut, event));

      if (!matchedShortcut) {
        return;
      }

      if (isTypingTarget(event.target) && matchedShortcut.target !== "open-palette" && matchedShortcut.target !== "close-palette") {
        return;
      }

      event.preventDefault();

      if (matchedShortcut.target === "open-palette") {
        setPaletteReturnFocus(document.activeElement instanceof HTMLElement ? document.activeElement : null);
        setCommandPaletteOpen(true);
        return;
      }

      if (matchedShortcut.target === "close-palette") {
        setCommandPaletteOpen(false);
        setCommandQuery("");
        paletteReturnFocus?.focus?.();
        return;
      }

      if (matchedShortcut.target === "active-flow") {
        if (recommendedAction) {
          executeCommand(recommendedAction);
        }
        return;
      }

      if (matchedShortcut.target === "action" && matchedShortcut.actionId) {
        const shortcutAction = actionById.get(matchedShortcut.actionId);
        if (shortcutAction) {
          executeCommand(shortcutAction);
        }
        return;
      }

      if (matchedShortcut.target === "sequence" && matchedShortcut.sequenceId) {
        const shortcutSequence = data.commandSurface.sequences.find((sequence) => sequence.id === matchedShortcut.sequenceId);
        const shortcutAction = shortcutSequence?.recommendedActionId
          ? actionById.get(shortcutSequence.recommendedActionId)
          : shortcutSequence?.actionIds[0]
            ? actionById.get(shortcutSequence.actionIds[0])
            : undefined;
        if (shortcutAction) {
          executeCommand(shortcutAction);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [actionById, data.commandSurface.keyboardRouting.shortcuts, data.commandSurface.sequences, paletteReturnFocus, recommendedAction, selectedWorkflowLane]);

  const shellClassNames = [
    "studio-shell",
    resolvedLayoutState.compactMode ? "studio-shell--compact" : "",
    !resolvedLayoutState.rightRailVisible ? "studio-shell--no-right-rail" : "",
    !resolvedLayoutState.bottomDockVisible ? "studio-shell--no-bottom-dock" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <CommandPalette
        sections={paletteSections}
        contexts={activeContexts.map((context) => ({
          id: context.id,
          label: context.label
        }))}
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
              <p>{data.status.mode}</p>
            </div>
          </div>
          <nav className="nav-list">
            {data.pages.map((page) => (
              <a
                key={page.id}
                className={page.id === activePage ? "nav-item nav-item--active" : "nav-item"}
                href={`#${page.id}`}
              >
                <strong>{page.label}</strong>
                <span>{page.hint}</span>
              </a>
            ))}
          </nav>
        </aside>

        <header className="top-bar surface">
          <div className="top-bar__summary">
            <div>
              <p className="eyebrow">Desktop Shell</p>
              <h2>{activePageMeta.label}</h2>
              <p className="page-summary page-summary--tight">{activePageMeta.hint}</p>
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
                    <span>{view.summary}</span>
                    <em className="workspace-view-chip__meta">
                      {formatDetachState(view.detachState)} · {linkedIntent ? formatIntentStatus(linkedIntent.localStatus) : "No intent"}
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
                  setCommandPaletteOpen(true);
                }}
              >
                <span>Command Palette</span>
                <strong>Ctrl/Cmd K</strong>
              </button>
              <p>{data.commandSurface.summary}</p>
            </div>
            <div className="top-bar-status">
              <div className="status-badge">
                <span>Bridge</span>
                <strong>{data.status.bridge}</strong>
              </div>
              <div className="status-badge">
                <span>Runtime</span>
                <strong>{data.status.runtime}</strong>
              </div>
              <div className="status-badge">
                <span>Window Posture</span>
                <strong>{resolvedWindowPosture.label}</strong>
              </div>
              <div className="status-badge">
                <span>Workflow Lane</span>
                <strong>{selectedWorkflowLane?.label ?? "Unavailable"}</strong>
              </div>
              <div className="status-badge">
                <span>Workspace</span>
                <strong>{workspaceView?.label ?? "Unavailable"}</strong>
              </div>
              <div className="status-badge">
                <span>Detached Candidate</span>
                <strong>{selectedDetachedPanel?.label ?? "Unavailable"}</strong>
              </div>
              <div className="status-badge">
                <span>Intent Focus</span>
                <strong>{selectedWindowIntent ? `${formatIntentStatus(selectedWindowIntent.localStatus)} / ${formatIntentFocus(selectedWindowIntent.focus)}` : "None"}</strong>
              </div>
              <div className="status-badge">
                <span>Readiness</span>
                <strong>{workflowReadinessLabel}</strong>
              </div>
              <div className="status-badge">
                <span>Focus Slot</span>
                <strong>{hostTraceFocus?.slot.label ?? "Unavailable"}</strong>
              </div>
            </div>
            <div className="workflow-chip-strip">
              <span className="workflow-chip workflow-chip--active">Workflow Timeline</span>
              <span className={`workflow-chip workflow-chip--${workflowReadinessTone}`}>{selectedWorkflowLane?.label ?? "No workflow lane"}</span>
              <span className={`workflow-chip workflow-chip--${workflowReadinessTone}`}>{workflowReadinessLabel}</span>
              <span className="workflow-chip">{workflowIntent?.handoff.label ?? "No handoff posture"}</span>
              <span className="workflow-chip">{selectedWorkflowLane ? `${formatWorkflowPosture(selectedWorkflowLane.posture)} posture` : "No posture"}</span>
            </div>
          </div>
          <div className="quick-actions-bar">
            {quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                className={`quick-action-button quick-action-button--${action.tone}`}
                onClick={() => {
                  executeCommand(action);
                }}
              >
                <strong>{action.label}</strong>
                <span>{action.safety}</span>
              </button>
            ))}
          </div>
        </header>

        <main className="main-panel">
          <section className="foundation-strip">
            <article className="surface card foundation-card">
              <div className="card-header card-header--stack">
                <div>
                  <p className="eyebrow">Command Surface</p>
                  <h2>{data.commandSurface.title}</h2>
                </div>
                <p>{data.commandSurface.summary}</p>
              </div>
              <div className="foundation-card__metrics">
                <div className="foundation-pill">
                  <span>Contexts</span>
                  <strong>{activeContexts.length}</strong>
                </div>
                <div className="foundation-pill">
                  <span>Quick actions</span>
                  <strong>{quickActions.length}</strong>
                </div>
                <div className="foundation-pill">
                  <span>Window-aware</span>
                  <strong>{windowIntents.filter((intent) => intent.localStatus !== "ready").length}</strong>
                </div>
                <div className="foundation-pill">
                  <span>Last action</span>
                  <strong>{commandLog[0]?.label ?? "None yet"}</strong>
                </div>
              </div>
            </article>

            <article className="surface card foundation-card">
              <div className="card-header card-header--stack">
                <div>
                  <p className="eyebrow">Layout Persistence</p>
                  <h2>{data.layout.title}</h2>
                </div>
                <p>{data.layout.summary}</p>
              </div>
              <div className="foundation-card__metrics">
                <div className="foundation-pill">
                  <span>Right rail</span>
                  <strong>{resolvedLayoutState.rightRailVisible ? rightRailTab?.label : "Hidden"}</strong>
                </div>
                <div className="foundation-pill">
                  <span>Bottom dock</span>
                  <strong>{resolvedLayoutState.bottomDockVisible ? bottomDockTab?.label : "Hidden"}</strong>
                </div>
                <div className="foundation-pill">
                  <span>Workspace</span>
                  <strong>{workspaceView?.label ?? "Unavailable"}</strong>
                </div>
                <div className="foundation-pill">
                  <span>Mode</span>
                  <strong>{resolvedLayoutState.compactMode ? "Compact" : "Standard"}</strong>
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
                  Reset layout
                </button>
                <span>{data.layout.persistence.strategy} · {data.layout.persistence.storageKey}</span>
              </div>
            </article>

            <article className="surface card foundation-card">
              <div className="card-header card-header--stack">
                <div>
                  <p className="eyebrow">Window Posture</p>
                  <h2>{data.windowing.title}</h2>
                </div>
                <p>{data.windowing.summary}</p>
              </div>
              <div className="foundation-card__metrics">
                <div className="foundation-pill">
                  <span>Current posture</span>
                  <strong>{resolvedWindowPosture.label}</strong>
                </div>
                <div className="foundation-pill">
                  <span>Workflow lane</span>
                  <strong>{selectedWorkflowLane?.label ?? "Unavailable"}</strong>
                </div>
                <div className="foundation-pill">
                  <span>Readiness</span>
                  <strong>{workflowReadinessLabel}</strong>
                </div>
                <div className="foundation-pill">
                  <span>Handoff</span>
                  <strong>{workflowIntent?.handoff.label ?? "Unavailable"}</strong>
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
                  Advance workflow
                </button>
                <span>{workflowIntent?.preview.title ?? "No staged intent"}</span>
              </div>
            </article>

            <article className="surface card foundation-card">
              <div className="card-header card-header--stack">
                <div>
                  <p className="eyebrow">Release Pipeline Depth</p>
                  <h2>Sealed-bundle Integrity Contract</h2>
                </div>
                <p>
                  The alpha shell still does not build a real installer, but the release skeleton now pushes further with sealed-bundle
                  integrity contracts, channel promotion evidence, and publish rollback handshake metadata while staying entirely
                  local-only and non-executing.
                </p>
              </div>
              <div className="foundation-card__metrics">
                <div className="foundation-pill">
                  <span>Phase</span>
                  <strong>Phase41</strong>
                </div>
                <div className="foundation-pill">
                  <span>Packaged app</span>
                  <strong>Integrity contract</strong>
                </div>
                <div className="foundation-pill">
                  <span>Installer</span>
                  <strong>Promotion evidence</strong>
                </div>
                <div className="foundation-pill">
                  <span>Pipeline</span>
                  <strong>Rollback handshake</strong>
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

          {renderPage(activePage, data, {
            focusedSlotId: resolvedFocusSlotId,
            onFocusedSlotChange: setFocusedSlotId
          }, commandPanel)}
        </main>

        {resolvedLayoutState.rightRailVisible ? (
          <aside className="inspector surface">
            <div className="panel-title-row">
              <h2>{rightRailTab?.label ?? data.inspector.title}</h2>
              <span>{workspaceView?.label ?? "Shell"}</span>
            </div>
            <p className="panel-summary">{rightRailTab?.summary ?? data.inspector.summary}</p>
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
                  {tab.label}
                </button>
              ))}
            </div>

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
          </aside>
        ) : null}

        {resolvedLayoutState.bottomDockVisible ? (
          <section className="bottom-dock surface">
            <div className="panel-title-row">
              <h2>{bottomDockTab?.label ?? "Bottom Dock"}</h2>
              <span>{resolvedLayoutState.bottomDockTabId === "windows" ? resolvedWindowPosture.label : hostTraceFocus?.slot.label ?? "No focused slot"}</span>
            </div>
            <p className="panel-summary">
              {resolvedLayoutState.bottomDockTabId === "windows"
                ? "Window posture, detached workspace candidates, and intent focus stay synchronized with the top bar and right rail."
                : bottomDockTab?.summary ?? "The dock follows the current focused slot and stays local-only."}
            </p>
            <div className="shell-tab-strip">
              {data.layout.bottomDockTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={tab.id === resolvedLayoutState.bottomDockTabId ? "shell-tab shell-tab--active" : "shell-tab"}
                  onClick={() => {
                    applyLayoutPatch({
                      bottomDockTabId: tab.id,
                      bottomDockVisible: true
                    });
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {resolvedLayoutState.bottomDockTabId === "focus" ? (
              <>
                <div className="trace-slot-roster trace-slot-roster--compact">
                  {data.boundary.hostExecutor.bridge.trace.slotRoster.map((entry) => {
                    const active = entry.slotId === hostTraceFocus?.slot.slotId;

                    return (
                      <button
                        key={entry.slotId}
                        type="button"
                        className={active ? "trace-slot-card trace-slot-button trace-slot-button--active" : "trace-slot-card trace-slot-button"}
                        onClick={() => {
                          setFocusedSlotId(entry.slotId);
                        }}
                      >
                        <span>{entry.intent}</span>
                        <strong>{entry.label}</strong>
                        <p>{entry.summary}</p>
                      </button>
                    );
                  })}
                </div>
                <div className="dock-list">
                  {dockItems.map((item) => (
                    <article key={item.id} className={`dock-card dock-card--${item.tone}`}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                      <p>{item.detail}</p>
                    </article>
                  ))}
                </div>
              </>
            ) : null}

            {resolvedLayoutState.bottomDockTabId === "activity" ? (
              <div className="dock-list">
                <article className="dock-card dock-card--neutral">
                  <span>Persistence</span>
                  <strong>{data.layout.persistence.version}</strong>
                  <p>{data.layout.persistence.persistedFields.join(" · ")}</p>
                </article>
                {commandLog.map((entry) => (
                  <article key={entry.id} className="dock-card dock-card--neutral">
                    <span>{entry.timestamp} · {entry.safety}</span>
                    <strong>{entry.label}</strong>
                    <p>{entry.detail}</p>
                  </article>
                ))}
              </div>
            ) : null}

            {resolvedLayoutState.bottomDockTabId === "windows" ? (
              <div className="dock-list">
                <article className="dock-card dock-card--neutral">
                  <span>Workflow Timeline</span>
                  <strong>{selectedWorkflowLane?.label ?? resolvedWindowPosture.label}</strong>
                  <p>{selectedWorkflowLane?.summary ?? resolvedWindowPosture.summary}</p>
                </article>
                <article className="dock-card dock-card--neutral">
                  <span>Readiness Board</span>
                  <strong>{workflowReadinessLabel}</strong>
                  <p>{workflowIntent?.readiness.summary ?? "No workflow readiness is active."}</p>
                </article>
                <article className="dock-card dock-card--neutral">
                  <span>Handoff Posture</span>
                  <strong>{workflowIntent?.handoff.label ?? "Unavailable"}</strong>
                  <p>{workflowIntent?.handoff.destination ?? "No handoff destination"} · {workflowIntent?.handoff.safeMode ?? "local-only"}</p>
                </article>
                {windowIntents.map((intent) => (
                  <article key={intent.id} className={intent.id === selectedWindowIntent?.id ? "dock-card dock-card--warning" : "dock-card dock-card--neutral"}>
                    <span>{formatIntentStatus(intent.localStatus)} · {formatIntentFocus(intent.focus)}</span>
                    <strong>{intent.label}</strong>
                    <p>{intent.preview.lines.map((line) => `${line.label}: ${line.value}`).join(" · ")}</p>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </>
  );
}
