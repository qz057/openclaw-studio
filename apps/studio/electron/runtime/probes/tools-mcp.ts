import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type {
  StudioBoundaryLayer,
  StudioBoundarySummary,
  StudioDetailSection,
  StudioHostBridgeSimulatedOutcome,
  StudioHostBridgeState,
  StudioHostBridgeSlotChannel,
  StudioHostBridgeSlotHandler,
  StudioHostContractShape,
  StudioHostExecutorState,
  StudioHostFailureCase,
  StudioHostLifecycleStage,
  StudioHostLifecycleStageId,
  StudioHostMutationHandoffContract,
  StudioHostMutationIntent,
  StudioHostMutationPreview,
  StudioHostMutationSlot,
  StudioHostPreviewHandoff,
  StudioHostPreviewRollbackDisposition,
  StudioLinkedNote,
  StudioHostRollbackContract,
  StudioRuntimeAction,
  StudioRuntimeActionExecution,
  StudioRuntimeActionResult,
  StudioRuntimeDetail
} from "@openclaw/shared";
import { createStudioHostTraceState, createStudioReleaseApprovalPipeline, studioHostBridgeSlotChannels } from "@openclaw/shared";
import {
  buildRuntimePermissionMatrix,
  buildRuntimeRuleMatchLines,
  formatRuntimeCommandAssessment
} from "./runtime-command-policy";
import { getToolsMcpAction, listToolsMcpActions } from "./tools-mcp-actions";

const homeDirectory = os.homedir();
const openclawRoot = path.join(homeDirectory, ".openclaw");
const openclawConfigPath = path.join(openclawRoot, "openclaw.json");
const codexRoot = path.join(homeDirectory, ".codex");
const codexConfigPath = path.join(codexRoot, "config.toml");
const codexAuthPath = path.join(codexRoot, "auth.json");
const codexSessionsRoot = path.join(codexRoot, "sessions");
const codexShellSnapshotsRoot = path.join(codexRoot, "shell_snapshots");
const codexPluginCacheRoot = path.join(codexRoot, "plugins", "cache", "openai-curated");
const codexPluginTempRepoRoot = path.join(codexRoot, ".tmp", "plugins", ".git");
const workspaceToolingRoot = path.join(openclawRoot, "workspace", ".tooling");
const playwrightRunnerRoot = path.join(workspaceToolingRoot, "playwright-runner");
const hooksRoot = path.join(openclawRoot, "workspace", "hooks");
const knownMcpRoots = [
  path.join(codexRoot, "mcp"),
  path.join(codexRoot, "mcp.json"),
  path.join(openclawRoot, "mcp"),
  path.join(openclawRoot, "workspace", ".mcp"),
  path.join(openclawRoot, "workspace", "mcp")
] as const;

interface OpenClawConfig {
  tools?: {
    profile?: string;
    alsoAllow?: string[];
    exec?: {
      security?: string;
      ask?: string;
    };
    web?: {
      search?: {
        enabled?: boolean;
        provider?: string;
      };
      fetch?: {
        enabled?: boolean;
      };
    };
  };
  hooks?: {
    internal?: {
      enabled?: boolean;
      entries?: Record<string, { enabled?: boolean }>;
    };
  };
  plugins?: {
    allow?: string[];
    load?: {
      paths?: string[];
    };
    entries?: Record<string, { enabled?: boolean }>;
    installs?: Record<
      string,
      {
        installPath?: string;
        source?: string;
        version?: string;
        resolvedName?: string;
        resolvedSpec?: string;
      }
    >;
  };
}

interface ToolingPackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
}

export interface LiveToolsMcpProbe {
  source: "live" | "mock";
  openclawConfigPath: string;
  openclawToolProfile: string | null;
  openclawAlsoAllow: string[];
  execSecurity: string | null;
  execAsk: string | null;
  webSearchEnabled: boolean;
  webSearchProvider: string | null;
  webFetchEnabled: boolean;
  pluginAllowCount: number;
  pluginAllowIds: string[];
  pluginEntryCount: number;
  pluginEntryIds: string[];
  pluginInstallCount: number;
  pluginInstallIds: string[];
  pluginLoadPaths: string[];
  codexConfigPath: string;
  codexConfigPresent: boolean;
  codexAuthPresent: boolean;
  codexSessionsPresent: boolean;
  codexShellSnapshotsPresent: boolean;
  codexPluginCachePresent: boolean;
  codexPluginTempRepoPresent: boolean;
  toolingRoot: string;
  toolingRootPresent: boolean;
  playwrightRunnerPresent: boolean;
  hookCount: number;
  hookNames: string[];
  mcpRootsScanned: string[];
  discoveredMcpRoots: string[];
}

type LocalRootSelectionStatus = "idle" | "selected" | "blocked";
type LocalBridgeStageStatus = "idle" | "staged" | "partial" | "blocked";
type LocalConnectorActivationStatus = "idle" | "active" | "prepared" | "blocked";
type LocalLaneApplyStatus = "idle" | "applied" | "partial" | "blocked";

interface LocalRootSelectionState {
  status: LocalRootSelectionStatus;
  path: string | null;
  mode: string;
  executedAt: string | null;
}

interface LocalBridgeStageState {
  status: LocalBridgeStageStatus;
  sourceOrder: string[];
  executedAt: string | null;
}

interface LocalConnectorActivationState {
  status: LocalConnectorActivationStatus;
  label: string | null;
  mode: string;
  executedAt: string | null;
}

interface LocalLaneApplyState {
  status: LocalLaneApplyStatus;
  verdict: string | null;
  rootOverlay: string | null;
  sourceOrder: string[];
  executedAt: string | null;
}

interface LocalControlHistoryEntry {
  id: string;
  itemId: string;
  actionId: string;
  label: string;
  status: string;
  target: string;
  summary: string;
  executedAt: string;
}

export interface ToolsMcpLocalControlSession {
  startedAt: string;
  updatedAt: string;
  executionCount: number;
  rootSelection: LocalRootSelectionState;
  bridgeStage: LocalBridgeStageState;
  connectorActivation: LocalConnectorActivationState;
  laneApply: LocalLaneApplyState;
  history: LocalControlHistoryEntry[];
}

function createIdleRootSelectionState(): LocalRootSelectionState {
  return {
    status: "idle",
    path: null,
    mode: "unresolved",
    executedAt: null
  };
}

function createIdleBridgeStageState(): LocalBridgeStageState {
  return {
    status: "idle",
    sourceOrder: [],
    executedAt: null
  };
}

function createIdleConnectorActivationState(): LocalConnectorActivationState {
  return {
    status: "idle",
    label: null,
    mode: "unresolved",
    executedAt: null
  };
}

function createIdleLaneApplyState(): LocalLaneApplyState {
  return {
    status: "idle",
    verdict: null,
    rootOverlay: null,
    sourceOrder: [],
    executedAt: null
  };
}

export function createToolsMcpLocalControlSession(): ToolsMcpLocalControlSession {
  const createdAt = new Date().toISOString();

  return {
    startedAt: createdAt,
    updatedAt: createdAt,
    executionCount: 0,
    rootSelection: createIdleRootSelectionState(),
    bridgeStage: createIdleBridgeStageState(),
    connectorActivation: createIdleConnectorActivationState(),
    laneApply: createIdleLaneApplyState(),
    history: []
  };
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function readTextFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

async function listDirectories(rootDirectory: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(rootDirectory, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  } catch {
    return [];
  }
}

function shortenHomePath(rawPath: string | null | undefined): string {
  if (!rawPath) {
    return "Unavailable";
  }

  return rawPath.startsWith(homeDirectory) ? rawPath.replace(homeDirectory, "~") : rawPath;
}

function formatPresence(value: boolean): string {
  return value ? "present" : "missing";
}

function formatBoundaryLayerLabel(layer: StudioBoundaryLayer): string {
  switch (layer) {
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

function resolvePreconditionState(
  ready: boolean,
  partial = false
): StudioBoundarySummary["requiredPreconditions"][number]["state"] {
  if (ready) {
    return "met";
  }

  if (partial) {
    return "partial";
  }

  return "missing";
}

interface BoundarySummaryInput {
  id: string;
  title: string;
  summary: string;
  currentLayer: StudioBoundarySummary["currentLayer"];
  nextLayer: StudioBoundarySummary["nextLayer"];
  tone: StudioBoundarySummary["tone"];
  policy: StudioBoundarySummary["policy"];
  progressionDetails: {
    localOnly: string;
    previewHost: string;
    withheld: string;
    futureExecutor: string;
  };
  capabilities: StudioBoundarySummary["capabilities"];
  blockedReasons: StudioBoundarySummary["blockedReasons"];
  requiredPreconditions: StudioBoundarySummary["requiredPreconditions"];
  withheldExecutionPlan: StudioBoundarySummary["withheldExecutionPlan"];
  futureExecutorSlots: StudioBoundarySummary["futureExecutorSlots"];
  hostExecutor: StudioBoundarySummary["hostExecutor"];
}

function createBoundaryProgression(
  currentLayer: StudioBoundarySummary["currentLayer"],
  details: BoundarySummaryInput["progressionDetails"]
): StudioBoundarySummary["progression"] {
  return [
    {
      id: "layer-local-only",
      layer: "local-only",
      label: "Local-only",
      status: currentLayer === "local-only" ? "active" : "available",
      detail: details.localOnly
    },
    {
      id: "layer-preview-host",
      layer: "preview-host",
      label: "Preview-host",
      status: currentLayer === "preview-host" ? "active" : "available",
      detail: details.previewHost
    },
    {
      id: "layer-withheld",
      layer: "withheld",
      label: "Withheld",
      status: currentLayer === "withheld" ? "active" : "blocked",
      detail: details.withheld
    },
    {
      id: "layer-future-executor",
      layer: "future-executor",
      label: "Future executor",
      status: currentLayer === "future-executor" ? "active" : "future",
      detail: details.futureExecutor
    }
  ];
}

function createBoundarySummary(input: BoundarySummaryInput): StudioBoundarySummary {
  return {
    id: input.id,
    title: input.title,
    summary: input.summary,
    currentLayer: input.currentLayer,
    nextLayer: input.nextLayer,
    hostState: "withheld",
    tone: input.tone,
    policy: input.policy,
    progression: createBoundaryProgression(input.currentLayer, input.progressionDetails),
    capabilities: input.capabilities,
    blockedReasons: input.blockedReasons,
    requiredPreconditions: input.requiredPreconditions,
    withheldExecutionPlan: input.withheldExecutionPlan,
    futureExecutorSlots: input.futureExecutorSlots,
    hostExecutor: input.hostExecutor
  };
}

function createHandoffShape(title: string, summary: string, fields: StudioHostContractShape["fields"]): StudioHostContractShape {
  return {
    title,
    summary,
    fields
  };
}

function createHostFailureTaxonomy(
  preferredRootTarget: ReturnType<typeof getPreferredRootTarget>,
  attachSourceOrder: string[],
  activationTarget: ReturnType<typeof getConnectorActivationTarget>
): StudioHostFailureCase[] {
  return [
    {
      code: "policy-disabled",
      label: "Policy disabled",
      disposition: "blocked",
      stage: "global",
      detail: "The current shell policy keeps all host executor slots disabled."
    },
    {
      code: "approval-missing",
      label: "Approval missing",
      disposition: "blocked",
      stage: "request-approval",
      detail: "A typed approval result is required before any host slot could run."
    },
    {
      code: "approval-denied",
      label: "Approval denied",
      disposition: "abort",
      stage: "request-approval",
      detail: "A future approval gate can deny the mutation before handoff."
    },
    {
      code: "approval-expired",
      label: "Approval expired",
      disposition: "abort",
      stage: "request-approval",
      detail: "Approval scope could expire between preview and handoff."
    },
    {
      code: "precondition-missing",
      label: "Precondition missing",
      disposition: "blocked",
      stage: "collect-context",
      detail:
        preferredRootTarget.path !== null || attachSourceOrder.length > 0 || activationTarget.mode !== "unresolved"
          ? "Some runtime inputs exist, but the executor contract still treats missing targets, source order, or activation data as a hard block."
          : "No host-ready target, source order, or activation target is currently resolved."
    },
    {
      code: "ipc-slot-unavailable",
      label: "IPC slot unavailable",
      disposition: "blocked",
      stage: "handoff-slot",
      detail: "The future Electron IPC slots are typed but remain default-disabled."
    },
    {
      code: "handoff-invalid",
      label: "Handoff invalid",
      disposition: "abort",
      stage: "handoff-slot",
      detail: "A future executor would abort if payload, approval, audit, or rollback fields are incomplete."
    },
    {
      code: "host-aborted",
      label: "Host aborted",
      disposition: "abort",
      stage: "mutate-host",
      detail: "A future host executor may stop before completion without applying the full mutation."
    },
    {
      code: "partial-apply",
      label: "Partial apply",
      disposition: "partial-apply",
      stage: "mutate-host",
      detail: "A partial bridge attach, activation, or apply would require rollback-aware recovery."
    },
    {
      code: "rollback-required",
      label: "Rollback required",
      disposition: "rollback",
      stage: "rollback-host",
      detail: "Failure or abort after partial host mutation must trigger rollback."
    },
    {
      code: "rollback-incomplete",
      label: "Rollback incomplete",
      disposition: "rollback",
      stage: "rollback-host",
      detail: "Rollback itself can fail and must be represented as a first-class outcome."
    }
  ];
}

function createHostLifecycleStages(
  preferredRootTarget: ReturnType<typeof getPreferredRootTarget>,
  attachSourceOrder: string[],
  activationTarget: ReturnType<typeof getConnectorActivationTarget>,
  rootOverlay: string | null
): StudioHostLifecycleStage[] {
  return [
    {
      id: "lifecycle-context",
      stage: "collect-context",
      label: "Collect context",
      state:
        preferredRootTarget.path !== null || attachSourceOrder.length > 0 || activationTarget.mode !== "unresolved" || Boolean(rootOverlay)
          ? "ready"
          : "planned",
      detail:
        preferredRootTarget.path !== null || attachSourceOrder.length > 0 || activationTarget.mode !== "unresolved" || Boolean(rootOverlay)
          ? "Preview-host already assembles target, source order, blockers, and rollback context without mutating the host."
          : "Context assembly is typed, but the current runtime view still lacks enough inputs for a meaningful host handoff."
    },
    {
      id: "lifecycle-approval",
      stage: "request-approval",
      label: "Request approval",
      state: "withheld",
      detail: "Approval request/result shapes exist, but no live grant path is enabled."
    },
    {
      id: "lifecycle-audit",
      stage: "write-audit",
      label: "Write audit seed",
      state: "planned",
      detail: "Audit metadata is now part of the contract before any future host mutation slot."
    },
    {
      id: "lifecycle-handoff",
      stage: "handoff-slot",
      label: "Handoff to IPC slot",
      state: "planned",
      detail: "Typed payload/result contracts exist for each future executor slot, but the slots remain disabled."
    },
    {
      id: "lifecycle-mutate",
      stage: "mutate-host",
      label: "Mutate host",
      state: "withheld",
      detail: "Bridge attach, connector activation, and lane apply remain blocked behind policy."
    },
    {
      id: "lifecycle-verify",
      stage: "verify-host",
      label: "Verify host",
      state: "future",
      detail: "A later executor would verify bridge, runtime, lifecycle, and config results after mutation."
    },
    {
      id: "lifecycle-rollback",
      stage: "rollback-host",
      label: "Rollback host",
      state: "future",
      detail: "Rollback is explicitly modeled for failure, abort, and partial-apply outcomes."
    }
  ];
}

function createHostRollbackContract(
  attachSourceOrder: string[],
  activationTarget: ReturnType<typeof getConnectorActivationTarget>,
  rootOverlay: string | null
): StudioHostRollbackContract {
  return {
    status: "planned",
    summary: "Rollback now has explicit stages and required context instead of remaining an implied future concern.",
    context: createHandoffShape("Rollback context", "Rollback requires enough typed state to detach, deactivate, restore, and verify safely.", [
      { id: "rollback-request-id", label: "Request id", required: true, detail: "Mutation request that must be unwound." },
      { id: "rollback-slot-id", label: "Slot id", required: true, detail: "The specific executor slot responsible for the partial host state." },
      {
        id: "rollback-root-overlay",
        label: "Root overlay",
        required: false,
        detail: rootOverlay ? `Current overlay ${shortenHomePath(rootOverlay)} would be included in rollback context.` : "No root overlay is currently resolved."
      },
      {
        id: "rollback-source-order",
        label: "Bridge source order",
        required: false,
        detail: attachSourceOrder.length > 0 ? attachSourceOrder.join(" -> ") : "No bridge source order is currently resolved."
      },
      {
        id: "rollback-activation-target",
        label: "Activation target",
        required: false,
        detail: `${activationTarget.label} (${activationTarget.mode})`
      },
      {
        id: "rollback-checkpoint",
        label: "Last safe checkpoint",
        required: true,
        detail: "A future executor would need a checkpoint reference before mutating the host."
      }
    ]),
    stages: [
      {
        id: "rollback-capture",
        label: "Capture checkpoint",
        state: "planned",
        detail: "Capture the last safe bridge/runtime/config checkpoint before slot execution."
      },
      {
        id: "rollback-detach",
        label: "Detach bridge",
        state: "future",
        detail: "Unwind partial root connect or bridge attach state."
      },
      {
        id: "rollback-deactivate",
        label: "Deactivate connector",
        state: "future",
        detail: "Stop or reconcile connector lifecycle if activation partially succeeded."
      },
      {
        id: "rollback-restore",
        label: "Restore runtime overlay",
        state: "future",
        detail: "Restore root overlay, lane payload, and runtime metadata from the last safe checkpoint."
      },
      {
        id: "rollback-verify",
        label: "Verify recovery",
        state: "future",
        detail: "Confirm the host returned to a coherent state after rollback."
      }
    ]
  };
}

function createHostMutationSlots(
  handoffVersion: string,
  preferredRootTarget: ReturnType<typeof getPreferredRootTarget>,
  attachSourceOrder: string[],
  activationTarget: ReturnType<typeof getConnectorActivationTarget>,
  rootOverlay: string | null
  ): StudioHostMutationSlot[] {
  function createSlot(
    id: string,
    intent: StudioHostMutationIntent,
    label: string,
    channel: StudioHostBridgeSlotChannel,
    detail: string,
    payloadType: string,
    resultType: string,
    payloadFields: StudioHostContractShape["fields"],
    resultFields: StudioHostContractShape["fields"]
  ): StudioHostMutationSlot {
    return {
      id,
      intent,
      label,
      channel,
      state: "withheld",
      defaultEnabled: false,
      detail,
      handoff: {
        version: handoffVersion,
        payloadType,
        resultType,
        payload: createHandoffShape(
          `${label} payload`,
          `Typed payload for ${label.toLowerCase()} now maps preview-host state into the default-disabled phase25 bridge skeleton.`,
          payloadFields
        ),
        result: createHandoffShape(
          `${label} result`,
          `Typed result for ${label.toLowerCase()} now links audit correlation, failure taxonomy, rollback disposition, and simulated outcome trace across the disabled phase25 bridge stub.`,
          resultFields
        )
      }
    };
  }

  const commonResultFields: StudioHostContractShape["fields"] = [
    { id: "result-preview-id", label: "Preview id", required: true, detail: "Preview identifier echoed by the disabled slot stub." },
    { id: "result-request-id", label: "Request id", required: true, detail: "Mutation request identifier echoed by the future slot." },
    { id: "result-status", label: "Status", required: true, detail: "Blocked, aborted, partial-apply, failed, or rolled-back." },
    { id: "result-stage", label: "Lifecycle stage", required: true, detail: "Final lifecycle stage reached by the slot." },
    { id: "result-audit-id", label: "Audit event id", required: true, detail: "Audit correlation id emitted by the executor." },
    { id: "result-failure-code", label: "Failure code", required: false, detail: "Structured failure taxonomy code when not successful." },
    {
      id: "result-failure-disposition",
      label: "Failure disposition",
      required: false,
      detail: "Blocked, abort, partial-apply, or rollback linkage for the placeholder outcome."
    },
    {
      id: "result-rollback-disposition",
      label: "Rollback disposition",
      required: false,
      detail: "Whether rollback stayed unnecessary, available, required, or incomplete."
    }
  ];

  return [
    createSlot(
      "slot-root-connect",
      "root-connect",
      "Root connect IPC slot",
      studioHostBridgeSlotChannels.rootConnect,
      preferredRootTarget.path !== null
        ? `Reserved for dedicated-root connect using ${shortenHomePath(preferredRootTarget.path)} (${preferredRootTarget.mode}).`
        : "Reserved for dedicated-root connect, but no root target is currently resolved.",
      "StudioHostRootConnectPayload",
      "StudioHostRootConnectResult",
      [
        { id: "payload-preview-id", label: "Preview id", required: true, detail: "Host preview identifier mapped into the slot handoff." },
        { id: "payload-request-id", label: "Request id", required: true, detail: "Stable host mutation request identifier." },
        {
          id: "payload-target",
          label: "Resolved target",
          required: true,
          detail:
            preferredRootTarget.path !== null
              ? `${shortenHomePath(preferredRootTarget.path)} (${preferredRootTarget.mode})`
              : "No dedicated target is currently resolved."
        },
        { id: "payload-approval", label: "Approval token", required: true, detail: "Typed approval result required before mutation." },
        { id: "payload-audit-seed", label: "Audit seed", required: true, detail: "Pre-execution audit metadata attached to the handoff." },
        { id: "payload-rollback", label: "Rollback context", required: true, detail: "Detach-aware rollback context for partial connect state." }
      ],
      commonResultFields
    ),
    createSlot(
      "slot-bridge-attach",
      "bridge-attach",
      "Bridge attach IPC slot",
      studioHostBridgeSlotChannels.bridgeAttach,
      attachSourceOrder.length > 0
        ? `Reserved for attach from ${attachSourceOrder.join(" -> ")}.`
        : "Reserved for attach, but no bridge source order is currently resolved.",
      "StudioHostBridgeAttachPayload",
      "StudioHostBridgeAttachResult",
      [
        { id: "payload-preview-id", label: "Preview id", required: true, detail: "Host preview identifier mapped into the slot handoff." },
        { id: "payload-request-id", label: "Request id", required: true, detail: "Stable host mutation request identifier." },
        {
          id: "payload-source-order",
          label: "Source order",
          required: true,
          detail: attachSourceOrder.length > 0 ? attachSourceOrder.join(" -> ") : "No attach source order is currently resolved."
        },
        {
          id: "payload-root-overlay",
          label: "Root overlay",
          required: false,
          detail: rootOverlay ? shortenHomePath(rootOverlay) : "No root overlay is currently resolved."
        },
        { id: "payload-approval", label: "Approval token", required: true, detail: "Typed approval result required before mutation." },
        { id: "payload-audit-seed", label: "Audit seed", required: true, detail: "Pre-execution audit metadata attached to the handoff." },
        { id: "payload-rollback", label: "Rollback context", required: true, detail: "Detach-aware rollback context for partial bridge state." }
      ],
      commonResultFields
    ),
    createSlot(
      "slot-connector-activate",
      "connector-activate",
      "Connector activate IPC slot",
      studioHostBridgeSlotChannels.connectorActivate,
      `Reserved for lifecycle-aware activation of ${activationTarget.label} (${activationTarget.mode}).`,
      "StudioHostConnectorActivatePayload",
      "StudioHostConnectorActivateResult",
      [
        { id: "payload-preview-id", label: "Preview id", required: true, detail: "Host preview identifier mapped into the slot handoff." },
        { id: "payload-request-id", label: "Request id", required: true, detail: "Stable host mutation request identifier." },
        { id: "payload-target", label: "Activation target", required: true, detail: `${activationTarget.label} (${activationTarget.mode})` },
        {
          id: "payload-source-order",
          label: "Bridge source order",
          required: true,
          detail: attachSourceOrder.length > 0 ? attachSourceOrder.join(" -> ") : "No attach source order is currently resolved."
        },
        { id: "payload-approval", label: "Approval token", required: true, detail: "Typed approval result required before mutation." },
        { id: "payload-audit-seed", label: "Audit seed", required: true, detail: "Pre-execution audit metadata attached to the handoff." },
        { id: "payload-rollback", label: "Rollback context", required: true, detail: "Lifecycle rollback context for partial activation." }
      ],
      commonResultFields
    ),
    createSlot(
      "slot-lane-apply",
      "lane-apply",
      "Lane apply IPC slot",
      studioHostBridgeSlotChannels.laneApply,
      rootOverlay
        ? `Reserved for rollback-aware lane apply using root overlay ${shortenHomePath(rootOverlay)}.`
        : "Reserved for rollback-aware lane apply, but no root overlay is currently resolved.",
      "StudioHostLaneApplyPayload",
      "StudioHostLaneApplyResult",
      [
        { id: "payload-preview-id", label: "Preview id", required: true, detail: "Host preview identifier mapped into the slot handoff." },
        { id: "payload-request-id", label: "Request id", required: true, detail: "Stable host mutation request identifier." },
        {
          id: "payload-root-overlay",
          label: "Root overlay",
          required: true,
          detail: rootOverlay ? shortenHomePath(rootOverlay) : "No root overlay is currently resolved."
        },
        {
          id: "payload-source-order",
          label: "Source order",
          required: true,
          detail: attachSourceOrder.length > 0 ? attachSourceOrder.join(" -> ") : "No attach source order is currently resolved."
        },
        { id: "payload-approval", label: "Approval token", required: true, detail: "Typed approval result required before mutation." },
        { id: "payload-audit-seed", label: "Audit seed", required: true, detail: "Pre-execution audit metadata attached to the handoff." },
        { id: "payload-rollback", label: "Rollback context", required: true, detail: "Checkpoint/restore context for partial apply." }
      ],
      commonResultFields
    )
  ];
}

function createHostBridgeSimulatedOutcomes(slot: StudioHostMutationSlot): StudioHostBridgeSimulatedOutcome[] {
  switch (slot.id) {
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
          summary: "The disabled root-connect slot stops at approval and returns a blocked placeholder outcome."
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
          summary: "The disabled bridge-attach slot simulates a handoff abort instead of attempting any live attach."
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
          summary: "The disabled connector-activate slot simulates a partial apply so rollback expectations stay explicit."
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
          summary: "The disabled lane-apply slot simulates a rollback-required result instead of touching any host lane."
        },
        {
          id: "outcome-lane-apply-rollback-incomplete",
          label: "Rollback incomplete placeholder",
          status: "rollback-incomplete",
          stage: "rollback-host",
          failureCode: "rollback-incomplete",
          failureDisposition: "rollback",
          rollbackDisposition: "incomplete",
          summary: "Rollback remains simulated only, so the follow-up placeholder outcome stays rollback-incomplete."
        }
      ];
    default:
      return [];
  }
}

function createHostBridgeState(mutationSlots: StudioHostMutationSlot[]): StudioHostBridgeState {
  const validators = mutationSlots.map((slot) => ({
    id: `validator-${slot.id}`,
    slotId: slot.id,
    label: `${slot.label} validator`,
    state: "registered" as const,
    detail: `Checks ${slot.handoff.payloadType} -> ${slot.handoff.resultType} before the disabled placeholder stub returns.`,
    requiredPayloadFieldIds: slot.handoff.payload.fields.filter((field) => field.required).map((field) => field.id),
    requiredResultFieldIds: slot.handoff.result.fields.filter((field) => field.required).map((field) => field.id)
  }));
  const slotHandlers = mutationSlots.map((slot) => ({
    id: `handler-${slot.id}`,
    slotId: slot.id,
    label: `${slot.label} placeholder handler`,
    channel: slot.channel,
    state: "registered" as const,
    defaultEnabled: false,
    detail: `Electron bridge registers a default-disabled placeholder handler for ${slot.intent}.`,
    simulatedOutcomes: createHostBridgeSimulatedOutcomes(slot)
  }));

  return {
    id: "host-bridge-phase27",
    title: "Disabled host bridge skeleton",
    summary:
      "Phase29 registers preview-to-slot mapping, typed validators, disabled Electron slot handlers, detached workspace workflows, readiness-aware window intents, and dock/inspector-friendly placeholder failure paths while host-side execution remains off.",
    mode: "disabled",
    defaultEnabled: false,
    previewHandoff: "placeholder",
    validators,
    slotHandlers,
    trace: createStudioHostTraceState(mutationSlots, slotHandlers, validators)
  };
}

export function buildToolsMcpHostExecutorState(
  probe: LiveToolsMcpProbe,
  controlSession: ToolsMcpLocalControlSession
): StudioHostExecutorState {
  const cachedCuratedPlugins = probe.codexPluginCachePresent ? ["curated-cache"] : [];
  const attachSourceOrder =
    controlSession.bridgeStage.sourceOrder.length > 0 ? controlSession.bridgeStage.sourceOrder : buildAttachSourceOrder(probe, cachedCuratedPlugins);
  const preferredRootTarget = getPreferredRootTarget(probe);
  const activationTarget =
    controlSession.rootSelection.status === "selected" && controlSession.rootSelection.path
      ? {
          label: shortenHomePath(controlSession.rootSelection.path),
          mode: "Studio-local selected root"
        }
      : getConnectorActivationTarget(probe, cachedCuratedPlugins);
  const rootOverlay = controlSession.rootSelection.path ?? preferredRootTarget.path;
  const handoffContractVersion = "phase29-windowing-v8";
  const lifecycle = createHostLifecycleStages(preferredRootTarget, attachSourceOrder, activationTarget, rootOverlay);
  const rollback = createHostRollbackContract(attachSourceOrder, activationTarget, rootOverlay);
  const failureTaxonomy = createHostFailureTaxonomy(preferredRootTarget, attachSourceOrder, activationTarget);
  const mutationSlots = createHostMutationSlots(
    handoffContractVersion,
    preferredRootTarget,
    attachSourceOrder,
    activationTarget,
    rootOverlay
  );
  const bridge = createHostBridgeState(mutationSlots);
  const hostExecutor: StudioHostExecutorState = {
    id: "host-executor-phase27",
    title: "Disabled host bridge skeleton",
    summary:
      "Phase55 lowers the executor contract into a default-disabled bridge skeleton with preview-to-slot placeholder handoff, review-only release approval pipeline visibility, dock/inspector linkage, simulated outcomes, and richer approval/audit/rollback traceability while keeping all host mutation disabled.",
    mode: "disabled",
    transport: "electron-ipc-skeleton",
    defaultEnabled: false,
    handoffContractVersion,
    bridge,
    intents: [
      {
        id: "intent-root-connect",
        intent: "root-connect",
        label: "Root connect",
        detail:
          preferredRootTarget.path !== null
            ? `Would target ${shortenHomePath(preferredRootTarget.path)} (${preferredRootTarget.mode}) once enabled.`
            : "Would require a dedicated root target before any live connect is possible.",
        protectedSurfaces: ["~/.openclaw MCP/runtime roots", "bridge registration state"]
      },
      {
        id: "intent-bridge-attach",
        intent: "bridge-attach",
        label: "Bridge attach",
        detail:
          attachSourceOrder.length > 0
            ? `Would attach from ${attachSourceOrder.join(" -> ")} once enabled.`
            : "Would require a multi-source bridge order before any live attach is possible.",
        protectedSurfaces: ["OpenClaw bridge registration", "plugin source bindings"]
      },
      {
        id: "intent-connector-activate",
        intent: "connector-activate",
        label: "Connector activate",
        detail: `Would activate ${activationTarget.label} (${activationTarget.mode}) through a future lifecycle runner.`,
        protectedSurfaces: ["external connector processes", "connector activation registry"]
      },
      {
        id: "intent-lane-apply",
        intent: "lane-apply",
        label: "Lane apply",
        detail: rootOverlay
          ? `Would apply a host/runtime lane using root overlay ${shortenHomePath(rootOverlay)}.`
          : "Would require a resolved root overlay and staged bridge/lifecycle context before apply.",
        protectedSurfaces: ["~/.openclaw config and runtime state", "service lifecycle"]
      }
    ],
    lifecycle,
    approval: {
      status: "withheld",
      mode: "Explicit operator approval required",
      summary: "Host mutation cannot progress until a typed approval request and typed approval result exist.",
      request: createHandoffShape("Approval request", "The request envelope defines the minimum approval metadata needed before handoff.", [
        { id: "approval-intent", label: "Intent", required: true, detail: "One of root-connect, bridge-attach, connector-activate, or lane-apply." },
        { id: "approval-target", label: "Target", required: true, detail: "The resolved host target that would be mutated." },
        { id: "approval-risk", label: "Risk summary", required: true, detail: "Human-readable mutation scope and protected surfaces." },
        { id: "approval-rollback", label: "Rollback plan id", required: true, detail: "Rollback plan proving how partial host state would be unwound." },
        { id: "approval-requester", label: "Requester", required: true, detail: "Renderer/runtime actor requesting the host mutation." }
      ]),
      result: createHandoffShape("Approval result", "The result envelope makes approval auditable and slot-scoped rather than boolean-only.", [
        { id: "approval-id", label: "Approval id", required: true, detail: "Stable identifier for correlating audit and rollback state." },
        { id: "approval-decision", label: "Decision", required: true, detail: "Approved, denied, expired, or aborted." },
        { id: "approval-scope", label: "Scope", required: true, detail: "The slot, intent, and protected surfaces covered by the grant." },
        { id: "approval-expiry", label: "Expires at", required: false, detail: "Optional time-bounded approval window." },
        { id: "approval-note", label: "Reviewer note", required: false, detail: "Optional operator rationale attached to the decision." }
      ])
    },
    audit: {
      status: "planned",
      mode: "Structured audit envelope",
      summary: "Audit events are now typed for approval, handoff, execution, failure, and rollback stages.",
      event: createHandoffShape("Audit event", "The audit envelope defines the minimum trace required for any future host mutation attempt.", [
        { id: "audit-event-id", label: "Event id", required: true, detail: "Stable audit identifier for one mutation attempt." },
        { id: "audit-intent", label: "Intent", required: true, detail: "The mutation intent being attempted." },
        { id: "audit-slot", label: "Slot", required: true, detail: "The IPC slot or executor lane assigned to the mutation." },
        { id: "audit-stage", label: "Lifecycle stage", required: true, detail: "Approval, handoff, execute, verify, or rollback." },
        { id: "audit-target", label: "Target", required: true, detail: "Resolved host target for the mutation." },
        { id: "audit-result", label: "Result", required: true, detail: "Withheld, aborted, partial-apply, failed, or rolled-back." },
        { id: "audit-failure-code", label: "Failure code", required: false, detail: "Structured failure taxonomy code when the outcome is not successful." }
      ]),
      retainedStages: ["approval", "handoff", "execute", "verify", "rollback"]
    },
    rollback,
    releaseApprovalPipeline: {
      id: "",
      title: "",
      summary: "",
      mode: "review-only",
      currentStageId: "",
      reviewBoard: {
        id: "",
        title: "",
        summary: "",
        posture: "",
        activeOwner: "",
        reviewerNotes: []
      },
      decisionHandoff: {
        id: "",
        label: "",
        batonState: "held",
        sourceOwner: "",
        targetOwner: "",
        posture: "",
        summary: "",
        packetId: "",
        pending: [],
        reviewerNotes: []
      },
      evidenceCloseout: {
        id: "",
        label: "",
        sealingState: "open",
        owner: "",
        summary: "",
        sealedEvidence: [],
        pendingEvidence: [],
        reviewerNotes: []
      },
      stages: [],
      blockedBy: []
    },
    failureTaxonomy,
    mutationSlots
  };

  hostExecutor.releaseApprovalPipeline = createStudioReleaseApprovalPipeline(hostExecutor);
  return hostExecutor;
}

function createHostMutationPreview(
  hostExecutor: StudioHostExecutorState,
  intent: StudioHostMutationIntent,
  title: string,
  summary: string,
  requestedTarget: string,
  currentLifecycleStage: StudioHostLifecycleStageId
): StudioHostMutationPreview {
  const slot = hostExecutor.mutationSlots.find((entry) => entry.intent === intent) ?? hostExecutor.mutationSlots[0];

  if (!slot) {
    throw new Error(`Host executor slot is missing for intent ${intent}.`);
  }

  return {
    id: `host-preview-${intent}`,
    intent,
    slotId: slot.id,
    title,
    summary,
    status: "withheld",
    currentLifecycleStage,
    requestedTarget,
    slot,
    lifecycle: hostExecutor.lifecycle,
    approval: hostExecutor.approval,
    audit: hostExecutor.audit,
    rollback: hostExecutor.rollback,
    failureTaxonomy: hostExecutor.failureTaxonomy
  };
}

interface HostPreviewSimulationSpec {
  validationMissingFieldIds: string[];
  approvalDecision: "withheld" | "approved" | "denied" | "expired" | "aborted";
  auditStatus: "seeded" | "linked" | "rollback-linked";
  rollbackDisposition: StudioHostPreviewRollbackDisposition;
  slotStatus: "blocked" | "abort" | "partial-apply" | "rollback-required";
  failureCode: ReturnType<typeof createHostFailureTaxonomy>[number]["code"];
  stage: StudioHostLifecycleStageId;
  scope: string;
  rollbackCheckpoint: string;
}

interface HostPreviewResolution {
  hostExecutor: StudioHostExecutorState;
  preview: StudioHostMutationPreview;
  handoff: StudioHostPreviewHandoff;
}

type ToolsMcpActionResultBase = Omit<StudioRuntimeActionResult, "action" | "execution">;

function createHostPreviewHandoff(
  preview: StudioHostMutationPreview,
  hostExecutor: StudioHostExecutorState,
  simulation: HostPreviewSimulationSpec
): StudioHostPreviewHandoff {
  const slot = preview.slot;
  const requiredPayloadFieldIds = slot.handoff.payload.fields.filter((field) => field.required).map((field) => field.id);
  const validationStatus = simulation.validationMissingFieldIds.length === 0 ? "valid" : "invalid";
  const failureCase = hostExecutor.failureTaxonomy.find((entry) => entry.code === simulation.failureCode) ?? hostExecutor.failureTaxonomy[0];
  const requestId = `request-${slot.id}`;
  const approvalId = `approval-${slot.id}`;
  const auditEventId = `audit-${slot.id}`;
  const auditCorrelationId = `${auditEventId}:${simulation.slotStatus}`;
  const rollbackPlanId = `rollback-${slot.id}`;

  return {
    id: `handoff-${slot.id}`,
    previewId: preview.id,
    intent: preview.intent,
    simulated: true,
    mapping: {
      previewId: preview.id,
      requestId,
      slotId: slot.id,
      channel: slot.channel,
      requestedTarget: preview.requestedTarget,
      status: "mapped",
      summary: `${preview.title} now maps into ${slot.label} through the default-disabled phase25 Electron bridge skeleton.`
    },
    validation: {
      status: validationStatus,
      summary:
        validationStatus === "valid"
          ? `Typed handoff validator accepted ${slot.handoff.payloadType} for the disabled ${slot.label} stub.`
          : `Typed handoff validator rejected ${slot.handoff.payloadType} before the disabled ${slot.label} stub could continue.`,
      checkedFieldIds: requiredPayloadFieldIds,
      missingFieldIds: simulation.validationMissingFieldIds
    },
    approval: {
      requestId,
      approvalId,
      decision: simulation.approvalDecision,
      scope: simulation.scope,
      summary:
        simulation.approvalDecision === "approved"
          ? `Placeholder approval ${approvalId} is scoped to ${simulation.scope}.`
          : `Placeholder approval ${approvalId} remains ${simulation.approvalDecision} for ${simulation.scope}.`
    },
    audit: {
      eventId: auditEventId,
      correlationId: auditCorrelationId,
      stage: simulation.stage,
      status: simulation.auditStatus,
      summary: `Audit placeholder ${auditEventId} is ${simulation.auditStatus} at ${simulation.stage} and correlates to ${simulation.failureCode}.`
    },
    rollback: {
      planId: rollbackPlanId,
      disposition: simulation.rollbackDisposition,
      checkpoint: simulation.rollbackCheckpoint,
      summary:
        simulation.rollbackDisposition === "not-needed"
          ? `Rollback remains unnecessary; checkpoint stays ${simulation.rollbackCheckpoint}.`
          : `Rollback disposition is ${simulation.rollbackDisposition}; checkpoint ${simulation.rollbackCheckpoint} stays attached to the placeholder result.`
    },
    slotResult: {
      slotId: slot.id,
      channel: slot.channel,
      status: simulation.slotStatus,
      stage: simulation.stage,
      failureCode: simulation.failureCode,
      failureDisposition: failureCase?.disposition ?? "blocked",
      auditCorrelationId,
      rollbackDisposition: simulation.rollbackDisposition,
      summary: `Disabled slot stub stopped at ${simulation.stage} with ${simulation.failureCode}; audit=${auditCorrelationId}; rollback=${simulation.rollbackDisposition}.`
    },
    simulatedOutcomes: [],
    trace: []
  };
}

function resolveRollbackTraceSummary(
  handoff: StudioHostPreviewHandoff,
  primaryOutcome: StudioHostBridgeSimulatedOutcome,
  terminalOutcome: StudioHostBridgeSimulatedOutcome
): string {
  if (terminalOutcome.status === "rollback-incomplete") {
    return terminalOutcome.summary;
  }

  if (terminalOutcome.rollbackDisposition === "not-needed") {
    return `Rollback remains unnecessary after the simulated ${primaryOutcome.status} outcome.`;
  }

  return `Rollback disposition stays ${terminalOutcome.rollbackDisposition}; checkpoint ${handoff.rollback.checkpoint} remains attached to the placeholder trace.`;
}

function createHostBridgeTraceNotes(
  handoff: StudioHostPreviewHandoff,
  slotHandler: StudioHostBridgeSlotHandler,
  primaryOutcome: StudioHostBridgeSimulatedOutcome,
  terminalOutcome: StudioHostBridgeSimulatedOutcome
): {
  preview: StudioLinkedNote[];
  slot: StudioLinkedNote[];
  result: StudioLinkedNote[];
  rollback: StudioLinkedNote[];
} {
  const slotId = handoff.mapping.slotId;

  return {
    preview: [
      {
        id: `${handoff.id}-note-preview-approval`,
        label: "Approval gate",
        value: `${handoff.approval.decision} / ${handoff.approval.scope}`,
        detail: "Preview mapping stays attached to typed approval evidence and the review-only release approval workflow.",
        tone: handoff.approval.decision === "approved" ? "neutral" : "warning",
        links: [
          { id: `${handoff.id}-preview-link-approval`, label: "Approval result", kind: "approval", target: "approval.result" },
          { id: `${handoff.id}-preview-link-workflow`, label: "Release approval workflow", kind: "release-artifact", target: "release/RELEASE-APPROVAL-WORKFLOW.json" }
        ]
      }
    ],
    slot: [
      {
        id: `${handoff.id}-note-slot-handler`,
        label: "Handler / validator",
        value: `${slotHandler.state} / disabled`,
        detail: `${slotHandler.label} accepted the placeholder handoff without opening any host-side execution surface.`,
        tone: "positive",
        links: [
          { id: `${handoff.id}-slot-link`, label: slotId, kind: "trace-slot", target: slotId },
          { id: `${handoff.id}-slot-handoff-link`, label: "Lifecycle handoff-slot", kind: "lifecycle", target: "lifecycle.handoff-slot" }
        ]
      }
    ],
    result: [
      {
        id: `${handoff.id}-note-result-audit`,
        label: "Audit correlation",
        value: handoff.audit.correlationId,
        detail: "The result phase keeps audit correlation, failure taxonomy, and release review posture aligned.",
        tone: primaryOutcome.failureDisposition === "blocked" ? "neutral" : "warning",
        links: [
          { id: `${handoff.id}-audit-link`, label: "Audit event", kind: "audit", target: "audit.event" },
          { id: `${handoff.id}-approval-orchestration-link`, label: "Approval orchestration", kind: "release-artifact", target: "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json" }
        ]
      }
    ],
    rollback: [
      {
        id: `${handoff.id}-note-rollback-disposition`,
        label: "Rollback checkpoint",
        value: `${terminalOutcome.rollbackDisposition} / ${handoff.rollback.checkpoint}`,
        detail: "Rollback review remains explicit and cross-linked to publication receipt settlement closeout evidence.",
        tone: terminalOutcome.rollbackDisposition === "not-needed" ? "neutral" : "warning",
        links: [
          { id: `${handoff.id}-rollback-link`, label: "Rollback context", kind: "rollback", target: "rollback.context" },
          {
            id: `${handoff.id}-rollback-settlement-link`,
            label: "Receipt settlement closeout",
            kind: "release-artifact",
            target: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json"
          }
        ]
      }
    ]
  };
}

function createHostBridgeTrace(
  handoff: StudioHostPreviewHandoff,
  slotHandler: StudioHostBridgeSlotHandler,
  primaryOutcome: StudioHostBridgeSimulatedOutcome,
  terminalOutcome: StudioHostBridgeSimulatedOutcome
): StudioHostPreviewHandoff["trace"] {
  const notes = createHostBridgeTraceNotes(handoff, slotHandler, primaryOutcome, terminalOutcome);

  return [
    {
      id: `${handoff.id}-trace-preview`,
      phase: "preview",
      stage: "request-approval",
      label: "Preview mapped",
      status: "mapped",
      summary: handoff.mapping.summary,
      notes: notes.preview
    },
    {
      id: `${handoff.id}-trace-slot`,
      phase: "slot",
      stage: "handoff-slot",
      label: "Slot handler",
      status: "accepted",
      summary: `${slotHandler.label} accepted the disabled placeholder handoff on ${handoff.mapping.channel}.`,
      notes: notes.slot
    },
    {
      id: `${handoff.id}-trace-result`,
      phase: "result",
      stage: primaryOutcome.stage,
      label: "Simulated result",
      status: primaryOutcome.status,
      summary: primaryOutcome.summary,
      notes: notes.result
    },
    {
      id: `${handoff.id}-trace-rollback`,
      phase: "rollback",
      stage: terminalOutcome.stage,
      label: "Rollback disposition",
      status: terminalOutcome.status === "rollback-incomplete" ? "rollback-incomplete" : terminalOutcome.rollbackDisposition,
      summary: resolveRollbackTraceSummary(handoff, primaryOutcome, terminalOutcome),
      notes: notes.rollback
    }
  ];
}

export function simulateToolsMcpHostPreviewHandoff(
  handoff: StudioHostPreviewHandoff | null,
  hostExecutor: StudioHostExecutorState,
  channel: StudioHostBridgeSlotChannel
): StudioHostPreviewHandoff | null {
  if (!handoff || handoff.mapping.channel !== channel || handoff.slotResult.channel !== channel) {
    return null;
  }

  const slotHandler = hostExecutor.bridge.slotHandlers.find(
    (handler) => handler.channel === channel && handler.slotId === handoff.mapping.slotId
  );

  if (!slotHandler || slotHandler.simulatedOutcomes.length === 0) {
    return null;
  }

  const [primaryOutcome, ...remainingOutcomes] = slotHandler.simulatedOutcomes;

  if (!primaryOutcome) {
    return null;
  }

  const terminalOutcome = remainingOutcomes[remainingOutcomes.length - 1] ?? primaryOutcome;
  const auditCorrelationId = `${handoff.audit.eventId}:${primaryOutcome.status}`;
  const rollbackSummary = resolveRollbackTraceSummary(handoff, primaryOutcome, terminalOutcome);
  const trace = createHostBridgeTrace(handoff, slotHandler, primaryOutcome, terminalOutcome);
  const outcomeChain = slotHandler.simulatedOutcomes.map((outcome) => outcome.status).join(" -> ");

  return {
    ...handoff,
    audit: {
      ...handoff.audit,
      correlationId: auditCorrelationId,
      stage: terminalOutcome.stage,
      status: terminalOutcome.rollbackDisposition === "incomplete" ? "rollback-linked" : handoff.audit.status,
      summary: `Audit placeholder ${handoff.audit.eventId} now traces ${outcomeChain} through ${slotHandler.label}.`
    },
    rollback: {
      ...handoff.rollback,
      disposition: terminalOutcome.rollbackDisposition,
      summary: rollbackSummary
    },
    slotResult: {
      ...handoff.slotResult,
      status: primaryOutcome.status,
      stage: primaryOutcome.stage,
      failureCode: primaryOutcome.failureCode,
      failureDisposition: primaryOutcome.failureDisposition,
      auditCorrelationId,
      rollbackDisposition: terminalOutcome.rollbackDisposition,
      summary: `${slotHandler.label} accepted the disabled handoff and simulated ${outcomeChain}; audit=${auditCorrelationId}; rollback=${terminalOutcome.rollbackDisposition}.`
    },
    simulatedOutcomes: slotHandler.simulatedOutcomes,
    trace
  };
}

function resolveHostPreviewForAction(
  itemId: string,
  actionId: string,
  probe: LiveToolsMcpProbe,
  controlSession: ToolsMcpLocalControlSession,
  cachedCuratedPlugins: string[]
): HostPreviewResolution | null {
  const hostExecutor = buildToolsMcpHostExecutorState(probe, controlSession);

  switch (`${itemId}:${actionId}`) {
    case "mcp-root-scan:preview-host-root-connect": {
      const preferredRootTarget = getPreferredRootTarget(probe);
      const requestedTarget = preferredRootTarget.path ? shortenHomePath(preferredRootTarget.path) : "no resolved root candidate";
      const preview = createHostMutationPreview(
        hostExecutor,
        "root-connect",
        "Host root connect preview",
        "Maps the withheld root-connect preview into the disabled phase25 slot handoff path and simulated placeholder outcome matrix without touching the host runtime.",
        requestedTarget,
        preferredRootTarget.path ? "request-approval" : "collect-context"
      );
      const handoff = createHostPreviewHandoff(preview, hostExecutor, {
        validationMissingFieldIds: [],
        approvalDecision: "withheld",
        auditStatus: "seeded",
        rollbackDisposition: "not-needed",
        slotStatus: "blocked",
        failureCode: preferredRootTarget.path ? "approval-missing" : "precondition-missing",
        stage: preferredRootTarget.path ? "request-approval" : "collect-context",
        scope: "root-connect placeholder scope",
        rollbackCheckpoint: preferredRootTarget.path ? `checkpoint:${requestedTarget}` : "checkpoint:unresolved-root"
      });

      return {
        hostExecutor,
        preview: {
          ...preview,
          handoff
        },
        handoff
      };
    }
    case "mcp-adjacent-runtime:preview-host-bridge-attach": {
      const attachSourceOrder =
        controlSession.bridgeStage.sourceOrder.length > 0 ? controlSession.bridgeStage.sourceOrder : buildAttachSourceOrder(probe, cachedCuratedPlugins);
      const requestedTarget = attachSourceOrder.length > 0 ? attachSourceOrder.join(" -> ") : "no attach source order";
      const preview = createHostMutationPreview(
        hostExecutor,
        "bridge-attach",
        "Host bridge attach preview",
        "Maps the withheld bridge-attach preview into the disabled phase25 slot handoff path and simulated placeholder outcome matrix without touching the host runtime.",
        requestedTarget,
        "handoff-slot"
      );
      const handoff = createHostPreviewHandoff(preview, hostExecutor, {
        validationMissingFieldIds: ["payload-audit-seed"],
        approvalDecision: "approved",
        auditStatus: "linked",
        rollbackDisposition: "available",
        slotStatus: "abort",
        failureCode: "handoff-invalid",
        stage: "handoff-slot",
        scope: "bridge-attach placeholder scope",
        rollbackCheckpoint: requestedTarget !== "no attach source order" ? `checkpoint:attach:${requestedTarget}` : "checkpoint:attach-unresolved"
      });

      return {
        hostExecutor,
        preview: {
          ...preview,
          handoff
        },
        handoff
      };
    }
    case "mcp-adjacent-runtime:preview-host-connector-activate": {
      const activationTarget =
        controlSession.rootSelection.status === "selected" && controlSession.rootSelection.path
          ? {
              label: shortenHomePath(controlSession.rootSelection.path),
              mode: "Studio-local selected root"
            }
          : getConnectorActivationTarget(probe, cachedCuratedPlugins);
      const preview = createHostMutationPreview(
        hostExecutor,
        "connector-activate",
        "Host connector activate preview",
        "Maps the withheld connector-activate preview into the disabled phase25 slot handoff path and simulated placeholder outcome matrix without touching the host runtime.",
        activationTarget.label,
        "mutate-host"
      );
      const handoff = createHostPreviewHandoff(preview, hostExecutor, {
        validationMissingFieldIds: [],
        approvalDecision: "approved",
        auditStatus: "linked",
        rollbackDisposition: "required",
        slotStatus: "partial-apply",
        failureCode: "partial-apply",
        stage: "mutate-host",
        scope: "connector-activate placeholder scope",
        rollbackCheckpoint:
          activationTarget.mode !== "unresolved" ? `checkpoint:activate:${activationTarget.label}` : "checkpoint:activate-unresolved"
      });

      return {
        hostExecutor,
        preview: {
          ...preview,
          handoff
        },
        handoff
      };
    }
    case "mcp-adjacent-runtime:preview-host-lane-apply": {
      const stagedSourceOrder =
        controlSession.laneApply.sourceOrder.length > 0
          ? controlSession.laneApply.sourceOrder
          : controlSession.bridgeStage.sourceOrder.length > 0
            ? controlSession.bridgeStage.sourceOrder
            : buildAttachSourceOrder(probe, cachedCuratedPlugins);
      const preferredRootTarget = getPreferredRootTarget(probe);
      const rootOverlay = controlSession.rootSelection.path ?? preferredRootTarget.path;
      const requestedTarget = rootOverlay ? shortenHomePath(rootOverlay) : "no root overlay";
      const preview = createHostMutationPreview(
        hostExecutor,
        "lane-apply",
        "Host lane apply preview",
        "Maps the withheld lane-apply preview into the disabled phase25 slot handoff path and simulated placeholder outcome matrix without touching the host runtime.",
        requestedTarget,
        "rollback-host"
      );
      const handoff = createHostPreviewHandoff(preview, hostExecutor, {
        validationMissingFieldIds: [],
        approvalDecision: "approved",
        auditStatus: "rollback-linked",
        rollbackDisposition: "required",
        slotStatus: "rollback-required",
        failureCode: "rollback-required",
        stage: "rollback-host",
        scope: "lane-apply placeholder scope",
        rollbackCheckpoint: rootOverlay ? `checkpoint:apply:${requestedTarget}` : "checkpoint:apply-unresolved"
      });

      return {
        hostExecutor,
        preview: {
          ...preview,
          handoff
        },
        handoff
      };
    }
    default:
      return null;
  }
}

function finalizeHostPreviewResolution(resolution: HostPreviewResolution | null): HostPreviewResolution | null {
  if (!resolution) {
    return null;
  }

  const simulatedHandoff = simulateToolsMcpHostPreviewHandoff(
    resolution.handoff,
    resolution.hostExecutor,
    resolution.handoff.mapping.channel
  );

  if (!simulatedHandoff) {
    return resolution;
  }

  return {
    ...resolution,
    preview: {
      ...resolution.preview,
      handoff: simulatedHandoff
    },
    handoff: simulatedHandoff
  };
}

function createHostBridgeHandoffSections(
  hostExecutor: StudioHostExecutorState,
  hostPreview: StudioHostMutationPreview,
  hostHandoff: StudioHostPreviewHandoff
): StudioDetailSection[] {
  const currentTraceSlot = hostExecutor.bridge.trace.slotRoster.find((entry) => entry.slotId === hostHandoff.mapping.slotId);
  const slotRosterLines = hostExecutor.bridge.trace.slotRoster.map((entry) => {
    const active = entry.slotId === hostHandoff.mapping.slotId ? "yes" : "no";

    return `focus active · ${active} · ${entry.label} · handler ${entry.handlerState} · validator ${entry.validatorState} · result ${entry.primaryStatus} / ${entry.primaryStage} · rollback ${entry.rollbackDisposition} · outcomes ${entry.outcomeChain.join(
      " -> "
    )}`;
  });

  return [
    {
      id: "host-bridge-preview-map",
      title: "Preview to slot handoff",
      lines: [
        `preview id · ${hostHandoff.mapping.previewId}`,
        `slot · ${hostPreview.slot.label}`,
        `channel · ${hostHandoff.mapping.channel}`,
        `request id · ${hostHandoff.mapping.requestId}`,
        `requested target · ${hostHandoff.mapping.requestedTarget}`,
        `mapping · ${hostHandoff.mapping.summary}`
      ]
    },
    {
      id: "host-bridge-focus",
      title: "Focused slot posture",
      lines: [
        `focus slot · ${hostPreview.slot.label}`,
        "focus source · preview-handoff",
        `focus requested target · ${hostHandoff.mapping.requestedTarget}`,
        `focus handler · ${currentTraceSlot?.handlerLabel ?? "missing"} · ${currentTraceSlot?.handlerState ?? "missing"}`,
        `focus validator · ${currentTraceSlot?.validatorLabel ?? "missing"} · ${hostHandoff.validation.status}`,
        `focus result · ${hostHandoff.slotResult.status} · ${hostHandoff.slotResult.stage}`,
        `focus rollback · ${hostHandoff.slotResult.rollbackDisposition}`,
        `focus audit · ${hostHandoff.audit.status} · ${hostHandoff.audit.correlationId}`
      ]
    },
    {
      id: "host-bridge-slot-state",
      title: "Current slot / handler / validator",
      lines: [
        `current slot · ${hostPreview.slot.label}`,
        `handler · ${currentTraceSlot?.handlerLabel ?? "missing"} · ${currentTraceSlot?.handlerState ?? "missing"}`,
        `validator · ${currentTraceSlot?.validatorLabel ?? "missing"} · ${currentTraceSlot?.validatorState ?? "missing"}`,
        `channel · ${hostHandoff.mapping.channel}`,
        `requested target · ${hostHandoff.mapping.requestedTarget}`,
        `current stage · ${hostHandoff.slotResult.stage}`
      ]
    },
    {
      id: "host-bridge-validation",
      title: "Typed handoff validation",
      lines: [
        `validation status · ${hostHandoff.validation.status}`,
        `checked fields · ${hostHandoff.validation.checkedFieldIds.join(" · ")}`,
        `missing fields · ${hostHandoff.validation.missingFieldIds.join(" · ") || "none"}`,
        `validator summary · ${hostHandoff.validation.summary}`
      ]
    },
    {
      id: "host-bridge-approval",
      title: "Approval placeholder",
      lines: [
        `approval id · ${hostHandoff.approval.approvalId}`,
        `decision · ${hostHandoff.approval.decision}`,
        `scope · ${hostHandoff.approval.scope}`,
        `approval summary · ${hostHandoff.approval.summary}`
      ]
    },
    {
      id: "host-bridge-audit",
      title: "Audit placeholder",
      lines: [
        `audit event · ${hostHandoff.audit.eventId}`,
        `correlation id · ${hostHandoff.audit.correlationId}`,
        `audit stage · ${hostHandoff.audit.stage}`,
        `audit status · ${hostHandoff.audit.status}`,
        `audit summary · ${hostHandoff.audit.summary}`
      ]
    },
    {
      id: "host-bridge-rollback",
      title: "Rollback placeholder",
      lines: [
        `rollback plan · ${hostHandoff.rollback.planId}`,
        `disposition · ${hostHandoff.rollback.disposition}`,
        `checkpoint · ${hostHandoff.rollback.checkpoint}`,
        `rollback summary · ${hostHandoff.rollback.summary}`
      ]
    },
    {
      id: "host-bridge-dispositions",
      title: "Failure / rollback / audit disposition",
      lines: [
        `approval decision · ${hostHandoff.approval.decision}`,
        `audit status · ${hostHandoff.audit.status}`,
        `audit correlation · ${hostHandoff.audit.correlationId}`,
        `failure disposition · ${hostHandoff.slotResult.failureDisposition}`,
        `rollback disposition · ${hostHandoff.slotResult.rollbackDisposition}`,
        `rollback checkpoint · ${hostHandoff.rollback.checkpoint}`
      ]
    },
    {
      id: "host-bridge-result",
      title: "Simulated slot result",
      lines: [
        `slot status · ${hostHandoff.slotResult.status}`,
        `stage · ${hostHandoff.slotResult.stage}`,
        `failure code · ${hostHandoff.slotResult.failureCode}`,
        `failure disposition · ${hostHandoff.slotResult.failureDisposition}`,
        `audit correlation · ${hostHandoff.slotResult.auditCorrelationId}`,
        `rollback disposition · ${hostHandoff.slotResult.rollbackDisposition}`,
        `result summary · ${hostHandoff.slotResult.summary}`
      ]
    },
    {
      id: "host-bridge-simulated-outcomes",
      title: "Simulated outcomes",
      lines: hostHandoff.simulatedOutcomes.map(
        (outcome) =>
          `${outcome.label} · ${outcome.status} · ${outcome.stage} · ${outcome.failureCode} · rollback ${outcome.rollbackDisposition}`
      )
    },
    {
      id: "host-bridge-slot-roster",
      title: "Slot roster",
      lines: slotRosterLines
    },
    {
      id: "host-bridge-trace",
      title: "Slot-state timeline",
      lines: hostHandoff.trace.map((step) => `${step.phase} · ${step.label} · ${step.status} · ${step.summary}`)
    }
  ];
}

function formatLocalOnlyStatus(status: string): string {
  switch (status) {
    case "selected":
      return "selected";
    case "staged":
      return "staged";
    case "active":
      return "active";
    case "applied":
      return "applied";
    case "partial":
      return "partial";
    case "prepared":
      return "prepared";
    case "blocked":
      return "blocked";
    default:
      return "idle";
  }
}

function formatSourceOrder(sourceOrder: string[]): string {
  return sourceOrder.length > 0 ? sourceOrder.join(" -> ") : "none";
}

function recordLocalControlExecution(
  controlSession: ToolsMcpLocalControlSession,
  spec: Omit<LocalControlHistoryEntry, "id" | "executedAt">
): LocalControlHistoryEntry {
  const executedAt = new Date().toISOString();
  const nextExecutionCount = controlSession.executionCount + 1;
  const entry: LocalControlHistoryEntry = {
    ...spec,
    id: `local-control-${nextExecutionCount}`,
    executedAt
  };

  controlSession.executionCount = nextExecutionCount;
  controlSession.updatedAt = executedAt;
  controlSession.history = [entry, ...controlSession.history].slice(0, 8);

  return entry;
}

function resetFromRootSelection(controlSession: ToolsMcpLocalControlSession): void {
  controlSession.bridgeStage = createIdleBridgeStageState();
  controlSession.connectorActivation = createIdleConnectorActivationState();
  controlSession.laneApply = createIdleLaneApplyState();
}

function resetFromBridgeStage(controlSession: ToolsMcpLocalControlSession): void {
  controlSession.connectorActivation = createIdleConnectorActivationState();
  controlSession.laneApply = createIdleLaneApplyState();
}

function resetFromConnectorActivation(controlSession: ToolsMcpLocalControlSession): void {
  controlSession.laneApply = createIdleLaneApplyState();
}

function buildLocalOnlyBoundaryLines(): string[] {
  return [
    "mutation scope · Studio-local in-memory control session and execution history only",
    "host runtime effects · none",
    "forbidden side effects · no ~/.openclaw writes, plugin installs, config edits, service restarts, or external process launches"
  ];
}

function getHistoryLines(controlSession: ToolsMcpLocalControlSession, itemId: string): string[] {
  const relevantHistory = controlSession.history.filter((entry) =>
    itemId === "mcp-root-scan" ? entry.itemId === "mcp-root-scan" : entry.itemId === "mcp-adjacent-runtime" || entry.itemId === "mcp-root-scan"
  );

  if (relevantHistory.length === 0) {
    return ["No Studio-local control actions have been executed yet."];
  }

  return relevantHistory.map(
    (entry) => `${entry.executedAt} · ${entry.label} · ${entry.status} · ${entry.target} · ${entry.summary}`
  );
}

function getRootSessionLines(controlSession: ToolsMcpLocalControlSession): string[] {
  return [
    "scope · Studio-local in-memory control session",
    `selection status · ${formatLocalOnlyStatus(controlSession.rootSelection.status)}`,
    `selected root · ${controlSession.rootSelection.path ? shortenHomePath(controlSession.rootSelection.path) : "none"}`,
    `selection mode · ${controlSession.rootSelection.mode}`,
    `executed at · ${controlSession.rootSelection.executedAt ?? "never"}`,
    `downstream connector state · bridge ${formatLocalOnlyStatus(controlSession.bridgeStage.status)} · activation ${formatLocalOnlyStatus(
      controlSession.connectorActivation.status
    )} · lane ${formatLocalOnlyStatus(controlSession.laneApply.status)}`
  ];
}

function getConnectorSessionLines(controlSession: ToolsMcpLocalControlSession): string[] {
  return [
    "scope · Studio-local in-memory control session",
    `session started · ${controlSession.startedAt}`,
    `executions · ${controlSession.executionCount}`,
    `selected root · ${
      controlSession.rootSelection.path
        ? `${shortenHomePath(controlSession.rootSelection.path)} (${formatLocalOnlyStatus(controlSession.rootSelection.status)})`
        : formatLocalOnlyStatus(controlSession.rootSelection.status)
    }`,
    `bridge stage · ${formatLocalOnlyStatus(controlSession.bridgeStage.status)} · ${formatSourceOrder(controlSession.bridgeStage.sourceOrder)}`,
    `connector activation · ${
      controlSession.connectorActivation.label
        ? `${controlSession.connectorActivation.label} (${formatLocalOnlyStatus(controlSession.connectorActivation.status)})`
        : formatLocalOnlyStatus(controlSession.connectorActivation.status)
    }`,
    `lane apply · ${
      controlSession.laneApply.verdict
        ? `${controlSession.laneApply.verdict} (${formatLocalOnlyStatus(controlSession.laneApply.status)})`
        : formatLocalOnlyStatus(controlSession.laneApply.status)
    }`,
    `session updated · ${controlSession.updatedAt}`
  ];
}

function getRootDetailSections(controlSession: ToolsMcpLocalControlSession): StudioDetailSection[] {
  return [
    {
      id: "mcp-local-root-control",
      title: "Studio-local control session",
      lines: getRootSessionLines(controlSession)
    },
    {
      id: "mcp-local-root-history",
      title: "Execution history",
      lines: getHistoryLines(controlSession, "mcp-root-scan")
    }
  ];
}

function getConnectorDetailSections(controlSession: ToolsMcpLocalControlSession): StudioDetailSection[] {
  return [
    {
      id: "mcp-local-connector-control",
      title: "Studio-local control session",
      lines: getConnectorSessionLines(controlSession)
    },
    {
      id: "mcp-local-connector-history",
      title: "Execution history",
      lines: getHistoryLines(controlSession, "mcp-adjacent-runtime")
    }
  ];
}

function getRootDetailTone(
  controlSession: ToolsMcpLocalControlSession,
  fallbackTone: StudioRuntimeDetail["tone"]
): StudioRuntimeDetail["tone"] {
  if (controlSession.rootSelection.status === "selected") {
    return "positive";
  }

  if (controlSession.rootSelection.status === "blocked") {
    return "warning";
  }

  return fallbackTone;
}

function getConnectorDetailTone(
  controlSession: ToolsMcpLocalControlSession,
  fallbackTone: StudioRuntimeDetail["tone"]
): StudioRuntimeDetail["tone"] {
  if (controlSession.laneApply.status === "applied" || controlSession.connectorActivation.status === "active") {
    return "positive";
  }

  if (
    controlSession.laneApply.status === "partial" ||
    controlSession.connectorActivation.status === "prepared" ||
    controlSession.bridgeStage.status === "partial" ||
    controlSession.bridgeStage.status === "staged"
  ) {
    return "neutral";
  }

  if (
    controlSession.laneApply.status === "blocked" ||
    controlSession.connectorActivation.status === "blocked" ||
    controlSession.bridgeStage.status === "blocked"
  ) {
    return "warning";
  }

  return fallbackTone;
}

function buildRootStatusLines(scannedRoots: string[], discoveredRoots: string[]): string[] {
  const discoveredSet = new Set(discoveredRoots);
  return scannedRoots.map((root) => `${shortenHomePath(root)} · ${discoveredSet.has(root) ? "present" : "missing"}`);
}

function buildOpenClawPluginEntryLines(config: OpenClawConfig | null): string[] {
  return Object.entries(config?.plugins?.entries ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([id, meta]) => `${id} · ${meta.enabled === false ? "disabled" : "enabled"}`);
}

function buildOpenClawInstallLines(config: OpenClawConfig | null): string[] {
  return Object.entries(config?.plugins?.installs ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([id, meta]) => {
      const parts = [id];

      if (meta.version) {
        parts.push(`v${meta.version}`);
      }

      if (meta.source) {
        parts.push(meta.source);
      }

      if (meta.installPath) {
        parts.push(shortenHomePath(meta.installPath));
      }

      return parts.join(" · ");
    });
}

function extractSafeCodexConfigLines(rawConfig: string | null): string[] {
  if (!rawConfig) {
    return [];
  }

  const lines = rawConfig.split(/\r?\n/);
  const safeLines: string[] = [];
  let currentSection: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const sectionMatch = trimmed.match(/^\[(.+)\]$/);

    if (sectionMatch) {
      currentSection = sectionMatch[1] ?? null;

      if (
        currentSection === "windows" ||
        currentSection?.startsWith("model_providers.") ||
        currentSection?.startsWith('plugins."')
      ) {
        safeLines.push(trimmed);
      }

      continue;
    }

    if (currentSection === null) {
      if (
        trimmed.startsWith("model_provider =") ||
        trimmed.startsWith("model =") ||
        trimmed.startsWith("review_model =") ||
        trimmed.startsWith("model_reasoning_effort =") ||
        trimmed.startsWith("network_access =") ||
        trimmed.startsWith("disable_response_storage =") ||
        trimmed.startsWith("windows_wsl_setup_acknowledged =") ||
        trimmed.startsWith("model_context_window =") ||
        trimmed.startsWith("model_auto_compact_token_limit =")
      ) {
        safeLines.push(trimmed);
      }

      continue;
    }

    if (currentSection === "windows" && trimmed.startsWith("sandbox =")) {
      safeLines.push(trimmed);
      continue;
    }

    if (currentSection.startsWith("model_providers.") && (trimmed.startsWith("name =") || trimmed.startsWith("wire_api =") || trimmed.startsWith("requires_openai_auth ="))) {
      safeLines.push(trimmed);
      continue;
    }

    if (currentSection.startsWith('plugins."') && trimmed.startsWith("enabled =")) {
      safeLines.push(trimmed);
    }
  }

  return safeLines.slice(0, 20);
}

async function describeRootCandidate(rootPath: string): Promise<string> {
  try {
    const stats = await fs.stat(rootPath);

    if (stats.isDirectory()) {
      const entries = await fs.readdir(rootPath);
      return `${shortenHomePath(rootPath)} · directory · ${entries.length} entries`;
    }

    if (stats.isFile()) {
      return `${shortenHomePath(rootPath)} · file · ${stats.size} bytes`;
    }

    return `${shortenHomePath(rootPath)} · special`;
  } catch {
    return `${shortenHomePath(rootPath)} · missing`;
  }
}

function buildDiscoveryFlowLines(probe: LiveToolsMcpProbe): string[] {
  return [
    `scan roots · ${probe.mcpRootsScanned.length}`,
    `discovered roots · ${probe.discoveredMcpRoots.length}`,
    `plugin installs · ${probe.pluginInstallCount}`,
    `load paths · ${probe.pluginLoadPaths.length}`,
    `curated cache · ${formatPresence(probe.codexPluginCachePresent)}`,
    `flow verdict · ${probe.discoveredMcpRoots.length > 0 ? "dedicated root path available" : probe.pluginInstallCount > 0 || probe.pluginLoadPaths.length > 0 ? "bridge inputs available, dedicated roots absent" : "fallback only"}`
  ];
}

function buildConnectorLaneLines(probe: LiveToolsMcpProbe): string[] {
  return [
    `curated cache · ${formatPresence(probe.codexPluginCachePresent)}`,
    `plugin installs · ${probe.pluginInstallCount}`,
    `plugin entries · ${probe.pluginEntryCount}`,
    `load paths · ${probe.pluginLoadPaths.length}`,
    `dedicated roots · ${probe.discoveredMcpRoots.length}`,
    `lane verdict · ${probe.codexPluginCachePresent && (probe.pluginInstallCount > 0 || probe.pluginLoadPaths.length > 0) ? "connector lane composed for deeper safe inspection" : probe.codexPluginCachePresent || probe.pluginInstallCount > 0 || probe.pluginLoadPaths.length > 0 ? "partial lane" : "fallback lane"}`
  ];
}

function formatPreviewList(
  values: string[],
  formatter: (value: string) => string = (value) => value,
  emptyLabel = "none"
): string {
  return values.length > 0 ? values.slice(0, 3).map(formatter).join(" · ") : emptyLabel;
}

function hasConnectorBridgeInputs(probe: LiveToolsMcpProbe, cachedCuratedPlugins: string[]): boolean {
  return (
    cachedCuratedPlugins.length > 0 ||
    probe.pluginInstallCount > 0 ||
    probe.pluginEntryCount > 0 ||
    probe.pluginLoadPaths.length > 0 ||
    probe.discoveredMcpRoots.length > 0
  );
}

function getPreferredRootTarget(probe: LiveToolsMcpProbe): { path: string | null; mode: string } {
  if (probe.discoveredMcpRoots.length > 0) {
    return {
      path: probe.discoveredMcpRoots[0] ?? null,
      mode: "dedicated root"
    };
  }

  if (probe.pluginLoadPaths.length > 0) {
    return {
      path: probe.pluginLoadPaths[0] ?? null,
      mode: "plugin load path fallback"
    };
  }

  return {
    path: null,
    mode: "unresolved"
  };
}

function getConnectorActivationTarget(
  probe: LiveToolsMcpProbe,
  cachedCuratedPlugins: string[]
): { label: string; mode: string } {
  if (probe.discoveredMcpRoots.length > 0) {
    return {
      label: shortenHomePath(probe.discoveredMcpRoots[0]),
      mode: "dedicated root"
    };
  }

  if (probe.pluginInstallIds.length > 0) {
    return {
      label: probe.pluginInstallIds[0] ?? "unknown install",
      mode: "OpenClaw install manifest"
    };
  }

  if (cachedCuratedPlugins.length > 0) {
    return {
      label: cachedCuratedPlugins[0] ?? "unknown curated plugin",
      mode: "curated Codex plugin cache"
    };
  }

  if (probe.pluginLoadPaths.length > 0) {
    return {
      label: shortenHomePath(probe.pluginLoadPaths[0]),
      mode: "plugin load path fallback"
    };
  }

  return {
    label: "no activation target",
    mode: "unresolved"
  };
}

function buildAttachSourceOrder(probe: LiveToolsMcpProbe, cachedCuratedPlugins: string[]): string[] {
  const orderedSources: string[] = [];

  if (cachedCuratedPlugins.length > 0) {
    orderedSources.push("curated Codex plugin cache");
  }

  if (probe.pluginInstallCount > 0) {
    orderedSources.push("OpenClaw install manifests");
  }

  if (probe.pluginEntryCount > 0) {
    orderedSources.push("OpenClaw plugin entries");
  }

  if (probe.pluginLoadPaths.length > 0) {
    orderedSources.push("OpenClaw plugin load paths");
  }

  if (probe.discoveredMcpRoots.length > 0) {
    orderedSources.push("dedicated MCP roots");
  }

  return orderedSources;
}

function buildRootHostBoundarySummaryLines(
  probe: LiveToolsMcpProbe,
  controlSession: ToolsMcpLocalControlSession,
  cachedCuratedPlugins: string[]
): string[] {
  const preferredRootTarget = getPreferredRootTarget(probe);
  const attachSourceOrder = buildAttachSourceOrder(probe, cachedCuratedPlugins);

  return [
    "future host control · root connect",
    `boundary posture · ${
      probe.discoveredMcpRoots.length > 0
        ? "candidate target exists, but live host connect remains withheld"
        : "no dedicated target exists, so live host connect remains withheld"
    }`,
    `resolved target · ${preferredRootTarget.path ? shortenHomePath(preferredRootTarget.path) : "none"}`,
    `Studio-local selection · ${formatLocalOnlyStatus(controlSession.rootSelection.status)}`,
    `supporting source layers · ${attachSourceOrder.length > 0 ? attachSourceOrder.join(" -> ") : "none"}`,
    "next requirement · explicit host/runtime permission plus a dedicated executor bridge"
  ];
}

function buildConnectorHostBoundarySummaryLines(
  probe: LiveToolsMcpProbe,
  controlSession: ToolsMcpLocalControlSession,
  cachedCuratedPlugins: string[]
): string[] {
  const attachSourceOrder =
    controlSession.bridgeStage.sourceOrder.length > 0 ? controlSession.bridgeStage.sourceOrder : buildAttachSourceOrder(probe, cachedCuratedPlugins);
  const activationTarget =
    controlSession.rootSelection.status === "selected" && controlSession.rootSelection.path
      ? {
          label: shortenHomePath(controlSession.rootSelection.path),
          mode: "Studio-local selected root"
        }
      : getConnectorActivationTarget(probe, cachedCuratedPlugins);
  const preferredRootTarget = getPreferredRootTarget(probe);
  const rootOverlay = controlSession.rootSelection.path ?? preferredRootTarget.path;

  return [
    "future host controls · bridge attach · connector activate · lane apply",
    `boundary posture · ${
      attachSourceOrder.length >= 2 && activationTarget.mode !== "unresolved"
        ? "host actions are technically sketched, but live execution remains withheld"
        : "host actions remain withheld and still lack one or more technical prerequisites"
    }`,
    `bridge source order · ${formatSourceOrder(attachSourceOrder)}`,
    `activation target · ${activationTarget.label} (${activationTarget.mode})`,
    `root overlay · ${rootOverlay ? shortenHomePath(rootOverlay) : "none"}`,
    "next requirement · explicit host/runtime permission, lifecycle executor, and rollback-aware apply path"
  ];
}

function buildShellBoundarySummary(
  probe: LiveToolsMcpProbe,
  controlSession: ToolsMcpLocalControlSession
): StudioBoundarySummary {
  const cachedCuratedPlugins = probe.codexPluginCachePresent ? ["curated-cache"] : [];
  const attachSourceOrder = buildAttachSourceOrder(probe, cachedCuratedPlugins);
  const preferredRootTarget = getPreferredRootTarget(probe);
  const activationTarget =
    controlSession.rootSelection.status === "selected" && controlSession.rootSelection.path
      ? {
          label: shortenHomePath(controlSession.rootSelection.path),
          mode: "Studio-local selected root"
        }
      : getConnectorActivationTarget(probe, cachedCuratedPlugins);
  const rootOverlay = controlSession.rootSelection.path ?? preferredRootTarget.path;
  const localControlState: StudioBoundarySummary["capabilities"][number]["state"] =
    controlSession.laneApply.status === "applied" ||
    controlSession.connectorActivation.status === "active" ||
    controlSession.bridgeStage.status === "staged" ||
    controlSession.rootSelection.status === "selected"
      ? "ready"
      : attachSourceOrder.length > 0 || preferredRootTarget.path !== null
        ? "partial"
        : "blocked";

  return createBoundarySummary({
    id: "shell-host-runtime-boundary",
    title: "Host/runtime boundary",
    summary:
      "Read-only detail, dry-run planning, Studio-local connector controls, and default-disabled host bridge handoff placeholders are available. Real host execution is still withheld behind policy, approvals, and future executor slots.",
    currentLayer: "local-only",
    nextLayer: "preview-host",
    tone: attachSourceOrder.length >= 2 && preferredRootTarget.path ? "neutral" : "warning",
    policy: {
      posture: "Alpha local-only",
      approvalMode: "Explicit host approval required",
      detail:
        "The shell may inspect runtime state, stage dry-runs, and mutate only the in-memory Studio control session. It cannot write ~/.openclaw, touch installs/config, restart services, or control external processes.",
      protectedSurfaces: ["~/.openclaw", "services/install/config", "external connector processes"]
    },
    progressionDetails: {
      localOnly: "Studio-local root select, bridge stage, activate, and apply mutate only in-memory control state and history.",
      previewHost: "Preview-host actions describe the future host path, policy, capability, and approval requirements without executing.",
      withheld: "Host execution remains blocked even though a default-disabled bridge skeleton now exists; live approval, lifecycle, and rollback execution are still missing.",
      futureExecutor: "Phase 25 now wires a default-disabled bridge skeleton with simulated outcome coverage, page-level focus linkage, quick slot filters, and richer trace surfacing while still reserving the real executor for a later host implementation."
    },
    capabilities: [
      {
        id: "cap-shell-read-only",
        label: "Runtime-backed detail",
        state: "ready",
        detail: "Tools / MCP rows can expose sanitized typed runtime detail payloads."
      },
      {
        id: "cap-shell-dry-run",
        label: "Dry-run planning",
        state: "ready",
        detail: "Connect, attach, activate, and apply flows can produce withheld plans and blockers without mutation."
      },
      {
        id: "cap-shell-local-only",
        label: "Studio-local controls",
        state: localControlState,
        detail:
          localControlState === "ready"
            ? "At least one Studio-local control lane is staged or selected."
            : localControlState === "partial"
              ? "The local control surface exists, but current root or bridge inputs remain partial."
              : "Local execution surfaces exist, but current runtime inputs do not yet resolve a usable staged target."
      },
      {
        id: "cap-shell-preview-host",
        label: "Preview-host contract",
        state: "ready",
        detail: "Host preview results now expose policy summary, capability state, blockers, preconditions, withheld plan, and future slots."
      },
      {
        id: "cap-shell-host-executor",
        label: "Host executor bridge",
        state: "partial",
        detail: "A default-disabled Electron bridge skeleton can map previews into slot stubs, but it still cannot mutate host runtime state."
      }
    ],
    blockedReasons: [
      {
        code: "policy-no-host-execution",
        layer: "withheld" as const,
        label: "Alpha policy forbids live host execution",
        detail: "No writes, installs, service changes, or external process launches are permitted in this round."
      },
      {
        code: "approval-required",
        layer: "withheld" as const,
        label: "Approval contract is missing",
        detail: "There is no explicit permission grant path for host-side execution."
      },
      {
        code: "host-bridge-missing",
        layer: "withheld" as const,
        label: "Typed host mutation bridge stays default-disabled",
        detail: "The bridge now exposes placeholder slot handlers and validators, but it still cannot execute a host/runtime mutation path."
      },
      ...(preferredRootTarget.path === null
        ? [
            {
              code: "dedicated-root-missing" as const,
              layer: "withheld" as const,
              label: "No dedicated root target is resolved",
              detail: "The current runtime view cannot yet prove a dedicated MCP root for a live host handoff."
            }
          ]
        : preferredRootTarget.mode === "plugin load path fallback"
          ? [
              {
                code: "dedicated-root-missing" as const,
                layer: "withheld" as const,
                label: "Only fallback root targeting exists",
                detail: "Plugin load-path fallback is not strong enough for a true dedicated-root host connect."
              }
            ]
          : []),
      ...(attachSourceOrder.length < 2
        ? [
            {
              code: "bridge-sources-partial" as const,
              layer: "withheld" as const,
              label: "Bridge source order is still partial",
              detail:
                attachSourceOrder.length === 0
                  ? "Cache, installs, entries, load paths, and dedicated roots are not yet sufficient for a multi-source host bridge handoff."
                  : "Only one source layer is available, so the bridge handoff posture remains partial."
            }
          ]
        : []),
      {
        code: "lifecycle-runner-missing",
        layer: "future-executor" as const,
        label: "Lifecycle runner is not implemented",
        detail: `Activation target ${activationTarget.label} (${activationTarget.mode}) cannot be started, stopped, or reconciled on the host.`
      },
      {
        code: "rollback-missing",
        layer: "future-executor" as const,
        label: "Rollback-aware apply path is still missing",
        detail: `A failed host apply for ${rootOverlay ? shortenHomePath(rootOverlay) : "the unresolved lane"} could not yet be unwound safely.`
      }
    ],
    requiredPreconditions: [
      {
        id: "precondition-shell-root",
        label: "Dedicated root targeting",
        state: resolvePreconditionState(probe.discoveredMcpRoots.length > 0, preferredRootTarget.mode === "plugin load path fallback"),
        detail:
          preferredRootTarget.path !== null
            ? `${shortenHomePath(preferredRootTarget.path)} (${preferredRootTarget.mode})`
            : "No dedicated root or fallback target is currently resolved."
      },
      {
        id: "precondition-shell-bridge",
        label: "Multi-source bridge order",
        state: resolvePreconditionState(attachSourceOrder.length >= 2, attachSourceOrder.length === 1),
        detail: attachSourceOrder.length > 0 ? attachSourceOrder.join(" -> ") : "No attach source order is available yet."
      },
      {
        id: "precondition-shell-approval",
        label: "Host approval handshake",
        state: "missing",
        detail: "No typed approval gate exists for host writes, lifecycle changes, or process control."
      },
      {
        id: "precondition-shell-executor",
        label: "Host executor bridge",
        state: "missing",
        detail: "The Electron bridge has no mutation entry points for root connect, attach, activate, or apply."
      },
      {
        id: "precondition-shell-lifecycle",
        label: "Lifecycle and rollback semantics",
        state: "missing",
        detail: "A future executor still needs activate/deactivate logic plus rollback across bridge and lane state."
      }
    ],
    withheldExecutionPlan: [
      {
        id: "withheld-shell-root",
        label: "Resolve root and overlay inputs",
        state: "planned",
        detail:
          preferredRootTarget.path !== null
            ? `Current best target is ${shortenHomePath(preferredRootTarget.path)} (${preferredRootTarget.mode}).`
            : "Scan results stop short of a usable dedicated root target."
      },
      {
        id: "withheld-shell-bridge",
        label: "Compose bridge sources",
        state: attachSourceOrder.length > 0 ? "planned" : "withheld",
        detail: attachSourceOrder.length > 0 ? attachSourceOrder.join(" -> ") : "No bridge source order is ready yet."
      },
      {
        id: "withheld-shell-approval",
        label: "Request host approval",
        state: "withheld",
        detail: "Approval is not modeled in the current bridge, so execution cannot advance to host mutation."
      },
      {
        id: "withheld-shell-handoff",
        label: "Handoff to future executor",
        state: "future",
        detail: "A future executor would own root connect, bridge attach, activation, lane apply, and rollback."
      }
    ],
    futureExecutorSlots: [
      {
        id: "slot-shell-approval",
        label: "Approval gate",
        state: "planned",
        detail: "Future slot for explicit permission and audit metadata before any host mutation."
      },
      {
        id: "slot-shell-root-connect",
        label: "Root connect executor",
        state: "planned",
        detail: "Future slot for dedicated-root connect and detach semantics."
      },
      {
        id: "slot-shell-lifecycle",
        label: "Connector lifecycle runner",
        state: "planned",
        detail: "Future slot for activate/deactivate handling around external connector processes."
      },
      {
        id: "slot-shell-lane-apply",
        label: "Lane apply coordinator",
        state: "planned",
        detail: "Future slot for rollback-aware apply across bridge state, runtime state, and lifecycle."
      }
    ],
    hostExecutor: buildToolsMcpHostExecutorState(probe, controlSession)
  });
}

function buildRootBoundarySummary(
  probe: LiveToolsMcpProbe,
  controlSession: ToolsMcpLocalControlSession,
  cachedCuratedPlugins: string[],
  spec: Pick<BoundarySummaryInput, "id" | "title" | "summary" | "currentLayer" | "nextLayer" | "tone">
): StudioBoundarySummary {
  const preferredRootTarget = getPreferredRootTarget(probe);
  const attachSourceOrder = buildAttachSourceOrder(probe, cachedCuratedPlugins);
  const localRootCapability: StudioBoundarySummary["capabilities"][number]["state"] =
    controlSession.rootSelection.status === "selected"
      ? "ready"
      : preferredRootTarget.path !== null
        ? "partial"
        : "blocked";

  return createBoundarySummary({
    ...spec,
    policy: {
      posture: spec.currentLayer === "preview-host" ? "Preview-host / withheld" : "Alpha local-only",
      approvalMode: "Explicit host approval required",
      detail:
        "Root connect may be described and staged locally, but it cannot open a live root connection, write runtime state, or launch connector lifecycle steps in this round.",
      protectedSurfaces: ["~/.openclaw MCP/runtime roots", "bridge registration state", "external connector processes"]
    },
    progressionDetails: {
      localOnly: "Studio can select a preferred root only inside the in-memory control session.",
      previewHost: "Preview-host explains the withheld live root connect path and now maps it into disabled slot, approval, audit, and rollback placeholders.",
      withheld: "Live root connect remains blocked behind policy and missing approval even though a disabled host bridge skeleton now exists.",
      futureExecutor: "A future root executor would take over real connect, detach, and rollback-aware failure handling from the disabled bridge stub."
    },
    capabilities: [
      {
        id: "cap-root-detail",
        label: "Read-only root scan",
        state: "ready",
        detail: "Known MCP root candidates can be scanned and rendered safely."
      },
      {
        id: "cap-root-dry-run",
        label: "Dry-run root connect",
        state: "ready",
        detail: "The root connect path can expose target, blockers, step order, and predicted outcome without mutation."
      },
      {
        id: "cap-root-local",
        label: "Studio-local root select",
        state: localRootCapability,
        detail:
          controlSession.rootSelection.status === "selected"
            ? `Selected ${shortenHomePath(controlSession.rootSelection.path)} inside Studio-local control state.`
            : preferredRootTarget.path !== null
              ? `A root target is resolvable (${shortenHomePath(preferredRootTarget.path)}), but local selection is not yet committed.`
              : "No root target is currently resolvable from dedicated roots or fallback load paths."
      },
      {
        id: "cap-root-preview",
        label: "Preview-host root contract",
        state: "ready",
        detail: "Policy, capabilities, blocked reasons, preconditions, withheld plan, and executor slots are all surfaced."
      },
      {
        id: "cap-root-executor",
        label: "Root connect executor",
        state: "partial",
        detail: "A disabled root-connect bridge slot now exists for placeholder handoff, but it cannot mutate host/runtime root state."
      }
    ],
    blockedReasons: [
      {
        code: "policy-no-host-execution",
        layer: "withheld" as const,
        label: "Alpha policy blocks live root connect",
        detail: "No host-side root registration or connector lifecycle mutation is permitted."
      },
      {
        code: "approval-required",
        layer: "withheld" as const,
        label: "Approval gate is missing",
        detail: "The current bridge has no permission grant for host-side root connect."
      },
      {
        code: "host-bridge-missing",
        layer: "withheld" as const,
        label: "Host mutation bridge stays default-disabled",
        detail: "The renderer can now inspect, map, and validate root-connect handoff placeholders, but it still cannot execute the host mutation."
      },
      ...(preferredRootTarget.path === null
        ? [
            {
              code: "dedicated-root-missing" as const,
              layer: "withheld" as const,
              label: "No dedicated root target is resolved",
              detail: "Known MCP roots did not yield a usable target for a future live connect."
            }
          ]
        : preferredRootTarget.mode === "plugin load path fallback"
          ? [
              {
                code: "dedicated-root-missing" as const,
                layer: "withheld" as const,
                label: "Only fallback root targeting is available",
                detail: "Plugin load-path fallback is insufficient for a true dedicated-root host connect."
              }
            ]
          : []),
      ...(attachSourceOrder.length === 0
        ? [
            {
              code: "bridge-sources-partial" as const,
              layer: "withheld" as const,
              label: "Supporting bridge metadata is missing",
              detail: "A future root connect would still lack follow-on bridge context."
            }
          ]
        : []),
      {
        code: "executor-slot-missing",
        layer: "future-executor" as const,
        label: "Future root executor is still not live",
        detail: "Phase 25 wires a disabled root slot placeholder with simulated outcomes, clearer slot-state focus context, and persisted page-level focus controls, but no host/runtime executor is implemented."
      }
    ],
    requiredPreconditions: [
      {
        id: "precondition-root-target",
        label: "Dedicated root target",
        state: resolvePreconditionState(probe.discoveredMcpRoots.length > 0, preferredRootTarget.mode === "plugin load path fallback"),
        detail:
          preferredRootTarget.path !== null
            ? `${shortenHomePath(preferredRootTarget.path)} (${preferredRootTarget.mode})`
            : "No target is currently resolved."
      },
      {
        id: "precondition-root-context",
        label: "Supporting bridge context",
        state: resolvePreconditionState(attachSourceOrder.length > 0),
        detail: attachSourceOrder.length > 0 ? attachSourceOrder.join(" -> ") : "No bridge source layers are available."
      },
      {
        id: "precondition-root-approval",
        label: "Host approval handshake",
        state: "missing",
        detail: "A typed permission grant must exist before live host connect can be attempted."
      },
      {
        id: "precondition-root-executor",
        label: "Root connect executor",
        state: "missing",
        detail: "The bridge needs a dedicated root-connect mutation slot instead of read-only detail/result payloads."
      },
      {
        id: "precondition-root-rollback",
        label: "Detach and rollback semantics",
        state: "missing",
        detail: "A failed live root connect would need audited rollback and detach behavior."
      }
    ],
    withheldExecutionPlan: [
      {
        id: "withheld-root-resolve",
        label: "Resolve the preferred root target",
        state: "planned",
        detail:
          preferredRootTarget.path !== null
            ? `${shortenHomePath(preferredRootTarget.path)} (${preferredRootTarget.mode})`
            : "Current scan results do not produce a target."
      },
      {
        id: "withheld-root-validate",
        label: "Validate target readability and shape",
        state: preferredRootTarget.path !== null ? "planned" : "withheld",
        detail: preferredRootTarget.path !== null ? "Future executor would confirm file/directory semantics before connect." : "Validation cannot proceed without a target."
      },
      {
        id: "withheld-root-approval",
        label: "Request host approval",
        state: "withheld",
        detail: "Approval is outside the current bridge contract."
      },
      {
        id: "withheld-root-execute",
        label: "Handoff to root connect executor",
        state: "future",
        detail: "A future executor slot would perform live connect, detach, and rollback behavior."
      }
    ],
    futureExecutorSlots: [
      {
        id: "slot-root-approval",
        label: "Root connect approval gate",
        state: "planned",
        detail: "Future slot for explicit permission and audit metadata."
      },
      {
        id: "slot-root-executor",
        label: "Root connect executor",
        state: "planned",
        detail: "Future slot for idempotent host/runtime root connect and detach."
      },
      {
        id: "slot-root-rollback",
        label: "Root rollback adapter",
        state: "planned",
        detail: "Future slot for unwind behavior when a live connect fails after partial registration."
      }
    ],
    hostExecutor: buildToolsMcpHostExecutorState(probe, controlSession)
  });
}

function buildConnectorBoundarySummary(
  probe: LiveToolsMcpProbe,
  controlSession: ToolsMcpLocalControlSession,
  cachedCuratedPlugins: string[],
  spec: Pick<BoundarySummaryInput, "id" | "title" | "summary" | "currentLayer" | "nextLayer" | "tone">
): StudioBoundarySummary {
  const attachSourceOrder =
    controlSession.bridgeStage.sourceOrder.length > 0 ? controlSession.bridgeStage.sourceOrder : buildAttachSourceOrder(probe, cachedCuratedPlugins);
  const activationTarget =
    controlSession.rootSelection.status === "selected" && controlSession.rootSelection.path
      ? {
          label: shortenHomePath(controlSession.rootSelection.path),
          mode: "Studio-local selected root"
        }
      : getConnectorActivationTarget(probe, cachedCuratedPlugins);
  const preferredRootTarget = getPreferredRootTarget(probe);
  const rootOverlay = controlSession.rootSelection.path ?? preferredRootTarget.path;
  const localConnectorCapability: StudioBoundarySummary["capabilities"][number]["state"] =
    controlSession.laneApply.status === "applied" || controlSession.connectorActivation.status === "active"
      ? "ready"
      : controlSession.bridgeStage.status === "staged" ||
          controlSession.bridgeStage.status === "partial" ||
          controlSession.connectorActivation.status === "prepared" ||
          attachSourceOrder.length > 0
        ? "partial"
        : "blocked";
  const activationTargetPartial = activationTarget.mode !== "unresolved" && activationTarget.mode !== "dedicated root";

  return createBoundarySummary({
    ...spec,
    policy: {
      posture: spec.currentLayer === "preview-host" ? "Preview-host / withheld" : "Alpha local-only",
      approvalMode: "Explicit host approval required",
      detail:
        "Connector bridge attach, activation, and lane apply can be inspected, dry-run staged, and replayed only inside Studio-local control state. Host-side lifecycle and apply remain blocked.",
      protectedSurfaces: ["~/.openclaw runtime state", "plugin installs/load paths", "service lifecycle", "external connector processes"]
    },
    progressionDetails: {
      localOnly: "Studio-local bridge stage, activate, and apply can mutate only in-app control state and history.",
      previewHost: "Preview-host surfaces the contract for attach, activate, and apply and now maps each path into disabled slot, approval, audit, and rollback placeholders.",
      withheld: "Host attach, activation, and apply remain blocked until approval, lifecycle runner, and rollback-aware apply exist even though the disabled bridge skeleton now exists.",
      futureExecutor: "Phase 25 wires disabled slot placeholders for attach, lifecycle, apply, rollback coordination, page-level focus controls, and dedicated trace surfacing while keeping the real executor out of scope."
    },
    capabilities: [
      {
        id: "cap-connector-detail",
        label: "Bridge inventory",
        state: "ready",
        detail: "Curated cache, installs, load paths, and roots can be combined into a typed connector detail view."
      },
      {
        id: "cap-connector-dry-run",
        label: "Dry-run attach/activate/apply",
        state: "ready",
        detail: "Connector flows can expose target, blockers, predicted outcome, and withheld plan sections."
      },
      {
        id: "cap-connector-local",
        label: "Studio-local connector controls",
        state: localConnectorCapability,
        detail:
          localConnectorCapability === "ready"
            ? "Connector local control state is staged or active inside Studio."
            : localConnectorCapability === "partial"
              ? "Connector local control surfaces exist, but current attach/activation inputs remain partial."
              : "No staged connector source order or activation target is currently available."
      },
      {
        id: "cap-connector-preview",
        label: "Preview-host connector contract",
        state: "ready",
        detail: "Policy, capability state, blockers, preconditions, withheld plan, and future slots are surfaced for host controls."
      },
      {
        id: "cap-connector-executor",
        label: "Connector lifecycle executor",
        state: "partial",
        detail: "Disabled bridge slots can now map attach, activate, and apply previews into placeholder outcomes, but they cannot touch the live host runtime."
      }
    ],
    blockedReasons: [
      {
        code: "policy-no-host-execution",
        layer: "withheld" as const,
        label: "Alpha policy blocks live connector mutation",
        detail: "No attach, activation, apply, install, restart, or external process control is allowed."
      },
      {
        code: "approval-required",
        layer: "withheld" as const,
        label: "Approval gate is missing",
        detail: "The current bridge has no host execution permission contract."
      },
      {
        code: "host-bridge-missing",
        layer: "withheld" as const,
        label: "Host mutation bridge stays default-disabled",
        detail: "The renderer can now describe and map connector execution through placeholder slot handlers, but it cannot mutate live runtime state."
      },
      ...(attachSourceOrder.length < 2
        ? [
            {
              code: "bridge-sources-partial" as const,
              layer: "withheld" as const,
              label: "Bridge source order is partial",
              detail:
                attachSourceOrder.length === 0
                  ? "No attach source order is available for a live connector handoff."
                  : "Only one source layer is currently available for a future bridge attach."
            }
          ]
        : []),
      ...(activationTarget.mode === "unresolved"
        ? [
            {
              code: "activation-target-missing" as const,
              layer: "withheld" as const,
              label: "Activation target is unresolved",
              detail: "Roots, installs, cache, and load-path fallback do not currently yield a viable host activation target."
            }
          ]
        : []),
      {
        code: "lifecycle-runner-missing",
        layer: "future-executor" as const,
        label: "Lifecycle runner is missing",
        detail: `Target ${activationTarget.label} (${activationTarget.mode}) cannot be started, stopped, or reconciled on the host.`
      },
      {
        code: "rollback-missing",
        layer: "future-executor" as const,
        label: "Rollback-aware apply path is missing",
        detail: "A future apply path still needs coordinated rollback across bridge state, activation state, and runtime configuration."
      }
    ],
    requiredPreconditions: [
      {
        id: "precondition-connector-sources",
        label: "Multi-source bridge order",
        state: resolvePreconditionState(attachSourceOrder.length >= 2, attachSourceOrder.length === 1),
        detail: attachSourceOrder.length > 0 ? attachSourceOrder.join(" -> ") : "No bridge source order is currently available."
      },
      {
        id: "precondition-connector-target",
        label: "Activation target",
        state: resolvePreconditionState(activationTarget.mode !== "unresolved" && !activationTargetPartial, activationTargetPartial),
        detail: `${activationTarget.label} (${activationTarget.mode})`
      },
      {
        id: "precondition-connector-root",
        label: "Root overlay",
        state: resolvePreconditionState(Boolean(rootOverlay), preferredRootTarget.mode === "plugin load path fallback"),
        detail: rootOverlay ? shortenHomePath(rootOverlay) : "No root overlay is available."
      },
      {
        id: "precondition-connector-approval",
        label: "Host approval handshake",
        state: "missing",
        detail: "No typed grant exists for host-side attach, activation, or lane apply."
      },
      {
        id: "precondition-connector-lifecycle",
        label: "Lifecycle runner",
        state: "missing",
        detail: "A future executor needs activate/deactivate/reconcile semantics for host connector state."
      },
      {
        id: "precondition-connector-rollback",
        label: "Rollback-aware lane apply",
        state: "missing",
        detail: "A failed host apply still lacks coordinated rollback across bridge, config, and process lifecycle."
      },
      {
        id: "precondition-connector-smoke",
        label: "Host-side smoke coverage",
        state: "missing",
        detail: "Host apply paths need dedicated smoke and failure-path coverage before enablement."
      }
    ],
    withheldExecutionPlan: [
      {
        id: "withheld-connector-compose",
        label: "Compose bridge source order",
        state: attachSourceOrder.length > 0 ? "planned" : "withheld",
        detail: attachSourceOrder.length > 0 ? attachSourceOrder.join(" -> ") : "Attach source order is currently unavailable."
      },
      {
        id: "withheld-connector-target",
        label: "Validate activation target and root overlay",
        state: activationTarget.mode !== "unresolved" ? "planned" : "withheld",
        detail: `Target ${activationTarget.label} (${activationTarget.mode}) · root overlay ${rootOverlay ? shortenHomePath(rootOverlay) : "none"}`
      },
      {
        id: "withheld-connector-approval",
        label: "Request host approval",
        state: "withheld",
        detail: "Approval is outside the current bridge contract."
      },
      {
        id: "withheld-connector-execute",
        label: "Handoff attach/activate/apply to future executor",
        state: "future",
        detail: "A future executor would own live attach, activation, apply, and failure recovery."
      },
      {
        id: "withheld-connector-rollback",
        label: "Coordinate rollback on failure",
        state: "future",
        detail: "A rollback coordinator would unwind partial attach, activation, or apply state."
      }
    ],
    futureExecutorSlots: [
      {
        id: "slot-connector-approval",
        label: "Connector approval gate",
        state: "planned",
        detail: "Future slot for explicit permission and audit metadata."
      },
      {
        id: "slot-connector-attach",
        label: "Bridge attach executor",
        state: "planned",
        detail: "Future slot for host/runtime bridge registration with detach semantics."
      },
      {
        id: "slot-connector-lifecycle",
        label: "Connector lifecycle runner",
        state: "planned",
        detail: "Future slot for activate/deactivate/reconcile behavior around external connectors."
      },
      {
        id: "slot-connector-apply",
        label: "Lane apply coordinator",
        state: "planned",
        detail: "Future slot for rollback-aware lane apply across bridge, runtime state, and lifecycle."
      }
    ],
    hostExecutor: buildToolsMcpHostExecutorState(probe, controlSession)
  });
}

export function buildToolsMcpShellBoundarySummary(
  probe: LiveToolsMcpProbe,
  controlSession: ToolsMcpLocalControlSession
): StudioBoundarySummary {
  return buildShellBoundarySummary(probe, controlSession);
}

export async function handoffToolsMcpHostPreview(
  itemId: string,
  actionId: string,
  controlSession: ToolsMcpLocalControlSession
): Promise<StudioHostPreviewHandoff | null> {
  const probe = await probeLiveToolsMcp();

  if (probe.source !== "live") {
    return null;
  }

  const cachedCuratedPlugins = await listDirectories(codexPluginCacheRoot);
  return finalizeHostPreviewResolution(resolveHostPreviewForAction(itemId, actionId, probe, controlSession, cachedCuratedPlugins))?.handoff ?? null;
}

function createDryRunBlockers(blockers: string[]): string[] {
  return blockers.length > 0 ? blockers : ["No structural blockers were detected beyond the alpha dry-run policy."];
}

interface DryRunPlanSpec {
  title: string;
  summary: string;
  tone: StudioRuntimeActionResult["tone"];
  targetLines: string[];
  inputLines: string[];
  stepLines: string[];
  outcomeLines: string[];
  blockerLines: string[];
  withheldLines?: string[];
}

function createDryRunResult(itemId: string, actionId: string, spec: DryRunPlanSpec): ToolsMcpActionResultBase {
  return {
    itemId,
    actionId,
    title: spec.title,
    summary: spec.summary,
    source: "runtime",
    tone: spec.tone,
    notices: ["Dry-run only: this action stages a control plan but does not attach, activate, install, restart, or apply anything."],
    sections: [
      {
        id: "dry-run-target",
        title: "Target",
        lines: spec.targetLines
      },
      {
        id: "dry-run-inputs",
        title: "Inputs",
        lines: spec.inputLines
      },
      {
        id: "dry-run-steps",
        title: "Step order",
        lines: spec.stepLines
      },
      {
        id: "dry-run-outcome",
        title: "Predicted outcome",
        lines: spec.outcomeLines
      },
      {
        id: "dry-run-blockers",
        title: "Blockers",
        lines: createDryRunBlockers(spec.blockerLines)
      },
      {
        id: "dry-run-withheld",
        title: "Execution withheld",
        lines:
          spec.withheldLines ??
          [
            "control gate · the shell stops after planning and never opens a live control path here",
            "policy gate · no writes, installs, restarts, apply steps, or lifecycle mutations are permitted in this round"
          ]
      }
    ]
  };
}

interface LocalExecutionSpec {
  title: string;
  summary: string;
  tone: StudioRuntimeActionResult["tone"];
  boundary: StudioBoundarySummary;
  executionLines: string[];
  stateLines: string[];
  historyScope: "root" | "connector";
}

function createLocalExecutionResult(
  itemId: string,
  actionId: string,
  controlSession: ToolsMcpLocalControlSession,
  spec: LocalExecutionSpec
): ToolsMcpActionResultBase {
  return {
    itemId,
    actionId,
    title: spec.title,
    summary: spec.summary,
    source: "runtime",
    tone: spec.tone,
    boundary: spec.boundary,
    notices: [
      "Executed locally inside Studio only: this action mutated the in-memory control session and execution history, not ~/.openclaw or any external runtime surface."
    ],
    sections: [
      {
        id: "local-control-execution",
        title: "Executed step",
        lines: spec.executionLines
      },
      {
        id: "local-control-state",
        title: "Local control state",
        lines: spec.stateLines
      },
      {
        id: "local-control-history",
        title: "Execution history",
        lines: getHistoryLines(controlSession, spec.historyScope === "root" ? "mcp-root-scan" : "mcp-adjacent-runtime")
      },
      {
        id: "local-control-boundary",
        title: "Local-only boundary",
        lines: buildLocalOnlyBoundaryLines()
      }
    ]
  };
}

function createHostBoundaryBlockers(blockers: string[]): string[] {
  return [
    "This action is withheld by the current alpha host/runtime control boundary.",
    "A typed host executor bridge skeleton is exposed here, but it stays default-disabled and cannot mutate live runtime state for this control path.",
    ...blockers
  ];
}

function buildHostPermissionBoundaryLines(actionClass: string, protectedSurfaces: string[]): string[] {
  return [
    `execution class · ${actionClass}`,
    "bridge boundary · Studio stops at read-only detail, dry-run planning, and Studio-local control state",
    "bridge posture · preview-to-slot handoff exists only as a disabled placeholder bridge skeleton",
    `protected surfaces · ${protectedSurfaces.join(" · ")}`,
    "required permission · explicit host/runtime execution approval would be required before enabling this path"
  ];
}

function buildHostEnablementLines(extraLines: string[]): string[] {
  return [
    "1. Keep the bridge default-disabled until a real executor can mutate runtime state safely instead of returning placeholder slot results.",
    "2. Require an explicit permission grant for host writes, lifecycle changes, or external process launches.",
    ...extraLines.map((line, index) => `${index + 3}. ${line}`)
  ];
}

function buildBoundaryCapabilityLines(boundary: StudioBoundarySummary): string[] {
  return boundary.capabilities.map((capability) => `${capability.label} · ${capability.state} · ${capability.detail}`);
}

function buildBoundaryPreconditionLines(boundary: StudioBoundarySummary): string[] {
  return boundary.requiredPreconditions.map((precondition) => `${precondition.label} · ${precondition.state} · ${precondition.detail}`);
}

function buildBoundaryPlanLines(boundary: StudioBoundarySummary): string[] {
  return boundary.withheldExecutionPlan.map((step) => `${step.label} · ${step.state} · ${step.detail}`);
}

function buildBoundaryExecutorSlotLines(boundary: StudioBoundarySummary): string[] {
  return boundary.futureExecutorSlots.map((slot) => `${slot.label} · ${slot.state} · ${slot.detail}`);
}

interface HostBoundarySpec {
  title: string;
  summary: string;
  tone: StudioRuntimeActionResult["tone"];
  boundary: StudioBoundarySummary;
  hostPreview?: StudioHostMutationPreview;
  hostHandoff?: StudioHostPreviewHandoff;
  actionLines: string[];
  readinessLines: string[];
  blockerLines: string[];
  permissionLines: string[];
  capabilityLines: string[];
  preconditionLines: string[];
  planLines: string[];
  executorSlotLines: string[];
  enablementLines: string[];
}

function createHostBoundaryResult(itemId: string, actionId: string, spec: HostBoundarySpec): ToolsMcpActionResultBase {
  const bridgeSections =
    spec.hostPreview && spec.hostHandoff ? createHostBridgeHandoffSections(spec.boundary.hostExecutor, spec.hostPreview, spec.hostHandoff) : [];

  return {
    itemId,
    actionId,
    title: spec.title,
    summary: spec.summary,
    source: "runtime",
    tone: spec.tone,
    boundary: spec.boundary,
    hostPreview: spec.hostPreview,
    hostHandoff: spec.hostHandoff,
    notices: [
      "Host/runtime execution remains blocked in this round. This result only describes the boundary, current blockers, and enablement conditions.",
      "No host-side state was touched: no config edits, no plugin installs, no service changes, and no external processes were started.",
      ...(bridgeSections.length > 0
        ? ["Phase25 also maps this preview into a default-disabled slot handoff, validator pass/fail state, page-level focus visibility, simulated outcomes, and placeholder approval/audit/rollback trace linkage."]
        : [])
    ],
    sections: [
      {
        id: "host-boundary-action",
        title: "Host action",
        lines: spec.actionLines
      },
      {
        id: "host-boundary-readiness",
        title: "Current readiness",
        lines: spec.readinessLines
      },
      {
        id: "host-boundary-blockers",
        title: "Why execution is withheld",
        lines: createHostBoundaryBlockers(spec.blockerLines)
      },
      {
        id: "host-boundary-permission",
        title: "Permission boundary",
        lines: spec.permissionLines
      },
      {
        id: "host-boundary-capabilities",
        title: "Capability state",
        lines: spec.capabilityLines
      },
      {
        id: "host-boundary-preconditions",
        title: "Required preconditions",
        lines: spec.preconditionLines
      },
      {
        id: "host-boundary-plan",
        title: "Withheld execution plan",
        lines: spec.planLines
      },
      {
        id: "host-boundary-executor-slots",
        title: "Future executor slots",
        lines: spec.executorSlotLines
      },
      {
        id: "host-boundary-enablement",
        title: "Required before enabling",
        lines: spec.enablementLines
      },
      ...bridgeSections
    ]
  };
}

function getDetailActions(itemId: string): StudioRuntimeAction[] {
  return listToolsMcpActions(itemId);
}

function createActionExecution(action: StudioRuntimeAction): StudioRuntimeActionExecution {
  return {
    status: action.safety === "preview-host" ? "blocked" : "completed",
    safety: action.safety,
    detailRefresh: action.refreshDetailOnSuccess ? "required" : "not-needed"
  };
}

function attachToolsMcpActionContract(result: ToolsMcpActionResultBase, action: StudioRuntimeAction): StudioRuntimeActionResult {
  return {
    ...result,
    action,
    execution: createActionExecution(action)
  };
}

export async function probeLiveToolsMcp(): Promise<LiveToolsMcpProbe> {
  const [
    openclawConfig,
    codexConfigPresent,
    codexAuthPresent,
    codexSessionsPresent,
    codexShellSnapshotsPresent,
    codexPluginCachePresent,
    codexPluginTempRepoPresent,
    toolingRootPresent,
    playwrightRunnerPresent,
    hookNames,
    discoveredMcpRoots
  ] = await Promise.all([
    readJsonFile<OpenClawConfig>(openclawConfigPath),
    pathExists(codexConfigPath),
    pathExists(codexAuthPath),
    pathExists(codexSessionsRoot),
    pathExists(codexShellSnapshotsRoot),
    pathExists(codexPluginCacheRoot),
    pathExists(codexPluginTempRepoRoot),
    pathExists(workspaceToolingRoot),
    pathExists(playwrightRunnerRoot),
    listDirectories(hooksRoot),
    Promise.all(knownMcpRoots.map(async (root) => ((await pathExists(root)) ? root : null))).then((roots) =>
      roots.filter((root): root is string => root !== null)
    )
  ]);

  const hasLiveSignal =
    Boolean(openclawConfig?.tools) ||
    Boolean(openclawConfig?.plugins) ||
    codexConfigPresent ||
    codexAuthPresent ||
    codexPluginCachePresent ||
    toolingRootPresent ||
    discoveredMcpRoots.length > 0;

  return {
    source: hasLiveSignal ? "live" : "mock",
    openclawConfigPath,
    openclawToolProfile: openclawConfig?.tools?.profile ?? null,
    openclawAlsoAllow: openclawConfig?.tools?.alsoAllow ?? [],
    execSecurity: openclawConfig?.tools?.exec?.security ?? null,
    execAsk: openclawConfig?.tools?.exec?.ask ?? null,
    webSearchEnabled: Boolean(openclawConfig?.tools?.web?.search?.enabled),
    webSearchProvider: openclawConfig?.tools?.web?.search?.provider ?? null,
    webFetchEnabled: Boolean(openclawConfig?.tools?.web?.fetch?.enabled),
    pluginAllowCount: openclawConfig?.plugins?.allow?.length ?? 0,
    pluginAllowIds: openclawConfig?.plugins?.allow ?? [],
    pluginEntryCount: Object.keys(openclawConfig?.plugins?.entries ?? {}).length,
    pluginEntryIds: Object.keys(openclawConfig?.plugins?.entries ?? {}).sort(),
    pluginInstallCount: Object.keys(openclawConfig?.plugins?.installs ?? {}).length,
    pluginInstallIds: Object.keys(openclawConfig?.plugins?.installs ?? {}).sort(),
    pluginLoadPaths: openclawConfig?.plugins?.load?.paths ?? [],
    codexConfigPath,
    codexConfigPresent,
    codexAuthPresent,
    codexSessionsPresent,
    codexShellSnapshotsPresent,
    codexPluginCachePresent,
    codexPluginTempRepoPresent,
    toolingRoot: workspaceToolingRoot,
    toolingRootPresent,
    playwrightRunnerPresent,
    hookCount: hookNames.length,
    hookNames,
    mcpRootsScanned: [...knownMcpRoots],
    discoveredMcpRoots
  };
}

export async function readToolsMcpDetail(
  itemId: string,
  controlSession: ToolsMcpLocalControlSession
): Promise<StudioRuntimeDetail | null> {
  const probe = await probeLiveToolsMcp();

  if (probe.source !== "live") {
    return null;
  }

  const [openclawConfig, codexConfigRaw, toolingPackage, playwrightRunnerPackage, cachedCuratedPlugins] = await Promise.all([
    readJsonFile<OpenClawConfig>(openclawConfigPath),
    readTextFile(codexConfigPath),
    readJsonFile<ToolingPackageJson>(path.join(workspaceToolingRoot, "package.json")),
    readJsonFile<ToolingPackageJson>(path.join(playwrightRunnerRoot, "package.json")),
    listDirectories(codexPluginCacheRoot)
  ]);

  switch (itemId) {
    case "tool-openclaw-runtime":
      return {
        id: itemId,
        title: "OpenClaw tool profile detail",
        summary: "Read-only runtime snapshot from openclaw.json tools and hook settings.",
        source: "runtime",
        path: shortenHomePath(probe.openclawConfigPath),
        tone: probe.openclawToolProfile ? "positive" : "warning",
        notices: ["Sensitive auth, gateway, and provider secrets stay redacted; only safe tool/runtime fields are exposed."],
        actions: getDetailActions(itemId),
        sections: [
          {
            id: "tool-profile",
            title: "Tools",
            lines: [
              `profile · ${probe.openclawToolProfile ?? "missing"}`,
              `exec security · ${probe.execSecurity ?? "unknown"}`,
              `exec ask · ${probe.execAsk ?? "unknown"}`,
              `alsoAllow · ${probe.openclawAlsoAllow.join(" · ") || "none"}`
            ]
          },
          {
            id: "tool-web",
            title: "Web",
            lines: [
              `search · ${probe.webSearchEnabled ? `enabled (${probe.webSearchProvider ?? "configured"})` : "disabled"}`,
              `fetch · ${probe.webFetchEnabled ? "enabled" : "disabled"}`
            ]
          },
          {
            id: "tool-hooks",
            title: "Hooks",
            lines: [
              `internal hooks · ${openclawConfig?.hooks?.internal?.enabled === false ? "disabled" : "enabled"}`,
              ...(probe.hookNames.length > 0 ? probe.hookNames.map((hook) => `hook · ${hook}`) : ["hook · none"])
            ]
          },
          {
            id: "tool-permissions",
            title: "Permission regression matrix",
            lines: buildRuntimePermissionMatrix(probe.openclawAlsoAllow).map((assessment) => formatRuntimeCommandAssessment(assessment))
          },
          {
            id: "tool-allow-rules",
            title: "Allow rules",
            lines: buildRuntimeRuleMatchLines(probe.openclawAlsoAllow)
          }
        ]
      };
    case "tool-openclaw-plugins":
      return {
        id: itemId,
        title: "OpenClaw plugin runtime detail",
        summary: "Sanitized plugin manifest assembled from openclaw.json allow/entries/install metadata.",
        source: "runtime",
        path: shortenHomePath(probe.openclawConfigPath),
        tone: probe.pluginInstallCount > 0 ? "positive" : "neutral",
        notices: ["Only install metadata and safe manifest fields are shown; embedded plugin config secrets are not forwarded."],
        actions: getDetailActions(itemId),
        sections: [
          {
            id: "plugin-allow",
            title: "Allow list",
            lines: probe.pluginAllowIds.length > 0 ? probe.pluginAllowIds.map((id) => `allow · ${id}`) : ["allow · none"]
          },
          {
            id: "plugin-entries",
            title: "Entries",
            lines: buildOpenClawPluginEntryLines(openclawConfig).length > 0 ? buildOpenClawPluginEntryLines(openclawConfig) : ["entry · none"]
          },
          {
            id: "plugin-installs",
            title: "Installs",
            lines: buildOpenClawInstallLines(openclawConfig).length > 0 ? buildOpenClawInstallLines(openclawConfig) : ["install · none"]
          },
          {
            id: "plugin-load-paths",
            title: "Load paths",
            lines: probe.pluginLoadPaths.length > 0 ? probe.pluginLoadPaths.map((pluginPath) => shortenHomePath(pluginPath)) : ["No additional plugin load paths configured."]
          }
        ]
      };
    case "tool-codex-runtime":
      return {
        id: itemId,
        title: "Codex local runtime detail",
        summary: "Read-only Codex runtime view assembled from safe config lines and local filesystem presence checks.",
        source: "runtime",
        path: shortenHomePath(probe.codexConfigPath),
        tone: probe.codexConfigPresent && probe.codexAuthPresent && probe.codexSessionsPresent ? "positive" : "neutral",
        notices: ["Only safe config lines are exposed; tokens, auth blobs, and raw session content remain hidden."],
        actions: getDetailActions(itemId),
        sections: [
          {
            id: "codex-presence",
            title: "Presence",
            lines: [
              `config · ${formatPresence(probe.codexConfigPresent)}`,
              `auth · ${formatPresence(probe.codexAuthPresent)}`,
              `sessions root · ${formatPresence(probe.codexSessionsPresent)} (${shortenHomePath(codexSessionsRoot)})`,
              `shell snapshots · ${formatPresence(probe.codexShellSnapshotsPresent)} (${shortenHomePath(codexShellSnapshotsRoot)})`,
              `plugin cache · ${formatPresence(probe.codexPluginCachePresent)} (${shortenHomePath(codexPluginCacheRoot)})`,
              `temp plugin checkout · ${formatPresence(probe.codexPluginTempRepoPresent)} (${shortenHomePath(codexPluginTempRepoRoot)})`
            ]
          },
          {
            id: "codex-config",
            title: "Safe config snippet",
            lines: extractSafeCodexConfigLines(codexConfigRaw).length > 0 ? extractSafeCodexConfigLines(codexConfigRaw) : ["No safe config snippet available."]
          },
          {
            id: "codex-cache",
            title: "Curated plugin cache",
            lines: cachedCuratedPlugins.length > 0 ? cachedCuratedPlugins.map((entry) => `${entry} · ${shortenHomePath(path.join(codexPluginCacheRoot, entry))}`) : ["No curated plugin cache directories found."]
          }
        ]
      };
    case "tool-workspace-tooling":
      return {
        id: itemId,
        title: "Workspace tooling detail",
        summary: "Read-only inventory of the shared workspace tooling root, package manifests, and hook directories.",
        source: "runtime",
        path: shortenHomePath(probe.toolingRoot),
        tone: probe.toolingRootPresent ? "positive" : "warning",
        actions: getDetailActions(itemId),
        sections: [
          {
            id: "tooling-root",
            title: "Tooling root",
            lines: [
              `${shortenHomePath(probe.toolingRoot)} · ${probe.toolingRootPresent ? "present" : "missing"}`,
              `playwright runner · ${probe.playwrightRunnerPresent ? "present" : "missing"}`
            ]
          },
          {
            id: "tooling-packages",
            title: "Package manifests",
            lines: [
              toolingPackage?.dependencies?.playwright ? `workspace playwright · ${toolingPackage.dependencies.playwright}` : "workspace playwright · unavailable",
              playwrightRunnerPackage?.name ? `runner package · ${playwrightRunnerPackage.name}@${playwrightRunnerPackage.version ?? "0.0.0"}` : "runner package · unavailable",
              playwrightRunnerPackage?.dependencies?.playwright ? `runner playwright · ${playwrightRunnerPackage.dependencies.playwright}` : "runner playwright · unavailable"
            ]
          },
          {
            id: "tooling-hooks",
            title: "Hook directories",
            lines: probe.hookNames.length > 0 ? probe.hookNames.map((hook) => `${hook} · ${shortenHomePath(path.join(hooksRoot, hook))}`) : ["No workspace hook directories detected."]
          }
        ]
      };
    case "mcp-root-scan": {
      const rootBoundary = buildRootBoundarySummary(probe, controlSession, cachedCuratedPlugins, {
        id: "boundary-root-detail",
        title: "Dedicated MCP root boundary",
        summary:
          "Root scanning can drive dry-run planning, Studio-local root selection, and preview-host contract visibility, but live host root connect remains withheld.",
        currentLayer: "local-only",
        nextLayer: "preview-host",
        tone: getRootDetailTone(controlSession, probe.discoveredMcpRoots.length > 0 ? "positive" : "warning")
      });

      return {
        id: itemId,
        title: "Dedicated MCP root scan detail",
        summary:
          "Known MCP roots were scanned directly; this view shows which paths exist, which remain absent, how the Studio-local root selection session currently stands, and where the blocked host/runtime connect boundary begins.",
        source: "runtime",
        path: shortenHomePath(probe.mcpRootsScanned[0] ?? null),
        boundary: rootBoundary,
        tone: rootBoundary.tone,
        notices: [
          "Dry-run actions on this row stay planning-only.",
          "Execute-local actions mutate only the Studio-local in-memory control session and execution history; they never touch ~/.openclaw, plugin installs, services, config files, or external processes.",
          "Preview-host actions describe withheld host/runtime controls only; they do not execute against the host runtime."
        ],
        actions: getDetailActions(itemId),
        sections: [
          {
            id: "mcp-scan",
            title: "Scanned roots",
            lines: buildRootStatusLines(probe.mcpRootsScanned, probe.discoveredMcpRoots)
          },
          {
            id: "mcp-discovered",
            title: "Discovered roots",
            lines:
              probe.discoveredMcpRoots.length > 0
                ? probe.discoveredMcpRoots.map((root) => shortenHomePath(root))
                : ["No dedicated MCP root was detected on this machine."]
          },
          {
            id: "mcp-root-host-boundary",
            title: "Host/runtime boundary",
            lines: buildRootHostBoundarySummaryLines(probe, controlSession, cachedCuratedPlugins)
          },
          ...getRootDetailSections(controlSession)
        ]
      };
    }
    case "mcp-adjacent-runtime": {
      const connectorBoundary = buildConnectorBoundarySummary(probe, controlSession, cachedCuratedPlugins, {
        id: "boundary-connector-detail",
        title: "Connector runtime boundary",
        summary:
          "Connector bridge attach, activation, and lane apply can be staged locally and previewed structurally, but host-side execution remains withheld behind policy and future executor slots.",
        currentLayer: "local-only",
        nextLayer: "preview-host",
        tone: getConnectorDetailTone(controlSession, probe.codexPluginCachePresent || probe.pluginInstallCount > 0 ? "neutral" : "warning")
      });

      return {
        id: itemId,
        title: "Connector-adjacent runtime detail",
        summary:
          "Read-only bridge inventory combining Codex plugin cache, OpenClaw plugin installs, load paths, and MCP scan results, plus Studio-local executable control state and an explicit blocked host/runtime boundary layer for attach, activate, and apply flows.",
        source: "runtime",
        path: shortenHomePath(probe.pluginLoadPaths[0] ?? probe.codexConfigPath),
        boundary: connectorBoundary,
        tone: connectorBoundary.tone,
        notices: [
          "Dry-run connector controls remain planning-only.",
          "Execute-local connector controls update only the Studio-local in-memory control session and history; they do not register bridges, activate plugins, install anything, restart services, or write config.",
          "Preview-host connector actions describe withheld host/runtime controls only; they do not attach bridges, activate connectors, or apply lanes on the host."
        ],
        actions: getDetailActions(itemId),
        sections: [
          {
            id: "connector-cache",
            title: "Codex curated cache",
            lines: [
              `cache root · ${shortenHomePath(codexPluginCacheRoot)} · ${formatPresence(probe.codexPluginCachePresent)}`,
              ...(cachedCuratedPlugins.length > 0 ? cachedCuratedPlugins.map((entry) => `cached plugin · ${entry}`) : ["cached plugin · none"]),
              `temp repo · ${shortenHomePath(codexPluginTempRepoRoot)} · ${formatPresence(probe.codexPluginTempRepoPresent)}`
            ]
          },
          {
            id: "connector-openclaw",
            title: "OpenClaw bridge surfaces",
            lines: [
              ...(probe.pluginInstallIds.length > 0 ? probe.pluginInstallIds.map((id) => `install · ${id}`) : ["install · none"]),
              ...(probe.pluginLoadPaths.length > 0 ? probe.pluginLoadPaths.map((pluginPath) => `load path · ${shortenHomePath(pluginPath)}`) : ["load path · none"])
            ]
          },
          {
            id: "connector-mcp",
            title: "Dedicated MCP roots",
            lines: buildRootStatusLines(probe.mcpRootsScanned, probe.discoveredMcpRoots)
          },
          {
            id: "mcp-connector-host-boundary",
            title: "Host/runtime boundary",
            lines: buildConnectorHostBoundarySummaryLines(probe, controlSession, cachedCuratedPlugins)
          },
          ...getConnectorDetailSections(controlSession)
        ]
      };
    }
    default:
      return null;
  }
}

async function runToolsMcpActionInternal(
  itemId: string,
  actionId: string,
  controlSession: ToolsMcpLocalControlSession
): Promise<ToolsMcpActionResultBase | null> {
  const probe = await probeLiveToolsMcp();

  if (probe.source !== "live") {
    return null;
  }

  const [openclawConfig, codexConfigRaw, toolingPackage, playwrightRunnerPackage, cachedCuratedPlugins] = await Promise.all([
    readJsonFile<OpenClawConfig>(openclawConfigPath),
    readTextFile(codexConfigPath),
    readJsonFile<ToolingPackageJson>(path.join(workspaceToolingRoot, "package.json")),
    readJsonFile<ToolingPackageJson>(path.join(playwrightRunnerRoot, "package.json")),
    listDirectories(codexPluginCacheRoot)
  ]);

  switch (`${itemId}:${actionId}`) {
    case "tool-openclaw-runtime:probe-config":
      return {
        itemId,
        actionId,
        title: "OpenClaw config probe",
        summary: "Refreshed safe summary of tool, web, hook, and permission settings.",
        source: "runtime",
        tone: probe.openclawToolProfile ? "positive" : "warning",
        sections: [
          {
            id: "probe-tool-config",
            title: "Safe summary",
            lines: [
              `profile · ${probe.openclawToolProfile ?? "missing"}`,
              `exec security · ${probe.execSecurity ?? "unknown"}`,
              `exec ask · ${probe.execAsk ?? "unknown"}`,
              `search · ${probe.webSearchEnabled ? `enabled (${probe.webSearchProvider ?? "configured"})` : "disabled"}`,
              `fetch · ${probe.webFetchEnabled ? "enabled" : "disabled"}`
            ]
          },
          {
            id: "action-command-policy",
            title: "Permission regression matrix",
            lines: buildRuntimePermissionMatrix(probe.openclawAlsoAllow).map((assessment) => formatRuntimeCommandAssessment(assessment))
          },
          {
            id: "action-allow-rules",
            title: "Allow rules",
            lines: buildRuntimeRuleMatchLines(probe.openclawAlsoAllow)
          }
        ]
      };
    case "tool-openclaw-runtime:test-web-readiness":
      return {
        itemId,
        actionId,
        title: "OpenClaw web readiness",
        summary: "Safe readiness check for search/fetch runtime capability without making outbound requests.",
        source: "runtime",
        tone: probe.webSearchEnabled && probe.webFetchEnabled ? "positive" : probe.webSearchEnabled || probe.webFetchEnabled ? "neutral" : "warning",
        sections: [
          {
            id: "action-web-readiness",
            title: "Web readiness",
            lines: [
              `search enabled · ${probe.webSearchEnabled ? "yes" : "no"}`,
              `search provider · ${probe.webSearchProvider ?? "unconfigured"}`,
              `fetch enabled · ${probe.webFetchEnabled ? "yes" : "no"}`,
              `readiness verdict · ${probe.webSearchEnabled && probe.webFetchEnabled ? "ready for safe web tasks" : probe.webSearchEnabled || probe.webFetchEnabled ? "partial" : "disabled"}`
            ]
          }
        ]
      };
    case "tool-openclaw-runtime:list-hooks":
      return {
        itemId,
        actionId,
        title: "Workspace hooks",
        summary: "Current workspace hook directory inventory.",
        source: "runtime",
        tone: probe.hookNames.length > 0 ? "positive" : "neutral",
        sections: [
          {
            id: "action-hooks",
            title: "Hooks",
            lines: probe.hookNames.length > 0 ? probe.hookNames.map((hook) => `${hook} · ${shortenHomePath(path.join(hooksRoot, hook))}`) : ["No workspace hook directories detected."]
          },
          {
            id: "action-hook-state",
            title: "Internal hook switch",
            lines: [`internal hooks · ${openclawConfig?.hooks?.internal?.enabled === false ? "disabled" : "enabled"}`]
          }
        ]
      };
    case "tool-openclaw-plugins:list-installs":
      return {
        itemId,
        actionId,
        title: "OpenClaw plugin installs",
        summary: "Sanitized install manifest refresh.",
        source: "runtime",
        tone: probe.pluginInstallCount > 0 ? "positive" : "neutral",
        sections: [
          {
            id: "action-plugin-installs",
            title: "Installs",
            lines: buildOpenClawInstallLines(openclawConfig).length > 0 ? buildOpenClawInstallLines(openclawConfig) : ["install · none"]
          }
        ]
      };
    case "tool-openclaw-plugins:list-entries":
      return {
        itemId,
        actionId,
        title: "OpenClaw plugin entries",
        summary: "Current plugin entry enabled-state inventory.",
        source: "runtime",
        tone: probe.pluginEntryCount > 0 ? "positive" : "neutral",
        sections: [
          {
            id: "action-plugin-entries",
            title: "Entries",
            lines: buildOpenClawPluginEntryLines(openclawConfig).length > 0 ? buildOpenClawPluginEntryLines(openclawConfig) : ["entry · none"]
          }
        ]
      };
    case "tool-openclaw-plugins:validate-plugin-bridge":
      return {
        itemId,
        actionId,
        title: "Plugin bridge validation",
        summary: "Safe prerequisite check for the plugin bridge surface.",
        source: "runtime",
        tone: probe.pluginInstallCount > 0 && probe.pluginEntryCount > 0 ? "positive" : probe.pluginInstallCount > 0 || probe.pluginEntryCount > 0 ? "neutral" : "warning",
        sections: [
          {
            id: "action-plugin-bridge-validation",
            title: "Prerequisites",
            lines: [
              `installs · ${probe.pluginInstallCount}`,
              `entries · ${probe.pluginEntryCount}`,
              `allow rules · ${probe.pluginAllowCount}`,
              `load paths · ${probe.pluginLoadPaths.length}`,
              `validation verdict · ${probe.pluginInstallCount > 0 && probe.pluginEntryCount > 0 ? "ready for read-only bridge inspection" : probe.pluginInstallCount > 0 || probe.pluginEntryCount > 0 ? "partial" : "sparse"}`
            ]
          }
        ]
      };
    case "tool-codex-runtime:probe-presence":
      return {
        itemId,
        actionId,
        title: "Codex runtime presence probe",
        summary: "Fresh filesystem presence check for Codex runtime surfaces.",
        source: "runtime",
        tone: probe.codexConfigPresent && probe.codexAuthPresent && probe.codexSessionsPresent ? "positive" : "neutral",
        sections: [
          {
            id: "action-codex-presence",
            title: "Presence",
            lines: [
              `config · ${formatPresence(probe.codexConfigPresent)}`,
              `auth · ${formatPresence(probe.codexAuthPresent)}`,
              `sessions root · ${formatPresence(probe.codexSessionsPresent)}`,
              `shell snapshots · ${formatPresence(probe.codexShellSnapshotsPresent)}`,
              `plugin cache · ${formatPresence(probe.codexPluginCachePresent)}`,
              `temp plugin checkout · ${formatPresence(probe.codexPluginTempRepoPresent)}`
            ]
          }
        ]
      };
    case "tool-codex-runtime:list-curated-plugins":
      return {
        itemId,
        actionId,
        title: "Codex curated plugins",
        summary: "Current curated plugin cache inventory plus safe config snippet.",
        source: "runtime",
        tone: cachedCuratedPlugins.length > 0 ? "positive" : "neutral",
        notices: ["Safe config lines only; no auth blobs or raw secrets are exposed."],
        sections: [
          {
            id: "action-curated-plugins",
            title: "Curated cache",
            lines: cachedCuratedPlugins.length > 0 ? cachedCuratedPlugins.map((entry) => `${entry} · ${shortenHomePath(path.join(codexPluginCacheRoot, entry))}`) : ["No curated plugin cache directories found."]
          },
          {
            id: "action-safe-config",
            title: "Safe config snippet",
            lines: extractSafeCodexConfigLines(codexConfigRaw).slice(0, 10).length > 0 ? extractSafeCodexConfigLines(codexConfigRaw).slice(0, 10) : ["No safe config snippet available."]
          }
        ]
      };
    case "tool-codex-runtime:validate-runtime-readiness":
      return {
        itemId,
        actionId,
        title: "Codex runtime readiness",
        summary: "Safe readiness check for local Codex runtime prerequisites.",
        source: "runtime",
        tone: probe.codexConfigPresent && probe.codexAuthPresent && probe.codexSessionsPresent ? "positive" : probe.codexConfigPresent || probe.codexAuthPresent || probe.codexSessionsPresent ? "neutral" : "warning",
        sections: [
          {
            id: "action-codex-readiness",
            title: "Runtime readiness",
            lines: [
              `config · ${formatPresence(probe.codexConfigPresent)}`,
              `auth · ${formatPresence(probe.codexAuthPresent)}`,
              `sessions · ${formatPresence(probe.codexSessionsPresent)}`,
              `shell snapshots · ${formatPresence(probe.codexShellSnapshotsPresent)}`,
              `curated cache · ${formatPresence(probe.codexPluginCachePresent)}`,
              `readiness verdict · ${probe.codexConfigPresent && probe.codexAuthPresent && probe.codexSessionsPresent ? "ready" : probe.codexConfigPresent || probe.codexAuthPresent || probe.codexSessionsPresent ? "partial" : "missing"}`
            ]
          }
        ]
      };
    case "tool-workspace-tooling:list-hooks":
      return {
        itemId,
        actionId,
        title: "Workspace hook inventory",
        summary: "Current hook directory inventory under the shared workspace.",
        source: "runtime",
        tone: probe.hookNames.length > 0 ? "positive" : "neutral",
        sections: [
          {
            id: "action-workspace-hooks",
            title: "Hooks",
            lines: probe.hookNames.length > 0 ? probe.hookNames.map((hook) => `${hook} · ${shortenHomePath(path.join(hooksRoot, hook))}`) : ["No workspace hook directories detected."]
          }
        ]
      };
    case "tool-workspace-tooling:list-manifests":
      return {
        itemId,
        actionId,
        title: "Workspace tooling manifests",
        summary: "Safe package-manifest summary for the workspace tooling roots.",
        source: "runtime",
        tone: probe.toolingRootPresent ? "positive" : "warning",
        sections: [
          {
            id: "action-tooling-manifests",
            title: "Package manifests",
            lines: [
              toolingPackage?.dependencies?.playwright ? `workspace playwright · ${toolingPackage.dependencies.playwright}` : "workspace playwright · unavailable",
              playwrightRunnerPackage?.name ? `runner package · ${playwrightRunnerPackage.name}@${playwrightRunnerPackage.version ?? "0.0.0"}` : "runner package · unavailable",
              playwrightRunnerPackage?.dependencies?.playwright ? `runner playwright · ${playwrightRunnerPackage.dependencies.playwright}` : "runner playwright · unavailable"
            ]
          }
        ]
      };
    case "tool-workspace-tooling:test-tooling-readiness":
      return {
        itemId,
        actionId,
        title: "Workspace tooling readiness",
        summary: "Safe readiness check for workspace tooling surfaces.",
        source: "runtime",
        tone: probe.toolingRootPresent && probe.playwrightRunnerPresent && probe.hookCount > 0 ? "positive" : probe.toolingRootPresent || probe.playwrightRunnerPresent || probe.hookCount > 0 ? "neutral" : "warning",
        sections: [
          {
            id: "action-tooling-readiness",
            title: "Tooling readiness",
            lines: [
              `tooling root · ${formatPresence(probe.toolingRootPresent)}`,
              `playwright runner · ${formatPresence(probe.playwrightRunnerPresent)}`,
              `hooks detected · ${probe.hookCount}`,
              `workspace manifest · ${toolingPackage?.dependencies?.playwright ? "present" : "missing"}`,
              `runner manifest · ${playwrightRunnerPackage?.name ? "present" : "missing"}`,
              `readiness verdict · ${probe.toolingRootPresent && probe.playwrightRunnerPresent && probe.hookCount > 0 ? "ready" : probe.toolingRootPresent || probe.playwrightRunnerPresent || probe.hookCount > 0 ? "partial" : "missing"}`
            ]
          }
        ]
      };
    case "mcp-root-scan:rescan-roots":
      return {
        itemId,
        actionId,
        title: "Dedicated MCP root rescan",
        summary: "Fresh scan of known dedicated MCP roots.",
        source: "runtime",
        tone: probe.discoveredMcpRoots.length > 0 ? "positive" : "warning",
        sections: [
          {
            id: "action-mcp-rescan",
            title: "Scanned roots",
            lines: buildRootStatusLines(probe.mcpRootsScanned, probe.discoveredMcpRoots)
          }
        ]
      };
    case "mcp-root-scan:validate-root-candidates":
      return {
        itemId,
        actionId,
        title: "Dedicated MCP root validation",
        summary: "Safe validation of whether any dedicated MCP root candidates are currently usable.",
        source: "runtime",
        tone: probe.discoveredMcpRoots.length > 0 ? "positive" : "warning",
        sections: [
          {
            id: "action-mcp-root-validation",
            title: "Root candidates",
            lines: [
              `scanned roots · ${probe.mcpRootsScanned.length}`,
              `discovered roots · ${probe.discoveredMcpRoots.length}`,
              `validation verdict · ${probe.discoveredMcpRoots.length > 0 ? "candidate roots detected" : "no dedicated roots found"}`,
              ...buildRootStatusLines(probe.mcpRootsScanned, probe.discoveredMcpRoots)
            ]
          }
        ]
      };
    case "mcp-adjacent-runtime:list-bridge-surfaces":
      return {
        itemId,
        actionId,
        title: "Connector-adjacent bridge surfaces",
        summary: "Current OpenClaw install/load-path inventory behind the connector-adjacent lane.",
        source: "runtime",
        tone: probe.pluginInstallCount > 0 || probe.pluginLoadPaths.length > 0 ? "neutral" : "warning",
        sections: [
          {
            id: "action-bridge-installs",
            title: "Installs and load paths",
            lines: [
              ...(probe.pluginInstallIds.length > 0 ? probe.pluginInstallIds.map((id) => `install · ${id}`) : ["install · none"]),
              ...(probe.pluginLoadPaths.length > 0 ? probe.pluginLoadPaths.map((pluginPath) => `load path · ${shortenHomePath(pluginPath)}`) : ["load path · none"])
            ]
          }
        ]
      };
    case "mcp-adjacent-runtime:list-curated-plugins":
      return {
        itemId,
        actionId,
        title: "Connector-adjacent curated plugins",
        summary: "Curated Codex plugin cache currently visible to the connector-adjacent runtime lane.",
        source: "runtime",
        tone: cachedCuratedPlugins.length > 0 ? "neutral" : "warning",
        sections: [
          {
            id: "action-connector-curated",
            title: "Curated plugin cache",
            lines: cachedCuratedPlugins.length > 0 ? cachedCuratedPlugins.map((entry) => `${entry} · ${shortenHomePath(path.join(codexPluginCacheRoot, entry))}`) : ["No curated plugin cache directories found."]
          },
          {
            id: "action-connector-roots",
            title: "Dedicated MCP roots",
            lines: buildRootStatusLines(probe.mcpRootsScanned, probe.discoveredMcpRoots)
          }
        ]
      };
    case "mcp-adjacent-runtime:validate-connector-readiness":
      return {
        itemId,
        actionId,
        title: "Connector readiness validation",
        summary: "Safe readiness check for connector-adjacent runtime prerequisites.",
        source: "runtime",
        tone:
          probe.codexPluginCachePresent && (probe.pluginInstallCount > 0 || probe.pluginLoadPaths.length > 0)
            ? "positive"
            : probe.codexPluginCachePresent || probe.pluginInstallCount > 0 || probe.pluginLoadPaths.length > 0
              ? "neutral"
              : "warning",
        sections: [
          {
            id: "action-connector-readiness",
            title: "Connector readiness",
            lines: [
              `curated plugin cache · ${formatPresence(probe.codexPluginCachePresent)}`,
              `plugin installs · ${probe.pluginInstallCount}`,
              `load paths · ${probe.pluginLoadPaths.length}`,
              `dedicated MCP roots · ${probe.discoveredMcpRoots.length}`,
              `validation verdict · ${probe.codexPluginCachePresent && (probe.pluginInstallCount > 0 || probe.pluginLoadPaths.length > 0) ? "bridge-adjacent runtime looks ready for deeper safe inspection" : probe.codexPluginCachePresent || probe.pluginInstallCount > 0 || probe.pluginLoadPaths.length > 0 ? "partial" : "fallback"}`
            ]
          }
        ]
      };
    case "mcp-root-scan:list-root-candidates": {
      const candidateLines = await Promise.all(probe.mcpRootsScanned.map((root) => describeRootCandidate(root)));
      return {
        itemId,
        actionId,
        title: "MCP root candidates",
        summary: "Detailed candidate inventory for known MCP roots.",
        source: "runtime",
        tone: probe.discoveredMcpRoots.length > 0 ? "positive" : "warning",
        sections: [
          {
            id: "action-mcp-root-candidates",
            title: "Candidate roots",
            lines: candidateLines
          }
        ]
      };
    }
    case "mcp-root-scan:test-discovery-flow":
      return {
        itemId,
        actionId,
        title: "MCP discovery flow test",
        summary: "Read-only test of the current connector discovery flow using roots and bridge inputs.",
        source: "runtime",
        tone: probe.discoveredMcpRoots.length > 0 ? "positive" : probe.pluginInstallCount > 0 || probe.pluginLoadPaths.length > 0 ? "neutral" : "warning",
        sections: [
          {
            id: "action-mcp-discovery-flow",
            title: "Discovery flow",
            lines: buildDiscoveryFlowLines(probe)
          }
        ]
      };
    case "mcp-adjacent-runtime:list-connector-inputs":
      return {
        itemId,
        actionId,
        title: "Connector inputs",
        summary: "Current manifests and bridge inputs feeding the connector-adjacent lane.",
        source: "runtime",
        tone: probe.pluginInstallCount > 0 || probe.pluginLoadPaths.length > 0 || cachedCuratedPlugins.length > 0 ? "neutral" : "warning",
        sections: [
          {
            id: "action-connector-input-installs",
            title: "Install manifests",
            lines: buildOpenClawInstallLines(openclawConfig).length > 0 ? buildOpenClawInstallLines(openclawConfig) : ["install · none"]
          },
          {
            id: "action-connector-input-cache",
            title: "Curated cache",
            lines: cachedCuratedPlugins.length > 0 ? cachedCuratedPlugins.map((entry) => `${entry} · ${shortenHomePath(path.join(codexPluginCacheRoot, entry))}`) : ["No curated plugin cache directories found."]
          },
          {
            id: "action-connector-input-load-paths",
            title: "Load paths and roots",
            lines: [
              ...(probe.pluginLoadPaths.length > 0 ? probe.pluginLoadPaths.map((pluginPath) => `load path · ${shortenHomePath(pluginPath)}`) : ["load path · none"]),
              ...buildRootStatusLines(probe.mcpRootsScanned, probe.discoveredMcpRoots)
            ]
          }
        ]
      };
    case "mcp-adjacent-runtime:test-lane-composition":
      return {
        itemId,
        actionId,
        title: "Connector lane composition test",
        summary: "Read-only composition test for the current connector-adjacent lane.",
        source: "runtime",
        tone:
          probe.codexPluginCachePresent && (probe.pluginInstallCount > 0 || probe.pluginLoadPaths.length > 0)
            ? "positive"
            : probe.codexPluginCachePresent || probe.pluginInstallCount > 0 || probe.pluginLoadPaths.length > 0
              ? "neutral"
              : "warning",
        sections: [
          {
            id: "action-connector-lane-composition",
            title: "Lane composition",
            lines: buildConnectorLaneLines(probe)
          }
        ]
      };
    case "mcp-root-scan:preview-root-resolution": {
      const firstResolvedRoot = probe.discoveredMcpRoots[0] ?? probe.pluginLoadPaths[0] ?? null;
      return {
        itemId,
        actionId,
        title: "Root resolution preview",
        summary: "Preview of the root resolution order the shell would use right now.",
        source: "runtime",
        tone: probe.discoveredMcpRoots.length > 0 ? "positive" : probe.pluginLoadPaths.length > 0 ? "neutral" : "warning",
        sections: [
          {
            id: "action-root-resolution-order",
            title: "Resolution order",
            lines: [
              ...probe.mcpRootsScanned.map((root, index) => `${index + 1}. ${shortenHomePath(root)} · ${probe.discoveredMcpRoots.includes(root) ? "candidate hit" : "miss"}`),
              ...(probe.pluginLoadPaths.length > 0 ? probe.pluginLoadPaths.map((pluginPath, index) => `${probe.mcpRootsScanned.length + index + 1}. ${shortenHomePath(pluginPath)} · plugin load path fallback`) : [])
            ]
          },
          {
            id: "action-root-resolution-result",
            title: "Selected outcome",
            lines: [
              `preview result · ${firstResolvedRoot ? shortenHomePath(firstResolvedRoot) : "no usable root candidate"}`,
              `selection mode · ${probe.discoveredMcpRoots.length > 0 ? "dedicated root" : probe.pluginLoadPaths.length > 0 ? "plugin load path fallback" : "no selection"}`
            ]
          }
        ]
      };
    }
    case "mcp-root-scan:preview-discovery-plan":
      return {
        itemId,
        actionId,
        title: "Discovery plan preview",
        summary: "Preview of the read-only discovery steps the shell would follow from current MCP and bridge inputs.",
        source: "runtime",
        tone: probe.discoveredMcpRoots.length > 0 ? "positive" : probe.pluginInstallCount > 0 || probe.pluginLoadPaths.length > 0 ? "neutral" : "warning",
        sections: [
          {
            id: "action-discovery-plan-steps",
            title: "Planned steps",
            lines: [
              "1. Scan dedicated MCP roots in priority order.",
              probe.discoveredMcpRoots.length > 0
                ? `2. Use detected dedicated root: ${shortenHomePath(probe.discoveredMcpRoots[0])}.`
                : "2. No dedicated root found; continue with bridge-adjacent inputs.",
              `3. Read OpenClaw plugin installs (${probe.pluginInstallCount}) and entries (${probe.pluginEntryCount}).`,
              `4. Consider plugin load paths (${probe.pluginLoadPaths.length}) and curated Codex cache (${probe.codexPluginCachePresent ? "present" : "missing"}).`,
              "5. Keep result on read-only fallback if no stronger discovery source exists."
            ]
          },
          {
            id: "action-discovery-plan-outcome",
            title: "Predicted outcome",
            lines: buildDiscoveryFlowLines(probe)
          }
        ]
      };
    case "mcp-root-scan:dry-run-connect-root": {
      const preferredRootTarget = getPreferredRootTarget(probe);
      const attachSourceOrder = buildAttachSourceOrder(probe, cachedCuratedPlugins);
      const hasBridgeInputs = hasConnectorBridgeInputs(probe, cachedCuratedPlugins);
      const connectReady = probe.discoveredMcpRoots.length > 0;
      const connectPartial = !connectReady && (preferredRootTarget.path !== null || hasBridgeInputs);

      return createDryRunResult(itemId, actionId, {
        title: "Dry-run root connect",
        summary: "Stages a dedicated-root connect flow using current MCP and bridge-adjacent inputs, then stops before any real attachment.",
        tone: connectReady ? "positive" : connectPartial ? "neutral" : "warning",
        targetLines: [
          "operation · connect root",
          `target root · ${preferredRootTarget.path ? shortenHomePath(preferredRootTarget.path) : "no resolved root candidate"}`,
          `selection mode · ${preferredRootTarget.mode}`
        ],
        inputLines: [
          `scanned roots · ${probe.mcpRootsScanned.length}`,
          `discovered roots · ${probe.discoveredMcpRoots.length} (${formatPreviewList(probe.discoveredMcpRoots, shortenHomePath)})`,
          `plugin load paths · ${probe.pluginLoadPaths.length} (${formatPreviewList(probe.pluginLoadPaths, shortenHomePath)})`,
          `plugin installs · ${probe.pluginInstallCount} (${formatPreviewList(probe.pluginInstallIds)})`,
          `bridge source layers · ${attachSourceOrder.length > 0 ? attachSourceOrder.join(" -> ") : "none"}`
        ],
        stepLines: [
          "1. Resolve the highest-priority dedicated MCP root candidate from the scanned roots.",
          "2. Confirm the candidate path is readable and classify it as a directory or file.",
          "3. Stage bridge-adjacent metadata from install manifests, entries, cache, and load paths.",
          "4. Assemble an in-memory connect request for the selected target only.",
          "5. Stop before bridge attach or activation because this control path is dry-run only."
        ],
        outcomeLines: [
          `predicted result · ${
            connectReady && preferredRootTarget.path
              ? `would stage a dedicated-root connect against ${shortenHomePath(preferredRootTarget.path)}`
              : preferredRootTarget.path
                ? `would stage fallback planning via ${shortenHomePath(preferredRootTarget.path)} but keep real root connect blocked`
                : "would stop before connect because no candidate root resolved"
          }`,
          `handoff posture · ${connectReady ? "ready for future executor handoff" : connectPartial ? "partial plan only" : "blocked at target resolution"}`,
          `supporting bridge inputs · ${hasBridgeInputs ? `${attachSourceOrder.length} layer(s) available for future follow-on planning` : "none"}`
        ],
        blockerLines: [
          ...(probe.discoveredMcpRoots.length === 0 ? ["No dedicated MCP root was detected under the scanned locations."] : []),
          ...(preferredRootTarget.mode === "plugin load path fallback"
            ? ["Only plugin load path fallback is available, so a true dedicated-root connect remains blocked."]
            : []),
          ...(!hasBridgeInputs ? ["No bridge-adjacent cache, manifest, or load-path inputs are available to support a staged connect flow."] : [])
        ],
        withheldLines: [
          "connect gate · the shell stops after planning and never opens or registers a live root connection here",
          "policy gate · no writes, installs, restarts, apply steps, or lifecycle mutations are permitted in this round"
        ]
      });
    }
    case "mcp-root-scan:execute-local-root-select": {
      const preferredRootTarget = getPreferredRootTarget(probe);
      const selectionStatus: LocalRootSelectionStatus = preferredRootTarget.path ? "selected" : "blocked";

      resetFromRootSelection(controlSession);
      controlSession.rootSelection = {
        status: selectionStatus,
        path: preferredRootTarget.path,
        mode: preferredRootTarget.mode,
        executedAt: null
      };

      const execution = recordLocalControlExecution(controlSession, {
        itemId,
        actionId,
        label: "Execute local root select",
        status: selectionStatus,
        target: preferredRootTarget.path ? shortenHomePath(preferredRootTarget.path) : "no resolved root candidate",
        summary:
          selectionStatus === "selected"
            ? "Preferred root selection was committed to the Studio-local control session."
            : "No root candidate resolved, so Studio recorded a blocked local selection state."
      });

      controlSession.rootSelection.executedAt = execution.executedAt;
      const rootLocalBoundary = buildRootBoundarySummary(probe, controlSession, cachedCuratedPlugins, {
        id: "boundary-root-local",
        title: "Local root selection boundary",
        summary:
          selectionStatus === "selected"
            ? "Root selection has advanced to the Studio-local layer only. Host/runtime root connect remains preview-only and withheld."
            : "Root selection remains blocked locally because no viable target is resolved. Host/runtime root connect remains preview-only and withheld.",
        currentLayer: "local-only",
        nextLayer: "preview-host",
        tone: selectionStatus === "selected" ? "positive" : "warning"
      });

      return createLocalExecutionResult(itemId, actionId, controlSession, {
        title: "Local root selection executed",
        summary:
          selectionStatus === "selected"
            ? "The preferred root target is now selected inside the Studio-local control session."
            : "Studio recorded a blocked local root selection because no target resolved from current inputs.",
        tone: selectionStatus === "selected" ? "positive" : "warning",
        boundary: rootLocalBoundary,
        executionLines: [
          "operation · local root select",
          `selected root · ${preferredRootTarget.path ? shortenHomePath(preferredRootTarget.path) : "none"}`,
          `selection mode · ${preferredRootTarget.mode}`,
          `executed at · ${execution.executedAt}`
        ],
        stateLines: [
          ...getRootSessionLines(controlSession),
          "downstream reset · staged bridge, activation, and lane state were cleared to keep the local session coherent"
        ],
        historyScope: "root"
      });
    }
    case "mcp-root-scan:preview-host-root-connect": {
      const preferredRootTarget = getPreferredRootTarget(probe);
      const attachSourceOrder = buildAttachSourceOrder(probe, cachedCuratedPlugins);
      const hasDedicatedRoot = preferredRootTarget.path !== null && preferredRootTarget.mode === "dedicated root";
      const hostPreviewResolution = finalizeHostPreviewResolution(
        resolveHostPreviewForAction(itemId, actionId, probe, controlSession, cachedCuratedPlugins)
      );
      const rootHostBoundary = buildRootBoundarySummary(probe, controlSession, cachedCuratedPlugins, {
        id: "boundary-root-preview",
        title: "Root connect preview boundary",
        summary:
          "Preview-host describes the future root connect contract, but live host/runtime root connection remains withheld until approval and executor slots exist.",
        currentLayer: "preview-host",
        nextLayer: "future-executor",
        tone: hasDedicatedRoot ? "neutral" : "warning"
      });

      return createHostBoundaryResult(itemId, actionId, {
        title: "Host root connect preview",
        summary:
          "Shows the withheld host/runtime root connect path, the current permission boundary, and what would still be required before enabling it.",
        tone: hasDedicatedRoot ? "neutral" : "warning",
        boundary: rootHostBoundary,
        hostPreview: hostPreviewResolution?.preview,
        hostHandoff: hostPreviewResolution?.handoff,
        actionLines: [
          "operation · host/runtime root connect",
          `requested target · ${preferredRootTarget.path ? shortenHomePath(preferredRootTarget.path) : "no resolved root candidate"}`,
          `target basis · ${preferredRootTarget.mode}`,
          "host mutation scope · live root attach and bridge registration"
        ],
        readinessLines: [
          `dedicated roots detected · ${probe.discoveredMcpRoots.length}`,
          `supporting source layers · ${attachSourceOrder.length > 0 ? attachSourceOrder.join(" -> ") : "none"}`,
          `Studio-local selection · ${formatLocalOnlyStatus(controlSession.rootSelection.status)}`,
          `current readiness · ${
            hasDedicatedRoot
              ? "technical target exists, but host connect remains boundary-blocked"
              : "policy-blocked with unresolved or fallback-only root targeting"
          }`
        ],
        blockerLines: [
          ...(preferredRootTarget.path === null ? ["No resolved root target is currently available for a live host connect."] : []),
          ...(preferredRootTarget.mode === "plugin load path fallback"
            ? ["Only a plugin load-path fallback is available, which is insufficient for a true dedicated-root connect."]
            : []),
          ...(attachSourceOrder.length === 0 ? ["Supporting bridge metadata is absent, so follow-on attach planning would still be incomplete."] : [])
        ],
        permissionLines: buildHostPermissionBoundaryLines("host/runtime root connect", [
          "~/.openclaw MCP/runtime roots",
          "bridge registration state",
          "connector process lifecycle"
        ]),
        capabilityLines: buildBoundaryCapabilityLines(rootHostBoundary),
        preconditionLines: buildBoundaryPreconditionLines(rootHostBoundary),
        planLines: buildBoundaryPlanLines(rootHostBoundary),
        executorSlotLines: buildBoundaryExecutorSlotLines(rootHostBoundary),
        enablementLines: buildHostEnablementLines([
          preferredRootTarget.mode === "dedicated root"
            ? "Keep dedicated-root resolution stable and idempotent across rescans before allowing live connect."
            : "Resolve a dedicated MCP root instead of relying on plugin load-path fallback before allowing live connect.",
          "Introduce audited root-connect and rollback semantics so a failed attach can be unwound cleanly."
        ])
      });
    }
    case "mcp-adjacent-runtime:preview-bridge-plan":
      return {
        itemId,
        actionId,
        title: "Bridge plan preview",
        summary: "Preview of the bridge plan the shell would assemble from current connector inputs.",
        source: "runtime",
        tone: probe.pluginInstallCount > 0 || probe.pluginLoadPaths.length > 0 || cachedCuratedPlugins.length > 0 ? "neutral" : "warning",
        sections: [
          {
            id: "action-bridge-plan-sources",
            title: "Planned bridge sources",
            lines: [
              `OpenClaw installs · ${probe.pluginInstallCount}`,
              `OpenClaw entries · ${probe.pluginEntryCount}`,
              `plugin load paths · ${probe.pluginLoadPaths.length}`,
              `curated plugin cache · ${cachedCuratedPlugins.length}`,
              `dedicated roots · ${probe.discoveredMcpRoots.length}`
            ]
          },
          {
            id: "action-bridge-plan-order",
            title: "Planned order",
            lines: [
              "1. Start from cached curated plugins and OpenClaw install manifests.",
              probe.pluginLoadPaths.length > 0 ? `2. Layer plugin load path fallback: ${probe.pluginLoadPaths.map(shortenHomePath).join(" · ")}.` : "2. No plugin load path fallback available.",
              probe.discoveredMcpRoots.length > 0 ? `3. Overlay dedicated roots: ${probe.discoveredMcpRoots.map(shortenHomePath).join(" · ")}.` : "3. No dedicated roots available; keep MCP on fallback.",
              "4. Produce a read-only connector lane summary without mutating runtime state."
            ]
          }
        ]
      };
    case "mcp-adjacent-runtime:simulate-connector-lane":
      return {
        itemId,
        actionId,
        title: "Connector lane simulation",
        summary: "Simulation of how the connector-adjacent lane would be assembled from the current safe inputs.",
        source: "runtime",
        tone:
          probe.codexPluginCachePresent && (probe.pluginInstallCount > 0 || probe.pluginLoadPaths.length > 0)
            ? "positive"
            : probe.codexPluginCachePresent || probe.pluginInstallCount > 0 || probe.pluginLoadPaths.length > 0
              ? "neutral"
              : "warning",
        sections: [
          {
            id: "action-connector-lane-simulation",
            title: "Simulated lane",
            lines: [
              `phase A · curated cache ${probe.codexPluginCachePresent ? "seeded" : "absent"}`,
              `phase B · install manifests ${probe.pluginInstallCount > 0 ? `attached (${probe.pluginInstallCount})` : "absent"}`,
              `phase C · load path fallback ${probe.pluginLoadPaths.length > 0 ? `attached (${probe.pluginLoadPaths.length})` : "absent"}`,
              `phase D · dedicated roots ${probe.discoveredMcpRoots.length > 0 ? `attached (${probe.discoveredMcpRoots.length})` : "absent"}`,
              `simulation verdict · ${buildConnectorLaneLines(probe)[buildConnectorLaneLines(probe).length - 1]?.replace("lane verdict · ", "") ?? "unknown"}`
            ]
          },
          {
            id: "action-connector-lane-proof",
            title: "Supporting inputs",
            lines: buildConnectorLaneLines(probe)
          }
        ]
      };
    case "mcp-adjacent-runtime:dry-run-bridge-attach": {
      const attachSourceOrder = buildAttachSourceOrder(probe, cachedCuratedPlugins);
      const attachReady = attachSourceOrder.length >= 2;
      const attachPartial = attachSourceOrder.length === 1;

      return createDryRunResult(itemId, actionId, {
        title: "Dry-run bridge attach",
        summary: "Stages a bridge attach flow from the current cache, manifests, load paths, and roots without binding anything into the live runtime.",
        tone: attachReady ? "positive" : attachPartial ? "neutral" : "warning",
        targetLines: [
          "operation · bridge attach",
          "attach scope · connector-adjacent runtime lane",
          `source order · ${attachSourceOrder.length > 0 ? attachSourceOrder.join(" -> ") : "no attach sources available"}`
        ],
        inputLines: [
          `curated cache entries · ${cachedCuratedPlugins.length} (${formatPreviewList(cachedCuratedPlugins)})`,
          `OpenClaw installs · ${probe.pluginInstallCount} (${formatPreviewList(probe.pluginInstallIds)})`,
          `OpenClaw entries · ${probe.pluginEntryCount} (${formatPreviewList(probe.pluginEntryIds)})`,
          `plugin load paths · ${probe.pluginLoadPaths.length} (${formatPreviewList(probe.pluginLoadPaths, shortenHomePath)})`,
          `dedicated roots · ${probe.discoveredMcpRoots.length} (${formatPreviewList(probe.discoveredMcpRoots, shortenHomePath)})`
        ],
        stepLines: [
          "1. Snapshot the current curated cache and OpenClaw manifest surfaces.",
          "2. Normalize attach candidates from installs, entries, load paths, and dedicated roots.",
          "3. Order the attach precedence for the staged bridge payload.",
          "4. Assemble an in-memory bridge attachment plan only.",
          "5. Stop before loading plugins, registering the bridge, or touching runtime lifecycle."
        ],
        outcomeLines: [
          `predicted result · ${attachSourceOrder.length > 0 ? `would stage bridge attach from ${attachSourceOrder.join(" -> ")}` : "would remain blocked before any bridge attach plan could be assembled"}`,
          `attach posture · ${attachReady ? "multi-source attach plan ready" : attachPartial ? "single-source partial plan" : "blocked"}`,
          `next handoff · ${attachReady ? "ready for future activation staging" : attachPartial ? "needs more source layers before activation" : "needs bridge inputs first"}`
        ],
        blockerLines: [
          ...(attachSourceOrder.length === 0 ? ["No cache, manifest, load-path, or dedicated-root source is available to attach."] : []),
          ...(attachSourceOrder.length === 1 ? ["Only one bridge source layer is available, so the staged attach would remain partial."] : []),
          ...(cachedCuratedPlugins.length === 0 ? ["Curated Codex plugin cache is absent, so the attach plan cannot start from a seeded cache layer."] : [])
        ],
        withheldLines: [
          "attach gate · the shell stages the bridge payload but does not load plugins, register the bridge, or bind live sources",
          "policy gate · no writes, installs, restarts, apply steps, or lifecycle mutations are permitted in this round"
        ]
      });
    }
    case "mcp-adjacent-runtime:execute-local-bridge-stage": {
      const attachSourceOrder = buildAttachSourceOrder(probe, cachedCuratedPlugins);
      const bridgeStatus: LocalBridgeStageStatus =
        attachSourceOrder.length >= 2 ? "staged" : attachSourceOrder.length === 1 ? "partial" : "blocked";

      resetFromBridgeStage(controlSession);
      controlSession.bridgeStage = {
        status: bridgeStatus,
        sourceOrder: attachSourceOrder,
        executedAt: null
      };

      const execution = recordLocalControlExecution(controlSession, {
        itemId,
        actionId,
        label: "Execute local bridge stage",
        status: bridgeStatus,
        target: attachSourceOrder.length > 0 ? formatSourceOrder(attachSourceOrder) : "no attach sources available",
        summary:
          bridgeStatus === "staged"
            ? "Connector bridge sources were staged in the Studio-local control session."
            : bridgeStatus === "partial"
              ? "Studio staged a partial bridge source order from the currently available inputs."
              : "Studio recorded a blocked bridge stage because no connector source layers were available."
      });

      controlSession.bridgeStage.executedAt = execution.executedAt;
      const connectorStageBoundary = buildConnectorBoundarySummary(probe, controlSession, cachedCuratedPlugins, {
        id: "boundary-connector-local-stage",
        title: "Local bridge stage boundary",
        summary:
          bridgeStatus === "staged"
            ? "Bridge staging has advanced inside the Studio-local layer only. Host attach, activation, and apply remain withheld."
            : bridgeStatus === "partial"
              ? "Bridge staging is partially prepared inside Studio-local state, but the live host path remains withheld."
              : "No bridge source order could be staged locally, and host attach remains withheld.",
        currentLayer: "local-only",
        nextLayer: "preview-host",
        tone: bridgeStatus === "staged" ? "positive" : bridgeStatus === "partial" ? "neutral" : "warning"
      });

      return createLocalExecutionResult(itemId, actionId, controlSession, {
        title: "Local bridge stage executed",
        summary:
          bridgeStatus === "staged"
            ? "Connector bridge source order is now staged locally inside Studio."
            : bridgeStatus === "partial"
              ? "Studio staged a partial connector bridge order locally."
              : "Studio recorded a blocked local bridge stage because no source order could be assembled.",
        tone: bridgeStatus === "staged" ? "positive" : bridgeStatus === "partial" ? "neutral" : "warning",
        boundary: connectorStageBoundary,
        executionLines: [
          "operation · local bridge stage",
          `source order · ${formatSourceOrder(attachSourceOrder)}`,
          `selected root overlay · ${
            controlSession.rootSelection.path ? shortenHomePath(controlSession.rootSelection.path) : "none"
          }`,
          `executed at · ${execution.executedAt}`
        ],
        stateLines: [
          ...getConnectorSessionLines(controlSession),
          "downstream reset · connector activation and lane state were cleared after bridge restaging"
        ],
        historyScope: "connector"
      });
    }
    case "mcp-adjacent-runtime:dry-run-connector-activate": {
      const attachSourceOrder = buildAttachSourceOrder(probe, cachedCuratedPlugins);
      const activationTarget = getConnectorActivationTarget(probe, cachedCuratedPlugins);
      const hasAttachablePath = probe.discoveredMcpRoots.length > 0 || probe.pluginLoadPaths.length > 0;
      const activateReady = attachSourceOrder.length >= 2 && activationTarget.mode !== "unresolved" && hasAttachablePath;
      const activatePartial = !activateReady && activationTarget.mode !== "unresolved";

      return createDryRunResult(itemId, actionId, {
        title: "Dry-run connector activate",
        summary: "Stages connector activation targeting from the current bridge inputs, then stops before any process start or runtime registration.",
        tone: activateReady ? "positive" : activatePartial ? "neutral" : "warning",
        targetLines: [
          "operation · connector activate",
          `activation target · ${activationTarget.label}`,
          `target basis · ${activationTarget.mode}`
        ],
        inputLines: [
          `bridge source layers · ${attachSourceOrder.length > 0 ? attachSourceOrder.join(" -> ") : "none"}`,
          `curated cache entries · ${cachedCuratedPlugins.length}`,
          `plugin installs · ${probe.pluginInstallCount}`,
          `plugin load paths · ${probe.pluginLoadPaths.length}`,
          `dedicated roots · ${probe.discoveredMcpRoots.length}`
        ],
        stepLines: [
          "1. Reuse the staged bridge attach source order from the current connector inventory.",
          "2. Resolve the primary activation target from roots, install manifests, cache, or load-path fallback.",
          "3. Stage activation flags and status transitions in memory only.",
          "4. Predict the connector posture the detail panel would report after activation.",
          "5. Stop before process launch, runtime registration, or status mutation."
        ],
        outcomeLines: [
          `predicted result · ${activationTarget.mode !== "unresolved" ? `would stage connector activation for ${activationTarget.label}` : "would stop before activation because no target resolved"}`,
          `activation posture · ${activateReady ? "ready for future executor handoff" : activatePartial ? "partial activation plan only" : "blocked"}`,
          `visible state change · ${activateReady ? "detail row would remain dry-run prepared" : "detail row would remain on preview/fallback posture"}`
        ],
        blockerLines: [
          ...(activationTarget.mode === "unresolved" ? ["No connector activation target could be resolved from roots, installs, cache, or load-path fallback."] : []),
          ...(attachSourceOrder.length === 0 ? ["No staged bridge source order is available, so activation cannot proceed beyond planning."] : []),
          ...(!hasAttachablePath ? ["No attachable path or dedicated root is available, so activation stays at manifest-level planning only."] : [])
        ],
        withheldLines: [
          "activation gate · the shell stages activation state only and never starts, registers, or flips a live connector",
          "policy gate · no writes, installs, restarts, apply steps, or lifecycle mutations are permitted in this round"
        ]
      });
    }
    case "mcp-adjacent-runtime:execute-local-connector-activate": {
      const stagedSourceOrder =
        controlSession.bridgeStage.sourceOrder.length > 0 ? controlSession.bridgeStage.sourceOrder : buildAttachSourceOrder(probe, cachedCuratedPlugins);
      const stagedTarget =
        controlSession.rootSelection.status === "selected" && controlSession.rootSelection.path
          ? {
              label: shortenHomePath(controlSession.rootSelection.path),
              mode: "Studio-local selected root"
            }
          : getConnectorActivationTarget(probe, cachedCuratedPlugins);
      const activationStatus: LocalConnectorActivationStatus =
        stagedTarget.mode === "unresolved"
          ? "blocked"
          : controlSession.bridgeStage.status === "staged"
            ? "active"
            : stagedSourceOrder.length > 0
              ? "prepared"
              : "blocked";

      resetFromConnectorActivation(controlSession);
      controlSession.connectorActivation = {
        status: activationStatus,
        label: stagedTarget.label,
        mode: stagedTarget.mode,
        executedAt: null
      };

      const execution = recordLocalControlExecution(controlSession, {
        itemId,
        actionId,
        label: "Execute local connector activate",
        status: activationStatus,
        target: stagedTarget.label,
        summary:
          activationStatus === "active"
            ? "Connector activation is now marked active in the Studio-local control session."
            : activationStatus === "prepared"
              ? "Studio prepared a local connector activation target but did not have a fully staged bridge."
              : "Studio recorded a blocked connector activation because no target or staged bridge was available."
      });

      controlSession.connectorActivation.executedAt = execution.executedAt;
      const connectorActivationBoundary = buildConnectorBoundarySummary(probe, controlSession, cachedCuratedPlugins, {
        id: "boundary-connector-local-activate",
        title: "Local connector activation boundary",
        summary:
          activationStatus === "active"
            ? "Connector activation is active only inside Studio-local control state. Host activation remains preview-only and withheld."
            : activationStatus === "prepared"
              ? "Connector activation is partially staged locally, but the live host activation path remains withheld."
              : "Connector activation is blocked locally and remains withheld on the host path as well.",
        currentLayer: "local-only",
        nextLayer: "preview-host",
        tone: activationStatus === "active" ? "positive" : activationStatus === "prepared" ? "neutral" : "warning"
      });

      return createLocalExecutionResult(itemId, actionId, controlSession, {
        title: "Local connector activation executed",
        summary:
          activationStatus === "active"
            ? "The connector is now locally active inside Studio's control session."
            : activationStatus === "prepared"
              ? "Studio prepared a local activation state but kept it short of fully active because the bridge stage is incomplete."
              : "Studio recorded a blocked local activation because no viable target was available.",
        tone: activationStatus === "active" ? "positive" : activationStatus === "prepared" ? "neutral" : "warning",
        boundary: connectorActivationBoundary,
        executionLines: [
          "operation · local connector activate",
          `activation target · ${stagedTarget.label}`,
          `target basis · ${stagedTarget.mode}`,
          `bridge source order · ${formatSourceOrder(stagedSourceOrder)}`,
          `executed at · ${execution.executedAt}`
        ],
        stateLines: [
          ...getConnectorSessionLines(controlSession),
          `activation dependency · local bridge stage ${formatLocalOnlyStatus(controlSession.bridgeStage.status)}`
        ],
        historyScope: "connector"
      });
    }
    case "mcp-adjacent-runtime:dry-run-lane-apply": {
      const attachSourceOrder = buildAttachSourceOrder(probe, cachedCuratedPlugins);
      const preferredRootTarget = getPreferredRootTarget(probe);
      const laneLines = buildConnectorLaneLines(probe);
      const laneVerdict = laneLines[laneLines.length - 1]?.replace("lane verdict · ", "") ?? "unknown";
      const applyReady = probe.codexPluginCachePresent && (probe.pluginInstallCount > 0 || probe.pluginLoadPaths.length > 0) && probe.discoveredMcpRoots.length > 0;
      const applyPartial = !applyReady && attachSourceOrder.length > 0;

      return createDryRunResult(itemId, actionId, {
        title: "Dry-run lane apply",
        summary: "Stages the final connector lane apply order, predicted lane result, blockers, and the explicit execution hold without applying anything.",
        tone: applyReady ? "positive" : applyPartial ? "neutral" : "warning",
        targetLines: [
          "operation · lane apply",
          "lane target · connector-adjacent runtime lane",
          `root overlay · ${preferredRootTarget.path ? shortenHomePath(preferredRootTarget.path) : "none"}`
        ],
        inputLines: [
          `curated cache · ${formatPresence(probe.codexPluginCachePresent)} (${cachedCuratedPlugins.length} entries)`,
          `install manifests · ${probe.pluginInstallCount}`,
          `plugin entries · ${probe.pluginEntryCount}`,
          `plugin load paths · ${probe.pluginLoadPaths.length}`,
          `dedicated roots · ${probe.discoveredMcpRoots.length}`
        ],
        stepLines: [
          "1. Re-read cache, manifests, load paths, and dedicated roots for the lane.",
          "2. Order lane phases from cache seed through root overlay.",
          "3. Stage the final apply payload and predicted lane status in memory only.",
          "4. Check whether the resulting lane would stay fallback, partial, or fully staged.",
          "5. Stop before apply, install, restart, or any connector lifecycle mutation."
        ],
        outcomeLines: [
          `predicted result · ${applyReady ? "would stage a lane apply with dedicated-root overlay" : applyPartial ? "would stage a partial lane apply but keep final execution blocked" : "would stay on fallback because the lane lacks enough inputs"}`,
          `resulting lane state · ${laneVerdict}`,
          `source order · ${attachSourceOrder.length > 0 ? attachSourceOrder.join(" -> ") : "none"}`
        ],
        blockerLines: [
          ...(!probe.codexPluginCachePresent ? ["Curated cache is absent, so the lane cannot start from a seeded bridge surface."] : []),
          ...(probe.pluginInstallCount === 0 && probe.pluginLoadPaths.length === 0
            ? ["No install manifests or load-path fallbacks are available to compose the lane."]
            : []),
          ...(probe.discoveredMcpRoots.length === 0 ? ["No dedicated root overlay is available, so the staged lane remains fallback-biased."] : [])
        ],
        withheldLines: [
          "apply gate · the shell stages the lane result only and never writes config, installs plugins, restarts services, or applies a live lane",
          "policy gate · no writes, installs, restarts, apply steps, or lifecycle mutations are permitted in this round"
        ]
      });
    }
    case "mcp-adjacent-runtime:execute-local-lane-apply": {
      const stagedSourceOrder =
        controlSession.bridgeStage.sourceOrder.length > 0 ? controlSession.bridgeStage.sourceOrder : buildAttachSourceOrder(probe, cachedCuratedPlugins);
      const preferredRootTarget = getPreferredRootTarget(probe);
      const laneLines = buildConnectorLaneLines(probe);
      const laneVerdict = laneLines[laneLines.length - 1]?.replace("lane verdict · ", "") ?? "unknown";
      const rootOverlay = controlSession.rootSelection.path ?? preferredRootTarget.path;
      const laneStatus: LocalLaneApplyStatus =
        controlSession.connectorActivation.status === "active" && stagedSourceOrder.length > 0
          ? "applied"
          : controlSession.connectorActivation.status === "prepared" || stagedSourceOrder.length > 0
            ? "partial"
            : "blocked";
      const localVerdict =
        laneStatus === "applied"
          ? `local-only lane applied · ${laneVerdict}`
          : laneStatus === "partial"
            ? `local-only lane partial · ${laneVerdict}`
            : `local-only lane blocked · ${laneVerdict}`;

      controlSession.laneApply = {
        status: laneStatus,
        verdict: localVerdict,
        rootOverlay,
        sourceOrder: stagedSourceOrder,
        executedAt: null
      };

      const execution = recordLocalControlExecution(controlSession, {
        itemId,
        actionId,
        label: "Execute local lane apply",
        status: laneStatus,
        target: rootOverlay ? shortenHomePath(rootOverlay) : "no root overlay",
        summary:
          laneStatus === "applied"
            ? "Connector lane is now applied inside the Studio-local control session."
            : laneStatus === "partial"
              ? "Studio recorded a partial local lane apply from the current bridge and activation state."
              : "Studio recorded a blocked local lane apply because no staged local connector state was available."
      });

      controlSession.laneApply.executedAt = execution.executedAt;
      const connectorApplyBoundary = buildConnectorBoundarySummary(probe, controlSession, cachedCuratedPlugins, {
        id: "boundary-connector-local-apply",
        title: "Local lane apply boundary",
        summary:
          laneStatus === "applied"
            ? "Lane apply has advanced only inside the Studio-local layer. Host/runtime apply remains preview-only and withheld."
            : laneStatus === "partial"
              ? "Lane apply is partially staged inside Studio-local control state, but host/runtime apply remains withheld."
              : "Lane apply is blocked locally and remains withheld on the host path.",
        currentLayer: "local-only",
        nextLayer: "preview-host",
        tone: laneStatus === "applied" ? "positive" : laneStatus === "partial" ? "neutral" : "warning"
      });

      return createLocalExecutionResult(itemId, actionId, controlSession, {
        title: "Local lane apply executed",
        summary:
          laneStatus === "applied"
            ? "The connector lane is now applied locally inside Studio."
            : laneStatus === "partial"
              ? "Studio recorded a partial local lane apply and kept the result inside the app."
              : "Studio recorded a blocked local lane apply because the local session lacked enough staged state.",
        tone: laneStatus === "applied" ? "positive" : laneStatus === "partial" ? "neutral" : "warning",
        boundary: connectorApplyBoundary,
        executionLines: [
          "operation · local lane apply",
          `lane verdict · ${localVerdict}`,
          `root overlay · ${rootOverlay ? shortenHomePath(rootOverlay) : "none"}`,
          `source order · ${formatSourceOrder(stagedSourceOrder)}`,
          `executed at · ${execution.executedAt}`
        ],
        stateLines: [
          ...getConnectorSessionLines(controlSession),
          `activation dependency · ${formatLocalOnlyStatus(controlSession.connectorActivation.status)}`
        ],
        historyScope: "connector"
      });
    }
    case "mcp-adjacent-runtime:preview-host-bridge-attach": {
      const attachSourceOrder =
        controlSession.bridgeStage.sourceOrder.length > 0 ? controlSession.bridgeStage.sourceOrder : buildAttachSourceOrder(probe, cachedCuratedPlugins);
      const attachReady = attachSourceOrder.length >= 2;
      const attachPartial = attachSourceOrder.length === 1;
      const hostPreviewResolution = finalizeHostPreviewResolution(
        resolveHostPreviewForAction(itemId, actionId, probe, controlSession, cachedCuratedPlugins)
      );
      const connectorAttachBoundary = buildConnectorBoundarySummary(probe, controlSession, cachedCuratedPlugins, {
        id: "boundary-connector-preview-attach",
        title: "Bridge attach preview boundary",
        summary:
          "Preview-host describes the future bridge attach contract, but live host attach remains withheld until approval, host mutation slots, and rollback semantics exist.",
        currentLayer: "preview-host",
        nextLayer: "future-executor",
        tone: attachReady ? "neutral" : "warning"
      });

      return createHostBoundaryResult(itemId, actionId, {
        title: "Host bridge attach preview",
        summary:
          "Shows the withheld host/runtime bridge attach path, the current permission boundary, and what would be required before enabling it.",
        tone: attachReady ? "neutral" : "warning",
        boundary: connectorAttachBoundary,
        hostPreview: hostPreviewResolution?.preview,
        hostHandoff: hostPreviewResolution?.handoff,
        actionLines: [
          "operation · host/runtime bridge attach",
          "attach scope · connector-adjacent runtime lane",
          `requested source order · ${formatSourceOrder(attachSourceOrder)}`,
          `root overlay · ${controlSession.rootSelection.path ? shortenHomePath(controlSession.rootSelection.path) : "none"}`
        ],
        readinessLines: [
          `curated cache entries · ${cachedCuratedPlugins.length}`,
          `OpenClaw source layers · installs ${probe.pluginInstallCount} · entries ${probe.pluginEntryCount} · load paths ${probe.pluginLoadPaths.length}`,
          `Studio-local bridge stage · ${formatLocalOnlyStatus(controlSession.bridgeStage.status)}`,
          `current readiness · ${
            attachReady
              ? "multi-source attach plan exists, but host attach remains boundary-blocked"
              : attachPartial
                ? "only one source layer exists and host attach remains boundary-blocked"
                : "no attach source order is ready and host attach remains boundary-blocked"
          }`
        ],
        blockerLines: [
          ...(attachSourceOrder.length === 0 ? ["No attach source order is currently available for a live bridge attach."] : []),
          ...(attachPartial ? ["Only one bridge source layer is available, so a live attach would still be structurally partial."] : []),
          ...(cachedCuratedPlugins.length === 0 ? ["Curated Codex cache is absent, so attach cannot start from the preferred seeded cache layer."] : [])
        ],
        permissionLines: buildHostPermissionBoundaryLines("host/runtime bridge attach", [
          "OpenClaw bridge registration",
          "~/.openclaw runtime bridge state",
          "plugin source bindings"
        ]),
        capabilityLines: buildBoundaryCapabilityLines(connectorAttachBoundary),
        preconditionLines: buildBoundaryPreconditionLines(connectorAttachBoundary),
        planLines: buildBoundaryPlanLines(connectorAttachBoundary),
        executorSlotLines: buildBoundaryExecutorSlotLines(connectorAttachBoundary),
        enablementLines: buildHostEnablementLines([
          "Add idempotent bridge attach and detach semantics so live registration can be rolled back safely.",
          "Validate multi-source precedence rules before allowing host-side bridge binding."
        ])
      });
    }
    case "mcp-adjacent-runtime:preview-host-connector-activate": {
      const stagedSourceOrder =
        controlSession.bridgeStage.sourceOrder.length > 0 ? controlSession.bridgeStage.sourceOrder : buildAttachSourceOrder(probe, cachedCuratedPlugins);
      const activationTarget =
        controlSession.rootSelection.status === "selected" && controlSession.rootSelection.path
          ? {
              label: shortenHomePath(controlSession.rootSelection.path),
              mode: "Studio-local selected root"
            }
          : getConnectorActivationTarget(probe, cachedCuratedPlugins);
      const hasAttachablePath =
        controlSession.rootSelection.path !== null || probe.discoveredMcpRoots.length > 0 || probe.pluginLoadPaths.length > 0;
      const activationReady = stagedSourceOrder.length >= 2 && activationTarget.mode !== "unresolved" && hasAttachablePath;
      const hostPreviewResolution = finalizeHostPreviewResolution(
        resolveHostPreviewForAction(itemId, actionId, probe, controlSession, cachedCuratedPlugins)
      );
      const connectorActivateBoundary = buildConnectorBoundarySummary(probe, controlSession, cachedCuratedPlugins, {
        id: "boundary-connector-preview-activate",
        title: "Connector activate preview boundary",
        summary:
          "Preview-host describes the future connector activation contract, but live host activation remains withheld until approval, lifecycle runner, and executor slots exist.",
        currentLayer: "preview-host",
        nextLayer: "future-executor",
        tone: activationReady ? "neutral" : "warning"
      });

      return createHostBoundaryResult(itemId, actionId, {
        title: "Host connector activate preview",
        summary:
          "Shows the withheld host/runtime connector activate path, the current permission boundary, and what would be required before enabling it.",
        tone: activationReady ? "neutral" : "warning",
        boundary: connectorActivateBoundary,
        hostPreview: hostPreviewResolution?.preview,
        hostHandoff: hostPreviewResolution?.handoff,
        actionLines: [
          "operation · host/runtime connector activate",
          `activation target · ${activationTarget.label}`,
          `target basis · ${activationTarget.mode}`,
          `bridge source order · ${formatSourceOrder(stagedSourceOrder)}`
        ],
        readinessLines: [
          `Studio-local bridge stage · ${formatLocalOnlyStatus(controlSession.bridgeStage.status)}`,
          `Studio-local activation state · ${formatLocalOnlyStatus(controlSession.connectorActivation.status)}`,
          `attachable path available · ${hasAttachablePath ? "yes" : "no"}`,
          `current readiness · ${
            activationReady
              ? "activation target and staged bridge exist, but host activation remains boundary-blocked"
              : "host activation remains boundary-blocked and still lacks one or more technical prerequisites"
          }`
        ],
        blockerLines: [
          ...(activationTarget.mode === "unresolved" ? ["No activation target could be resolved from roots, installs, cache, or load-path fallback."] : []),
          ...(stagedSourceOrder.length === 0 ? ["No staged bridge source order exists for a live connector activation."] : []),
          ...(!hasAttachablePath ? ["No attachable root or load path is available, so activation would have nowhere safe to bind."] : [])
        ],
        permissionLines: buildHostPermissionBoundaryLines("host/runtime connector activate", [
          "connector activation registry",
          "external connector processes",
          "plugin lifecycle state"
        ]),
        capabilityLines: buildBoundaryCapabilityLines(connectorActivateBoundary),
        preconditionLines: buildBoundaryPreconditionLines(connectorActivateBoundary),
        planLines: buildBoundaryPlanLines(connectorActivateBoundary),
        executorSlotLines: buildBoundaryExecutorSlotLines(connectorActivateBoundary),
        enablementLines: buildHostEnablementLines([
          "Add a lifecycle runner that can activate and deactivate connectors without leaving partial host state behind.",
          "Validate activation-target resolution and readiness checks before allowing a live host activation."
        ])
      });
    }
    case "mcp-adjacent-runtime:preview-host-lane-apply": {
      const stagedSourceOrder =
        controlSession.laneApply.sourceOrder.length > 0
          ? controlSession.laneApply.sourceOrder
          : controlSession.bridgeStage.sourceOrder.length > 0
            ? controlSession.bridgeStage.sourceOrder
            : buildAttachSourceOrder(probe, cachedCuratedPlugins);
      const preferredRootTarget = getPreferredRootTarget(probe);
      const rootOverlay = controlSession.rootSelection.path ?? preferredRootTarget.path;
      const laneLines = buildConnectorLaneLines(probe);
      const laneVerdict = laneLines[laneLines.length - 1]?.replace("lane verdict · ", "") ?? "unknown";
      const activationReady =
        controlSession.connectorActivation.status === "active" || controlSession.connectorActivation.status === "prepared";
      const applyReady = Boolean(rootOverlay) && stagedSourceOrder.length >= 2 && activationReady && probe.codexPluginCachePresent;
      const hostPreviewResolution = finalizeHostPreviewResolution(
        resolveHostPreviewForAction(itemId, actionId, probe, controlSession, cachedCuratedPlugins)
      );
      const connectorApplyPreviewBoundary = buildConnectorBoundarySummary(probe, controlSession, cachedCuratedPlugins, {
        id: "boundary-connector-preview-apply",
        title: "Lane apply preview boundary",
        summary:
          "Preview-host describes the future lane apply contract, but live host/runtime apply remains withheld until approval, lifecycle coordination, rollback semantics, and smoke coverage exist.",
        currentLayer: "preview-host",
        nextLayer: "future-executor",
        tone: applyReady ? "neutral" : "warning"
      });

      return createHostBoundaryResult(itemId, actionId, {
        title: "Host lane apply preview",
        summary:
          "Shows the withheld host/runtime lane apply path, the current permission boundary, and what would be required before enabling it.",
        tone: applyReady ? "neutral" : "warning",
        boundary: connectorApplyPreviewBoundary,
        hostPreview: hostPreviewResolution?.preview,
        hostHandoff: hostPreviewResolution?.handoff,
        actionLines: [
          "operation · host/runtime lane apply",
          "apply scope · connector-adjacent runtime lane",
          `root overlay · ${rootOverlay ? shortenHomePath(rootOverlay) : "none"}`,
          `planned lane verdict · ${laneVerdict}`
        ],
        readinessLines: [
          `Studio-local bridge stage · ${formatLocalOnlyStatus(controlSession.bridgeStage.status)}`,
          `Studio-local activation state · ${formatLocalOnlyStatus(controlSession.connectorActivation.status)}`,
          `source order · ${formatSourceOrder(stagedSourceOrder)}`,
          `current readiness · ${
            applyReady
              ? "lane inputs are largely staged, but host apply remains boundary-blocked"
              : "host apply remains boundary-blocked and still lacks one or more technical prerequisites"
          }`
        ],
        blockerLines: [
          ...(!rootOverlay ? ["No root overlay is currently available for a live lane apply."] : []),
          ...(stagedSourceOrder.length === 0 ? ["No staged bridge source order exists for a live lane apply."] : []),
          ...(!activationReady ? ["Connector activation is not yet in a prepared or active local state."] : []),
          ...(!probe.codexPluginCachePresent ? ["Curated Codex cache is absent, so the lane cannot start from the expected seeded bridge surface."] : [])
        ],
        permissionLines: buildHostPermissionBoundaryLines("host/runtime lane apply", [
          "~/.openclaw config and runtime state",
          "plugin install or load-path composition",
          "service lifecycle",
          "external connector processes"
        ]),
        capabilityLines: buildBoundaryCapabilityLines(connectorApplyPreviewBoundary),
        preconditionLines: buildBoundaryPreconditionLines(connectorApplyPreviewBoundary),
        planLines: buildBoundaryPlanLines(connectorApplyPreviewBoundary),
        executorSlotLines: buildBoundaryExecutorSlotLines(connectorApplyPreviewBoundary),
        enablementLines: buildHostEnablementLines([
          "Add rollback-aware lane apply semantics so config, lifecycle, and bridge changes can be reversed together.",
          "Cover host apply with smoke and failure-path tests before exposing any live execution affordance."
        ])
      });
    }
    default:
      return null;
  }
}

export async function runToolsMcpAction(
  itemId: string,
  actionId: string,
  controlSession: ToolsMcpLocalControlSession
): Promise<StudioRuntimeActionResult | null> {
  const action = getToolsMcpAction(itemId, actionId);

  if (!action) {
    return null;
  }

  const result = await runToolsMcpActionInternal(itemId, actionId, controlSession);
  return result ? attachToolsMcpActionContract(result, action) : null;
}
