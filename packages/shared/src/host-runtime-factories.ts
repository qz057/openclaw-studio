import type {
  StudioContractLink,
  StudioHostApprovalContract,
  StudioHostBridgeSimulatedOutcome,
  StudioHostBridgeSlotHandler,
  StudioHostBridgeState,
  StudioHostBridgeValidator,
  StudioHostLifecycleStage,
  StudioHostMutationIntent,
  StudioHostMutationSlot,
  StudioHostPreviewTraceStep,
  StudioHostRollbackContract,
  StudioHostTraceSlotState,
  StudioHostTraceState,
  StudioReleaseApprovalPipeline,
  StudioReleaseApprovalAuditRollbackEntryContract,
  StudioReleaseApprovalPipelineStage,
  StudioReleaseApprovalWorkflow,
  StudioReleaseCloseoutWindow,
  StudioReleaseDeliveryChain,
  StudioReleaseEscalationWindow,
  StudioReleasePackagedAppBundleSealingCheckpoint,
  StudioReleasePackagedAppMaterializationContract,
  StudioReleasePackagedAppLocalMaterializationSegment,
  StudioReleasePackagedAppMaterializationReviewPacket,
  StudioReleasePackagedAppMaterializationTaskState,
  StudioReleasePackagedAppMaterializationValidatorObservabilityBridge,
  StudioReleasePackagedAppMaterializationValidatorObservabilityReadout,
  StudioReleasePackagedAppMaterializationValidatorStatus,
  StudioReleaseQaCloseoutReadiness,
  StudioReleaseRollbackLiveReadiness,
  StudioReleaseStageCBoundaryLinkage,
  StudioReleaseStageCReadiness,
  StudioReleaseReviewerQueue
} from "./index.js";
import { selectStudioHostTraceFocusSlotId } from "./host-runtime-selectors.js";

function createStudioWindowCrossLinks(intent: StudioHostMutationIntent): StudioContractLink[] {
  switch (intent) {
    case "root-connect":
      return [
        { id: "window-link-shell-main", label: "Main Shell Window", kind: "window-roster", target: "window-shell-main" },
        { id: "window-link-boundary-lane", label: "Boundary Review Lane", kind: "shared-state-lane", target: "shared-state-lane-boundary-review" },
        {
          id: "window-link-boundary-board",
          label: "Boundary Review Orchestration",
          kind: "orchestration-board",
          target: "orchestration-board-boundary-review"
        }
      ];
    case "bridge-attach":
      return [
        { id: "window-link-inspector-candidate", label: "Detached Inspector Candidate", kind: "window-roster", target: "window-inspector-candidate" },
        { id: "window-link-boundary-handoff", label: "Boundary Review Lane", kind: "shared-state-lane", target: "shared-state-lane-boundary-review" },
        {
          id: "window-link-boundary-board-handoff",
          label: "Boundary Review Orchestration",
          kind: "orchestration-board",
          target: "orchestration-board-boundary-review"
        }
      ];
    case "connector-activate":
      return [
        { id: "window-link-review-board", label: "Review Deck Window", kind: "window-roster", target: "window-review-board" },
        { id: "window-link-preview-lane", label: "Preview Review Lane", kind: "shared-state-lane", target: "shared-state-lane-preview-review" },
        {
          id: "window-link-preview-board",
          label: "Preview Review Orchestration",
          kind: "orchestration-board",
          target: "orchestration-board-preview-review"
        }
      ];
    default:
      return [
        { id: "window-link-trace-window", label: "Trace Review Window", kind: "window-roster", target: "window-trace-review" },
        { id: "window-link-trace-lane", label: "Trace Review Lane", kind: "shared-state-lane", target: "shared-state-lane-trace-review" },
        {
          id: "window-link-trace-board",
          label: "Trace Review Orchestration",
          kind: "orchestration-board",
          target: "orchestration-board-trace-review"
        }
      ];
  }
}

function createStudioHostTracePhases(
  slot: StudioHostMutationSlot,
  handler: StudioHostBridgeSlotHandler,
  validator: StudioHostBridgeValidator | undefined,
  primaryOutcome: StudioHostBridgeSimulatedOutcome,
  terminalOutcome: StudioHostBridgeSimulatedOutcome
): StudioHostPreviewTraceStep[] {
  const validatorState = validator?.state ?? "missing";
  const rollbackStatus =
    terminalOutcome.status === "rollback-incomplete" ? "rollback-incomplete" : terminalOutcome.rollbackDisposition;

  return [
    {
      id: `${slot.id}-trace-preview`,
      phase: "preview",
      stage: "request-approval",
      label: "Approval intake mapped",
      status: "mapped",
      summary: `${slot.label} stays on a review-only approval intake path before any host-side handoff could advance.`,
      notes: [
        {
          id: `${slot.id}-trace-preview-approval`,
          label: "Approval gate",
          value: "request-approval / review-only",
          detail: "Preview mapping stays attached to the typed approval contract and the release approval workflow instead of granting execution.",
          tone: primaryOutcome.stage === "request-approval" ? "warning" : "neutral",
          links: [
            { id: `${slot.id}-link-approval-request`, label: "Approval request", kind: "approval", target: "approval.request" },
            { id: `${slot.id}-link-approval-result`, label: "Approval result", kind: "approval", target: "approval.result" },
            { id: `${slot.id}-link-lifecycle-request`, label: "Lifecycle request-approval", kind: "lifecycle", target: "lifecycle.request-approval" },
            {
              id: `${slot.id}-link-release-workflow`,
              label: "Release approval workflow",
              kind: "release-artifact",
              target: "release/RELEASE-APPROVAL-WORKFLOW.json"
            }
          ]
        },
        {
          id: `${slot.id}-trace-preview-pipeline`,
          label: "Pipeline lane",
          value: "approval orchestration / lifecycle / rollback",
          detail: "Phase60 keeps preview posture tied to the richer operator review loop so approval, lifecycle, rollback, reviewer queues, escalation windows, closeout windows, decision handoff, and cross-window review evidence stay cross-linked.",
          tone: "neutral",
          links: [
            {
              id: `${slot.id}-link-approval-orchestration`,
              label: "Approval orchestration",
              kind: "release-artifact",
              target: "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json"
            },
            {
              id: `${slot.id}-link-lifecycle-artifact`,
              label: "Decision enforcement lifecycle",
              kind: "release-artifact",
              target: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json"
            },
            {
              id: `${slot.id}-link-rollback-artifact`,
              label: "Receipt settlement closeout",
              kind: "release-artifact",
              target: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json"
            }
          ]
        }
      ]
    },
    {
      id: `${slot.id}-trace-slot`,
      phase: "slot",
      stage: "handoff-slot",
      label: "Slot handoff reviewed",
      status: "accepted",
      summary: `${handler.label} remains registered on ${slot.channel}, while ${slot.label} stays default-disabled and review-only.`,
      notes: [
        {
          id: `${slot.id}-trace-slot-validator`,
          label: "Handler / validator",
          value: `${handler.state} / ${validatorState}`,
          detail: `${handler.label} and ${validator?.label ?? "Missing validator"} keep ${slot.handoff.payloadType} -> ${slot.handoff.resultType} reviewable without opening execution.`,
          tone: validatorState === "registered" ? "positive" : "warning",
          links: [
            { id: `${slot.id}-link-slot`, label: slot.label, kind: "trace-slot", target: slot.id },
            { id: `${slot.id}-link-lifecycle-handoff`, label: "Lifecycle handoff-slot", kind: "lifecycle", target: "lifecycle.handoff-slot" },
            ...createStudioWindowCrossLinks(slot.intent)
          ]
        },
        {
          id: `${slot.id}-trace-slot-contract`,
          label: "Contract coverage",
          value: `${validator?.requiredPayloadFieldIds.length ?? 0} payload / ${validator?.requiredResultFieldIds.length ?? 0} result`,
          detail: "The handoff contract remains executable-looking in review-only mode by keeping validator coverage and slot payload/result shapes visible together.",
          tone: "neutral",
          links: [
            { id: `${slot.id}-link-approval-stage`, label: "Approval stage", kind: "lifecycle", target: "lifecycle.request-approval" },
            { id: `${slot.id}-link-audit-stage`, label: "Audit stage", kind: "lifecycle", target: "lifecycle.write-audit" }
          ]
        }
      ]
    },
    {
      id: `${slot.id}-trace-result`,
      phase: "result",
      stage: primaryOutcome.stage,
      label: "Structured result recorded",
      status: primaryOutcome.status,
      summary: primaryOutcome.summary,
      notes: [
        {
          id: `${slot.id}-trace-result-failure`,
          label: "Result posture",
          value: `${primaryOutcome.failureCode} / ${primaryOutcome.failureDisposition}`,
          detail: "The placeholder slot result keeps the failure taxonomy, lifecycle stage, and release review posture synchronized.",
          tone: primaryOutcome.failureDisposition === "blocked" ? "neutral" : "warning",
          links: [
            { id: `${slot.id}-link-result-stage`, label: `Lifecycle ${primaryOutcome.stage}`, kind: "lifecycle", target: `lifecycle.${primaryOutcome.stage}` },
            { id: `${slot.id}-link-audit`, label: "Audit envelope", kind: "audit", target: "audit.event" }
          ]
        },
        {
          id: `${slot.id}-trace-result-approval`,
          label: "Approval pipeline handoff",
          value: "attestation review -> release decision lifecycle",
          detail: "Result review links the slot outcome back into approval orchestration and staged release decision enforcement lifecycle evidence.",
          tone: "neutral",
          links: [
            {
              id: `${slot.id}-link-approval-routing`,
              label: "Approval routing contracts",
              kind: "release-artifact",
              target: "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json"
            },
            {
              id: `${slot.id}-link-release-lifecycle`,
              label: "Release decision lifecycle",
              kind: "release-artifact",
              target: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json"
            },
            ...createStudioWindowCrossLinks(slot.intent)
          ]
        }
      ]
    },
    {
      id: `${slot.id}-trace-rollback`,
      phase: "rollback",
      stage: terminalOutcome.stage,
      label: "Rollback closeout posture",
      status: rollbackStatus,
      summary:
        terminalOutcome.rollbackDisposition === "not-needed"
          ? "Rollback remains unnecessary for the placeholder flow."
          : `Rollback disposition stays ${terminalOutcome.rollbackDisposition} while the review-only closeout path remains descriptive.`,
      notes: [
        {
          id: `${slot.id}-trace-rollback-plan`,
          label: "Rollback disposition",
          value: `${terminalOutcome.rollbackDisposition} / ${terminalOutcome.stage}`,
          detail: "Rollback context and verification remain explicit even when the simulated outcome never leaves review-only mode.",
          tone: terminalOutcome.rollbackDisposition === "not-needed" ? "positive" : "warning",
          links: [
            { id: `${slot.id}-link-rollback-context`, label: "Rollback context", kind: "rollback", target: "rollback.context" },
            { id: `${slot.id}-link-rollback-stage`, label: `Lifecycle ${terminalOutcome.stage}`, kind: "lifecycle", target: `lifecycle.${terminalOutcome.stage}` }
          ]
        },
        {
          id: `${slot.id}-trace-rollback-settlement`,
          label: "Publication receipt closeout",
          value: "rollback settlement closeout linked",
          detail: "Rollback review is cross-linked to the publication receipt settlement closeout contract so release-facing recovery evidence stays visible.",
          tone: terminalOutcome.rollbackDisposition === "not-needed" ? "neutral" : "warning",
          links: [
            {
              id: `${slot.id}-link-rollback-closeout-contract`,
              label: "Receipt closeout contract",
              kind: "release-artifact",
              target: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json"
            },
            {
              id: `${slot.id}-link-rollback-settlement-closeout`,
              label: "Receipt settlement closeout",
              kind: "release-artifact",
              target: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json"
            }
          ]
        }
      ]
    }
  ];
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
        summary: `${slot.label} keeps ${primaryOutcome.status} -> ${terminalOutcome.rollbackDisposition} inside the disabled placeholder bridge flow.`,
        phases: createStudioHostTracePhases(slot, handler, validator, primaryOutcome, terminalOutcome)
      };
    })
    .filter((entry): entry is StudioHostTraceSlotState => entry !== null);
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

function createStudioReleaseQaCloseoutReadiness(): StudioReleaseQaCloseoutReadiness {
  return {
    id: "release-qa-closeout-readiness",
    label: "Release QA Closeout Readiness",
    mode: "review-only",
    summary:
      "Packaged-app continuity, local review packets, installer/signing handshake verification, release proof bundles, and delivery closeout settlement now stay grouped as one typed Stage C readiness surface instead of a flat list of closeout artifacts.",
    canCloseOut: false,
    activeTrackId: "release-qa-delivery-closeout",
    reviewOnlyDeliveryChainPath: "release/REVIEW-ONLY-DELIVERY-CHAIN.json",
    releaseApprovalWorkflowPath: "release/RELEASE-APPROVAL-WORKFLOW.json",
    reviewEvidenceCloseoutPath: "release/REVIEW-EVIDENCE-CLOSEOUT.json",
    releaseSummaryPath: "release/RELEASE-SUMMARY.md",
    releaseChecklistPath: "release/RELEASE-CHECKLIST.md",
    tracks: [
      {
        id: "release-qa-materialization-continuity",
        label: "Packaged-app materialization continuity",
        owner: "release-engineering",
        status: "ready",
        deliveryChainStageId: "delivery-chain-promotion-readiness",
        artifacts: [
          "release/PACKAGED-APP-DIRECTORY-SKELETON.json",
          "release/PACKAGED-APP-MATERIALIZATION-SKELETON.json",
          "release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json",
          "release/PACKAGED-APP-STAGED-OUTPUT-SKELETON.json",
          "release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json",
          "release/PACKAGED-APP-LOCAL-MATERIALIZATION-CONTRACT.json",
          "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json"
        ],
        reviewChecks: [
          "directory skeleton declared",
          "materialization sequence declared",
          "staged outputs linked",
          "bundle sealing linked",
          "local review packet linked",
          "integrity contract linked"
        ],
        blockedBy: ["packaged output materialization remains metadata-only", "bundle sealing remains metadata-only"],
        checkpointIds: ["entry-audit-retention", "entry-approval-routing"]
      },
      {
        id: "release-qa-installer-signing-handshake",
        label: "Installer / signing handshake verification",
        owner: "platform-owner",
        status: "ready",
        deliveryChainStageId: "delivery-chain-publish-decision",
        artifacts: [
          "release/INSTALLER-TARGET-BUILDER-SKELETON.json",
          "release/INSTALLER-BUILDER-EXECUTION-SKELETON.json",
          "release/INSTALLER-BUILDER-ORCHESTRATION.json",
          "release/INSTALLER-CHANNEL-ROUTING.json",
          "release/SIGNING-METADATA.json",
          "release/NOTARIZATION-PLAN.json",
          "release/SIGNING-PUBLISH-PIPELINE.json",
          "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
          "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json",
          "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json"
        ],
        reviewChecks: [
          "installer targets linked",
          "builder execution skeleton linked",
          "channel routing declared",
          "notarization plan declared",
          "signing/publish handshake linked"
        ],
        blockedBy: ["installer builder remains non-executing", "signing/notarization remain metadata-only"],
        checkpointIds: ["entry-approval-routing"]
      },
      {
        id: "release-qa-proof-bundle",
        label: "Release QA proof bundle",
        owner: "qa-owner",
        status: "in-review",
        deliveryChainStageId: "delivery-chain-operator-review",
        artifacts: [
          "release/REVIEW-MANIFEST.json",
          "release/RELEASE-SUMMARY.md",
          "release/RELEASE-CHECKLIST.md",
          "release/REVIEW-EVIDENCE-CLOSEOUT.json"
        ],
        reviewChecks: [
          "review manifest listed",
          "release summary generated",
          "checklist includes validation chain",
          "evidence closeout linked"
        ],
        blockedBy: ["reviewer acknowledgement remains metadata-only", "final signoff remains local-only"],
        checkpointIds: ["entry-audit-retention", "entry-receipt-settlement"]
      },
      {
        id: "release-qa-delivery-closeout",
        label: "Delivery closeout settlement",
        owner: "release-manager",
        status: "planned",
        deliveryChainStageId: "delivery-chain-rollback-readiness",
        artifacts: [
          "release/RELEASE-DECISION-HANDOFF.json",
          "release/RELEASE-APPROVAL-WORKFLOW.json",
          "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
          "release/RELEASE-QA-CLOSEOUT-READINESS.json"
        ],
        reviewChecks: [
          "decision handoff linked",
          "approval workflow linked",
          "receipt settlement closeout linked",
          "QA closeout route declared"
        ],
        blockedBy: ["delivery closeout remains review-only", "publish lifecycle remains non-executing"],
        checkpointIds: ["entry-receipt-settlement", "entry-rollback-live-readiness"]
      }
    ],
    blockedBy: [
      "release QA closeout remains review-only metadata",
      "installer/signing verification remains non-executing",
      "host-side execution remains disabled"
    ]
  };
}

function createStudioReleaseApprovalWorkflow(): StudioReleaseApprovalWorkflow {
  return {
    id: "release-approval-workflow",
    label: "Release Approval Workflow",
    mode: "review-only",
    summary:
      "Approval routing is now readable as a typed Stage C workflow, so approver roles, delivery-stage linkage, and checkpoint coverage stay visible without opening any signing, publish, rollback, or host execution path.",
    canApprove: false,
    activeStageId: "approval-stage-c-entry",
    gatingHandshakePath: "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
    approvalBridgePath: "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json",
    promotionHandshakePath: "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
    releaseQaCloseoutReadinessPath: "release/RELEASE-QA-CLOSEOUT-READINESS.json",
    approvalAuditRollbackEntryContractPath: "release/APPROVAL-AUDIT-ROLLBACK-ENTRY-CONTRACT.json",
    reviewOnlyDeliveryChainPath: "release/REVIEW-ONLY-DELIVERY-CHAIN.json",
    operatorReviewBoardPath: "release/OPERATOR-REVIEW-BOARD.json",
    releaseDecisionHandoffPath: "release/RELEASE-DECISION-HANDOFF.json",
    reviewEvidenceCloseoutPath: "release/REVIEW-EVIDENCE-CLOSEOUT.json",
    blockedBy: [
      "approval handshake is not executable yet",
      "operator review board remains local-only metadata",
      "release QA closeout remains review-only metadata",
      "approval / audit / rollback Stage C entry remains non-executing",
      "signing / notarization remain metadata-only",
      "signing-publish gating handshake remains metadata-only",
      "publish rollback handshake remains metadata-only",
      "publish / promotion automation is still blocked",
      "host-side execution remains disabled"
    ],
    stages: [
      {
        id: "approval-docs-manifest",
        label: "Docs and manifest review",
        status: "ready",
        approverRoles: ["release-engineering"],
        evidence: ["release/RELEASE-MANIFEST.json", "release/BUILD-METADATA.json", "release/REVIEW-MANIFEST.json"],
        deliveryChainStageIds: ["delivery-chain-attestation-intake"],
        checkpointIds: ["entry-audit-retention"]
      },
      {
        id: "approval-packaged-app",
        label: "Packaged app directory review",
        status: "planned",
        approverRoles: ["release-engineering", "platform-owner"],
        evidence: [
          "release/BUNDLE-ASSEMBLY.json",
          "release/PACKAGED-APP-DIRECTORY-SKELETON.json",
          "release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json",
          "release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json",
          "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json",
          "release/INSTALLER-TARGETS.json"
        ],
        deliveryChainStageIds: ["delivery-chain-promotion-readiness"],
        checkpointIds: ["entry-audit-retention"]
      },
      {
        id: "approval-attestation-verification",
        label: "Attestation verification, dispatch, reconciliation, approval-routing-contract, and approval-orchestration review",
        status: "planned",
        approverRoles: ["release-engineering", "security"],
        evidence: [
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
          "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json",
          "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
          "release/OPERATOR-REVIEW-BOARD.json"
        ],
        deliveryChainStageIds: ["delivery-chain-attestation-intake", "delivery-chain-operator-review"],
        checkpointIds: ["entry-approval-routing", "entry-audit-retention"]
      },
      {
        id: "approval-operator-board",
        label: "Operator review board, reviewer queue, acknowledgement, escalation window, decision handoff, and evidence closeout review",
        status: "in-review",
        approverRoles: ["release-manager", "product-owner", "runtime-owner"],
        evidence: [
          "release/OPERATOR-REVIEW-BOARD.json",
          "release/RELEASE-DECISION-HANDOFF.json",
          "release/REVIEW-EVIDENCE-CLOSEOUT.json",
          "release/RELEASE-APPROVAL-WORKFLOW.json"
        ],
        deliveryChainStageIds: ["delivery-chain-operator-review"],
        checkpointIds: ["entry-approval-routing"]
      },
      {
        id: "approval-qa-closeout",
        label: "Release QA closeout readiness review",
        status: "in-review",
        approverRoles: ["release-manager", "qa-owner", "product-owner"],
        evidence: [
          "release/RELEASE-QA-CLOSEOUT-READINESS.json",
          "release/RELEASE-CHECKLIST.md",
          "release/RELEASE-SUMMARY.md",
          "release/REVIEW-EVIDENCE-CLOSEOUT.json"
        ],
        deliveryChainStageIds: ["delivery-chain-operator-review", "delivery-chain-rollback-readiness"],
        checkpointIds: ["entry-audit-retention", "entry-receipt-settlement"]
      },
      {
        id: "approval-installer-builders",
        label: "Installer builder execution review",
        status: "planned",
        approverRoles: ["release-engineering", "platform-owner"],
        evidence: [
          "release/INSTALLER-TARGET-BUILDER-SKELETON.json",
          "release/INSTALLER-BUILDER-EXECUTION-SKELETON.json",
          "release/INSTALLER-CHANNEL-ROUTING.json",
          "release/CHANNEL-PROMOTION-EVIDENCE.json"
        ],
        deliveryChainStageIds: ["delivery-chain-publish-decision"],
        checkpointIds: ["entry-approval-routing"]
      },
      {
        id: "approval-promotion-apply",
        label: "Promotion apply, command-sheet, closeout-journal, enforcement-contract, enforcement-lifecycle, and execution checkpoint review",
        status: "planned",
        approverRoles: ["release-manager", "product-owner"],
        evidence: [
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
          "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
          "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json"
        ],
        deliveryChainStageIds: ["delivery-chain-promotion-readiness"],
        checkpointIds: ["entry-approval-routing", "entry-rollback-live-readiness"]
      },
      {
        id: "approval-stage-c-entry",
        label: "Approval / audit / rollback Stage C entry review",
        status: "planned",
        approverRoles: ["release-manager", "runtime-owner", "security"],
        evidence: [
          "release/APPROVAL-AUDIT-ROLLBACK-ENTRY-CONTRACT.json",
          "release/RELEASE-QA-CLOSEOUT-READINESS.json",
          "release/RELEASE-APPROVAL-WORKFLOW.json",
          "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json",
          "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json"
        ],
        deliveryChainStageIds: ["delivery-chain-rollback-readiness"],
        checkpointIds: [
          "entry-approval-routing",
          "entry-audit-retention",
          "entry-rollback-live-readiness",
          "entry-receipt-settlement"
        ]
      },
      {
        id: "approval-decision-receipts",
        label: "Approval orchestration, staged release decision enforcement lifecycle, and publication receipt settlement closeout review",
        status: "blocked",
        approverRoles: ["release-engineering", "release-manager", "product-owner"],
        evidence: [
          "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json",
          "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
          "release/OPERATOR-REVIEW-BOARD.json",
          "release/RELEASE-DECISION-HANDOFF.json",
          "release/REVIEW-EVIDENCE-CLOSEOUT.json",
          "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
          "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json",
          "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json",
          "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
          "release/RELEASE-APPROVAL-WORKFLOW.json",
          "release/PUBLISH-GATES.json"
        ],
        deliveryChainStageIds: ["delivery-chain-rollback-readiness", "delivery-chain-publish-decision"],
        checkpointIds: ["entry-receipt-settlement"]
      },
      {
        id: "approval-signing",
        label: "Signing, notarization, and gating handshake review",
        status: "blocked",
        approverRoles: ["security", "platform-owner"],
        evidence: [
          "release/SIGNING-METADATA.json",
          "release/NOTARIZATION-PLAN.json",
          "release/SIGNING-PUBLISH-PIPELINE.json",
          "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json"
        ],
        deliveryChainStageIds: ["delivery-chain-publish-decision"],
        checkpointIds: ["entry-approval-routing"]
      },
      {
        id: "approval-publish-promotion",
        label: "Publish, rollback, outcome-report, closeout-contract, settlement-closeout, and promotion review",
        status: "blocked",
        approverRoles: ["release-manager", "product-owner"],
        evidence: [
          "release/RELEASE-NOTES.md",
          "release/PUBLISH-GATES.json",
          "release/PROMOTION-GATES.json",
          "release/CHANNEL-PROMOTION-EVIDENCE.json",
          "release/PROMOTION-APPLY-MANIFESTS.json",
          "release/PROMOTION-EXECUTION-CHECKPOINTS.json",
          "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
          "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
          "release/PUBLISH-ROLLBACK-HANDSHAKE.json",
          "release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json",
          "release/ROLLBACK-OPERATOR-DRILLBOOKS.json",
          "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json",
          "release/ROLLBACK-CUTOVER-READINESS-MAPS.json",
          "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json",
          "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json",
          "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json",
          "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json",
          "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json",
          "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json",
          "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json"
        ],
        deliveryChainStageIds: [
          "delivery-chain-promotion-readiness",
          "delivery-chain-publish-decision",
          "delivery-chain-rollback-readiness"
        ],
        checkpointIds: ["entry-rollback-live-readiness", "entry-receipt-settlement"]
      },
      {
        id: "approval-host-safety",
        label: "Host safety boundary review",
        status: "blocked",
        approverRoles: ["runtime-owner"],
        evidence: ["release/INSTALLER-PLACEHOLDER.json"],
        deliveryChainStageIds: ["delivery-chain-rollback-readiness"],
        checkpointIds: ["entry-rollback-live-readiness"]
      }
    ]
  };
}

function createStudioReleaseApprovalAuditRollbackEntryContract(): StudioReleaseApprovalAuditRollbackEntryContract {
  return {
    id: "approval-audit-rollback-entry-contract",
    label: "Approval / Audit / Rollback Entry",
    mode: "review-only",
    summary:
      "The first safe Stage C entry now carries typed checkpoint coverage, workflow linkage, and boundary handoff context so approval, audit, rollback, and receipt settlement stay grouped as one non-executing contract.",
    canEnterExecutableApproval: false,
    activeCheckpointId: "entry-rollback-live-readiness",
    releaseQaCloseoutReadinessPath: "release/RELEASE-QA-CLOSEOUT-READINESS.json",
    approvalWorkflowPath: "release/RELEASE-APPROVAL-WORKFLOW.json",
    reviewOnlyDeliveryChainPath: "release/REVIEW-ONLY-DELIVERY-CHAIN.json",
    reviewManifestPath: "release/REVIEW-MANIFEST.json",
    attestationApplyAuditPacksPath: "release/ATTESTATION-APPLY-AUDIT-PACKS.json",
    rollbackLiveReadinessContractsPath: "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json",
    rollbackCutoverPublicationReceiptSettlementCloseoutPath: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
    checkpoints: [
      {
        id: "entry-approval-routing",
        label: "Approval routing posture",
        owner: "release-manager",
        state: "in-review",
        deliveryChainStageId: "delivery-chain-rollback-readiness",
        evidence: [
          "release/RELEASE-APPROVAL-WORKFLOW.json",
          "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json",
          "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json"
        ],
        reviewChecks: ["approval workflow linked", "routing contracts linked", "orchestration linked"],
        blockedBy: ["approval remains metadata-only", "reviewer baton remains non-executing"],
        workflowStageIds: ["approval-operator-board", "approval-stage-c-entry", "approval-signing"],
        boundaryStepIds: ["withheld-plan-approval"],
        futureExecutorSlotIds: ["slot-root-connect", "slot-bridge-attach"]
      },
      {
        id: "entry-audit-retention",
        label: "Audit retention posture",
        owner: "runtime-owner",
        state: "planned",
        deliveryChainStageId: "delivery-chain-operator-review",
        evidence: [
          "release/BUILD-METADATA.json",
          "release/REVIEW-MANIFEST.json",
          "release/ATTESTATION-APPLY-AUDIT-PACKS.json",
          "release/RELEASE-QA-CLOSEOUT-READINESS.json"
        ],
        reviewChecks: ["build metadata linked", "review manifest linked", "audit packs linked", "QA closeout proof linked"],
        blockedBy: ["audit retention remains review-only", "no executable audit emission yet"],
        workflowStageIds: ["approval-docs-manifest", "approval-attestation-verification", "approval-qa-closeout", "approval-stage-c-entry"],
        boundaryStepIds: ["withheld-plan-root", "withheld-plan-bridge", "withheld-plan-approval"],
        futureExecutorSlotIds: ["slot-root-connect", "slot-bridge-attach"]
      },
      {
        id: "entry-rollback-live-readiness",
        label: "Rollback live-readiness posture",
        owner: "runtime-owner",
        state: "planned",
        deliveryChainStageId: "delivery-chain-rollback-readiness",
        evidence: [
          "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json",
          "release/ROLLBACK-CUTOVER-READINESS-MAPS.json",
          "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json"
        ],
        reviewChecks: [
          "live-readiness contracts linked",
          "cutover readiness maps linked",
          "handoff plans linked"
        ],
        blockedBy: ["rollback remains non-executing", "cutover remains review-only"],
        workflowStageIds: ["approval-promotion-apply", "approval-stage-c-entry", "approval-publish-promotion", "approval-host-safety"],
        boundaryStepIds: ["withheld-plan-execute"],
        futureExecutorSlotIds: ["slot-lifecycle", "slot-lane-apply"]
      },
      {
        id: "entry-receipt-settlement",
        label: "Receipt settlement closeout posture",
        owner: "release-engineering",
        state: "planned",
        deliveryChainStageId: "delivery-chain-rollback-readiness",
        evidence: [
          "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json",
          "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
          "release/RELEASE-QA-CLOSEOUT-READINESS.json"
        ],
        reviewChecks: [
          "receipt closeout contracts linked",
          "receipt settlement closeout linked",
          "delivery QA closeout linked"
        ],
        blockedBy: ["publication receipt closeout remains metadata-only", "no executable rollback settlement yet"],
        workflowStageIds: ["approval-qa-closeout", "approval-stage-c-entry", "approval-decision-receipts", "approval-publish-promotion"],
        boundaryStepIds: ["withheld-plan-approval", "withheld-plan-execute"],
        futureExecutorSlotIds: ["slot-lane-apply"]
      }
    ],
    blockedBy: [
      "Stage C entry remains a local-only contract surface",
      "approval / audit / rollback remain non-executing",
      "host-side execution remains disabled"
    ]
  };
}

function createStudioReleaseRollbackLiveReadiness(): StudioReleaseRollbackLiveReadiness {
  return {
    id: "rollback-live-readiness",
    label: "Rollback Live-readiness",
    mode: "review-only",
    summary:
      "Rollback readiness now stays linked to Stage C checkpoints, withheld execution steps, and future executor slots, so the shell can inspect rollback entry posture without enabling any live publish or recovery path.",
    activeContractId: "rollback-readiness-alpha-to-beta",
    contracts: [
      {
        id: "rollback-readiness-alpha-to-beta",
        from: "alpha",
        to: "beta",
        publishRollbackPathId: "publish-rollback-alpha-to-beta",
        promotionOperatorHandoffRailId: "promotion-handoff-alpha-to-beta",
        rollbackExecutionRehearsalLedgerId: "rollback-rehearsal-alpha-to-beta",
        rollbackOperatorDrillbookId: "rollback-drillbook-alpha-to-beta",
        rollbackCutoverReadinessMapId: "rollback-cutover-map-alpha-to-beta",
        promotionStagedApplyRunsheetId: "promotion-runsheet-alpha-to-beta",
        rollbackCutoverHandoffPlanId: "rollback-handoff-alpha-to-beta",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-alpha-to-beta",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-alpha-to-beta",
        status: "blocked",
        readinessContractPath: "future/publish/alpha-to-beta/rollback-live-readiness-contract.json",
        readinessChecks: [
          "rollback rehearsal ledger linked",
          "rollback operator drillbook linked",
          "promotion operator handoff rail linked",
          "promotion command sheet linked",
          "recovery channel remains review-only",
          "rollback cutover readiness map anchor declared",
          "rollback cutover handoff plan anchor declared",
          "rollback cutover execution checklist anchor declared"
        ],
        blockedBy: [
          "rollback live-readiness remains metadata-only",
          "live publish remains blocked",
          "host-side execution remains disabled"
        ],
        canEnterLiveRollback: false,
        deliveryChainStageId: "delivery-chain-rollback-readiness",
        checkpointId: "entry-rollback-live-readiness",
        boundaryStepIds: ["withheld-plan-execute"],
        futureExecutorSlotIds: ["slot-lifecycle", "slot-lane-apply"]
      },
      {
        id: "rollback-readiness-beta-to-stable",
        from: "beta",
        to: "stable",
        publishRollbackPathId: "publish-rollback-beta-to-stable",
        promotionOperatorHandoffRailId: "promotion-handoff-beta-to-stable",
        rollbackExecutionRehearsalLedgerId: "rollback-rehearsal-beta-to-stable",
        rollbackOperatorDrillbookId: "rollback-drillbook-beta-to-stable",
        rollbackCutoverReadinessMapId: "rollback-cutover-map-beta-to-stable",
        promotionStagedApplyRunsheetId: "promotion-runsheet-beta-to-stable",
        rollbackCutoverHandoffPlanId: "rollback-handoff-beta-to-stable",
        promotionStagedApplyCommandSheetId: "promotion-command-sheet-beta-to-stable",
        rollbackCutoverExecutionChecklistId: "rollback-checklist-beta-to-stable",
        status: "blocked",
        readinessContractPath: "future/publish/beta-to-stable/rollback-live-readiness-contract.json",
        readinessChecks: [
          "rollback rehearsal ledger linked",
          "rollback operator drillbook linked",
          "promotion operator handoff rail linked",
          "promotion command sheet linked",
          "recovery channel remains review-only",
          "rollback cutover readiness map anchor declared",
          "rollback cutover handoff plan anchor declared",
          "rollback cutover execution checklist anchor declared"
        ],
        blockedBy: [
          "rollback live-readiness remains metadata-only",
          "live publish remains blocked",
          "host-side execution remains disabled"
        ],
        canEnterLiveRollback: false,
        deliveryChainStageId: "delivery-chain-rollback-readiness",
        checkpointId: "entry-rollback-live-readiness",
        boundaryStepIds: ["withheld-plan-execute"],
        futureExecutorSlotIds: ["slot-lifecycle", "slot-lane-apply"]
      }
    ],
    blockedBy: [
      "rollback live-readiness remains metadata-only",
      "live publish remains blocked",
      "host-side execution remains disabled"
    ]
  };
}

function createStudioReleaseStageCBoundaryLinkage(): StudioReleaseStageCBoundaryLinkage {
  return {
    id: "stage-c-boundary-linkage",
    label: "Withheld / Future-executor Bridge",
    summary:
      "Stage C stays inside the safe boundary, but the same review surface now shows which withheld handoff steps and future executor slots would need to exist before approval, audit, rollback, or apply could ever cross out of local-only review posture.",
    currentBoundaryLayer: "local-only",
    nextBoundaryLayer: "preview-host",
    checkpointIds: [
      "entry-approval-routing",
      "entry-audit-retention",
      "entry-rollback-live-readiness",
      "entry-receipt-settlement"
    ],
    workflowStageIds: ["approval-stage-c-entry", "approval-publish-promotion", "approval-host-safety"],
    releaseQaTrackIds: ["release-qa-proof-bundle", "release-qa-delivery-closeout"],
    withheldPlanStepIds: ["withheld-plan-root", "withheld-plan-bridge", "withheld-plan-approval", "withheld-plan-execute"],
    futureExecutorSlotIds: ["slot-root-connect", "slot-bridge-attach", "slot-lifecycle", "slot-lane-apply"],
    blockedBy: [
      "approval handshake remains withheld",
      "host mutation bridge remains disabled",
      "lifecycle runner is still missing",
      "rollback-aware live apply remains future-only"
    ]
  };
}

function createStudioReleaseStageCReadiness(): StudioReleaseStageCReadiness {
  return {
    id: "stage-c-readiness",
    label: "Stage C Readiness",
    mode: "review-only",
    summary:
      "Stage C is no longer just an entry artifact: QA closeout tracks, approval workflow stages, checkpoint-level evidence, rollback live-readiness, and withheld-to-future boundary linkage now stay aligned as one typed local-only readiness spine.",
    stageBBridgeStageId: "delivery-chain-publish-decision",
    entryStageId: "delivery-chain-rollback-readiness",
    releaseQaCloseoutReadiness: createStudioReleaseQaCloseoutReadiness(),
    approvalWorkflow: createStudioReleaseApprovalWorkflow(),
    entryContract: createStudioReleaseApprovalAuditRollbackEntryContract(),
    rollbackLiveReadiness: createStudioReleaseRollbackLiveReadiness(),
    boundaryLinkage: createStudioReleaseStageCBoundaryLinkage(),
    blockedBy: [
      "Stage C readiness remains non-executing",
      "withheld execution plan remains boundary-linked only",
      "future executor slots remain unimplemented",
      "host-side execution remains disabled"
    ]
  };
}

function createStudioReleaseDeliveryChain(
  currentStage: StudioReleaseApprovalPipelineStage,
  stages: StudioReleaseApprovalPipelineStage[]
): StudioReleaseDeliveryChain {
  const currentDeliveryStageId = currentStage.deliveryChainStageId;
  const packagedAppMaterializationContract = createStudioPackagedAppMaterializationContract();
  const stageCReadiness = createStudioReleaseStageCReadiness();

  return {
    id: "release-delivery-chain-phase60",
    title: "Delivery-chain Workspace",
    summary:
      "Phase60 slice 34 keeps the review-only delivery chain readable as a stage explorer while also surfacing packaged-app staged-output task orchestration, bundle-sealing readiness, local review packets, local progression, validator-linked observability, and a deeper Stage C readiness spine, so per-platform roots, current task evidence, packet handoffs, staged-output manifests, seal checkpoints, cross-window bridge rows, QA closeout tracks, approval workflow stages, rollback live-readiness contracts, and boundary handoff posture stay inspectable inside the same local-only metadata spine.",
    mode: "review-only",
    currentStageId: currentDeliveryStageId,
    packagedAppMaterializationContract,
    stageCReadiness,
    promotionStageIds: ["delivery-chain-promotion-readiness"],
    publishStageIds: ["delivery-chain-publish-decision"],
    rollbackStageIds: ["delivery-chain-rollback-readiness"],
    stages: [
      {
        id: "delivery-chain-attestation-intake",
        label: "Attestation intake",
        phase: "attestation",
        status: "ready",
        owner: "release-engineering",
        posture: "manifest spine sealed for operator pickup",
        summary:
          "Manifest, audit, and attestation evidence are collected as one review-only intake stage so the delivery chain starts from a typed evidence spine instead of scattered files.",
        pipelineStageId: "release-pipeline-attestation-intake",
        reviewerQueueId: "reviewer-queue-attestation-intake",
        decisionHandoffId: "decision-handoff-attestation-intake",
        evidenceCloseoutId: "evidence-closeout-attestation-intake",
        escalationWindowId: "escalation-window-attestation-intake",
        closeoutWindowId: "closeout-window-attestation-intake",
        upstreamStageIds: [],
        downstreamStageIds: ["delivery-chain-operator-review"],
        artifactGroups: [
          {
            id: "delivery-chain-attestation-intake-manifest",
            label: "Manifest spine",
            summary: "Manifest and review docs define the intake packet boundary before reviewer routing starts.",
            artifacts: ["release/RELEASE-MANIFEST.json", "release/BUILD-METADATA.json", "release/REVIEW-MANIFEST.json"]
          },
          {
            id: "delivery-chain-attestation-intake-evidence",
            label: "Attestation intake evidence",
            summary: "Attestation verification and apply-audit packs stay bundled into one reviewable intake envelope.",
            artifacts: ["release/ATTESTATION-VERIFICATION-PACKS.json", "release/ATTESTATION-APPLY-AUDIT-PACKS.json"]
          }
        ],
        blockedBy: ["intake acknowledgement remains metadata-only", "host-side execution remains disabled"]
      },
      {
        id: "delivery-chain-operator-review",
        label: "Operator review",
        phase: "review",
        status: "in-review",
        owner: "release-manager",
        posture: "active reviewer queue / acknowledgement pending",
        summary:
          "The active delivery-chain stage now centers the operator board, reviewer queue, decision handoff, and evidence closeout so approval routing reads like a real delivery checkpoint while staying local-only.",
        pipelineStageId: "release-pipeline-approval-orchestration",
        reviewerQueueId: "reviewer-queue-approval-orchestration",
        decisionHandoffId: "decision-handoff-approval-orchestration",
        evidenceCloseoutId: "evidence-closeout-approval-orchestration",
        escalationWindowId: "escalation-window-approval-orchestration",
        closeoutWindowId: "closeout-window-approval-orchestration",
        upstreamStageIds: ["delivery-chain-attestation-intake"],
        downstreamStageIds: ["delivery-chain-promotion-readiness"],
        artifactGroups: [
          {
            id: "delivery-chain-operator-review-board",
            label: "Board / handoff / closeout",
            summary: "Board posture, baton posture, and sealing posture stay visible together as one delivery checkpoint.",
            artifacts: [
              "release/OPERATOR-REVIEW-BOARD.json",
              "release/RELEASE-DECISION-HANDOFF.json",
              "release/REVIEW-EVIDENCE-CLOSEOUT.json",
              "release/RELEASE-APPROVAL-WORKFLOW.json"
            ]
          },
          {
            id: "delivery-chain-operator-review-routing",
            label: "Approval routing",
            summary: "Approval routing contracts and orchestration packs anchor reviewer ownership and queue timing.",
            artifacts: [
              "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json",
              "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json"
            ]
          },
          {
            id: "delivery-chain-operator-review-qa-closeout",
            label: "Release QA closeout",
            summary: "QA closeout readiness, checklist proof, and release summary keep the active reviewer stage tied to the same delivery closeout posture.",
            artifacts: [
              "release/RELEASE-QA-CLOSEOUT-READINESS.json",
              "release/RELEASE-CHECKLIST.md",
              "release/RELEASE-SUMMARY.md"
            ]
          }
        ],
        blockedBy: [
          "product-owner acknowledgement remains metadata-only",
          "signing-publish gating handshake remains blocked",
          "host-side execution remains disabled"
        ]
      },
      {
        id: "delivery-chain-promotion-readiness",
        label: "Promotion readiness",
        phase: "promotion",
        status: "planned",
        owner: "product-owner",
        posture: "promotion path declared / staged apply still review-only",
        summary:
          "Promotion review now behaves like a delivery stage instead of a loose file list: readiness, apply manifests, checkpoint rails, staged apply ledgers, and enforcement lifecycle all stay grouped together.",
        pipelineStageId: "release-pipeline-lifecycle-enforcement",
        reviewerQueueId: "reviewer-queue-lifecycle-enforcement",
        decisionHandoffId: "decision-handoff-lifecycle-enforcement",
        evidenceCloseoutId: "evidence-closeout-lifecycle-enforcement",
        escalationWindowId: "escalation-window-lifecycle-enforcement",
        closeoutWindowId: "closeout-window-lifecycle-enforcement",
        upstreamStageIds: ["delivery-chain-operator-review"],
        downstreamStageIds: ["delivery-chain-publish-decision", "delivery-chain-rollback-readiness"],
        artifactGroups: [
          {
            id: "delivery-chain-promotion-readiness-materialization",
            label: "Packaged-app materialization",
            summary:
              "Directory materialization, staged-output manifests, bundle-sealing checkpoints, and local review packets stay grouped as one inspectable local materialization contract before any installer or publish path exists.",
            artifacts: packagedAppMaterializationContract.artifacts
          },
          {
            id: "delivery-chain-promotion-readiness-prepare",
            label: "Promotion preflight",
            summary: "Promotion evidence, apply readiness, manifests, checkpoints, and handoff rails define the pre-cutover review path.",
            artifacts: [
              "release/CHANNEL-PROMOTION-EVIDENCE.json",
              "release/PROMOTION-APPLY-READINESS.json",
              "release/PROMOTION-APPLY-MANIFESTS.json",
              "release/PROMOTION-EXECUTION-CHECKPOINTS.json",
              "release/PROMOTION-OPERATOR-HANDOFF-RAILS.json"
            ]
          },
          {
            id: "delivery-chain-promotion-readiness-closeout",
            label: "Staged apply closeout",
            summary: "Staged ledgers, runsheets, confirmations, signoffs, and enforcement lifecycle now read as one promotion-closeout path.",
            artifacts: [
              "release/PROMOTION-STAGED-APPLY-LEDGERS.json",
              "release/PROMOTION-STAGED-APPLY-RUNSHEETS.json",
              "release/PROMOTION-STAGED-APPLY-COMMAND-SHEETS.json",
              "release/PROMOTION-STAGED-APPLY-CONFIRMATION-LEDGERS.json",
              "release/PROMOTION-STAGED-APPLY-CLOSEOUT-JOURNALS.json",
              "release/PROMOTION-STAGED-APPLY-SIGNOFF-SHEETS.json",
              "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
              "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json"
            ]
          },
          {
            id: "delivery-chain-promotion-readiness-qa-closeout",
            label: "Release QA readiness",
            summary: "QA closeout readiness keeps materialization continuity, staged delivery proof, and handoff posture grouped with promotion review.",
            artifacts: [
              "release/RELEASE-QA-CLOSEOUT-READINESS.json",
              "release/RELEASE-SUMMARY.md"
            ]
          }
        ],
        blockedBy: ["promotion staged apply remains metadata-only", "approval closeout still blocks downstream acknowledgement"]
      },
      {
        id: "delivery-chain-rollback-readiness",
        label: "Rollback readiness",
        phase: "rollback",
        status: "planned",
        owner: "runtime-owner",
        posture: "rollback rehearsal visible / settlement still overdue",
        summary:
          "Rollback review is now a named delivery stage with recovery ledgers, drillbooks, cutover maps, execution records, and publication closeout grouped into one recovery-ready metadata chain.",
        pipelineStageId: "release-pipeline-rollback-settlement",
        reviewerQueueId: "reviewer-queue-rollback-settlement",
        decisionHandoffId: "decision-handoff-rollback-settlement",
        evidenceCloseoutId: "evidence-closeout-rollback-settlement",
        escalationWindowId: "escalation-window-rollback-settlement",
        closeoutWindowId: "closeout-window-rollback-settlement",
        upstreamStageIds: ["delivery-chain-promotion-readiness"],
        downstreamStageIds: ["delivery-chain-publish-decision"],
        artifactGroups: [
          {
            id: "delivery-chain-rollback-readiness-recovery",
            label: "Recovery posture",
            summary: "Rollback handshake, recovery ledgers, rehearsal, drillbooks, and live-readiness checks define the recovery backbone.",
            artifacts: [
              "release/PUBLISH-ROLLBACK-HANDSHAKE.json",
              "release/ROLLBACK-RECOVERY-LEDGER.json",
              "release/ROLLBACK-EXECUTION-REHEARSAL-LEDGER.json",
              "release/ROLLBACK-OPERATOR-DRILLBOOKS.json",
              "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json"
            ]
          },
          {
            id: "delivery-chain-rollback-readiness-cutover",
            label: "Cutover closeout",
            summary: "Cutover readiness, execution, outcome reporting, publication bundles, and receipt settlement stay bundled as one rollback review path.",
            artifacts: [
              "release/ROLLBACK-CUTOVER-READINESS-MAPS.json",
              "release/ROLLBACK-CUTOVER-HANDOFF-PLANS.json",
              "release/ROLLBACK-CUTOVER-EXECUTION-CHECKLISTS.json",
              "release/ROLLBACK-CUTOVER-EXECUTION-RECORDS.json",
              "release/ROLLBACK-CUTOVER-OUTCOME-REPORTS.json",
              "release/ROLLBACK-CUTOVER-PUBLICATION-BUNDLES.json",
              "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json",
              "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json"
            ]
          },
          {
            id: "delivery-chain-rollback-readiness-stage-c-entry",
            label: "Stage C entry contract",
            summary: "Approval workflow, audit retention posture, rollback live-readiness, and receipt settlement now stay grouped as the first safe Stage C entry surface.",
            artifacts: [
              "release/APPROVAL-AUDIT-ROLLBACK-ENTRY-CONTRACT.json",
              "release/RELEASE-APPROVAL-WORKFLOW.json",
              "release/ATTESTATION-APPLY-AUDIT-PACKS.json",
              "release/ROLLBACK-LIVE-READINESS-CONTRACTS.json",
              "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json"
            ]
          }
        ],
        blockedBy: ["rollback publication remains review-only", "final decision board remains blocked"]
      },
      {
        id: "delivery-chain-publish-decision",
        label: "Publish decision gate",
        phase: "publish",
        status: "blocked",
        owner: "release-manager",
        posture: "signing / publish gates still metadata-only",
        summary:
          "Signing, publish, promotion gates, and final release notes are now grouped as one publish-facing decision gate instead of a scattered tail of downstream files.",
        pipelineStageId: "release-pipeline-release-decision",
        reviewerQueueId: "reviewer-queue-final-release-decision",
        decisionHandoffId: "decision-handoff-final-release-decision",
        evidenceCloseoutId: "evidence-closeout-final-release-decision",
        escalationWindowId: "escalation-window-final-release-decision",
        closeoutWindowId: "closeout-window-final-release-decision",
        upstreamStageIds: ["delivery-chain-promotion-readiness", "delivery-chain-rollback-readiness"],
        downstreamStageIds: [],
        artifactGroups: [
          {
            id: "delivery-chain-publish-decision-signing",
            label: "Signing / publish handshake",
            summary: "Signing metadata, notarization, pipeline, approval bridge, and promotion handshake remain explicit publish inputs.",
            artifacts: [
              "release/SIGNING-METADATA.json",
              "release/NOTARIZATION-PLAN.json",
              "release/SIGNING-PUBLISH-PIPELINE.json",
              "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
              "release/SIGNING-PUBLISH-APPROVAL-BRIDGE.json",
              "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json"
            ]
          },
          {
            id: "delivery-chain-publish-decision-gates",
            label: "Release gates",
            summary: "Release notes plus publish and promotion gates make the blocked final decision concrete.",
            artifacts: ["release/RELEASE-NOTES.md", "release/PUBLISH-GATES.json", "release/PROMOTION-GATES.json"]
          },
          {
            id: "delivery-chain-publish-decision-qa-closeout",
            label: "QA / closeout readiness",
            summary: "Installer-signing handshake verification and release QA closeout stay visible at the blocked publish gate instead of hiding behind separate package docs.",
            artifacts: [
              "release/RELEASE-QA-CLOSEOUT-READINESS.json",
              "release/INSTALLER-BUILDER-EXECUTION-SKELETON.json",
              "release/INSTALLER-BUILDER-ORCHESTRATION.json",
              "release/INSTALLER-CHANNEL-ROUTING.json"
            ]
          }
        ],
        blockedBy: [
          "signing-publish gating handshake remains metadata-only",
          "publish rollback handshake remains metadata-only",
          "real publish automation remains blocked"
        ]
      }
    ],
    blockedBy: [
      "delivery chain remains review-only metadata",
      "packaged-app materialization remains local-only review metadata",
      "release QA closeout remains local-only review metadata",
      "approval / audit / rollback Stage C entry remains non-executing",
      "reviewer acknowledgement remains local-only metadata",
      "promotion, publish, and rollback execution remain blocked",
      "real host-side execution remains disabled",
      "signing, publish, promotion, and rollback remain review-only metadata"
    ]
  };
}

type StudioPackagedAppReviewPacketStepKey =
  | "directory-to-output"
  | "output-to-checksum"
  | "checksum-to-seal";

function createStudioPackagedAppMaterializationReviewPacket({
  idPrefix,
  label,
  packetState,
  activeStep,
  directoryTaskId,
  stagedOutputTaskId,
  bundleSealTaskId,
  verificationManifestPath,
  outputManifestPath,
  checksumManifestPath,
  sealManifestPath,
  rollbackCheckpointId
}: {
  idPrefix: string;
  label: string;
  packetState: StudioReleasePackagedAppMaterializationTaskState;
  activeStep: StudioPackagedAppReviewPacketStepKey;
  directoryTaskId: string;
  stagedOutputTaskId: string;
  bundleSealTaskId: string;
  verificationManifestPath: string;
  outputManifestPath: string;
  checksumManifestPath: string;
  sealManifestPath: string;
  rollbackCheckpointId: string;
}): StudioReleasePackagedAppMaterializationReviewPacket {
  const packetId = `packaged-app-review-packet-${idPrefix}`;
  const stepIds = {
    "directory-to-output": `${packetId}-directory-to-output`,
    "output-to-checksum": `${packetId}-output-to-checksum`,
    "checksum-to-seal": `${packetId}-checksum-to-seal`
  } as const;
  const orderedStepIds = [stepIds["directory-to-output"], stepIds["output-to-checksum"], stepIds["checksum-to-seal"]];
  const currentStepId = stepIds[activeStep];
  const currentStepIndex = orderedStepIds.indexOf(currentStepId);
  const nextStepId = orderedStepIds[currentStepIndex + 1] ?? null;

  return {
    id: packetId,
    label: `${label} local review packet`,
    taskState: packetState,
    summary:
      `${label} keeps directory verification, staged-output manifests, and bundle-seal posture in one local-only review packet so the current handoff can be inspected without materializing anything.`,
    currentStepId,
    nextStepId,
    rollbackCheckpointId,
    reviewEvidence: [
      "release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json",
      "release/PACKAGED-APP-STAGED-OUTPUT-SKELETON.json",
      "release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json",
      outputManifestPath,
      checksumManifestPath,
      sealManifestPath
    ],
    steps: [
      {
        id: stepIds["directory-to-output"],
        label: "Directory -> staged-output handoff",
        taskState: "review-ready",
        summary:
          `${label} directory verification is already linked to the first staged-output handoff, so output-manifest review can start from the same package-root baseline.`,
        fromTaskId: directoryTaskId,
        toTaskId: stagedOutputTaskId,
        manifestPath: verificationManifestPath,
        deliveryChainStageId: "delivery-chain-attestation-intake",
        evidence: ["release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json", verificationManifestPath]
      },
      {
        id: stepIds["output-to-checksum"],
        label: "Staged-output -> checksum handoff",
        taskState: packetState,
        summary:
          `${label} output-manifest review keeps checksum proof in the same lane so staged-output evidence stays readable before any seal path can advance.`,
        fromTaskId: stagedOutputTaskId,
        toTaskId: stagedOutputTaskId,
        manifestPath: outputManifestPath,
        deliveryChainStageId: "delivery-chain-operator-review",
        evidence: ["release/PACKAGED-APP-STAGED-OUTPUT-SKELETON.json", outputManifestPath, checksumManifestPath]
      },
      {
        id: stepIds["checksum-to-seal"],
        label: "Checksum -> bundle-seal handoff",
        taskState: "blocked",
        summary:
          `${label} checksum proof is staged for review, but the bundle-seal handoff stays blocked until the local-only packet stops being metadata-only.`,
        fromTaskId: stagedOutputTaskId,
        toTaskId: bundleSealTaskId,
        manifestPath: sealManifestPath,
        deliveryChainStageId: "delivery-chain-promotion-readiness",
        evidence: ["release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json", checksumManifestPath, sealManifestPath]
      }
    ],
    blockedBy: [
      "staged outputs remain metadata-only",
      "bundle sealing remains metadata-only",
      "host-side execution remains disabled"
    ]
  };
}

function createStudioPackagedAppBundleSealingCheckpoints({
  idPrefix,
  sealManifestPath,
  integrityManifestPath,
  gateLabel,
  gateDetail,
  gateArtifactPath,
  gateStatus
}: {
  idPrefix: string;
  sealManifestPath: string;
  integrityManifestPath: string;
  gateLabel: string;
  gateDetail: string;
  gateArtifactPath: string;
  gateStatus: StudioReleasePackagedAppBundleSealingCheckpoint["status"];
}): StudioReleasePackagedAppBundleSealingCheckpoint[] {
  return [
    {
      id: `packaged-app-bundle-sealing-checkpoint-${idPrefix}-seal-manifest`,
      label: "Seal manifest declared",
      status: "ready",
      detail: "Bundle sealing stays local-only, but the seal manifest path is already explicit for review pickup.",
      artifactPath: sealManifestPath
    },
    {
      id: `packaged-app-bundle-sealing-checkpoint-${idPrefix}-integrity-manifest`,
      label: "Integrity manifest declared",
      status: "ready",
      detail: "Integrity posture stays visible beside the same seal handoff without digest publication or attestation execution.",
      artifactPath: integrityManifestPath
    },
    {
      id: `packaged-app-bundle-sealing-checkpoint-${idPrefix}-gate`,
      label: gateLabel,
      status: gateStatus,
      detail: gateDetail,
      artifactPath: gateArtifactPath
    }
  ];
}

function createStudioPackagedAppLocalMaterializationSegments({
  idPrefix,
  directoryTaskId,
  directoryStatus,
  directorySummary,
  stagedOutputTaskId,
  stagedOutputStatus,
  stagedOutputSummary,
  stagedOutputStepIds,
  bundleSealTaskId,
  bundleSealStatus,
  bundleSealSummary
}: {
  idPrefix: string;
  directoryTaskId: string;
  directoryStatus: StudioReleasePackagedAppLocalMaterializationSegment["status"];
  directorySummary: string;
  stagedOutputTaskId: string;
  stagedOutputStatus: StudioReleasePackagedAppLocalMaterializationSegment["status"];
  stagedOutputSummary: string;
  stagedOutputStepIds: string[];
  bundleSealTaskId: string;
  bundleSealStatus: StudioReleasePackagedAppLocalMaterializationSegment["status"];
  bundleSealSummary: string;
}): StudioReleasePackagedAppLocalMaterializationSegment[] {
  return [
    {
      id: `packaged-app-local-materialization-segment-${idPrefix}-directory`,
      label: "Directory materialization",
      kind: "directory",
      status: directoryStatus,
      summary: directorySummary,
      taskId: directoryTaskId,
      deliveryChainStageId: "delivery-chain-attestation-intake",
      linkedStepIds: []
    },
    {
      id: `packaged-app-local-materialization-segment-${idPrefix}-staged-output`,
      label: "Staged-output handoff",
      kind: "staged-output",
      status: stagedOutputStatus,
      summary: stagedOutputSummary,
      taskId: stagedOutputTaskId,
      deliveryChainStageId: "delivery-chain-operator-review",
      linkedStepIds: stagedOutputStepIds
    },
    {
      id: `packaged-app-local-materialization-segment-${idPrefix}-bundle-sealing`,
      label: "Bundle-sealing readiness",
      kind: "bundle-sealing",
      status: bundleSealStatus,
      summary: bundleSealSummary,
      taskId: bundleSealTaskId,
      deliveryChainStageId: "delivery-chain-promotion-readiness",
      linkedStepIds: []
    }
  ];
}

type StudioPackagedAppMaterializationValidatorReadoutKey = "directory" | "staged-output" | "bundle-sealing";

function createStudioPackagedAppMaterializationValidatorReadout({
  bridgeId,
  platformLabel,
  key,
  label,
  status,
  summary,
  taskId,
  segmentId,
  deliveryChainStageId
}: {
  bridgeId: string;
  platformLabel: string;
  key: StudioPackagedAppMaterializationValidatorReadoutKey;
  label: string;
  status: StudioReleasePackagedAppMaterializationValidatorStatus;
  summary: string;
  taskId: string;
  segmentId: string;
  deliveryChainStageId: string;
}): StudioReleasePackagedAppMaterializationValidatorObservabilityReadout {
  switch (key) {
    case "directory":
      return {
        id: `${bridgeId}-${key}`,
        label,
        status,
        summary,
        taskId,
        segmentId,
        deliveryChainStageId,
        windowId: "window-shell-main",
        sharedStateLaneId: "shared-state-lane-boundary-review",
        orchestrationBoardId: "orchestration-board-boundary-review",
        observabilityMappingId: "observability-mapping-boundary-intake",
        observabilitySignalIds: [
          "observability-signal-owner",
          "observability-signal-route-window",
          "observability-signal-lane-board"
        ],
        validatorChecks: [
          `${platformLabel} verification manifest linked`,
          `${platformLabel} materialization root declared`,
          "boundary intake visibility linked"
        ]
      };
    case "staged-output":
      return {
        id: `${bridgeId}-${key}`,
        label,
        status,
        summary,
        taskId,
        segmentId,
        deliveryChainStageId,
        windowId: "window-trace-review",
        sharedStateLaneId: "shared-state-lane-trace-review",
        orchestrationBoardId: "orchestration-board-trace-review",
        observabilityMappingId: "observability-mapping-approval-active",
        observabilitySignalIds: [
          "observability-signal-owner",
          "observability-signal-queue",
          "observability-signal-escalation-closeout"
        ],
        validatorChecks: [
          `${platformLabel} output manifest linked`,
          `${platformLabel} checksum manifest linked`,
          "operator review visibility linked"
        ]
      };
    default:
      return {
        id: `${bridgeId}-${key}`,
        label,
        status,
        summary,
        taskId,
        segmentId,
        deliveryChainStageId,
        windowId: "window-review-board",
        sharedStateLaneId: "shared-state-lane-preview-review",
        orchestrationBoardId: "orchestration-board-preview-review",
        observabilityMappingId: "observability-mapping-lifecycle-preview",
        observabilitySignalIds: [
          "observability-signal-owner",
          "observability-signal-lane-board",
          "observability-signal-mapped-windows"
        ],
        validatorChecks: [
          `${platformLabel} active bundle-sealing checkpoint linked`,
          "preview lifecycle visibility linked",
          "downstream publish gate remains review-only"
        ]
      };
  }
}

function createStudioPackagedAppMaterializationValidatorObservabilityBridge({
  idPrefix,
  platformLabel,
  taskState,
  summary,
  activeReadout,
  nextReadout,
  directoryTaskId,
  directorySegmentId,
  directoryStatus,
  directorySummary,
  stagedOutputTaskId,
  stagedOutputSegmentId,
  stagedOutputStatus,
  stagedOutputSummary,
  bundleSealTaskId,
  bundleSealSegmentId,
  bundleSealStatus,
  bundleSealSummary
}: {
  idPrefix: string;
  platformLabel: string;
  taskState: StudioReleasePackagedAppMaterializationTaskState;
  summary: string;
  activeReadout: StudioPackagedAppMaterializationValidatorReadoutKey;
  nextReadout: StudioPackagedAppMaterializationValidatorReadoutKey | null;
  directoryTaskId: string;
  directorySegmentId: string;
  directoryStatus: StudioReleasePackagedAppMaterializationValidatorStatus;
  directorySummary: string;
  stagedOutputTaskId: string;
  stagedOutputSegmentId: string;
  stagedOutputStatus: StudioReleasePackagedAppMaterializationValidatorStatus;
  stagedOutputSummary: string;
  bundleSealTaskId: string;
  bundleSealSegmentId: string;
  bundleSealStatus: StudioReleasePackagedAppMaterializationValidatorStatus;
  bundleSealSummary: string;
}): StudioReleasePackagedAppMaterializationValidatorObservabilityBridge {
  const bridgeId = `packaged-app-materialization-validator-observability-${idPrefix}`;
  const readoutIds = {
    directory: `${bridgeId}-directory`,
    "staged-output": `${bridgeId}-staged-output`,
    "bundle-sealing": `${bridgeId}-bundle-sealing`
  } as const;

  return {
    id: bridgeId,
    label: `${platformLabel} validator / observability bridge`,
    taskState,
    summary,
    activeReadoutId: readoutIds[activeReadout],
    nextReadoutId: nextReadout ? readoutIds[nextReadout] : null,
    readouts: [
      createStudioPackagedAppMaterializationValidatorReadout({
        bridgeId,
        platformLabel,
        key: "directory",
        label: "Directory continuity validator",
        status: directoryStatus,
        summary: directorySummary,
        taskId: directoryTaskId,
        segmentId: directorySegmentId,
        deliveryChainStageId: "delivery-chain-attestation-intake"
      }),
      createStudioPackagedAppMaterializationValidatorReadout({
        bridgeId,
        platformLabel,
        key: "staged-output",
        label: "Staged-output continuity validator",
        status: stagedOutputStatus,
        summary: stagedOutputSummary,
        taskId: stagedOutputTaskId,
        segmentId: stagedOutputSegmentId,
        deliveryChainStageId: "delivery-chain-operator-review"
      }),
      createStudioPackagedAppMaterializationValidatorReadout({
        bridgeId,
        platformLabel,
        key: "bundle-sealing",
        label: "Bundle-sealing continuity validator",
        status: bundleSealStatus,
        summary: bundleSealSummary,
        taskId: bundleSealTaskId,
        segmentId: bundleSealSegmentId,
        deliveryChainStageId: "delivery-chain-promotion-readiness"
      })
    ],
    blockedBy: [
      "validator bridge remains review-only",
      "cross-window linkage remains metadata-only",
      "host-side execution remains disabled"
    ]
  };
}

function createStudioPackagedAppMaterializationContract(): StudioReleasePackagedAppMaterializationContract {
  return {
    id: "packaged-app-materialization-contract",
    label: "Packaged-app Materialization Contract",
    mode: "review-only",
    summary:
      "Packaged-app directory materialization, staged-output task chains, bundle-sealing readiness, local review packets, local progression, and validator-linked observability now stay inspectable as one per-platform task-state contract, so the shell can review active roots, evidence handoffs, seal posture, and cross-surface continuity without materializing, signing, or publishing anything.",
    currentTaskState: "reviewing",
    activePlatformId: "packaged-app-materialization-platform-windows",
    ownerStageId: "delivery-chain-promotion-readiness",
    downstreamGateStageId: "delivery-chain-publish-decision",
    artifacts: [
      "release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json",
      "release/PACKAGED-APP-MATERIALIZATION-SKELETON.json",
      "release/PACKAGED-APP-STAGED-OUTPUT-SKELETON.json",
      "release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json",
      "release/PACKAGED-APP-LOCAL-MATERIALIZATION-CONTRACT.json",
      "release/SEALED-BUNDLE-INTEGRITY-CONTRACT.json"
    ],
    platforms: [
      {
        id: "packaged-app-materialization-platform-windows",
        platform: "windows",
        status: "in-review",
        taskState: "reviewing",
        summary:
          "Windows keeps the packaged-app directory, staged-output manifests, and bundle-seal handoff visible as one local-only review lane, with staged-output evidence currently under review.",
        currentTaskId: "packaged-app-materialization-task-windows-staged-output",
        directoryMaterializationId: "directory-materialization-windows",
        materializationId: "materialize-windows-packaged-app",
        stagedOutputId: "staged-output-windows",
        bundleSealingId: "bundle-sealing-windows",
        verificationManifestPath: "future/packaged-app/windows/materialization-manifest.json",
        stagedOutputRoot: "future/staged-output/windows/OpenClaw Studio",
        localRoots: {
          materializationRoot: "future/packaged-app/windows/OpenClaw Studio",
          stagedOutputRoot: "future/staged-output/windows/OpenClaw Studio",
          sealedBundleRoot: "future/sealed-bundles/windows/OpenClaw Studio"
        },
        stagedOutputManifestPaths: [
          "future/staged-output/windows/output-manifest.json",
          "future/staged-output/windows/checksum-manifest.json"
        ],
        manifests: {
          directoryVerification: "future/packaged-app/windows/materialization-manifest.json",
          stagedOutput: [
            "future/staged-output/windows/output-manifest.json",
            "future/staged-output/windows/checksum-manifest.json"
          ],
          bundleSeal: "future/sealed-bundles/windows/bundle-seal-manifest.json",
          bundleIntegrity: "future/sealed-bundles/windows/bundle-integrity-manifest.json",
          integrityContract: "future/sealed-bundles/windows/integrity-contract.json"
        },
        sealManifestPath: "future/sealed-bundles/windows/bundle-seal-manifest.json",
        integrityManifestPath: "future/sealed-bundles/windows/bundle-integrity-manifest.json",
        rollbackCheckpointId: "sealed-bundle-checkpoint-windows",
        materializationSteps: [
          "resolve renderer/electron snapshot inputs",
          "stage packaged-app directory layout",
          "record verification manifest",
          "declare staged-output manifests",
          "declare bundle-seal and integrity manifests"
        ],
        reviewChecks: [
          "launcher path remains reviewable",
          "staged output layout frozen",
          "seal manifest declared",
          "integrity manifest path declared"
        ],
        stagedOutputChain: {
          id: "packaged-app-staged-output-chain-windows",
          label: "Windows staged-output chain",
          summary:
            "Directory verification, output-manifest staging, and checksum-manifest staging stay chained as one local-only Windows handoff before bundle sealing can be reviewed.",
          currentStepId: "packaged-app-staged-output-step-windows-output-manifest",
          nextStepId: "packaged-app-staged-output-step-windows-checksum-manifest",
          downstreamBundleSealingId: "bundle-sealing-windows",
          completedStepIds: ["packaged-app-staged-output-step-windows-directory-verification"],
          steps: [
            {
              id: "packaged-app-staged-output-step-windows-directory-verification",
              label: "Directory verification handoff",
              taskState: "review-ready",
              summary: "Verification metadata is ready so the staged-output lane starts from an explicit packaged-app root review checkpoint.",
              manifestPath: "future/packaged-app/windows/materialization-manifest.json",
              deliveryChainStageId: "delivery-chain-attestation-intake",
              dependsOn: ["packaged-app-materialization-task-windows-directory"]
            },
            {
              id: "packaged-app-staged-output-step-windows-output-manifest",
              label: "Output manifest staging",
              taskState: "reviewing",
              summary:
                "The output manifest is the current Windows review focus so the staged-output handoff stays readable without producing a real packaged bundle.",
              manifestPath: "future/staged-output/windows/output-manifest.json",
              deliveryChainStageId: "delivery-chain-operator-review",
              dependsOn: ["packaged-app-materialization-task-windows-directory"]
            },
            {
              id: "packaged-app-staged-output-step-windows-checksum-manifest",
              label: "Checksum manifest staging",
              taskState: "reviewing",
              summary: "Checksum metadata remains chained behind the same staged-output task so output proof and digest posture stay in one lane.",
              manifestPath: "future/staged-output/windows/checksum-manifest.json",
              deliveryChainStageId: "delivery-chain-operator-review",
              dependsOn: ["packaged-app-materialization-task-windows-staged-output"]
            }
          ]
        },
        reviewPacket: createStudioPackagedAppMaterializationReviewPacket({
          idPrefix: "windows",
          label: "Windows",
          packetState: "reviewing",
          activeStep: "output-to-checksum",
          directoryTaskId: "packaged-app-materialization-task-windows-directory",
          stagedOutputTaskId: "packaged-app-materialization-task-windows-staged-output",
          bundleSealTaskId: "packaged-app-materialization-task-windows-bundle-seal",
          verificationManifestPath: "future/packaged-app/windows/materialization-manifest.json",
          outputManifestPath: "future/staged-output/windows/output-manifest.json",
          checksumManifestPath: "future/staged-output/windows/checksum-manifest.json",
          sealManifestPath: "future/sealed-bundles/windows/bundle-seal-manifest.json",
          rollbackCheckpointId: "sealed-bundle-checkpoint-windows"
        }),
        bundleSealingReadiness: {
          id: "packaged-app-bundle-sealing-readiness-windows",
          label: "Windows bundle-sealing readiness",
          taskState: "blocked",
          summary:
            "Seal and integrity manifests are declared, but the Windows seal handoff remains blocked until the staged-output chain stops being metadata-only and the publish gate remains review-only.",
          currentCheckpoint: "seal manifest declared / staged-output review still active",
          activeCheckpointId: "packaged-app-bundle-sealing-checkpoint-windows-gate",
          deliveryChainStageId: "delivery-chain-promotion-readiness",
          downstreamGateStageId: "delivery-chain-publish-decision",
          dependsOnTaskId: "packaged-app-materialization-task-windows-staged-output",
          sealManifestPath: "future/sealed-bundles/windows/bundle-seal-manifest.json",
          integrityManifestPath: "future/sealed-bundles/windows/bundle-integrity-manifest.json",
          checkpoints: createStudioPackagedAppBundleSealingCheckpoints({
            idPrefix: "windows",
            sealManifestPath: "future/sealed-bundles/windows/bundle-seal-manifest.json",
            integrityManifestPath: "future/sealed-bundles/windows/bundle-integrity-manifest.json",
            gateLabel: "Staged-output review still active",
            gateDetail: "Windows bundle sealing stays behind the current staged-output review slice until the output and checksum handoff stop being metadata-only.",
            gateArtifactPath: "future/staged-output/windows/output-manifest.json",
            gateStatus: "watch"
          }),
          reviewChecks: [
            "seal manifest declared",
            "integrity manifest declared",
            "publish gate remains review-only"
          ],
          blockedBy: [
            "staged outputs remain metadata-only",
            "bundle sealing remains metadata-only",
            "host-side execution remains disabled"
          ]
        },
        localMaterializationProgress: {
          id: "packaged-app-local-materialization-progress-windows",
          label: "Windows local materialization progression",
          taskState: "reviewing",
          summary:
            "Directory review is complete, staged-output review is current, and bundle sealing stays queued as the next local-only checkpoint.",
          currentTaskId: "packaged-app-materialization-task-windows-staged-output",
          nextTaskId: "packaged-app-materialization-task-windows-bundle-seal",
          activeSegmentId: "packaged-app-local-materialization-segment-windows-staged-output",
          completedTaskCount: 1,
          blockedTaskCount: 1,
          totalTaskCount: 3,
          completedTaskIds: ["packaged-app-materialization-task-windows-directory"],
          stageSequence: [
            "delivery-chain-attestation-intake",
            "delivery-chain-operator-review",
            "delivery-chain-promotion-readiness"
          ],
          segments: createStudioPackagedAppLocalMaterializationSegments({
            idPrefix: "windows",
            directoryTaskId: "packaged-app-materialization-task-windows-directory",
            directoryStatus: "completed",
            directorySummary: "Directory verification is already closed out, so Windows review starts from an explicit packaged-app root checkpoint.",
            stagedOutputTaskId: "packaged-app-materialization-task-windows-staged-output",
            stagedOutputStatus: "active",
            stagedOutputSummary: "Windows is currently inside the staged-output handoff, with output and checksum manifests carrying the active local-only review posture.",
            stagedOutputStepIds: [
              "packaged-app-staged-output-step-windows-directory-verification",
              "packaged-app-staged-output-step-windows-output-manifest",
              "packaged-app-staged-output-step-windows-checksum-manifest"
            ],
            bundleSealTaskId: "packaged-app-materialization-task-windows-bundle-seal",
            bundleSealStatus: "blocked",
            bundleSealSummary: "Bundle sealing is the next downstream slice, but it stays blocked behind the current staged-output review and review-only publish gate."
          })
        },
        validatorObservabilityBridge: createStudioPackagedAppMaterializationValidatorObservabilityBridge({
          idPrefix: "windows",
          platformLabel: "Windows",
          taskState: "reviewing",
          summary:
            "Windows keeps directory, staged-output, and bundle-sealing validation mapped onto the boundary, approval, and preview observability rows so validator-facing progression can be followed outside the Stage Explorer without opening execution.",
          activeReadout: "staged-output",
          nextReadout: "bundle-sealing",
          directoryTaskId: "packaged-app-materialization-task-windows-directory",
          directorySegmentId: "packaged-app-local-materialization-segment-windows-directory",
          directoryStatus: "ready",
          directorySummary:
            "Windows directory verification is already visible on the boundary intake row, so main-shell review can re-read packaged roots and verification evidence without leaving the local-only lane.",
          stagedOutputTaskId: "packaged-app-materialization-task-windows-staged-output",
          stagedOutputSegmentId: "packaged-app-local-materialization-segment-windows-staged-output",
          stagedOutputStatus: "watch",
          stagedOutputSummary:
            "Windows staged-output review is the active validator slice, and the trace review row keeps output/checksum evidence aligned with the same local-only approval posture.",
          bundleSealTaskId: "packaged-app-materialization-task-windows-bundle-seal",
          bundleSealSegmentId: "packaged-app-local-materialization-segment-windows-bundle-sealing",
          bundleSealStatus: "watch",
          bundleSealSummary:
            "Windows bundle-sealing readiness is already mirrored onto the preview lifecycle row so the next checkpoint stays visible while staged-output review remains active."
        }),
        tasks: [
          {
            id: "packaged-app-materialization-task-windows-directory",
            label: "Directory materialization",
            stageId: "packaged-app-directory-materialization",
            taskState: "review-ready",
            summary:
              "Launcher path, resources tree, and verification manifest are explicit for reviewer pickup before any packaged-app root is materialized.",
            dependsOn: ["directory-materialization-windows"],
            evidence: [
              "release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json",
              "future/packaged-app/windows/materialization-manifest.json"
            ],
            deliveryChainStageId: "delivery-chain-attestation-intake"
          },
          {
            id: "packaged-app-materialization-task-windows-staged-output",
            label: "Staged output readiness",
            stageId: "packaged-app-staged-output-skeleton",
            taskState: "reviewing",
            summary:
              "Output and checksum manifests stay attached to the same packaged-app lane so the reviewer can inspect the staged-output handoff without emitting any real bundle.",
            dependsOn: ["packaged-app-materialization-task-windows-directory"],
            evidence: [
              "release/PACKAGED-APP-STAGED-OUTPUT-SKELETON.json",
              "future/staged-output/windows/output-manifest.json",
              "future/staged-output/windows/checksum-manifest.json"
            ],
            deliveryChainStageId: "delivery-chain-operator-review"
          },
          {
            id: "packaged-app-materialization-task-windows-bundle-seal",
            label: "Bundle-sealing readiness",
            stageId: "packaged-app-bundle-sealing-skeleton",
            taskState: "blocked",
            summary:
              "Seal and integrity manifests are linked, but bundle sealing stays blocked until staged outputs stop being metadata-only and later publish gates become executable.",
            dependsOn: ["packaged-app-materialization-task-windows-staged-output"],
            evidence: [
              "release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json",
              "future/sealed-bundles/windows/bundle-seal-manifest.json",
              "future/sealed-bundles/windows/bundle-integrity-manifest.json"
            ],
            deliveryChainStageId: "delivery-chain-promotion-readiness"
          }
        ],
        blockedBy: [
          "materialization remains review-only",
          "staged outputs remain metadata-only",
          "bundle sealing remains metadata-only",
          "host-side execution remains disabled"
        ]
      },
      {
        id: "packaged-app-materialization-platform-macos",
        platform: "macos",
        status: "planned",
        taskState: "review-ready",
        summary:
          "macOS keeps the .app directory, staged-output manifests, and bundle-seal checkpoints visible as one local-only review lane without creating a real app bundle.",
        currentTaskId: "packaged-app-materialization-task-macos-directory",
        directoryMaterializationId: "directory-materialization-macos",
        materializationId: "materialize-macos-packaged-app",
        stagedOutputId: "staged-output-macos",
        bundleSealingId: "bundle-sealing-macos",
        verificationManifestPath: "future/packaged-app/macos/materialization-manifest.json",
        stagedOutputRoot: "future/staged-output/macos/OpenClaw Studio.app",
        localRoots: {
          materializationRoot: "future/packaged-app/macos/OpenClaw Studio.app",
          stagedOutputRoot: "future/staged-output/macos/OpenClaw Studio.app",
          sealedBundleRoot: "future/sealed-bundles/macos/OpenClaw Studio.app"
        },
        stagedOutputManifestPaths: [
          "future/staged-output/macos/output-manifest.json",
          "future/staged-output/macos/checksum-manifest.json"
        ],
        manifests: {
          directoryVerification: "future/packaged-app/macos/materialization-manifest.json",
          stagedOutput: [
            "future/staged-output/macos/output-manifest.json",
            "future/staged-output/macos/checksum-manifest.json"
          ],
          bundleSeal: "future/sealed-bundles/macos/bundle-seal-manifest.json",
          bundleIntegrity: "future/sealed-bundles/macos/bundle-integrity-manifest.json",
          integrityContract: "future/sealed-bundles/macos/integrity-contract.json"
        },
        sealManifestPath: "future/sealed-bundles/macos/bundle-seal-manifest.json",
        integrityManifestPath: "future/sealed-bundles/macos/bundle-integrity-manifest.json",
        rollbackCheckpointId: "sealed-bundle-checkpoint-macos",
        materializationSteps: [
          "resolve renderer/electron snapshot inputs",
          "stage .app bundle layout",
          "record verification manifest",
          "declare staged-output manifests",
          "declare bundle-seal and integrity manifests"
        ],
        reviewChecks: [
          "launcher path remains reviewable",
          "bundle layout frozen",
          "seal manifest declared",
          "integrity manifest path declared"
        ],
        stagedOutputChain: {
          id: "packaged-app-staged-output-chain-macos",
          label: "macOS staged-output chain",
          summary:
            "Directory verification, output-manifest staging, and checksum-manifest staging stay chained as one local-only .app handoff before bundle sealing can be reviewed.",
          currentStepId: "packaged-app-staged-output-step-macos-directory-verification",
          nextStepId: "packaged-app-staged-output-step-macos-output-manifest",
          downstreamBundleSealingId: "bundle-sealing-macos",
          completedStepIds: [],
          steps: [
            {
              id: "packaged-app-staged-output-step-macos-directory-verification",
              label: "Directory verification handoff",
              taskState: "review-ready",
              summary: "The .app verification manifest is ready so staged-output review starts from a concrete launcher and bundle-layout checkpoint.",
              manifestPath: "future/packaged-app/macos/materialization-manifest.json",
              deliveryChainStageId: "delivery-chain-attestation-intake",
              dependsOn: ["packaged-app-materialization-task-macos-directory"]
            },
            {
              id: "packaged-app-staged-output-step-macos-output-manifest",
              label: "Output manifest staging",
              taskState: "review-ready",
              summary:
                "The output manifest stays chained to the same macOS review lane so .app staged-output posture stays visible without building anything.",
              manifestPath: "future/staged-output/macos/output-manifest.json",
              deliveryChainStageId: "delivery-chain-operator-review",
              dependsOn: ["packaged-app-materialization-task-macos-directory"]
            },
            {
              id: "packaged-app-staged-output-step-macos-checksum-manifest",
              label: "Checksum manifest staging",
              taskState: "review-ready",
              summary: "Checksum metadata is ready for review so bundle-seal prerequisites stay explicit before any later signing or notarization path exists.",
              manifestPath: "future/staged-output/macos/checksum-manifest.json",
              deliveryChainStageId: "delivery-chain-operator-review",
              dependsOn: ["packaged-app-materialization-task-macos-staged-output"]
            }
          ]
        },
        reviewPacket: createStudioPackagedAppMaterializationReviewPacket({
          idPrefix: "macos",
          label: "macOS",
          packetState: "review-ready",
          activeStep: "directory-to-output",
          directoryTaskId: "packaged-app-materialization-task-macos-directory",
          stagedOutputTaskId: "packaged-app-materialization-task-macos-staged-output",
          bundleSealTaskId: "packaged-app-materialization-task-macos-bundle-seal",
          verificationManifestPath: "future/packaged-app/macos/materialization-manifest.json",
          outputManifestPath: "future/staged-output/macos/output-manifest.json",
          checksumManifestPath: "future/staged-output/macos/checksum-manifest.json",
          sealManifestPath: "future/sealed-bundles/macos/bundle-seal-manifest.json",
          rollbackCheckpointId: "sealed-bundle-checkpoint-macos"
        }),
        bundleSealingReadiness: {
          id: "packaged-app-bundle-sealing-readiness-macos",
          label: "macOS bundle-sealing readiness",
          taskState: "blocked",
          summary:
            "Seal and integrity manifests are declared, but the macOS seal handoff remains blocked while staged-output review, signing, and notarization all stay metadata-only.",
          currentCheckpoint: "seal manifest declared / notarization path still blocked",
          activeCheckpointId: "packaged-app-bundle-sealing-checkpoint-macos-gate",
          deliveryChainStageId: "delivery-chain-promotion-readiness",
          downstreamGateStageId: "delivery-chain-publish-decision",
          dependsOnTaskId: "packaged-app-materialization-task-macos-staged-output",
          sealManifestPath: "future/sealed-bundles/macos/bundle-seal-manifest.json",
          integrityManifestPath: "future/sealed-bundles/macos/bundle-integrity-manifest.json",
          checkpoints: createStudioPackagedAppBundleSealingCheckpoints({
            idPrefix: "macos",
            sealManifestPath: "future/sealed-bundles/macos/bundle-seal-manifest.json",
            integrityManifestPath: "future/sealed-bundles/macos/bundle-integrity-manifest.json",
            gateLabel: "Notarization path still blocked",
            gateDetail: "macOS bundle sealing stays blocked until the staged-output lane is reviewed end-to-end and later signing/notarization posture stops being metadata-only.",
            gateArtifactPath: "release/NOTARIZATION-PLAN.json",
            gateStatus: "blocked"
          }),
          reviewChecks: [
            "seal manifest declared",
            "integrity manifest declared",
            "notarization path remains review-only"
          ],
          blockedBy: [
            "staged outputs remain metadata-only",
            "bundle sealing remains metadata-only",
            "host-side execution remains disabled"
          ]
        },
        localMaterializationProgress: {
          id: "packaged-app-local-materialization-progress-macos",
          label: "macOS local materialization progression",
          taskState: "review-ready",
          summary:
            "Directory review is the current macOS checkpoint, with staged-output review queued next and bundle sealing still held behind the same local-only chain.",
          currentTaskId: "packaged-app-materialization-task-macos-directory",
          nextTaskId: "packaged-app-materialization-task-macos-staged-output",
          activeSegmentId: "packaged-app-local-materialization-segment-macos-directory",
          completedTaskCount: 0,
          blockedTaskCount: 1,
          totalTaskCount: 3,
          completedTaskIds: [],
          stageSequence: [
            "delivery-chain-attestation-intake",
            "delivery-chain-operator-review",
            "delivery-chain-promotion-readiness"
          ],
          segments: createStudioPackagedAppLocalMaterializationSegments({
            idPrefix: "macos",
            directoryTaskId: "packaged-app-materialization-task-macos-directory",
            directoryStatus: "active",
            directorySummary: "macOS is still on the directory checkpoint, so the .app layout and verification manifest stay as the active reviewer pickup surface.",
            stagedOutputTaskId: "packaged-app-materialization-task-macos-staged-output",
            stagedOutputStatus: "up-next",
            stagedOutputSummary: "Once the directory checkpoint clears, the .app staged-output lane becomes the next local-only review slice.",
            stagedOutputStepIds: [
              "packaged-app-staged-output-step-macos-directory-verification",
              "packaged-app-staged-output-step-macos-output-manifest",
              "packaged-app-staged-output-step-macos-checksum-manifest"
            ],
            bundleSealTaskId: "packaged-app-materialization-task-macos-bundle-seal",
            bundleSealStatus: "blocked",
            bundleSealSummary: "Bundle sealing remains downstream but blocked until staged outputs, signing posture, and notarization readiness stop being metadata-only."
          })
        },
        validatorObservabilityBridge: createStudioPackagedAppMaterializationValidatorObservabilityBridge({
          idPrefix: "macos",
          platformLabel: "macOS",
          taskState: "review-ready",
          summary:
            "macOS keeps directory, staged-output, and bundle-sealing validation mapped across the same boundary, approval, and preview review surfaces so validator-facing handoffs stay visible even before notarization can exist.",
          activeReadout: "directory",
          nextReadout: "staged-output",
          directoryTaskId: "packaged-app-materialization-task-macos-directory",
          directorySegmentId: "packaged-app-local-materialization-segment-macos-directory",
          directoryStatus: "watch",
          directorySummary:
            "macOS directory validation is the active bridge slice, and the boundary intake row keeps the .app root, launcher layout, and verification manifest visible as the current reviewer pickup surface.",
          stagedOutputTaskId: "packaged-app-materialization-task-macos-staged-output",
          stagedOutputSegmentId: "packaged-app-local-materialization-segment-macos-staged-output",
          stagedOutputStatus: "ready",
          stagedOutputSummary:
            "macOS staged-output review is already pre-mapped to the trace review row so output/checksum continuity can be checked before the active directory slice closes.",
          bundleSealTaskId: "packaged-app-materialization-task-macos-bundle-seal",
          bundleSealSegmentId: "packaged-app-local-materialization-segment-macos-bundle-sealing",
          bundleSealStatus: "blocked",
          bundleSealSummary:
            "macOS bundle-sealing continuity stays blocked on the preview lifecycle row while staged-output review, signing posture, and notarization all remain metadata-only."
        }),
        tasks: [
          {
            id: "packaged-app-materialization-task-macos-directory",
            label: "Directory materialization",
            stageId: "packaged-app-directory-materialization",
            taskState: "review-ready",
            summary:
              "The .app launcher path, bundle layout, and verification manifest are explicit for review even though no real app bundle is materialized.",
            dependsOn: ["directory-materialization-macos"],
            evidence: [
              "release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json",
              "future/packaged-app/macos/materialization-manifest.json"
            ],
            deliveryChainStageId: "delivery-chain-attestation-intake"
          },
          {
            id: "packaged-app-materialization-task-macos-staged-output",
            label: "Staged output readiness",
            stageId: "packaged-app-staged-output-skeleton",
            taskState: "review-ready",
            summary:
              "Staged-output manifests are chained to the same .app review lane so downstream output posture stays visible without producing any app bundle for real.",
            dependsOn: ["packaged-app-materialization-task-macos-directory"],
            evidence: [
              "release/PACKAGED-APP-STAGED-OUTPUT-SKELETON.json",
              "future/staged-output/macos/output-manifest.json",
              "future/staged-output/macos/checksum-manifest.json"
            ],
            deliveryChainStageId: "delivery-chain-operator-review"
          },
          {
            id: "packaged-app-materialization-task-macos-bundle-seal",
            label: "Bundle-sealing readiness",
            stageId: "packaged-app-bundle-sealing-skeleton",
            taskState: "blocked",
            summary:
              "Seal and integrity manifests are linked, but the macOS bundle-seal handoff remains blocked while sealing and notarization stay metadata-only.",
            dependsOn: ["packaged-app-materialization-task-macos-staged-output"],
            evidence: [
              "release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json",
              "future/sealed-bundles/macos/bundle-seal-manifest.json",
              "future/sealed-bundles/macos/bundle-integrity-manifest.json"
            ],
            deliveryChainStageId: "delivery-chain-promotion-readiness"
          }
        ],
        blockedBy: [
          "materialization remains review-only",
          "staged outputs remain metadata-only",
          "bundle sealing remains metadata-only",
          "host-side execution remains disabled"
        ]
      },
      {
        id: "packaged-app-materialization-platform-linux",
        platform: "linux",
        status: "planned",
        taskState: "review-ready",
        summary:
          "Linux keeps the packaged-app directory, staged-output manifests, and bundle-seal checkpoints visible as one local-only review lane while package targets remain blocked.",
        currentTaskId: "packaged-app-materialization-task-linux-directory",
        directoryMaterializationId: "directory-materialization-linux",
        materializationId: "materialize-linux-packaged-app",
        stagedOutputId: "staged-output-linux",
        bundleSealingId: "bundle-sealing-linux",
        verificationManifestPath: "future/packaged-app/linux/materialization-manifest.json",
        stagedOutputRoot: "future/staged-output/linux/openclaw-studio",
        localRoots: {
          materializationRoot: "future/packaged-app/linux/openclaw-studio",
          stagedOutputRoot: "future/staged-output/linux/openclaw-studio",
          sealedBundleRoot: "future/sealed-bundles/linux/openclaw-studio"
        },
        stagedOutputManifestPaths: [
          "future/staged-output/linux/output-manifest.json",
          "future/staged-output/linux/checksum-manifest.json"
        ],
        manifests: {
          directoryVerification: "future/packaged-app/linux/materialization-manifest.json",
          stagedOutput: [
            "future/staged-output/linux/output-manifest.json",
            "future/staged-output/linux/checksum-manifest.json"
          ],
          bundleSeal: "future/sealed-bundles/linux/bundle-seal-manifest.json",
          bundleIntegrity: "future/sealed-bundles/linux/bundle-integrity-manifest.json",
          integrityContract: "future/sealed-bundles/linux/integrity-contract.json"
        },
        sealManifestPath: "future/sealed-bundles/linux/bundle-seal-manifest.json",
        integrityManifestPath: "future/sealed-bundles/linux/bundle-integrity-manifest.json",
        rollbackCheckpointId: "sealed-bundle-checkpoint-linux",
        materializationSteps: [
          "resolve renderer/electron snapshot inputs",
          "stage packaged-app directory layout",
          "record verification manifest",
          "declare staged-output manifests",
          "declare bundle-seal and integrity manifests"
        ],
        reviewChecks: [
          "launcher path remains reviewable",
          "staged output layout frozen",
          "seal manifest declared",
          "integrity manifest path declared"
        ],
        stagedOutputChain: {
          id: "packaged-app-staged-output-chain-linux",
          label: "Linux staged-output chain",
          summary:
            "Directory verification, output-manifest staging, and checksum-manifest staging stay chained as one local-only Linux handoff before bundle sealing can be reviewed.",
          currentStepId: "packaged-app-staged-output-step-linux-directory-verification",
          nextStepId: "packaged-app-staged-output-step-linux-output-manifest",
          downstreamBundleSealingId: "bundle-sealing-linux",
          completedStepIds: [],
          steps: [
            {
              id: "packaged-app-staged-output-step-linux-directory-verification",
              label: "Directory verification handoff",
              taskState: "review-ready",
              summary: "Verification metadata is ready so the Linux staged-output lane starts from an explicit package-root checkpoint.",
              manifestPath: "future/packaged-app/linux/materialization-manifest.json",
              deliveryChainStageId: "delivery-chain-attestation-intake",
              dependsOn: ["packaged-app-materialization-task-linux-directory"]
            },
            {
              id: "packaged-app-staged-output-step-linux-output-manifest",
              label: "Output manifest staging",
              taskState: "review-ready",
              summary:
                "The output manifest stays chained to the same Linux review lane so staged-output posture stays readable without emitting any package target.",
              manifestPath: "future/staged-output/linux/output-manifest.json",
              deliveryChainStageId: "delivery-chain-operator-review",
              dependsOn: ["packaged-app-materialization-task-linux-directory"]
            },
            {
              id: "packaged-app-staged-output-step-linux-checksum-manifest",
              label: "Checksum manifest staging",
              taskState: "review-ready",
              summary: "Checksum metadata is ready for review so bundle-seal prerequisites stay explicit before any publish path exists.",
              manifestPath: "future/staged-output/linux/checksum-manifest.json",
              deliveryChainStageId: "delivery-chain-operator-review",
              dependsOn: ["packaged-app-materialization-task-linux-staged-output"]
            }
          ]
        },
        reviewPacket: createStudioPackagedAppMaterializationReviewPacket({
          idPrefix: "linux",
          label: "Linux",
          packetState: "review-ready",
          activeStep: "directory-to-output",
          directoryTaskId: "packaged-app-materialization-task-linux-directory",
          stagedOutputTaskId: "packaged-app-materialization-task-linux-staged-output",
          bundleSealTaskId: "packaged-app-materialization-task-linux-bundle-seal",
          verificationManifestPath: "future/packaged-app/linux/materialization-manifest.json",
          outputManifestPath: "future/staged-output/linux/output-manifest.json",
          checksumManifestPath: "future/staged-output/linux/checksum-manifest.json",
          sealManifestPath: "future/sealed-bundles/linux/bundle-seal-manifest.json",
          rollbackCheckpointId: "sealed-bundle-checkpoint-linux"
        }),
        bundleSealingReadiness: {
          id: "packaged-app-bundle-sealing-readiness-linux",
          label: "Linux bundle-sealing readiness",
          taskState: "blocked",
          summary:
            "Seal and integrity manifests are declared, but the Linux seal handoff remains blocked while staged-output review and later package publication stay metadata-only.",
          currentCheckpoint: "seal manifest declared / publish path still blocked",
          activeCheckpointId: "packaged-app-bundle-sealing-checkpoint-linux-gate",
          deliveryChainStageId: "delivery-chain-promotion-readiness",
          downstreamGateStageId: "delivery-chain-publish-decision",
          dependsOnTaskId: "packaged-app-materialization-task-linux-staged-output",
          sealManifestPath: "future/sealed-bundles/linux/bundle-seal-manifest.json",
          integrityManifestPath: "future/sealed-bundles/linux/bundle-integrity-manifest.json",
          checkpoints: createStudioPackagedAppBundleSealingCheckpoints({
            idPrefix: "linux",
            sealManifestPath: "future/sealed-bundles/linux/bundle-seal-manifest.json",
            integrityManifestPath: "future/sealed-bundles/linux/bundle-integrity-manifest.json",
            gateLabel: "Package publication path still blocked",
            gateDetail: "Linux bundle sealing stays blocked until the staged-output lane settles and the downstream package publication gate stops being metadata-only.",
            gateArtifactPath: "release/PUBLISH-GATES.json",
            gateStatus: "blocked"
          }),
          reviewChecks: [
            "seal manifest declared",
            "integrity manifest declared",
            "package publication remains review-only"
          ],
          blockedBy: [
            "staged outputs remain metadata-only",
            "bundle sealing remains metadata-only",
            "host-side execution remains disabled"
          ]
        },
        localMaterializationProgress: {
          id: "packaged-app-local-materialization-progress-linux",
          label: "Linux local materialization progression",
          taskState: "review-ready",
          summary:
            "Directory review is the current Linux checkpoint, with staged-output review queued next and bundle sealing still held behind the same local-only chain.",
          currentTaskId: "packaged-app-materialization-task-linux-directory",
          nextTaskId: "packaged-app-materialization-task-linux-staged-output",
          activeSegmentId: "packaged-app-local-materialization-segment-linux-directory",
          completedTaskCount: 0,
          blockedTaskCount: 1,
          totalTaskCount: 3,
          completedTaskIds: [],
          stageSequence: [
            "delivery-chain-attestation-intake",
            "delivery-chain-operator-review",
            "delivery-chain-promotion-readiness"
          ],
          segments: createStudioPackagedAppLocalMaterializationSegments({
            idPrefix: "linux",
            directoryTaskId: "packaged-app-materialization-task-linux-directory",
            directoryStatus: "active",
            directorySummary: "Linux is still on the directory checkpoint, so the package root, resources tree, and verification manifest remain the active review surface.",
            stagedOutputTaskId: "packaged-app-materialization-task-linux-staged-output",
            stagedOutputStatus: "up-next",
            stagedOutputSummary: "Linux staged-output manifests are queued as the next local-only slice once the package-root checkpoint is closed.",
            stagedOutputStepIds: [
              "packaged-app-staged-output-step-linux-directory-verification",
              "packaged-app-staged-output-step-linux-output-manifest",
              "packaged-app-staged-output-step-linux-checksum-manifest"
            ],
            bundleSealTaskId: "packaged-app-materialization-task-linux-bundle-seal",
            bundleSealStatus: "blocked",
            bundleSealSummary: "Bundle sealing remains downstream but blocked until staged outputs settle and the package publication gate stays purely review-only."
          })
        },
        validatorObservabilityBridge: createStudioPackagedAppMaterializationValidatorObservabilityBridge({
          idPrefix: "linux",
          platformLabel: "Linux",
          taskState: "review-ready",
          summary:
            "Linux keeps directory, staged-output, and bundle-sealing validation mapped across the same boundary, approval, and preview review surfaces so validator-facing package-root continuity stays inspectable without emitting any package target.",
          activeReadout: "directory",
          nextReadout: "staged-output",
          directoryTaskId: "packaged-app-materialization-task-linux-directory",
          directorySegmentId: "packaged-app-local-materialization-segment-linux-directory",
          directoryStatus: "watch",
          directorySummary:
            "Linux directory validation is the active bridge slice, and the boundary intake row keeps package-root evidence visible while the current review stays local-only.",
          stagedOutputTaskId: "packaged-app-materialization-task-linux-staged-output",
          stagedOutputSegmentId: "packaged-app-local-materialization-segment-linux-staged-output",
          stagedOutputStatus: "ready",
          stagedOutputSummary:
            "Linux staged-output continuity is already mapped onto the trace review row so output/checksum manifests stay visible as the next validator-facing handoff.",
          bundleSealTaskId: "packaged-app-materialization-task-linux-bundle-seal",
          bundleSealSegmentId: "packaged-app-local-materialization-segment-linux-bundle-sealing",
          bundleSealStatus: "blocked",
          bundleSealSummary:
            "Linux bundle-sealing continuity stays blocked on the preview lifecycle row until staged outputs settle and the downstream package publication gate remains metadata-only."
        }),
        tasks: [
          {
            id: "packaged-app-materialization-task-linux-directory",
            label: "Directory materialization",
            stageId: "packaged-app-directory-materialization",
            taskState: "review-ready",
            summary:
              "Launcher path, resources tree, and verification manifest are explicit so the Linux package root can be reviewed without creating a real bundle.",
            dependsOn: ["directory-materialization-linux"],
            evidence: [
              "release/PACKAGED-APP-DIRECTORY-MATERIALIZATION.json",
              "future/packaged-app/linux/materialization-manifest.json"
            ],
            deliveryChainStageId: "delivery-chain-attestation-intake"
          },
          {
            id: "packaged-app-materialization-task-linux-staged-output",
            label: "Staged output readiness",
            stageId: "packaged-app-staged-output-skeleton",
            taskState: "review-ready",
            summary:
              "Output and checksum manifests are chained to the same Linux review lane so staged-output posture stays inspectable without emitting any package target.",
            dependsOn: ["packaged-app-materialization-task-linux-directory"],
            evidence: [
              "release/PACKAGED-APP-STAGED-OUTPUT-SKELETON.json",
              "future/staged-output/linux/output-manifest.json",
              "future/staged-output/linux/checksum-manifest.json"
            ],
            deliveryChainStageId: "delivery-chain-operator-review"
          },
          {
            id: "packaged-app-materialization-task-linux-bundle-seal",
            label: "Bundle-sealing readiness",
            stageId: "packaged-app-bundle-sealing-skeleton",
            taskState: "blocked",
            summary:
              "Seal and integrity manifests are linked, but the Linux bundle-seal handoff remains blocked while sealing and checksum publication stay metadata-only.",
            dependsOn: ["packaged-app-materialization-task-linux-staged-output"],
            evidence: [
              "release/PACKAGED-APP-BUNDLE-SEALING-SKELETON.json",
              "future/sealed-bundles/linux/bundle-seal-manifest.json",
              "future/sealed-bundles/linux/bundle-integrity-manifest.json"
            ],
            deliveryChainStageId: "delivery-chain-promotion-readiness"
          }
        ],
        blockedBy: [
          "materialization remains review-only",
          "staged outputs remain metadata-only",
          "bundle sealing remains metadata-only",
          "host-side execution remains disabled"
        ]
      }
    ]
  };
}

export function createStudioReleaseApprovalPipeline(hostExecutor: {
  bridge: StudioHostBridgeState;
  lifecycle: StudioHostLifecycleStage[];
  approval: StudioHostApprovalContract;
  rollback: StudioHostRollbackContract;
}): StudioReleaseApprovalPipeline {
  const focusSlot =
    hostExecutor.bridge.trace.slotRoster.find((entry) => entry.slotId === hostExecutor.bridge.trace.focusSlotId) ??
    hostExecutor.bridge.trace.slotRoster[0];
  const focusSlotLabel = focusSlot?.label ?? "Focused slot";
  const focusSlotId = focusSlot?.slotId ?? "slot-lane-apply";
  const stages: StudioReleaseApprovalPipelineStage[] = [
    {
      id: "release-pipeline-attestation-intake",
      label: "Attestation intake board",
      status: "ready",
      owner: "release-engineering",
      summary: "Manifest, audit, and attestation evidence are staged as a typed review packet before any approval routing or baton transfer begins.",
      deliveryChainStageId: "delivery-chain-attestation-intake",
      deliveryPhase: "attestation",
      evidence: [
        "release/RELEASE-MANIFEST.json",
        "release/ATTESTATION-VERIFICATION-PACKS.json",
        "release/ATTESTATION-APPLY-AUDIT-PACKS.json"
      ],
      linkedLifecycleStages: ["collect-context", "write-audit"],
      linkedSlotIds: ["slot-root-connect", focusSlotId],
      reviewerQueueId: "reviewer-queue-attestation-intake",
      escalationWindowId: "escalation-window-attestation-intake",
      closeoutWindowId: "closeout-window-attestation-intake",
      packet: {
        id: "review-packet-attestation-intake",
        label: "Intake review packet",
        status: "ready",
        owner: "release-engineering",
        summary: "Manifest, attestation verification, and audit evidence are sealed into one intake packet so the operator board starts with a concrete review packet instead of disconnected lists.",
        deliveryChainStageId: "delivery-chain-attestation-intake",
        evidence: [
          "release/RELEASE-MANIFEST.json",
          "release/ATTESTATION-VERIFICATION-PACKS.json",
          "release/ATTESTATION-APPLY-AUDIT-PACKS.json"
        ],
        reviewerNotes: [
          {
            id: "review-packet-attestation-slot",
            label: "Focused slot context",
            value: focusSlotLabel,
            detail: "The same focused slot shown in trace and dock remains attached to the intake packet as the execution-facing placeholder context.",
            tone: "neutral",
            links: [
              { id: "review-packet-attestation-link-slot", label: focusSlotLabel, kind: "trace-slot", target: focusSlotId },
              { id: "review-packet-attestation-link-lane", label: "Trace Review Lane", kind: "shared-state-lane", target: "shared-state-lane-trace-review" }
            ]
          }
        ]
      },
      handoff: {
        id: "decision-handoff-attestation-intake",
        label: "Intake to approval handoff",
        batonState: "handoff-ready",
        acknowledgementState: "acknowledged",
        sourceOwner: "release-engineering",
        targetOwner: "release-manager",
        posture: "intake packet ready for approval routing",
        summary: "The intake packet is ready to hand off into the approval board, but the baton remains review-only and never dispatches a live approval.",
        deliveryChainStageId: "delivery-chain-attestation-intake",
        packetId: "review-packet-attestation-intake",
        reviewerQueueId: "reviewer-queue-attestation-intake",
        escalationWindowId: "escalation-window-attestation-intake",
        closeoutWindowId: "closeout-window-attestation-intake",
        pending: ["approval acknowledgement stays metadata-only", "host-side execution remains disabled"],
        reviewerNotes: [
          {
            id: "decision-handoff-attestation-note",
            label: "Window handoff posture",
            value: "Trace Review Lane -> Review Deck",
            detail: "The handoff is cross-linked to the same shared-state lane and review workspace surfaced in the current shell.",
            tone: "positive",
            links: [
              { id: "decision-handoff-attestation-link-lane", label: "Trace Review Lane", kind: "shared-state-lane", target: "shared-state-lane-trace-review" },
              { id: "decision-handoff-attestation-link-window", label: "Trace Review Window", kind: "window-roster", target: "window-trace-review" }
            ]
          }
        ]
      },
      closeout: {
        id: "evidence-closeout-attestation-intake",
        label: "Intake evidence closeout",
        sealingState: "pending-seal",
        acknowledgementState: "acknowledged",
        owner: "release-engineering",
        summary: "Intake evidence is reviewable and ready for a local-only closeout summary, but the packet has not been fully sealed because downstream approval review is still open.",
        deliveryChainStageId: "delivery-chain-attestation-intake",
        reviewerQueueId: "reviewer-queue-attestation-intake",
        closeoutWindowId: "closeout-window-attestation-intake",
        sealedEvidence: ["release/RELEASE-MANIFEST.json"],
        pendingEvidence: ["release/ATTESTATION-VERIFICATION-PACKS.json", "release/ATTESTATION-APPLY-AUDIT-PACKS.json"],
        reviewerNotes: [
          {
            id: "evidence-closeout-attestation-note",
            label: "Evidence sealing",
            value: "manifest sealed / verification pending",
            detail: "Evidence sealing is explicit here so intake closeout is not hidden behind the later approval lifecycle.",
            tone: "neutral",
            links: [{ id: "evidence-closeout-attestation-link-manifest", label: "Release manifest", kind: "release-artifact", target: "release/RELEASE-MANIFEST.json" }]
          }
        ]
      },
      notes: [
        {
          id: "release-pipeline-attestation-evidence",
          label: "Evidence spine",
          value: "manifest / audit / attestation",
          detail: "The intake board keeps manifest, audit, and attestation review together before any approval posture is considered.",
          tone: "positive",
          links: [
            { id: "release-pipeline-link-manifest", label: "Release manifest", kind: "release-artifact", target: "release/RELEASE-MANIFEST.json" },
            { id: "release-pipeline-link-audit-stage", label: "Lifecycle write-audit", kind: "lifecycle", target: "lifecycle.write-audit" }
          ]
        },
        {
          id: "release-pipeline-attestation-slot",
          label: "Focused slot context",
          value: focusSlotLabel,
          detail: "The current focused slot remains attached as the most visible execution-facing placeholder while the intake board stays review-only.",
          tone: "neutral",
          links: [{ id: "release-pipeline-link-focus-slot", label: focusSlotLabel, kind: "trace-slot", target: focusSlotId }]
        }
      ]
    },
    {
      id: "release-pipeline-approval-orchestration",
      label: "Approval orchestration board",
      status: "in-review",
      owner: "release-manager",
      summary: "Phase60 keeps approval routing explicit with typed review packets, reviewer queues, acknowledgement state, baton posture, escalation windows, evidence closeout visibility, and release QA closeout posture.",
      deliveryChainStageId: "delivery-chain-operator-review",
      deliveryPhase: "review",
      evidence: [
        "release/OPERATOR-REVIEW-BOARD.json",
        "release/RELEASE-DECISION-HANDOFF.json",
        "release/REVIEW-EVIDENCE-CLOSEOUT.json",
        "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json",
        "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
        "release/RELEASE-QA-CLOSEOUT-READINESS.json",
        "release/RELEASE-APPROVAL-WORKFLOW.json"
      ],
      linkedLifecycleStages: ["request-approval", "handoff-slot"],
      linkedSlotIds: [focusSlotId, "slot-bridge-attach"],
      reviewerQueueId: "reviewer-queue-approval-orchestration",
      escalationWindowId: "escalation-window-approval-orchestration",
      closeoutWindowId: "closeout-window-approval-orchestration",
      packet: {
        id: "review-packet-approval-orchestration",
        label: "Operator routing packet",
        status: "in-review",
        owner: "release-manager",
        summary: "Approval routing, orchestration, and workflow evidence are bundled into one operator packet so stage ownership and reviewer notes stay explicit.",
        deliveryChainStageId: "delivery-chain-operator-review",
        evidence: [
          "release/OPERATOR-REVIEW-BOARD.json",
          "release/RELEASE-DECISION-HANDOFF.json",
          "release/REVIEW-EVIDENCE-CLOSEOUT.json",
          "release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json",
          "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
          "release/RELEASE-QA-CLOSEOUT-READINESS.json",
          "release/RELEASE-APPROVAL-WORKFLOW.json"
        ],
        reviewerNotes: [
          {
            id: "review-packet-approval-contract",
            label: "Approval contract",
            value: hostExecutor.approval.mode,
            detail: "The operator packet stays anchored to the typed approval request/result contract rather than any live grant.",
            tone: "warning",
            links: [
              { id: "review-packet-approval-link-request", label: "Approval request", kind: "approval", target: "approval.request" },
              { id: "review-packet-approval-link-result", label: "Approval result", kind: "approval", target: "approval.result" },
              { id: "review-packet-approval-link-board", label: "Operator review board", kind: "release-artifact", target: "release/OPERATOR-REVIEW-BOARD.json" }
            ]
          }
        ]
      },
      handoff: {
        id: "decision-handoff-approval-orchestration",
        label: "Approval to lifecycle handoff",
        batonState: "awaiting-ack",
        acknowledgementState: "pending",
        sourceOwner: "release-manager",
        targetOwner: "product-owner",
        posture: "reviewer baton waiting on decision-lifecycle acknowledgement",
        summary: "The current baton sits with the release manager and is ready to hand off into the staged release decision lifecycle once the review-only acknowledgement path is accepted.",
        deliveryChainStageId: "delivery-chain-operator-review",
        packetId: "review-packet-approval-orchestration",
        reviewerQueueId: "reviewer-queue-approval-orchestration",
        escalationWindowId: "escalation-window-approval-orchestration",
        closeoutWindowId: "closeout-window-approval-orchestration",
        pending: [
          "product-owner acknowledgement remains metadata-only",
          "signing-publish gating handshake remains blocked",
          "host-side execution remains disabled"
        ],
        reviewerNotes: [
          {
            id: "decision-handoff-approval-note",
            label: "Shared-state lane",
            value: "Trace Review Lane / synced",
            detail: "The baton posture is intentionally mirrored in the same shared-state lane and review window shown elsewhere in the shell.",
            tone: "positive",
            links: [
              { id: "decision-handoff-approval-link-lane", label: "Trace Review Lane", kind: "shared-state-lane", target: "shared-state-lane-trace-review" },
              { id: "decision-handoff-approval-link-window", label: "Trace Review Window", kind: "window-roster", target: "window-trace-review" },
              { id: "decision-handoff-approval-link-workflow", label: "Release approval workflow", kind: "release-artifact", target: "release/RELEASE-APPROVAL-WORKFLOW.json" }
            ]
          }
        ]
      },
      closeout: {
        id: "evidence-closeout-approval-orchestration",
        label: "Approval evidence closeout",
        sealingState: "open",
        acknowledgementState: "pending",
        owner: "release-manager",
        summary: "Approval evidence closeout is first-class in the operator board, but sealing remains open while lifecycle handoff and publish gating are still descriptive only.",
        deliveryChainStageId: "delivery-chain-operator-review",
        reviewerQueueId: "reviewer-queue-approval-orchestration",
        closeoutWindowId: "closeout-window-approval-orchestration",
        sealedEvidence: ["release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json"],
        pendingEvidence: [
          "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
          "release/RELEASE-QA-CLOSEOUT-READINESS.json",
          "release/RELEASE-APPROVAL-WORKFLOW.json",
          "release/RELEASE-DECISION-HANDOFF.json"
        ],
        reviewerNotes: [
          {
            id: "evidence-closeout-approval-note",
            label: "Reviewer notes",
            value: "baton open / closeout unsealed",
            detail: "Reviewer notes stay attached to the approval board so the closeout path remains visible before any future execution or publish gate exists.",
            tone: "warning",
            links: [
              { id: "evidence-closeout-approval-link-closeout", label: "Review evidence closeout", kind: "release-artifact", target: "release/REVIEW-EVIDENCE-CLOSEOUT.json" },
              { id: "evidence-closeout-approval-link-handoff", label: "Release decision handoff", kind: "release-artifact", target: "release/RELEASE-DECISION-HANDOFF.json" }
            ]
          }
        ]
      },
      notes: [
        {
          id: "release-pipeline-approval-contract",
          label: "Approval contract",
          value: hostExecutor.approval.mode,
          detail: "The release pipeline stays anchored to the typed approval request/result contract rather than any live approval grant.",
          tone: "warning",
          links: [
            { id: "release-pipeline-link-approval-request", label: "Approval request", kind: "approval", target: "approval.request" },
            { id: "release-pipeline-link-approval-result", label: "Approval result", kind: "approval", target: "approval.result" },
            { id: "release-pipeline-link-release-workflow", label: "Release approval workflow", kind: "release-artifact", target: "release/RELEASE-APPROVAL-WORKFLOW.json" }
          ]
        },
        {
          id: "release-pipeline-approval-baton",
          label: "Reviewer baton",
          value: "routing -> board -> lifecycle handoff",
          detail: "Phase60 keeps approval routing, board ownership, reviewer queues, acknowledgement posture, and explicit baton posture visible as one operator review chain while cross-window review ownership becomes more concrete.",
          tone: "neutral",
          links: [
            { id: "release-pipeline-link-lifecycle-approval", label: "Lifecycle request-approval", kind: "lifecycle", target: "lifecycle.request-approval" },
            { id: "release-pipeline-link-approval-orchestration", label: "Approval orchestration", kind: "release-artifact", target: "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json" },
            { id: "release-pipeline-link-operator-review-board", label: "Operator review board", kind: "release-artifact", target: "release/OPERATOR-REVIEW-BOARD.json" }
          ]
        }
      ]
    },
    {
      id: "release-pipeline-lifecycle-enforcement",
      label: "Release decision lifecycle",
      status: "planned",
      owner: "product-owner",
      summary: "Staged release decision enforcement remains review-only, but phase60 now carries a dedicated packet, queue posture, acknowledgement blocker, closeout expectation, and packaged-app QA continuity into the lifecycle board.",
      deliveryChainStageId: "delivery-chain-promotion-readiness",
      deliveryPhase: "promotion",
      evidence: [
        "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
        "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json",
        "release/RELEASE-DECISION-HANDOFF.json",
        "release/RELEASE-QA-CLOSEOUT-READINESS.json"
      ],
      linkedLifecycleStages: ["write-audit", "verify-host"],
      linkedSlotIds: [focusSlotId, "slot-connector-activate"],
      reviewerQueueId: "reviewer-queue-lifecycle-enforcement",
      escalationWindowId: "escalation-window-lifecycle-enforcement",
      closeoutWindowId: "closeout-window-lifecycle-enforcement",
      packet: {
        id: "review-packet-lifecycle-enforcement",
        label: "Decision lifecycle packet",
        status: "drafted",
        owner: "product-owner",
        summary: "Lifecycle checkpoints, enforcement windows, and expiry closeout are packaged together as a staged review packet even though nothing can execute yet.",
        deliveryChainStageId: "delivery-chain-promotion-readiness",
        evidence: [
          "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
          "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json",
          "release/RELEASE-DECISION-HANDOFF.json",
          "release/RELEASE-QA-CLOSEOUT-READINESS.json"
        ],
        reviewerNotes: [
          {
            id: "review-packet-lifecycle-note",
            label: "Lifecycle checkpoints",
            value: "intake / window / closeout",
            detail: "The lifecycle contract now behaves like a board-ready packet with explicit checkpoint ownership and expiry-closeout posture.",
            tone: "neutral",
            links: [
              { id: "review-packet-lifecycle-link-artifact", label: "Decision lifecycle", kind: "release-artifact", target: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json" },
              { id: "review-packet-lifecycle-link-stage", label: "Lifecycle verify-host", kind: "lifecycle", target: "lifecycle.verify-host" }
            ]
          }
        ]
      },
      handoff: {
        id: "decision-handoff-lifecycle-enforcement",
        label: "Lifecycle to rollback handoff",
        batonState: "held",
        acknowledgementState: "blocked",
        sourceOwner: "product-owner",
        targetOwner: "runtime-owner",
        posture: "lifecycle packet held until approval board closes",
        summary: "The lifecycle baton is drafted and visible, but it remains held until the active approval board finishes its review-only handoff posture.",
        deliveryChainStageId: "delivery-chain-promotion-readiness",
        packetId: "review-packet-lifecycle-enforcement",
        reviewerQueueId: "reviewer-queue-lifecycle-enforcement",
        escalationWindowId: "escalation-window-lifecycle-enforcement",
        closeoutWindowId: "closeout-window-lifecycle-enforcement",
        pending: ["approval board closeout remains open", "rollback closeout remains metadata-only"],
        reviewerNotes: [
          {
            id: "decision-handoff-lifecycle-note",
            label: "Trace linkage",
            value: focusSlotLabel,
            detail: "The lifecycle baton stays attached to the same focused slot and trace lane as the active board.",
            tone: "neutral",
            links: [{ id: "decision-handoff-lifecycle-link-slot", label: focusSlotLabel, kind: "trace-slot", target: focusSlotId }]
          }
        ]
      },
      closeout: {
        id: "evidence-closeout-lifecycle-enforcement",
        label: "Lifecycle evidence closeout",
        sealingState: "open",
        acknowledgementState: "blocked",
        owner: "product-owner",
        summary: "Lifecycle closeout remains descriptive, but the packet already declares what would need to be sealed before a later decision handoff could close.",
        deliveryChainStageId: "delivery-chain-promotion-readiness",
        reviewerQueueId: "reviewer-queue-lifecycle-enforcement",
        closeoutWindowId: "closeout-window-lifecycle-enforcement",
        sealedEvidence: [],
        pendingEvidence: [
          "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
          "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json",
          "release/RELEASE-QA-CLOSEOUT-READINESS.json"
        ],
        reviewerNotes: [
          {
            id: "evidence-closeout-lifecycle-note",
            label: "Closeout posture",
            value: "open / pending downstream board",
            detail: "Evidence closeout is visible before publish or rollback artifacts are allowed to become executable.",
            tone: "warning"
          }
        ]
      },
      notes: [
        {
          id: "release-pipeline-lifecycle-checkpoints",
          label: "Lifecycle checkpoints",
          value: "intake / window / closeout",
          detail: "The lifecycle contract now behaves like a release-decision board with explicit review checkpoints and expiry-closeout posture.",
          tone: "neutral",
          links: [
            { id: "release-pipeline-link-lifecycle-artifact", label: "Decision lifecycle", kind: "release-artifact", target: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json" },
            { id: "release-pipeline-link-verify-stage", label: "Lifecycle verify-host", kind: "lifecycle", target: "lifecycle.verify-host" }
          ]
        }
      ]
    },
    {
      id: "release-pipeline-rollback-settlement",
      label: "Rollback settlement closeout",
      status: "planned",
      owner: "runtime-owner",
      summary: "Rollback publication receipt closeout and settlement evidence remain blocked from execution, but phase60 now also exposes the first safe approval / audit / rollback Stage C entry beside the overdue acknowledgement and escalation timing.",
      deliveryChainStageId: "delivery-chain-rollback-readiness",
      deliveryPhase: "rollback",
      evidence: [
        "release/REVIEW-EVIDENCE-CLOSEOUT.json",
        "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json",
        "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
        "release/APPROVAL-AUDIT-ROLLBACK-ENTRY-CONTRACT.json"
      ],
      linkedLifecycleStages: ["rollback-host", "verify-host"],
      linkedSlotIds: [focusSlotId, "slot-lane-apply"],
      reviewerQueueId: "reviewer-queue-rollback-settlement",
      escalationWindowId: "escalation-window-rollback-settlement",
      closeoutWindowId: "closeout-window-rollback-settlement",
      packet: {
        id: "review-packet-rollback-settlement",
        label: "Rollback settlement packet",
        status: "drafted",
        owner: "runtime-owner",
        summary: "Receipt closeout contracts, settlement closeout, and reviewer notes are grouped as one rollback evidence packet.",
        deliveryChainStageId: "delivery-chain-rollback-readiness",
        evidence: [
          "release/REVIEW-EVIDENCE-CLOSEOUT.json",
          "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json",
          "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
          "release/APPROVAL-AUDIT-ROLLBACK-ENTRY-CONTRACT.json"
        ],
        reviewerNotes: [
          {
            id: "review-packet-rollback-note",
            label: "Rollback context",
            value: `${hostExecutor.rollback.stages.length} rollback stages`,
            detail: "Receipt settlement closeout is cross-linked to the typed rollback context so review can stay concrete even without live recovery.",
            tone: "warning",
            links: [
              { id: "review-packet-rollback-link-context", label: "Rollback context", kind: "rollback", target: "rollback.context" },
              { id: "review-packet-rollback-link-closeout", label: "Receipt settlement closeout", kind: "release-artifact", target: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json" }
            ]
          }
        ]
      },
      handoff: {
        id: "decision-handoff-rollback-settlement",
        label: "Rollback closeout to final decision handoff",
        batonState: "held",
        acknowledgementState: "overdue",
        sourceOwner: "runtime-owner",
        targetOwner: "release-manager",
        posture: "rollback closeout queued behind lifecycle evidence",
        summary: "The rollback baton stays visible as a future handoff target, but it cannot advance until the lifecycle packet and final release board both stop being metadata-only.",
        deliveryChainStageId: "delivery-chain-rollback-readiness",
        packetId: "review-packet-rollback-settlement",
        reviewerQueueId: "reviewer-queue-rollback-settlement",
        escalationWindowId: "escalation-window-rollback-settlement",
        closeoutWindowId: "closeout-window-rollback-settlement",
        pending: ["rollback publication remains review-only", "final decision board remains blocked"],
        reviewerNotes: [
          {
            id: "decision-handoff-rollback-note",
            label: "Closeout dependency",
            value: "receipt closeout -> settlement closeout",
            detail: "The baton only points at review artifacts; it never performs a live rollback or recovery operation.",
            tone: "warning"
          }
        ]
      },
      closeout: {
        id: "evidence-closeout-rollback-settlement",
        label: "Rollback evidence closeout",
        sealingState: "pending-seal",
        acknowledgementState: "overdue",
        owner: "runtime-owner",
        summary: "Rollback evidence sealing is explicit and visible even though the settlement closeout remains blocked from execution.",
        deliveryChainStageId: "delivery-chain-rollback-readiness",
        reviewerQueueId: "reviewer-queue-rollback-settlement",
        closeoutWindowId: "closeout-window-rollback-settlement",
        sealedEvidence: ["release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json"],
        pendingEvidence: [
          "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
          "release/REVIEW-EVIDENCE-CLOSEOUT.json",
          "release/APPROVAL-AUDIT-ROLLBACK-ENTRY-CONTRACT.json"
        ],
        reviewerNotes: [
          {
            id: "evidence-closeout-rollback-note",
            label: "Settlement evidence",
            value: "closeout contracts linked / final seal pending",
            detail: "Evidence closeout is no longer buried inside rollback JSON lists; it is surfaced as a visible review state with reviewer notes and sealing posture.",
            tone: "warning"
          }
        ]
      },
      notes: [
        {
          id: "release-pipeline-rollback-context",
          label: "Rollback context",
          value: `${hostExecutor.rollback.stages.length} rollback stages`,
          detail: "Receipt settlement closeout is cross-linked to the typed rollback context so review can stay concrete even without live recovery.",
          tone: "warning",
          links: [
            { id: "release-pipeline-link-rollback-context", label: "Rollback context", kind: "rollback", target: "rollback.context" },
            { id: "release-pipeline-link-rollback-artifact", label: "Receipt settlement closeout", kind: "release-artifact", target: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json" }
          ]
        }
      ]
    },
    {
      id: "release-pipeline-release-decision",
      label: "Final release decision board",
      status: "blocked",
      owner: "release-manager",
      summary: "The final release decision remains explicitly blocked until signing, publish, promotion, and rollback stop being metadata-only, but the blocked baton, QA closeout posture, and installer/signing handshake proof are now still visible.",
      deliveryChainStageId: "delivery-chain-publish-decision",
      deliveryPhase: "publish",
      evidence: [
        "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
        "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
        "release/PUBLISH-GATES.json",
        "release/PROMOTION-GATES.json",
        "release/RELEASE-QA-CLOSEOUT-READINESS.json"
      ],
      linkedLifecycleStages: ["request-approval", "rollback-host"],
      linkedSlotIds: [focusSlotId],
      reviewerQueueId: "reviewer-queue-final-release-decision",
      escalationWindowId: "escalation-window-final-release-decision",
      closeoutWindowId: "closeout-window-final-release-decision",
      packet: {
        id: "review-packet-final-release-decision",
        label: "Final release decision packet",
        status: "blocked",
        owner: "release-manager",
        summary: "The final release decision packet exists as an explicit blocked packet so the operator board can show what is waiting on signing, publish, and promotion.",
        deliveryChainStageId: "delivery-chain-publish-decision",
        evidence: [
          "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
          "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
          "release/PUBLISH-GATES.json",
          "release/PROMOTION-GATES.json",
          "release/RELEASE-QA-CLOSEOUT-READINESS.json"
        ],
        reviewerNotes: [
          {
            id: "review-packet-final-release-decision-note",
            label: "Decision gate",
            value: "blocked by review-only execution posture",
            detail: "The operator board exposes the final choke point directly instead of hiding it behind disconnected approval, promotion, and rollback documents.",
            tone: "warning",
            links: [
              { id: "review-packet-final-release-decision-link-signing", label: "Signing-publish gating handshake", kind: "release-artifact", target: "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json" },
              { id: "review-packet-final-release-decision-link-publish", label: "Publish gates", kind: "release-artifact", target: "release/PUBLISH-GATES.json" }
            ]
          }
        ]
      },
      handoff: {
        id: "decision-handoff-final-release-decision",
        label: "Final decision handoff",
        batonState: "blocked",
        acknowledgementState: "blocked",
        sourceOwner: "release-manager",
        targetOwner: "signing-gate",
        posture: "blocked by publish and signing gates",
        summary: "The final baton is intentionally present even though it cannot move, which keeps the missing decision handoff explicit instead of implicit.",
        deliveryChainStageId: "delivery-chain-publish-decision",
        packetId: "review-packet-final-release-decision",
        reviewerQueueId: "reviewer-queue-final-release-decision",
        escalationWindowId: "escalation-window-final-release-decision",
        closeoutWindowId: "closeout-window-final-release-decision",
        pending: [
          "signing-publish gating handshake remains metadata-only",
          "publish rollback handshake remains metadata-only",
          "real publish automation remains blocked"
        ],
        reviewerNotes: [
          {
            id: "decision-handoff-final-release-decision-note",
            label: "Blocked handoff",
            value: "release-manager -> signing-gate",
            detail: "The baton stops at the review-only boundary and never crosses into live signing, publish, or host execution.",
            tone: "warning"
          }
        ]
      },
      closeout: {
        id: "evidence-closeout-final-release-decision",
        label: "Final decision closeout",
        sealingState: "blocked",
        acknowledgementState: "blocked",
        owner: "release-manager",
        summary: "Final decision evidence closeout cannot seal until signing, publish, promotion, and rollback stop being metadata-only.",
        deliveryChainStageId: "delivery-chain-publish-decision",
        reviewerQueueId: "reviewer-queue-final-release-decision",
        closeoutWindowId: "closeout-window-final-release-decision",
        sealedEvidence: [],
        pendingEvidence: [
          "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
          "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
          "release/PUBLISH-GATES.json",
          "release/PROMOTION-GATES.json",
          "release/RELEASE-QA-CLOSEOUT-READINESS.json"
        ],
        reviewerNotes: [
          {
            id: "evidence-closeout-final-release-decision-note",
            label: "Closeout block",
            value: "signing / publish / rollback unresolved",
            detail: "Evidence closeout stays visible as blocked so the operator board preserves an honest end-state instead of implying success.",
            tone: "warning"
          }
        ]
      },
      notes: [
        {
          id: "release-pipeline-decision-gate",
          label: "Decision gate",
          value: "blocked by review-only execution posture",
          detail: "The pipeline now exposes the release-decision choke point directly instead of hiding it behind disconnected approval, promotion, and rollback documents.",
          tone: "warning",
          links: [
            { id: "release-pipeline-link-signing-handshake", label: "Signing-publish gating handshake", kind: "release-artifact", target: "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json" },
            { id: "release-pipeline-link-publish-gates", label: "Publish gates", kind: "release-artifact", target: "release/PUBLISH-GATES.json" },
            { id: "release-pipeline-link-promotion-gates", label: "Promotion gates", kind: "release-artifact", target: "release/PROMOTION-GATES.json" }
          ]
        }
      ]
    }
  ];
  const currentStage = stages.find((stage) => stage.id === "release-pipeline-approval-orchestration") ?? stages[0];

  if (!currentStage) {
    throw new Error("Release approval pipeline requires at least one stage.");
  }

  const reviewerQueues: StudioReleaseReviewerQueue[] = [
    {
      id: "reviewer-queue-attestation-intake",
      label: "Intake reviewer queue",
      status: "handoff-ready",
      owner: "release-engineering",
      summary: "Manifest and attestation intake are queued for release-manager pickup, and the acknowledgement state is already visible before the baton moves.",
      deliveryChainStageId: "delivery-chain-attestation-intake",
      stageId: "release-pipeline-attestation-intake",
      packetId: "review-packet-attestation-intake",
      handoffId: "decision-handoff-attestation-intake",
      closeoutId: "evidence-closeout-attestation-intake",
      acknowledgementState: "acknowledged",
      activeEntryId: "reviewer-queue-attestation-intake-release-engineering",
      windowId: "window-shell-main",
      sharedStateLaneId: "shared-state-lane-boundary-review",
      entries: [
        {
          id: "reviewer-queue-attestation-intake-release-engineering",
          label: "Intake packet owner",
          owner: "release-engineering",
          status: "active",
          acknowledgementState: "acknowledged",
          summary: "The intake packet is assembled, acknowledged locally, and ready to move into the operator board without dispatching a real reviewer.",
          deliveryChainStageId: "delivery-chain-attestation-intake",
          packetId: "review-packet-attestation-intake",
          handoffId: "decision-handoff-attestation-intake",
          closeoutId: "evidence-closeout-attestation-intake",
          windowId: "window-shell-main",
          sharedStateLaneId: "shared-state-lane-boundary-review",
          pending: ["release-manager pickup remains metadata-only"],
          reviewerNotes: [
            {
              id: "reviewer-queue-attestation-intake-note",
              label: "Acknowledgement",
              value: "acknowledged / staged for pickup",
              detail: "The local queue keeps acknowledgement state explicit even though no live reviewer dispatch can occur.",
              tone: "positive"
            }
          ]
        },
        {
          id: "reviewer-queue-attestation-intake-release-manager",
          label: "Board pickup",
          owner: "release-manager",
          status: "queued",
          acknowledgementState: "pending",
          summary: "The next owner is visible as a queued pickup target instead of an implicit baton hop.",
          deliveryChainStageId: "delivery-chain-attestation-intake",
          packetId: "review-packet-attestation-intake",
          handoffId: "decision-handoff-attestation-intake",
          closeoutId: "evidence-closeout-attestation-intake",
          windowId: "window-inspector-candidate",
          sharedStateLaneId: "shared-state-lane-boundary-review",
          pending: ["operator board intake remains local-only"],
          reviewerNotes: []
        }
      ]
    },
    {
      id: "reviewer-queue-approval-orchestration",
      label: "Approval reviewer queue",
      status: "active",
      owner: "release-manager",
      summary: "Queue ownership, product-owner acknowledgement, escalation watch, and closeout timing are all explicit on the active review board.",
      deliveryChainStageId: "delivery-chain-operator-review",
      stageId: "release-pipeline-approval-orchestration",
      packetId: "review-packet-approval-orchestration",
      handoffId: "decision-handoff-approval-orchestration",
      closeoutId: "evidence-closeout-approval-orchestration",
      acknowledgementState: "pending",
      activeEntryId: "reviewer-queue-approval-orchestration-release-manager",
      windowId: "window-trace-review",
      sharedStateLaneId: "shared-state-lane-trace-review",
      entries: [
        {
          id: "reviewer-queue-approval-orchestration-release-manager",
          label: "Board owner",
          owner: "release-manager",
          status: "active",
          acknowledgementState: "pending",
          summary: "The active board owner is holding the queue while the next reviewer acknowledgement remains open.",
          deliveryChainStageId: "delivery-chain-operator-review",
          packetId: "review-packet-approval-orchestration",
          handoffId: "decision-handoff-approval-orchestration",
          closeoutId: "evidence-closeout-approval-orchestration",
          windowId: "window-trace-review",
          sharedStateLaneId: "shared-state-lane-trace-review",
          pending: ["product-owner acknowledgement remains metadata-only", "closeout evidence cannot seal yet"],
          reviewerNotes: [
            {
              id: "reviewer-queue-approval-orchestration-owner-note",
              label: "Current baton",
              value: "release-manager / awaiting product-owner ack",
              detail: "The active queue entry carries the same baton posture exposed by the decision handoff card.",
              tone: "neutral"
            }
          ]
        },
        {
          id: "reviewer-queue-approval-orchestration-product-owner",
          label: "Decision-lifecycle acknowledgement",
          owner: "product-owner",
          status: "awaiting-ack",
          acknowledgementState: "pending",
          summary: "Product-owner acknowledgement is visible as an explicit queue entry instead of generic pending text.",
          deliveryChainStageId: "delivery-chain-operator-review",
          packetId: "review-packet-approval-orchestration",
          handoffId: "decision-handoff-approval-orchestration",
          closeoutId: "evidence-closeout-approval-orchestration",
          windowId: "window-review-board",
          sharedStateLaneId: "shared-state-lane-preview-review",
          pending: ["decision-lifecycle acknowledgement remains local-only", "escalation window is open but descriptive"],
          reviewerNotes: []
        },
        {
          id: "reviewer-queue-approval-orchestration-runtime-owner",
          label: "Rollback readiness observer",
          owner: "runtime-owner",
          status: "queued",
          acknowledgementState: "pending",
          summary: "Rollback readiness stays queued behind the active acknowledgement instead of being hidden in later stages.",
          deliveryChainStageId: "delivery-chain-operator-review",
          packetId: "review-packet-approval-orchestration",
          handoffId: "decision-handoff-approval-orchestration",
          closeoutId: "evidence-closeout-approval-orchestration",
          windowId: "window-review-board",
          sharedStateLaneId: "shared-state-lane-preview-review",
          pending: ["rollback readiness remains review-only"],
          reviewerNotes: []
        }
      ]
    },
    {
      id: "reviewer-queue-lifecycle-enforcement",
      label: "Lifecycle reviewer queue",
      status: "handoff-ready",
      owner: "product-owner",
      summary: "Lifecycle enforcement is pre-queued with explicit acknowledgement blockers so the next owner is visible before the board advances.",
      deliveryChainStageId: "delivery-chain-promotion-readiness",
      stageId: "release-pipeline-lifecycle-enforcement",
      packetId: "review-packet-lifecycle-enforcement",
      handoffId: "decision-handoff-lifecycle-enforcement",
      closeoutId: "evidence-closeout-lifecycle-enforcement",
      acknowledgementState: "blocked",
      activeEntryId: "reviewer-queue-lifecycle-enforcement-product-owner",
      windowId: "window-review-board",
      sharedStateLaneId: "shared-state-lane-preview-review",
      entries: [
        {
          id: "reviewer-queue-lifecycle-enforcement-product-owner",
          label: "Lifecycle queue owner",
          owner: "product-owner",
          status: "queued",
          acknowledgementState: "blocked",
          summary: "The lifecycle queue is visible, but acknowledgement cannot move until approval-board closeout is resolved.",
          deliveryChainStageId: "delivery-chain-promotion-readiness",
          packetId: "review-packet-lifecycle-enforcement",
          handoffId: "decision-handoff-lifecycle-enforcement",
          closeoutId: "evidence-closeout-lifecycle-enforcement",
          windowId: "window-review-board",
          sharedStateLaneId: "shared-state-lane-preview-review",
          pending: ["approval board closeout remains open"],
          reviewerNotes: []
        },
        {
          id: "reviewer-queue-lifecycle-enforcement-runtime-owner",
          label: "Rollback receiver",
          owner: "runtime-owner",
          status: "queued",
          acknowledgementState: "blocked",
          summary: "Rollback ownership is pre-linked, but the acknowledgement path is intentionally blocked.",
          deliveryChainStageId: "delivery-chain-promotion-readiness",
          packetId: "review-packet-lifecycle-enforcement",
          handoffId: "decision-handoff-lifecycle-enforcement",
          closeoutId: "evidence-closeout-lifecycle-enforcement",
          windowId: "window-review-board",
          sharedStateLaneId: "shared-state-lane-preview-review",
          pending: ["rollback queue remains descriptive only"],
          reviewerNotes: []
        }
      ]
    },
    {
      id: "reviewer-queue-rollback-settlement",
      label: "Rollback settlement queue",
      status: "escalated",
      owner: "runtime-owner",
      summary: "Rollback settlement carries an overdue acknowledgement and an explicit escalation window so the stalled baton is visible across the loop.",
      deliveryChainStageId: "delivery-chain-rollback-readiness",
      stageId: "release-pipeline-rollback-settlement",
      packetId: "review-packet-rollback-settlement",
      handoffId: "decision-handoff-rollback-settlement",
      closeoutId: "evidence-closeout-rollback-settlement",
      acknowledgementState: "overdue",
      activeEntryId: "reviewer-queue-rollback-settlement-runtime-owner",
      windowId: "window-trace-review",
      sharedStateLaneId: "shared-state-lane-trace-review",
      entries: [
        {
          id: "reviewer-queue-rollback-settlement-runtime-owner",
          label: "Settlement owner",
          owner: "runtime-owner",
          status: "escalated",
          acknowledgementState: "overdue",
          summary: "The rollback settlement owner has an overdue acknowledgement and is driving the active escalation window.",
          deliveryChainStageId: "delivery-chain-rollback-readiness",
          packetId: "review-packet-rollback-settlement",
          handoffId: "decision-handoff-rollback-settlement",
          closeoutId: "evidence-closeout-rollback-settlement",
          windowId: "window-trace-review",
          sharedStateLaneId: "shared-state-lane-trace-review",
          pending: ["lifecycle evidence is still blocking settlement closeout", "final decision board remains blocked"],
          reviewerNotes: []
        },
        {
          id: "reviewer-queue-rollback-settlement-release-manager",
          label: "Final decision receiver",
          owner: "release-manager",
          status: "queued",
          acknowledgementState: "overdue",
          summary: "The final decision receiver remains queued behind the overdue rollback settlement acknowledgement.",
          deliveryChainStageId: "delivery-chain-rollback-readiness",
          packetId: "review-packet-rollback-settlement",
          handoffId: "decision-handoff-rollback-settlement",
          closeoutId: "evidence-closeout-rollback-settlement",
          windowId: "window-shell-main",
          sharedStateLaneId: "shared-state-lane-boundary-review",
          pending: ["final decision board is still blocked"],
          reviewerNotes: []
        }
      ]
    },
    {
      id: "reviewer-queue-final-release-decision",
      label: "Final decision queue",
      status: "closed",
      owner: "release-manager",
      summary: "The final decision queue is explicitly closed by review-only publish and signing gates instead of silently disappearing.",
      deliveryChainStageId: "delivery-chain-publish-decision",
      stageId: "release-pipeline-release-decision",
      packetId: "review-packet-final-release-decision",
      handoffId: "decision-handoff-final-release-decision",
      closeoutId: "evidence-closeout-final-release-decision",
      acknowledgementState: "blocked",
      activeEntryId: "reviewer-queue-final-release-decision-release-manager",
      windowId: "window-shell-main",
      sharedStateLaneId: "shared-state-lane-boundary-review",
      entries: [
        {
          id: "reviewer-queue-final-release-decision-release-manager",
          label: "Final board owner",
          owner: "release-manager",
          status: "closed",
          acknowledgementState: "blocked",
          summary: "The final board remains visible, but the queue is closed by publish and signing gates.",
          deliveryChainStageId: "delivery-chain-publish-decision",
          packetId: "review-packet-final-release-decision",
          handoffId: "decision-handoff-final-release-decision",
          closeoutId: "evidence-closeout-final-release-decision",
          windowId: "window-shell-main",
          sharedStateLaneId: "shared-state-lane-boundary-review",
          pending: ["signing and publish gates remain metadata-only"],
          reviewerNotes: []
        },
        {
          id: "reviewer-queue-final-release-decision-signing-gate",
          label: "Signing gate receiver",
          owner: "signing-gate",
          status: "queued",
          acknowledgementState: "blocked",
          summary: "The blocked downstream receiver is explicit, but it never becomes executable in this phase.",
          deliveryChainStageId: "delivery-chain-publish-decision",
          packetId: "review-packet-final-release-decision",
          handoffId: "decision-handoff-final-release-decision",
          closeoutId: "evidence-closeout-final-release-decision",
          windowId: "window-review-board",
          sharedStateLaneId: "shared-state-lane-preview-review",
          pending: ["publish automation remains blocked"],
          reviewerNotes: []
        }
      ]
    }
  ];
  const escalationWindows: StudioReleaseEscalationWindow[] = [
    {
      id: "escalation-window-attestation-intake",
      label: "Intake escalation watch",
      state: "watch",
      owner: "release-engineering",
      summary: "The intake queue is acknowledged, so escalation stays on watch and never opens.",
      deliveryChainStageId: "delivery-chain-attestation-intake",
      stageId: "release-pipeline-attestation-intake",
      reviewerQueueId: "reviewer-queue-attestation-intake",
      handoffId: "decision-handoff-attestation-intake",
      acknowledgementState: "acknowledged",
      windowId: "window-shell-main",
      sharedStateLaneId: "shared-state-lane-boundary-review",
      deadlineLabel: "Before board pickup",
      trigger: "Open only if release-manager pickup drifts past the local review window.",
      pending: ["escalation remains descriptive only"],
      reviewerNotes: []
    },
    {
      id: "escalation-window-approval-orchestration",
      label: "Decision-lifecycle escalation window",
      state: "open",
      owner: "release-manager",
      summary: "The active board keeps an explicit escalation window open while product-owner acknowledgement remains pending.",
      deliveryChainStageId: "delivery-chain-operator-review",
      stageId: "release-pipeline-approval-orchestration",
      reviewerQueueId: "reviewer-queue-approval-orchestration",
      handoffId: "decision-handoff-approval-orchestration",
      acknowledgementState: "pending",
      windowId: "window-trace-review",
      sharedStateLaneId: "shared-state-lane-trace-review",
      deadlineLabel: "Next 30 min",
      trigger: "Escalate if decision-lifecycle acknowledgement remains pending after the current local review pass.",
      pending: ["product-owner acknowledgement remains metadata-only", "signing-publish gate is still blocked"],
      reviewerNotes: [
        {
          id: "escalation-window-approval-orchestration-note",
          label: "Escalation trigger",
          value: "pending acknowledgement / trace review lane",
          detail: "The open escalation window is tied to the same trace review lane and window surfaced in the shell.",
          tone: "warning"
        }
      ]
    },
    {
      id: "escalation-window-lifecycle-enforcement",
      label: "Lifecycle handoff escalation window",
      state: "blocked",
      owner: "product-owner",
      summary: "Lifecycle escalation is declared early, but it cannot open until approval closeout stops blocking acknowledgement.",
      deliveryChainStageId: "delivery-chain-promotion-readiness",
      stageId: "release-pipeline-lifecycle-enforcement",
      reviewerQueueId: "reviewer-queue-lifecycle-enforcement",
      handoffId: "decision-handoff-lifecycle-enforcement",
      acknowledgementState: "blocked",
      windowId: "window-review-board",
      sharedStateLaneId: "shared-state-lane-preview-review",
      deadlineLabel: "After approval closeout",
      trigger: "Blocked until the active board resolves its open evidence closeout.",
      pending: ["approval board closeout remains open"],
      reviewerNotes: []
    },
    {
      id: "escalation-window-rollback-settlement",
      label: "Rollback settlement escalation window",
      state: "escalated",
      owner: "runtime-owner",
      summary: "Rollback settlement has crossed into an explicit escalated state because lifecycle evidence has not cleared the overdue acknowledgement.",
      deliveryChainStageId: "delivery-chain-rollback-readiness",
      stageId: "release-pipeline-rollback-settlement",
      reviewerQueueId: "reviewer-queue-rollback-settlement",
      handoffId: "decision-handoff-rollback-settlement",
      acknowledgementState: "overdue",
      windowId: "window-trace-review",
      sharedStateLaneId: "shared-state-lane-trace-review",
      deadlineLabel: "Escalated now",
      trigger: "Lifecycle evidence is still missing after the local rollback review window elapsed.",
      pending: ["receipt settlement remains review-only", "final decision board remains blocked"],
      reviewerNotes: []
    },
    {
      id: "escalation-window-final-release-decision",
      label: "Final decision escalation window",
      state: "blocked",
      owner: "release-manager",
      summary: "The final escalation window stays visible as blocked so publish/signing gates are explicit rather than implicit.",
      deliveryChainStageId: "delivery-chain-publish-decision",
      stageId: "release-pipeline-release-decision",
      reviewerQueueId: "reviewer-queue-final-release-decision",
      handoffId: "decision-handoff-final-release-decision",
      acknowledgementState: "blocked",
      windowId: "window-shell-main",
      sharedStateLaneId: "shared-state-lane-boundary-review",
      deadlineLabel: "Blocked by gates",
      trigger: "Cannot open until signing and publish gates stop being metadata-only.",
      pending: ["signing gate is blocked", "publish gate is blocked"],
      reviewerNotes: []
    }
  ];
  const closeoutWindows: StudioReleaseCloseoutWindow[] = [
    {
      id: "closeout-window-attestation-intake",
      label: "Intake closeout window",
      state: "scheduled",
      owner: "release-engineering",
      summary: "The intake closeout window is scheduled immediately after board pickup so sealing posture stays visible before approval review starts.",
      deliveryChainStageId: "delivery-chain-attestation-intake",
      stageId: "release-pipeline-attestation-intake",
      reviewerQueueId: "reviewer-queue-attestation-intake",
      closeoutId: "evidence-closeout-attestation-intake",
      acknowledgementState: "acknowledged",
      windowId: "window-shell-main",
      sharedStateLaneId: "shared-state-lane-boundary-review",
      deadlineLabel: "After board pickup",
      sealedEvidence: ["release/RELEASE-MANIFEST.json"],
      pendingEvidence: ["release/ATTESTATION-VERIFICATION-PACKS.json", "release/ATTESTATION-APPLY-AUDIT-PACKS.json"],
      reviewerNotes: []
    },
    {
      id: "closeout-window-approval-orchestration",
      label: "Approval closeout window",
      state: "open",
      owner: "release-manager",
      summary: "Approval closeout is open alongside the active queue so pending evidence and queue state can be reviewed together.",
      deliveryChainStageId: "delivery-chain-operator-review",
      stageId: "release-pipeline-approval-orchestration",
      reviewerQueueId: "reviewer-queue-approval-orchestration",
      closeoutId: "evidence-closeout-approval-orchestration",
      acknowledgementState: "pending",
      windowId: "window-trace-review",
      sharedStateLaneId: "shared-state-lane-trace-review",
      deadlineLabel: "Current review pass",
      sealedEvidence: ["release/ATTESTATION-OPERATOR-APPROVAL-ROUTING-CONTRACTS.json"],
      pendingEvidence: [
        "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
        "release/RELEASE-APPROVAL-WORKFLOW.json",
        "release/RELEASE-DECISION-HANDOFF.json"
      ],
      reviewerNotes: [
        {
          id: "closeout-window-approval-orchestration-note",
          label: "Closeout timing",
          value: "open while acknowledgement is pending",
          detail: "The closeout window stays open until the same acknowledgement state carried by the active queue is resolved.",
          tone: "warning"
        }
      ]
    },
    {
      id: "closeout-window-lifecycle-enforcement",
      label: "Lifecycle closeout window",
      state: "scheduled",
      owner: "product-owner",
      summary: "Lifecycle closeout is scheduled but cannot open until the upstream acknowledgement blocker clears.",
      deliveryChainStageId: "delivery-chain-promotion-readiness",
      stageId: "release-pipeline-lifecycle-enforcement",
      reviewerQueueId: "reviewer-queue-lifecycle-enforcement",
      closeoutId: "evidence-closeout-lifecycle-enforcement",
      acknowledgementState: "blocked",
      windowId: "window-review-board",
      sharedStateLaneId: "shared-state-lane-preview-review",
      deadlineLabel: "After approval closeout",
      sealedEvidence: [],
      pendingEvidence: [
        "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-CONTRACTS.json",
        "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json"
      ],
      reviewerNotes: []
    },
    {
      id: "closeout-window-rollback-settlement",
      label: "Rollback settlement closeout window",
      state: "ready-to-seal",
      owner: "runtime-owner",
      summary: "Rollback settlement is close to sealing, but the overdue acknowledgement still keeps the window from closing cleanly.",
      deliveryChainStageId: "delivery-chain-rollback-readiness",
      stageId: "release-pipeline-rollback-settlement",
      reviewerQueueId: "reviewer-queue-rollback-settlement",
      closeoutId: "evidence-closeout-rollback-settlement",
      acknowledgementState: "overdue",
      windowId: "window-trace-review",
      sharedStateLaneId: "shared-state-lane-trace-review",
      deadlineLabel: "Ready once lifecycle evidence lands",
      sealedEvidence: ["release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-CLOSEOUT-CONTRACTS.json"],
      pendingEvidence: ["release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json", "release/REVIEW-EVIDENCE-CLOSEOUT.json"],
      reviewerNotes: []
    },
    {
      id: "closeout-window-final-release-decision",
      label: "Final decision closeout window",
      state: "blocked",
      owner: "release-manager",
      summary: "The final closeout window is visible but blocked by signing, publish, and promotion gates.",
      deliveryChainStageId: "delivery-chain-publish-decision",
      stageId: "release-pipeline-release-decision",
      reviewerQueueId: "reviewer-queue-final-release-decision",
      closeoutId: "evidence-closeout-final-release-decision",
      acknowledgementState: "blocked",
      windowId: "window-shell-main",
      sharedStateLaneId: "shared-state-lane-boundary-review",
      deadlineLabel: "Blocked by publish gates",
      sealedEvidence: [],
      pendingEvidence: [
        "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json",
        "release/SIGNING-PUBLISH-PROMOTION-HANDSHAKE.json",
        "release/PUBLISH-GATES.json",
        "release/PROMOTION-GATES.json"
      ],
      reviewerNotes: []
    }
  ];
  const currentReviewerQueue = reviewerQueues.find((queue) => queue.id === currentStage.reviewerQueueId) ?? reviewerQueues[0];
  const currentEscalationWindow =
    escalationWindows.find((window) => window.id === currentStage.escalationWindowId) ?? escalationWindows[0];
  const currentCloseoutWindow = closeoutWindows.find((window) => window.id === currentStage.closeoutWindowId) ?? closeoutWindows[0];
  const deliveryChain = createStudioReleaseDeliveryChain(currentStage, stages);

  return {
    id: "release-approval-pipeline-phase60",
    title: "Review-only operator review board",
    summary:
      "Phase60 keeps the structured release approval pipeline in place while extending it into a fuller operator review loop with explicit reviewer queues, acknowledgement state, escalation windows, closeout windows, and delivery-stage exploration across the same local-only shell.",
    mode: "review-only",
    currentStageId: currentStage.id,
    reviewBoard: {
      id: "operator-review-board-release-approval",
      title: "Operator Review Board",
      summary:
        "Stage ownership, review packets, reviewer queues, acknowledgement state, escalation timing, closeout windows, baton posture, and reviewer notes now sit on top of the existing review-only release approval pipeline without opening any real execution path.",
      posture: "release-manager queue active / acknowledgement pending / review-only handoff",
      activeOwner: currentStage.owner,
      activeDeliveryChainStageId: deliveryChain.currentStageId,
      activeReviewerQueueId: currentReviewerQueue?.id ?? "",
      activeAcknowledgementState: currentReviewerQueue?.acknowledgementState ?? currentStage.handoff.acknowledgementState,
      activeEscalationWindowId: currentEscalationWindow?.id ?? "",
      activeCloseoutWindowId: currentCloseoutWindow?.id ?? "",
      reviewerNotes: [
        {
          id: "operator-review-board-note-lane",
          label: "Shared-state lane",
          value: "Trace Review Lane / synced",
          detail: "The operator board is cross-linked to the same shared-state lane, review window, and focused slot already used by trace and window orchestration surfaces.",
          tone: "positive",
          links: [
            { id: "operator-review-board-link-lane", label: "Trace Review Lane", kind: "shared-state-lane", target: "shared-state-lane-trace-review" },
            { id: "operator-review-board-link-window", label: "Trace Review Window", kind: "window-roster", target: "window-trace-review" },
            { id: "operator-review-board-link-slot", label: focusSlotLabel, kind: "trace-slot", target: focusSlotId }
          ]
        },
        {
          id: "operator-review-board-note-handoff",
          label: "Decision handoff",
          value: currentStage.handoff.posture,
          detail: "The current board keeps the baton visible as a local-only handoff instead of generic lifecycle wording, which makes reviewer ownership and next-stage posture explicit.",
          tone: "neutral",
          links: [
            { id: "operator-review-board-link-board", label: "Operator review board", kind: "release-artifact", target: "release/OPERATOR-REVIEW-BOARD.json" },
            { id: "operator-review-board-link-handoff", label: "Release decision handoff", kind: "release-artifact", target: "release/RELEASE-DECISION-HANDOFF.json" }
          ]
        },
        {
          id: "operator-review-board-note-delivery-chain",
          label: "Delivery chain",
          value: `${currentStage.label} / ${currentStage.deliveryPhase}`,
          detail: "The same active board now resolves into a typed delivery-chain stage, so promotion, publish, and rollback posture stay attached to the review loop instead of living as a disconnected artifact tail.",
          tone: "warning"
        },
        {
          id: "operator-review-board-note-queue",
          label: "Reviewer queue",
          value: `${currentReviewerQueue?.label ?? "Unavailable"} / ${currentReviewerQueue?.acknowledgementState ?? "pending"}`,
          detail: "Reviewer ownership, acknowledgement state, and the current queue entry are explicit so the operator loop can be audited without any live approval dispatch.",
          tone: currentReviewerQueue?.acknowledgementState === "acknowledged" ? "positive" : "warning"
        },
        {
          id: "operator-review-board-note-closeout",
          label: "Escalation / closeout windows",
          value: `${currentEscalationWindow?.state ?? "watch"} / ${currentCloseoutWindow?.state ?? "scheduled"}`,
          detail: "Escalation and closeout windows are first-class review-loop objects, so acknowledgement timing and sealing posture stay cross-linked instead of living in disconnected metadata.",
          tone: "warning",
          links: [{ id: "operator-review-board-link-closeout", label: "Review evidence closeout", kind: "release-artifact", target: "release/REVIEW-EVIDENCE-CLOSEOUT.json" }]
        }
      ]
    },
    decisionHandoff: currentStage.handoff,
    evidenceCloseout: currentStage.closeout,
    reviewerQueues,
    escalationWindows,
    closeoutWindows,
    deliveryChain,
    blockedBy: [
      "delivery-chain workspace remains metadata-only",
      "reviewer acknowledgement remains local-only metadata",
      "escalation and closeout windows remain review-only",
      "signing-publish gating handshake remains review-only",
      "promotion staged release decision lifecycle remains review-only",
      "rollback publication receipt settlement closeout remains review-only",
      "host-side execution remains disabled"
    ],
    stages
  };
}
