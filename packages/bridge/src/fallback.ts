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
  type PerformanceAlert,
  type StudioDeviceBootstrapState
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
  const fallbackOpenClawMessages: StudioOpenClawChatMessage[] = [];
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
  const fallbackDeviceBootstrapState = (): StudioDeviceBootstrapState => ({
    source: "mock",
    host: {
      platform: "browser-preview",
      arch: "unknown",
      homeDir: "unavailable",
      checkedAt: Date.now()
    },
    overall: "partial",
    summary: "浏览器预览未接入 Electron 主进程，无法读取这台设备的真实 OpenClaw/Hermes 状态。",
    checks: [
      {
        id: "electron-runtime",
        label: "Electron 运行态",
        status: "missing",
        summary: "未接入",
        detail: "请在桌面应用运行态打开设置页，才能检测 WSL、OpenClaw、Hermes、gateway 与登录态。",
        evidence: "fallback mode"
      }
    ],
    commands: [
      {
        id: "open-desktop-app",
        label: "打开桌面运行态",
        shell: "manual",
        command: "启动 OpenClaw Studio 桌面版后重新进入设置页。",
        detail: "桌面运行态会通过主进程做只读本机检测。",
        safety: "read-only"
      }
    ],
    migration: {
      secretPolicy: "fallback 模式不会读取或迁移任何密钥。",
      exportPlan: ["在桌面运行态导出非敏感清单。"],
      importPlan: ["在目标设备重新安装 CLI 并重新登录。"],
      portableReadiness: "预览模式不能判断其他设备真实可用性。"
    }
  });
  const blockedHermesState: StudioHermesState = {
    source: "mock",
    availability: "blocked",
    canConnect: false,
    canDisconnect: false,
    readinessLabel: "未接入运行态",
    disabledReason: "当前 fallback 模式未接入 Hermes 实时连接，请在 Electron 运行态里使用这个页面。",
    endpoint: null,
    sessionLabel: "未连接",
    transportLabel: "未接入",
    authLabel: "未检测到认证",
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
          rootPath: "~/.claude",
          settingsPath: "~/.claude/settings.json",
          historyPath: "~/.claude/history.jsonl",
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
        readinessLabel: "未接入运行态",
        disabledReason: "当前 fallback 模式不会模拟发送。请在桌面运行态连接本机 OpenClaw 后再发送。",
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
      return {
        prompt: prompt.trim(),
        reply: "当前 fallback 模式未接入 OpenClaw 聊天执行链，消息未发送。",
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
    async getDeviceBootstrapState(): Promise<StudioDeviceBootstrapState> {
      return fallbackDeviceBootstrapState();
    },
    async sendHermesMessage(_sessionId: string, _content: string): Promise<StudioHermesSendMessageResult> {
      return {
        sent: false,
        messageId: null,
        error: "Fallback mode: Hermes message sending not available"
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
        sessions: [],
        error: null
      };
    },
    async loadHermesSession(_sessionId: string): Promise<import("@openclaw/shared").StudioHermesLoadSessionResult> {
      return {
        success: false,
        messages: [],
        error: "Fallback mode has no real Hermes session data."
      };
    },
    async getHermesSessions(): Promise<import("@openclaw/shared").StudioHermesLoadSessionsResult> {
      return {
        success: true,
        sessions: [],
        error: null
      };
    },
    async getHermesMessages(_sessionId: string): Promise<import("@openclaw/shared").StudioHermesLoadSessionResult> {
      return {
        success: false,
        messages: [],
        error: "Fallback mode has no real Hermes message data."
      };
    },
  };
}
