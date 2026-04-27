import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "./test-utils";
import { HermesPage } from "../pages/HermesPage";

const createHermesSessionMock = vi.fn();
const connectHermesMock = vi.fn();
const disconnectHermesMock = vi.fn();
const getHermesMessagesMock = vi.fn();
const getHermesSessionsMock = vi.fn();
const loadOpenClawGatewayServiceStateMock = vi.fn();
const loadHermesGatewayServiceStateMock = vi.fn();
const loadHermesModelCatalogMock = vi.fn();
const loadHermesStateMock = vi.fn();
const sendHermesMessageMock = vi.fn();
const setHermesModelMock = vi.fn();
const startHermesGatewayServiceMock = vi.fn();
const stopHermesGatewayServiceMock = vi.fn();
const subscribeToHermesEventsMock = vi.fn();

vi.mock("@openclaw/bridge", () => ({
  createHermesSession: (...args: Parameters<typeof createHermesSessionMock>) => createHermesSessionMock(...args),
  connectHermes: (...args: Parameters<typeof connectHermesMock>) => connectHermesMock(...args),
  disconnectHermes: (...args: Parameters<typeof disconnectHermesMock>) => disconnectHermesMock(...args),
  getHermesMessages: (...args: Parameters<typeof getHermesMessagesMock>) => getHermesMessagesMock(...args),
  getHermesSessions: (...args: Parameters<typeof getHermesSessionsMock>) => getHermesSessionsMock(...args),
  loadOpenClawGatewayServiceState: (...args: Parameters<typeof loadOpenClawGatewayServiceStateMock>) =>
    loadOpenClawGatewayServiceStateMock(...args),
  loadHermesGatewayServiceState: (...args: Parameters<typeof loadHermesGatewayServiceStateMock>) =>
    loadHermesGatewayServiceStateMock(...args),
  loadHermesModelCatalog: (...args: Parameters<typeof loadHermesModelCatalogMock>) => loadHermesModelCatalogMock(...args),
  loadHermesState: (...args: Parameters<typeof loadHermesStateMock>) => loadHermesStateMock(...args),
  sendHermesMessage: (...args: Parameters<typeof sendHermesMessageMock>) => sendHermesMessageMock(...args),
  setHermesModel: (...args: Parameters<typeof setHermesModelMock>) => setHermesModelMock(...args),
  startHermesGatewayService: (...args: Parameters<typeof startHermesGatewayServiceMock>) =>
    startHermesGatewayServiceMock(...args),
  stopHermesGatewayService: (...args: Parameters<typeof stopHermesGatewayServiceMock>) =>
    stopHermesGatewayServiceMock(...args),
  subscribeToHermesEvents: (...args: Parameters<typeof subscribeToHermesEventsMock>) => subscribeToHermesEventsMock(...args)
}));

const baseProps = {
  bridgeStatus: "桥接已连接",
  runtimeStatus: "运行时在线",
  workspaceLabel: "默认工作区",
  readinessLabel: "Hermes 就绪",
  gatewayStatus: "网关已就绪",
  networkStatus: "网络正常"
};

function createSessionSummary(id: string) {
  return {
    id,
    sessionKey: id,
    filename: `${id}.json`,
    label: `Hermes 会话 ${id}`,
    sessionLabel: `Hermes 会话 ${id}`,
    platform: "cli",
    chatType: "direct",
    messageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function createHermesState(overrides: Record<string, unknown> = {}) {
  return {
    source: "runtime",
    availability: "connected",
    canConnect: false,
    canDisconnect: true,
    readinessLabel: "已连接",
    disabledReason: null,
    endpoint: "local",
    sessionLabel: "Hermes 会话",
    transportLabel: "Local gateway",
    authLabel: "Token available",
    lastEventAt: Date.now(),
    updatedAt: Date.now(),
    events: [],
    ...overrides
  };
}

function createGatewayState(overrides: Record<string, unknown> = {}) {
  return {
    serviceId: "hermes",
    running: true,
    statusLabel: "Hermes Gateway 运行中",
    detail: "Mock",
    source: "runtime",
    lastCheckedAt: Date.now(),
    startAllowed: false,
    stopAllowed: true,
    ...overrides
  };
}

function createModelCatalog(overrides: Record<string, unknown> = {}) {
  return {
    selectedModelId: "hermes/model-1",
    options: [
      {
        id: "hermes/model-1",
        label: "hermes/model-1",
        provider: "hermes",
        model: "model-1",
        source: "runtime"
      }
    ],
    ...overrides
  };
}

beforeEach(() => {
  localStorage.clear();

  createHermesSessionMock.mockReset();
  connectHermesMock.mockReset();
  disconnectHermesMock.mockReset();
  getHermesMessagesMock.mockReset();
  getHermesSessionsMock.mockReset();
  loadOpenClawGatewayServiceStateMock.mockReset();
  loadHermesGatewayServiceStateMock.mockReset();
  loadHermesModelCatalogMock.mockReset();
  loadHermesStateMock.mockReset();
  sendHermesMessageMock.mockReset();
  setHermesModelMock.mockReset();
  startHermesGatewayServiceMock.mockReset();
  stopHermesGatewayServiceMock.mockReset();
  subscribeToHermesEventsMock.mockReset();

  loadOpenClawGatewayServiceStateMock.mockResolvedValue(createGatewayState({ serviceId: "openclaw" }));
  loadHermesGatewayServiceStateMock.mockResolvedValue(createGatewayState());
  loadHermesModelCatalogMock.mockResolvedValue(createModelCatalog());
  loadHermesStateMock.mockResolvedValue(createHermesState());
  getHermesSessionsMock.mockResolvedValue({ success: true, sessions: [], error: null });
  getHermesMessagesMock.mockResolvedValue({ success: true, messages: [], error: null });
  sendHermesMessageMock.mockResolvedValue({ sent: true, messageId: "msg-1", error: null });
  createHermesSessionMock.mockResolvedValue(createSessionSummary("hermes-session-1"));
  connectHermesMock.mockResolvedValue({
    started: true,
    state: createHermesState()
  });
  disconnectHermesMock.mockResolvedValue({
    stopped: true,
    state: createHermesState({ availability: "disconnected", canConnect: true, canDisconnect: false })
  });
  setHermesModelMock.mockResolvedValue({
    applied: true,
    error: null,
    catalog: createModelCatalog({ selectedModelId: "hermes/model-1" })
  });
  startHermesGatewayServiceMock.mockResolvedValue({ applied: true, error: null, state: createGatewayState() });
  stopHermesGatewayServiceMock.mockResolvedValue({ applied: true, error: null, state: createGatewayState({ running: false }) });
  subscribeToHermesEventsMock.mockResolvedValue(() => {});

  Object.defineProperty(window, "requestAnimationFrame", {
    writable: true,
    value: (callback: FrameRequestCallback) => callback(performance.now())
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("HermesPage", () => {
  it("阻塞状态下应禁用发送与连接操作", async () => {
    loadHermesStateMock.mockResolvedValueOnce(createHermesState({ availability: "blocked", canConnect: false, canDisconnect: false }));
    render(<HermesPage {...baseProps} />);

    const sendButton = await screen.findByRole("button", { name: "发送到 Hermes" });
    const connectButton = await screen.findByRole("button", { name: "连接 Hermes" });
    const input = await screen.findByPlaceholderText("输入你想发送给 Hermes 的命令或问题");

    expect(sendButton).toBeDisabled();
    expect(connectButton).toBeDisabled();
    expect(input).toBeDisabled();
  });

  it("创建新会话后会立刻切到独立会话并发送消息", async () => {
    getHermesSessionsMock.mockResolvedValue({ success: true, sessions: [createSessionSummary("hermes-session-1")], error: null });
    getHermesMessagesMock.mockResolvedValueOnce({ success: true, messages: [], error: null });
    getHermesMessagesMock.mockResolvedValueOnce({ success: true, messages: [], error: null });
    createHermesSessionMock.mockResolvedValue(createSessionSummary("hermes-session-1"));
    sendHermesMessageMock.mockResolvedValueOnce({
      sent: true,
      messageId: "msg-100",
      error: null
    });

    render(<HermesPage {...baseProps} />);

    const newSessionButton = await screen.findByRole("button", { name: "新建会话" });
    await userEvent.click(newSessionButton);

    await screen.findByText("hermes-session-1");
    const sendButton = await screen.findByRole("button", { name: "发送到 Hermes" });

    const textarea = await screen.findByPlaceholderText("输入你想发送给 Hermes 的命令或问题");
    await userEvent.type(textarea, "你好，Hermes");
    await waitFor(() => expect(sendButton).toBeEnabled());
    await userEvent.click(sendButton);

    await waitFor(() => {
      expect(sendHermesMessageMock).toHaveBeenCalledWith("hermes-session-1", "你好，Hermes");
    });

    expect(createHermesSessionMock).toHaveBeenCalled();
    expect(await screen.findByText("返回当前会话")).toBeInTheDocument();
    expect(screen.getByText(/当前是独立新会话/)).toBeInTheDocument();
  });

  it("返回当前会话会恢复到新建前会话", async () => {
    const originalSession = createSessionSummary("hermes-session-1");
    const freshSession = createSessionSummary("hermes-session-2");
    const now = new Date().toISOString();

    getHermesSessionsMock.mockResolvedValue({ success: true, sessions: [originalSession], error: null });
    getHermesMessagesMock.mockResolvedValueOnce({
      success: true,
      messages: [
        {
          id: "origin-1",
          role: "assistant",
          content: "原始会话消息",
          timestamp: now
        }
      ],
      error: null
    });
    getHermesMessagesMock.mockResolvedValueOnce({ success: true, messages: [], error: null });
    getHermesMessagesMock.mockResolvedValueOnce({ success: true, messages: [], error: null });
    getHermesMessagesMock.mockResolvedValueOnce({
      success: true,
      messages: [
        {
          id: "origin-2",
          role: "assistant",
          content: "返回会话成功",
          timestamp: now
        }
      ],
      error: null
    });
    createHermesSessionMock.mockResolvedValue(freshSession);

    render(<HermesPage {...baseProps} />);

    const newSessionButton = await screen.findByRole("button", { name: "新建会话" });
    await userEvent.click(newSessionButton);
    expect(await screen.findByText(/当前是独立新会话/)).toBeInTheDocument();

    const returnButton = await screen.findByRole("button", { name: "返回当前会话" });
    await userEvent.click(returnButton);

    expect(await screen.findByText("返回会话成功")).toBeInTheDocument();
    expect(screen.queryByText(/当前是独立新会话/)).not.toBeInTheDocument();
  });

  it("发送失败时应保留重试路径", async () => {
    getHermesSessionsMock.mockResolvedValue({ success: true, sessions: [createSessionSummary("hermes-session-2")], error: null });
    getHermesMessagesMock.mockResolvedValue({ success: true, messages: [], error: null });
    sendHermesMessageMock.mockResolvedValueOnce({ sent: false, messageId: null, error: "send failed" });

    render(<HermesPage {...baseProps} />);

    const textarea = await screen.findByPlaceholderText("输入你想发送给 Hermes 的命令或问题");
    await userEvent.type(textarea, "诊断网络");

    const sendButton = await screen.findByRole("button", { name: "发送到 Hermes" });
    await userEvent.click(sendButton);

    expect(await screen.findByText("发送失败")).toBeInTheDocument();
    expect(await screen.findByText("重试发送")).toBeInTheDocument();

    sendHermesMessageMock.mockResolvedValueOnce({ sent: true, messageId: "msg-2", error: null });
    getHermesMessagesMock.mockResolvedValue({
      success: true,
      messages: [
        {
          id: "remote-2",
          role: "assistant",
          content: "恢复成功",
          timestamp: new Date().toISOString()
        }
      ],
      error: null
    });

    await userEvent.click(await screen.findByRole("button", { name: "重试发送" }));

    expect(await screen.findByText("恢复成功")).toBeInTheDocument();
    expect(sendHermesMessageMock).toHaveBeenCalledTimes(2);
  });

  it("实时事件订阅触发会拉取最新 Hermes 状态", async () => {
    subscribeToHermesEventsMock.mockImplementation(async (listener: (event: unknown) => void) => {
      return () => {};
    });

    loadHermesStateMock.mockResolvedValueOnce(createHermesState({ availability: "disconnected", canConnect: true, canDisconnect: false }));
    loadHermesStateMock.mockResolvedValueOnce(createHermesState({ availability: "connected", canConnect: false, canDisconnect: true }));
    loadHermesStateMock.mockResolvedValue({ ...createHermesState() });

    render(<HermesPage {...baseProps} />);
    const connectButton = await screen.findByRole("button", { name: "连接 Hermes" });
    await screen.findByRole("button", { name: "发送到 Hermes" });
    expect(connectButton).toBeEnabled();

    await waitFor(() => expect(subscribeToHermesEventsMock).toHaveBeenCalled());

    const subscribedHandler = subscribeToHermesEventsMock.mock.calls.at(-1)?.[0];
    if (typeof subscribedHandler === "function") {
      subscribedHandler({ type: "gateway" });
    }

    await waitFor(() => {
      expect(loadHermesStateMock).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByRole("button", { name: "连接 Hermes" })).toBeDisabled();
    expect(subscribeToHermesEventsMock).toHaveBeenCalled();
  });
});
