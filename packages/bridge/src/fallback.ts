import {
  type CodexTaskSummary,
  type SessionSummary,
  type StudioApi,
  type StudioClaudeMessage,
  type StudioClaudeSnapshot,
  type StudioGatewayServiceMutationResult,
  type StudioGatewayServiceState,
  type StudioHermesConnectResult,
  type StudioHermesDisconnectResult,
  type StudioHermesMessage,
  type StudioOpenClawChatSessionRef,
  type StudioModelCatalog,
  type StudioModelMutationResult,
  type StudioHermesSendMessageResult,
  type StudioHermesSnapshot,
  type StudioHermesState,
  type StudioOpenClawChatState,
  type StudioOpenClawChatTurnResult,
  type StudioHostBridgeState,
  type StudioHostExecutorState,
  type StudioHostPreviewHandoff,
  type StudioRuntimeActionResult,
  type StudioRuntimeDetail,
  type StudioShellState,
  type StudioOpenClawChatMessage,
  type PerformanceMetrics,
  type PerformanceAlert
} from "@openclaw/shared";
import { mockShellState } from "@openclaw/shared/mock-shell-state";

export function createFallbackApi(): StudioApi {
  const fallbackModelCatalog: StudioModelCatalog = {
    selectedModelId: "relay/gpt-5.5",
    options: [
      {
        id: "relay/gpt-5.5",
        label: "relay/gpt-5.5",
        provider: "relay",
        model: "gpt-5.5",
        source: "fallback"
      },
      {
        id: "openai-codex/gpt-5.5",
        label: "openai-codex/gpt-5.5",
        provider: "openai-codex",
        model: "gpt-5.5",
        source: "fallback"
      },
      {
        id: "relay/gpt-5.4",
        label: "relay/gpt-5.4",
        provider: "relay",
        model: "gpt-5.4",
        source: "fallback"
      },
      {
        id: "relay/gpt-5.3-codex",
        label: "relay/gpt-5.3-codex",
        provider: "relay",
        model: "gpt-5.3-codex",
        source: "fallback"
      }
    ]
  };
  const fallbackOpenClawMessages: StudioOpenClawChatMessage[] = [
    {
      id: "fallback-openclaw-user-1",
      role: "user",
      text: "请帮我分析一下最近 24 小时的系统运行状况。",
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString()
    },
    {
      id: "fallback-openclaw-assistant-1",
      role: "assistant",
      text: "OpenClaw 当前处于浏览器预览模式：页面结构、模型选项和消息时间线可检查；真实发送需要 Electron 运行态接入。",
      timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString()
    }
  ];
  const fallbackGatewayState = (serviceId: "openclaw" | "hermes"): StudioGatewayServiceState => ({
    serviceId,
    running: false,
    statusLabel: "未接入运行态",
    detail: "当前 fallback 模式未接入网关服务控制链。",
    source: "mock",
    lastCheckedAt: null,
    latencyMs: null,
    startAllowed: false,
    stopAllowed: false
  });
  const blockedHermesState: StudioHermesState = {
    source: "mock",
    availability: "blocked",
    canConnect: false,
    canDisconnect: false,
    readinessLabel: "未接入运行态",
    disabledReason: "当前 fallback 模式未接入 Hermes 实时连接，请在 Electron 运行态里使用这个页面。",
    endpoint: null,
    sessionLabel: "Hermes 外部会话",
    transportLabel: "SSE / runtime-owned",
    authLabel: "沿用现有 Token",
    lastEventAt: null,
    updatedAt: null,
    events: []
  };

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
        availability: "ready",
        canSend: true,
        readinessLabel: "预览可发送",
        disabledReason: null,
        command: "openclaw agent --agent main --json --message <prompt>",
        sessionKey: "agent:main:main",
        sessionId: "fallback-openclaw-session",
        model: "gpt-5.5",
        provider: "relay",
        updatedAt: Date.now(),
        tokenContext: {
          source: "unavailable",
          statusLabel: "运行态未连接",
          detail: "浏览器预览 fallback 不提供真实 OpenClaw usage。",
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
        messages: [...fallbackOpenClawMessages]
      };
    },
    async sendOpenClawChatTurn(prompt: string): Promise<StudioOpenClawChatTurnResult> {
      const normalizedPrompt = prompt.trim();
      const now = Date.now();
      const reply = `已收到：${normalizedPrompt}\n\n当前是浏览器预览模式，真实 OpenClaw 回复需要从 Electron 运行态发送。`;

      fallbackOpenClawMessages.push(
        {
          id: `fallback-openclaw-user-${now}`,
          role: "user",
          text: normalizedPrompt,
          timestamp: new Date(now).toISOString()
        },
        {
          id: `fallback-openclaw-assistant-${now}`,
          role: "assistant",
          text: reply,
          timestamp: new Date(now + 1).toISOString()
        }
      );

      return {
        prompt: normalizedPrompt,
        reply,
        source: "mock",
        sessionId: "fallback-openclaw-session",
        provider: "relay",
        model: "gpt-5.5",
        durationMs: 180,
        command: "openclaw agent --agent main --json --message <prompt>"
      };
    },
    async createOpenClawChatSession(): Promise<StudioOpenClawChatSessionRef> {
      return {
        sessionId: `fallback-openclaw-${Date.now()}`,
        sessionKey: "agent:main:explicit:fallback-preview"
      };
    },
    async getOpenClawGatewayServiceState(): Promise<StudioGatewayServiceState> {
      return fallbackGatewayState("openclaw");
    },
    async startOpenClawGatewayService(): Promise<StudioGatewayServiceMutationResult> {
      return { applied: false, error: "当前 fallback 模式未接入 OpenClaw 网关控制链。", state: fallbackGatewayState("openclaw") };
    },
    async stopOpenClawGatewayService(): Promise<StudioGatewayServiceMutationResult> {
      return { applied: false, error: "当前 fallback 模式未接入 OpenClaw 网关控制链。", state: fallbackGatewayState("openclaw") };
    },
    async getOpenClawModelCatalog(): Promise<StudioModelCatalog> {
      return fallbackModelCatalog;
    },
    async setOpenClawModel(): Promise<StudioModelMutationResult> {
      return {
        applied: false,
        error: "当前 fallback 模式未接入 OpenClaw 模型配置链。",
        catalog: fallbackModelCatalog
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
      throw new Error("当前 fallback 模式未接入 Hermes 会话执行链，请在 Electron 运行态里使用这个页面。");
    },
    async getHermesGatewayServiceState(): Promise<StudioGatewayServiceState> {
      return fallbackGatewayState("hermes");
    },
    async startHermesGatewayService(): Promise<StudioGatewayServiceMutationResult> {
      return { applied: false, error: "当前 fallback 模式未接入 Hermes 网关控制链。", state: fallbackGatewayState("hermes") };
    },
    async stopHermesGatewayService(): Promise<StudioGatewayServiceMutationResult> {
      return { applied: false, error: "当前 fallback 模式未接入 Hermes 网关控制链。", state: fallbackGatewayState("hermes") };
    },
    async connectHermes(): Promise<StudioHermesConnectResult> {
      throw new Error("当前 fallback 模式未接入 Hermes 实时连接，请在 Electron 运行态里使用这个页面。");
    },
    async disconnectHermes(): Promise<StudioHermesDisconnectResult> {
      throw new Error("当前 fallback 模式未接入 Hermes 实时连接，请在 Electron 运行态里使用这个页面。");
    },
    subscribeHermesEvents(): () => void {
      return () => {};
    },
    async getHostExecutorState(): Promise<StudioHostExecutorState> {
      return mockShellState.boundary.hostExecutor;
    },
    async getHostBridgeState(): Promise<StudioHostBridgeState> {
      return mockShellState.boundary.hostExecutor.bridge;
    },
    async handoffHostPreview(_itemId: string, _actionId: string): Promise<StudioHostPreviewHandoff | null> {
      return null;
    },
    async getRuntimeItemDetail(_itemId: string): Promise<StudioRuntimeDetail | null> {
      return null;
    },
    async runRuntimeItemAction(_itemId: string, _actionId: string): Promise<StudioRuntimeActionResult | null> {
      return null;
    },
    async sendHermesMessage(_sessionId: string, _content: string): Promise<StudioHermesSendMessageResult> {
      return {
        sent: false,
        messageId: null,
        error: "Mock mode: Hermes message sending not available"
      };
    },
    async getHermesModelCatalog(): Promise<StudioModelCatalog> {
      return fallbackModelCatalog;
    },
    async setHermesModel(): Promise<StudioModelMutationResult> {
      return {
        applied: false,
        error: "当前 fallback 模式未接入 Hermes 模型配置链。",
        catalog: fallbackModelCatalog
      };
    },
    async getPerformanceMetrics(): Promise<PerformanceMetrics> {
      return {
        cpu: {
          user: 0,
          system: 0,
          percent: 0
        },
        memory: {
          heapUsed: 0,
          heapTotal: 0,
          external: 0,
          rss: 0
        },
        process: {
          uptime: 0,
          pid: 0
        },
        system: {
          platform: "mock",
          arch: "mock",
          totalMemory: 0,
          freeMemory: 0
        },
        gpu: {
          percent: null,
          name: null,
          source: "unavailable",
          detail: "fallback runtime has no GPU sampler",
          timestamp: null
        },
        timestamp: new Date().toISOString()
      };
    },
    subscribePerformanceAlerts(): () => void {
      return () => {};
    },
    async loadHermesSessions(): Promise<import("@openclaw/shared").StudioHermesLoadSessionsResult> {
      return {
        success: true,
        sessions: [
          {
            id: "mock-session-1",
            sessionKey: "mock-session-1",
            filename: "mock-session-1.jsonl",
            label: "Mock Session 1",
            sessionLabel: "Mock Session 1",
            platform: null,
            chatType: null,
            messageCount: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        error: null
      };
    },
    async loadHermesSession(_sessionId: string): Promise<import("@openclaw/shared").StudioHermesLoadSessionResult> {
      return {
        success: true,
        messages: [
          {
            id: "mock-msg-1",
            role: "user",
            content: "Hello from mock mode",
            timestamp: new Date().toISOString()
          },
          {
            id: "mock-msg-2",
            role: "assistant",
            content: "This is a mock response",
            timestamp: new Date().toISOString()
          }
        ],
        error: null
      };
    },
    async getHermesSessions(): Promise<import("@openclaw/shared").StudioHermesLoadSessionsResult> {
      return {
        success: true,
        sessions: [
          {
            id: "mock-session-1",
            sessionKey: "mock-session-1",
            filename: "mock-session-1.jsonl",
            label: "Mock Session 1",
            sessionLabel: "Mock Session 1",
            platform: null,
            chatType: null,
            messageCount: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        error: null
      };
    },
    async getHermesMessages(_sessionId: string): Promise<import("@openclaw/shared").StudioHermesLoadSessionResult> {
      return {
        success: true,
        messages: [
          {
            id: "mock-msg-1",
            role: "user",
            content: "Hello from mock mode",
            timestamp: new Date().toISOString()
          },
          {
            id: "mock-msg-2",
            role: "assistant",
            content: "This is a mock response",
            timestamp: new Date().toISOString()
          }
        ],
        error: null
      };
    },
  };
}
