"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listToolsMcpActions = listToolsMcpActions;
exports.getToolsMcpAction = getToolsMcpAction;
const toolsMcpActionRegistry = {
    "tool-openclaw-runtime": [
        {
            id: "probe-config",
            label: "Probe config",
            description: "Refresh a compact safe summary of tool, web, and hook settings.",
            kind: "probe",
            safety: "read-only",
            refreshDetailOnSuccess: false
        },
        {
            id: "list-hooks",
            label: "List hooks",
            description: "List the currently detected workspace hook directories.",
            kind: "probe",
            safety: "read-only",
            refreshDetailOnSuccess: false
        },
        {
            id: "test-web-readiness",
            label: "Test web readiness",
            description: "Validate search/fetch runtime readiness without making outbound requests.",
            kind: "validate",
            safety: "read-only",
            refreshDetailOnSuccess: false
        }
    ],
    "tool-openclaw-plugins": [
        {
            id: "list-installs",
            label: "List installs",
            description: "Show sanitized OpenClaw plugin install manifests.",
            kind: "probe",
            safety: "read-only",
            refreshDetailOnSuccess: false
        },
        {
            id: "list-entries",
            label: "List entries",
            description: "Show the current plugin entry enabled-state inventory.",
            kind: "probe",
            safety: "read-only",
            refreshDetailOnSuccess: false
        },
        {
            id: "validate-plugin-bridge",
            label: "Validate bridge",
            description: "Check whether plugin bridge prerequisites are present without changing anything.",
            kind: "validate",
            safety: "read-only",
            refreshDetailOnSuccess: false
        }
    ],
    "tool-codex-runtime": [
        {
            id: "probe-presence",
            label: "Probe presence",
            description: "Re-check local Codex config/auth/session/cache presence.",
            kind: "probe",
            safety: "read-only",
            refreshDetailOnSuccess: false
        },
        {
            id: "list-curated-plugins",
            label: "List curated plugins",
            description: "List the currently cached curated plugin directories.",
            kind: "probe",
            safety: "read-only",
            refreshDetailOnSuccess: false
        },
        {
            id: "validate-runtime-readiness",
            label: "Validate runtime",
            description: "Evaluate whether Codex runtime prerequisites look ready from local state.",
            kind: "validate",
            safety: "read-only",
            refreshDetailOnSuccess: false
        }
    ],
    "tool-workspace-tooling": [
        {
            id: "list-hooks",
            label: "List hooks",
            description: "List detected hook directories under the shared workspace.",
            kind: "probe",
            safety: "read-only",
            refreshDetailOnSuccess: false
        },
        {
            id: "list-manifests",
            label: "List manifests",
            description: "Show the safe package manifest summary for tooling roots.",
            kind: "probe",
            safety: "read-only",
            refreshDetailOnSuccess: false
        },
        {
            id: "test-tooling-readiness",
            label: "Test tooling",
            description: "Validate workspace tooling readiness without executing external tools.",
            kind: "validate",
            safety: "read-only",
            refreshDetailOnSuccess: false
        }
    ],
    "mcp-root-scan": [
        {
            id: "rescan-roots",
            label: "Rescan roots",
            description: "Re-run the dedicated MCP root scan and show current path status.",
            kind: "probe",
            safety: "read-only",
            refreshDetailOnSuccess: false
        },
        {
            id: "validate-root-candidates",
            label: "Validate roots",
            description: "Evaluate whether any dedicated MCP root candidates are currently usable.",
            kind: "validate",
            safety: "read-only",
            refreshDetailOnSuccess: false
        },
        {
            id: "list-root-candidates",
            label: "List root candidates",
            description: "List root candidates with richer file/directory status.",
            kind: "probe",
            safety: "read-only",
            refreshDetailOnSuccess: false
        },
        {
            id: "test-discovery-flow",
            label: "Test discovery flow",
            description: "Test the connector discovery flow using current root and bridge inputs without changing anything.",
            kind: "validate",
            safety: "read-only",
            refreshDetailOnSuccess: false
        },
        {
            id: "preview-root-resolution",
            label: "Preview root resolution",
            description: "Preview which root resolution path the shell would choose right now.",
            kind: "dry-run",
            safety: "dry-run",
            refreshDetailOnSuccess: false
        },
        {
            id: "preview-discovery-plan",
            label: "Preview discovery plan",
            description: "Preview the discovery steps the shell would follow using current roots and bridge inputs.",
            kind: "dry-run",
            safety: "dry-run",
            refreshDetailOnSuccess: false
        },
        {
            id: "dry-run-connect-root",
            label: "Dry-run connect",
            description: "Stage a control-shaped root connect plan with target, inputs, blockers, and an explicit execution hold.",
            kind: "dry-run",
            safety: "dry-run",
            refreshDetailOnSuccess: false
        },
        {
            id: "execute-local-root-select",
            label: "Execute local root select",
            description: "Select the preferred root inside the Studio-local control session only, without attaching anything outside the app.",
            kind: "execute-local",
            safety: "local-only",
            refreshDetailOnSuccess: true
        },
        {
            id: "preview-host-root-connect",
            label: "Preview host connect",
            description: "Show the blocked host/runtime root connect path, why it is withheld, and what would be required before enabling it.",
            kind: "preview-host",
            safety: "preview-host",
            refreshDetailOnSuccess: false
        }
    ],
    "mcp-adjacent-runtime": [
        {
            id: "list-bridge-surfaces",
            label: "List bridge surfaces",
            description: "List current OpenClaw bridge surfaces and load paths.",
            kind: "probe",
            safety: "read-only",
            refreshDetailOnSuccess: false
        },
        {
            id: "list-curated-plugins",
            label: "List curated plugins",
            description: "List the Codex curated plugin cache visible to the bridge.",
            kind: "probe",
            safety: "read-only",
            refreshDetailOnSuccess: false
        },
        {
            id: "validate-connector-readiness",
            label: "Validate connector",
            description: "Evaluate connector-adjacent readiness from current cache, installs, load paths, and root scan state.",
            kind: "validate",
            safety: "read-only",
            refreshDetailOnSuccess: false
        },
        {
            id: "list-connector-inputs",
            label: "List connector inputs",
            description: "List bridge inputs and manifests currently feeding the connector lane.",
            kind: "probe",
            safety: "read-only",
            refreshDetailOnSuccess: false
        },
        {
            id: "test-lane-composition",
            label: "Test lane composition",
            description: "Test the connector lane composition from current cache, installs, load paths, and roots.",
            kind: "validate",
            safety: "read-only",
            refreshDetailOnSuccess: false
        },
        {
            id: "preview-bridge-plan",
            label: "Preview bridge plan",
            description: "Preview the bridge plan the shell would assemble from current connector inputs.",
            kind: "dry-run",
            safety: "dry-run",
            refreshDetailOnSuccess: false
        },
        {
            id: "simulate-connector-lane",
            label: "Simulate connector lane",
            description: "Simulate how the connector-adjacent lane would be composed using the current inputs.",
            kind: "dry-run",
            safety: "dry-run",
            refreshDetailOnSuccess: false
        },
        {
            id: "dry-run-bridge-attach",
            label: "Dry-run attach",
            description: "Stage a bridge attach plan that shows source order, predicted outcome, blockers, and why execution stops.",
            kind: "dry-run",
            safety: "dry-run",
            refreshDetailOnSuccess: false
        },
        {
            id: "dry-run-connector-activate",
            label: "Dry-run activate",
            description: "Stage a connector activation plan without changing runtime, lifecycle, or install state.",
            kind: "dry-run",
            safety: "dry-run",
            refreshDetailOnSuccess: false
        },
        {
            id: "dry-run-lane-apply",
            label: "Dry-run apply",
            description: "Stage a lane apply plan that predicts the final connector posture while keeping execution fully withheld.",
            kind: "dry-run",
            safety: "dry-run",
            refreshDetailOnSuccess: false
        },
        {
            id: "execute-local-bridge-stage",
            label: "Execute local bridge stage",
            description: "Stage connector bridge inputs inside the Studio-local control session only.",
            kind: "execute-local",
            safety: "local-only",
            refreshDetailOnSuccess: true
        },
        {
            id: "execute-local-connector-activate",
            label: "Execute local activate",
            description: "Mark a connector as locally active inside Studio without starting or registering anything externally.",
            kind: "execute-local",
            safety: "local-only",
            refreshDetailOnSuccess: true
        },
        {
            id: "execute-local-lane-apply",
            label: "Execute local apply",
            description: "Apply the connector lane inside the Studio-local control session only.",
            kind: "execute-local",
            safety: "local-only",
            refreshDetailOnSuccess: true
        },
        {
            id: "preview-host-bridge-attach",
            label: "Preview host attach",
            description: "Show the blocked host/runtime bridge attach path, the permission boundary, and required enablement conditions.",
            kind: "preview-host",
            safety: "preview-host",
            refreshDetailOnSuccess: false
        },
        {
            id: "preview-host-connector-activate",
            label: "Preview host activate",
            description: "Show the blocked host/runtime connector activate path and the conditions that would be required before enabling it.",
            kind: "preview-host",
            safety: "preview-host",
            refreshDetailOnSuccess: false
        },
        {
            id: "preview-host-lane-apply",
            label: "Preview host apply",
            description: "Show the blocked host/runtime lane apply path, why it is withheld, and what would be required before enabling it.",
            kind: "preview-host",
            safety: "preview-host",
            refreshDetailOnSuccess: false
        }
    ]
};
function listToolsMcpActions(itemId) {
    const actions = toolsMcpActionRegistry[itemId];
    return actions ? actions.map((action) => ({ ...action })) : [];
}
function getToolsMcpAction(itemId, actionId) {
    const action = toolsMcpActionRegistry[itemId]?.find((entry) => entry.id === actionId);
    return action ? { ...action } : null;
}
