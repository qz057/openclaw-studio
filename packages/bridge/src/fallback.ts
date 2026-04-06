import {
  type CodexTaskSummary,
  type SessionSummary,
  type StudioApi,
  type StudioHostBridgeState,
  type StudioHostExecutorState,
  type StudioHostPreviewHandoff,
  type StudioRuntimeActionResult,
  type StudioRuntimeDetail,
  type StudioShellState
} from "@openclaw/shared";
import { mockShellState } from "@openclaw/shared/mock-shell-state";

export function createFallbackApi(): StudioApi {
  return {
    async getShellState(): Promise<StudioShellState> {
      return mockShellState;
    },
    async listSessions(): Promise<SessionSummary[]> {
      return mockShellState.sessions;
    },
    async listCodexTasks(): Promise<CodexTaskSummary[]> {
      return mockShellState.codex.tasks;
    },
    async getHostExecutorState(): Promise<StudioHostExecutorState> {
      return mockShellState.boundary.hostExecutor;
    },
    async getHostBridgeState(): Promise<StudioHostBridgeState> {
      return mockShellState.boundary.hostExecutor.bridge;
    },
    async handoffHostPreview(): Promise<StudioHostPreviewHandoff | null> {
      return null;
    },
    async getRuntimeItemDetail(): Promise<StudioRuntimeDetail | null> {
      return null;
    },
    async runRuntimeItemAction(): Promise<StudioRuntimeActionResult | null> {
      return null;
    }
  };
}
