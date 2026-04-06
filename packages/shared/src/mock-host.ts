import type {
  StudioBoundarySummary,
  StudioHostBridgeSimulatedOutcome,
  StudioHostBridgeState,
  StudioHostExecutorState
} from "./index.js";
import { studioHostBridgeSlotChannels } from "./index.js";
import { createStudioHostTraceState, createStudioReleaseApprovalPipeline } from "./host-runtime.js";

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

export const mockHostBridgeState: StudioHostBridgeState = {
  id: "host-bridge-phase27",
  title: "Disabled host bridge skeleton",
  summary:
    "Phase58 keeps the bridge default-disabled while layering review-only delivery-chain posture, operator review loop visibility, reviewer queues, acknowledgement state, escalation and closeout windows, richer trace drill-down, decision handoff posture, evidence closeout, and cross-window shared-state observability on top of the existing per-slot focus flow.",
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

export const mockHostExecutorState: StudioHostExecutorState = {
  id: "host-executor-phase27",
  title: "Disabled host bridge skeleton",
  summary:
    "Phase58 keeps the typed executor contract default-disabled while adding review-only delivery-chain posture, cross-window shared-state review, richer trace drill-down, operator review-loop posture, and deeper inspector visibility without enabling host mutation.",
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
      activeDeliveryChainStageId: "",
      activeReviewerQueueId: "",
      activeAcknowledgementState: "pending",
      activeEscalationWindowId: "",
      activeCloseoutWindowId: "",
      reviewerNotes: []
    },
    decisionHandoff: {
      id: "",
      label: "",
      batonState: "held",
      acknowledgementState: "pending",
      sourceOwner: "",
      targetOwner: "",
      posture: "",
      summary: "",
      deliveryChainStageId: "",
      packetId: "",
      reviewerQueueId: "",
      escalationWindowId: "",
      closeoutWindowId: "",
      pending: [],
      reviewerNotes: []
    },
    evidenceCloseout: {
      id: "",
      label: "",
      sealingState: "open",
      acknowledgementState: "pending",
      owner: "",
      summary: "",
      deliveryChainStageId: "",
      reviewerQueueId: "",
      closeoutWindowId: "",
      sealedEvidence: [],
      pendingEvidence: [],
      reviewerNotes: []
    },
    reviewerQueues: [],
    escalationWindows: [],
    closeoutWindows: [],
    stages: [],
    deliveryChain: {
      id: "",
      title: "",
      summary: "",
      mode: "review-only",
      currentStageId: "",
      promotionStageIds: [],
      publishStageIds: [],
      rollbackStageIds: [],
      stages: [],
      blockedBy: []
    },
    blockedBy: []
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
mockHostExecutorState.releaseApprovalPipeline = createStudioReleaseApprovalPipeline(mockHostExecutorState);

export const mockBoundarySummary: StudioBoundarySummary = {
  id: "shell-host-runtime-boundary",
  title: "Host/runtime boundary",
  summary:
    "Phase58 keeps host execution withheld while extending the default-disabled bridge skeleton with a review-only delivery chain, explicit reviewer queues, acknowledgement state, escalation and closeout windows, decision handoff and evidence closeout state, deeper trace contracts, readiness-aware window intents, and explicit cross-window shared-state review.",
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
    },
    {
      id: "cap-release-approval-pipeline",
      label: "Release approval pipeline",
      state: "ready",
      detail: "Approval orchestration, lifecycle enforcement, rollback settlement, and release-decision review now appear as one structured review-only pipeline."
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
