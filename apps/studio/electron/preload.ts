import { contextBridge, ipcRenderer } from "electron";
import {
  studioChannels,
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

const studioApi: StudioApi = {
  getShellState(): Promise<StudioShellState> {
    return ipcRenderer.invoke(studioChannels.shellState) as Promise<StudioShellState>;
  },
  listSessions(): Promise<SessionSummary[]> {
    return ipcRenderer.invoke(studioChannels.sessions) as Promise<SessionSummary[]>;
  },
  listCodexTasks(): Promise<CodexTaskSummary[]> {
    return ipcRenderer.invoke(studioChannels.codexTasks) as Promise<CodexTaskSummary[]>;
  },
  getHostExecutorState(): Promise<StudioHostExecutorState> {
    return ipcRenderer.invoke(studioChannels.hostExecutorState) as Promise<StudioHostExecutorState>;
  },
  getHostBridgeState(): Promise<StudioHostBridgeState> {
    return ipcRenderer.invoke(studioChannels.hostBridgeState) as Promise<StudioHostBridgeState>;
  },
  handoffHostPreview(itemId: string, actionId: string): Promise<StudioHostPreviewHandoff | null> {
    return ipcRenderer.invoke(studioChannels.hostPreviewHandoff, itemId, actionId) as Promise<StudioHostPreviewHandoff | null>;
  },
  getRuntimeItemDetail(itemId: string): Promise<StudioRuntimeDetail | null> {
    return ipcRenderer.invoke(studioChannels.runtimeItemDetail, itemId) as Promise<StudioRuntimeDetail | null>;
  },
  runRuntimeItemAction(itemId: string, actionId: string): Promise<StudioRuntimeActionResult | null> {
    return ipcRenderer.invoke(studioChannels.runtimeItemAction, itemId, actionId) as Promise<StudioRuntimeActionResult | null>;
  }
};

contextBridge.exposeInMainWorld("studio", studioApi);
