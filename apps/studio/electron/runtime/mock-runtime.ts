import {
  type CodexTaskSummary,
  type SessionSummary,
  type StudioApi,
  type StudioClaudeMessage,
  type StudioClaudeSnapshot,
  type StudioGatewayServiceMutationResult,
  type StudioGatewayServiceState,
  type StudioOpenClawChatState,
  type StudioOpenClawChatSessionRef,
  type StudioOpenClawChatTurnResult,
  type StudioModelCatalog,
  type StudioModelMutationResult,
  type StudioHostBridgeState,
  type StudioHostExecutorState,
  type StudioHostPreviewHandoff,
  type StudioShellState,
  type StudioHermesState,
  type StudioHermesConnectResult,
  type StudioHermesDisconnectResult,
  type StudioHermesEvent,
  type StudioHermesMessage,
  type StudioHermesSendMessageResult,
  type StudioHermesSnapshot,
  type PerformanceMetrics,
  type PerformanceAlert,
  type StudioDeviceBootstrapState
} from "@openclaw/shared";
import { mockShellState } from "@openclaw/shared/mock-shell-state";

function cloneState(): StudioShellState {
  return JSON.parse(JSON.stringify(mockShellState)) as StudioShellState;
}

export function createMockRuntime(): StudioApi {
  const mockGatewayState = (serviceId: "openclaw" | "hermes"): StudioGatewayServiceState => ({
    serviceId,
    running: false,
    statusLabel: "Mock runtime",
    detail: "Mock runtime 未接入真实网关服务控制。",
    source: "mock",
    lastCheckedAt: null,
    latencyMs: null,
    startAllowed: false,
    stopAllowed: false
  });
  const mockModelCatalog: StudioModelCatalog = {
    selectedModelId: "relay/gpt-5.4",
    options: [
      {
        id: "relay/gpt-5.4",
        label: "relay/gpt-5.4",
        provider: "relay",
        model: "gpt-5.4",
        source: "fallback"
      }
    ]
  };
  const blockedHermesState: StudioHermesState = {
    source: "mock",
    availability: "blocked",
    canConnect: false,
    canDisconnect: false,
    readinessLabel: "Hermes 功能未实现",
    disabledReason: "Hermes 功能尚未实现",
    endpoint: null,
    sessionLabel: "未连接",
    transportLabel: "无",
    authLabel: "无",
    lastEventAt: null,
    updatedAt: null,
    events: []
  };

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
    async getClaudeSnapshot(): Promise<StudioClaudeSnapshot> {
      return {
        settings: {
          rootPath: "C:\\Users\\qz057\\.claude",
          settingsPath: "C:\\Users\\qz057\\.claude\\settings.json",
          historyPath: "C:\\Users\\qz057\\.claude\\history.jsonl",
          model: null,
          modelType: null,
          availableModels: [],
          permissionMode: null
        },
        sessions: [],
        history: []
      };
    },
    async getClaudeSessionMessages(_sessionId: string): Promise<StudioClaudeMessage[]> {
      return [];
    },
    async getOpenClawChatState(): Promise<StudioOpenClawChatState> {
      return {
        source: "mock",
        availability: "blocked",
        canSend: false,
        readinessLabel: "Mock runtime",
        disabledReason: "当前 mock runtime 还没有连接 OpenClaw 聊天执行链。",
        command: "openclaw agent --agent main --json --message <prompt>",
        sessionKey: "agent:main:main",
        sessionId: null,
        model: null,
        provider: null,
        updatedAt: null,
        tokenContext: {
          source: "unavailable",
          statusLabel: "Mock runtime",
          detail: "Mock runtime 不提供真实 OpenClaw usage。",
          inputTokens: null,
          outputTokens: null,
          totalTokens: null,
          cacheReadTokens: null,
          cacheWriteTokens: null,
          cacheHitPercent: null,
          contextUsedTokens: null,
          contextWindowTokens: null,
          contextPercent: null,
          costUsd: null,
          compactions: null,
          toolCallCount: null,
          availableFunctionCount: null,
          fileCount: null,
          updatedAt: null
        },
        messages: []
      };
    },
    async sendOpenClawChatTurn(prompt: string): Promise<StudioOpenClawChatTurnResult> {
      return {
        prompt,
        reply: "当前 mock runtime 还没有连接 OpenClaw 聊天执行链，请切回 Electron 运行态再试。",
        source: "mock",
        sessionId: null,
        provider: null,
        model: null,
        durationMs: null,
        command: "openclaw agent --agent main --json --message <prompt>"
      };
    },
    async createOpenClawChatSession(): Promise<StudioOpenClawChatSessionRef> {
      return {
        sessionId: "mock-openclaw-session",
        sessionKey: "agent:main:explicit:mock-openclaw-session"
      };
    },
    async getOpenClawGatewayServiceState(): Promise<StudioGatewayServiceState> {
      return mockGatewayState("openclaw");
    },
    async startOpenClawGatewayService(): Promise<StudioGatewayServiceMutationResult> {
      return { applied: false, error: "Mock mode: gateway control not available", state: mockGatewayState("openclaw") };
    },
    async stopOpenClawGatewayService(): Promise<StudioGatewayServiceMutationResult> {
      return { applied: false, error: "Mock mode: gateway control not available", state: mockGatewayState("openclaw") };
    },
    async getOpenClawModelCatalog(): Promise<StudioModelCatalog> {
      return mockModelCatalog;
    },
    async setOpenClawModel(modelId: string): Promise<StudioModelMutationResult> {
      return {
        applied: true,
        error: null,
        catalog: {
          ...mockModelCatalog,
          selectedModelId: modelId || mockModelCatalog.selectedModelId
        }
      };
    },
    async getHermesState(): Promise<StudioHermesState> {
      return blockedHermesState;
    },
    async getHermesSnapshot(): Promise<StudioHermesSnapshot> {
      return {
        state: blockedHermesState,
        sessions: [],
        history: []
      };
    },
    async getHermesSessionMessages(_sessionId: string): Promise<StudioHermesMessage[]> {
      return [];
    },
    async createHermesSession(): Promise<import("@openclaw/shared").StudioHermesSessionSummary> {
      return {
        id: "mock-hermes-session",
        sessionKey: "mock-hermes-session",
        filename: "mock-hermes-session.json",
        label: "Mock Hermes Session",
        sessionLabel: "Mock Hermes Session",
        platform: "cli",
        chatType: "direct",
        messageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    },
    async getHermesGatewayServiceState(): Promise<StudioGatewayServiceState> {
      return mockGatewayState("hermes");
    },
    async startHermesGatewayService(): Promise<StudioGatewayServiceMutationResult> {
      return { applied: false, error: "Mock mode: gateway control not available", state: mockGatewayState("hermes") };
    },
    async stopHermesGatewayService(): Promise<StudioGatewayServiceMutationResult> {
      return { applied: false, error: "Mock mode: gateway control not available", state: mockGatewayState("hermes") };
    },
    async connectHermes(): Promise<StudioHermesConnectResult> {
      return {
        started: false,
        state: {
          source: "mock",
          availability: "blocked",
          canConnect: false,
          canDisconnect: false,
          readinessLabel: "Hermes 功能未实现",
          disabledReason: "Hermes 功能尚未实现",
          endpoint: null,
          sessionLabel: "未连接",
          transportLabel: "无",
          authLabel: "无",
          lastEventAt: null,
          updatedAt: null,
          events: []
        }
      };
    },
    async disconnectHermes(): Promise<StudioHermesDisconnectResult> {
      return {
        stopped: false,
        state: {
          source: "mock",
          availability: "blocked",
          canConnect: false,
          canDisconnect: false,
          readinessLabel: "Hermes 功能未实现",
          disabledReason: "Hermes 功能尚未实现",
          endpoint: null,
          sessionLabel: "未连接",
          transportLabel: "无",
          authLabel: "无",
          lastEventAt: null,
          updatedAt: null,
          events: []
        }
      };
    },
    subscribeHermesEvents(_listener: (event: StudioHermesEvent) => void): () => void {
      return () => {};
    },
    async sendHermesMessage(_sessionId: string, _content: string): Promise<StudioHermesSendMessageResult> {
      return {
        sent: false,
        messageId: null,
        error: "Mock mode: message sending not available"
      };
    },
    async getHermesModelCatalog(): Promise<StudioModelCatalog> {
      return mockModelCatalog;
    },
    async setHermesModel(modelId: string): Promise<StudioModelMutationResult> {
      return {
        applied: true,
        error: null,
        catalog: {
          ...mockModelCatalog,
          selectedModelId: modelId || mockModelCatalog.selectedModelId
        }
      };
    },
    async loadHermesSessions(): Promise<import("@openclaw/shared").StudioHermesLoadSessionsResult> {
      return {
        success: false,
        sessions: [],
        error: "Mock mode: session loading not available"
      };
    },
    async loadHermesSession(_sessionId: string): Promise<import("@openclaw/shared").StudioHermesLoadSessionResult> {
      return {
        success: false,
        messages: [],
        error: "Mock mode: session loading not available"
      };
    },
    async getHermesSessions(): Promise<import("@openclaw/shared").StudioHermesLoadSessionsResult> {
      return {
        success: false,
        sessions: [],
        error: "Mock mode: session loading not available"
      };
    },
    async getHermesMessages(_sessionId: string): Promise<import("@openclaw/shared").StudioHermesLoadSessionResult> {
      return {
        success: false,
        messages: [],
        error: "Mock mode: message loading not available"
      };
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
    },
    async getDeviceBootstrapState(): Promise<StudioDeviceBootstrapState> {
      return {
        source: "mock",
        host: {
          platform: "mock",
          arch: "mock",
          homeDir: "unavailable",
          checkedAt: Date.now()
        },
        overall: "partial",
        summary: "Mock runtime 未连接真实设备运行态。",
        checks: [
          {
            id: "mock-runtime",
            label: "Mock runtime",
            status: "missing",
            summary: "未接入",
            detail: "Mock runtime 不能检测 WSL、OpenClaw、Hermes、gateway 或登录态。",
            evidence: "mock"
          }
        ],
        commands: [],
        migration: {
          secretPolicy: "Mock runtime 不读取或迁移密钥。",
          exportPlan: [],
          importPlan: [],
          portableReadiness: "Mock runtime 不能判断跨设备接入状态。"
        }
      };
    },
    async getPerformanceMetrics(): Promise<PerformanceMetrics> {
      return {
        timestamp: new Date().toISOString(),
        memory: {
          heapUsed: 50 * 1024 * 1024,
          heapTotal: 100 * 1024 * 1024,
          external: 5 * 1024 * 1024,
          rss: 150 * 1024 * 1024,
        },
        cpu: {
          user: 100000,
          system: 50000,
          percent: 5.0,
        },
        system: {
          totalMemory: 16 * 1024 * 1024 * 1024,
          freeMemory: 8 * 1024 * 1024 * 1024,
          platform: "win32",
          arch: "x64",
        },
        process: {
          uptime: 3600,
          pid: 12345,
        },
      };
    },
    subscribePerformanceAlerts(_listener: (alert: PerformanceAlert) => void): () => void {
      return () => {};
    }
  };
}
