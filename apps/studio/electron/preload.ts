import { contextBridge, ipcRenderer } from "electron";
import type {
  CodexTaskSummary,
  SessionSummary,
  StudioApi,
  StudioClaudeMessage,
  StudioClaudeSnapshot,
  StudioHermesMessage,
  StudioOpenClawChatSessionRef,
  StudioModelCatalog,
  StudioModelMutationResult,
  StudioHermesSnapshot,
  StudioOpenClawChatState,
  StudioOpenClawChatTurnResult,
  StudioHostBridgeState,
  StudioHostExecutorState,
  StudioHostPreviewHandoff,
  StudioRuntimeActionResult,
  StudioRuntimeDetail,
  StudioShellState,
  StudioHermesState,
  StudioHermesConnectResult,
  StudioHermesDisconnectResult,
  StudioHermesSendMessageResult,
  StudioHermesEvent,
  StudioHermesLoadSessionsResult,
  StudioHermesLoadSessionResult,
  PerformanceMetrics,
  PerformanceAlert
} from "@openclaw/shared";

const studioChannels = {
  shellState: "studio:shell-state",
  sessions: "studio:sessions",
  codexTasks: "studio:codex-tasks",
  claudeSnapshot: "studio:claude-snapshot",
  claudeSessionMessages: "studio:claude-session-messages",
  openclawChatState: "studio:openclaw-chat-state",
  openclawChatTurn: "studio:openclaw-chat-turn",
  openclawChatCreateSession: "studio:openclaw-chat-create-session",
  openclawGatewayState: "studio:openclaw-gateway-state",
  openclawGatewayStart: "studio:openclaw-gateway-start",
  openclawGatewayStop: "studio:openclaw-gateway-stop",
  openclawChatModels: "studio:openclaw-chat-models",
  openclawChatSetModel: "studio:openclaw-chat-set-model",
  hermesState: "studio:hermes-state",
  hermesSnapshot: "studio:hermes-snapshot",
  hermesSessionMessages: "studio:hermes-session-messages",
  hermesCreateSession: "studio:hermes-create-session",
  hermesGatewayState: "studio:hermes-gateway-state",
  hermesGatewayStart: "studio:hermes-gateway-start",
  hermesGatewayStop: "studio:hermes-gateway-stop",
  hermesConnect: "studio:hermes-connect",
  hermesDisconnect: "studio:hermes-disconnect",
  hermesSendMessage: "studio:hermes-send-message",
  hermesModels: "studio:hermes-models",
  hermesSetModel: "studio:hermes-set-model",
  hermesSubscribe: "studio:hermes-subscribe",
  hermesUnsubscribe: "studio:hermes-unsubscribe",
  hermesEvent: "studio:hermes-event",
  hermesGetSessions: "studio:hermes-get-sessions",
  hermesGetMessages: "studio:hermes-get-messages",
  hostExecutorState: "studio:host-executor-state",
  hostBridgeState: "studio:host-bridge-state",
  hostPreviewHandoff: "studio:host-preview-handoff",
  runtimeItemDetail: "studio:runtime-item-detail",
  runtimeItemAction: "studio:runtime-item-action",
  performanceMetrics: "studio:performance-metrics",
  performanceSubscribe: "studio:performance-subscribe",
  performanceUnsubscribe: "studio:performance-unsubscribe",
  performanceAlert: "studio:performance-alert"
} as const;

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
  getClaudeSnapshot(): Promise<StudioClaudeSnapshot> {
    return ipcRenderer.invoke(studioChannels.claudeSnapshot) as Promise<StudioClaudeSnapshot>;
  },
  getClaudeSessionMessages(sessionId: string): Promise<StudioClaudeMessage[]> {
    return ipcRenderer.invoke(studioChannels.claudeSessionMessages, sessionId) as Promise<StudioClaudeMessage[]>;
  },
  getOpenClawChatState(sessionId?: string | null): Promise<StudioOpenClawChatState> {
    return ipcRenderer.invoke(studioChannels.openclawChatState, sessionId) as Promise<StudioOpenClawChatState>;
  },
  sendOpenClawChatTurn(prompt: string, sessionId?: string | null): Promise<StudioOpenClawChatTurnResult> {
    return ipcRenderer.invoke(studioChannels.openclawChatTurn, prompt, sessionId) as Promise<StudioOpenClawChatTurnResult>;
  },
  createOpenClawChatSession(): Promise<StudioOpenClawChatSessionRef> {
    return ipcRenderer.invoke(studioChannels.openclawChatCreateSession) as Promise<StudioOpenClawChatSessionRef>;
  },
  getOpenClawGatewayServiceState(): Promise<import("@openclaw/shared").StudioGatewayServiceState> {
    return ipcRenderer.invoke(studioChannels.openclawGatewayState) as Promise<import("@openclaw/shared").StudioGatewayServiceState>;
  },
  startOpenClawGatewayService(): Promise<import("@openclaw/shared").StudioGatewayServiceMutationResult> {
    return ipcRenderer.invoke(studioChannels.openclawGatewayStart) as Promise<import("@openclaw/shared").StudioGatewayServiceMutationResult>;
  },
  stopOpenClawGatewayService(): Promise<import("@openclaw/shared").StudioGatewayServiceMutationResult> {
    return ipcRenderer.invoke(studioChannels.openclawGatewayStop) as Promise<import("@openclaw/shared").StudioGatewayServiceMutationResult>;
  },
  getOpenClawModelCatalog(): Promise<StudioModelCatalog> {
    return ipcRenderer.invoke(studioChannels.openclawChatModels) as Promise<StudioModelCatalog>;
  },
  setOpenClawModel(modelId: string): Promise<StudioModelMutationResult> {
    return ipcRenderer.invoke(studioChannels.openclawChatSetModel, modelId) as Promise<StudioModelMutationResult>;
  },
  getHermesState(): Promise<StudioHermesState> {
    return ipcRenderer.invoke(studioChannels.hermesState) as Promise<StudioHermesState>;
  },
  getHermesSnapshot(): Promise<StudioHermesSnapshot> {
    return ipcRenderer.invoke(studioChannels.hermesSnapshot) as Promise<StudioHermesSnapshot>;
  },
  getHermesSessionMessages(sessionId: string): Promise<StudioHermesMessage[]> {
    return ipcRenderer.invoke(studioChannels.hermesSessionMessages, sessionId) as Promise<StudioHermesMessage[]>;
  },
  createHermesSession(modelId?: string | null): Promise<import("@openclaw/shared").StudioHermesSessionSummary> {
    return ipcRenderer.invoke(studioChannels.hermesCreateSession, modelId) as Promise<import("@openclaw/shared").StudioHermesSessionSummary>;
  },
  getHermesGatewayServiceState(): Promise<import("@openclaw/shared").StudioGatewayServiceState> {
    return ipcRenderer.invoke(studioChannels.hermesGatewayState) as Promise<import("@openclaw/shared").StudioGatewayServiceState>;
  },
  startHermesGatewayService(): Promise<import("@openclaw/shared").StudioGatewayServiceMutationResult> {
    return ipcRenderer.invoke(studioChannels.hermesGatewayStart) as Promise<import("@openclaw/shared").StudioGatewayServiceMutationResult>;
  },
  stopHermesGatewayService(): Promise<import("@openclaw/shared").StudioGatewayServiceMutationResult> {
    return ipcRenderer.invoke(studioChannels.hermesGatewayStop) as Promise<import("@openclaw/shared").StudioGatewayServiceMutationResult>;
  },
  connectHermes(): Promise<StudioHermesConnectResult> {
    return ipcRenderer.invoke(studioChannels.hermesConnect) as Promise<StudioHermesConnectResult>;
  },
  disconnectHermes(): Promise<StudioHermesDisconnectResult> {
    return ipcRenderer.invoke(studioChannels.hermesDisconnect) as Promise<StudioHermesDisconnectResult>;
  },
  sendHermesMessage(sessionId: string, content: string): Promise<StudioHermesSendMessageResult> {
    return ipcRenderer.invoke(studioChannels.hermesSendMessage, sessionId, content) as Promise<StudioHermesSendMessageResult>;
  },
  getHermesModelCatalog(): Promise<StudioModelCatalog> {
    return ipcRenderer.invoke(studioChannels.hermesModels) as Promise<StudioModelCatalog>;
  },
  setHermesModel(modelId: string): Promise<StudioModelMutationResult> {
    return ipcRenderer.invoke(studioChannels.hermesSetModel, modelId) as Promise<StudioModelMutationResult>;
  },
  subscribeHermesEvents(listener: (event: StudioHermesEvent) => void): () => void {
    const handler = (_event: unknown, data: StudioHermesEvent) => {
      listener(data);
    };

    // 监听事件
    ipcRenderer.on(studioChannels.hermesEvent, handler);

    // 通知主进程订阅
    void ipcRenderer.invoke(studioChannels.hermesSubscribe);

    // 返回取消订阅函数
    return () => {
      ipcRenderer.removeListener(studioChannels.hermesEvent, handler);
      void ipcRenderer.invoke(studioChannels.hermesUnsubscribe);
    };
  },
  loadHermesSessions(): Promise<StudioHermesLoadSessionsResult> {
    return ipcRenderer.invoke(studioChannels.hermesGetSessions) as Promise<StudioHermesLoadSessionsResult>;
  },
  loadHermesSession(sessionId: string): Promise<StudioHermesLoadSessionResult> {
    return ipcRenderer.invoke(studioChannels.hermesGetMessages, sessionId) as Promise<StudioHermesLoadSessionResult>;
  },
  getHermesSessions(): Promise<StudioHermesLoadSessionsResult> {
    return ipcRenderer.invoke(studioChannels.hermesGetSessions) as Promise<StudioHermesLoadSessionsResult>;
  },
  getHermesMessages(sessionId: string): Promise<StudioHermesLoadSessionResult> {
    return ipcRenderer.invoke(studioChannels.hermesGetMessages, sessionId) as Promise<StudioHermesLoadSessionResult>;
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
  },
  getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return ipcRenderer.invoke(studioChannels.performanceMetrics) as Promise<PerformanceMetrics>;
  },
  subscribePerformanceAlerts(listener: (alert: PerformanceAlert) => void): () => void {
    const handler = (_event: unknown, data: PerformanceAlert) => {
      listener(data);
    };

    ipcRenderer.on(studioChannels.performanceAlert, handler);
    void ipcRenderer.invoke(studioChannels.performanceSubscribe);

    return () => {
      ipcRenderer.removeListener(studioChannels.performanceAlert, handler);
      void ipcRenderer.invoke(studioChannels.performanceUnsubscribe);
    };
  }
};

const studioReadApi = Object.freeze({
  getShellState: studioApi.getShellState,
  listSessions: studioApi.listSessions,
  listCodexTasks: studioApi.listCodexTasks,
  getClaudeSnapshot: studioApi.getClaudeSnapshot,
  getClaudeSessionMessages: studioApi.getClaudeSessionMessages,
  getOpenClawChatState: studioApi.getOpenClawChatState,
  getOpenClawGatewayServiceState: studioApi.getOpenClawGatewayServiceState,
  getOpenClawModelCatalog: studioApi.getOpenClawModelCatalog,
  getHermesState: studioApi.getHermesState,
  getHermesSnapshot: studioApi.getHermesSnapshot,
  getHermesSessionMessages: studioApi.getHermesSessionMessages,
  getHermesGatewayServiceState: studioApi.getHermesGatewayServiceState,
  getHermesModelCatalog: studioApi.getHermesModelCatalog,
  loadHermesSessions: studioApi.loadHermesSessions,
  loadHermesSession: studioApi.loadHermesSession,
  getHermesSessions: studioApi.getHermesSessions,
  getHermesMessages: studioApi.getHermesMessages,
  getHostExecutorState: studioApi.getHostExecutorState,
  getHostBridgeState: studioApi.getHostBridgeState,
  getRuntimeItemDetail: studioApi.getRuntimeItemDetail,
  getPerformanceMetrics: studioApi.getPerformanceMetrics,
  subscribePerformanceAlerts: studioApi.subscribePerformanceAlerts
});

const studioSessionApi = Object.freeze({
  sendOpenClawChatTurn: studioApi.sendOpenClawChatTurn,
  createOpenClawChatSession: studioApi.createOpenClawChatSession,
  createHermesSession: studioApi.createHermesSession,
  connectHermes: studioApi.connectHermes,
  disconnectHermes: studioApi.disconnectHermes,
  sendHermesMessage: studioApi.sendHermesMessage,
  subscribeHermesEvents: studioApi.subscribeHermesEvents
});

const studioGatewayApi = Object.freeze({
  startOpenClawGatewayService: studioApi.startOpenClawGatewayService,
  stopOpenClawGatewayService: studioApi.stopOpenClawGatewayService,
  setOpenClawModel: studioApi.setOpenClawModel,
  startHermesGatewayService: studioApi.startHermesGatewayService,
  stopHermesGatewayService: studioApi.stopHermesGatewayService,
  setHermesModel: studioApi.setHermesModel
});

const studioRuntimeApi = Object.freeze({
  handoffHostPreview: studioApi.handoffHostPreview,
  runRuntimeItemAction: studioApi.runRuntimeItemAction
});

contextBridge.exposeInMainWorld("studioRead", studioReadApi);
contextBridge.exposeInMainWorld("studioSession", studioSessionApi);
contextBridge.exposeInMainWorld("studioGateway", studioGatewayApi);
contextBridge.exposeInMainWorld("studioRuntime", studioRuntimeApi);
