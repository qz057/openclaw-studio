import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const { getPreflightSummary } = require(path.join(appRoot, "scripts", "studio-preflight.cjs"));
const { createReleaseSkeleton, PHASE_ID, PHASE_TITLE, REVIEW_STAGE_ID } = require(path.join(appRoot, "scripts", "release-skeleton.cjs"));
const rendererRoot = path.join(appRoot, "dist-renderer");
const electronRuntimePath = path.join(appRoot, "dist-electron", "electron", "runtime", "studio-runtime.js");
const sharedDistPath = path.join(repoRoot, "packages", "shared", "dist", "index.js");
const bridgeDistPath = path.join(repoRoot, "packages", "bridge", "dist", "index.js");

async function ensureFile(filePath) {
  await fs.access(filePath);
}

async function verifyRendererBuild() {
  const indexHtmlPath = path.join(rendererRoot, "index.html");
  await ensureFile(indexHtmlPath);

  const html = await fs.readFile(indexHtmlPath, "utf8");
  const assetReferences = Array.from(html.matchAll(/(?:src|href)="(.+?)"/g), (match) => match[1])
    .map((reference) => reference.replace(/^\//, ""))
    .filter((reference) => reference.startsWith("./") || reference.startsWith("assets/"));

  if (assetReferences.length === 0) {
    throw new Error("Renderer build is missing asset references in dist-renderer/index.html.");
  }

  for (const reference of assetReferences) {
    await ensureFile(path.join(rendererRoot, reference));
  }

  return {
    indexHtmlPath,
    assetCount: assetReferences.length
  };
}

async function verifyRendererFocusedSlotUi() {
  const assetsRoot = path.join(rendererRoot, "assets");
  const assetEntries = await fs.readdir(assetsRoot, {
    withFileTypes: true
  });
  const scriptFiles = assetEntries.filter((entry) => entry.isFile() && entry.name.endsWith(".js"));

  if (scriptFiles.length === 0) {
    throw new Error("Renderer build is missing compiled JavaScript assets for the phase25 focus UI.");
  }

  const bundle = (
    await Promise.all(scriptFiles.map((entry) => fs.readFile(path.join(assetsRoot, entry.name), "utf8")))
  ).join("\n");

  const requiredMarkers = [
    "openclaw-studio.focused-slot",
    "openclaw-studio.shell-layout",
    "Focused Slot Scope",
    "Quick slot filters",
    "Dashboard Focus Context",
    "Focused Bridge Slot",
    "Skills Focus Context",
    "Command Palette",
    "Contextual Flow",
    "Recommended Next Action",
    "Active Flow State",
    "Sequence Preview",
    "Route-aware Next-step Board",
    "Keyboard Routing",
    "Layout Persistence",
    "Detached Workspace Behavior",
    "Detached Workspace Candidates",
    "Windowing Workbench",
    "Window Posture",
    "Intent Focus",
    "Workflow Timeline",
    "Workflow Lane",
    "Readiness Board",
    "Cross-view Coordination Matrix",
    "Inspector-Command Linkage",
    "Release Pipeline Depth",
    "Formal Release Readiness",
    "Bundle Assembly Skeleton",
    "Packaged-app Directory Materialization",
    "Packaged-app Staged Output Skeleton",
    "Packaged-app Bundle Sealing Skeleton",
    "Sealed-bundle Integrity Contract",
    "Integrity Attestation Evidence",
    "Attestation Verification Packs",
    "Attestation Apply Audit Packs",
    "Attestation Apply Execution Packets",
    "Attestation Operator Worklists",
    "Attestation Operator Dispatch Manifests",
    "Attestation Operator Dispatch Packets",
    "Attestation Operator Dispatch Receipts",
    "Attestation Operator Reconciliation Ledgers",
    "Attestation Operator Approval Execution Envelopes",
    "Installer-target Builder Skeleton",
    "Installer Builder Execution Skeleton",
    "Installer Builder Orchestration",
    "Installer Channel Routing",
    "Channel Promotion Evidence",
    "Promotion Apply Readiness",
    "Promotion Apply Manifests",
    "Promotion Execution Checkpoints",
    "Promotion Operator Handoff Rails",
    "Promotion Staged-apply Ledgers",
    "Promotion Staged-apply Runsheets",
    "Promotion Staged-apply Command Sheets",
    "Promotion Staged-apply Confirmation Ledgers",
    "Promotion Staged-apply Closeout Journals",
    "Promotion Staged-apply Release Decision Records",
    "Signing & Publish Pipeline",
    "Signing-publish Gating Handshake",
    "Signing-publish Approval Bridge",
    "Signing-publish Promotion Handshake",
    "Publish Rollback Handshake",
    "Rollback Recovery Ledger",
    "Rollback Execution Rehearsal Ledger",
    "Rollback Operator Drillbooks",
    "Rollback Live-readiness Contracts",
    "Rollback Cutover Readiness Maps",
    "Rollback Cutover Handoff Plans",
    "Rollback Cutover Execution Checklists",
    "Rollback Cutover Execution Records",
    "Rollback Cutover Outcome Reports",
    "Rollback Cutover Publication Recovery Receipts",
    "Release Approval Workflow",
    "Release Promotion Gating",
    PHASE_TITLE
  ];

  for (const marker of requiredMarkers) {
    if (!bundle.includes(marker)) {
      throw new Error(`Renderer build is missing ${PHASE_ID} shell UI marker: ${marker}.`);
    }
  }

  return {
    markerCount: requiredMarkers.length
  };
}

async function verifyBridgeFallback() {
  await ensureFile(sharedDistPath);
  await ensureFile(bridgeDistPath);

  const bridgeModule = await import(pathToFileURL(bridgeDistPath).href);
  const snapshot = await bridgeModule.loadStudioSnapshot();

  if (!snapshot?.pages?.length) {
    throw new Error("Bridge fallback returned an empty shell state.");
  }

  return {
    appName: snapshot.appName,
    pageCount: snapshot.pages.length
  };
}

async function verifyElectronRuntime() {
  await ensureFile(electronRuntimePath);

  const { createStudioRuntime } = require(electronRuntimePath);
  const runtime = createStudioRuntime();
  const [shellState, sessions, codexTasks, hostExecutor, hostBridge] = await Promise.all([
    runtime.getShellState(),
    runtime.listSessions(),
    runtime.listCodexTasks(),
    runtime.getHostExecutorState(),
    runtime.getHostBridgeState()
  ]);

  if (!shellState?.appName) {
    throw new Error("Electron runtime returned an invalid shell state.");
  }

  assertInspectorContract(shellState.inspector);
  assertDockContract(shellState.dock, shellState.inspector, hostBridge);
  assertBoundaryContract(shellState.boundary, "shell state");
  assertCommandSurfaceContract(shellState.commandSurface, shellState);
  assertLayoutContract(shellState.layout, shellState.windowing);
  assertWindowingContract(shellState.windowing, shellState.layout);
  assertHostExecutorContract(hostExecutor, "runtime host executor state");
  assertHostBridgeContract(hostBridge, "runtime host bridge state");

  return {
    bridge: shellState.status.bridge,
    runtime: shellState.status.runtime,
    sessions: sessions.length,
    codexTasks: codexTasks.length,
    hostExecutorMode: hostExecutor.mode,
    hostExecutorSlots: hostExecutor.mutationSlots.length,
    hostBridgeHandlers: hostBridge.slotHandlers.length,
    commandActions: shellState.commandSurface.actions.length,
    windowIntents: shellState.windowing.windowIntents.length
  };
}

function assertCommandSurfaceContract(commandSurface, shellState) {
  if (!commandSurface) {
    throw new Error("Shell state is missing the phase35 command surface.");
  }

  if (!Array.isArray(commandSurface.actions) || commandSurface.actions.length < 6) {
    throw new Error("Shell command surface is missing required actions.");
  }

  if (!Array.isArray(commandSurface.quickActionIds) || commandSurface.quickActionIds.length === 0) {
    throw new Error("Shell command surface is missing quick actions.");
  }

  if (!Array.isArray(commandSurface.contexts) || !commandSurface.contexts.some((context) => context.id === "global")) {
    throw new Error("Shell command surface is missing the global command context.");
  }

  if (!Array.isArray(commandSurface.actionGroups) || commandSurface.actionGroups.length === 0) {
    throw new Error("Shell command surface is missing phase35 action groups.");
  }

  if (!Array.isArray(commandSurface.sequences) || commandSurface.sequences.length === 0) {
    throw new Error("Shell command surface is missing phase35 command sequences.");
  }

  if (!Array.isArray(commandSurface.contextualFlows) || commandSurface.contextualFlows.length === 0) {
    throw new Error("Shell command surface is missing phase35 contextual flows.");
  }

  if (!Array.isArray(commandSurface.nextSteps) || commandSurface.nextSteps.length === 0) {
    throw new Error("Shell command surface is missing phase35 next-step definitions.");
  }

  if (!Array.isArray(commandSurface.nextStepBoards) || commandSurface.nextStepBoards.length === 0) {
    throw new Error("Shell command surface is missing phase35 next-step boards.");
  }

  if (!commandSurface.history?.title || !commandSurface.history?.retention) {
    throw new Error("Shell command surface is missing phase35 command history contract.");
  }

  if (!commandSurface.keyboardRouting?.title || !Array.isArray(commandSurface.keyboardRouting.shortcuts) || commandSurface.keyboardRouting.shortcuts.length === 0) {
    throw new Error("Shell command surface is missing phase35 keyboard routing.");
  }

  const actionById = new Map(commandSurface.actions.map((action) => [action.id, action]));
  const requiredActionKinds = new Set([
    "navigate",
    "focus-slot",
    "show-boundary",
    "show-trace",
    "show-preview",
    "advance-workflow-lane",
    "toggle-right-rail",
    "toggle-bottom-dock",
    "toggle-compact-mode",
    "activate-workspace-view",
    "stage-window-intent"
  ]);
  const actualActionKinds = new Set(commandSurface.actions.map((action) => action.kind));

  for (const actionKind of requiredActionKinds) {
    if (!actualActionKinds.has(actionKind)) {
      throw new Error(`Shell command surface is missing action kind ${actionKind}.`);
    }
  }

  for (const actionId of commandSurface.quickActionIds) {
    if (!actionById.has(actionId)) {
      throw new Error(`Shell command surface quick action ${actionId} is missing from the action registry.`);
    }
  }

  for (const context of commandSurface.contexts) {
    if (context.id !== "global" && !shellState.pages.some((page) => page.id === context.id)) {
      throw new Error(`Shell command context ${context.id} does not map to a known route.`);
    }

    if (!Array.isArray(context.actionIds) || context.actionIds.length === 0) {
      throw new Error(`Shell command context ${context.id} is missing action ids.`);
    }

    for (const actionId of context.actionIds) {
      if (!actionById.has(actionId)) {
        throw new Error(`Shell command context ${context.id} points at unknown action ${actionId}.`);
      }
    }
  }

  for (const group of commandSurface.actionGroups) {
    if (!Array.isArray(group.actionIds) || group.actionIds.length === 0) {
      throw new Error(`Command group ${group.id} is missing action ids.`);
    }
    for (const actionId of group.actionIds) {
      if (!actionById.has(actionId)) {
        throw new Error(`Command group ${group.id} points at unknown action ${actionId}.`);
      }
    }
  }

  const sequenceIds = new Set(commandSurface.sequences.map((sequence) => sequence.id));
  for (const sequence of commandSurface.sequences) {
    if (sequence.safety !== "local-only" || !Array.isArray(sequence.actionIds) || sequence.actionIds.length === 0) {
      throw new Error(`Command sequence ${sequence.id} drifted from the expected local-only posture.`);
    }
    for (const actionId of sequence.actionIds) {
      if (!actionById.has(actionId)) {
        throw new Error(`Command sequence ${sequence.id} points at unknown action ${actionId}.`);
      }
    }
  }

  for (const flow of commandSurface.contextualFlows) {
    if (!sequenceIds.has(flow.sequenceId)) {
      throw new Error(`Contextual flow ${flow.id} points at unknown sequence ${flow.sequenceId}.`);
    }
    for (const actionId of [flow.recommendedActionId, ...(flow.followUpActionIds ?? [])].filter(Boolean)) {
      if (!actionById.has(actionId)) {
        throw new Error(`Contextual flow ${flow.id} points at unknown action ${actionId}.`);
      }
    }
  }

  for (const nextStep of commandSurface.nextSteps) {
    if (!actionById.has(nextStep.actionId)) {
      throw new Error(`Command next step ${nextStep.id} points at unknown action ${nextStep.actionId}.`);
    }
  }

  for (const board of commandSurface.nextStepBoards) {
    if (!sequenceIds.has(board.sequenceId)) {
      throw new Error(`Command next-step board ${board.id} points at unknown sequence ${board.sequenceId}.`);
    }

    if (!commandSurface.contextualFlows.some((flow) => flow.id === board.flowId)) {
      throw new Error(`Command next-step board ${board.id} points at unknown flow ${board.flowId}.`);
    }

    if (!Array.isArray(board.stepIds) || board.stepIds.length === 0) {
      throw new Error(`Command next-step board ${board.id} is missing step ids.`);
    }

    for (const stepId of board.stepIds) {
      if (!commandSurface.nextSteps.some((nextStep) => nextStep.id === stepId)) {
        throw new Error(`Command next-step board ${board.id} points at unknown next step ${stepId}.`);
      }
    }
  }

  for (const shortcut of commandSurface.keyboardRouting.shortcuts) {
    if (!shortcut.key || !shortcut.scope || !shortcut.target || !shortcut.combo) {
      throw new Error(`Keyboard shortcut ${shortcut.id} is missing required routing metadata.`);
    }
  }

  for (const action of commandSurface.actions) {
    if (!["local-only", "preview-host"].includes(action.safety)) {
      throw new Error(`Shell command action ${action.id} escaped the allowed safety range.`);
    }
  }
}

function assertLayoutContract(layout, windowing) {
  if (!layout?.persistence) {
    throw new Error("Shell state is missing the phase29 layout persistence contract.");
  }

  if (layout.persistence.strategy !== "localStorage" || !layout.persistence.storageKey) {
    throw new Error("Shell layout persistence contract drifted from the expected localStorage posture.");
  }

  if (!Array.isArray(layout.rightRailTabs) || layout.rightRailTabs.length < 3) {
    throw new Error("Shell layout contract is missing right rail tabs.");
  }

  if (!Array.isArray(layout.bottomDockTabs) || layout.bottomDockTabs.length < 3) {
    throw new Error("Shell layout contract is missing bottom dock tabs.");
  }

  const rightRailTabIds = new Set(layout.rightRailTabs.map((tab) => tab.id));
  const bottomDockTabIds = new Set(layout.bottomDockTabs.map((tab) => tab.id));
  const workspaceViewIds = new Set((windowing?.views ?? []).map((view) => view.id));

  if (!rightRailTabIds.has(layout.defaultState?.rightRailTabId)) {
    throw new Error("Shell layout default right rail tab does not exist.");
  }

  if (!bottomDockTabIds.has(layout.defaultState?.bottomDockTabId)) {
    throw new Error("Shell layout default bottom dock tab does not exist.");
  }

  if (!workspaceViewIds.has(layout.defaultState?.workspaceViewId)) {
    throw new Error("Shell layout default workspace view does not exist.");
  }

  for (const requiredField of [
    "rightRailVisible",
    "bottomDockVisible",
    "compactMode",
    "rightRailTabId",
    "bottomDockTabId",
    "workspaceViewId"
  ]) {
    if (!layout.persistence.persistedFields.includes(requiredField)) {
      throw new Error(`Shell layout persistence is missing field ${requiredField}.`);
    }
  }
}

function assertWindowingContract(windowing, layout) {
  if (!windowing || windowing.readiness !== "contract-ready") {
    throw new Error("Shell state is missing the phase35 detached workspace contract.");
  }

  if (!Array.isArray(windowing.views) || windowing.views.length < 2) {
    throw new Error("Shell multi-window contract is missing workspace views.");
  }

  if (!Array.isArray(windowing.detachedPanels) || windowing.detachedPanels.length === 0) {
    throw new Error("Shell multi-window contract is missing detached panel placeholders.");
  }

  if (!Array.isArray(windowing.windowIntents) || windowing.windowIntents.length === 0) {
    throw new Error("Shell multi-window contract is missing window intents.");
  }

  if (!windowing.workflow || !Array.isArray(windowing.workflow.lanes) || windowing.workflow.lanes.length === 0) {
    throw new Error("Shell multi-window contract is missing phase35 workflow lanes.");
  }

  if (!Array.isArray(windowing.workflow.steps) || windowing.workflow.steps.length === 0) {
    throw new Error("Shell multi-window contract is missing phase35 workflow steps.");
  }

  if (!windowing.orchestration || !Array.isArray(windowing.orchestration.boards) || windowing.orchestration.boards.length === 0) {
    throw new Error("Shell multi-window contract is missing phase35 orchestration boards.");
  }

  if (!Array.isArray(windowing.orchestration.checkpoints) || windowing.orchestration.checkpoints.length === 0) {
    throw new Error("Shell multi-window contract is missing phase35 orchestration checkpoints.");
  }

  const rightRailTabIds = new Set((layout?.rightRailTabs ?? []).map((tab) => tab.id));
  const bottomDockTabIds = new Set((layout?.bottomDockTabs ?? []).map((tab) => tab.id));
  const workspaceViewIds = new Set(windowing.views.map((view) => view.id));
  const detachedPanelIds = new Set(windowing.detachedPanels.map((panel) => panel.id));
  const windowIntentIds = new Set(windowing.windowIntents.map((intent) => intent.id));
  const workflowStepIds = new Set(windowing.workflow.steps.map((step) => step.id));
  const workflowLaneIds = new Set(windowing.workflow.lanes.map((lane) => lane.id));

  if (!windowing.posture?.mode || !windowing.posture?.label || !windowing.posture?.summary) {
    throw new Error("Shell windowing contract is missing phase35 posture summary.");
  }

  if (!workspaceViewIds.has(windowing.posture.activeWorkspaceViewId)) {
    throw new Error("Shell window posture points at an unknown workspace view.");
  }

  if (windowing.posture.focusedIntentId && !windowIntentIds.has(windowing.posture.focusedIntentId)) {
    throw new Error("Shell window posture points at an unknown focused intent.");
  }

  if (windowing.posture.activeDetachedPanelId && !detachedPanelIds.has(windowing.posture.activeDetachedPanelId)) {
    throw new Error("Shell window posture points at an unknown detached panel.");
  }

  if (!workflowLaneIds.has(windowing.workflow.activeLaneId)) {
    throw new Error("Shell workflow points at an unknown active lane.");
  }

  for (const view of windowing.views) {
    if (!rightRailTabIds.has(view.rightRailTabId) || !bottomDockTabIds.has(view.bottomDockTabId)) {
      throw new Error(`Workspace view ${view.id} points at a missing layout tab.`);
    }

    if (!view.detachState || !view.shellRole || !Array.isArray(view.intentIds)) {
      throw new Error(`Workspace view ${view.id} is missing phase35 detach state, shell role, or intent linkage.`);
    }
  }

  for (const panel of windowing.detachedPanels) {
    if (!rightRailTabIds.has(panel.sourceTabId) && !bottomDockTabIds.has(panel.sourceTabId)) {
      throw new Error(`Detached panel placeholder ${panel.id} points at an unknown source tab.`);
    }

    if (!panel.workspaceViewId || !workspaceViewIds.has(panel.workspaceViewId)) {
      throw new Error(`Detached panel placeholder ${panel.id} points at an unknown workspace view.`);
    }

    if (!panel.detachState || !panel.shellRole) {
      throw new Error(`Detached panel placeholder ${panel.id} is missing phase35 detach metadata.`);
    }
  }

  for (const lane of windowing.workflow.lanes) {
    if (!workspaceViewIds.has(lane.workspaceViewId)) {
      throw new Error(`Workflow lane ${lane.id} points at an unknown workspace view.`);
    }

    if (!detachedPanelIds.has(lane.detachedPanelId)) {
      throw new Error(`Workflow lane ${lane.id} points at an unknown detached panel.`);
    }

    if (!windowIntentIds.has(lane.windowIntentId)) {
      throw new Error(`Workflow lane ${lane.id} points at an unknown window intent.`);
    }

    if (!Array.isArray(lane.stepIds) || lane.stepIds.length < 3) {
      throw new Error(`Workflow lane ${lane.id} is missing the expected step chain.`);
    }

    for (const stepId of lane.stepIds) {
      if (!workflowStepIds.has(stepId)) {
        throw new Error(`Workflow lane ${lane.id} points at missing step ${stepId}.`);
      }
    }
  }

  for (const step of windowing.workflow.steps) {
    if (!step.kind || !step.posture) {
      throw new Error(`Workflow step ${step.id} is missing phase35 step metadata.`);
    }

    if (step.workspaceViewId && !workspaceViewIds.has(step.workspaceViewId)) {
      throw new Error(`Workflow step ${step.id} points at an unknown workspace view.`);
    }

    if (step.detachedPanelId && !detachedPanelIds.has(step.detachedPanelId)) {
      throw new Error(`Workflow step ${step.id} points at an unknown detached panel.`);
    }

    if (step.windowIntentId && !windowIntentIds.has(step.windowIntentId)) {
      throw new Error(`Workflow step ${step.id} points at an unknown window intent.`);
    }
  }

  for (const intent of windowing.windowIntents) {
    if (intent.safeMode !== "local-only") {
      throw new Error(`Window intent ${intent.id} escaped the local-only safety boundary.`);
    }

    if (intent.workspaceViewId && !workspaceViewIds.has(intent.workspaceViewId)) {
      throw new Error(`Window intent ${intent.id} points at an unknown workspace view.`);
    }

    if (intent.detachedPanelId && !detachedPanelIds.has(intent.detachedPanelId)) {
      throw new Error(`Window intent ${intent.id} points at an unknown detached panel.`);
    }

    if (!intent.focus || !intent.preview?.title || !intent.preview?.summary || !Array.isArray(intent.preview?.lines) || intent.preview.lines.length === 0) {
      throw new Error(`Window intent ${intent.id} is missing phase35 focus/preview metadata.`);
    }

    if (!intent.workflowStep?.label || !intent.workflowStep?.summary || !intent.readiness?.label || !Array.isArray(intent.readiness?.checks) || intent.readiness.checks.length === 0) {
      throw new Error(`Window intent ${intent.id} is missing phase35 workflow/readiness metadata.`);
    }

    if (!intent.handoff?.label || !intent.handoff?.destination || intent.handoff?.safeMode !== "local-only") {
      throw new Error(`Window intent ${intent.id} is missing phase35 handoff posture metadata.`);
    }

    if (!intent.shellLink?.pageId || !rightRailTabIds.has(intent.shellLink.rightRailTabId) || !bottomDockTabIds.has(intent.shellLink.bottomDockTabId)) {
      throw new Error(`Window intent ${intent.id} is missing a valid shell linkage contract.`);
    }
  }

  const boardIds = new Set(windowing.orchestration.boards.map((board) => board.id));
  const checkpointIds = new Set(windowing.orchestration.checkpoints.map((checkpoint) => checkpoint.id));

  if (!boardIds.has(windowing.orchestration.activeBoardId)) {
    throw new Error("Shell orchestration points at an unknown active board.");
  }

  for (const board of windowing.orchestration.boards) {
    if (!workflowLaneIds.has(board.laneId) || !workspaceViewIds.has(board.workspaceViewId) || !detachedPanelIds.has(board.detachedPanelId) || !windowIntentIds.has(board.windowIntentId)) {
      throw new Error(`Window orchestration board ${board.id} points at unknown workflow/window entities.`);
    }

    if (!Array.isArray(board.checkpointIds) || board.checkpointIds.length === 0) {
      throw new Error(`Window orchestration board ${board.id} is missing checkpoint linkage.`);
    }

    for (const checkpointId of board.checkpointIds) {
      if (!checkpointIds.has(checkpointId)) {
        throw new Error(`Window orchestration board ${board.id} points at unknown checkpoint ${checkpointId}.`);
      }
    }
  }
}

function assertHostBridgeContract(hostBridge, label) {
  if (!hostBridge) {
    throw new Error(`${label} is missing host bridge state.`);
  }

  if (hostBridge.mode !== "disabled" || hostBridge.defaultEnabled !== false || hostBridge.previewHandoff !== "placeholder") {
    throw new Error(`${label} does not reflect the expected disabled placeholder bridge posture.`);
  }

  if (!Array.isArray(hostBridge.validators) || hostBridge.validators.length === 0) {
    throw new Error(`${label} is missing registered validators.`);
  }

  if (!Array.isArray(hostBridge.slotHandlers) || hostBridge.slotHandlers.length === 0) {
    throw new Error(`${label} is missing registered slot handlers.`);
  }

  if (!hostBridge.trace?.focusSlotId || !Array.isArray(hostBridge.trace.slotRoster) || hostBridge.trace.slotRoster.length === 0) {
    throw new Error(`${label} is missing phase25 trace focus state.`);
  }

  if (!hostBridge.trace.slotRoster.some((entry) => entry.slotId === hostBridge.trace.focusSlotId)) {
    throw new Error(`${label} trace focus points at a missing slot ${hostBridge.trace.focusSlotId}.`);
  }

  for (const validator of hostBridge.validators) {
    if (!validator.slotId) {
      throw new Error(`${label} validator ${validator.id} is missing an explicit slotId.`);
    }

    if (!hostBridge.slotHandlers.some((handler) => handler.slotId === validator.slotId)) {
      throw new Error(`${label} validator ${validator.id} points at missing slot ${validator.slotId}.`);
    }
  }

  const simulatedOutcomeStatuses = new Set();

  for (const handler of hostBridge.slotHandlers) {
    if (!Array.isArray(handler.simulatedOutcomes) || handler.simulatedOutcomes.length === 0) {
      throw new Error(`${label} handler ${handler.id} is missing simulated outcomes.`);
    }

    if (!hostBridge.validators.some((validator) => validator.slotId === handler.slotId)) {
      throw new Error(`${label} handler ${handler.id} is missing a slot-linked validator.`);
    }

    for (const outcome of handler.simulatedOutcomes) {
      simulatedOutcomeStatuses.add(outcome.status);
    }
  }

  for (const slot of hostBridge.trace.slotRoster) {
    if (!hostBridge.slotHandlers.some((handler) => handler.slotId === slot.slotId)) {
      throw new Error(`${label} trace slot ${slot.slotId} is missing a linked handler.`);
    }

    if (!slot.outcomeChain.length) {
      throw new Error(`${label} trace slot ${slot.slotId} is missing an outcome chain.`);
    }
  }

  for (const requiredStatus of ["blocked", "abort", "partial-apply", "rollback-required", "rollback-incomplete"]) {
    if (!simulatedOutcomeStatuses.has(requiredStatus)) {
      throw new Error(`${label} simulated outcome coverage is missing ${requiredStatus}.`);
    }
  }
}

function assertHostExecutorContract(hostExecutor, label) {
  if (!hostExecutor) {
    throw new Error(`${label} is missing host executor state.`);
  }

  const requiredCollections = [
    ["intents", hostExecutor.intents],
    ["lifecycle", hostExecutor.lifecycle],
    ["failureTaxonomy", hostExecutor.failureTaxonomy],
    ["mutationSlots", hostExecutor.mutationSlots],
    ["rollback.stages", hostExecutor.rollback?.stages],
    ["approval.request.fields", hostExecutor.approval?.request?.fields],
    ["approval.result.fields", hostExecutor.approval?.result?.fields],
    ["audit.event.fields", hostExecutor.audit?.event?.fields],
    ["rollback.context.fields", hostExecutor.rollback?.context?.fields]
  ];

  for (const [field, value] of requiredCollections) {
    if (!Array.isArray(value) || value.length === 0) {
      throw new Error(`${label} host executor contract is missing required collection ${field}.`);
    }
  }

  assertHostBridgeContract(hostExecutor.bridge, `${label} bridge`);
}

function assertHostPreviewHandoff(handoff, label) {
  if (!handoff) {
    throw new Error(`${label} is missing host preview handoff state.`);
  }

  const requiredObjects = [
    ["mapping", handoff.mapping],
    ["validation", handoff.validation],
    ["approval", handoff.approval],
    ["audit", handoff.audit],
    ["rollback", handoff.rollback],
    ["slotResult", handoff.slotResult]
  ];

  for (const [field, value] of requiredObjects) {
    if (!value) {
      throw new Error(`${label} is missing ${field}.`);
    }
  }

  if (handoff.mapping.status !== "mapped") {
    throw new Error(`${label} did not stay on mapped preview-to-slot status.`);
  }

  if (handoff.simulated !== true) {
    throw new Error(`${label} did not stay on simulated placeholder mode.`);
  }

  if (!Array.isArray(handoff.validation.checkedFieldIds) || handoff.validation.checkedFieldIds.length === 0) {
    throw new Error(`${label} did not expose validator field coverage.`);
  }

  if (!handoff.slotResult.auditCorrelationId || !handoff.slotResult.failureCode || !handoff.slotResult.rollbackDisposition) {
    throw new Error(`${label} is missing audit/failure/rollback linkage on the slot result.`);
  }

  if (!Array.isArray(handoff.simulatedOutcomes) || handoff.simulatedOutcomes.length === 0) {
    throw new Error(`${label} is missing simulated outcomes.`);
  }

  if (handoff.slotResult.status !== handoff.simulatedOutcomes[0].status) {
    throw new Error(`${label} slot result does not match the primary simulated outcome.`);
  }

  const terminalOutcome = handoff.simulatedOutcomes[handoff.simulatedOutcomes.length - 1];

  if (handoff.slotResult.rollbackDisposition !== terminalOutcome.rollbackDisposition) {
    throw new Error(`${label} slot result rollback disposition does not match the terminal simulated outcome.`);
  }

  if (!Array.isArray(handoff.trace) || handoff.trace.length < 4) {
    throw new Error(`${label} is missing the phase25 handoff trace.`);
  }

  const phases = new Set(handoff.trace.map((step) => step.phase));

  for (const phase of ["preview", "slot", "result", "rollback"]) {
    if (!phases.has(phase)) {
      throw new Error(`${label} is missing handoff trace phase ${phase}.`);
    }
  }
}

function assertInspectorContract(inspector) {
  if (!inspector?.boundary) {
    throw new Error("Shell inspector is missing boundary state.");
  }

  if (!inspector.route?.routeId || !inspector.flow?.sequenceId || !inspector.linkage?.workflowLaneId) {
    throw new Error("Shell inspector is missing phase35 route/flow/linkage metadata.");
  }

  if (!Array.isArray(inspector.drilldowns) || inspector.drilldowns.length === 0) {
    throw new Error("Shell inspector is missing phase35 drilldowns.");
  }

  const sectionIds = new Set((inspector.sections ?? []).map((section) => section.id));
  const requiredSectionIds = ["layer", "host", "next", "slot-focus", "handler", "validator", "rollback", "audit", "blocked", "slots"];

  for (const sectionId of requiredSectionIds) {
    if (!sectionIds.has(sectionId)) {
      throw new Error(`Shell inspector is missing required section ${sectionId}.`);
    }
  }

  for (const drilldown of inspector.drilldowns) {
    if (!Array.isArray(drilldown.lines) || drilldown.lines.length === 0) {
      throw new Error(`Shell inspector drilldown ${drilldown.id} is missing lines.`);
    }
  }
}

function assertDockContract(dock, inspector, hostBridge) {
  if (!Array.isArray(dock) || dock.length === 0) {
    throw new Error("Shell dock is missing focus-linked cards.");
  }

  const focusSlotId = hostBridge.trace.focusSlotId;
  const focusSlot = hostBridge.trace.slotRoster.find((entry) => entry.slotId === focusSlotId);

  if (!focusSlot) {
    throw new Error(`Shell dock could not resolve the host bridge focus slot ${focusSlotId}.`);
  }

  const sectionById = new Map((inspector.sections ?? []).map((section) => [section.id, section]));
  const dockById = new Map(dock.map((item) => [item.id, item]));
  const requiredDockIds = [
    "dock-focus-slot",
    "dock-focus-handler",
    "dock-focus-validator",
    "dock-focus-result",
    "dock-focus-rollback"
  ];

  for (const dockId of requiredDockIds) {
    if (!dockById.has(dockId)) {
      throw new Error(`Shell dock is missing required focus-linked card ${dockId}.`);
    }
  }

  if (sectionById.get("slot-focus")?.value !== focusSlot.label) {
    throw new Error("Inspector slot focus is not synchronized with the host bridge trace focus.");
  }

  if (dockById.get("dock-focus-slot")?.value !== focusSlot.label || dockById.get("dock-focus-slot")?.slotId !== focusSlotId) {
    throw new Error("Dock focus slot card is not synchronized with the host bridge trace focus.");
  }

  if (!dockById.get("dock-focus-handler")?.value?.includes(focusSlot.handlerState)) {
    throw new Error("Dock handler card is not synchronized with the focused slot handler state.");
  }

  if (!dockById.get("dock-focus-validator")?.value?.includes(focusSlot.validatorState)) {
    throw new Error("Dock validator card is not synchronized with the focused slot validator state.");
  }

  if (!dockById.get("dock-focus-result")?.value?.includes(focusSlot.primaryStatus)) {
    throw new Error("Dock result card is not synchronized with the focused slot result status.");
  }

  if (!dockById.get("dock-focus-rollback")?.value?.includes(focusSlot.rollbackDisposition)) {
    throw new Error("Dock rollback card is not synchronized with the focused slot rollback posture.");
  }
}

function assertBoundaryContract(boundary, label) {
  if (!boundary) {
    throw new Error(`${label} is missing a boundary summary.`);
  }

  if (!boundary.currentLayer || !boundary.nextLayer || !boundary.policy) {
    throw new Error(`${label} boundary summary is missing core layer or policy fields.`);
  }

  const requiredCollections = [
    ["progression", boundary.progression],
    ["capabilities", boundary.capabilities],
    ["blockedReasons", boundary.blockedReasons],
    ["requiredPreconditions", boundary.requiredPreconditions],
    ["withheldExecutionPlan", boundary.withheldExecutionPlan],
    ["futureExecutorSlots", boundary.futureExecutorSlots]
  ];

  for (const [field, value] of requiredCollections) {
    if (!Array.isArray(value) || value.length === 0) {
      throw new Error(`${label} boundary summary is missing required collection ${field}.`);
    }
  }

  assertHostExecutorContract(boundary.hostExecutor, label);
}

function assertHostBoundaryResult(result, itemId, actionId) {
  if (!result) {
    throw new Error(`Host boundary action ${itemId}:${actionId} returned no result.`);
  }

  assertBoundaryContract(result.boundary, `host boundary action ${itemId}:${actionId}`);

  const sectionIds = new Set((result.sections ?? []).map((section) => section.id));
  const requiredSectionIds = [
    "host-boundary-action",
    "host-boundary-readiness",
    "host-boundary-blockers",
    "host-boundary-permission",
    "host-boundary-capabilities",
    "host-boundary-preconditions",
    "host-boundary-plan",
    "host-boundary-executor-slots",
    "host-boundary-enablement",
    "host-bridge-preview-map",
    "host-bridge-focus",
    "host-bridge-slot-state",
    "host-bridge-validation",
    "host-bridge-approval",
    "host-bridge-audit",
    "host-bridge-rollback",
    "host-bridge-dispositions",
    "host-bridge-result",
    "host-bridge-simulated-outcomes",
    "host-bridge-slot-roster",
    "host-bridge-trace"
  ];

  for (const sectionId of requiredSectionIds) {
    if (!sectionIds.has(sectionId)) {
      throw new Error(`Host boundary action ${itemId}:${actionId} is missing required section ${sectionId}.`);
    }
  }

  if (!result.hostPreview || !result.hostHandoff) {
    throw new Error(`Host boundary action ${itemId}:${actionId} did not expose preview/handoff linkage.`);
  }

  assertHostPreviewHandoff(result.hostHandoff, `host boundary action ${itemId}:${actionId}`);

  if (result.hostPreview.slotId !== result.hostHandoff.mapping.slotId) {
    throw new Error(`Host boundary action ${itemId}:${actionId} returned mismatched preview and handoff slot ids.`);
  }

  const traceSection = result.sections.find((section) => section.id === "host-bridge-trace");
  const focusSection = result.sections.find((section) => section.id === "host-bridge-focus");
  const slotStateSection = result.sections.find((section) => section.id === "host-bridge-slot-state");
  const dispositionSection = result.sections.find((section) => section.id === "host-bridge-dispositions");
  const slotRosterSection = result.sections.find((section) => section.id === "host-bridge-slot-roster");
  const requiredTracePrefixes = ["preview · ", "slot · ", "result · ", "rollback · "];

  for (const prefix of requiredTracePrefixes) {
    if (!traceSection?.lines.some((line) => line.startsWith(prefix))) {
      throw new Error(`Host boundary action ${itemId}:${actionId} is missing trace line ${prefix.trim()}.`);
    }
  }

  for (const prefix of ["focus slot · ", "focus source · ", "focus result · ", "focus rollback · ", "focus audit · "]) {
    if (!focusSection?.lines.some((line) => line.startsWith(prefix))) {
      throw new Error(`Host boundary action ${itemId}:${actionId} is missing focus line ${prefix.trim()}.`);
    }
  }

  for (const prefix of ["current slot · ", "handler · ", "validator · ", "current stage · "]) {
    if (!slotStateSection?.lines.some((line) => line.startsWith(prefix))) {
      throw new Error(`Host boundary action ${itemId}:${actionId} is missing slot-state line ${prefix.trim()}.`);
    }
  }

  for (const prefix of ["audit correlation · ", "failure disposition · ", "rollback disposition · "]) {
    if (!dispositionSection?.lines.some((line) => line.startsWith(prefix))) {
      throw new Error(`Host boundary action ${itemId}:${actionId} is missing disposition line ${prefix.trim()}.`);
    }
  }

  if (!slotRosterSection?.lines.some((line) => line.includes("outcomes "))) {
    throw new Error(`Host boundary action ${itemId}:${actionId} is missing slot roster outcome visibility.`);
  }

  if (!slotRosterSection?.lines.some((line) => line.startsWith("focus active · yes"))) {
    throw new Error(`Host boundary action ${itemId}:${actionId} is missing the active focused slot roster line.`);
  }
}

async function verifyHostBoundaryActions() {
  await ensureFile(electronRuntimePath);

  const { createStudioRuntime } = require(electronRuntimePath);
  const runtime = createStudioRuntime();
  const [rootDetail, connectorDetail] = await Promise.all([
    runtime.getRuntimeItemDetail("mcp-root-scan"),
    runtime.getRuntimeItemDetail("mcp-adjacent-runtime")
  ]);

  if (!rootDetail || !connectorDetail) {
    return {
      status: "skipped",
      detail: "live tools/MCP detail unavailable"
    };
  }

  assertBoundaryContract(rootDetail.boundary, "root detail");
  assertBoundaryContract(connectorDetail.boundary, "connector detail");

  const rootHostBoundarySection = rootDetail.sections.find((section) => section.id === "mcp-root-host-boundary");
  const connectorHostBoundarySection = connectorDetail.sections.find((section) => section.id === "mcp-connector-host-boundary");

  if (!rootHostBoundarySection || !connectorHostBoundarySection) {
    throw new Error("MCP detail is missing the host/runtime boundary summary sections.");
  }

  const rootActionIds = new Set((rootDetail.actions ?? []).map((action) => action.id));
  const connectorActionIds = new Set((connectorDetail.actions ?? []).map((action) => action.id));
  const requiredRootActions = ["preview-host-root-connect"];
  const requiredConnectorActions = [
    "preview-host-bridge-attach",
    "preview-host-connector-activate",
    "preview-host-lane-apply"
  ];

  for (const actionId of requiredRootActions) {
    if (!rootActionIds.has(actionId)) {
      throw new Error(`Root detail is missing required host boundary action ${actionId}.`);
    }
  }

  for (const actionId of requiredConnectorActions) {
    if (!connectorActionIds.has(actionId)) {
      throw new Error(`Connector detail is missing required host boundary action ${actionId}.`);
    }
  }

  const results = [];
  const simulatedOutcomeStatuses = new Set();

  for (const actionId of requiredRootActions) {
    results.push(["mcp-root-scan", actionId, await runtime.runRuntimeItemAction("mcp-root-scan", actionId)]);
  }

  for (const actionId of requiredConnectorActions) {
    results.push(["mcp-adjacent-runtime", actionId, await runtime.runRuntimeItemAction("mcp-adjacent-runtime", actionId)]);
  }

  for (const [itemId, actionId, result] of results) {
    assertHostBoundaryResult(result, itemId, actionId);
    const handoff = await runtime.handoffHostPreview(itemId, actionId);
    assertHostPreviewHandoff(handoff, `direct host preview handoff ${itemId}:${actionId}`);

    const resultOutcomeChain = result.hostHandoff.simulatedOutcomes.map((outcome) => outcome.status).join(" -> ");
    const directOutcomeChain = handoff.simulatedOutcomes.map((outcome) => outcome.status).join(" -> ");

    if (resultOutcomeChain !== directOutcomeChain) {
      throw new Error(`Host boundary action ${itemId}:${actionId} returned a different outcome chain than the direct handoff.`);
    }

    for (const outcome of handoff.simulatedOutcomes) {
      simulatedOutcomeStatuses.add(outcome.status);
    }
  }

  for (const requiredStatus of ["blocked", "abort", "partial-apply", "rollback-required", "rollback-incomplete"]) {
    if (!simulatedOutcomeStatuses.has(requiredStatus)) {
      throw new Error(`Host boundary actions did not expose simulated outcome ${requiredStatus}.`);
    }
  }

  const [refreshedRootDetail, refreshedConnectorDetail] = await Promise.all([
    runtime.getRuntimeItemDetail("mcp-root-scan"),
    runtime.getRuntimeItemDetail("mcp-adjacent-runtime")
  ]);
  const rootSessionSection = refreshedRootDetail?.sections.find((section) => section.id === "mcp-local-root-control");
  const connectorSessionSection = refreshedConnectorDetail?.sections.find((section) => section.id === "mcp-local-connector-control");

  if (!rootSessionSection || !connectorSessionSection) {
    throw new Error("Host boundary verification could not re-read the Studio-local control session sections.");
  }

  const rootSelectionLine = rootSessionSection.lines.find((line) => line.startsWith("selection status · "));
  const connectorExecutionLine = connectorSessionSection.lines.find((line) => line.startsWith("executions · "));

  if (rootSelectionLine !== "selection status · idle") {
    throw new Error(`Host boundary actions unexpectedly changed local root state: ${rootSelectionLine ?? "missing"}.`);
  }

  if (connectorExecutionLine !== "executions · 0") {
    throw new Error(`Host boundary actions unexpectedly changed local connector execution count: ${connectorExecutionLine ?? "missing"}.`);
  }

  return {
    status: "verified",
    detail: `${[...requiredRootActions, ...requiredConnectorActions].join(", ")} | outcomes=${Array.from(simulatedOutcomeStatuses).join("/")}`
  };
}

async function verifyLocalConnectorControls() {
  await ensureFile(electronRuntimePath);

  const { createStudioRuntime } = require(electronRuntimePath);
  const runtime = createStudioRuntime();
  const [rootDetail, connectorDetail] = await Promise.all([
    runtime.getRuntimeItemDetail("mcp-root-scan"),
    runtime.getRuntimeItemDetail("mcp-adjacent-runtime")
  ]);

  if (!rootDetail || !connectorDetail) {
    return {
      status: "skipped",
      detail: "live tools/MCP detail unavailable"
    };
  }

  const rootActionIds = new Set((rootDetail.actions ?? []).map((action) => action.id));
  const connectorActionIds = new Set((connectorDetail.actions ?? []).map((action) => action.id));
  const requiredRootAction = "execute-local-root-select";
  const requiredConnectorActions = [
    "execute-local-bridge-stage",
    "execute-local-connector-activate",
    "execute-local-lane-apply"
  ];

  if (!rootActionIds.has(requiredRootAction)) {
    throw new Error(`Root detail is missing required action ${requiredRootAction}.`);
  }

  for (const actionId of requiredConnectorActions) {
    if (!connectorActionIds.has(actionId)) {
      throw new Error(`Connector detail is missing required action ${actionId}.`);
    }
  }

  const executedResults = [];

  executedResults.push(await runtime.runRuntimeItemAction("mcp-root-scan", requiredRootAction));

  for (const actionId of requiredConnectorActions) {
    executedResults.push(await runtime.runRuntimeItemAction("mcp-adjacent-runtime", actionId));
  }

  if (executedResults.some((result) => !result)) {
    throw new Error("One or more local connector control actions returned no result.");
  }

  for (const [index, result] of executedResults.entries()) {
    assertBoundaryContract(result.boundary, `local connector control result ${index + 1}`);
  }

  const refreshedConnectorDetail = await runtime.getRuntimeItemDetail("mcp-adjacent-runtime");
  const localSessionSection = refreshedConnectorDetail?.sections.find((section) => section.id === "mcp-local-connector-control");
  const localHistorySection = refreshedConnectorDetail?.sections.find((section) => section.id === "mcp-local-connector-history");

  if (!localSessionSection || !localHistorySection) {
    throw new Error("Connector detail did not expose Studio-local control session sections after executing actions.");
  }

  const executionLine = localSessionSection.lines.find((line) => line.startsWith("executions · "));
  const laneLine = localSessionSection.lines.find((line) => line.startsWith("lane apply · "));

  if (executionLine !== "executions · 4") {
    throw new Error(`Unexpected Studio-local execution count after smoke run: ${executionLine ?? "missing"}.`);
  }

  return {
    status: "verified",
    detail: laneLine ?? "lane apply · unknown",
    historyCount: localHistorySection.lines.length
  };
}

function verifyReleaseSkeletonContract() {
  const skeleton = createReleaseSkeleton(getPreflightSummary());
  const requiredLayoutPaths = new Set([".", "artifacts/renderer", "artifacts/electron", "release", "scripts"]);
  const actualLayoutPaths = new Set((skeleton.releaseManifest.layout ?? []).map((entry) => entry.path));
  const requiredDocs = new Set([
    "README.md",
    "HANDOFF.md",
    "IMPLEMENTATION-PLAN.md",
    "PACKAGE-README.md",
    "release/RELEASE-SUMMARY.md",
    "release/REVIEW-MANIFEST.json",
    "release/BUNDLE-MATRIX.json",
    "release/BUNDLE-ASSEMBLY.json",
    "release/PACKAGED-APP-DIRECTORY-SKELETON.json",
    "release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json",
    "release/PACKAGED-APP-MATERIALIZATION-SKELETON.json",
    "release/PACKAGED-APP-STAGED-OUTPUT-SKELETON.json",
    "release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json",
    "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json",
    "release/INTEGRITY-ATTESTATION-EVIDENCE.json",
    "release/ATTESTATION-VERIFICATION-PACKS.json",
    "release/ATTESTATION-APPLY-AUDIT-PACKS.json",
    "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json",
    "release/ATTESTATION-OPERATOR-WORKLISTS.json",
    "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json",
    "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json",
    "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json",
    "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json",
    "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json",
    "release/INSTALLER-TARGETS.json",
    "release/INSTALLER-BUILDER-EXECUTION-SKELETON.json",
    "release/INSTALLER-TARGET-BUILDER-SKELETON.json",
    "release/INSTALLER-BUILDER-ORCHESTRATION.json",
    "release/INSTALLER-CHANNEL-ROUTING.json",
    "release/CHANNEL-PROMOTION-EVIDENCE.json",
    "release/PROMOTION-APPLY-READINESS.json",
    "release/PROMOTION-APPLY-MANIFESTS.json",
    "release/PROMOTION-EXECUTION-CHECKPOINTS.json",
    "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json",
    "release/PROMOTION-STAGED-APPLY-LEDGERS.json",
    "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json",
    "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json",
    "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json",
    "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json",
    "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json",
    "release/SIGNING-METADATA.json",
    "release/NOTARIZATION-PLAN.json",
    "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
    "release/SIGNING-PUBLISH-PIPELINE.json",
    "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json",
    "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
    "release/PUBLISH-ROLLBACK-HANDSHAKE.json",
    "release/ROLLBACK-RECOVERY-LEDGER.json",
    "release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json",
    "release/ROLLBACK-OPERATOR-DRILLBOOKS.json",
    "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json",
    "release/ROLLBACK-CUTOVER-READINESS-MAPS.json",
    "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json",
    "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json",
    "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json",
    "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json",
    "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json",
    "release/RELEASE-APPROVAL-WORKFLOW.json",
    "release/RELEASE-NOTES.md",
    "release/PUBLISH-GATES.json",
    "release/PROMOTION-GATES.json",
    "release/RELEASE-CHECKLIST.md"
  ]);
  const actualDocs = new Set((skeleton.releaseManifest.docs ?? []).map((doc) => doc.path));
  const requiredArtifactGroups = new Set(["renderer", "electron"]);
  const actualArtifactGroups = new Map((skeleton.releaseManifest.artifactGroups ?? []).map((group) => [group.id, group]));

  if (skeleton.releaseManifest.phase !== PHASE_ID || skeleton.releaseManifest.packageKind !== "alpha-shell-release-skeleton") {
    throw new Error(`Release skeleton manifest does not reflect the expected ${PHASE_ID} alpha-shell package kind.`);
  }

  if (skeleton.buildMetadata.app?.phase !== PHASE_ID || skeleton.buildMetadata.preflight?.buildReady !== true) {
    throw new Error(`Release build metadata is missing the expected ${PHASE_ID}/preflight markers.`);
  }

  if (skeleton.installerPlaceholder.status !== "placeholder" || skeleton.installerPlaceholder.canInstall !== false) {
    throw new Error("Installer placeholder contract drifted from the expected non-installer posture.");
  }

  if (skeleton.releaseManifest.installer?.scriptPath !== "scripts/install-placeholder.cjs") {
    throw new Error("Release manifest is missing the placeholder installer script path.");
  }

  if (
    skeleton.installerPlaceholder.packagedAppDirectorySkeletonPath !== "release/PACKAGED-APP-DIRECTORY-SKELETON.json" ||
    skeleton.installerPlaceholder.packagedAppDirectoryMaterializationPath !== "release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json" ||
    skeleton.installerPlaceholder.packagedAppMaterializationSkeletonPath !== "release/PACKAGED-APP-MATERIALIZATION-SKELETON.json" ||
    skeleton.installerPlaceholder.packagedAppStagedOutputSkeletonPath !== "release/PACKAGED-APP-STAGED-OUTPUT-SKELETON.json" ||
    skeleton.installerPlaceholder.packagedAppBundleSealingSkeletonPath !== "release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json" ||
    skeleton.installerPlaceholder.sealedBundleIntegrityContractPath !== "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json" ||
    skeleton.installerPlaceholder.integrityAttestationEvidencePath !== "release/INTEGRITY-ATTESTATION-EVIDENCE.json" ||
    skeleton.installerPlaceholder.attestationVerificationPacksPath !== "release/ATTESTATION-VERIFICATION-PACKS.json" ||
    skeleton.installerPlaceholder.attestationApplyAuditPacksPath !== "release/ATTESTATION-APPLY-AUDIT-PACKS.json" ||
    skeleton.installerPlaceholder.attestationApplyExecutionPacketsPath !== "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json" ||
    skeleton.installerPlaceholder.attestationOperatorWorklistsPath !== "release/ATTESTATION-OPERATOR-WORKLISTS.json" ||
    skeleton.installerPlaceholder.attestationOperatorDispatchManifestsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json" ||
    skeleton.installerPlaceholder.attestationOperatorDispatchPacketsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json" ||
    skeleton.installerPlaceholder.attestationOperatorDispatchReceiptsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json" ||
    skeleton.installerPlaceholder.attestationOperatorReconciliationLedgersPath !== "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json" ||
    skeleton.installerPlaceholder.attestationOperatorSettlementPacksPath !== "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json" ||
    skeleton.installerPlaceholder.installerTargetsPath !== "release/INSTALLER-TARGETS.json" ||
    skeleton.installerPlaceholder.installerBuilderExecutionSkeletonPath !== "release/INSTALLER-BUILDER-EXECUTION-SKELETON.json" ||
    skeleton.installerPlaceholder.installerTargetBuilderSkeletonPath !== "release/INSTALLER-TARGET-BUILDER-SKELETON.json" ||
    skeleton.installerPlaceholder.installerBuilderOrchestrationPath !== "release/INSTALLER-BUILDER-ORCHESTRATION.json" ||
    skeleton.installerPlaceholder.installerChannelRoutingPath !== "release/INSTALLER-CHANNEL-ROUTING.json" ||
    skeleton.installerPlaceholder.channelPromotionEvidencePath !== "release/CHANNEL-PROMOTION-EVIDENCE.json" ||
    skeleton.installerPlaceholder.promotionApplyReadinessPath !== "release/PROMOTION-APPLY-READINESS.json" ||
    skeleton.installerPlaceholder.promotionApplyManifestsPath !== "release/PROMOTION-APPLY-MANIFESTS.json" ||
    skeleton.installerPlaceholder.promotionExecutionCheckpointsPath !== "release/PROMOTION-EXECUTION-CHECKPOINTS.json" ||
    skeleton.installerPlaceholder.promotionOperatorHandoffRailsPath !== "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json" ||
    skeleton.installerPlaceholder.promotionStagedApplyLedgersPath !== "release/PROMOTION-STAGED-APPLY-LEDGERS.json" ||
    skeleton.installerPlaceholder.promotionStagedApplyRunsheetsPath !== "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json" ||
    skeleton.installerPlaceholder.promotionStagedApplyCommandSheetsPath !== "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json" ||
    skeleton.installerPlaceholder.promotionStagedApplyConfirmationLedgersPath !== "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json" ||
    skeleton.installerPlaceholder.promotionStagedApplyCloseoutJournalsPath !== "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json" ||
    skeleton.installerPlaceholder.promotionStagedApplySignoffSheetsPath !== "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json" ||
    skeleton.installerPlaceholder.signingPublishGatingHandshakePath !== "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json" ||
    skeleton.installerPlaceholder.signingPublishPipelinePath !== "release/SIGNING-PUBLISH-PIPELINE.json" ||
    skeleton.installerPlaceholder.signingPublishApprovalBridgePath !== "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json" ||
    skeleton.installerPlaceholder.signingPublishPromotionHandshakePath !== "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json" ||
    skeleton.installerPlaceholder.publishRollbackHandshakePath !== "release/PUBLISH-ROLLBACK-HANDSHAKE.json" ||
    skeleton.installerPlaceholder.rollbackRecoveryLedgerPath !== "release/ROLLBACK-RECOVERY-LEDGER.json" ||
    skeleton.installerPlaceholder.rollbackExecutionRehearsalLedgerPath !== "release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json" ||
    skeleton.installerPlaceholder.rollbackOperatorDrillbooksPath !== "release/ROLLBACK-OPERATOR-DRILLBOOKS.json" ||
    skeleton.installerPlaceholder.rollbackLiveReadinessContractsPath !== "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json" ||
    skeleton.installerPlaceholder.rollbackCutoverReadinessMapsPath !== "release/ROLLBACK-CUTOVER-READINESS-MAPS.json" ||
    skeleton.installerPlaceholder.rollbackCutoverHandoffPlansPath !== "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json" ||
    skeleton.installerPlaceholder.rollbackCutoverExecutionChecklistsPath !== "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json" ||
    skeleton.installerPlaceholder.rollbackCutoverExecutionRecordsPath !== "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json" ||
    skeleton.installerPlaceholder.rollbackCutoverOutcomeReportsPath !== "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json" ||
    skeleton.installerPlaceholder.rollbackCutoverPublicationBundlesPath !== "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json" ||
    skeleton.installerPlaceholder.approvalWorkflowPath !== "release/RELEASE-APPROVAL-WORKFLOW.json"
  ) {
    throw new Error(`Installer placeholder is missing ${PHASE_ID} dispatch / runsheet / handoff paths.`);
  }

  for (const requiredLayoutPath of requiredLayoutPaths) {
    if (!actualLayoutPaths.has(requiredLayoutPath)) {
      throw new Error(`Release skeleton layout is missing required path ${requiredLayoutPath}.`);
    }
  }

  for (const requiredDoc of requiredDocs) {
    if (!actualDocs.has(requiredDoc)) {
      throw new Error(`Release skeleton docs are missing required file ${requiredDoc}.`);
    }
  }

  for (const requiredGroup of requiredArtifactGroups) {
    const artifactGroup = actualArtifactGroups.get(requiredGroup);

    if (!artifactGroup) {
      throw new Error(`Release skeleton is missing artifact group ${requiredGroup}.`);
    }

    if (!Array.isArray(artifactGroup.entrypoints) || artifactGroup.entrypoints.length === 0 || artifactGroup.fileCount === 0) {
      throw new Error(`Release skeleton artifact group ${requiredGroup} is missing entrypoints or files.`);
    }
  }

  if (!Array.isArray(skeleton.releaseManifest.artifacts) || skeleton.releaseManifest.artifacts.length < 4) {
    throw new Error("Release skeleton manifest is missing copied artifact entries.");
  }

  if (!Array.isArray(skeleton.buildMetadata.currentDeliverySurfaces) || skeleton.buildMetadata.currentDeliverySurfaces.length === 0) {
    throw new Error("Release build metadata is missing current delivery surface declarations.");
  }

  if (!Array.isArray(skeleton.buildMetadata.formalInstallerGaps) || skeleton.buildMetadata.formalInstallerGaps.length < 3) {
    throw new Error("Release build metadata is missing formal installer gap declarations.");
  }

  if (
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/ATTESTATION-VERIFICATION-PACKS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/ATTESTATION-APPLY-AUDIT-PACKS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/ATTESTATION-APPLY-EXECUTION-PACKETS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/ATTESTATION-OPERATOR-WORKLISTS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/CHANNEL-PROMOTION-EVIDENCE.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/PROMOTION-APPLY-MANIFESTS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/PROMOTION-EXECUTION-CHECKPOINTS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/PROMOTION-OPERATOR-HANDOFF-RAILS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/PROMOTION-STAGED-APPLY-LEDGERS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/PROMOTION-STAGED-APPLY-RUNSHEETS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/PUBLISH-ROLLBACK-HANDSHAKE.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/ROLLBACK-OPERATOR-DRILLBOOKS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/ROLLBACK-LIVE-READINESS-CONTRACTS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/ROLLBACK-CUTOVER-READINESS-MAPS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json") ||
    !skeleton.buildMetadata.pipeline?.formalReleaseArtifacts?.includes("release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json")
  ) {
    throw new Error(`Release build metadata is missing ${PHASE_ID} formal release artifacts.`);
  }

  if (!Array.isArray(skeleton.releaseManifest.reviewArtifacts) || !skeleton.releaseManifest.reviewArtifacts.includes("release/RELEASE-SUMMARY.md")) {
    throw new Error(`Release manifest is missing ${PHASE_ID} review artifacts.`);
  }

  if (
    !Array.isArray(skeleton.releaseManifest.formalReleaseArtifacts) ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/ATTESTATION-VERIFICATION-PACKS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/ATTESTATION-APPLY-AUDIT-PACKS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/ATTESTATION-APPLY-EXECUTION-PACKETS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/ATTESTATION-OPERATOR-WORKLISTS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/CHANNEL-PROMOTION-EVIDENCE.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/PROMOTION-APPLY-MANIFESTS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/PROMOTION-EXECUTION-CHECKPOINTS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/PROMOTION-OPERATOR-HANDOFF-RAILS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/PROMOTION-STAGED-APPLY-LEDGERS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/PROMOTION-STAGED-APPLY-RUNSHEETS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/PUBLISH-ROLLBACK-HANDSHAKE.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/ROLLBACK-OPERATOR-DRILLBOOKS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/ROLLBACK-LIVE-READINESS-CONTRACTS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/ROLLBACK-CUTOVER-READINESS-MAPS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json") ||
    !skeleton.releaseManifest.formalReleaseArtifacts.includes("release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json")
  ) {
    throw new Error(`Release manifest is missing ${PHASE_ID} formal release artifacts.`);
  }

  if (!Array.isArray(skeleton.releaseManifest.pipelineStages) || skeleton.releaseManifest.pipelineStages.length < 24) {
    throw new Error(`Release manifest is missing ${PHASE_ID} pipeline stage declarations.`);
  }

  if (
    skeleton.reviewManifest?.pipeline?.stage !== REVIEW_STAGE_ID ||
    !Array.isArray(skeleton.reviewManifest?.pipeline?.stages) ||
    skeleton.reviewManifest.pipeline.stages.length < 24
  ) {
    throw new Error(`Review manifest is missing ${PHASE_ID} review pipeline depth.`);
  }

  if (!Array.isArray(skeleton.bundleMatrix?.bundles) || skeleton.bundleMatrix.bundles.length < 3) {
    throw new Error(`Bundle matrix is missing ${PHASE_ID} per-platform bundle declarations.`);
  }

  if (!Array.isArray(skeleton.bundleAssembly?.assemblies) || skeleton.bundleAssembly.assemblies.length < 3) {
    throw new Error(`Bundle assembly is missing ${PHASE_ID} assembly declarations.`);
  }

  if (!Array.isArray(skeleton.packagedAppDirectorySkeleton?.directories) || skeleton.packagedAppDirectorySkeleton.directories.length < 3) {
    throw new Error(`Packaged app directory skeleton is missing ${PHASE_ID} directory declarations.`);
  }

  if (!Array.isArray(skeleton.packagedAppDirectoryMaterialization?.directories) || skeleton.packagedAppDirectoryMaterialization.directories.length < 3) {
    throw new Error(`Packaged app directory materialization is missing ${PHASE_ID} directory materialization declarations.`);
  }

  if (!Array.isArray(skeleton.packagedAppMaterializationSkeleton?.materializations) || skeleton.packagedAppMaterializationSkeleton.materializations.length < 3) {
    throw new Error(`Packaged app materialization skeleton is missing ${PHASE_ID} materialization declarations.`);
  }

  if (!Array.isArray(skeleton.packagedAppStagedOutputSkeleton?.outputs) || skeleton.packagedAppStagedOutputSkeleton.outputs.length < 3) {
    throw new Error(`Packaged-app staged output skeleton is missing ${PHASE_ID} staged-output declarations.`);
  }

  if (!Array.isArray(skeleton.packagedAppBundleSealingSkeleton?.bundles) || skeleton.packagedAppBundleSealingSkeleton.bundles.length < 3) {
    throw new Error(`Packaged-app bundle sealing skeleton is missing ${PHASE_ID} sealing declarations.`);
  }

  if (!Array.isArray(skeleton.sealedBundleIntegrityContract?.contracts) || skeleton.sealedBundleIntegrityContract.contracts.length < 3) {
    throw new Error(`Sealed-bundle integrity contract is missing ${PHASE_ID} integrity declarations.`);
  }

  if (!Array.isArray(skeleton.integrityAttestationEvidence?.attestations) || skeleton.integrityAttestationEvidence.attestations.length < 3) {
    throw new Error(`Integrity attestation evidence is missing ${PHASE_ID} attestation declarations.`);
  }

  if (!Array.isArray(skeleton.attestationVerificationPacks?.packs) || skeleton.attestationVerificationPacks.packs.length < 3) {
    throw new Error(`Attestation verification packs are missing ${PHASE_ID} verification declarations.`);
  }

  if (!Array.isArray(skeleton.attestationApplyAuditPacks?.packs) || skeleton.attestationApplyAuditPacks.packs.length < 2) {
    throw new Error(`Attestation apply audit packs are missing ${PHASE_ID} audit declarations.`);
  }

  if (!Array.isArray(skeleton.attestationApplyExecutionPackets?.packets) || skeleton.attestationApplyExecutionPackets.packets.length < 2) {
    throw new Error(`Attestation apply execution packets are missing ${PHASE_ID} execution declarations.`);
  }

  if (!Array.isArray(skeleton.attestationOperatorWorklists?.worklists) || skeleton.attestationOperatorWorklists.worklists.length < 2) {
    throw new Error(`Attestation operator worklists are missing ${PHASE_ID} worklist declarations.`);
  }

  if (!Array.isArray(skeleton.attestationOperatorDispatchManifests?.manifests) || skeleton.attestationOperatorDispatchManifests.manifests.length < 2) {
    throw new Error(`Attestation operator dispatch manifests are missing ${PHASE_ID} dispatch declarations.`);
  }

  if (!Array.isArray(skeleton.attestationOperatorDispatchPackets?.packets) || skeleton.attestationOperatorDispatchPackets.packets.length < 2) {
    throw new Error(`Attestation operator dispatch packets are missing ${PHASE_ID} packet declarations.`);
  }

  if (!Array.isArray(skeleton.attestationOperatorDispatchReceipts?.receipts) || skeleton.attestationOperatorDispatchReceipts.receipts.length < 2) {
    throw new Error(`Attestation operator dispatch receipts are missing ${PHASE_ID} receipt declarations.`);
  }

  if (!Array.isArray(skeleton.attestationOperatorReconciliationLedgers?.ledgers) || skeleton.attestationOperatorReconciliationLedgers.ledgers.length < 2) {
    throw new Error(`Attestation operator reconciliation ledgers are missing ${PHASE_ID} reconciliation declarations.`);
  }

  if (!Array.isArray(skeleton.attestationOperatorSettlementPacks?.packs) || skeleton.attestationOperatorSettlementPacks.packs.length < 2) {
    throw new Error(`Attestation operator settlement packs are missing ${PHASE_ID} settlement-pack declarations.`);
  }

  if (!Array.isArray(skeleton.attestationOperatorApprovalExecutionEnvelopes?.envelopes) || skeleton.attestationOperatorApprovalExecutionEnvelopes.envelopes.length < 2) {
    throw new Error(`Attestation operator approval execution envelopes are missing ${PHASE_ID} approval-envelope declarations.`);
  }

  if (!Array.isArray(skeleton.installerTargets?.targets) || skeleton.installerTargets.targets.length < 7) {
    throw new Error(`Installer targets are missing ${PHASE_ID} target declarations.`);
  }

  if (!Array.isArray(skeleton.installerBuilderExecutionSkeleton?.executions) || skeleton.installerBuilderExecutionSkeleton.executions.length < 7) {
    throw new Error(`Installer builder execution skeleton is missing ${PHASE_ID} execution declarations.`);
  }

  if (!Array.isArray(skeleton.installerTargetBuilderSkeleton?.builders) || skeleton.installerTargetBuilderSkeleton.builders.length < 7) {
    throw new Error(`Installer-target builder skeleton is missing ${PHASE_ID} builder declarations.`);
  }

  if (!Array.isArray(skeleton.installerBuilderOrchestration?.flows) || skeleton.installerBuilderOrchestration.flows.length < 3) {
    throw new Error(`Installer builder orchestration is missing ${PHASE_ID} orchestration declarations.`);
  }

  if (!Array.isArray(skeleton.installerChannelRouting?.routes) || skeleton.installerChannelRouting.routes.length < 3) {
    throw new Error(`Installer channel routing is missing ${PHASE_ID} routing declarations.`);
  }

  if (!Array.isArray(skeleton.channelPromotionEvidence?.promotions) || skeleton.channelPromotionEvidence.promotions.length < 2) {
    throw new Error(`Channel promotion evidence is missing ${PHASE_ID} promotion declarations.`);
  }

  if (!Array.isArray(skeleton.promotionApplyReadiness?.readiness) || skeleton.promotionApplyReadiness.readiness.length < 2) {
    throw new Error(`Promotion apply readiness is missing ${PHASE_ID} readiness declarations.`);
  }

  if (!Array.isArray(skeleton.promotionApplyManifests?.manifests) || skeleton.promotionApplyManifests.manifests.length < 2) {
    throw new Error(`Promotion apply manifests are missing ${PHASE_ID} manifest declarations.`);
  }

  if (!Array.isArray(skeleton.promotionExecutionCheckpoints?.checkpoints) || skeleton.promotionExecutionCheckpoints.checkpoints.length < 2) {
    throw new Error(`Promotion execution checkpoints are missing ${PHASE_ID} checkpoint declarations.`);
  }

  if (!Array.isArray(skeleton.promotionOperatorHandoffRails?.rails) || skeleton.promotionOperatorHandoffRails.rails.length < 2) {
    throw new Error(`Promotion operator handoff rails are missing ${PHASE_ID} handoff declarations.`);
  }

  if (!Array.isArray(skeleton.promotionStagedApplyLedgers?.ledgers) || skeleton.promotionStagedApplyLedgers.ledgers.length < 2) {
    throw new Error(`Promotion staged-apply ledgers are missing ${PHASE_ID} staged-apply declarations.`);
  }

  if (!Array.isArray(skeleton.promotionStagedApplyRunsheets?.runsheets) || skeleton.promotionStagedApplyRunsheets.runsheets.length < 2) {
    throw new Error(`Promotion staged-apply runsheets are missing ${PHASE_ID} runsheet declarations.`);
  }

  if (!Array.isArray(skeleton.promotionStagedApplyCommandSheets?.commandSheets) || skeleton.promotionStagedApplyCommandSheets.commandSheets.length < 2) {
    throw new Error(`Promotion staged-apply command sheets are missing ${PHASE_ID} command-sheet declarations.`);
  }

  if (!Array.isArray(skeleton.promotionStagedApplyConfirmationLedgers?.ledgers) || skeleton.promotionStagedApplyConfirmationLedgers.ledgers.length < 2) {
    throw new Error(`Promotion staged-apply confirmation ledgers are missing ${PHASE_ID} confirmation-ledger declarations.`);
  }

  if (!Array.isArray(skeleton.promotionStagedApplyCloseoutJournals?.journals) || skeleton.promotionStagedApplyCloseoutJournals.journals.length < 2) {
    throw new Error(`Promotion staged-apply closeout journals are missing ${PHASE_ID} closeout-journal declarations.`);
  }

  if (!Array.isArray(skeleton.promotionStagedApplySignoffSheets?.signoffSheets) || skeleton.promotionStagedApplySignoffSheets.signoffSheets.length < 2) {
    throw new Error(`Promotion staged-apply signoff sheets are missing ${PHASE_ID} signoff-sheet declarations.`);
  }

  if (!Array.isArray(skeleton.promotionStagedApplyReleaseDecisionRecords?.decisionRecords) || skeleton.promotionStagedApplyReleaseDecisionRecords.decisionRecords.length < 2) {
    throw new Error(`Promotion staged-apply release decision records are missing ${PHASE_ID} decision-record declarations.`);
  }

  if (!Array.isArray(skeleton.signingMetadata?.readiness) || skeleton.signingMetadata.readiness.length < 3) {
    throw new Error(`Signing metadata is missing ${PHASE_ID} readiness declarations.`);
  }

  if (!Array.isArray(skeleton.notarizationPlan?.platforms) || skeleton.notarizationPlan.platforms.length < 3) {
    throw new Error(`Notarization plan is missing ${PHASE_ID} platform declarations.`);
  }

  if (
    skeleton.signingPublishGatingHandshake?.canHandshake !== false ||
    skeleton.signingPublishGatingHandshake?.sealedBundleIntegrityContractPath !== "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json" ||
    skeleton.signingPublishGatingHandshake?.attestationVerificationPacksPath !== "release/ATTESTATION-VERIFICATION-PACKS.json" ||
    skeleton.signingPublishGatingHandshake?.attestationApplyAuditPacksPath !== "release/ATTESTATION-APPLY-AUDIT-PACKS.json" ||
    skeleton.signingPublishGatingHandshake?.attestationApplyExecutionPacketsPath !== "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json" ||
    skeleton.signingPublishGatingHandshake?.attestationOperatorWorklistsPath !== "release/ATTESTATION-OPERATOR-WORKLISTS.json" ||
    skeleton.signingPublishGatingHandshake?.attestationOperatorDispatchManifestsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json" ||
    skeleton.signingPublishGatingHandshake?.attestationOperatorDispatchReceiptsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json" ||
    skeleton.signingPublishGatingHandshake?.attestationOperatorReconciliationLedgersPath !== "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json" ||
    skeleton.signingPublishGatingHandshake?.attestationOperatorSettlementPacksPath !== "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json" ||
    skeleton.signingPublishGatingHandshake?.attestationOperatorApprovalExecutionEnvelopesPath !== "release/ATTESTATION-OPERATOR-APPROVAL-EXECUTION-ENVELOPES.json" ||
    skeleton.signingPublishGatingHandshake?.channelPromotionEvidencePath !== "release/CHANNEL-PROMOTION-EVIDENCE.json" ||
    skeleton.signingPublishGatingHandshake?.publishRollbackHandshakePath !== "release/PUBLISH-ROLLBACK-HANDSHAKE.json" ||
    skeleton.signingPublishGatingHandshake?.promotionStagedApplyRunsheetsPath !== "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json" ||
    skeleton.signingPublishGatingHandshake?.promotionStagedApplyConfirmationLedgersPath !== "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json" ||
    skeleton.signingPublishGatingHandshake?.promotionStagedApplyCloseoutJournalsPath !== "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json" ||
    skeleton.signingPublishGatingHandshake?.promotionStagedApplySignoffSheetsPath !== "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json" ||
    skeleton.signingPublishGatingHandshake?.promotionStagedApplyReleaseDecisionRecordsPath !== "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-RECORDS.json" ||
    skeleton.signingPublishGatingHandshake?.rollbackCutoverHandoffPlansPath !== "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json" ||
    skeleton.signingPublishGatingHandshake?.rollbackCutoverExecutionRecordsPath !== "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json" ||
    skeleton.signingPublishGatingHandshake?.rollbackCutoverOutcomeReportsPath !== "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json" ||
    skeleton.signingPublishGatingHandshake?.rollbackCutoverPublicationBundlesPath !== "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json" ||
    skeleton.signingPublishGatingHandshake?.rollbackCutoverPublicationRecoveryReceiptsPath !== "release/ROLLBACK-CUTOVER-PUBLICATION-RECOVERY-RECEIPTS.json" ||
    !Array.isArray(skeleton.signingPublishGatingHandshake?.stages) ||
    skeleton.signingPublishGatingHandshake.stages.length < 15 ||
    !Array.isArray(skeleton.signingPublishGatingHandshake?.acknowledgements) ||
    skeleton.signingPublishGatingHandshake.acknowledgements.length < 14
  ) {
    throw new Error(`Signing-publish gating handshake is missing ${PHASE_ID} handshake declarations.`);
  }

  if (
    skeleton.signingPublishPipeline?.sealedBundleIntegrityContractPath !== "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json" ||
    skeleton.signingPublishPipeline?.attestationVerificationPacksPath !== "release/ATTESTATION-VERIFICATION-PACKS.json" ||
    skeleton.signingPublishPipeline?.attestationApplyAuditPacksPath !== "release/ATTESTATION-APPLY-AUDIT-PACKS.json" ||
    skeleton.signingPublishPipeline?.attestationApplyExecutionPacketsPath !== "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json" ||
    skeleton.signingPublishPipeline?.attestationOperatorWorklistsPath !== "release/ATTESTATION-OPERATOR-WORKLISTS.json" ||
    skeleton.signingPublishPipeline?.attestationOperatorDispatchManifestsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json" ||
    skeleton.signingPublishPipeline?.attestationOperatorDispatchReceiptsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json" ||
    skeleton.signingPublishPipeline?.attestationOperatorReconciliationLedgersPath !== "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json" ||
    skeleton.signingPublishPipeline?.attestationOperatorSettlementPacksPath !== "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json" ||
    skeleton.signingPublishPipeline?.attestationOperatorApprovalExecutionEnvelopesPath !== "release/ATTESTATION-OPERATOR-APPROVAL-EXECUTION-ENVELOPES.json" ||
    skeleton.signingPublishPipeline?.gatingHandshakePath !== "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json" ||
    skeleton.signingPublishPipeline?.approvalBridgePath !== "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json" ||
    skeleton.signingPublishPipeline?.channelRoutingPath !== "release/INSTALLER-CHANNEL-ROUTING.json" ||
    skeleton.signingPublishPipeline?.channelPromotionEvidencePath !== "release/CHANNEL-PROMOTION-EVIDENCE.json" ||
    skeleton.signingPublishPipeline?.promotionApplyManifestsPath !== "release/PROMOTION-APPLY-MANIFESTS.json" ||
    skeleton.signingPublishPipeline?.promotionExecutionCheckpointsPath !== "release/PROMOTION-EXECUTION-CHECKPOINTS.json" ||
    skeleton.signingPublishPipeline?.promotionOperatorHandoffRailsPath !== "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json" ||
    skeleton.signingPublishPipeline?.promotionStagedApplyLedgersPath !== "release/PROMOTION-STAGED-APPLY-LEDGERS.json" ||
    skeleton.signingPublishPipeline?.promotionStagedApplyRunsheetsPath !== "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json" ||
    skeleton.signingPublishPipeline?.promotionStagedApplyConfirmationLedgersPath !== "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json" ||
    skeleton.signingPublishPipeline?.promotionStagedApplyCloseoutJournalsPath !== "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json" ||
    skeleton.signingPublishPipeline?.promotionStagedApplySignoffSheetsPath !== "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json" ||
    skeleton.signingPublishPipeline?.promotionStagedApplyReleaseDecisionRecordsPath !== "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-RECORDS.json" ||
    skeleton.signingPublishPipeline?.promotionHandshakePath !== "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json" ||
    skeleton.signingPublishPipeline?.publishRollbackHandshakePath !== "release/PUBLISH-ROLLBACK-HANDSHAKE.json" ||
    skeleton.signingPublishPipeline?.rollbackExecutionRehearsalLedgerPath !== "release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json" ||
    skeleton.signingPublishPipeline?.rollbackOperatorDrillbooksPath !== "release/ROLLBACK-OPERATOR-DRILLBOOKS.json" ||
    skeleton.signingPublishPipeline?.rollbackLiveReadinessContractsPath !== "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json" ||
    skeleton.signingPublishPipeline?.rollbackCutoverReadinessMapsPath !== "release/ROLLBACK-CUTOVER-READINESS-MAPS.json" ||
    skeleton.signingPublishPipeline?.rollbackCutoverHandoffPlansPath !== "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json" ||
    skeleton.signingPublishPipeline?.rollbackCutoverExecutionRecordsPath !== "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json" ||
    skeleton.signingPublishPipeline?.rollbackCutoverOutcomeReportsPath !== "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json" ||
    skeleton.signingPublishPipeline?.rollbackCutoverPublicationBundlesPath !== "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json" ||
    skeleton.signingPublishPipeline?.rollbackCutoverPublicationRecoveryReceiptsPath !== "release/ROLLBACK-CUTOVER-PUBLICATION-RECOVERY-RECEIPTS.json" ||
    !Array.isArray(skeleton.signingPublishPipeline?.stages) ||
    skeleton.signingPublishPipeline.stages.length < 27
  ) {
    throw new Error(`Signing & publish pipeline is missing ${PHASE_ID} pipeline declarations.`);
  }

  if (!Array.isArray(skeleton.signingPublishApprovalBridge?.bridge) || skeleton.signingPublishApprovalBridge.bridge.length < 9) {
    throw new Error(`Signing-publish approval bridge is missing ${PHASE_ID} bridge declarations.`);
  }

  if (
    skeleton.signingPublishPromotionHandshake?.channelRoutingPath !== "release/INSTALLER-CHANNEL-ROUTING.json" ||
    skeleton.signingPublishPromotionHandshake?.sealedBundleIntegrityContractPath !== "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json" ||
    skeleton.signingPublishPromotionHandshake?.channelPromotionEvidencePath !== "release/CHANNEL-PROMOTION-EVIDENCE.json" ||
    skeleton.signingPublishPromotionHandshake?.attestationApplyAuditPacksPath !== "release/ATTESTATION-APPLY-AUDIT-PACKS.json" ||
    skeleton.signingPublishPromotionHandshake?.attestationApplyExecutionPacketsPath !== "release/ATTESTATION-APPLY-EXECUTION-PACKETS.json" ||
    skeleton.signingPublishPromotionHandshake?.attestationOperatorWorklistsPath !== "release/ATTESTATION-OPERATOR-WORKLISTS.json" ||
    skeleton.signingPublishPromotionHandshake?.attestationOperatorDispatchManifestsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json" ||
    skeleton.signingPublishPromotionHandshake?.attestationOperatorDispatchReceiptsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json" ||
    skeleton.signingPublishPromotionHandshake?.attestationOperatorReconciliationLedgersPath !== "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json" ||
    skeleton.signingPublishPromotionHandshake?.attestationOperatorSettlementPacksPath !== "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json" ||
    skeleton.signingPublishPromotionHandshake?.attestationOperatorApprovalExecutionEnvelopesPath !== "release/ATTESTATION-OPERATOR-APPROVAL-EXECUTION-ENVELOPES.json" ||
    skeleton.signingPublishPromotionHandshake?.promotionApplyManifestsPath !== "release/PROMOTION-APPLY-MANIFESTS.json" ||
    skeleton.signingPublishPromotionHandshake?.promotionExecutionCheckpointsPath !== "release/PROMOTION-EXECUTION-CHECKPOINTS.json" ||
    skeleton.signingPublishPromotionHandshake?.promotionOperatorHandoffRailsPath !== "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json" ||
    skeleton.signingPublishPromotionHandshake?.promotionStagedApplyLedgersPath !== "release/PROMOTION-STAGED-APPLY-LEDGERS.json" ||
    skeleton.signingPublishPromotionHandshake?.promotionStagedApplyRunsheetsPath !== "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json" ||
    skeleton.signingPublishPromotionHandshake?.promotionStagedApplyConfirmationLedgersPath !== "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json" ||
    skeleton.signingPublishPromotionHandshake?.promotionStagedApplyCloseoutJournalsPath !== "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json" ||
    skeleton.signingPublishPromotionHandshake?.promotionStagedApplySignoffSheetsPath !== "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json" ||
    skeleton.signingPublishPromotionHandshake?.promotionStagedApplyReleaseDecisionRecordsPath !== "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-RECORDS.json" ||
    skeleton.signingPublishPromotionHandshake?.publishRollbackHandshakePath !== "release/PUBLISH-ROLLBACK-HANDSHAKE.json" ||
    skeleton.signingPublishPromotionHandshake?.rollbackCutoverHandoffPlansPath !== "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json" ||
    skeleton.signingPublishPromotionHandshake?.rollbackCutoverExecutionRecordsPath !== "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json" ||
    skeleton.signingPublishPromotionHandshake?.rollbackCutoverOutcomeReportsPath !== "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json" ||
    skeleton.signingPublishPromotionHandshake?.rollbackCutoverPublicationBundlesPath !== "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json" ||
    skeleton.signingPublishPromotionHandshake?.rollbackCutoverPublicationRecoveryReceiptsPath !== "release/ROLLBACK-CUTOVER-PUBLICATION-RECOVERY-RECEIPTS.json" ||
    !Array.isArray(skeleton.signingPublishPromotionHandshake?.stages) ||
    skeleton.signingPublishPromotionHandshake.stages.length < 14 ||
    !Array.isArray(skeleton.signingPublishPromotionHandshake?.acknowledgements) ||
    skeleton.signingPublishPromotionHandshake.acknowledgements.length < 14
  ) {
    throw new Error(`Signing-publish promotion handshake is missing ${PHASE_ID} promotion declarations.`);
  }

  if (
    skeleton.publishRollbackHandshake?.sealedBundleIntegrityContractPath !== "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json" ||
    skeleton.publishRollbackHandshake?.channelPromotionEvidencePath !== "release/CHANNEL-PROMOTION-EVIDENCE.json" ||
    skeleton.publishRollbackHandshake?.attestationOperatorDispatchManifestsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json" ||
    skeleton.publishRollbackHandshake?.attestationOperatorDispatchReceiptsPath !== "release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json" ||
    skeleton.publishRollbackHandshake?.attestationOperatorReconciliationLedgersPath !== "release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json" ||
    skeleton.publishRollbackHandshake?.attestationOperatorSettlementPacksPath !== "release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json" ||
    skeleton.publishRollbackHandshake?.attestationOperatorApprovalExecutionEnvelopesPath !== "release/ATTESTATION-OPERATOR-APPROVAL-EXECUTION-ENVELOPES.json" ||
    skeleton.publishRollbackHandshake?.promotionHandshakePath !== "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json" ||
    skeleton.publishRollbackHandshake?.promotionExecutionCheckpointsPath !== "release/PROMOTION-EXECUTION-CHECKPOINTS.json" ||
    skeleton.publishRollbackHandshake?.promotionOperatorHandoffRailsPath !== "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json" ||
    skeleton.publishRollbackHandshake?.promotionStagedApplyLedgersPath !== "release/PROMOTION-STAGED-APPLY-LEDGERS.json" ||
    skeleton.publishRollbackHandshake?.promotionStagedApplyRunsheetsPath !== "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json" ||
    skeleton.publishRollbackHandshake?.promotionStagedApplyConfirmationLedgersPath !== "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json" ||
    skeleton.publishRollbackHandshake?.promotionStagedApplyCloseoutJournalsPath !== "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json" ||
    skeleton.publishRollbackHandshake?.promotionStagedApplySignoffSheetsPath !== "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json" ||
    skeleton.publishRollbackHandshake?.promotionStagedApplyReleaseDecisionRecordsPath !== "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-RECORDS.json" ||
    skeleton.publishRollbackHandshake?.rollbackExecutionRehearsalLedgerPath !== "release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json" ||
    skeleton.publishRollbackHandshake?.rollbackOperatorDrillbooksPath !== "release/ROLLBACK-OPERATOR-DRILLBOOKS.json" ||
    skeleton.publishRollbackHandshake?.rollbackLiveReadinessContractsPath !== "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json" ||
    skeleton.publishRollbackHandshake?.rollbackCutoverReadinessMapsPath !== "release/ROLLBACK-CUTOVER-READINESS-MAPS.json" ||
    skeleton.publishRollbackHandshake?.rollbackCutoverHandoffPlansPath !== "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json" ||
    skeleton.publishRollbackHandshake?.rollbackCutoverExecutionRecordsPath !== "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json" ||
    skeleton.publishRollbackHandshake?.rollbackCutoverOutcomeReportsPath !== "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json" ||
    skeleton.publishRollbackHandshake?.rollbackCutoverPublicationBundlesPath !== "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json" ||
    skeleton.publishRollbackHandshake?.rollbackCutoverPublicationRecoveryReceiptsPath !== "release/ROLLBACK-CUTOVER-PUBLICATION-RECOVERY-RECEIPTS.json" ||
    !Array.isArray(skeleton.publishRollbackHandshake?.paths) ||
    skeleton.publishRollbackHandshake.paths.length < 2 ||
    !Array.isArray(skeleton.publishRollbackHandshake?.stages) ||
    skeleton.publishRollbackHandshake.stages.length < 12 ||
    !Array.isArray(skeleton.publishRollbackHandshake?.acknowledgements) ||
    skeleton.publishRollbackHandshake.acknowledgements.length < 12
  ) {
    throw new Error(`Publish rollback handshake is missing ${PHASE_ID} rollback declarations.`);
  }

  if (!Array.isArray(skeleton.rollbackRecoveryLedger?.ledgers) || skeleton.rollbackRecoveryLedger.ledgers.length < 2) {
    throw new Error(`Rollback recovery ledger is missing ${PHASE_ID} recovery declarations.`);
  }

  if (!Array.isArray(skeleton.rollbackExecutionRehearsalLedger?.rehearsals) || skeleton.rollbackExecutionRehearsalLedger.rehearsals.length < 2) {
    throw new Error(`Rollback execution rehearsal ledger is missing ${PHASE_ID} rehearsal declarations.`);
  }

  if (!Array.isArray(skeleton.rollbackOperatorDrillbooks?.drillbooks) || skeleton.rollbackOperatorDrillbooks.drillbooks.length < 2) {
    throw new Error(`Rollback operator drillbooks are missing ${PHASE_ID} operator declarations.`);
  }

  if (!Array.isArray(skeleton.rollbackLiveReadinessContracts?.contracts) || skeleton.rollbackLiveReadinessContracts.contracts.length < 2) {
    throw new Error(`Rollback live-readiness contracts are missing ${PHASE_ID} readiness declarations.`);
  }

  if (!Array.isArray(skeleton.rollbackCutoverReadinessMaps?.maps) || skeleton.rollbackCutoverReadinessMaps.maps.length < 2) {
    throw new Error(`Rollback cutover readiness maps are missing ${PHASE_ID} cutover declarations.`);
  }

  if (!Array.isArray(skeleton.rollbackCutoverHandoffPlans?.plans) || skeleton.rollbackCutoverHandoffPlans.plans.length < 2) {
    throw new Error(`Rollback cutover handoff plans are missing ${PHASE_ID} handoff declarations.`);
  }

  if (!Array.isArray(skeleton.rollbackCutoverExecutionChecklists?.checklists) || skeleton.rollbackCutoverExecutionChecklists.checklists.length < 2) {
    throw new Error(`Rollback cutover execution checklists are missing ${PHASE_ID} execution-checklist declarations.`);
  }

  if (!Array.isArray(skeleton.rollbackCutoverExecutionRecords?.records) || skeleton.rollbackCutoverExecutionRecords.records.length < 2) {
    throw new Error(`Rollback cutover execution records are missing ${PHASE_ID} execution-record declarations.`);
  }

  if (!Array.isArray(skeleton.rollbackCutoverOutcomeReports?.reports) || skeleton.rollbackCutoverOutcomeReports.reports.length < 2) {
    throw new Error(`Rollback cutover outcome reports are missing ${PHASE_ID} outcome-report declarations.`);
  }

  if (!Array.isArray(skeleton.rollbackCutoverPublicationBundles?.bundles) || skeleton.rollbackCutoverPublicationBundles.bundles.length < 2) {
    throw new Error(`Rollback cutover publication bundles are missing ${PHASE_ID} publication-bundle declarations.`);
  }

  if (!Array.isArray(skeleton.rollbackCutoverPublicationRecoveryReceipts?.receipts) || skeleton.rollbackCutoverPublicationRecoveryReceipts.receipts.length < 2) {
    throw new Error(`Rollback cutover publication recovery receipts are missing ${PHASE_ID} recovery-receipt declarations.`);
  }

  if (
    skeleton.releaseApprovalWorkflow?.mode !== "local-only-review" ||
    skeleton.releaseApprovalWorkflow?.gatingHandshakePath !== "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json" ||
    skeleton.releaseApprovalWorkflow?.approvalBridgePath !== "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json" ||
    skeleton.releaseApprovalWorkflow?.promotionHandshakePath !== "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json" ||
    !Array.isArray(skeleton.releaseApprovalWorkflow?.stages) ||
    skeleton.releaseApprovalWorkflow.stages.length < 8
  ) {
    throw new Error(`Release approval workflow is missing ${PHASE_ID} approval declarations.`);
  }

  if (!Array.isArray(skeleton.publishGates?.gates) || skeleton.publishGates.gates.length < 21) {
    throw new Error(`Publish gates are missing ${PHASE_ID} gating declarations.`);
  }

  if (!Array.isArray(skeleton.promotionGates?.promotions) || skeleton.promotionGates.promotions.length < 2) {
    throw new Error(`Promotion gates are missing ${PHASE_ID} promotion declarations.`);
  }

  if (
    !skeleton.packageReadme.includes(`${PHASE_ID} alpha-shell release skeleton`) ||
    !skeleton.packageReadme.includes("正式 installer 仍缺什么") ||
    !skeleton.packageReadme.includes("artifacts/renderer") ||
    !skeleton.packageReadme.includes("release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json") ||
    !skeleton.packageReadme.includes("release/INTEGRITY-ATTESTATION-EVIDENCE.json") ||
    !skeleton.packageReadme.includes("release/ATTESTATION-VERIFICATION-PACKS.json") ||
    !skeleton.packageReadme.includes("release/ATTESTATION-APPLY-AUDIT-PACKS.json") ||
    !skeleton.packageReadme.includes("release/ATTESTATION-APPLY-EXECUTION-PACKETS.json") ||
    !skeleton.packageReadme.includes("release/ATTESTATION-OPERATOR-WORKLISTS.json") ||
    !skeleton.packageReadme.includes("release/ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json") ||
    !skeleton.packageReadme.includes("release/ATTESTATION-OPERATOR-DISPATCH-PACKETS.json") ||
    !skeleton.packageReadme.includes("release/ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json") ||
    !skeleton.packageReadme.includes("release/ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json") ||
    !skeleton.packageReadme.includes("release/ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json") ||
    !skeleton.packageReadme.includes("release/ATTESTATION-OPERATOR-APPROVAL-EXECUTION-ENVELOPES.json") ||
    !skeleton.packageReadme.includes("release/CHANNEL-PROMOTION-EVIDENCE.json") ||
    !skeleton.packageReadme.includes("release/PROMOTION-APPLY-READINESS.json") ||
    !skeleton.packageReadme.includes("release/PROMOTION-APPLY-MANIFESTS.json") ||
    !skeleton.packageReadme.includes("release/PROMOTION-EXECUTION-CHECKPOINTS.json") ||
    !skeleton.packageReadme.includes("release/PROMOTION-OPERATOR-HANDOFF-RAILS.json") ||
    !skeleton.packageReadme.includes("release/PROMOTION-STAGED-APPLY-LEDGERS.json") ||
    !skeleton.packageReadme.includes("release/PROMOTION-STAGED-APPLY-RUNSHEETS.json") ||
    !skeleton.packageReadme.includes("release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json") ||
    !skeleton.packageReadme.includes("release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json") ||
    !skeleton.packageReadme.includes("release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json") ||
    !skeleton.packageReadme.includes("release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json") ||
    !skeleton.packageReadme.includes("release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-RECORDS.json") ||
    !skeleton.packageReadme.includes("release/PUBLISH-ROLLBACK-HANDSHAKE.json") ||
    !skeleton.packageReadme.includes("release/ROLLBACK-RECOVERY-LEDGER.json") ||
    !skeleton.packageReadme.includes("release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json") ||
    !skeleton.packageReadme.includes("release/ROLLBACK-OPERATOR-DRILLBOOKS.json") ||
    !skeleton.packageReadme.includes("release/ROLLBACK-LIVE-READINESS-CONTRACTS.json") ||
    !skeleton.packageReadme.includes("release/ROLLBACK-CUTOVER-READINESS-MAPS.json") ||
    !skeleton.packageReadme.includes("release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json") ||
    !skeleton.packageReadme.includes("release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json") ||
    !skeleton.packageReadme.includes("release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json") ||
    !skeleton.packageReadme.includes("release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json") ||
    !skeleton.packageReadme.includes("release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json") ||
    !skeleton.packageReadme.includes("release/ROLLBACK-CUTOVER-PUBLICATION-RECOVERY-RECEIPTS.json") ||
    !skeleton.packageReadme.includes("scripts/install-placeholder.cjs")
  ) {
    throw new Error(`Generated package README is missing required ${PHASE_ID} packaging markers.`);
  }

  if (
    !skeleton.releaseSummary?.includes(`${PHASE_TITLE} Release Summary`) ||
    !skeleton.releaseSummary?.includes(REVIEW_STAGE_ID)
  ) {
    throw new Error(`Generated release summary is missing required ${PHASE_ID} review markers.`);
  }

  if (
    !skeleton.releaseNotes?.includes(`${PHASE_TITLE} Release Notes`) ||
    !skeleton.releaseNotes?.includes("attestation operator approval execution envelopes") ||
    !skeleton.releaseNotes?.includes("promotion staged-apply release decision records") ||
    !skeleton.releaseNotes?.includes("rollback cutover publication recovery receipts") ||
    !Array.isArray(skeleton.releaseApprovalWorkflow?.stages) ||
    !skeleton.releaseApprovalWorkflow.stages.length ||
    !skeleton.signingPublishApprovalBridge?.bridge?.length ||
    !skeleton.signingPublishPromotionHandshake?.stages?.length ||
    !skeleton.signingPublishPipeline?.stages?.length ||
    !skeleton.publishGates?.gates?.length ||
    !skeleton.promotionGates?.promotions?.length
  ) {
    throw new Error(`Generated release notes or promotion gating are missing required ${PHASE_ID} markers.`);
  }

  if (
    !skeleton.releaseChecklist.includes("npm run package:alpha") ||
    !skeleton.releaseChecklist.includes("npm run release:plan") ||
    !skeleton.releaseChecklist.includes("SEALED-BUNDLE-INTEGRITY-CONTRACT.json") ||
    !skeleton.releaseChecklist.includes("INTEGRITY-ATTESTATION-EVIDENCE.json") ||
    !skeleton.releaseChecklist.includes("ATTESTATION-VERIFICATION-PACKS.json") ||
    !skeleton.releaseChecklist.includes("ATTESTATION-APPLY-AUDIT-PACKS.json") ||
    !skeleton.releaseChecklist.includes("ATTESTATION-APPLY-EXECUTION-PACKETS.json") ||
    !skeleton.releaseChecklist.includes("ATTESTATION-OPERATOR-WORKLISTS.json") ||
    !skeleton.releaseChecklist.includes("ATTESTATION-OPERATOR-DISPATCH-MANIFESTS.json") ||
    !skeleton.releaseChecklist.includes("ATTESTATION-OPERATOR-DISPATCH-PACKETS.json") ||
    !skeleton.releaseChecklist.includes("ATTESTATION-OPERATOR-DISPATCH-RECEIPTS.json") ||
    !skeleton.releaseChecklist.includes("ATTESTATION-OPERATOR-RECONCILIATION-LEDGERS.json") ||
    !skeleton.releaseChecklist.includes("ATTESTATION-OPERATOR-SETTLEMENT-PACKS.json") ||
    !skeleton.releaseChecklist.includes("ATTESTATION-OPERATOR-APPROVAL-EXECUTION-ENVELOPES.json") ||
    !skeleton.releaseChecklist.includes("CHANNEL-PROMOTION-EVIDENCE.json") ||
    !skeleton.releaseChecklist.includes("PROMOTION-APPLY-READINESS.json") ||
    !skeleton.releaseChecklist.includes("PROMOTION-APPLY-MANIFESTS.json") ||
    !skeleton.releaseChecklist.includes("PROMOTION-EXECUTION-CHECKPOINTS.json") ||
    !skeleton.releaseChecklist.includes("PROMOTION-OPERATOR-HANDOFF-RAILS.json") ||
    !skeleton.releaseChecklist.includes("PROMOTION-STAGED-APPLY-LEDGERS.json") ||
    !skeleton.releaseChecklist.includes("PROMOTION-STAGED-APPLY-RUNSHEETS.json") ||
    !skeleton.releaseChecklist.includes("PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json") ||
    !skeleton.releaseChecklist.includes("PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json") ||
    !skeleton.releaseChecklist.includes("PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json") ||
    !skeleton.releaseChecklist.includes("PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json") ||
    !skeleton.releaseChecklist.includes("PROMOTION-STAGED-APPLY-RELEASE-DECISION-RECORDS.json") ||
    !skeleton.releaseChecklist.includes("PUBLISH-ROLLBACK-HANDSHAKE.json") ||
    !skeleton.releaseChecklist.includes("ROLLBACK-RECOVERY-LEDGER.json") ||
    !skeleton.releaseChecklist.includes("ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json") ||
    !skeleton.releaseChecklist.includes("ROLLBACK-OPERATOR-DRILLBOOKS.json") ||
    !skeleton.releaseChecklist.includes("ROLLBACK-LIVE-READINESS-CONTRACTS.json") ||
    !skeleton.releaseChecklist.includes("ROLLBACK-CUTOVER-READINESS-MAPS.json") ||
    !skeleton.releaseChecklist.includes("ROLLBACK-CUTOVER-HANDOFF-PLANS.json") ||
    !skeleton.releaseChecklist.includes("ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json") ||
    !skeleton.releaseChecklist.includes("ROLLBACK-CUTOVER-EXECUTION-RECORDS.json") ||
    !skeleton.releaseChecklist.includes("ROLLBACK-CUTOVER-OUTCOME-REPORTS.json") ||
    !skeleton.releaseChecklist.includes("ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json") ||
    !skeleton.releaseChecklist.includes("ROLLBACK-CUTOVER-PUBLICATION-RECOVERY-RECEIPTS.json") ||
    !skeleton.releaseChecklist.includes("RELEASE-APPROVAL-WORKFLOW.json") ||
    !skeleton.releaseChecklist.includes("PROMOTION-GATES.json") ||
    !skeleton.releaseChecklist.includes("INSTALLER-PLACEHOLDER.json")
  ) {
    throw new Error(`Generated release checklist is missing required ${PHASE_ID} verification commands or metadata files.`);
  }

  return {
    phase: skeleton.releaseManifest.phase,
    artifactGroups: skeleton.releaseManifest.artifactGroups.length,
    artifactCount: skeleton.releaseManifest.artifacts.length,
    installerStatus: skeleton.installerPlaceholder.status
  };
}

async function main() {
  const renderer = await verifyRendererBuild();
  const rendererFocusedSlotUi = await verifyRendererFocusedSlotUi();
  const bridge = await verifyBridgeFallback();
  const runtime = await verifyElectronRuntime();
  const hostBoundary = await verifyHostBoundaryActions();
  const localControls = await verifyLocalConnectorControls();
  const releaseSkeleton = verifyReleaseSkeletonContract();
  const preflight = getPreflightSummary();

  console.log("OpenClaw Studio alpha smoke passed.");
  console.log(
    `Renderer: ${renderer.indexHtmlPath} (${renderer.assetCount} assets, ${PHASE_ID}-markers=${rendererFocusedSlotUi.markerCount})`
  );
  console.log(`Bridge fallback: ${bridge.appName} (${bridge.pageCount} pages)`);
  console.log(
    `Electron runtime: bridge=${runtime.bridge}, runtime=${runtime.runtime}, sessions=${runtime.sessions}, codexTasks=${runtime.codexTasks}, hostExecutor=${runtime.hostExecutorMode}, slots=${runtime.hostExecutorSlots}, handlers=${runtime.hostBridgeHandlers}, commands=${runtime.commandActions}, intents=${runtime.windowIntents}`
  );
  console.log(`Host boundary actions: ${hostBoundary.status}${hostBoundary.detail ? ` (${hostBoundary.detail})` : ""}`);
  console.log(
    `Local connector controls: ${localControls.status}${localControls.detail ? ` (${localControls.detail})` : ""}${
      typeof localControls.historyCount === "number" ? `, history=${localControls.historyCount}` : ""
    }`
  );
  console.log(
    `Release skeleton: phase=${releaseSkeleton.phase}, groups=${releaseSkeleton.artifactGroups}, artifacts=${releaseSkeleton.artifactCount}, installer=${releaseSkeleton.installerStatus}`
  );
  console.log(`Start preflight: build=${preflight.buildReady ? "ready" : "missing"}, electron=${preflight.electron.available ? "ready" : "missing"}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`OpenClaw Studio alpha smoke failed: ${message}`);
  process.exit(1);
});
