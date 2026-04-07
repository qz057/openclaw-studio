import type {
  StudioReleaseApprovalPipeline,
  StudioCommandCompanionRouteHistoryEntry,
  StudioCommandSurface,
  StudioReleaseAcknowledgementState,
  StudioReviewStateContinuity,
  StudioShellLayout,
  StudioShellState,
  StudioWindowObservability,
  StudioWindowObservabilityMapping,
  StudioWindowReviewPostureLink,
  StudioWindowing
} from "./index.js";
import { mapReleasePipelineStageToDeliveryChainStageId, mapReleasePipelineStageToDeliveryPhase } from "./host-runtime-selectors.js";
import { mockBoundarySummary } from "./mock-host.js";

function createReplayReviewerWalkthrough({
  summary,
  readingQueueSummary,
  completionDetail,
  captureGroupId,
  evidenceItemId,
  continuityHandoffId,
  routeDetail,
  checksDetail,
  captureDetail,
  evidenceDetail,
  continuityDetail
}: {
  summary: string;
  readingQueueSummary: string;
  completionDetail: string;
  captureGroupId: string;
  evidenceItemId: string;
  continuityHandoffId: string;
  routeDetail: string;
  checksDetail: string;
  captureDetail: string;
  evidenceDetail: string;
  continuityDetail: string;
}): NonNullable<StudioCommandCompanionRouteHistoryEntry["reviewerWalkthrough"]> {
  return {
    summary,
    readingQueueSummary,
    completionDetail,
    steps: [
      {
        id: `${captureGroupId}-route`,
        kind: "route",
        label: "Restore replay route",
        owner: "Replay route contract",
        detail: routeDetail
      },
      {
        id: `${captureGroupId}-checks`,
        kind: "checks",
        label: "Lock acceptance checks",
        owner: "Scenario checklist review",
        detail: checksDetail
      },
      {
        id: `${captureGroupId}-capture`,
        kind: "capture-group",
        label: "Compare capture group",
        owner: "Capture Review Flow",
        detail: captureDetail,
        trace: {
          kind: "capture-group",
          targetId: captureGroupId
        }
      },
      {
        id: `${captureGroupId}-evidence`,
        kind: "evidence-item",
        label: "Read proof dossier",
        owner: "Evidence dossier review",
        detail: evidenceDetail,
        trace: {
          kind: "evidence-item",
          targetId: evidenceItemId
        }
      },
      {
        id: `${captureGroupId}-continuity`,
        kind: "continuity-handoff",
        label: "Confirm continuity handoff",
        owner: "Acceptance evidence continuity",
        detail: continuityDetail,
        trace: {
          kind: "continuity-handoff",
          targetId: continuityHandoffId
        }
      }
    ]
  };
}

const mockCommandSurface: StudioCommandSurface = {
  title: "Command Palette",
  summary:
    "Phase60 deepens the local-only command layer again: cross-view orchestration, sequence previews, active flow state, route-aware next-step boards, action-deck lanes, typed companion review-path orchestration, ordered companion review sequences, typed companion route states, explicit active/alternate routes, switchable sequence posture, companion route-history memory, route replay restore, replay scenario packs, screenshot-driven acceptance review packs, acceptance pass layers, screenshot pass records, reviewer flow ladders, acceptance reading queues, reviewer signoff boards, final review closeouts, final verdict console framing, acceptance closeout timeline context, capture review flows, proof-linked comparison bundles, acceptance storyboards, evidence dossiers, evidence trace lenses, product-review console polish, replay acceptance checks, stabilized path handoffs, review-surface coverage pivots, multi-window review coverage, recent command history, inspector-command linkage, review-posture ownership, delivery-stage exploration, and review-deck coverage routing now stay tied to the current route, workflow lane, focused slot, and detached-window posture.",
  placeholder: "Search orchestration, delivery coverage, verdict context, closeout timeline, observability, navigation, next steps, detached workspace, or keyboard routes",
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
      id: "command-open-windows-observability",
      label: "Inspect Cross-window Observability",
      description:
        "Surface the windows rail and dock so delivery coverage, closeout timing, shared-state lanes, and observability mappings stay visible together.",
      kind: "show-boundary",
      scope: "window",
      safety: "local-only",
      tone: "positive",
      keywords: ["windows", "observability", "delivery", "coverage", "shared-state", "review", "closeout", "verdict", "timeline"],
      rightRailTabId: "windows",
      bottomDockTabId: "windows"
    },
    {
      id: "command-focus-lifecycle-review-packet",
      label: "Focus Lifecycle Review Packet",
      description: "Bias Review Deck into the blocked lifecycle packet so promotion-readiness coverage, review posture, and preview handoff stay aligned.",
      kind: "focus-review-coverage",
      scope: "window",
      safety: "local-only",
      tone: "warning",
      keywords: ["review", "packet", "promotion", "lifecycle", "coverage", "review-deck"],
      rightRailTabId: "windows",
      bottomDockTabId: "windows",
      windowIntentId: "window-intent-review-workspace",
      reviewSurfaceKind: "review-packet",
      deliveryChainStageId: "delivery-chain-promotion-readiness",
      windowId: "window-review-board",
      sharedStateLaneId: "shared-state-lane-preview-review",
      orchestrationBoardId: "orchestration-board-preview-review",
      observabilityMappingId: "observability-mapping-lifecycle-preview"
    },
    {
      id: "command-focus-approval-reviewer-queue",
      label: "Focus Active Approval Queue",
      description:
        "Jump into the live approval queue so operator review, acknowledgement posture, signoff verdict framing, and trace-linked coverage stay synchronized.",
      kind: "focus-review-coverage",
      scope: "window",
      safety: "local-only",
      tone: "warning",
      keywords: ["approval", "queue", "review", "coverage", "trace", "acknowledgement", "signoff", "verdict"],
      rightRailTabId: "windows",
      bottomDockTabId: "windows",
      windowIntentId: "window-intent-trace-workspace",
      reviewSurfaceKind: "reviewer-queue",
      deliveryChainStageId: "delivery-chain-operator-review",
      windowId: "window-trace-review",
      sharedStateLaneId: "shared-state-lane-trace-review",
      orchestrationBoardId: "orchestration-board-trace-review",
      observabilityMappingId: "observability-mapping-approval-active"
    },
    {
      id: "command-focus-approval-decision-handoff",
      label: "Focus Decision Handoff Surface",
      description: "Keep the active approval baton, acknowledgement state, and trace-linked window ownership in one explicit review surface.",
      kind: "focus-review-coverage",
      scope: "window",
      safety: "local-only",
      tone: "warning",
      keywords: ["decision", "handoff", "approval", "baton", "coverage", "trace"],
      rightRailTabId: "windows",
      bottomDockTabId: "windows",
      windowIntentId: "window-intent-trace-workspace",
      reviewSurfaceKind: "decision-handoff",
      deliveryChainStageId: "delivery-chain-operator-review",
      windowId: "window-trace-review",
      sharedStateLaneId: "shared-state-lane-trace-review",
      orchestrationBoardId: "orchestration-board-trace-review",
      observabilityMappingId: "observability-mapping-approval-active"
    },
    {
      id: "command-focus-approval-evidence-closeout",
      label: "Focus Evidence Closeout Surface",
      description:
        "Surface the active closeout contract so sealed evidence, pending evidence, acceptance closeout timing, and trace-owned approval posture stay linked.",
      kind: "focus-review-coverage",
      scope: "window",
      safety: "local-only",
      tone: "warning",
      keywords: ["evidence", "closeout", "approval", "coverage", "trace", "sealed", "timeline", "acceptance"],
      rightRailTabId: "windows",
      bottomDockTabId: "windows",
      windowIntentId: "window-intent-trace-workspace",
      reviewSurfaceKind: "evidence-closeout",
      deliveryChainStageId: "delivery-chain-operator-review",
      windowId: "window-trace-review",
      sharedStateLaneId: "shared-state-lane-trace-review",
      orchestrationBoardId: "orchestration-board-trace-review",
      observabilityMappingId: "observability-mapping-approval-active"
    },
    {
      id: "command-focus-publish-decision-gate",
      label: "Focus Publish Decision Gate",
      description:
        "Pivot the shell into the blocked final decision gate so publish-facing window, board, observability coverage, and final verdict posture stay explicit.",
      kind: "focus-review-coverage",
      scope: "window",
      safety: "local-only",
      tone: "warning",
      keywords: ["publish", "decision", "gate", "coverage", "final", "review", "verdict", "console"],
      rightRailTabId: "windows",
      bottomDockTabId: "windows",
      windowIntentId: "window-intent-inspector-detach",
      reviewSurfaceKind: "decision-gate",
      deliveryChainStageId: "delivery-chain-publish-decision",
      windowId: "window-shell-main",
      sharedStateLaneId: "shared-state-lane-boundary-review",
      orchestrationBoardId: "orchestration-board-boundary-review",
      observabilityMappingId: "observability-mapping-final-gate"
    },
    {
      id: "command-focus-rollback-closeout-window",
      label: "Focus Rollback Closeout Window",
      description:
        "Bring the rollback settlement shadow into view so overdue acknowledgement, closeout timing, observability closeout, and trace-owned recovery coverage stay linked.",
      kind: "focus-review-coverage",
      scope: "window",
      safety: "local-only",
      tone: "warning",
      keywords: ["rollback", "closeout", "window", "shadow", "coverage", "recovery", "timeline", "observability"],
      rightRailTabId: "windows",
      bottomDockTabId: "windows",
      windowIntentId: "window-intent-trace-workspace",
      reviewSurfaceKind: "closeout-window",
      deliveryChainStageId: "delivery-chain-rollback-readiness",
      windowId: "window-trace-review",
      sharedStateLaneId: "shared-state-lane-trace-review",
      orchestrationBoardId: "orchestration-board-trace-review",
      observabilityMappingId: "observability-mapping-rollback-shadow"
    },
    {
      id: "command-stage-review-window",
      label: "Focus Review Workspace Intent",
      description: "Focus the review-deck intent so delivery coverage and window-aware review posture stay aligned.",
      kind: "stage-window-intent",
      scope: "window",
      safety: "local-only",
      tone: "neutral",
      keywords: ["review", "workspace", "intent", "delivery", "coverage", "windows"],
      windowIntentId: "window-intent-review-workspace"
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
        "command-open-windows-observability",
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
      actionIds: [
        "command-open-dashboard",
        "command-show-trace",
        "command-open-review-view",
        "command-focus-approval-reviewer-queue",
        "command-focus-approval-decision-handoff",
        "command-advance-workflow"
      ]
    },
    {
      id: "agents",
      label: "Agents route actions",
      summary: "Actions that keep the shell in review and window-aware posture.",
      actionIds: [
        "command-open-review-view",
        "command-open-windows-observability",
        "command-stage-review-window",
        "command-focus-approval-reviewer-queue",
        "command-focus-publish-decision-gate",
        "command-stage-inspector-window",
        "command-advance-workflow",
        "command-toggle-compact-mode"
      ]
    },
    {
      id: "codex",
      label: "Codex route actions",
      summary: "Actions that bias the shell toward compact review and route switching.",
      actionIds: [
        "command-open-review-view",
        "command-open-windows-observability",
        "command-stage-review-window",
        "command-focus-approval-decision-handoff",
        "command-focus-rollback-closeout-window",
        "command-toggle-compact-mode",
        "command-open-settings",
        "command-advance-workflow"
      ]
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
        "command-open-windows-observability",
        "command-focus-lifecycle-review-packet",
        "command-focus-publish-decision-gate",
        "command-stage-review-window",
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
        "command-stage-review-window",
        "command-stage-inspector-window",
        "command-stage-trace-window"
      ]
    },
    {
      id: "group-review-coverage",
      label: "Review Coverage Routing",
      summary: "Keep review-deck intent, delivery coverage, review-surface pivots, and cross-window observability visible as one local-only command surface.",
      tone: "positive",
      actionIds: [
        "command-open-review-view",
        "command-stage-review-window",
        "command-open-windows-observability",
        "command-focus-lifecycle-review-packet",
        "command-focus-publish-decision-gate",
        "command-focus-rollback-closeout-window",
        "command-advance-workflow"
      ]
    },
    {
      id: "group-review-surface-actions",
      label: "Review Surface Actions",
      summary: "Review packet, queue, handoff, closeout, publish gate, and rollback closeout pivots stay addressable as explicit local-only actions.",
      tone: "warning",
      actionIds: [
        "command-focus-lifecycle-review-packet",
        "command-focus-approval-reviewer-queue",
        "command-focus-approval-decision-handoff",
        "command-focus-approval-evidence-closeout",
        "command-focus-publish-decision-gate",
        "command-focus-rollback-closeout-window"
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
        "Keep Settings in a window-aware coordination posture: move into Review Deck, focus the review workspace intent, open cross-window observability, then advance the local orchestration board without opening a native window.",
      tone: "neutral",
      safety: "local-only",
      actionIds: ["command-open-review-view", "command-stage-review-window", "command-open-windows-observability", "command-advance-workflow"],
      recommendedActionId: "command-open-review-view",
      followUpActionIds: ["command-stage-review-window", "command-open-windows-observability"],
      match: {
        routeIds: ["settings"]
      }
    },
    {
      id: "sequence-review-coverage-flow",
      label: "Review Coverage Flow",
      summary:
        "When Review Deck is active, focus the review workspace intent, surface cross-window observability, and keep delivery coverage visible while the current lane advances locally.",
      tone: "positive",
      safety: "local-only",
      actionIds: [
        "command-stage-review-window",
        "command-focus-lifecycle-review-packet",
        "command-open-windows-observability",
        "command-focus-publish-decision-gate",
        "command-advance-workflow"
      ],
      recommendedActionId: "command-focus-lifecycle-review-packet",
      followUpActionIds: ["command-open-windows-observability", "command-focus-publish-decision-gate"],
      match: {
        routeIds: ["settings", "agents", "codex"],
        workspaceViewIds: ["review-deck"],
        windowIntentIds: ["window-intent-review-workspace"]
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
        "Settings now exposes a review-deck coordination flow so route, workflow lane, staged intent, delivery coverage, and detached candidate feedback stay synchronized in one local orchestration board.",
      sequenceId: "sequence-settings-review-deck",
      recommendedActionId: "command-open-review-view",
      followUpActionIds: ["command-stage-review-window", "command-open-windows-observability"],
      groupIds: ["group-review-coverage", "group-layout-routing"],
      keyboardShortcutIds: ["keyboard-run-active-flow", "keyboard-open-settings", "keyboard-run-review-sequence"],
      match: {
        routeIds: ["settings"]
      }
    },
    {
      id: "flow-review-deck-coverage",
      surfaceIds: ["shell", "settings", "agents", "codex"],
      label: "Review Coverage Flow",
      summary:
        "When Review Deck and its review-workspace intent are active, command-surface pivots into delivery coverage, review-surface actions, and cross-window observability instead of staying in generic route recovery mode.",
      sequenceId: "sequence-review-coverage-flow",
      recommendedActionId: "command-focus-lifecycle-review-packet",
      followUpActionIds: ["command-open-windows-observability", "command-focus-publish-decision-gate"],
      groupIds: ["group-review-coverage", "group-review-surface-actions", "group-workflow-lane"],
      keyboardShortcutIds: ["keyboard-run-active-flow", "keyboard-run-review-sequence", "keyboard-open-settings"],
      match: {
        routeIds: ["settings", "agents", "codex"],
        workspaceViewIds: ["review-deck"],
        windowIntentIds: ["window-intent-review-workspace"]
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
      id: "next-step-settings-intent",
      label: "Focus review workspace intent",
      detail: "Keep the review-workspace intent active so delivery coverage and cross-window posture stay aligned.",
      tone: "positive",
      kind: "window",
      actionId: "command-stage-review-window"
    },
    {
      id: "next-step-settings-observability",
      label: "Open windows observability",
      detail: "Surface the windows rail and dock so delivery coverage matrix, shared-state lanes, and observability mappings stay visible together.",
      tone: "positive",
      kind: "trace",
      actionId: "command-open-windows-observability"
    },
    {
      id: "next-step-settings-review-surface",
      label: "Focus lifecycle review packet",
      detail: "Drive the same coverage selection into Review Deck so the selected delivery stage, preview lane, board, and observability path move together.",
      tone: "warning",
      kind: "window",
      actionId: "command-focus-lifecycle-review-packet"
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
      summary: "Settings groups review-deck entry, review-workspace intent, lifecycle packet coverage, windows observability, and lane advance into one coordination board.",
      flowId: "flow-settings-review-deck",
      sequenceId: "sequence-settings-review-deck",
      stepIds: [
        "next-step-settings-review",
        "next-step-settings-intent",
        "next-step-settings-review-surface",
        "next-step-settings-observability",
        "next-step-settings-lane"
      ],
      match: {
        routeIds: ["settings"]
      }
    },
    {
      id: "board-review-deck-coverage",
      label: "Review Deck Coverage Board",
      summary: "When Review Deck is active, keep review intent, review-surface focus, windows observability, and lane advance grouped as one local-only coverage board.",
      flowId: "flow-review-deck-coverage",
      sequenceId: "sequence-review-coverage-flow",
      stepIds: [
        "next-step-settings-intent",
        "next-step-settings-review-surface",
        "next-step-settings-observability",
        "next-step-settings-lane"
      ],
      match: {
        routeIds: ["settings", "agents", "codex"],
        workspaceViewIds: ["review-deck"],
        windowIntentIds: ["window-intent-review-workspace"]
      }
    }
  ],
  actionDecks: [
    {
      id: "deck-review-deck-orchestration",
      label: "Review Deck Orchestration Deck",
      summary:
        "Review-deck posture now carries a dedicated local-only action deck so workspace entry, review-workspace intent, delivery-stage coverage, typed companion review-path orchestration, delivery-gate companion sequence switching, companion route-history memory, route replay restore, replay scenario packs, screenshot-driven acceptance review packs, acceptance pass layers, screenshot pass records, reviewer flow ladders, acceptance reading queues, reviewer signoff boards, final review closeouts, capture review flows, proof-linked comparison bundles, acceptance storyboards, evidence dossiers, evidence trace lenses, replay acceptance checks, stabilized path handoffs, review-surface pivots, multi-window review coverage, and cross-window handoff coverage stay grouped instead of being inferred from separate cards.",
      tone: "positive",
      flowId: "flow-review-deck-coverage",
      sequenceId: "sequence-review-coverage-flow",
      lanes: [
        {
          id: "deck-lane-review-deck-workspace",
          label: "Review Workspace Entry",
          summary:
            "Move into Review Deck and focus the lifecycle review packet so the preview lane can own a staged local review posture before any future detached support exists.",
          tone: "positive",
          actionIds: [
            "command-open-review-view",
            "command-stage-review-window",
            "command-focus-lifecycle-review-packet"
          ],
          primaryActionId: "command-focus-lifecycle-review-packet",
          followUpActionIds: ["command-stage-review-window"],
          workspaceViewIds: ["review-deck"],
          windowIntentIds: ["window-intent-review-workspace"],
          deliveryChainStageIds: ["delivery-chain-promotion-readiness"],
          focusDeliveryChainStageId: "delivery-chain-promotion-readiness",
          windowIds: ["window-review-board"],
          focusWindowId: "window-review-board",
          sharedStateLaneIds: ["shared-state-lane-preview-review"],
          focusSharedStateLaneId: "shared-state-lane-preview-review",
          orchestrationBoardIds: ["orchestration-board-preview-review"],
          focusOrchestrationBoardId: "orchestration-board-preview-review",
          observabilityMappingIds: ["observability-mapping-lifecycle-preview"],
          focusObservabilityMappingId: "observability-mapping-lifecycle-preview",
          replayScenarioPack: {
            id: "replay-scenario-pack-lifecycle-entry",
            label: "Lifecycle Entry Acceptance Pack",
            summary:
              "Bundle the staged lifecycle packet, downstream publish-gate handoff, reviewer brief, screenshot pass records, a reviewer flow ladder, an acceptance reading queue, a final review closeout, and proof-linked capture flow into one promotion-readiness scenario roster.",
            continuitySummary:
              "Acceptance evidence continuity keeps the lifecycle packet baseline, reviewer handoff notes, and publish-gate comparison proof chained into one promotion-readiness review story.",
            reviewerPosture: "promotion readiness / reviewer handoff",
            evidencePosture: "packet notes / route replay evidence / screenshot staging",
            acceptancePosture: "lifecycle final review closeout",
            continuityHandoffs: [
              {
                id: "replay-pack-continuity-lifecycle-baseline",
                label: "Lifecycle packet baseline stays attached",
                sourceLabel: "Lifecycle packet restore",
                targetLabel: "Promotion route snapshot",
                detail:
                  "The restored lifecycle packet should keep the same promotion-readiness snapshot visible before the publish-gate handoff is reviewed.",
                state: "ready",
                sourceScenarioId: "companion-route-history-lifecycle-publish-gate",
                linkedEvidenceItemIds: ["replay-evidence-lifecycle-route-snapshot"],
                linkedScreenshotIds: ["replay-shot-lifecycle-packet"]
              },
              {
                id: "replay-pack-continuity-lifecycle-handoff",
                label: "Reviewer handoff carries into the publish gate comparison",
                sourceLabel: "Reviewer handoff notes",
                targetLabel: "Publish gate comparison frame",
                detail:
                  "Reviewer framing should carry from the lifecycle packet into the publish-gate comparison without dropping the same acceptance posture.",
                state: "watch",
                sourceScenarioId: "companion-route-history-lifecycle-publish-gate",
                linkedEvidenceItemIds: [
                  "replay-evidence-lifecycle-handoff-notes",
                  "replay-evidence-lifecycle-compare-ledger"
                ],
                linkedScreenshotIds: ["replay-shot-lifecycle-packet", "replay-shot-lifecycle-gate"]
              }
            ],
            safety: "local-only"
          },
          companionSequences: [
            {
              id: "companion-sequence-lifecycle-gate-coverage",
              label: "Lifecycle Gate Coverage",
              summary:
                "Sequence lifecycle packet, publish gate, and approval queue coverage so promotion readiness can walk forward into final go/no-go review without leaving the review deck.",
              tone: "warning",
              steps: [
                {
                  id: "companion-sequence-step-lifecycle-packet",
                  actionId: "command-focus-lifecycle-review-packet",
                  role: "current-review-surface",
                  summary: "Start from the lifecycle packet so promotion readiness stays anchored to the current review surface."
                },
                {
                  id: "companion-sequence-step-lifecycle-publish-gate",
                  actionId: "command-focus-publish-decision-gate",
                  role: "primary-companion",
                  summary: "Promote the publish decision gate into the next companion slot for final release posture review."
                },
                {
                  id: "companion-sequence-step-lifecycle-reviewer-queue",
                  actionId: "command-focus-approval-reviewer-queue",
                  role: "follow-up-companion",
                  summary: "Keep the approval reviewer queue in the same sequence so reviewer ownership stays attached to the gate handoff."
                }
              ]
            }
          ],
          companionReviewPaths: [
            {
              id: "companion-path-lifecycle-packet-publish-gate",
              label: "Lifecycle Packet -> Publish Gate",
              summary:
                "Keep the lifecycle packet as the current surface, then surface the publish decision gate as the primary companion so promotion readiness, final release gating, and downstream operator review stay linked through one explicit review path.",
              tone: "warning",
              kind: "stage-companion",
              sequenceId: "companion-sequence-lifecycle-gate-coverage",
              sourceActionId: "command-focus-lifecycle-review-packet",
              primaryActionId: "command-focus-publish-decision-gate",
              followUpActionIds: ["command-focus-approval-reviewer-queue"]
            }
          ],
          companionRouteStates: [
            {
              id: "companion-route-state-lifecycle-packet",
              label: "Lifecycle Packet Active Route",
              summary:
                "Keep the lifecycle packet as the active route while publish gate and approval queue stay sequenced under the same review workspace entry instead of collapsing into one flat jump.",
              tone: "warning",
              posture: "active-route",
              sourceActionId: "command-focus-lifecycle-review-packet",
              currentActionId: "command-focus-lifecycle-review-packet",
              routeActionIds: [
                "command-focus-lifecycle-review-packet",
                "command-focus-publish-decision-gate",
                "command-focus-approval-reviewer-queue"
              ],
              workspaceViewId: "review-deck",
              windowIntentId: "window-intent-review-workspace",
              deliveryChainStageId: "delivery-chain-promotion-readiness",
              windowId: "window-review-board",
              sharedStateLaneId: "shared-state-lane-preview-review",
              orchestrationBoardId: "orchestration-board-preview-review",
              observabilityMappingId: "observability-mapping-lifecycle-preview",
              activeSequenceId: "companion-sequence-lifecycle-gate-coverage",
              activeReviewPathId: "companion-path-lifecycle-packet-publish-gate",
              sequenceSwitches: [
                {
                  id: "companion-route-switch-lifecycle-packet",
                  label: "Lifecycle gate route",
                  summary:
                    "Keep the lifecycle packet current while publish gate and approval queue remain sequenced from the same local-only review route.",
                  tone: "warning",
                  posture: "active-sequence",
                  sequenceId: "companion-sequence-lifecycle-gate-coverage",
                  targetActionId: "command-focus-lifecycle-review-packet",
                  reviewPathId: "companion-path-lifecycle-packet-publish-gate"
                }
              ]
            }
          ],
          companionPathHandoffs: [
            {
              id: "companion-path-handoff-lifecycle-publish-gate",
              label: "Lifecycle gate handoff",
              summary:
                "Keep the lifecycle packet -> publish gate handoff stabilized so promotion readiness can return to the same companion path instead of recomputing the next review surface from scratch.",
              tone: "warning",
              routeStateId: "companion-route-state-lifecycle-packet",
              sequenceId: "companion-sequence-lifecycle-gate-coverage",
              reviewPathId: "companion-path-lifecycle-packet-publish-gate",
              sourceActionId: "command-focus-lifecycle-review-packet",
              targetActionId: "command-focus-publish-decision-gate",
              followUpActionId: "command-focus-approval-reviewer-queue",
              workspaceViewId: "review-deck",
              windowIntentId: "window-intent-review-workspace",
              deliveryChainStageId: "delivery-chain-promotion-readiness",
              windowId: "window-review-board",
              sharedStateLaneId: "shared-state-lane-preview-review",
              orchestrationBoardId: "orchestration-board-preview-review",
              observabilityMappingId: "observability-mapping-lifecycle-preview",
              stability: "stable"
            }
          ],
          companionRouteHistory: [
            {
              id: "companion-route-history-lifecycle-publish-gate",
              label: "Lifecycle -> Publish Gate",
              summary:
                "Remember the last lifecycle packet -> publish gate handoff so returning to the workspace entry restores promotion readiness coverage with the same downstream reviewer path.",
              tone: "warning",
              transitionKind: "stabilize-handoff",
              sourceActionId: "command-focus-lifecycle-review-packet",
              targetActionId: "command-focus-publish-decision-gate",
              routeStateId: "companion-route-state-lifecycle-packet",
              sequenceId: "companion-sequence-lifecycle-gate-coverage",
              reviewPathId: "companion-path-lifecycle-packet-publish-gate",
              workspaceViewId: "review-deck",
              windowIntentId: "window-intent-review-workspace",
              deliveryChainStageId: "delivery-chain-promotion-readiness",
              windowId: "window-review-board",
              sharedStateLaneId: "shared-state-lane-preview-review",
              orchestrationBoardId: "orchestration-board-preview-review",
              observabilityMappingId: "observability-mapping-lifecycle-preview",
              timestampLabel: "Seeded memory",
              scenarioLabel: "Lifecycle gate promotion handoff",
              scenarioSummary:
                "Restore the staged lifecycle packet route, step into the publish gate, and verify the same promotion-readiness packet, review surface, and downstream reviewer contract stay attached.",
              reviewerPosture: "promotion readiness owner / downstream reviewer",
              evidencePosture: "lifecycle packet / publish gate evidence / screenshot staging",
              reviewerSignoff: {
                label: "Lifecycle gate signoff",
                owner: "Promotion readiness owner / downstream publish reviewer",
                summary:
                  "The lifecycle packet baseline and publish-gate handoff still read as one reviewer flow, but the missing handoff frame linkage keeps signoff open.",
                verdict: "Lifecycle gate signoff in review",
                nextHandoff:
                  "Stage the publish gate handoff frame and attach the packet-to-gate comparison ledger before the reviewer closes signoff.",
                state: "watch",
                blockers: [
                  "Publish gate handoff frame is still staged instead of linked.",
                  "Packet-to-gate comparison ledger remains pending."
                ],
                checkpoints: [
                  {
                    id: "replay-signoff-lifecycle-route",
                    label: "Restore the lifecycle packet baseline",
                    owner: "Promotion readiness owner",
                    detail: "The replay still opens on the same lifecycle packet instead of flattening the promotion-readiness route.",
                    state: "ready"
                  },
                  {
                    id: "replay-signoff-lifecycle-handoff",
                    label: "Carry reviewer framing into the publish gate handoff",
                    owner: "Downstream publish reviewer",
                    detail: "Reviewer framing is staged, but the publish-gate handoff frame still needs to move from staged to linked.",
                    state: "watch"
                  },
                  {
                    id: "replay-signoff-lifecycle-proof",
                    label: "Close the packet-to-gate proof chain",
                    owner: "Acceptance capture reviewer",
                    detail: "The pending comparison ledger keeps the final signoff packet open even though the baseline route remains visible.",
                    state: "watch"
                  }
                ]
              },
              reviewerWalkthrough: createReplayReviewerWalkthrough({
                summary:
                  "Ordered reviewer walkthrough keeps the lifecycle packet restore, acceptance checks, packet-to-gate capture review, proof dossier, and continuity handoff aligned inside one promotion-readiness reading order.",
                readingQueueSummary:
                  "Ordered proof consumption keeps lifecycle route intake, acceptance checks, packet-to-gate captures, dossier items, and continuity handoffs on one reviewer queue.",
                completionDetail:
                  "Lifecycle packet restore, acceptance checks, capture comparison, proof dossier, and continuity handoff are aligned across the current promotion-readiness review pack.",
                captureGroupId: "replay-capture-group-lifecycle-gate",
                evidenceItemId: "replay-evidence-lifecycle-compare-ledger",
                continuityHandoffId: "replay-pack-continuity-lifecycle-handoff",
                routeDetail:
                  "Restore the promotion-readiness packet before the publish gate pivot so the reviewer starts from the same lifecycle baseline.",
                checksDetail:
                  "Lock the replay acceptance checks before the reviewer compares the packet baseline, publish-gate handoff, and local-only evidence posture.",
                captureDetail:
                  "Compare the lifecycle packet baseline beside the publish-gate handoff frame so the packet-to-gate story reads as one capture pass.",
                evidenceDetail:
                  "Read the pending comparison ledger after the captures so the proof dossier closes the packet-to-gate handoff in the same order.",
                continuityDetail:
                  "Confirm the lifecycle continuity handoff keeps reviewer framing attached while the packet pivots into the publish gate."
              }),
              acceptanceChecks: [
                {
                  id: "replay-check-lifecycle-route",
                  label: "Route restore keeps lifecycle packet current",
                  detail: "Promotion-readiness replay should re-open the lifecycle packet before the publish gate pivot is reviewed.",
                  state: "ready"
                },
                {
                  id: "replay-check-lifecycle-surface",
                  label: "Publish gate companion remains attached",
                  detail: "The replayed companion step should still point at the publish decision gate without rebuilding the route from scratch.",
                  state: "ready"
                },
                {
                  id: "replay-check-lifecycle-evidence",
                  label: "Evidence posture stays review-only",
                  detail: "Packet evidence, reviewer notes, and screenshot targets remain metadata-only and never trigger host execution.",
                  state: "watch"
                }
              ],
              scenarioEvidenceItems: [
                {
                  id: "replay-evidence-lifecycle-route-snapshot",
                  label: "Lifecycle route snapshot",
                  artifact: "Route snapshot / promotion-readiness packet",
                  kind: "route-snapshot",
                  posture: "linked",
                  owner: "Promotion readiness owner",
                  dossierSection: "Route baseline",
                  detail: "Link the remembered route snapshot to the lifecycle packet header so the acceptance card starts from the same packet state."
                },
                {
                  id: "replay-evidence-lifecycle-handoff-notes",
                  label: "Publish gate handoff notes",
                  artifact: "Reviewer notes / downstream publish gate handoff",
                  kind: "reviewer-notes",
                  posture: "staged",
                  owner: "Downstream publish reviewer",
                  dossierSection: "Reviewer baton",
                  detail: "Stage reviewer-facing notes that explain why the lifecycle packet hands into the publish gate as the next acceptance surface."
                },
                {
                  id: "replay-evidence-lifecycle-compare-ledger",
                  label: "Promotion handoff comparison ledger",
                  artifact: "Acceptance ledger / packet-to-gate comparison",
                  kind: "comparison-ledger",
                  posture: "pending",
                  owner: "Acceptance capture reviewer",
                  dossierSection: "Comparison ledger",
                  detail: "Keep the comparison ledger local-only until product review confirms the packet baseline and publish-gate frame stay in sync."
                }
              ],
              evidenceContinuityChecks: [
                {
                  id: "replay-continuity-lifecycle-route",
                  label: "Route snapshot stays attached to packet evidence",
                  handoff: "Lifecycle packet -> route snapshot",
                  detail: "The same promotion-readiness packet summary should remain visible after restore so the scenario evidence pack opens on the expected baseline.",
                  state: "ready"
                },
                {
                  id: "replay-continuity-lifecycle-handoff",
                  label: "Reviewer handoff carries into the publish gate",
                  handoff: "Reviewer notes -> publish gate handoff",
                  detail: "Downstream reviewer posture should remain attached when the lifecycle route pivots into the publish decision gate.",
                  state: "ready"
                },
                {
                  id: "replay-continuity-lifecycle-capture",
                  label: "Capture ledger waits on final comparison frame",
                  handoff: "Comparison ledger -> screenshot target board",
                  detail: "The continuity chain stays in review until the publish-gate comparison frame is staged beside the packet baseline.",
                  state: "watch"
                }
              ],
              screenshotReviewItems: [
                {
                  id: "replay-shot-lifecycle-packet",
                  label: "Lifecycle packet baseline",
                  surface: "Review packet / promotion readiness",
                  posture: "staged",
                  storyboardRole: "baseline",
                  shotIndex: 1,
                  viewport: "Desktop workspace / stage explorer frame",
                  focus: "Packet header, evidence chips, route snapshot",
                  framing: "Keep the route snapshot badges and lifecycle packet title above the fold.",
                  detail: "Capture the packet header, evidence chips, and route snapshot together for product review.",
                  captureGroupId: "replay-capture-group-lifecycle-gate",
                  captureGroup: "Lifecycle gate comparison",
                  comparisonFrame: "Lifecycle packet baseline -> publish gate handoff",
                  linkedEvidenceItemIds: [
                    "replay-evidence-lifecycle-route-snapshot",
                    "replay-evidence-lifecycle-handoff-notes"
                  ]
                },
                {
                  id: "replay-shot-lifecycle-gate",
                  label: "Publish gate handoff frame",
                  surface: "Publish decision gate",
                  posture: "required",
                  storyboardRole: "handoff",
                  shotIndex: 2,
                  viewport: "Desktop workspace / publish gate pivot",
                  focus: "Gate summary, handoff notes, carry-over route posture",
                  framing: "Frame the publish decision gate beside the restored packet badges so the baton is obvious.",
                  detail: "Stage a comparison frame showing the lifecycle packet replay handing into the publish gate surface.",
                  captureGroupId: "replay-capture-group-lifecycle-gate",
                  captureGroup: "Lifecycle gate comparison",
                  comparisonFrame: "Lifecycle packet baseline -> publish gate handoff",
                  linkedEvidenceItemIds: [
                    "replay-evidence-lifecycle-handoff-notes",
                    "replay-evidence-lifecycle-compare-ledger"
                  ]
                }
              ]
            }
          ]
        },
        {
          id: "deck-lane-review-deck-delivery-coverage",
          label: "Delivery Gate Coverage",
          summary:
            "Cross-window observability now pivots directly into publish-gate, approval-queue, and rollback-closeout review surfaces, so downstream coverage remains visible while every stage stays metadata-only and non-executing.",
          tone: "warning",
          actionIds: [
            "command-open-windows-observability",
            "command-stage-review-window",
            "command-focus-approval-reviewer-queue",
            "command-focus-publish-decision-gate",
            "command-focus-rollback-closeout-window"
          ],
          primaryActionId: "command-focus-publish-decision-gate",
          followUpActionIds: ["command-focus-approval-reviewer-queue", "command-focus-rollback-closeout-window"],
          workspaceViewIds: ["review-deck"],
          windowIntentIds: ["window-intent-review-workspace"],
          deliveryChainStageIds: [
            "delivery-chain-promotion-readiness",
            "delivery-chain-publish-decision",
            "delivery-chain-rollback-readiness"
          ],
          focusDeliveryChainStageId: "delivery-chain-publish-decision",
          windowIds: ["window-review-board", "window-shell-main", "window-trace-review"],
          focusWindowId: "window-shell-main",
          sharedStateLaneIds: [
            "shared-state-lane-preview-review",
            "shared-state-lane-boundary-review",
            "shared-state-lane-trace-review"
          ],
          focusSharedStateLaneId: "shared-state-lane-boundary-review",
          orchestrationBoardIds: [
            "orchestration-board-preview-review",
            "orchestration-board-boundary-review",
            "orchestration-board-trace-review"
          ],
          focusOrchestrationBoardId: "orchestration-board-boundary-review",
          observabilityMappingIds: [
            "observability-mapping-lifecycle-preview",
            "observability-mapping-final-gate",
            "observability-mapping-rollback-shadow"
          ],
          focusObservabilityMappingId: "observability-mapping-final-gate",
          replayScenarioPack: {
            id: "replay-scenario-pack-delivery-gate",
            label: "Delivery Gate Acceptance Pack",
            summary:
              "Bundle publish gate, approval queue, rollback shadow re-entry, reviewer framing, screenshot pass records, a reviewer flow ladder, an acceptance reading queue, a final review closeout, and proof-linked comparison captures into a route replay roster so interface acceptance can follow a realistic delivery review script.",
            continuitySummary:
              "Acceptance evidence continuity keeps publish-gate, approval-queue, and rollback-shadow proof handoffs visible as one review chain instead of isolated scenario cards.",
            reviewerPosture: "release manager / reviewer queue / rollback owner",
            evidencePosture: "gate notes / queue posture / screenshot target board",
            acceptancePosture: "delivery gate final review closeout",
            continuityHandoffs: [
              {
                id: "replay-pack-continuity-delivery-gate-queue",
                label: "Gate handback keeps reviewer ownership visible",
                sourceLabel: "Publish gate handback",
                targetLabel: "Approval queue baseline",
                detail:
                  "The publish decision gate should hand reviewer ownership into the approval queue without dropping the same evidence chain or route posture.",
                state: "ready",
                sourceScenarioId: "companion-route-history-publish-gate-queue",
                targetScenarioId: "companion-route-history-approval-queue-publish-gate",
                linkedEvidenceItemIds: [
                  "replay-evidence-publish-queue-baton",
                  "replay-evidence-queue-snapshot"
                ],
                linkedScreenshotIds: ["replay-shot-publish-queue", "replay-shot-queue-current"]
              },
              {
                id: "replay-pack-continuity-delivery-queue-return",
                label: "Queue return keeps final gate context attached",
                sourceLabel: "Approval queue return",
                targetLabel: "Publish gate re-entry",
                detail:
                  "Queue-owned acknowledgement posture should stay visible when the route hands back into the final publish gate for the next acceptance check.",
                state: "watch",
                sourceScenarioId: "companion-route-history-approval-queue-publish-gate",
                targetScenarioId: "companion-route-history-publish-gate-queue",
                linkedEvidenceItemIds: [
                  "replay-evidence-queue-return-notes",
                  "replay-evidence-publish-gate-snapshot"
                ],
                linkedScreenshotIds: ["replay-shot-queue-return", "replay-shot-publish-gate"]
              },
              {
                id: "replay-pack-continuity-delivery-rollback-reentry",
                label: "Rollback shadow re-entry keeps recovery proof attached",
                sourceLabel: "Rollback shadow recovery",
                targetLabel: "Publish gate recovery re-entry",
                detail:
                  "Recovery posture should re-enter the publish gate with the same fallback proof and reviewer shadow still visible for product review.",
                state: "watch",
                sourceScenarioId: "companion-route-history-rollback-shadow-publish-gate",
                targetScenarioId: "companion-route-history-publish-gate-queue",
                linkedEvidenceItemIds: [
                  "replay-evidence-rollback-reentry-notes",
                  "replay-evidence-publish-gate-snapshot"
                ],
                linkedScreenshotIds: ["replay-shot-rollback-reentry", "replay-shot-publish-gate"]
              }
            ],
            safety: "local-only"
          },
          companionSequences: [
            {
              id: "companion-sequence-delivery-gate-loop",
              label: "Publish Gate Decision Loop",
              summary:
                "Anchor the sequence on the publish gate so final go/no-go review can step forward into reviewer ownership and rollback shadow coverage without losing the same local-only lane.",
              tone: "warning",
              steps: [
                {
                  id: "companion-sequence-step-delivery-publish-gate",
                  actionId: "command-focus-publish-decision-gate",
                  role: "current-review-surface",
                  summary: "Hold the publish decision gate as the current surface while final go/no-go posture remains active."
                },
                {
                  id: "companion-sequence-step-delivery-reviewer-queue",
                  actionId: "command-focus-approval-reviewer-queue",
                  role: "primary-companion",
                  summary: "Move into the approval queue next so reviewer ownership stays attached to the same gate coverage."
                },
                {
                  id: "companion-sequence-step-delivery-rollback-closeout",
                  actionId: "command-focus-rollback-closeout-window",
                  role: "follow-up-companion",
                  summary: "Keep rollback closeout visible as the trailing recovery step behind the same decision chain."
                }
              ]
            },
            {
              id: "companion-sequence-delivery-queue-handoff",
              label: "Approval Queue Handoff Loop",
              summary:
                "Anchor the sequence on the active approval queue so reviewer ownership can hand back into the publish gate while rollback shadow coverage stays attached to the same cross-window path.",
              tone: "warning",
              steps: [
                {
                  id: "companion-sequence-step-delivery-queue-current",
                  actionId: "command-focus-approval-reviewer-queue",
                  role: "current-review-surface",
                  summary: "Treat the approval queue as the current surface while reviewer ownership and acknowledgement posture stay active."
                },
                {
                  id: "companion-sequence-step-delivery-queue-publish-gate",
                  actionId: "command-focus-publish-decision-gate",
                  role: "primary-companion",
                  summary: "Lift the publish gate back into the primary slot so the live decision gate stays paired with the current queue owner."
                },
                {
                  id: "companion-sequence-step-delivery-queue-rollback-closeout",
                  actionId: "command-focus-rollback-closeout-window",
                  role: "follow-up-companion",
                  summary: "Keep rollback closeout visible behind the queue handoff so downstream recovery posture never drops out of the same path."
                }
              ]
            },
            {
              id: "companion-sequence-delivery-rollback-shadow",
              label: "Rollback Shadow Recovery Loop",
              summary:
                "Anchor the sequence on rollback closeout so recovery shadow review can step back into the publish gate and approval queue without losing the same local-only lane.",
              tone: "warning",
              steps: [
                {
                  id: "companion-sequence-step-delivery-rollback-current",
                  actionId: "command-focus-rollback-closeout-window",
                  role: "current-review-surface",
                  summary: "Treat rollback closeout as the current surface while recovery timing and acknowledgement shadow remain active."
                },
                {
                  id: "companion-sequence-step-delivery-rollback-publish-gate",
                  actionId: "command-focus-publish-decision-gate",
                  role: "primary-companion",
                  summary: "Lift the publish gate into the next slot so the live decision gate stays attached to the recovery shadow."
                },
                {
                  id: "companion-sequence-step-delivery-rollback-reviewer-queue",
                  actionId: "command-focus-approval-reviewer-queue",
                  role: "follow-up-companion",
                  summary: "Keep the approval queue nearby so reviewer ownership remains visible behind the rollback shadow route."
                }
              ]
            }
          ],
          companionReviewPaths: [
            {
              id: "companion-path-publish-gate-reviewer-queue",
              label: "Publish Gate -> Approval Queue",
              summary:
                "When the publish decision gate is current, jump straight into the active approval queue and keep rollback closeout as the follow-up companion so final go/no-go review stays tied to the same local-only lane.",
              tone: "warning",
              kind: "stage-companion",
              sequenceId: "companion-sequence-delivery-gate-loop",
              sourceActionId: "command-focus-publish-decision-gate",
              primaryActionId: "command-focus-approval-reviewer-queue",
              followUpActionIds: ["command-focus-rollback-closeout-window"]
            },
            {
              id: "companion-path-reviewer-queue-publish-gate",
              label: "Approval Queue -> Publish Gate",
              summary:
                "When the approval queue is current, promote the publish decision gate to the primary companion so reviewer ownership, final gating, and rollback shadow coverage remain visible as one review path.",
              tone: "warning",
              kind: "stage-companion",
              sequenceId: "companion-sequence-delivery-queue-handoff",
              sourceActionId: "command-focus-approval-reviewer-queue",
              primaryActionId: "command-focus-publish-decision-gate",
              followUpActionIds: ["command-focus-rollback-closeout-window"]
            },
            {
              id: "companion-path-rollback-closeout-publish-gate",
              label: "Rollback Closeout -> Publish Gate",
              summary:
                "When rollback closeout is current, lift the publish decision gate back into the primary companion slot and keep the approval queue nearby so recovery posture never detaches from the live decision gate review.",
              tone: "warning",
              kind: "rollback-companion",
              sequenceId: "companion-sequence-delivery-rollback-shadow",
              sourceActionId: "command-focus-rollback-closeout-window",
              primaryActionId: "command-focus-publish-decision-gate",
              followUpActionIds: ["command-focus-approval-reviewer-queue"]
            }
          ],
          companionRouteStates: [
            {
              id: "companion-route-state-publish-gate",
              label: "Publish Gate Active Route",
              summary:
                "Treat the publish decision gate as the active route so approval queue and rollback shadow coverage can switch in without dropping the same review-deck lane, window, board, or observability posture.",
              tone: "warning",
              posture: "active-route",
              sourceActionId: "command-focus-publish-decision-gate",
              currentActionId: "command-focus-publish-decision-gate",
              routeActionIds: [
                "command-focus-publish-decision-gate",
                "command-focus-approval-reviewer-queue",
                "command-focus-rollback-closeout-window"
              ],
              workspaceViewId: "review-deck",
              windowIntentId: "window-intent-review-workspace",
              deliveryChainStageId: "delivery-chain-publish-decision",
              windowId: "window-shell-main",
              sharedStateLaneId: "shared-state-lane-boundary-review",
              orchestrationBoardId: "orchestration-board-boundary-review",
              observabilityMappingId: "observability-mapping-final-gate",
              activeSequenceId: "companion-sequence-delivery-gate-loop",
              activeReviewPathId: "companion-path-publish-gate-reviewer-queue",
              sequenceSwitches: [
                {
                  id: "companion-route-switch-publish-gate-active",
                  label: "Publish gate decision loop",
                  summary:
                    "Keep the publish gate current so final go/no-go review stays attached to the same delivery coverage route.",
                  tone: "warning",
                  posture: "active-sequence",
                  sequenceId: "companion-sequence-delivery-gate-loop",
                  targetActionId: "command-focus-publish-decision-gate",
                  reviewPathId: "companion-path-publish-gate-reviewer-queue"
                },
                {
                  id: "companion-route-switch-publish-gate-queue",
                  label: "Switch to approval queue route",
                  summary:
                    "Move the current route over to the approval queue so reviewer ownership becomes the active sequence anchor.",
                  tone: "warning",
                  posture: "switchable-sequence",
                  sequenceId: "companion-sequence-delivery-queue-handoff",
                  targetActionId: "command-focus-approval-reviewer-queue",
                  reviewPathId: "companion-path-reviewer-queue-publish-gate"
                },
                {
                  id: "companion-route-switch-publish-gate-rollback",
                  label: "Switch to rollback shadow route",
                  summary:
                    "Move the current route over to rollback closeout so recovery shadow review becomes the active sequence anchor.",
                  tone: "warning",
                  posture: "switchable-sequence",
                  sequenceId: "companion-sequence-delivery-rollback-shadow",
                  targetActionId: "command-focus-rollback-closeout-window",
                  reviewPathId: "companion-path-rollback-closeout-publish-gate"
                }
              ]
            },
            {
              id: "companion-route-state-approval-queue",
              label: "Approval Queue Alternate Route",
              summary:
                "Treat the approval queue as the active route so reviewer ownership can hand back into the publish gate while rollback shadow coverage remains nearby as an alternate review route.",
              tone: "warning",
              posture: "alternate-route",
              sourceActionId: "command-focus-approval-reviewer-queue",
              currentActionId: "command-focus-approval-reviewer-queue",
              routeActionIds: [
                "command-focus-approval-reviewer-queue",
                "command-focus-publish-decision-gate",
                "command-focus-rollback-closeout-window"
              ],
              workspaceViewId: "review-deck",
              windowIntentId: "window-intent-review-workspace",
              deliveryChainStageId: "delivery-chain-operator-review",
              windowId: "window-trace-review",
              sharedStateLaneId: "shared-state-lane-trace-review",
              orchestrationBoardId: "orchestration-board-trace-review",
              observabilityMappingId: "observability-mapping-approval-active",
              activeSequenceId: "companion-sequence-delivery-queue-handoff",
              activeReviewPathId: "companion-path-reviewer-queue-publish-gate",
              sequenceSwitches: [
                {
                  id: "companion-route-switch-approval-queue-active",
                  label: "Approval queue handoff loop",
                  summary:
                    "Keep the approval queue current so reviewer ownership remains the active sequence anchor on the same review route.",
                  tone: "warning",
                  posture: "active-sequence",
                  sequenceId: "companion-sequence-delivery-queue-handoff",
                  targetActionId: "command-focus-approval-reviewer-queue",
                  reviewPathId: "companion-path-reviewer-queue-publish-gate"
                },
                {
                  id: "companion-route-switch-approval-queue-publish",
                  label: "Switch to publish gate route",
                  summary:
                    "Move the active route back to the publish gate without dropping the same delivery coverage context.",
                  tone: "warning",
                  posture: "switchable-sequence",
                  sequenceId: "companion-sequence-delivery-gate-loop",
                  targetActionId: "command-focus-publish-decision-gate",
                  reviewPathId: "companion-path-publish-gate-reviewer-queue"
                },
                {
                  id: "companion-route-switch-approval-queue-rollback",
                  label: "Switch to rollback shadow route",
                  summary:
                    "Move the active route over to rollback closeout so the same cross-window coverage can pivot into recovery posture.",
                  tone: "warning",
                  posture: "switchable-sequence",
                  sequenceId: "companion-sequence-delivery-rollback-shadow",
                  targetActionId: "command-focus-rollback-closeout-window",
                  reviewPathId: "companion-path-rollback-closeout-publish-gate"
                }
              ]
            },
            {
              id: "companion-route-state-rollback-shadow",
              label: "Rollback Shadow Alternate Route",
              summary:
                "Treat rollback closeout as the active route so recovery shadow review can hand back into the publish gate and approval queue without losing the same delivery coverage chain.",
              tone: "warning",
              posture: "alternate-route",
              sourceActionId: "command-focus-rollback-closeout-window",
              currentActionId: "command-focus-rollback-closeout-window",
              routeActionIds: [
                "command-focus-rollback-closeout-window",
                "command-focus-publish-decision-gate",
                "command-focus-approval-reviewer-queue"
              ],
              workspaceViewId: "review-deck",
              windowIntentId: "window-intent-review-workspace",
              deliveryChainStageId: "delivery-chain-rollback-readiness",
              windowId: "window-trace-review",
              sharedStateLaneId: "shared-state-lane-trace-review",
              orchestrationBoardId: "orchestration-board-trace-review",
              observabilityMappingId: "observability-mapping-rollback-shadow",
              activeSequenceId: "companion-sequence-delivery-rollback-shadow",
              activeReviewPathId: "companion-path-rollback-closeout-publish-gate",
              sequenceSwitches: [
                {
                  id: "companion-route-switch-rollback-shadow-active",
                  label: "Rollback shadow recovery loop",
                  summary:
                    "Keep rollback closeout current so recovery shadow posture remains the active sequence anchor on the same review route.",
                  tone: "warning",
                  posture: "active-sequence",
                  sequenceId: "companion-sequence-delivery-rollback-shadow",
                  targetActionId: "command-focus-rollback-closeout-window",
                  reviewPathId: "companion-path-rollback-closeout-publish-gate"
                },
                {
                  id: "companion-route-switch-rollback-shadow-publish",
                  label: "Switch to publish gate route",
                  summary:
                    "Move the active route back to the publish gate so the live decision gate becomes the sequence anchor again.",
                  tone: "warning",
                  posture: "switchable-sequence",
                  sequenceId: "companion-sequence-delivery-gate-loop",
                  targetActionId: "command-focus-publish-decision-gate",
                  reviewPathId: "companion-path-publish-gate-reviewer-queue"
                },
                {
                  id: "companion-route-switch-rollback-shadow-queue",
                  label: "Switch to approval queue route",
                  summary:
                    "Move the active route over to the approval queue so reviewer ownership becomes the sequence anchor again.",
                  tone: "warning",
                  posture: "switchable-sequence",
                  sequenceId: "companion-sequence-delivery-queue-handoff",
                  targetActionId: "command-focus-approval-reviewer-queue",
                  reviewPathId: "companion-path-reviewer-queue-publish-gate"
                }
              ]
            }
          ],
          companionPathHandoffs: [
            {
              id: "companion-path-handoff-publish-gate-queue",
              label: "Publish gate handoff",
              summary:
                "Keep the publish gate -> approval queue path stabilized so the same delivery lane can reopen reviewer ownership without dropping publish posture.",
              tone: "warning",
              routeStateId: "companion-route-state-publish-gate",
              sequenceId: "companion-sequence-delivery-gate-loop",
              reviewPathId: "companion-path-publish-gate-reviewer-queue",
              sourceActionId: "command-focus-publish-decision-gate",
              targetActionId: "command-focus-approval-reviewer-queue",
              followUpActionId: "command-focus-rollback-closeout-window",
              workspaceViewId: "review-deck",
              windowIntentId: "window-intent-review-workspace",
              deliveryChainStageId: "delivery-chain-publish-decision",
              windowId: "window-shell-main",
              sharedStateLaneId: "shared-state-lane-boundary-review",
              orchestrationBoardId: "orchestration-board-boundary-review",
              observabilityMappingId: "observability-mapping-final-gate",
              stability: "stable"
            },
            {
              id: "companion-path-handoff-approval-queue-publish-gate",
              label: "Approval queue handoff",
              summary:
                "Keep the approval queue -> publish gate path on watch so reviewer ownership can hand back into the live decision gate without drifting off the same coverage chain.",
              tone: "warning",
              routeStateId: "companion-route-state-approval-queue",
              sequenceId: "companion-sequence-delivery-queue-handoff",
              reviewPathId: "companion-path-reviewer-queue-publish-gate",
              sourceActionId: "command-focus-approval-reviewer-queue",
              targetActionId: "command-focus-publish-decision-gate",
              followUpActionId: "command-focus-rollback-closeout-window",
              workspaceViewId: "review-deck",
              windowIntentId: "window-intent-review-workspace",
              deliveryChainStageId: "delivery-chain-operator-review",
              windowId: "window-trace-review",
              sharedStateLaneId: "shared-state-lane-trace-review",
              orchestrationBoardId: "orchestration-board-trace-review",
              observabilityMappingId: "observability-mapping-approval-active",
              stability: "watch"
            },
            {
              id: "companion-path-handoff-rollback-shadow-publish-gate",
              label: "Rollback shadow handoff",
              summary:
                "Keep the rollback closeout -> publish gate path restorable so recovery shadow review can hand back into the live decision gate with the same cross-window linkage.",
              tone: "warning",
              routeStateId: "companion-route-state-rollback-shadow",
              sequenceId: "companion-sequence-delivery-rollback-shadow",
              reviewPathId: "companion-path-rollback-closeout-publish-gate",
              sourceActionId: "command-focus-rollback-closeout-window",
              targetActionId: "command-focus-publish-decision-gate",
              followUpActionId: "command-focus-approval-reviewer-queue",
              workspaceViewId: "review-deck",
              windowIntentId: "window-intent-review-workspace",
              deliveryChainStageId: "delivery-chain-rollback-readiness",
              windowId: "window-trace-review",
              sharedStateLaneId: "shared-state-lane-trace-review",
              orchestrationBoardId: "orchestration-board-trace-review",
              observabilityMappingId: "observability-mapping-rollback-shadow",
              stability: "restored"
            }
          ],
          companionRouteHistory: [
            {
              id: "companion-route-history-publish-gate-queue",
              label: "Publish Gate -> Approval Queue",
              summary:
                "Remember the publish gate -> approval queue switch so reviewer ownership can reopen inside the same delivery lane without losing publish coverage.",
              tone: "warning",
              transitionKind: "switch-sequence",
              sourceActionId: "command-focus-publish-decision-gate",
              targetActionId: "command-focus-approval-reviewer-queue",
              routeStateId: "companion-route-state-publish-gate",
              sequenceId: "companion-sequence-delivery-gate-loop",
              reviewPathId: "companion-path-publish-gate-reviewer-queue",
              workspaceViewId: "review-deck",
              windowIntentId: "window-intent-review-workspace",
              deliveryChainStageId: "delivery-chain-publish-decision",
              windowId: "window-shell-main",
              sharedStateLaneId: "shared-state-lane-boundary-review",
              orchestrationBoardId: "orchestration-board-boundary-review",
              observabilityMappingId: "observability-mapping-final-gate",
              timestampLabel: "Latest queue pivot",
              scenarioLabel: "Publish gate approval handback",
              scenarioSummary:
                "Restore the final go/no-go route, hand into the approval queue, and confirm the same publish gate, reviewer ownership, and observability contract remain visible together.",
              reviewerPosture: "release manager -> approval reviewer baton",
              evidencePosture: "publish gate notes / queue acknowledgement / screenshot staging",
              reviewerWalkthrough: createReplayReviewerWalkthrough({
                summary:
                  "Ordered reviewer walkthrough keeps publish-gate restore, approval checks, gate-to-queue capture review, proof dossier, and queue continuity on one local decision path.",
                readingQueueSummary:
                  "Ordered proof consumption keeps publish-gate intake, approval checks, handback captures, dossier items, and queue continuity inside one reviewer queue.",
                completionDetail:
                  "Publish-gate restore, approval checks, gate-to-queue capture review, proof dossier, and queue continuity are aligned across the current delivery-gate review pack.",
                captureGroupId: "replay-capture-group-publish-gate",
                evidenceItemId: "replay-evidence-publish-compare-ledger",
                continuityHandoffId: "replay-pack-continuity-delivery-gate-queue",
                routeDetail:
                  "Restore the final go/no-go route before the approval queue handback so the reviewer starts from the same publish-gate baseline.",
                checksDetail:
                  "Lock the acceptance checks before the reviewer compares the gate baseline, queue handback, and review-only evidence posture.",
                captureDetail:
                  "Compare the publish-gate baseline beside the approval queue handback frame so reviewer ownership stays readable through the capture pass.",
                evidenceDetail:
                  "Read the pending gate-to-queue comparison ledger after the captures so the proof dossier closes the handback in the same order.",
                continuityDetail:
                  "Confirm the publish-gate handback keeps reviewer ownership attached as the route hands into the approval queue."
              }),
              reviewerSignoff: {
                label: "Publish gate queue signoff",
                owner: "Release manager / approval reviewer",
                summary:
                  "The gate baseline and queue handback still read as one reviewer flow, but the handback frame and comparison ledger are not linked tightly enough to close signoff.",
                verdict: "Queue handback signoff in review",
                nextHandoff: "Stage the approval queue handback frame and attach the gate-to-queue comparison ledger before signoff closes.",
                state: "watch",
                blockers: [
                  "Approval queue handback frame is still staged instead of linked.",
                  "Gate-to-queue comparison ledger remains pending."
                ],
                checkpoints: [
                  {
                    id: "replay-signoff-publish-route",
                    label: "Restore the same publish gate route",
                    owner: "Release manager",
                    detail: "The replay still opens on the same go/no-go baseline instead of flattening the decision context.",
                    state: "ready"
                  },
                  {
                    id: "replay-signoff-publish-handoff",
                    label: "Carry reviewer ownership into the queue handback",
                    owner: "Approval reviewer",
                    detail: "Reviewer baton notes are present, but the queue handback frame still needs to move from staged to linked.",
                    state: "watch"
                  },
                  {
                    id: "replay-signoff-publish-proof",
                    label: "Close the capture-to-proof chain",
                    owner: "Acceptance capture reviewer",
                    detail: "Continuity stays visible, but the pending comparison ledger keeps the final signoff packet open.",
                    state: "watch"
                  }
                ]
              },
              acceptanceChecks: [
                {
                  id: "replay-check-publish-restore",
                  label: "Publish gate restore reopens the same route",
                  detail: "The final decision gate should return with its original route state, not a flattened default surface.",
                  state: "ready"
                },
                {
                  id: "replay-check-publish-queue",
                  label: "Approval queue handback remains sequenced",
                  detail: "The reviewer queue should remain the next step in the replayed route instead of becoming a disconnected jump.",
                  state: "ready"
                },
                {
                  id: "replay-check-publish-evidence",
                  label: "Evidence posture stays review-only",
                  detail: "Acceptance evidence stays local-only, with screenshot metadata and reviewer notes listed but never executed.",
                  state: "watch"
                }
              ],
              scenarioEvidenceItems: [
                {
                  id: "replay-evidence-publish-gate-snapshot",
                  label: "Publish gate route snapshot",
                  artifact: "Decision route snapshot / final gate baseline",
                  kind: "route-snapshot",
                  posture: "linked",
                  owner: "Release manager",
                  dossierSection: "Route baseline",
                  detail: "Link the replayed decision gate summary to the current route snapshot so the acceptance card opens on the same go/no-go posture."
                },
                {
                  id: "replay-evidence-publish-queue-baton",
                  label: "Approval queue baton notes",
                  artifact: "Reviewer baton notes / queue handback",
                  kind: "reviewer-notes",
                  posture: "staged",
                  owner: "Approval reviewer",
                  dossierSection: "Reviewer baton",
                  detail: "Stage the baton notes that explain how reviewer ownership moves from the publish gate into the approval queue."
                },
                {
                  id: "replay-evidence-publish-compare-ledger",
                  label: "Gate handback comparison ledger",
                  artifact: "Acceptance ledger / gate-to-queue comparison",
                  kind: "comparison-ledger",
                  posture: "pending",
                  owner: "Acceptance capture reviewer",
                  dossierSection: "Comparison ledger",
                  detail: "Keep the comparison ledger local-only until the queue handback frame is staged beside the gate baseline."
                }
              ],
              evidenceContinuityChecks: [
                {
                  id: "replay-continuity-publish-route",
                  label: "Decision gate snapshot stays current",
                  handoff: "Decision gate -> route snapshot",
                  detail: "The remembered final decision state should remain attached when the publish gate is restored into the acceptance pack.",
                  state: "ready"
                },
                {
                  id: "replay-continuity-publish-baton",
                  label: "Reviewer baton stays aligned through handback",
                  handoff: "Reviewer baton -> approval queue handback",
                  detail: "Queue ownership should remain attached to the same gate replay so reviewer posture is continuous across the handback.",
                  state: "ready"
                },
                {
                  id: "replay-continuity-publish-capture",
                  label: "Comparison ledger waits on queue frame",
                  handoff: "Comparison ledger -> screenshot target board",
                  detail: "Continuity remains under review until the queue handback frame is paired with the gate baseline inside the target board.",
                  state: "watch"
                }
              ],
              screenshotReviewItems: [
                {
                  id: "replay-shot-publish-gate",
                  label: "Publish gate hero frame",
                  surface: "Final release decision board",
                  posture: "linked",
                  storyboardRole: "baseline",
                  shotIndex: 1,
                  viewport: "Desktop workspace / decision board hero",
                  focus: "Go/no-go posture, route snapshot, reviewer baton",
                  framing: "Hold the final decision board header and route chips in the same shot so the baseline reads instantly.",
                  detail: "Link the gate summary, route snapshot, and current reviewer posture as a single comparison shot.",
                  captureGroupId: "replay-capture-group-publish-gate",
                  captureGroup: "Gate handback comparison",
                  comparisonFrame: "Publish gate baseline -> approval queue handback",
                  linkedEvidenceItemIds: [
                    "replay-evidence-publish-gate-snapshot",
                    "replay-evidence-publish-queue-baton"
                  ]
                },
                {
                  id: "replay-shot-publish-queue",
                  label: "Approval queue handback frame",
                  surface: "Reviewer queue / trace-owned lane",
                  posture: "staged",
                  storyboardRole: "handoff",
                  shotIndex: 2,
                  viewport: "Desktop workspace / queue handback",
                  focus: "Queue acknowledgement, baton notes, gate carry-over",
                  framing: "Keep the queue owner and the replayed gate badges visible together in the same handback frame.",
                  detail: "Stage the handback frame so acknowledgement posture can be reviewed beside the replayed gate.",
                  captureGroupId: "replay-capture-group-publish-gate",
                  captureGroup: "Gate handback comparison",
                  comparisonFrame: "Publish gate baseline -> approval queue handback",
                  linkedEvidenceItemIds: [
                    "replay-evidence-publish-queue-baton",
                    "replay-evidence-publish-compare-ledger"
                  ]
                }
              ]
            },
            {
              id: "companion-route-history-approval-queue-publish-gate",
              label: "Approval Queue -> Publish Gate",
              summary:
                "Remember the approval queue -> publish gate handback so final go/no-go review can resume with the same queue-owned context still visible.",
              tone: "warning",
              transitionKind: "resume-history",
              sourceActionId: "command-focus-approval-reviewer-queue",
              targetActionId: "command-focus-publish-decision-gate",
              routeStateId: "companion-route-state-approval-queue",
              sequenceId: "companion-sequence-delivery-queue-handoff",
              reviewPathId: "companion-path-reviewer-queue-publish-gate",
              workspaceViewId: "review-deck",
              windowIntentId: "window-intent-review-workspace",
              deliveryChainStageId: "delivery-chain-operator-review",
              windowId: "window-trace-review",
              sharedStateLaneId: "shared-state-lane-trace-review",
              orchestrationBoardId: "orchestration-board-trace-review",
              observabilityMappingId: "observability-mapping-approval-active",
              timestampLabel: "Latest publish handback",
              scenarioLabel: "Approval queue publish return",
              scenarioSummary:
                "Resume the reviewer-owned queue route, hand back into the publish gate, and verify queue acknowledgement plus final decision posture remain linked inside the same replay lane.",
              reviewerPosture: "active reviewer queue / publish decision owner",
              evidencePosture: "queue notes / gate readiness / screenshot target board",
              reviewerWalkthrough: createReplayReviewerWalkthrough({
                summary:
                  "Ordered reviewer walkthrough keeps queue restore, acceptance checks, queue-to-gate capture review, proof dossier, and return continuity aligned inside one reviewer-owned replay lane.",
                readingQueueSummary:
                  "Ordered proof consumption keeps queue intake, handback checks, return captures, dossier items, and continuity handoffs inside one reviewer reading queue.",
                completionDetail:
                  "Queue restore, acceptance checks, queue-to-gate capture review, proof dossier, and return continuity are aligned across the current reviewer-owned handback pack.",
                captureGroupId: "replay-capture-group-queue-return",
                evidenceItemId: "replay-evidence-queue-coverage-ledger",
                continuityHandoffId: "replay-pack-continuity-delivery-queue-return",
                routeDetail:
                  "Restore the queue-owned route before the publish handback so the reviewer starts from the same acknowledgement baseline.",
                checksDetail:
                  "Lock the acceptance checks before the reviewer compares queue ownership, the publish return, and the shared coverage contract.",
                captureDetail:
                  "Compare the queue baseline beside the publish-gate return frame so acknowledgement posture stays visible through the capture pass.",
                evidenceDetail:
                  "Read the pending coverage ledger after the captures so the proof dossier closes the queue-to-gate handback in the same order.",
                continuityDetail:
                  "Confirm the queue return keeps the same reviewer-owned context attached while the route hands back into the publish gate."
              }),
              reviewerSignoff: {
                label: "Publish return signoff",
                owner: "Reviewer queue owner / publish decision owner",
                summary:
                  "Queue ownership and final decision posture are still linked, but the missing return frame prevents the reviewer from signing off the handback.",
                verdict: "Publish return signoff blocked",
                nextHandoff: "Capture the publish gate return frame with queue carry-over and observability badges still visible.",
                state: "blocked",
                blockers: [
                  "Publish handback confirmation frame is still required.",
                  "Shared coverage comparison ledger remains pending."
                ],
                checkpoints: [
                  {
                    id: "replay-signoff-queue-route",
                    label: "Keep queue ownership attached to the replay route",
                    owner: "Reviewer queue owner",
                    detail: "The queue baseline remains readable with acknowledgement posture intact.",
                    state: "ready"
                  },
                  {
                    id: "replay-signoff-queue-return",
                    label: "Prove the publish gate return with a capture",
                    owner: "Acceptance capture reviewer",
                    detail: "The required return frame is still missing, so the handback cannot be reviewed as a completed pass.",
                    state: "blocked"
                  },
                  {
                    id: "replay-signoff-queue-coverage",
                    label: "Keep downstream coverage linked through the handback",
                    owner: "Publish decision owner",
                    detail: "Coverage notes are staged, but the pending ledger keeps the signoff package open.",
                    state: "watch"
                  }
                ]
              },
              acceptanceChecks: [
                {
                  id: "replay-check-queue-return",
                  label: "Queue replay keeps reviewer ownership visible",
                  detail: "The restore should keep the queue owner and acknowledgement state attached to the replayed route.",
                  state: "ready"
                },
                {
                  id: "replay-check-queue-gate",
                  label: "Publish handback remains explicit",
                  detail: "The route should still hand back into the publish gate as the primary companion step.",
                  state: "ready"
                },
                {
                  id: "replay-check-queue-window",
                  label: "Cross-window contract survives the handback",
                  detail: "Window, lane, board, and observability mapping remain visible while the queue returns into the publish gate.",
                  state: "watch"
                }
              ],
              scenarioEvidenceItems: [
                {
                  id: "replay-evidence-queue-snapshot",
                  label: "Approval queue route snapshot",
                  artifact: "Queue snapshot / acknowledgement baseline",
                  kind: "route-snapshot",
                  posture: "linked",
                  owner: "Reviewer queue owner",
                  dossierSection: "Route baseline",
                  detail: "Link the current queue owner and acknowledgement state to the replay snapshot so the return path starts from the same review baseline."
                },
                {
                  id: "replay-evidence-queue-return-notes",
                  label: "Publish return notes",
                  artifact: "Handoff notes / queue-to-gate return",
                  kind: "reviewer-notes",
                  posture: "staged",
                  owner: "Publish decision owner",
                  dossierSection: "Reviewer baton",
                  detail: "Stage notes that explain why the queue handback returns the route to the publish gate instead of opening a detached view."
                },
                {
                  id: "replay-evidence-queue-coverage-ledger",
                  label: "Shared coverage comparison ledger",
                  artifact: "Acceptance ledger / queue coverage comparison",
                  kind: "comparison-ledger",
                  posture: "pending",
                  owner: "Acceptance capture reviewer",
                  dossierSection: "Comparison ledger",
                  detail: "Hold the comparison ledger until the return frame confirms queue ownership and gate context stay visible together."
                }
              ],
              evidenceContinuityChecks: [
                {
                  id: "replay-continuity-queue-owner",
                  label: "Queue owner stays attached to the replay snapshot",
                  handoff: "Queue owner -> route snapshot",
                  detail: "The active reviewer and acknowledgement state should remain attached when the queue-owned route is restored.",
                  state: "ready"
                },
                {
                  id: "replay-continuity-queue-return",
                  label: "Publish return stays tied to queue context",
                  handoff: "Queue notes -> publish return",
                  detail: "The handback into the publish gate should preserve the same queue-owned context instead of resetting the acceptance surface.",
                  state: "ready"
                },
                {
                  id: "replay-continuity-queue-capture",
                  label: "Coverage ledger waits on return frame",
                  handoff: "Coverage ledger -> screenshot target board",
                  detail: "Continuity remains in review until the return frame proves the same coverage contract stays visible during the handback.",
                  state: "watch"
                }
              ],
              screenshotReviewItems: [
                {
                  id: "replay-shot-queue-current",
                  label: "Approval queue current-state frame",
                  surface: "Reviewer queue",
                  posture: "staged",
                  storyboardRole: "baseline",
                  shotIndex: 1,
                  viewport: "Desktop workspace / queue current state",
                  focus: "Queue owner, acknowledgement state, replay badges",
                  framing: "Keep the active reviewer row and route badges together so the queue baseline feels anchored.",
                  detail: "Stage the queue owner, acknowledgement state, and replay route badges in one review frame.",
                  captureGroupId: "replay-capture-group-queue-return",
                  captureGroup: "Queue return comparison",
                  comparisonFrame: "Approval queue baseline -> publish gate return",
                  linkedEvidenceItemIds: [
                    "replay-evidence-queue-snapshot",
                    "replay-evidence-queue-return-notes"
                  ]
                },
                {
                  id: "replay-shot-queue-return",
                  label: "Publish handback confirmation frame",
                  surface: "Publish decision gate / shared-state coverage",
                  posture: "required",
                  storyboardRole: "return",
                  shotIndex: 2,
                  viewport: "Desktop workspace / gate return confirmation",
                  focus: "Returned gate summary, queue carry-over, observability badges",
                  framing: "Frame the returned publish gate with queue ownership still visible so the handback does not read like a reset.",
                  detail: "Capture the point where the replayed queue route hands back into the gate while keeping the same coverage contract.",
                  captureGroupId: "replay-capture-group-queue-return",
                  captureGroup: "Queue return comparison",
                  comparisonFrame: "Approval queue baseline -> publish gate return",
                  linkedEvidenceItemIds: [
                    "replay-evidence-queue-return-notes",
                    "replay-evidence-queue-coverage-ledger"
                  ]
                }
              ]
            },
            {
              id: "companion-route-history-rollback-shadow-publish-gate",
              label: "Rollback Shadow -> Publish Gate",
              summary:
                "Remember the rollback shadow -> publish gate stabilization so recovery review can re-enter the live decision gate with the same traced fallback path.",
              tone: "warning",
              transitionKind: "stabilize-handoff",
              sourceActionId: "command-focus-rollback-closeout-window",
              targetActionId: "command-focus-publish-decision-gate",
              routeStateId: "companion-route-state-rollback-shadow",
              sequenceId: "companion-sequence-delivery-rollback-shadow",
              reviewPathId: "companion-path-rollback-closeout-publish-gate",
              workspaceViewId: "review-deck",
              windowIntentId: "window-intent-review-workspace",
              deliveryChainStageId: "delivery-chain-rollback-readiness",
              windowId: "window-trace-review",
              sharedStateLaneId: "shared-state-lane-trace-review",
              orchestrationBoardId: "orchestration-board-trace-review",
              observabilityMappingId: "observability-mapping-rollback-shadow",
              timestampLabel: "Recovery shadow memory",
              scenarioLabel: "Rollback shadow recovery re-entry",
              scenarioSummary:
                "Replay the rollback shadow route, step back into the publish gate, and confirm recovery posture, reviewer shadow, and decision coverage remain bundled for product acceptance review.",
              reviewerPosture: "rollback owner / final decision watcher",
              evidencePosture: "recovery notes / decision evidence / screenshot staging",
              reviewerWalkthrough: createReplayReviewerWalkthrough({
                summary:
                  "Ordered reviewer walkthrough keeps rollback restore, acceptance checks, recovery re-entry capture review, proof dossier, and recovery continuity inside one fallback-aware reading order.",
                readingQueueSummary:
                  "Ordered proof consumption keeps rollback intake, recovery checks, re-entry captures, dossier items, and continuity handoffs on one reviewer queue.",
                completionDetail:
                  "Rollback restore, recovery checks, re-entry capture review, proof dossier, and recovery continuity are aligned across the current fallback replay pack.",
                captureGroupId: "replay-capture-group-recovery-reentry",
                evidenceItemId: "replay-evidence-rollback-compare-ledger",
                continuityHandoffId: "replay-pack-continuity-delivery-rollback-reentry",
                routeDetail:
                  "Restore the rollback shadow route before the publish-gate re-entry so the reviewer starts from the same recovery baseline.",
                checksDetail:
                  "Lock the acceptance checks before the reviewer compares the rollback baseline, the gate re-entry, and the local-only recovery evidence posture.",
                captureDetail:
                  "Compare the rollback baseline beside the publish-gate re-entry frame so the recovery shadow remains visible through the capture pass.",
                evidenceDetail:
                  "Read the pending recovery comparison ledger after the captures so the proof dossier closes the rollback-to-gate handoff in the same order.",
                continuityDetail:
                  "Confirm the rollback continuity handoff keeps the recovery shadow attached while the route re-enters the publish gate."
              }),
              reviewerSignoff: {
                label: "Recovery re-entry signoff",
                owner: "Rollback owner / recovery reviewer",
                summary:
                  "The rollback shadow route restores cleanly, but signoff stays blocked until the gate re-entry frame proves recovery posture remains visible.",
                verdict: "Recovery re-entry signoff blocked",
                nextHandoff: "Capture the publish gate re-entry frame with rollback shadow context still attached.",
                state: "blocked",
                blockers: [
                  "Recovery re-entry frame is still required.",
                  "Recovery comparison ledger remains pending."
                ],
                checkpoints: [
                  {
                    id: "replay-signoff-rollback-route",
                    label: "Restore rollback shadow posture before re-entry",
                    owner: "Rollback owner",
                    detail: "The replay keeps the rollback baseline readable before the publish gate comes back into scope.",
                    state: "ready"
                  },
                  {
                    id: "replay-signoff-rollback-reentry",
                    label: "Show the gate re-entry with recovery context intact",
                    owner: "Acceptance capture reviewer",
                    detail: "The required re-entry capture is missing, so recovery signoff cannot advance.",
                    state: "blocked"
                  },
                  {
                    id: "replay-signoff-rollback-proof",
                    label: "Keep recovery proof chain continuous",
                    owner: "Recovery reviewer",
                    detail: "Recovery notes stay staged, but the pending comparison ledger still keeps the signoff packet open.",
                    state: "watch"
                  }
                ]
              },
              acceptanceChecks: [
                {
                  id: "replay-check-rollback-shadow",
                  label: "Rollback shadow route restores cleanly",
                  detail: "The recovery shadow should return as its own replay route without dropping rollback-specific posture.",
                  state: "ready"
                },
                {
                  id: "replay-check-rollback-gate",
                  label: "Publish gate re-entry stays attached",
                  detail: "The rollback route should still surface the publish gate as the primary re-entry step.",
                  state: "ready"
                },
                {
                  id: "replay-check-rollback-safety",
                  label: "Recovery evidence remains local-only",
                  detail: "Rollback closeout evidence, screenshots, and notes stay review-only and never drive a live rollback.",
                  state: "watch"
                }
              ],
              scenarioEvidenceItems: [
                {
                  id: "replay-evidence-rollback-shadow-snapshot",
                  label: "Rollback shadow route snapshot",
                  artifact: "Recovery snapshot / rollback closeout baseline",
                  kind: "route-snapshot",
                  posture: "linked",
                  owner: "Rollback owner",
                  dossierSection: "Route baseline",
                  detail: "Link the rollback shadow replay snapshot to the closeout summary so recovery review begins from the same fallback baseline."
                },
                {
                  id: "replay-evidence-rollback-reentry-notes",
                  label: "Recovery re-entry notes",
                  artifact: "Fallback notes / publish gate re-entry",
                  kind: "reviewer-notes",
                  posture: "staged",
                  owner: "Recovery reviewer",
                  dossierSection: "Reviewer baton",
                  detail: "Stage the notes that explain how the rollback shadow route re-enters the publish gate without dropping recovery posture."
                },
                {
                  id: "replay-evidence-rollback-compare-ledger",
                  label: "Recovery comparison ledger",
                  artifact: "Acceptance ledger / rollback-to-gate comparison",
                  kind: "comparison-ledger",
                  posture: "pending",
                  owner: "Acceptance capture reviewer",
                  dossierSection: "Comparison ledger",
                  detail: "Keep the comparison ledger local-only until the recovery re-entry frame is staged beside the rollback baseline."
                }
              ],
              evidenceContinuityChecks: [
                {
                  id: "replay-continuity-rollback-shadow",
                  label: "Rollback baseline stays attached to the replay route",
                  handoff: "Rollback closeout -> route snapshot",
                  detail: "The recovery baseline should remain visible when the rollback shadow route is restored for product review.",
                  state: "ready"
                },
                {
                  id: "replay-continuity-rollback-reentry",
                  label: "Recovery notes stay aligned through gate re-entry",
                  handoff: "Fallback notes -> publish gate re-entry",
                  detail: "Recovery notes and reviewer posture should remain attached when the shadow route re-enters the publish decision gate.",
                  state: "ready"
                },
                {
                  id: "replay-continuity-rollback-capture",
                  label: "Recovery ledger waits on re-entry frame",
                  handoff: "Recovery ledger -> screenshot target board",
                  detail: "Continuity stays under review until the re-entry frame confirms the same rollback context remains visible at the gate.",
                  state: "watch"
                }
              ],
              screenshotReviewItems: [
                {
                  id: "replay-shot-rollback-shadow",
                  label: "Rollback shadow baseline",
                  surface: "Rollback closeout window",
                  posture: "linked",
                  storyboardRole: "baseline",
                  shotIndex: 1,
                  viewport: "Desktop workspace / rollback closeout",
                  focus: "Recovery baseline, shadow context, replay route metadata",
                  framing: "Hold the rollback closeout summary and replay chips in one frame so the fallback baseline stays legible.",
                  detail: "Link the rollback closeout summary and replay route metadata as a recovery baseline frame.",
                  captureGroupId: "replay-capture-group-recovery-reentry",
                  captureGroup: "Recovery re-entry comparison",
                  comparisonFrame: "Rollback shadow baseline -> publish gate re-entry",
                  linkedEvidenceItemIds: [
                    "replay-evidence-rollback-shadow-snapshot",
                    "replay-evidence-rollback-reentry-notes"
                  ]
                },
                {
                  id: "replay-shot-rollback-reentry",
                  label: "Recovery re-entry frame",
                  surface: "Publish decision gate / rollback shadow companion",
                  posture: "required",
                  storyboardRole: "re-entry",
                  shotIndex: 2,
                  viewport: "Desktop workspace / recovery gate re-entry",
                  focus: "Gate re-entry, rollback notes, preserved shadow posture",
                  framing: "Frame the publish gate with rollback shadow context still visible so the re-entry cannot be mistaken for a clean route.",
                  detail: "Capture the recovery route re-entering the publish gate while the same shadow context stays visible.",
                  captureGroupId: "replay-capture-group-recovery-reentry",
                  captureGroup: "Recovery re-entry comparison",
                  comparisonFrame: "Rollback shadow baseline -> publish gate re-entry",
                  linkedEvidenceItemIds: [
                    "replay-evidence-rollback-reentry-notes",
                    "replay-evidence-rollback-compare-ledger"
                  ]
                }
              ]
            }
          ]
        },
        {
          id: "deck-lane-review-deck-handoff",
          label: "Preview Handoff Stabilization",
          summary:
            "Advance the preview workflow lane only after approval handoff and evidence closeout surfaces are aligned, so baton posture and closeout timing stay attached to the same local orchestration board.",
          tone: "warning",
          actionIds: [
            "command-open-review-view",
            "command-stage-review-window",
            "command-open-windows-observability",
            "command-focus-approval-decision-handoff",
            "command-focus-approval-evidence-closeout",
            "command-advance-workflow"
          ],
          primaryActionId: "command-focus-approval-decision-handoff",
          followUpActionIds: ["command-focus-approval-evidence-closeout", "command-advance-workflow"],
          workspaceViewIds: ["review-deck"],
          windowIntentIds: ["window-intent-review-workspace"],
          deliveryChainStageIds: ["delivery-chain-operator-review"],
          focusDeliveryChainStageId: "delivery-chain-operator-review",
          windowIds: ["window-trace-review"],
          focusWindowId: "window-trace-review",
          sharedStateLaneIds: ["shared-state-lane-trace-review"],
          focusSharedStateLaneId: "shared-state-lane-trace-review",
          orchestrationBoardIds: ["orchestration-board-trace-review"],
          focusOrchestrationBoardId: "orchestration-board-trace-review",
          observabilityMappingIds: ["observability-mapping-approval-active"],
          focusObservabilityMappingId: "observability-mapping-approval-active",
          replayScenarioPack: {
            id: "replay-scenario-pack-handoff",
            label: "Decision Handoff Acceptance Pack",
            summary:
              "Bundle decision baton, evidence closeout, return handoff, reviewer brief, screenshot pass records, a reviewer flow ladder, an acceptance reading queue, a final review closeout, and a continuity-backed proof-linked capture flow into one review roster so route replay doubles as a realistic approval acceptance script.",
            continuitySummary:
              "Acceptance evidence continuity keeps the baton baseline, closeout sealing posture, and decision return proof aligned so the approval relay reads like one sealed review chain.",
            reviewerPosture: "baton owner / evidence closeout reviewer",
            evidencePosture: "handoff notes / sealing posture / screenshot staging",
            acceptancePosture: "handoff stabilization final review closeout",
            continuityHandoffs: [
              {
                id: "replay-pack-continuity-handoff-closeout",
                label: "Decision baton hands cleanly into closeout review",
                sourceLabel: "Decision baton baseline",
                targetLabel: "Evidence closeout baseline",
                detail:
                  "The baton baseline should carry its acknowledgement framing into the closeout baseline before the return handoff is reviewed.",
                state: "ready",
                sourceScenarioId: "companion-route-history-decision-handoff-closeout",
                targetScenarioId: "companion-route-history-closeout-decision-handoff",
                linkedEvidenceItemIds: [
                  "replay-evidence-handoff-closeout-notes",
                  "replay-evidence-closeout-snapshot"
                ],
                linkedScreenshotIds: ["replay-shot-handoff-baton", "replay-shot-closeout-current"]
              },
              {
                id: "replay-pack-continuity-handoff-return",
                label: "Closeout return keeps the baton proof chain intact",
                sourceLabel: "Closeout return notes",
                targetLabel: "Decision handback confirmation",
                detail:
                  "Sealed evidence should hand back into the baton owner with the same return notes and downstream publish posture still attached.",
                state: "watch",
                sourceScenarioId: "companion-route-history-closeout-decision-handoff",
                targetScenarioId: "companion-route-history-decision-handoff-closeout",
                linkedEvidenceItemIds: [
                  "replay-evidence-closeout-return-notes",
                  "replay-evidence-handoff-baton-snapshot"
                ],
                linkedScreenshotIds: ["replay-shot-closeout-return", "replay-shot-handoff-baton"]
              }
            ],
            safety: "local-only"
          },
          companionSequences: [
            {
              id: "companion-sequence-handoff-stabilization",
              label: "Handoff Stabilization Relay",
              summary:
                "Sequence decision handoff, evidence closeout, reviewer queue, and publish gate so acknowledgement timing and downstream decision posture stay visible in one relay.",
              tone: "warning",
              steps: [
                {
                  id: "companion-sequence-step-handoff-decision",
                  actionId: "command-focus-approval-decision-handoff",
                  role: "current-review-surface",
                  summary: "Treat decision handoff as the current surface while baton state is being stabilized."
                },
                {
                  id: "companion-sequence-step-handoff-closeout",
                  actionId: "command-focus-approval-evidence-closeout",
                  role: "primary-companion",
                  summary: "Lift evidence closeout next so sealing posture stays attached to the baton handoff."
                },
                {
                  id: "companion-sequence-step-handoff-reviewer-queue",
                  actionId: "command-focus-approval-reviewer-queue",
                  role: "follow-up-companion",
                  summary: "Keep the reviewer queue in sequence so acknowledgement timing never detaches from queue ownership."
                },
                {
                  id: "companion-sequence-step-handoff-publish-gate",
                  actionId: "command-focus-publish-decision-gate",
                  role: "follow-up-companion",
                  summary: "Carry the handoff relay all the way to the publish gate so downstream decision posture remains in scope."
                }
              ]
            }
          ],
          companionReviewPaths: [
            {
              id: "companion-path-decision-handoff-evidence-closeout",
              label: "Decision Handoff -> Evidence Closeout",
              summary:
                "Treat decision handoff as the current review surface, then lift evidence closeout as the primary companion so baton state, acknowledgement timing, and sealing posture remain attached to the same trace-owned review lane.",
              tone: "warning",
              kind: "handoff-companion",
              sequenceId: "companion-sequence-handoff-stabilization",
              sourceActionId: "command-focus-approval-decision-handoff",
              primaryActionId: "command-focus-approval-evidence-closeout",
              followUpActionIds: ["command-focus-approval-reviewer-queue"]
            },
            {
              id: "companion-path-evidence-closeout-decision-handoff",
              label: "Evidence Closeout -> Decision Handoff",
              summary:
                "When evidence closeout is current, re-surface decision handoff as the primary companion so the sealing contract, baton target, and publish-facing decision gate stay synchronized through the same handoff lane.",
              tone: "warning",
              kind: "stabilization-companion",
              sequenceId: "companion-sequence-handoff-stabilization",
              sourceActionId: "command-focus-approval-evidence-closeout",
              primaryActionId: "command-focus-approval-decision-handoff",
              followUpActionIds: ["command-focus-publish-decision-gate"]
            }
          ],
          companionRouteStates: [
            {
              id: "companion-route-state-decision-handoff",
              label: "Decision Handoff Active Route",
              summary:
                "Keep decision handoff as the active route so evidence closeout, reviewer queue, and publish gate stay sequenced from the same trace-owned stabilization lane.",
              tone: "warning",
              posture: "active-route",
              sourceActionId: "command-focus-approval-decision-handoff",
              currentActionId: "command-focus-approval-decision-handoff",
              routeActionIds: [
                "command-focus-approval-decision-handoff",
                "command-focus-approval-evidence-closeout",
                "command-focus-approval-reviewer-queue",
                "command-focus-publish-decision-gate"
              ],
              workspaceViewId: "review-deck",
              windowIntentId: "window-intent-review-workspace",
              deliveryChainStageId: "delivery-chain-operator-review",
              windowId: "window-trace-review",
              sharedStateLaneId: "shared-state-lane-trace-review",
              orchestrationBoardId: "orchestration-board-trace-review",
              observabilityMappingId: "observability-mapping-approval-active",
              activeSequenceId: "companion-sequence-handoff-stabilization",
              activeReviewPathId: "companion-path-decision-handoff-evidence-closeout",
              sequenceSwitches: [
                {
                  id: "companion-route-switch-decision-handoff",
                  label: "Handoff stabilization relay",
                  summary:
                    "Keep decision handoff current while evidence closeout, reviewer ownership, and publish posture remain visible on the same relay.",
                  tone: "warning",
                  posture: "active-sequence",
                  sequenceId: "companion-sequence-handoff-stabilization",
                  targetActionId: "command-focus-approval-decision-handoff",
                  reviewPathId: "companion-path-decision-handoff-evidence-closeout"
                }
              ]
            },
            {
              id: "companion-route-state-evidence-closeout",
              label: "Evidence Closeout Alternate Route",
              summary:
                "Treat evidence closeout as an alternate route so sealing posture can become current without dropping the same handoff stabilization relay.",
              tone: "warning",
              posture: "alternate-route",
              sourceActionId: "command-focus-approval-evidence-closeout",
              currentActionId: "command-focus-approval-evidence-closeout",
              routeActionIds: [
                "command-focus-approval-evidence-closeout",
                "command-focus-approval-decision-handoff",
                "command-focus-approval-reviewer-queue",
                "command-focus-publish-decision-gate"
              ],
              workspaceViewId: "review-deck",
              windowIntentId: "window-intent-review-workspace",
              deliveryChainStageId: "delivery-chain-operator-review",
              windowId: "window-trace-review",
              sharedStateLaneId: "shared-state-lane-trace-review",
              orchestrationBoardId: "orchestration-board-trace-review",
              observabilityMappingId: "observability-mapping-approval-active",
              activeSequenceId: "companion-sequence-handoff-stabilization",
              activeReviewPathId: "companion-path-evidence-closeout-decision-handoff",
              sequenceSwitches: [
                {
                  id: "companion-route-switch-evidence-closeout",
                  label: "Handoff stabilization relay",
                  summary:
                    "Keep evidence closeout current while decision handoff, reviewer ownership, and publish posture remain visible on the same relay.",
                  tone: "warning",
                  posture: "active-sequence",
                  sequenceId: "companion-sequence-handoff-stabilization",
                  targetActionId: "command-focus-approval-evidence-closeout",
                  reviewPathId: "companion-path-evidence-closeout-decision-handoff"
                }
              ]
            }
          ],
          companionPathHandoffs: [
            {
              id: "companion-path-handoff-decision-handoff-closeout",
              label: "Decision baton handoff",
              summary:
                "Keep the decision handoff -> evidence closeout path stabilized so baton posture and sealing posture resume together inside the same trace-owned lane.",
              tone: "warning",
              routeStateId: "companion-route-state-decision-handoff",
              sequenceId: "companion-sequence-handoff-stabilization",
              reviewPathId: "companion-path-decision-handoff-evidence-closeout",
              sourceActionId: "command-focus-approval-decision-handoff",
              targetActionId: "command-focus-approval-evidence-closeout",
              followUpActionId: "command-focus-approval-reviewer-queue",
              workspaceViewId: "review-deck",
              windowIntentId: "window-intent-review-workspace",
              deliveryChainStageId: "delivery-chain-operator-review",
              windowId: "window-trace-review",
              sharedStateLaneId: "shared-state-lane-trace-review",
              orchestrationBoardId: "orchestration-board-trace-review",
              observabilityMappingId: "observability-mapping-approval-active",
              stability: "stable"
            },
            {
              id: "companion-path-handoff-closeout-decision-handoff",
              label: "Closeout return handoff",
              summary:
                "Keep the evidence closeout -> decision handoff path restorable so sealing review can hand back into the baton owner without losing the same trace posture.",
              tone: "warning",
              routeStateId: "companion-route-state-evidence-closeout",
              sequenceId: "companion-sequence-handoff-stabilization",
              reviewPathId: "companion-path-evidence-closeout-decision-handoff",
              sourceActionId: "command-focus-approval-evidence-closeout",
              targetActionId: "command-focus-approval-decision-handoff",
              followUpActionId: "command-focus-publish-decision-gate",
              workspaceViewId: "review-deck",
              windowIntentId: "window-intent-review-workspace",
              deliveryChainStageId: "delivery-chain-operator-review",
              windowId: "window-trace-review",
              sharedStateLaneId: "shared-state-lane-trace-review",
              orchestrationBoardId: "orchestration-board-trace-review",
              observabilityMappingId: "observability-mapping-approval-active",
              stability: "restored"
            }
          ],
          companionRouteHistory: [
            {
              id: "companion-route-history-decision-handoff-closeout",
              label: "Decision Handoff -> Evidence Closeout",
              summary:
                "Remember the baton -> closeout handoff so returning to the stabilization lane restores sealing posture with the same acknowledgement chain still attached.",
              tone: "warning",
              transitionKind: "stabilize-handoff",
              sourceActionId: "command-focus-approval-decision-handoff",
              targetActionId: "command-focus-approval-evidence-closeout",
              routeStateId: "companion-route-state-decision-handoff",
              sequenceId: "companion-sequence-handoff-stabilization",
              reviewPathId: "companion-path-decision-handoff-evidence-closeout",
              workspaceViewId: "review-deck",
              windowIntentId: "window-intent-review-workspace",
              deliveryChainStageId: "delivery-chain-operator-review",
              windowId: "window-trace-review",
              sharedStateLaneId: "shared-state-lane-trace-review",
              orchestrationBoardId: "orchestration-board-trace-review",
              observabilityMappingId: "observability-mapping-approval-active",
              timestampLabel: "Decision memory",
              scenarioLabel: "Decision baton closeout handoff",
              scenarioSummary:
                "Restore the decision baton route, hand into evidence closeout, and verify sealing posture stays attached to the same acknowledgement chain and replay evidence posture.",
              reviewerPosture: "decision baton owner / closeout reviewer",
              evidencePosture: "baton notes / sealing evidence / screenshot staging",
              reviewerWalkthrough: createReplayReviewerWalkthrough({
                summary:
                  "Ordered reviewer walkthrough keeps decision-baton restore, acceptance checks, baton-to-closeout capture review, proof dossier, and closeout continuity aligned inside one handoff relay.",
                readingQueueSummary:
                  "Ordered proof consumption keeps baton intake, handoff checks, closeout captures, dossier items, and continuity handoffs on one stabilization queue.",
                completionDetail:
                  "Decision-baton restore, acceptance checks, closeout capture review, proof dossier, and continuity handoff are aligned across the current handoff relay pack.",
                captureGroupId: "replay-capture-group-baton-closeout",
                evidenceItemId: "replay-evidence-handoff-compare-ledger",
                continuityHandoffId: "replay-pack-continuity-handoff-closeout",
                routeDetail:
                  "Restore the decision-baton route before closeout becomes primary so the reviewer starts from the same acknowledgement baseline.",
                checksDetail:
                  "Lock the acceptance checks before the reviewer compares baton posture, closeout sequencing, and the review-only sealing evidence posture.",
                captureDetail:
                  "Compare the baton baseline beside the evidence-closeout companion frame so the sealing handoff reads as one capture pass.",
                evidenceDetail:
                  "Read the pending baton-to-closeout comparison ledger after the captures so the proof dossier closes the relay in the same order.",
                continuityDetail:
                  "Confirm the baton continuity handoff keeps acknowledgement framing attached while the route lifts evidence closeout into focus."
              }),
              reviewerSignoff: {
                label: "Closeout handoff signoff",
                owner: "Decision baton owner / evidence closeout reviewer",
                summary:
                  "The baton and sealing posture stay in one lane, but signoff remains blocked until the closeout companion frame completes the comparison pass.",
                verdict: "Closeout handoff signoff blocked",
                nextHandoff: "Capture the closeout companion frame with baton carry-over still visible and attach the comparison ledger.",
                state: "blocked",
                blockers: [
                  "Closeout companion frame is still required.",
                  "Baton-to-closeout comparison ledger remains pending."
                ],
                checkpoints: [
                  {
                    id: "replay-signoff-handoff-route",
                    label: "Restore the baton baseline before closeout",
                    owner: "Decision baton owner",
                    detail: "The replay still reopens on the baton baseline with acknowledgement posture intact.",
                    state: "ready"
                  },
                  {
                    id: "replay-signoff-handoff-closeout",
                    label: "Show closeout as the primary companion pass",
                    owner: "Acceptance capture reviewer",
                    detail: "The required closeout companion capture is missing, so the reviewer cannot sign off the handoff relay.",
                    state: "blocked"
                  },
                  {
                    id: "replay-signoff-handoff-proof",
                    label: "Seal the baton-to-closeout proof chain",
                    owner: "Evidence closeout reviewer",
                    detail: "Sealing notes stay staged, but the pending comparison ledger still keeps signoff open.",
                    state: "watch"
                  }
                ]
              },
              acceptanceChecks: [
                {
                  id: "replay-check-handoff-baton",
                  label: "Decision baton restores before closeout",
                  detail: "The replay should reopen the decision handoff before evidence closeout becomes current.",
                  state: "ready"
                },
                {
                  id: "replay-check-handoff-closeout",
                  label: "Evidence closeout stays sequenced",
                  detail: "Closeout should remain the primary companion step under the same replayed handoff lane.",
                  state: "ready"
                },
                {
                  id: "replay-check-handoff-proof",
                  label: "Acceptance evidence remains review-only",
                  detail: "Sealing posture and screenshot metadata remain staged for review and never trigger approval execution.",
                  state: "watch"
                }
              ],
              scenarioEvidenceItems: [
                {
                  id: "replay-evidence-handoff-baton-snapshot",
                  label: "Decision baton route snapshot",
                  artifact: "Baton snapshot / acknowledgement baseline",
                  kind: "route-snapshot",
                  posture: "linked",
                  owner: "Decision baton owner",
                  dossierSection: "Route baseline",
                  detail: "Link the replayed baton summary to the acknowledgement posture so the acceptance card begins from the same handoff baseline."
                },
                {
                  id: "replay-evidence-handoff-closeout-notes",
                  label: "Closeout handoff notes",
                  artifact: "Sealing notes / closeout companion handoff",
                  kind: "reviewer-notes",
                  posture: "staged",
                  owner: "Evidence closeout reviewer",
                  dossierSection: "Reviewer baton",
                  detail: "Stage the notes that explain how evidence closeout becomes the primary companion without detaching the baton context."
                },
                {
                  id: "replay-evidence-handoff-compare-ledger",
                  label: "Baton closeout comparison ledger",
                  artifact: "Acceptance ledger / baton-to-closeout comparison",
                  kind: "comparison-ledger",
                  posture: "pending",
                  owner: "Acceptance capture reviewer",
                  dossierSection: "Comparison ledger",
                  detail: "Keep the comparison ledger local-only until the closeout companion frame is staged beside the baton baseline."
                }
              ],
              evidenceContinuityChecks: [
                {
                  id: "replay-continuity-handoff-baton",
                  label: "Decision baton stays attached to the route snapshot",
                  handoff: "Decision baton -> route snapshot",
                  detail: "The same acknowledgement posture should remain attached when the decision baton route is restored into the acceptance pack.",
                  state: "ready"
                },
                {
                  id: "replay-continuity-handoff-closeout",
                  label: "Sealing notes stay aligned through closeout",
                  handoff: "Sealing notes -> evidence closeout",
                  detail: "Closeout should inherit the staged sealing notes so the handoff remains continuous for product review.",
                  state: "ready"
                },
                {
                  id: "replay-continuity-handoff-capture",
                  label: "Comparison ledger waits on closeout frame",
                  handoff: "Comparison ledger -> screenshot target board",
                  detail: "Continuity stays in review until the closeout companion frame confirms the same baton context remains visible.",
                  state: "watch"
                }
              ],
              screenshotReviewItems: [
                {
                  id: "replay-shot-handoff-baton",
                  label: "Decision baton baseline",
                  surface: "Decision handoff surface",
                  posture: "staged",
                  storyboardRole: "baseline",
                  shotIndex: 1,
                  viewport: "Desktop workspace / decision baton",
                  focus: "Baton summary, acknowledgement posture, route snapshot",
                  framing: "Keep the baton summary and acknowledgement posture locked together so the baseline reads like a handoff moment.",
                  detail: "Stage the baton summary, route snapshot, and acknowledgement posture together.",
                  captureGroupId: "replay-capture-group-baton-closeout",
                  captureGroup: "Baton closeout comparison",
                  comparisonFrame: "Decision baton baseline -> evidence closeout companion",
                  linkedEvidenceItemIds: [
                    "replay-evidence-handoff-baton-snapshot",
                    "replay-evidence-handoff-closeout-notes"
                  ]
                },
                {
                  id: "replay-shot-handoff-closeout",
                  label: "Closeout companion frame",
                  surface: "Evidence closeout",
                  posture: "required",
                  storyboardRole: "handoff",
                  shotIndex: 2,
                  viewport: "Desktop workspace / closeout companion",
                  focus: "Sealing posture, baton carry-over, closeout evidence surface",
                  framing: "Frame evidence closeout as the primary companion while the baton context stays visible in the same shot.",
                  detail: "Capture the point where the replayed baton route lifts evidence closeout as its primary companion.",
                  captureGroupId: "replay-capture-group-baton-closeout",
                  captureGroup: "Baton closeout comparison",
                  comparisonFrame: "Decision baton baseline -> evidence closeout companion",
                  linkedEvidenceItemIds: [
                    "replay-evidence-handoff-closeout-notes",
                    "replay-evidence-handoff-compare-ledger"
                  ]
                }
              ]
            },
            {
              id: "companion-route-history-closeout-decision-handoff",
              label: "Evidence Closeout -> Decision Handoff",
              summary:
                "Remember the closeout -> decision handback so baton posture can resume from sealing review with the same downstream publish gate still in scope.",
              tone: "warning",
              transitionKind: "resume-history",
              sourceActionId: "command-focus-approval-evidence-closeout",
              targetActionId: "command-focus-approval-decision-handoff",
              routeStateId: "companion-route-state-evidence-closeout",
              sequenceId: "companion-sequence-handoff-stabilization",
              reviewPathId: "companion-path-evidence-closeout-decision-handoff",
              workspaceViewId: "review-deck",
              windowIntentId: "window-intent-review-workspace",
              deliveryChainStageId: "delivery-chain-operator-review",
              windowId: "window-trace-review",
              sharedStateLaneId: "shared-state-lane-trace-review",
              orchestrationBoardId: "orchestration-board-trace-review",
              observabilityMappingId: "observability-mapping-approval-active",
              timestampLabel: "Closeout memory",
              scenarioLabel: "Evidence closeout decision return",
              scenarioSummary:
                "Resume the closeout-owned route, hand back into the decision baton, and verify sealing posture plus downstream publish context remain attached inside the same replay surface.",
              reviewerPosture: "evidence closeout reviewer / decision owner",
              evidencePosture: "sealed evidence / handback notes / screenshot target board",
              reviewerWalkthrough: createReplayReviewerWalkthrough({
                summary:
                  "Ordered reviewer walkthrough keeps closeout restore, acceptance checks, closeout-to-decision capture review, proof dossier, and return continuity aligned inside one sealed-evidence reading order.",
                readingQueueSummary:
                  "Ordered proof consumption keeps closeout intake, return checks, decision handback captures, dossier items, and continuity handoffs on one reviewer queue.",
                completionDetail:
                  "Closeout restore, acceptance checks, decision handback capture review, proof dossier, and return continuity are aligned across the current sealed-evidence replay pack.",
                captureGroupId: "replay-capture-group-closeout-decision",
                evidenceItemId: "replay-evidence-closeout-coverage-ledger",
                continuityHandoffId: "replay-pack-continuity-handoff-return",
                routeDetail:
                  "Restore the closeout-owned route before the decision handback so the reviewer starts from the same sealed-evidence baseline.",
                checksDetail:
                  "Lock the acceptance checks before the reviewer compares sealing posture, the decision return, and the downstream publish context.",
                captureDetail:
                  "Compare the closeout baseline beside the decision handback frame so sealed evidence stays visible through the capture pass.",
                evidenceDetail:
                  "Read the pending closeout-return coverage ledger after the captures so the proof dossier closes the handback in the same order.",
                continuityDetail:
                  "Confirm the closeout return keeps sealed evidence and downstream publish context attached while the route hands back into the decision baton."
              }),
              reviewerSignoff: {
                label: "Decision return signoff",
                owner: "Evidence closeout reviewer / decision baton owner",
                summary:
                  "Sealed evidence and downstream publish context still read together, but signoff cannot close until the return frame proves that carry-over explicitly.",
                verdict: "Decision return signoff blocked",
                nextHandoff: "Capture the decision handback frame with sealed evidence and downstream publish context still visible.",
                state: "blocked",
                blockers: [
                  "Decision return frame is still required.",
                  "Closeout return comparison ledger remains pending."
                ],
                checkpoints: [
                  {
                    id: "replay-signoff-closeout-route",
                    label: "Keep sealed evidence current before the handback",
                    owner: "Evidence closeout reviewer",
                    detail: "The replay still opens on the sealed closeout baseline with the same evidence posture intact.",
                    state: "ready"
                  },
                  {
                    id: "replay-signoff-closeout-return",
                    label: "Prove the decision handback with a return frame",
                    owner: "Acceptance capture reviewer",
                    detail: "The required decision return frame is missing, so the reviewer cannot sign off the handback.",
                    state: "blocked"
                  },
                  {
                    id: "replay-signoff-closeout-downstream",
                    label: "Hold downstream publish context through the return",
                    owner: "Decision baton owner",
                    detail: "Downstream context is staged, but the pending ledger still keeps signoff review open.",
                    state: "watch"
                  }
                ]
              },
              acceptanceChecks: [
                {
                  id: "replay-check-closeout-current",
                  label: "Closeout replay keeps sealing posture current",
                  detail: "Evidence closeout should remain current when the replay is restored before the baton handback occurs.",
                  state: "ready"
                },
                {
                  id: "replay-check-closeout-return",
                  label: "Decision handback remains explicit",
                  detail: "The replayed route should still show decision handoff as the primary return surface.",
                  state: "ready"
                },
                {
                  id: "replay-check-closeout-window",
                  label: "Review evidence posture stays attached",
                  detail: "The same lane, board, and observability context should remain visible while closeout hands back into the baton owner.",
                  state: "watch"
                }
              ],
              scenarioEvidenceItems: [
                {
                  id: "replay-evidence-closeout-snapshot",
                  label: "Closeout route snapshot",
                  artifact: "Sealed evidence snapshot / closeout baseline",
                  kind: "route-snapshot",
                  posture: "linked",
                  owner: "Evidence closeout reviewer",
                  dossierSection: "Route baseline",
                  detail: "Link the closeout summary and sealed evidence posture to the replay snapshot so the return path starts from the same baseline."
                },
                {
                  id: "replay-evidence-closeout-return-notes",
                  label: "Decision return notes",
                  artifact: "Handback notes / closeout-to-decision return",
                  kind: "reviewer-notes",
                  posture: "staged",
                  owner: "Decision baton owner",
                  dossierSection: "Reviewer baton",
                  detail: "Stage notes that explain how the closeout-owned route returns control to the decision baton without losing downstream publish context."
                },
                {
                  id: "replay-evidence-closeout-coverage-ledger",
                  label: "Decision return comparison ledger",
                  artifact: "Acceptance ledger / closeout return comparison",
                  kind: "comparison-ledger",
                  posture: "pending",
                  owner: "Acceptance capture reviewer",
                  dossierSection: "Comparison ledger",
                  detail: "Hold the comparison ledger until the decision return frame confirms sealed evidence and downstream context stay visible together."
                }
              ],
              evidenceContinuityChecks: [
                {
                  id: "replay-continuity-closeout-snapshot",
                  label: "Sealed evidence stays attached to the replay route",
                  handoff: "Sealed evidence -> route snapshot",
                  detail: "The same sealed evidence posture should remain visible when the closeout-owned route is restored for review.",
                  state: "ready"
                },
                {
                  id: "replay-continuity-closeout-return",
                  label: "Decision return stays tied to closeout notes",
                  handoff: "Handback notes -> decision return",
                  detail: "The baton return should preserve the staged closeout notes so the replay surface remains continuous for signoff review.",
                  state: "ready"
                },
                {
                  id: "replay-continuity-closeout-capture",
                  label: "Coverage ledger waits on decision return frame",
                  handoff: "Coverage ledger -> screenshot target board",
                  detail: "Continuity remains in review until the decision return frame proves downstream publish context stays attached to closeout evidence.",
                  state: "watch"
                }
              ],
              screenshotReviewItems: [
                {
                  id: "replay-shot-closeout-current",
                  label: "Closeout current-state frame",
                  surface: "Evidence closeout / sealed evidence",
                  posture: "linked",
                  storyboardRole: "baseline",
                  shotIndex: 1,
                  viewport: "Desktop workspace / sealed closeout",
                  focus: "Closeout summary, sealed evidence posture, replay badges",
                  framing: "Keep the sealed evidence summary and route posture in one frame so the baseline feels reviewer-ready.",
                  detail: "Link the closeout summary and replay evidence posture as the baseline product-review frame.",
                  captureGroupId: "replay-capture-group-closeout-decision",
                  captureGroup: "Closeout decision comparison",
                  comparisonFrame: "Evidence closeout baseline -> decision handback",
                  linkedEvidenceItemIds: [
                    "replay-evidence-closeout-snapshot",
                    "replay-evidence-closeout-return-notes"
                  ]
                },
                {
                  id: "replay-shot-closeout-return",
                  label: "Decision return frame",
                  surface: "Decision handoff / downstream publish context",
                  posture: "required",
                  storyboardRole: "return",
                  shotIndex: 2,
                  viewport: "Desktop workspace / decision handback",
                  focus: "Decision return, sealed evidence carry-over, downstream publish context",
                  framing: "Frame the decision handback with sealed evidence and downstream publish context still visible in the same pass.",
                  detail: "Capture the closeout route handing back into decision handoff while the same downstream context stays visible.",
                  captureGroupId: "replay-capture-group-closeout-decision",
                  captureGroup: "Closeout decision comparison",
                  comparisonFrame: "Evidence closeout baseline -> decision handback",
                  linkedEvidenceItemIds: [
                    "replay-evidence-closeout-return-notes",
                    "replay-evidence-closeout-coverage-ledger"
                  ]
                }
              ]
            }
          ]
        }
      ],
      match: {
        routeIds: ["settings", "agents", "codex"]
      }
    }
  ],
  history: {
    title: "Recent Command History",
    summary: "Recent local-only commands stay visible so route changes, remembered companion handoffs, flow advances, slot focus, and staged window intents remain auditable inside the shell.",
    retention: 8,
    emptyState: "No local command history yet."
  },
  keyboardRouting: {
    title: "Keyboard Routing",
    summary:
      "Phase60 keeps keyboard routing local-only: palette open/close, contextual flow advance, direct sequence launch, route shortcuts, and slot/trace hotkeys all stay inside the shell UI while cross-view coordination and review-posture ownership remain reviewable.",
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
        label: "Run review coverage sequence",
        combo: "Alt+0",
        key: "0",
        scope: "route",
        target: "sequence",
        sequenceId: "sequence-review-coverage-flow",
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
    "Right rail visibility, bottom dock visibility, compact mode, selected tabs, and the current workspace view continue to persist in localStorage while phase60 layers deeper cross-view coordination, review-posture ownership, and release-review boards on top of the same local-only shell posture.",
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

function createStudioWindowReviewPostureLink(
  stageId: string,
  stageLabel: string,
  reviewerQueueId: string,
  acknowledgementState: StudioReleaseAcknowledgementState,
  decisionHandoffId: string,
  evidenceCloseoutId: string,
  escalationWindowId: string,
  closeoutWindowId: string,
  summary: string
): StudioWindowReviewPostureLink {
  return {
    stageId,
    stageLabel,
    deliveryChainStageId: mapReleasePipelineStageToDeliveryChainStageId(stageId),
    deliveryPhase: mapReleasePipelineStageToDeliveryPhase(stageId),
    reviewerQueueId,
    acknowledgementState,
    decisionHandoffId,
    evidenceCloseoutId,
    escalationWindowId,
    closeoutWindowId,
    summary
  };
}

function formatReviewSurfaceKind(kind: NonNullable<StudioCommandSurface["actions"][number]["reviewSurfaceKind"]>): string {
  switch (kind) {
    case "review-packet":
      return "Review packet";
    case "reviewer-queue":
      return "Reviewer queue";
    case "decision-handoff":
      return "Decision handoff";
    case "evidence-closeout":
      return "Evidence closeout";
    case "decision-gate":
      return "Decision gate";
    default:
      return "Closeout window";
  }
}

function resolveReviewerQueueTone(
  status: StudioReleaseApprovalPipeline["reviewerQueues"][number]["status"]
): "positive" | "neutral" | "warning" {
  switch (status) {
    case "closed":
      return "positive";
    case "active":
    case "handoff-ready":
      return "neutral";
    default:
      return "warning";
  }
}

function resolveEscalationWindowTone(
  state: StudioReleaseApprovalPipeline["escalationWindows"][number]["state"]
): "positive" | "neutral" | "warning" {
  switch (state) {
    case "watch":
      return "positive";
    case "open":
      return "neutral";
    default:
      return "warning";
  }
}

function resolveCloseoutWindowTone(
  state: StudioReleaseApprovalPipeline["closeoutWindows"][number]["state"]
): "positive" | "neutral" | "warning" {
  switch (state) {
    case "ready-to-seal":
      return "positive";
    case "scheduled":
    case "open":
      return "neutral";
    default:
      return "warning";
  }
}

function dedupeValues<T>(values: Array<T | null | undefined>): T[] {
  return [...new Set(values.filter((value): value is T => value !== null && value !== undefined))];
}

function isReviewCoverageAction(
  action: StudioCommandSurface["actions"][number]
): action is StudioCommandSurface["actions"][number] &
  Required<
    Pick<
      StudioCommandSurface["actions"][number],
      "reviewSurfaceKind" | "deliveryChainStageId" | "windowId" | "sharedStateLaneId" | "orchestrationBoardId" | "observabilityMappingId"
    >
  > {
  return Boolean(
    action.kind === "focus-review-coverage" &&
      action.reviewSurfaceKind &&
      action.deliveryChainStageId &&
      action.windowId &&
      action.sharedStateLaneId &&
      action.orchestrationBoardId &&
      action.observabilityMappingId
  );
}

function createStudioReviewStateContinuity(
  commandSurface: StudioCommandSurface,
  windowing: StudioWindowing,
  releaseApprovalPipeline: StudioReleaseApprovalPipeline
): StudioReviewStateContinuity {
  const actionById = new Map(commandSurface.actions.map((action) => [action.id, action]));
  const actionDeckLanes = commandSurface.actionDecks.flatMap((deck) => deck.lanes);
  const reviewSurfaceActions = commandSurface.actions.filter(isReviewCoverageAction);
  const entries: StudioReviewStateContinuity["entries"] = reviewSurfaceActions.map((action) => {
    const deliveryStage = releaseApprovalPipeline.deliveryChain.stages.find((stage) => stage.id === action.deliveryChainStageId);
    const reviewerQueue = releaseApprovalPipeline.reviewerQueues.find((queue) => queue.id === deliveryStage?.reviewerQueueId);
    const escalationWindow = releaseApprovalPipeline.escalationWindows.find((window) => window.id === deliveryStage?.escalationWindowId);
    const closeoutWindow = releaseApprovalPipeline.closeoutWindows.find((window) => window.id === deliveryStage?.closeoutWindowId);
    const windowEntry = windowing.roster.windows.find((entry) => entry.id === action.windowId);
    const laneEntry = windowing.sharedState.lanes.find((entry) => entry.id === action.sharedStateLaneId);
    const boardEntry = windowing.orchestration.boards.find((entry) => entry.id === action.orchestrationBoardId);
    const mappingEntry = windowing.observability.mappings.find((entry) => entry.id === action.observabilityMappingId);

    if (!deliveryStage || !reviewerQueue || !escalationWindow || !closeoutWindow || !windowEntry || !laneEntry || !boardEntry || !mappingEntry) {
      throw new Error(`Review state continuity requires complete delivery/window linkage for ${action.id}.`);
    }

    const relevantLanes = actionDeckLanes.filter((lane) => lane.actionIds.includes(action.id));
    const mappedReviewSurfaceActionIds = dedupeValues(
      relevantLanes.flatMap((lane) =>
        lane.actionIds.flatMap((actionId) => {
          const linkedAction = actionById.get(actionId);
          return linkedAction?.reviewSurfaceKind ? [actionId] : [];
        })
      )
    );
    const mappedWindowIds = dedupeValues([
      action.windowId,
      ...relevantLanes.flatMap((lane) => lane.windowIds ?? []),
      ...mappedReviewSurfaceActionIds.map((actionId) => actionById.get(actionId)?.windowId)
    ]);
    const mappedSharedStateLaneIds = dedupeValues([
      action.sharedStateLaneId,
      ...relevantLanes.flatMap((lane) => lane.sharedStateLaneIds ?? []),
      ...mappedReviewSurfaceActionIds.map((actionId) => actionById.get(actionId)?.sharedStateLaneId)
    ]);
    const mappedBoardIds = dedupeValues([
      action.orchestrationBoardId,
      ...relevantLanes.flatMap((lane) => lane.orchestrationBoardIds ?? []),
      ...mappedReviewSurfaceActionIds.map((actionId) => actionById.get(actionId)?.orchestrationBoardId)
    ]);
    const mappedObservabilityMappingIds = dedupeValues([
      action.observabilityMappingId,
      ...relevantLanes.flatMap((lane) => lane.observabilityMappingIds ?? []),
      ...mappedReviewSurfaceActionIds.map((actionId) => actionById.get(actionId)?.observabilityMappingId)
    ]);
    const mappedReviewSurfaceLabels = mappedReviewSurfaceActionIds.map((actionId) => actionById.get(actionId)?.label ?? actionId);
    const primaryLane = relevantLanes.find((lane) => lane.primaryActionId === action.id) ?? relevantLanes[0] ?? null;

    const readouts: StudioReviewStateContinuity["entries"][number]["readouts"] = [
      {
        id: "review-surface",
        label: "Active review surface",
        value: `${action.label} / ${formatReviewSurfaceKind(action.reviewSurfaceKind)}`,
        detail: action.description,
        tone: action.tone
      },
      {
        id: "continuity-spine",
        label: "Window / lane / board spine",
        value: `${windowEntry.label} -> ${laneEntry.label} -> ${boardEntry.label}`,
        detail: mappingEntry.summary,
        tone: mappingEntry.tone
      },
      {
        id: "reviewer-queue",
        label: "Reviewer queue",
        value: `${reviewerQueue.label} / ${reviewerQueue.status} / ${reviewerQueue.acknowledgementState}`,
        detail:
          reviewerQueue.entries.find((entry) => entry.id === reviewerQueue.activeEntryId)?.summary ??
          reviewerQueue.summary,
        tone: resolveReviewerQueueTone(reviewerQueue.status)
      },
      {
        id: "closeout-timing",
        label: "Closeout timing",
        value: `${escalationWindow.label} / ${escalationWindow.state} -> ${closeoutWindow.label} / ${closeoutWindow.state}`,
        detail: `${escalationWindow.deadlineLabel} -> ${closeoutWindow.deadlineLabel}`,
        tone:
          resolveCloseoutWindowTone(closeoutWindow.state) === "warning" || resolveEscalationWindowTone(escalationWindow.state) === "warning"
            ? "warning"
            : resolveCloseoutWindowTone(closeoutWindow.state) === "neutral" || resolveEscalationWindowTone(escalationWindow.state) === "neutral"
              ? "neutral"
              : "positive"
      },
      {
        id: "mapped-review-path",
        label: "Mapped review path",
        value: mappedReviewSurfaceLabels.join(" / ") || action.label,
        detail:
          primaryLane?.summary ??
          `${mappedWindowIds.length} windows and ${mappedObservabilityMappingIds.length} observability rows remain tied to the same review surface.`,
        tone: primaryLane?.tone ?? mappingEntry.tone
      }
    ];

    return {
      id: `review-state-continuity-${action.id.replace(/^command-/, "")}`,
      label: `${action.label} / ${formatReviewSurfaceKind(action.reviewSurfaceKind)}`,
      tone: action.tone,
      summary: `${action.label} now keeps ${windowEntry.label}, ${laneEntry.label}, ${boardEntry.label}, ${reviewerQueue.label}, and ${closeoutWindow.label} inside one explicit local-only review continuity contract instead of leaving those surfaces to be reassembled from separate cards.`,
      deliveryChainStageId: action.deliveryChainStageId,
      surface: {
        actionId: action.id,
        kind: action.reviewSurfaceKind,
        routeId: mappingEntry.routeId,
        workspaceViewId: mappingEntry.workspaceViewId,
        deliveryChainStageId: action.deliveryChainStageId,
        summary: action.description,
        windowIntentId: action.windowIntentId
      },
      spine: {
        routeId: mappingEntry.routeId,
        workspaceViewId: mappingEntry.workspaceViewId,
        windowId: action.windowId,
        sharedStateLaneId: action.sharedStateLaneId,
        orchestrationBoardId: action.orchestrationBoardId,
        observabilityMappingId: action.observabilityMappingId,
        summary: mappingEntry.summary
      },
      reviewerQueue: {
        id: reviewerQueue.id,
        status: reviewerQueue.status,
        owner: reviewerQueue.owner,
        acknowledgementState: reviewerQueue.acknowledgementState,
        activeEntryId: reviewerQueue.activeEntryId,
        summary: reviewerQueue.summary
      },
      closeoutTiming: {
        escalationWindowId: escalationWindow.id,
        escalationState: escalationWindow.state,
        escalationDeadlineLabel: escalationWindow.deadlineLabel,
        closeoutWindowId: closeoutWindow.id,
        closeoutState: closeoutWindow.state,
        closeoutDeadlineLabel: closeoutWindow.deadlineLabel,
        summary: `${escalationWindow.summary} ${closeoutWindow.summary}`
      },
      mappedReviewPath: {
        actionDeckLaneIds: dedupeValues(relevantLanes.map((lane) => lane.id)),
        reviewSurfaceActionIds: mappedReviewSurfaceActionIds.length ? mappedReviewSurfaceActionIds : [action.id],
        windowIds: mappedWindowIds,
        sharedStateLaneIds: mappedSharedStateLaneIds,
        orchestrationBoardIds: mappedBoardIds,
        observabilityMappingIds: mappedObservabilityMappingIds,
        summary:
          primaryLane?.summary ??
          `${mappingEntry.label} keeps ${mappedReviewSurfaceLabels.length} linked review surfaces visible through the same shared-state path.`
      },
      readouts
    };
  });
  const activeEntry =
    entries.find((entry) => entry.surface.actionId === "command-focus-approval-reviewer-queue") ??
    entries.find((entry) => entry.spine.observabilityMappingId === windowing.observability.activeMappingId) ??
    entries[0];

  if (!activeEntry) {
    throw new Error("Review state continuity requires at least one typed review coverage entry.");
  }

  return {
    title: "Review State Continuity Contract",
    summary:
      "Active review surface, window / lane / board spine, reviewer queue, closeout timing, and mapped review path now resolve through one explicit shared-state continuity contract so Inspector, Windows, and delivery readouts can stay synchronized.",
    activeEntryId: activeEntry.id,
    entries
  };
}

function createStudioWindowObservability(windowing: StudioWindowing): StudioWindowObservability {
  const boundaryLane = windowing.sharedState.lanes.find((lane) => lane.id === "shared-state-lane-boundary-review");
  const traceLane = windowing.sharedState.lanes.find((lane) => lane.id === "shared-state-lane-trace-review");
  const previewLane = windowing.sharedState.lanes.find((lane) => lane.id === "shared-state-lane-preview-review");
  const boundaryBoard = windowing.orchestration.boards.find((board) => board.id === "orchestration-board-boundary-review");
  const traceBoard = windowing.orchestration.boards.find((board) => board.id === "orchestration-board-trace-review");
  const previewBoard = windowing.orchestration.boards.find((board) => board.id === "orchestration-board-preview-review");
  const boundaryWindow = windowing.roster.windows.find((entry) => entry.id === boundaryLane?.windowId);
  const traceWindow = windowing.roster.windows.find((entry) => entry.id === traceLane?.windowId);
  const previewWindow = windowing.roster.windows.find((entry) => entry.id === previewLane?.windowId);

  if (!boundaryLane || !traceLane || !previewLane || !boundaryBoard || !traceBoard || !previewBoard || !boundaryWindow || !traceWindow || !previewWindow) {
    throw new Error("Cross-window observability requires boundary, trace, and preview lane/window/board wiring.");
  }

  const rollbackShadowReviewPosture = createStudioWindowReviewPostureLink(
    "release-pipeline-rollback-settlement",
    "Rollback settlement closeout",
    "reviewer-queue-rollback-settlement",
    "overdue",
    "decision-handoff-rollback-settlement",
    "evidence-closeout-rollback-settlement",
    "escalation-window-rollback-settlement",
    "closeout-window-rollback-settlement",
    "The active trace lane also carries the rollback settlement shadow posture, so overdue acknowledgement and ready-to-seal closeout remain visible beside the active approval board."
  );
  const finalDecisionReviewPosture = createStudioWindowReviewPostureLink(
    "release-pipeline-release-decision",
    "Final release decision board",
    "reviewer-queue-final-release-decision",
    "blocked",
    "decision-handoff-final-release-decision",
    "evidence-closeout-final-release-decision",
    "escalation-window-final-release-decision",
    "closeout-window-final-release-decision",
    "The main shell keeps the blocked final release decision gate visible so publish/signing blockers remain explicit even while other windows own the active review posture."
  );
  const mappings: StudioWindowObservabilityMapping[] = [
    {
      id: "observability-mapping-approval-active",
      label: "Active approval posture",
      relationship: "owns-current-posture",
      summary:
        "Trace Review Window, Trace Review Lane, and Trace Review Orchestration currently own the live review posture, so the active reviewer queue, acknowledgement state, escalation window, closeout window, and focused slot all resolve through one explicit cross-window map.",
      owner: "release-manager",
      routeId: traceLane.routeId,
      workspaceViewId: traceLane.workspaceViewId,
      windowId: traceWindow.id,
      sharedStateLaneId: traceLane.id,
      orchestrationBoardId: traceBoard.id,
      focusedSlotId: traceLane.focusedSlotId,
      reviewPosture: traceBoard.reviewPosture,
      tone: "warning",
      windowIntentId: traceLane.windowIntentId,
      detachedPanelId: traceLane.detachedPanelId
    },
    {
      id: "observability-mapping-boundary-intake",
      label: "Boundary intake handoff",
      relationship: "staged-for-handoff",
      summary:
        "Main Shell Window and the detached inspector candidate still mirror the attestation intake handoff, so upstream review posture remains visible while the active board sits elsewhere.",
      owner: "release-engineering",
      routeId: boundaryLane.routeId,
      workspaceViewId: boundaryLane.workspaceViewId,
      windowId: boundaryWindow.id,
      sharedStateLaneId: boundaryLane.id,
      orchestrationBoardId: boundaryBoard.id,
      focusedSlotId: boundaryLane.focusedSlotId,
      reviewPosture: boundaryBoard.reviewPosture,
      tone: "neutral",
      windowIntentId: boundaryLane.windowIntentId,
      detachedPanelId: boundaryLane.detachedPanelId
    },
    {
      id: "observability-mapping-lifecycle-preview",
      label: "Preview lifecycle blocker",
      relationship: "blocked-upstream",
      summary:
        "Review Deck Window, Preview Review Lane, and Preview Review Orchestration show the downstream lifecycle board that is still blocked behind the active approval posture.",
      owner: "product-owner",
      routeId: previewLane.routeId,
      workspaceViewId: previewLane.workspaceViewId,
      windowId: previewWindow.id,
      sharedStateLaneId: previewLane.id,
      orchestrationBoardId: previewBoard.id,
      focusedSlotId: previewLane.focusedSlotId,
      reviewPosture: previewBoard.reviewPosture,
      tone: "warning",
      windowIntentId: previewLane.windowIntentId,
      detachedPanelId: previewLane.detachedPanelId
    },
    {
      id: "observability-mapping-rollback-shadow",
      label: "Rollback settlement shadow",
      relationship: "escalation-shadow",
      summary:
        "The active trace lane also casts the rollback settlement shadow, making overdue acknowledgement, escalated timing, and ready-to-seal closeout visible without changing windows or opening execution.",
      owner: "runtime-owner",
      routeId: traceLane.routeId,
      workspaceViewId: traceLane.workspaceViewId,
      windowId: traceWindow.id,
      sharedStateLaneId: traceLane.id,
      orchestrationBoardId: traceBoard.id,
      focusedSlotId: traceLane.focusedSlotId,
      reviewPosture: rollbackShadowReviewPosture,
      tone: "warning",
      windowIntentId: traceLane.windowIntentId,
      detachedPanelId: traceLane.detachedPanelId
    },
    {
      id: "observability-mapping-final-gate",
      label: "Blocked final decision gate",
      relationship: "blocked-decision-gate",
      summary:
        "Main Shell Window keeps the final release decision gate visible as a blocked downstream map, so the shell shows where the current review posture would land next even though publish and signing remain metadata-only.",
      owner: "release-manager",
      routeId: boundaryLane.routeId,
      workspaceViewId: boundaryLane.workspaceViewId,
      windowId: boundaryWindow.id,
      sharedStateLaneId: boundaryLane.id,
      orchestrationBoardId: boundaryBoard.id,
      focusedSlotId: boundaryLane.focusedSlotId,
      reviewPosture: finalDecisionReviewPosture,
      tone: "warning",
      windowIntentId: boundaryLane.windowIntentId,
      detachedPanelId: boundaryLane.detachedPanelId
    }
  ];
  const activeMapping = mappings[0];

  if (!activeMapping) {
    throw new Error("Cross-window observability requires at least one mapping.");
  }

  return {
    title: "Cross-window Observability Map",
    summary:
      "Route, window, shared-state lane, orchestration board, reviewer queue, acknowledgement state, escalation window, closeout window, and focused-slot ownership now resolve through one explicit observability map so every window can be related back to the current review posture.",
    activeMappingId: activeMapping.id,
    signals: [
      {
        id: "observability-signal-owner",
        label: "Review posture owner",
        value: `${activeMapping.owner} / ${activeMapping.reviewPosture.stageLabel}`,
        detail: "The active route, window, lane, and board all point at the same live review posture owner instead of forcing the shell to infer ownership from scattered cards.",
        tone: "warning"
      },
      {
        id: "observability-signal-route-window",
        label: "Active route -> window",
        value: `${activeMapping.routeId} -> ${traceWindow.label}`,
        detail: "The current review posture is rooted in the Skills route but explicitly owned by Trace Review Window.",
        tone: "positive"
      },
      {
        id: "observability-signal-lane-board",
        label: "Shared lane -> board",
        value: `${traceLane.label} -> ${traceBoard.label}`,
        detail: "Shared-state ownership and orchestration ownership are now declared side by side so board drift is easier to spot.",
        tone: "positive"
      },
      {
        id: "observability-signal-queue",
        label: "Reviewer queue / acknowledgement",
        value: `${activeMapping.reviewPosture.reviewerQueueId} / ${activeMapping.reviewPosture.acknowledgementState}`,
        detail: "The active queue and acknowledgement state are attached directly to the same map row as the owning window and board.",
        tone: "warning"
      },
      {
        id: "observability-signal-escalation-closeout",
        label: "Escalation / closeout",
        value: `${activeMapping.reviewPosture.escalationWindowId} / ${activeMapping.reviewPosture.closeoutWindowId}`,
        detail: "Escalation and closeout windows now stay visible as first-class posture links instead of hiding inside review notes.",
        tone: "warning"
      },
      {
        id: "observability-signal-mapped-windows",
        label: "Mapped windows",
        value: `${mappings.length} posture paths`,
        detail: "Boundary intake, active approval, blocked lifecycle, rollback settlement shadow, and the final decision gate all stay visible as one cross-window map.",
        tone: "neutral"
      }
    ],
    mappings
  };
}

const mockWindowing: StudioWindowing = {
  title: "Multi-window Coordination",
  summary:
    "Phase60 turns the earlier detached-workspace foundation into a deeper cross-window observability surface: a local-only window roster, shared-state lanes, sync health, ownership, last handoff, route/workspace intent links, focused-slot posture, reviewer queues, acknowledgement state, escalation windows, closeout windows, operator review-loop linkage, and explicit review-posture ownership maps now read like one coordination board while staying inside the same safe shell.",
  readiness: "contract-ready",
  posture: {
    mode: "intent-focused",
    label: "Intent Focused",
    summary: "Trace Workspace Intent is focused locally, so the shell now reads like a workflow-driven multi-window workbench while remaining inside one safe process/window.",
    activeWorkspaceViewId: "trace-deck",
    focusedIntentId: "window-intent-trace-workspace",
    activeDetachedPanelId: "detached-trace"
  },
  roster: {
    title: "Window Roster",
    summary:
      "Each review surface now exposes explicit ownership, sync health, last handoff, route/workspace intent linkage, and local-only blockers without creating any new native window.",
    activeWindowId: "window-trace-review",
    windows: [
      {
        id: "window-shell-main",
        label: "Main Shell Window",
        kind: "main-shell",
        summary: "Primary BrowserWindow keeps navigation, command flow, and boundary review anchored while detached candidates stay local placeholders.",
        role: "Navigation anchor / operator shell",
        routeId: "dashboard",
        workspaceViewId: "operator-shell",
        workflowLaneId: "lane-boundary-review",
        ownership: {
          owner: "shell-operator",
          mode: "owned",
          posture: "anchor control",
          summary: "Navigation, quick actions, and approval review remain anchored in the main shell."
        },
        sync: {
          health: "drift-watch",
          summary: "The main shell is synchronized on route and focused slot, but the detached inspector candidate is still staged rather than natively detached.",
          updatedAt: "Now"
        },
        lastHandoff: {
          label: "Boundary review baton",
          fromWindowId: "window-shell-main",
          toWindowId: "window-inspector-candidate",
          summary: "Dashboard route, lane-apply focus, and inspector posture were handed off into the detached inspector candidate as a local-only review baton.",
          timestamp: "Now",
          linkedIntentId: "window-intent-inspector-detach",
          linkedSlotId: "slot-lane-apply"
        },
        routeLinks: [
          {
            id: "route-link-shell-dashboard",
            routeId: "dashboard",
            workspaceViewId: "operator-shell",
            windowIntentId: "window-intent-inspector-detach",
            detachedPanelId: "detached-inspector",
            summary: "Dashboard anchors Operator Shell while staging the detached inspector candidate."
          }
        ],
        reviewPosture: createStudioWindowReviewPostureLink(
          "release-pipeline-attestation-intake",
          "Attestation intake board",
          "reviewer-queue-attestation-intake",
          "acknowledged",
          "decision-handoff-attestation-intake",
          "evidence-closeout-attestation-intake",
          "escalation-window-attestation-intake",
          "closeout-window-attestation-intake",
          "Main Shell Window anchors the boundary intake posture and keeps the acknowledged intake queue visible before the active review board takes ownership."
        ),
        blockers: [
          {
            id: "window-shell-blocker-native-detach",
            label: "Native detach remains withheld",
            detail: "Detached Inspector stays inside the same BrowserWindow; no host-side detached window control is enabled.",
            tone: "warning"
          },
          {
            id: "window-shell-blocker-host-execution",
            label: "Host execution remains withheld",
            detail: "Cross-window handoff can update shell review state only; no host-side apply or connector control is allowed.",
            tone: "warning"
          }
        ],
        detachedPanelId: "detached-inspector",
        windowIntentId: "window-intent-inspector-detach",
        focusedSlotId: "slot-lane-apply"
      },
      {
        id: "window-inspector-candidate",
        label: "Detached Inspector Candidate",
        kind: "detached-candidate",
        summary: "Inspector review is expressed as a dedicated local candidate with explicit handoff metadata, even though it still renders inside the same shell.",
        role: "Boundary review handoff surface",
        routeId: "dashboard",
        workspaceViewId: "operator-shell",
        workflowLaneId: "lane-boundary-review",
        ownership: {
          owner: "boundary-review-lane",
          mode: "handoff",
          posture: "review-ready",
          summary: "The inspector candidate is owned by the boundary review lane and waits for a future native detach path."
        },
        sync: {
          health: "drift-watch",
          summary: "Inspector tabs, lane-apply focus, and review posture are linked, but the candidate still depends on shell-side routing instead of a native window.",
          updatedAt: "Now"
        },
        lastHandoff: {
          label: "Inspector candidate staged",
          fromWindowId: "window-shell-main",
          toWindowId: "window-inspector-candidate",
          summary: "The main shell handed dashboard policy review into the detached inspector candidate without leaving local-only posture.",
          timestamp: "Now",
          linkedIntentId: "window-intent-inspector-detach",
          linkedSlotId: "slot-lane-apply"
        },
        routeLinks: [
          {
            id: "route-link-inspector-dashboard",
            routeId: "dashboard",
            workspaceViewId: "operator-shell",
            windowIntentId: "window-intent-inspector-detach",
            detachedPanelId: "detached-inspector",
            summary: "Dashboard and the detached inspector candidate share the same boundary review route linkage."
          }
        ],
        reviewPosture: createStudioWindowReviewPostureLink(
          "release-pipeline-attestation-intake",
          "Attestation intake board",
          "reviewer-queue-attestation-intake",
          "acknowledged",
          "decision-handoff-attestation-intake",
          "evidence-closeout-attestation-intake",
          "escalation-window-attestation-intake",
          "closeout-window-attestation-intake",
          "Detached Inspector Candidate mirrors the same intake handoff posture as the main shell so the upstream queue can be audited from either surface."
        ),
        blockers: [
          {
            id: "window-inspector-blocker-native-window",
            label: "No native detached inspector",
            detail: "The review surface is still a safe placeholder routed through the main shell instead of a real detached window.",
            tone: "warning"
          }
        ],
        detachedPanelId: "detached-inspector",
        windowIntentId: "window-intent-inspector-detach",
        focusedSlotId: "slot-lane-apply"
      },
      {
        id: "window-trace-review",
        label: "Trace Review Window",
        kind: "workspace",
        summary: "Trace Deck acts like a dedicated review window: slot focus, rollback posture, window linkage, and release review signals stay synchronized.",
        role: "Trace-first review surface",
        routeId: "skills",
        workspaceViewId: "trace-deck",
        workflowLaneId: "lane-trace-review",
        ownership: {
          owner: "trace-review-lane",
          mode: "shared-review",
          posture: "trace lock",
          summary: "Trace Deck and Detached Trace share ownership of the current review posture."
        },
        sync: {
          health: "synced",
          summary: "Route, workspace focus, detached trace, intent focus, and lane-apply slot are synchronized inside the shell.",
          updatedAt: "Now"
        },
        lastHandoff: {
          label: "Trace review locked",
          fromWindowId: "window-shell-main",
          toWindowId: "window-trace-review",
          summary: "The shell handed slot focus and trace posture into Trace Deck, then kept Detached Trace linked as the local review satellite.",
          timestamp: "Now",
          linkedIntentId: "window-intent-trace-workspace",
          linkedSlotId: "slot-lane-apply"
        },
        routeLinks: [
          {
            id: "route-link-trace-skills",
            routeId: "skills",
            workspaceViewId: "trace-deck",
            windowIntentId: "window-intent-trace-workspace",
            detachedPanelId: "detached-trace",
            summary: "Skills, Trace Deck, Detached Trace, and the trace workspace intent are locked together."
          }
        ],
        reviewPosture: createStudioWindowReviewPostureLink(
          "release-pipeline-approval-orchestration",
          "Approval orchestration board",
          "reviewer-queue-approval-orchestration",
          "pending",
          "decision-handoff-approval-orchestration",
          "evidence-closeout-approval-orchestration",
          "escalation-window-approval-orchestration",
          "closeout-window-approval-orchestration",
          "Trace Review Window currently owns the live approval posture, so the active reviewer queue, acknowledgement timing, escalation window, and closeout window all resolve through this window."
        ),
        blockers: [
          {
            id: "window-trace-blocker-native-window",
            label: "Trace review stays shell-local",
            detail: "The trace surface can coordinate multiple review panes, but it still cannot spawn or control a native detached window.",
            tone: "neutral"
          }
        ],
        detachedPanelId: "detached-trace",
        windowIntentId: "window-intent-trace-workspace",
        focusedSlotId: "slot-lane-apply"
      },
      {
        id: "window-review-board",
        label: "Review Deck Window",
        kind: "workspace",
        summary: "Review Deck is now modeled as a separate coordination surface for policy, readiness, preview posture, and handoff blockers.",
        role: "Preview / readiness review surface",
        routeId: "settings",
        workspaceViewId: "review-deck",
        workflowLaneId: "lane-preview-review",
        ownership: {
          owner: "preview-review-lane",
          mode: "handoff",
          posture: "preview-ready",
          summary: "Review Deck owns the preview/readiness lane but is still waiting on a focused intent and a future native detach path."
        },
        sync: {
          health: "blocked",
          summary: "Review Deck keeps route and preview candidate linkage visible, but the review intent is not focused and the detached preview remains placeholder-only.",
          updatedAt: "2 min ago"
        },
        lastHandoff: {
          label: "Preview review staged",
          fromWindowId: "window-trace-review",
          toWindowId: "window-review-board",
          summary: "Preview/readiness review was staged from the trace lane into Review Deck so policy blockers stay visible before any future handoff.",
          timestamp: "2 min ago",
          linkedIntentId: "window-intent-review-workspace",
          linkedSlotId: "slot-connector-activate"
        },
        routeLinks: [
          {
            id: "route-link-review-settings",
            routeId: "settings",
            workspaceViewId: "review-deck",
            windowIntentId: "window-intent-review-workspace",
            detachedPanelId: "detached-preview",
            summary: "Settings, Review Deck, and the detached preview candidate stay linked for readiness review."
          }
        ],
        reviewPosture: createStudioWindowReviewPostureLink(
          "release-pipeline-lifecycle-enforcement",
          "Release decision lifecycle",
          "reviewer-queue-lifecycle-enforcement",
          "blocked",
          "decision-handoff-lifecycle-enforcement",
          "evidence-closeout-lifecycle-enforcement",
          "escalation-window-lifecycle-enforcement",
          "closeout-window-lifecycle-enforcement",
          "Review Deck Window exposes the downstream lifecycle board that is still blocked behind the active approval posture."
        ),
        blockers: [
          {
            id: "window-review-blocker-intent",
            label: "Review intent not focused",
            detail: "The review workspace intent remains ready-only, so sync stays blocked until the shell focuses it locally.",
            tone: "warning"
          },
          {
            id: "window-review-blocker-native-window",
            label: "Preview candidate is placeholder-only",
            detail: "Detached Preview remains a shell-routed placeholder instead of a native detached review window.",
            tone: "warning"
          }
        ],
        detachedPanelId: "detached-preview",
        windowIntentId: "window-intent-review-workspace",
        focusedSlotId: "slot-connector-activate"
      }
    ]
  },
  sharedState: {
    title: "Cross-window Shared State",
    summary:
      "Ownership, sync health, last handoff, route/workspace focus, intent linkage, focused slot, reviewer queues, acknowledgement state, escalation windows, closeout windows, review-posture ownership, and local-only blockers are now explicit as shared-state lanes instead of implied shell posture.",
    activeLaneId: "shared-state-lane-trace-review",
    lanes: [
      {
        id: "shared-state-lane-boundary-review",
        label: "Boundary Review Lane",
        summary: "Dashboard policy review, inspector staging, and lane-apply focus stay grouped as one review baton.",
        status: "handoff-ready",
        posture: "review",
        workflowLaneId: "lane-boundary-review",
        windowId: "window-shell-main",
        routeId: "dashboard",
        workspaceViewId: "operator-shell",
        windowIntentId: "window-intent-inspector-detach",
        focusedSlotId: "slot-lane-apply",
        ownership: {
          owner: "release-manager",
          mode: "handoff",
          posture: "policy review",
          summary: "Boundary review stays with the main shell until a future detached inspector can own the baton directly."
        },
        sync: {
          health: "drift-watch",
          summary: "Route, workspace, and focused slot are synchronized, but detached ownership is still simulated inside the same shell.",
          updatedAt: "Now"
        },
        lastHandoff: {
          label: "Boundary baton",
          fromWindowId: "window-shell-main",
          toWindowId: "window-inspector-candidate",
          summary: "Dashboard policy state and lane-apply rollback posture are staged into the detached inspector candidate.",
          timestamp: "Now",
          linkedIntentId: "window-intent-inspector-detach",
          linkedSlotId: "slot-lane-apply"
        },
        routeLinks: [
          {
            id: "shared-route-boundary-dashboard",
            routeId: "dashboard",
            workspaceViewId: "operator-shell",
            windowIntentId: "window-intent-inspector-detach",
            detachedPanelId: "detached-inspector",
            summary: "Dashboard -> Operator Shell -> Detached Inspector keeps the review baton anchored."
          }
        ],
        reviewPosture: createStudioWindowReviewPostureLink(
          "release-pipeline-attestation-intake",
          "Attestation intake board",
          "reviewer-queue-attestation-intake",
          "acknowledged",
          "decision-handoff-attestation-intake",
          "evidence-closeout-attestation-intake",
          "escalation-window-attestation-intake",
          "closeout-window-attestation-intake",
          "Boundary Review Lane still carries the acknowledged intake posture, so the upstream queue, watch window, and scheduled closeout remain visible before the active approval board takes over."
        ),
        stateFields: [
          {
            id: "shared-boundary-route",
            label: "Route focus",
            value: "Dashboard",
            detail: "Boundary review remains anchored to Dashboard for policy visibility and command linkage.",
            tone: "neutral"
          },
          {
            id: "shared-boundary-workspace",
            label: "Workspace focus",
            value: "Operator Shell",
            detail: "The shell remains anchored while Detached Inspector behaves as a staged review candidate.",
            tone: "positive"
          },
          {
            id: "shared-boundary-intent",
            label: "Intent posture",
            value: "Detach Inspector Intent / staged",
            detail: "The handoff is review-ready, but not natively detached.",
            tone: "warning"
          },
          {
            id: "shared-boundary-slot",
            label: "Focused slot",
            value: "Lane apply IPC slot",
            detail: "Rollback-aware slot focus stays linked to the same boundary review lane.",
            tone: "warning"
          },
          {
            id: "shared-boundary-queue",
            label: "Reviewer queue",
            value: "Intake reviewer queue / acknowledged",
            detail: "Boundary review now keeps the intake reviewer queue and acknowledgement state visible before the board picks it up.",
            tone: "positive"
          },
          {
            id: "shared-boundary-closeout-window",
            label: "Escalation / closeout windows",
            value: "watch / scheduled",
            detail: "Even the handoff-ready boundary lane declares timing windows instead of burying them in release metadata.",
            tone: "neutral"
          }
        ],
        blockers: [
          {
            id: "shared-boundary-blocker-native-window",
            label: "Detached inspector stays simulated",
            detail: "Boundary review can stage ownership and handoff, but it still cannot materialize a native detached inspector.",
            tone: "warning"
          }
        ],
        detachedPanelId: "detached-inspector"
      },
      {
        id: "shared-state-lane-trace-review",
        label: "Trace Review Lane",
        summary: "Trace Deck, Detached Trace, route linkage, release review, and lane-apply rollback posture are synchronized as one active shared lane.",
        status: "active",
        posture: "trace",
        workflowLaneId: "lane-trace-review",
        windowId: "window-trace-review",
        routeId: "skills",
        workspaceViewId: "trace-deck",
        windowIntentId: "window-intent-trace-workspace",
        focusedSlotId: "slot-lane-apply",
        ownership: {
          owner: "trace-operator",
          mode: "shared-review",
          posture: "trace lock",
          summary: "Trace Deck and Detached Trace currently share ownership of slot review and release evidence drill-down."
        },
        sync: {
          health: "synced",
          summary: "Current route, workspace, intent focus, detached trace, and lane-apply slot are all synchronized.",
          updatedAt: "Now"
        },
        lastHandoff: {
          label: "Trace lane sealed",
          fromWindowId: "window-shell-main",
          toWindowId: "window-trace-review",
          summary: "Focused slot, trace tab, and release pipeline drill-down were handed into Trace Deck and kept in sync with Detached Trace.",
          timestamp: "Now",
          linkedIntentId: "window-intent-trace-workspace",
          linkedSlotId: "slot-lane-apply"
        },
        routeLinks: [
          {
            id: "shared-route-trace-skills",
            routeId: "skills",
            workspaceViewId: "trace-deck",
            windowIntentId: "window-intent-trace-workspace",
            detachedPanelId: "detached-trace",
            summary: "Skills -> Trace Deck -> Detached Trace keeps slot review and window posture aligned."
          }
        ],
        reviewPosture: createStudioWindowReviewPostureLink(
          "release-pipeline-approval-orchestration",
          "Approval orchestration board",
          "reviewer-queue-approval-orchestration",
          "pending",
          "decision-handoff-approval-orchestration",
          "evidence-closeout-approval-orchestration",
          "escalation-window-approval-orchestration",
          "closeout-window-approval-orchestration",
          "Trace Review Lane owns the current approval posture, so queue ownership, pending acknowledgement, escalation timing, and closeout timing all resolve through this active shared-state lane."
        ),
        stateFields: [
          {
            id: "shared-trace-route",
            label: "Route focus",
            value: "Skills",
            detail: "The trace lane stays attached to Skills so preview, detail, and command surfaces share one route anchor.",
            tone: "positive"
          },
          {
            id: "shared-trace-workspace",
            label: "Workspace focus",
            value: "Trace Deck",
            detail: "Trace Deck is the active review workspace and keeps detached trace surfaced locally.",
            tone: "positive"
          },
          {
            id: "shared-trace-intent",
            label: "Intent posture",
            value: "Trace Workspace Intent / focused",
            detail: "The intent remains focused locally and drives the shell into intent-focused posture.",
            tone: "positive"
          },
          {
            id: "shared-trace-slot",
            label: "Focused slot",
            value: "Lane apply IPC slot",
            detail: "The highest-risk rollback-aware slot stays in scope for both trace and release review.",
            tone: "warning"
          },
          {
            id: "shared-trace-release",
            label: "Release linkage",
            value: "Approval orchestration board",
            detail: "Trace review cross-links directly into the review-only release approval pipeline.",
            tone: "neutral"
          },
          {
            id: "shared-trace-queue",
            label: "Reviewer queue",
            value: "Approval reviewer queue / pending",
            detail: "The active trace lane now exposes queue ownership and acknowledgement state alongside the current board.",
            tone: "warning"
          },
          {
            id: "shared-trace-windows",
            label: "Escalation / closeout windows",
            value: "open / open",
            detail: "Escalation and closeout windows stay tied to the same trace review lane as the active queue and baton.",
            tone: "warning"
          }
        ],
        blockers: [
          {
            id: "shared-trace-blocker-native-window",
            label: "Detached trace remains shell-routed",
            detail: "Trace review feels multi-window, but native detached trace management is still intentionally disabled.",
            tone: "neutral"
          }
        ],
        detachedPanelId: "detached-trace"
      },
      {
        id: "shared-state-lane-preview-review",
        label: "Preview Review Lane",
        summary: "Review Deck tracks readiness, preview candidate posture, and connector-focused handoff blockers as one blocked shared lane.",
        status: "blocked",
        posture: "preview",
        workflowLaneId: "lane-preview-review",
        windowId: "window-review-board",
        routeId: "settings",
        workspaceViewId: "review-deck",
        windowIntentId: "window-intent-review-workspace",
        focusedSlotId: "slot-connector-activate",
        ownership: {
          owner: "runtime-owner",
          mode: "handoff",
          posture: "preview readiness",
          summary: "Review Deck is holding preview/readiness review until the shell focuses the review intent and future detach support exists."
        },
        sync: {
          health: "blocked",
          summary: "Route and workspace are visible, but the review intent is not focused and the detached preview remains placeholder-only.",
          updatedAt: "2 min ago"
        },
        lastHandoff: {
          label: "Preview lane staged",
          fromWindowId: "window-trace-review",
          toWindowId: "window-review-board",
          summary: "Review Deck inherited preview/readiness context from the trace lane so policy blockers remain visible before any future host handoff.",
          timestamp: "2 min ago",
          linkedIntentId: "window-intent-review-workspace",
          linkedSlotId: "slot-connector-activate"
        },
        routeLinks: [
          {
            id: "shared-route-preview-settings",
            routeId: "settings",
            workspaceViewId: "review-deck",
            windowIntentId: "window-intent-review-workspace",
            detachedPanelId: "detached-preview",
            summary: "Settings -> Review Deck -> Detached Preview keeps readiness review explicit."
          }
        ],
        reviewPosture: createStudioWindowReviewPostureLink(
          "release-pipeline-lifecycle-enforcement",
          "Release decision lifecycle",
          "reviewer-queue-lifecycle-enforcement",
          "blocked",
          "decision-handoff-lifecycle-enforcement",
          "evidence-closeout-lifecycle-enforcement",
          "escalation-window-lifecycle-enforcement",
          "closeout-window-lifecycle-enforcement",
          "Preview Review Lane makes the blocked lifecycle posture explicit so downstream review ownership remains visible even while the active approval board is elsewhere."
        ),
        stateFields: [
          {
            id: "shared-preview-route",
            label: "Route focus",
            value: "Settings",
            detail: "Settings remains the route anchor for preview/readiness posture and safety controls.",
            tone: "neutral"
          },
          {
            id: "shared-preview-workspace",
            label: "Workspace focus",
            value: "Review Deck",
            detail: "Review Deck keeps preview and readiness review visible, but it has not yet taken focused intent ownership.",
            tone: "warning"
          },
          {
            id: "shared-preview-intent",
            label: "Intent posture",
            value: "Review Workspace Intent / ready",
            detail: "The shell knows where the handoff should land, but the intent is not yet focused locally.",
            tone: "warning"
          },
          {
            id: "shared-preview-slot",
            label: "Focused slot",
            value: "Connector activate IPC slot",
            detail: "Connector activation remains the lighter review slot for readiness and policy gating.",
            tone: "neutral"
          },
          {
            id: "shared-preview-queue",
            label: "Reviewer queue",
            value: "Lifecycle reviewer queue / blocked",
            detail: "Preview review now shows the downstream lifecycle queue even while acknowledgement remains blocked upstream.",
            tone: "warning"
          },
          {
            id: "shared-preview-closeout-window",
            label: "Escalation / closeout windows",
            value: "blocked / scheduled",
            detail: "The preview lane makes the future escalation and closeout timing explicit before native windows or live approval exist.",
            tone: "warning"
          }
        ],
        blockers: [
          {
            id: "shared-preview-blocker-intent",
            label: "Review intent has not taken ownership",
            detail: "The preview lane remains blocked until the review workspace intent becomes focused locally.",
            tone: "warning"
          },
          {
            id: "shared-preview-blocker-detached",
            label: "Detached preview is placeholder-only",
            detail: "The preview candidate remains shell-routed and cannot become a real native detached window in this phase.",
            tone: "warning"
          }
        ],
        detachedPanelId: "detached-preview"
      }
    ]
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
      "Phase60 links route, workflow lane, command flow, focused slot, workspace, detached candidate, intent posture, review-posture ownership, release-review posture, and observability closeout context into one local-only orchestration map so the shell reads like a staged multi-window board without opening a native window.",
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
        reviewPosture: createStudioWindowReviewPostureLink(
          "release-pipeline-attestation-intake",
          "Attestation intake board",
          "reviewer-queue-attestation-intake",
          "acknowledged",
          "decision-handoff-attestation-intake",
          "evidence-closeout-attestation-intake",
          "escalation-window-attestation-intake",
          "closeout-window-attestation-intake",
          "Boundary Review Orchestration keeps the intake handoff visible as the upstream posture that still feeds the active review board."
        ),
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
        reviewPosture: createStudioWindowReviewPostureLink(
          "release-pipeline-approval-orchestration",
          "Approval orchestration board",
          "reviewer-queue-approval-orchestration",
          "pending",
          "decision-handoff-approval-orchestration",
          "evidence-closeout-approval-orchestration",
          "escalation-window-approval-orchestration",
          "closeout-window-approval-orchestration",
          "Trace Review Orchestration is the active board that owns the current reviewer queue, acknowledgement timing, escalation window, and closeout window."
        ),
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
        reviewPosture: createStudioWindowReviewPostureLink(
          "release-pipeline-lifecycle-enforcement",
          "Release decision lifecycle",
          "reviewer-queue-lifecycle-enforcement",
          "blocked",
          "decision-handoff-lifecycle-enforcement",
          "evidence-closeout-lifecycle-enforcement",
          "escalation-window-lifecycle-enforcement",
          "closeout-window-lifecycle-enforcement",
          "Preview Review Orchestration shows the downstream lifecycle board that remains blocked until the active approval posture clears."
        ),
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
  observability: {
    title: "",
    summary: "",
    activeMappingId: "",
    signals: [],
    mappings: []
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
      reviewPosture: createStudioWindowReviewPostureLink(
        "release-pipeline-attestation-intake",
        "Attestation intake board",
        "reviewer-queue-attestation-intake",
        "acknowledged",
        "decision-handoff-attestation-intake",
        "evidence-closeout-attestation-intake",
        "escalation-window-attestation-intake",
        "closeout-window-attestation-intake",
        "Detach Inspector Intent keeps the upstream intake posture visible so the boundary handoff still points at a concrete review board, queue, and timing window."
      ),
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
      reviewPosture: createStudioWindowReviewPostureLink(
        "release-pipeline-approval-orchestration",
        "Approval orchestration board",
        "reviewer-queue-approval-orchestration",
        "pending",
        "decision-handoff-approval-orchestration",
        "evidence-closeout-approval-orchestration",
        "escalation-window-approval-orchestration",
        "closeout-window-approval-orchestration",
        "Trace Workspace Intent is the focused intent behind the active approval posture, so its shell linkage now resolves directly to the active board, queue, acknowledgement, escalation, and closeout state."
      ),
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
      reviewPosture: createStudioWindowReviewPostureLink(
        "release-pipeline-lifecycle-enforcement",
        "Release decision lifecycle",
        "reviewer-queue-lifecycle-enforcement",
        "blocked",
        "decision-handoff-lifecycle-enforcement",
        "evidence-closeout-lifecycle-enforcement",
        "escalation-window-lifecycle-enforcement",
        "closeout-window-lifecycle-enforcement",
        "Review Workspace Intent keeps the downstream lifecycle posture explicit so the shell can show where blocked preview ownership would land next."
      ),
      workspaceViewId: "review-deck",
      pageId: "settings"
    }
  ]
};

mockWindowing.observability = createStudioWindowObservability(mockWindowing);
const mockReviewStateContinuity = createStudioReviewStateContinuity(
  mockCommandSurface,
  mockWindowing,
  mockBoundarySummary.hostExecutor.releaseApprovalPipeline
);
const mockActiveReviewStateContinuity =
  mockReviewStateContinuity.entries.find((entry) => entry.id === mockReviewStateContinuity.activeEntryId) ??
  mockReviewStateContinuity.entries[0];

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
  reviewStateContinuity: mockReviewStateContinuity,
  boundary: mockBoundarySummary,
  dashboard: {
    headline:
      "Phase60 keeps the shell on a safe control boundary: runtime-backed detail, dry-runs, Studio-local execution, detached workspace workflows, readiness-aware window intents, review-posture ownership, shell-level multi-window feedback, and delivery-stage exploration are available, while real host execution remains explicitly withheld.",
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
        detail: "Fallback mode still reflects the phase60 disabled bridge and cross-window observability contract even when live probes are unavailable.",
        tone: "warning"
      }
    ]
  },
  home: {
    headline:
      "The validated shell now carries a structured phase60 disabled bridge contract with simulated outcomes, detached workspace workflows, persisted layout controls, dock/inspector-synced window posture, and review-posture ownership mapping without turning on live host-side execution.",
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
          "Phase60 expands the contract with route-aware commands, persisted layout controls, detached workspace workflows, review-posture ownership, and readiness-aware window intents while keeping live host-side mutation outside the renderer and outside scope.",
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
        isolation: "session-local lane",
        handoff: "UI shell handoff active",
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
        isolation: "config-scoped lane",
        handoff: "Awaiting runtime signal",
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
        isolation: "background lane",
        handoff: "Result handoff sealed",
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
    ],
    delegationSummary:
      "Fallback delegation topology keeps spawn path, isolation posture, background lanes, and handoff state visible without launching any real subagents or host-side workers.",
    delegationNotes: [
      {
        id: "agent-delegation-spawn",
        label: "Spawn path",
        value: "Roster lanes only",
        detail: "Fallback models delegation as configured lanes and observed sessions rather than real subagent execution.",
        tone: "neutral"
      },
      {
        id: "agent-delegation-isolation",
        label: "Isolation",
        value: "local-only / shared repo",
        detail: "No worktree, tmux, or remote executor is created in the fallback shell.",
        tone: "warning"
      },
      {
        id: "agent-delegation-background",
        label: "Background",
        value: "1 background lane",
        detail: "Fallback keeps a background/runtime lane visible to mirror future delegated work without running it.",
        tone: "neutral"
      },
      {
        id: "agent-delegation-handoff",
        label: "Result handoff",
        value: "Local handoff only",
        detail: "Task results stay on typed shell surfaces and do not cross into a real host-side coordinator.",
        tone: "neutral"
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
        detail: "Mock task lane keeps the page stable until local Codex session data is available.",
        loopState: "continuing",
        turnCount: 3,
        continuation: "Tool chain settled (2/2 results observed).",
        recoveryCount: 0,
        interruptionCount: 0
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
        detail: "Illustrative review lane for future live approvals and trace metadata.",
        loopState: "recovering",
        turnCount: 4,
        continuation: "Multi-turn continuation with 4 turns.",
        recoveryCount: 1,
        interruptionCount: 0
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
        detail: "Mock queue item shows fallback behavior when no live Codex signals are readable.",
        loopState: "stable",
        turnCount: 1,
        continuation: "Single-turn direct response path.",
        recoveryCount: 0,
        interruptionCount: 0
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
    ],
    loopSummary:
      "The fallback shell keeps a typed turn-lifecycle contract ready for live Codex data: turn count, tool follow-up balance, recovery markers, stop gates, and interruptions are all surfaced without replaying or mutating any task.",
    loopStats: [
      { label: "Loop State", value: "Fallback", tone: "warning" },
      { label: "Turns", value: "8 turns", tone: "positive" },
      { label: "Tool Chain", value: "2 / 2", tone: "positive" },
      { label: "Recovery / Stop", value: "1 / 0", tone: "warning" }
    ],
    loopSignals: [
      {
        id: "codex-loop-state",
        label: "State",
        value: "Fallback contract",
        detail: "The renderer already exposes a stable view of turn state, continuation, and recovery posture before any live Codex session logs are observed.",
        tone: "warning"
      },
      {
        id: "codex-loop-continuation",
        label: "Continuation",
        value: "Tool chain settled (2/2 results observed).",
        detail: "Fallback data models a balanced tool-follow-up turn so the page layout and smoke checks stay deterministic.",
        tone: "positive"
      },
      {
        id: "codex-loop-recovery",
        label: "Recovery / Stop",
        value: "1 recovery · 0 stop",
        detail: "Retry, compaction, token-budget, and stop-gate signals stay local-only and observational in this shell.",
        tone: "warning"
      },
      {
        id: "codex-loop-interruptions",
        label: "Interruptions",
        value: "None observed",
        detail: "Interruption handling remains visible in the contract without enabling any resume or host-side replay path.",
        tone: "positive"
      }
    ],
    contextSummary:
      "Fallback context memory keeps repo docs, git posture, and recent session continuity visible as typed notes until the runtime can assemble the live project context directly from the repository.",
    contextNotes: [
      {
        id: "codex-context-docs",
        label: "Docs",
        value: "3 core docs",
        detail: "README.md, HANDOFF.md, and IMPLEMENTATION-PLAN.md are the stable project memory sources surfaced through the fallback shell.",
        tone: "positive"
      },
      {
        id: "codex-context-git",
        label: "Git / Layout",
        value: "branch unknown",
        detail: "Fallback keeps the layout contract visible even when live git metadata has not been re-read yet.",
        tone: "neutral"
      },
      {
        id: "codex-context-session",
        label: "Session continuity",
        value: "Mock continuity",
        detail: "Recent session and task continuity will switch from fallback to live repo-local observations when available.",
        tone: "neutral"
      },
      {
        id: "codex-context-focus",
        label: "Project focus",
        value: "renderer/shell",
        detail: "Fallback keeps the current shell focus aligned with the Codex task lane and implementation docs.",
        tone: "neutral"
      }
    ]
  },
  skills: {
    summary:
      "This combined inventory page now pairs runtime-backed detail with a shared phase60 boundary summary so users can see the current layer, blockers, focused-slot scope, simulated bridge linkage, window posture, review-posture ownership, and future executor requirements in one place.",
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
        id: "skills-sources",
        label: "Extension Sources",
        description: "Capability provenance across local skill roots, extension bundles, plugin caches, and MCP roots.",
        items: [
          {
            id: "skill-source-openclaw-home",
            name: "OpenClaw home skills",
            surface: "Skill root",
            status: "Fallback",
            source: "mock",
            detail: "Fallback keeps the OpenClaw home skill root visible until the runtime re-reads local directories.",
            origin: "OpenClaw Home",
            tone: "neutral"
          },
          {
            id: "skill-source-workspace",
            name: "Workspace skills",
            surface: "Skill root",
            status: "Fallback",
            source: "mock",
            detail: "Workspace-managed skill roots will be surfaced here when local discovery is available.",
            origin: "Workspace",
            tone: "neutral"
          },
          {
            id: "skill-source-extensions",
            name: "Extension bundles",
            surface: "Extension root",
            status: "Fallback",
            source: "mock",
            detail: "Extension-bundled skills remain explicitly tracked as a separate provenance source.",
            origin: "Extensions",
            tone: "neutral"
          },
          {
            id: "skill-source-plugin-load-paths",
            name: "Plugin load paths",
            surface: "Plugin source",
            status: "Fallback",
            source: "mock",
            detail: "OpenClaw plugin load paths and curated cache fallback will populate here from local runtime data.",
            origin: "OpenClaw Plugins",
            tone: "neutral"
          },
          {
            id: "skill-source-mcp-roots",
            name: "Dedicated MCP roots",
            surface: "MCP source",
            status: "Fallback",
            source: "mock",
            detail: "Dedicated MCP root discovery remains visible as part of the extension model even before live probes run.",
            origin: "MCP Runtime",
            tone: "warning"
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
        id: "settings-startup",
        title: "Startup Routing",
        description: "Build/start path, display posture, and command entrypoints.",
        items: [
          {
            id: "settings-start-ready",
            label: "Startup path",
            value: "Review-only",
            detail: "Fallback keeps the local start chain visible before live preflight data is read.",
            tone: "neutral"
          },
          {
            id: "settings-display",
            label: "Display route",
            value: "Unknown",
            detail: "Display preflight will populate here from the local startup summary.",
            tone: "neutral"
          },
          {
            id: "settings-command-path",
            label: "Command path",
            value: "Scripts staged",
            detail: "Root and app scripts remain part of the typed startup contract even before live preflight reads them.",
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
            value: "Phase60 active",
            detail:
              "A review-only operator review loop now sits beside the phase60 cross-window shared-state review surface, so window roster, sync health, handoff posture, reviewer queues, escalation windows, closeout windows, review packets, release evidence, and delivery-stage artifacts stay visible together while every stage remains local-only and non-executing.",
            tone: "positive"
          }
        ]
      }
    ]
  },
  inspector: {
    title: "Inspector",
    summary:
      "Boundary policy, active flow state, focused-slot posture, review posture ownership, review-state continuity contract, delivery-chain workspace state, final verdict context, acceptance closeout timeline anchors, reviewer queues, acknowledgement windows, and cross-window shared-state linkage stay visible here across the shell.",
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
      routeId: "skills",
      workflowLaneId: "lane-trace-review",
      workspaceViewId: "trace-deck",
      windowIntentId: "window-intent-trace-workspace",
      detachedPanelId: "detached-trace",
      focusedSlotId: "slot-lane-apply",
      windowId: "window-trace-review",
      sharedStateLaneId: "shared-state-lane-trace-review",
      orchestrationBoardId: "orchestration-board-trace-review",
      reviewStageId: "release-pipeline-approval-orchestration",
      deliveryChainStageId: "delivery-chain-operator-review",
      reviewerQueueId: "reviewer-queue-approval-orchestration",
      decisionHandoffId: "decision-handoff-approval-orchestration",
      evidenceCloseoutId: "evidence-closeout-approval-orchestration",
      escalationWindowId: "escalation-window-approval-orchestration",
      closeoutWindowId: "closeout-window-approval-orchestration",
      observabilityMappingId: "observability-mapping-approval-active"
    },
    sections: [
      { id: "layer", label: "Current layer", value: "Local-only" },
      { id: "host", label: "Host state", value: "Withheld" },
      { id: "next", label: "Next layer", value: "Preview-host" },
      { id: "slot-focus", label: "Trace focus", value: "Lane apply IPC slot" },
      { id: "handler", label: "Handler state", value: "Registered / disabled" },
      { id: "validator", label: "Validator state", value: "Registered / slot-linked" },
      { id: "approval-pipeline", label: "Operator review board", value: "Approval orchestration board / in-review" },
      { id: "delivery-chain", label: "Delivery chain", value: "Operator review / review" },
      { id: "reviewer-queue", label: "Reviewer queue", value: "Approval reviewer queue / active" },
      { id: "ack-state", label: "Acknowledgement", value: "Pending / product-owner" },
      { id: "decision-handoff", label: "Decision handoff", value: "awaiting-ack / product-owner" },
      { id: "escalation-window", label: "Escalation window", value: "Decision-lifecycle escalation window / open" },
      { id: "evidence-closeout", label: "Evidence closeout", value: "open / release-manager" },
      { id: "closeout-window", label: "Closeout window", value: "Approval closeout window / open" },
      { id: "publish-rollback", label: "Publish / rollback", value: "blocked publish / planned rollback" },
      { id: "window-focus", label: "Window focus", value: "Trace Review Window" },
      { id: "shared-state", label: "Shared-state lane", value: "Trace Review Lane / synced" },
      { id: "orchestration-board", label: "Orchestration board", value: "Trace Review Orchestration / approval orchestration" },
      { id: "review-posture", label: "Review posture owner", value: "release-manager / owns-current-posture" },
      {
        id: "review-continuity",
        label: "Review continuity",
        value: mockActiveReviewStateContinuity
          ? `${mockActiveReviewStateContinuity.label} / ${mockActiveReviewStateContinuity.readouts.find((line) => line.id === "continuity-spine")?.value ?? "No spine"}`
          : "Unavailable"
      },
      {
        id: "continuity-closeout",
        label: "Closeout timing",
        value: mockActiveReviewStateContinuity?.readouts.find((line) => line.id === "closeout-timing")?.value ?? "Unavailable"
      },
      {
        id: "mapped-review-path",
        label: "Mapped review path",
        value: mockActiveReviewStateContinuity?.readouts.find((line) => line.id === "mapped-review-path")?.value ?? "Unavailable"
      },
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
            tone: "warning",
            links: [{ id: "inspector-link-flow-slot", label: "slot-lane-apply", kind: "trace-slot", target: "slot-lane-apply" }]
          },
          {
            id: "drilldown-flow-recommended",
            label: "Recommended action",
            value: "Activate Trace Deck View",
            detail: "The next local-only move keeps trace posture and review orchestration in one shell board.",
            tone: "positive",
            links: [
              { id: "inspector-link-trace-workspace", label: "Trace workspace intent", kind: "window-intent", target: "window-intent-trace-workspace" },
              { id: "inspector-link-trace-window", label: "Trace Review Window", kind: "window-roster", target: "window-trace-review" },
              { id: "inspector-link-trace-shared-lane", label: "Trace Review Lane", kind: "shared-state-lane", target: "shared-state-lane-trace-review" }
            ]
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
        id: "drilldown-release-approval-pipeline",
        label: "Release Approval Pipeline",
        summary: "Approval orchestration, reviewer queues, acknowledgement timing, escalation windows, closeout windows, lifecycle enforcement, rollback settlement, and release-decision review now read like one review-only pipeline.",
        lines: [
          {
            id: "drilldown-pipeline-current",
            label: "Current board",
            value: "Approval orchestration board",
            detail: "Phase60 keeps the reviewer baton board visible while tying it into the cross-window shared-state review surface with explicit queue, acknowledgement, escalation, handoff, and closeout state.",
            tone: "positive",
            links: [
              {
                id: "inspector-link-approval-orchestration",
                label: "ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json",
                kind: "release-artifact",
                target: "release/ATTESTATION-OPERATOR-APPROVAL-ORCHESTRATION.json"
              },
              {
                id: "inspector-link-release-workflow",
                label: "RELEASE-APPROVAL-WORKFLOW.json",
                kind: "release-artifact",
                target: "release/RELEASE-APPROVAL-WORKFLOW.json"
              }
            ]
          },
          {
            id: "drilldown-pipeline-queue",
            label: "Reviewer queue",
            value: "Approval reviewer queue / pending ack",
            detail: "Queue ownership and acknowledgement state are first-class alongside the current board instead of being hidden in pending text.",
            tone: "warning"
          },
          {
            id: "drilldown-pipeline-lifecycle",
            label: "Lifecycle board",
            value: "Decision enforcement lifecycle",
            detail: "Staged release decision lifecycle checkpoints stay linked to approval routing and slot review while execution remains disabled.",
            tone: "neutral",
            links: [
              {
                id: "inspector-link-release-lifecycle",
                label: "PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json",
                kind: "release-artifact",
                target: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json"
              },
              { id: "inspector-link-lifecycle-verify", label: "lifecycle.verify-host", kind: "lifecycle", target: "lifecycle.verify-host" }
            ]
          },
          {
            id: "drilldown-pipeline-escalation",
            label: "Escalation window",
            value: "Decision-lifecycle escalation window / open",
            detail: "Escalation timing stays explicit even though the acknowledgement path remains review-only and local-only.",
            tone: "warning"
          },
          {
            id: "drilldown-pipeline-rollback",
            label: "Rollback closeout",
            value: "Receipt settlement closeout",
            detail: "Rollback publication receipt settlement closeout now appears as a first-class review pipeline stage beside approval and lifecycle.",
            tone: "warning",
            links: [
              {
                id: "inspector-link-rollback-settlement",
                label: "ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
                kind: "release-artifact",
                target: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json"
              },
              { id: "inspector-link-rollback-host", label: "lifecycle.rollback-host", kind: "lifecycle", target: "lifecycle.rollback-host" }
            ]
          },
          {
            id: "drilldown-pipeline-closeout-window",
            label: "Closeout window",
            value: "Approval closeout window / open",
            detail: "Closeout timing is surfaced as its own review-loop object so evidence sealing is tied back to the active queue and acknowledgement state.",
            tone: "warning"
          }
        ]
      },
      {
        id: "drilldown-review-only-delivery-chain",
        label: "Delivery-chain Workspace",
        summary:
          "Stage Explorer keeps operator review, promotion readiness, publish gating, rollback readiness, stage-level artifacts, blockers, handoff posture, observability mapping, replay scenario packs, acceptance pass layers, screenshot pass records, capture review flows, acceptance storyboards, evidence dossiers, and proof-linked evidence bundles visible as one richer delivery workflow instead of a disconnected tail of release files.",
        lines: [
          {
            id: "drilldown-delivery-chain-current",
            label: "Delivery Chain Stage",
            value: "Operator review / review",
            detail: "The active board now declares its place in the wider delivery chain, so reviewer ownership maps to a named delivery stage instead of stopping at the operator board.",
            tone: "warning",
            links: [
              {
                id: "inspector-link-delivery-chain-board",
                label: "OPERATOR-REVIEW-BOARD.json",
                kind: "release-artifact",
                target: "release/OPERATOR-REVIEW-BOARD.json"
              },
              {
                id: "inspector-link-delivery-chain-handoff",
                label: "RELEASE-DECISION-HANDOFF.json",
                kind: "release-artifact",
                target: "release/RELEASE-DECISION-HANDOFF.json"
              }
            ]
          },
          {
            id: "drilldown-delivery-chain-promotion",
            label: "Promotion Review Flow",
            value: "Promotion readiness / planned",
            detail: "Promotion evidence, apply readiness, staged apply closeout, and release decision enforcement lifecycle are grouped into one review-only promotion path.",
            tone: "neutral",
            links: [
              {
                id: "inspector-link-delivery-chain-promotion-readiness",
                label: "PROMOTION-APPLY-READINESS.json",
                kind: "release-artifact",
                target: "release/PROMOTION-APPLY-READINESS.json"
              },
              {
                id: "inspector-link-delivery-chain-promotion-lifecycle",
                label: "PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json",
                kind: "release-artifact",
                target: "release/PROMOTION-STAGED-APPLY-RELEASE-DECISION-ENFORCEMENT-LIFECYCLE.json"
              }
            ]
          },
          {
            id: "drilldown-delivery-chain-publish",
            label: "Publish Review Flow",
            value: "Publish decision gate / blocked",
            detail: "Signing metadata, publish gates, promotion gates, and release notes now show up as one publish-facing decision gate.",
            tone: "warning",
            links: [
              {
                id: "inspector-link-delivery-chain-signing",
                label: "SIGNING-PUBLISH-GATING-HANDSHAKE.json",
                kind: "release-artifact",
                target: "release/SIGNING-PUBLISH-GATING-HANDSHAKE.json"
              },
              {
                id: "inspector-link-delivery-chain-publish-gates",
                label: "PUBLISH-GATES.json",
                kind: "release-artifact",
                target: "release/PUBLISH-GATES.json"
              }
            ]
          },
          {
            id: "drilldown-delivery-chain-rollback",
            label: "Rollback Review Flow",
            value: "Rollback readiness / planned",
            detail: "Rollback handshake, rehearsal, drillbooks, cutover records, and receipt settlement closeout are grouped into one recovery-facing review stage.",
            tone: "warning",
            links: [
              {
                id: "inspector-link-delivery-chain-publish-rollback",
                label: "PUBLISH-ROLLBACK-HANDSHAKE.json",
                kind: "release-artifact",
                target: "release/PUBLISH-ROLLBACK-HANDSHAKE.json"
              },
              {
                id: "inspector-link-delivery-chain-rollback-settlement",
                label: "ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json",
                kind: "release-artifact",
                target: "release/ROLLBACK-CUTOVER-PUBLICATION-RECEIPT-SETTLEMENT-CLOSEOUT.json"
              }
            ]
          }
        ]
      },
      {
        id: "drilldown-cross-window-observability",
        label: "Cross-window Observability",
        summary:
          "The active review posture now resolves through an explicit route, window, shared-state lane, orchestration board, reviewer queue, acknowledgement state, escalation window, closeout window, and focused-slot ownership map.",
        lines: [
          {
            id: "drilldown-observability-owner",
            label: "Active ownership",
            value: "Trace Review Window -> Trace Review Lane -> Trace Review Orchestration",
            detail: "The active review posture is owned by the trace window/lane/board chain instead of being inferred from whichever tab happens to be visible.",
            tone: "warning",
            links: [
              { id: "inspector-link-observability-window", label: "window-trace-review", kind: "window-roster", target: "window-trace-review" },
              { id: "inspector-link-observability-lane", label: "shared-state-lane-trace-review", kind: "shared-state-lane", target: "shared-state-lane-trace-review" },
              {
                id: "inspector-link-observability-board",
                label: "orchestration-board-trace-review",
                kind: "orchestration-board",
                target: "orchestration-board-trace-review"
              }
            ]
          },
          {
            id: "drilldown-observability-queue",
            label: "Queue / acknowledgement",
            value: "reviewer-queue-approval-orchestration / pending",
            detail: "The same observability row now carries the live reviewer queue and acknowledgement posture, not just the owning lane.",
            tone: "warning",
            links: [
              {
                id: "inspector-link-observability-reviewer-queue",
                label: "reviewer-queue-approval-orchestration",
                kind: "reviewer-queue",
                target: "reviewer-queue-approval-orchestration"
              },
              {
                id: "inspector-link-observability-decision-handoff",
                label: "decision-handoff-approval-orchestration",
                kind: "decision-handoff",
                target: "decision-handoff-approval-orchestration"
              }
            ]
          },
          {
            id: "drilldown-observability-windows",
            label: "Escalation / closeout windows",
            value: "escalation-window-approval-orchestration / closeout-window-approval-orchestration",
            detail: "Escalation and closeout windows are attached to the active map row so timing posture can be audited from the same cross-window ownership view.",
            tone: "warning",
            links: [
              {
                id: "inspector-link-observability-escalation-window",
                label: "escalation-window-approval-orchestration",
                kind: "escalation-window",
                target: "escalation-window-approval-orchestration"
              },
              {
                id: "inspector-link-observability-closeout-window",
                label: "closeout-window-approval-orchestration",
                kind: "closeout-window",
                target: "closeout-window-approval-orchestration"
              }
            ]
          },
          {
            id: "drilldown-observability-shadow",
            label: "Mapped shadow paths",
            value: "Boundary intake / blocked lifecycle / rollback settlement / final decision gate",
            detail: "Other windows now describe exactly how they map to the current posture, including upstream handoff, blocked downstream ownership, escalated rollback shadowing, and the blocked final decision gate.",
            tone: "neutral",
            links: [
              { id: "inspector-link-observability-boundary-window", label: "window-shell-main", kind: "window-roster", target: "window-shell-main" },
              { id: "inspector-link-observability-preview-window", label: "window-review-board", kind: "window-roster", target: "window-review-board" },
              {
                id: "inspector-link-observability-evidence-closeout",
                label: "evidence-closeout-approval-orchestration",
                kind: "evidence-closeout",
                target: "evidence-closeout-approval-orchestration"
              }
            ]
          }
        ]
      },
      {
        id: "drilldown-review-state-continuity",
        label: "Review State Continuity Contract",
        summary:
          mockActiveReviewStateContinuity?.summary ??
          "No explicit review-state continuity contract is attached to the current inspector snapshot.",
        lines: mockActiveReviewStateContinuity
          ? [
              {
                id: "drilldown-review-continuity-surface",
                label: "Active review surface",
                value: mockActiveReviewStateContinuity.readouts.find((line) => line.id === "review-surface")?.value ?? mockActiveReviewStateContinuity.label,
                detail:
                  mockActiveReviewStateContinuity.readouts.find((line) => line.id === "review-surface")?.detail ??
                  mockActiveReviewStateContinuity.surface.summary,
                tone: mockActiveReviewStateContinuity.readouts.find((line) => line.id === "review-surface")?.tone ?? mockActiveReviewStateContinuity.tone,
                links: [
                  {
                    id: "inspector-link-review-continuity-surface",
                    label: mockActiveReviewStateContinuity.surface.actionId,
                    kind: "review-stage",
                    target: mockActiveReviewStateContinuity.surface.deliveryChainStageId
                  }
                ]
              },
              {
                id: "drilldown-review-continuity-spine",
                label: "Window / lane / board spine",
                value: mockActiveReviewStateContinuity.readouts.find((line) => line.id === "continuity-spine")?.value ?? "Unavailable",
                detail:
                  mockActiveReviewStateContinuity.readouts.find((line) => line.id === "continuity-spine")?.detail ??
                  mockActiveReviewStateContinuity.spine.summary,
                tone: mockActiveReviewStateContinuity.readouts.find((line) => line.id === "continuity-spine")?.tone ?? mockActiveReviewStateContinuity.tone,
                links: [
                  {
                    id: "inspector-link-review-continuity-window",
                    label: mockActiveReviewStateContinuity.spine.windowId,
                    kind: "window-roster",
                    target: mockActiveReviewStateContinuity.spine.windowId
                  },
                  {
                    id: "inspector-link-review-continuity-lane",
                    label: mockActiveReviewStateContinuity.spine.sharedStateLaneId,
                    kind: "shared-state-lane",
                    target: mockActiveReviewStateContinuity.spine.sharedStateLaneId
                  },
                  {
                    id: "inspector-link-review-continuity-board",
                    label: mockActiveReviewStateContinuity.spine.orchestrationBoardId,
                    kind: "orchestration-board",
                    target: mockActiveReviewStateContinuity.spine.orchestrationBoardId
                  }
                ]
              },
              {
                id: "drilldown-review-continuity-queue",
                label: "Reviewer queue",
                value: mockActiveReviewStateContinuity.readouts.find((line) => line.id === "reviewer-queue")?.value ?? "Unavailable",
                detail:
                  mockActiveReviewStateContinuity.readouts.find((line) => line.id === "reviewer-queue")?.detail ??
                  mockActiveReviewStateContinuity.reviewerQueue.summary,
                tone: mockActiveReviewStateContinuity.readouts.find((line) => line.id === "reviewer-queue")?.tone ?? mockActiveReviewStateContinuity.tone,
                links: [
                  {
                    id: "inspector-link-review-continuity-queue",
                    label: mockActiveReviewStateContinuity.reviewerQueue.id,
                    kind: "reviewer-queue",
                    target: mockActiveReviewStateContinuity.reviewerQueue.id
                  }
                ]
              },
              {
                id: "drilldown-review-continuity-closeout",
                label: "Closeout timing",
                value: mockActiveReviewStateContinuity.readouts.find((line) => line.id === "closeout-timing")?.value ?? "Unavailable",
                detail:
                  mockActiveReviewStateContinuity.readouts.find((line) => line.id === "closeout-timing")?.detail ??
                  mockActiveReviewStateContinuity.closeoutTiming.summary,
                tone: mockActiveReviewStateContinuity.readouts.find((line) => line.id === "closeout-timing")?.tone ?? mockActiveReviewStateContinuity.tone,
                links: [
                  {
                    id: "inspector-link-review-continuity-escalation",
                    label: mockActiveReviewStateContinuity.closeoutTiming.escalationWindowId,
                    kind: "escalation-window",
                    target: mockActiveReviewStateContinuity.closeoutTiming.escalationWindowId
                  },
                  {
                    id: "inspector-link-review-continuity-closeout-window",
                    label: mockActiveReviewStateContinuity.closeoutTiming.closeoutWindowId,
                    kind: "closeout-window",
                    target: mockActiveReviewStateContinuity.closeoutTiming.closeoutWindowId
                  }
                ]
              },
              {
                id: "drilldown-review-continuity-path",
                label: "Mapped review path",
                value: mockActiveReviewStateContinuity.readouts.find((line) => line.id === "mapped-review-path")?.value ?? "Unavailable",
                detail:
                  mockActiveReviewStateContinuity.readouts.find((line) => line.id === "mapped-review-path")?.detail ??
                  mockActiveReviewStateContinuity.mappedReviewPath.summary,
                tone: mockActiveReviewStateContinuity.readouts.find((line) => line.id === "mapped-review-path")?.tone ?? mockActiveReviewStateContinuity.tone,
                links: [
                  {
                    id: "inspector-link-review-continuity-mapping",
                    label: mockActiveReviewStateContinuity.spine.observabilityMappingId,
                    kind: "orchestration-board",
                    target: mockActiveReviewStateContinuity.spine.observabilityMappingId
                  }
                ]
              }
            ]
          : []
      },
      {
        id: "drilldown-orchestration-state",
        label: "Orchestration State",
        summary: "Workflow lane, workspace, detached candidate, intent focus, and the new cross-window shared-state lane now read like one staged coordination chain.",
        lines: [
          {
            id: "drilldown-orchestration-lane",
            label: "Workflow lane",
            value: "Trace Review Workflow",
            detail: "The shell is holding the trace review lane as the current orchestration posture.",
            tone: "positive",
            links: [{ id: "inspector-link-orchestration-lane", label: "Trace Review Lane", kind: "shared-state-lane", target: "shared-state-lane-trace-review" }]
          },
          {
            id: "drilldown-orchestration-workspace",
            label: "Workspace / detached candidate",
            value: "trace-deck -> detached-trace",
            detail: "Trace Deck and Detached Trace remain linked as one local detached workflow candidate.",
            tone: "positive",
            links: [{ id: "inspector-link-trace-window-roster", label: "Trace Review Window", kind: "window-roster", target: "window-trace-review" }]
          },
          {
            id: "drilldown-orchestration-intent",
            label: "Intent focus",
            value: "window-intent-trace-workspace",
            detail: "Intent focus stays local-only and keeps shell tabs synchronized for trace review.",
            tone: "warning"
          },
          {
            id: "drilldown-orchestration-shared-state",
            label: "Shared-state lane",
            value: "Trace Review Lane / synced",
            detail: "Ownership, sync health, last handoff, and focused-slot posture are explicit here instead of being implied by tab state.",
            tone: "positive",
            links: [
              { id: "inspector-link-shared-state-trace", label: "shared-state-lane-trace-review", kind: "shared-state-lane", target: "shared-state-lane-trace-review" },
              { id: "inspector-link-window-trace", label: "window-trace-review", kind: "window-roster", target: "window-trace-review" }
            ]
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
