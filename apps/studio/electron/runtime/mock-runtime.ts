import {
  mockShellState,
  type CodexTaskSummary,
  type SessionSummary,
  type StudioApi,
  type StudioHostBridgeState,
  type StudioHostExecutorState,
  type StudioHostPreviewHandoff,
  type StudioShellState
} from "@openclaw/shared";

function cloneState(): StudioShellState {
  return JSON.parse(JSON.stringify(mockShellState)) as StudioShellState;
}

export function createMockRuntime(): StudioApi {
  return {
    async getShellState(): Promise<StudioShellState> {
      return cloneState();
    },
    async listSessions(): Promise<SessionSummary[]> {
      return cloneState().sessions;
    },
    async listCodexTasks(): Promise<CodexTaskSummary[]> {
      return cloneState().codex.tasks;
    },
    async getHostExecutorState(): Promise<StudioHostExecutorState> {
      return cloneState().boundary.hostExecutor;
    },
    async getHostBridgeState(): Promise<StudioHostBridgeState> {
      return cloneState().boundary.hostExecutor.bridge;
    },
    async handoffHostPreview(): Promise<StudioHostPreviewHandoff | null> {
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
