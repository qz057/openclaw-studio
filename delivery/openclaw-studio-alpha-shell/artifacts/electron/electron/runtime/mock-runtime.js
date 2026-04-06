"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockRuntime = createMockRuntime;
const mock_shell_state_1 = require("@openclaw/shared/mock-shell-state");
function cloneState() {
    return JSON.parse(JSON.stringify(mock_shell_state_1.mockShellState));
}
function createMockRuntime() {
    return {
        async getShellState() {
            return cloneState();
        },
        async listSessions() {
            return cloneState().sessions;
        },
        async listCodexTasks() {
            return cloneState().codex.tasks;
        },
        async getHostExecutorState() {
            return cloneState().boundary.hostExecutor;
        },
        async getHostBridgeState() {
            return cloneState().boundary.hostExecutor.bridge;
        },
        async handoffHostPreview() {
            return null;
        },
        async getRuntimeItemDetail() {
            return null;
        },
        async runRuntimeItemAction() {
            return null;
        }
    };
}
