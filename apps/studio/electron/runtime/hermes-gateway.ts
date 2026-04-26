/**
 * Hermes Gateway Connection Manager
 *
 * 实现真实的 Hermes 网关连接功能，支持：
 * - WebSocket 连接到本地 Hermes 网关
 * - 事件订阅和消息推送
 * - 自动重连机制
 * - 连接状态管理
 */

import { EventEmitter } from "node:events";
import { spawn } from "node:child_process";
import type { StudioHermesEvent } from "@openclaw/shared";
import { loadHermesState } from "./probes/hermes";

export interface HermesGatewayConfig {
  host: string;
  port: number;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

export type HermesConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting" | "error";

export interface HermesGatewayMessage {
  type: "event" | "command" | "response" | "heartbeat";
  payload: unknown;
  timestamp: string;
}

/**
 * 获取 WSL IP 地址（Windows 平台）
 */
// WSL IP 检测超时时间（毫秒）
const WSL_IP_DETECTION_TIMEOUT_MS = 5000;

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

async function getWslIpAddresses(): Promise<string[]> {
  if (process.platform !== "win32") {
    return [];
  }

  return new Promise((resolve) => {
    const child = spawn("wsl.exe", ["hostname", "-I"]);
    let stdout = "";
    let resolved = false;

    const finish = () => {
      if (resolved) {
        return;
      }

      resolved = true;
      resolve(
        uniqueValues(
          stdout
            .trim()
            .split(/\s+/)
            .filter((entry) => /^\d+\.\d+\.\d+\.\d+$/.test(entry))
        )
      );
    };

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.on("exit", finish);
    child.on("error", finish);

    setTimeout(() => {
      child.kill();
      finish();
    }, WSL_IP_DETECTION_TIMEOUT_MS);
  });
}

const DEFAULT_CONFIG: HermesGatewayConfig = {
  host: "localhost",
  port: 8765,
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000
};

/**
 * Hermes Gateway Connection Manager
 */
export class HermesGatewayManager extends EventEmitter {
  private config: HermesGatewayConfig;
  private connectionState: HermesConnectionState = "disconnected";
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private ws: WebSocket | null = null;

  constructor(config?: Partial<HermesGatewayConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 获取当前连接状态
   */
  getConnectionState(): HermesConnectionState {
    return this.connectionState;
  }

  /**
   * 连接到 Hermes 网关
   */
  async connect(): Promise<boolean> {
    if (this.connectionState === "connected" || this.connectionState === "connecting") {
      return true;
    }

    this.setConnectionState("connecting");
    this.reconnectAttempts = 0;

    try {
      // 检查 Hermes 是否可用
      const hermesState = await loadHermesState();

      if (hermesState.availability === "blocked") {
        this.setConnectionState("error");
        this.emit("error", new Error("Hermes 运行时不可用"));
        return false;
      }

      // 尝试建立 WebSocket 连接
      await this.establishConnection();
      return true;
    } catch (error) {
      this.setConnectionState("error");
      this.emit("error", error);

      // 启动自动重连
      this.scheduleReconnect();
      return false;
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<boolean> {
    this.clearReconnectTimer();
    this.clearHeartbeatTimer();

    if (this.ws) {
      try {
        this.ws.close();
        this.ws = null;
      } catch (error) {
        console.error("关闭 WebSocket 连接失败:", error);
      }
    }

    this.setConnectionState("disconnected");
    this.reconnectAttempts = 0;
    return true;
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.connectionState === "connected";
  }

  /**
   * 发送消息到 Hermes 网关
   */
  async sendMessage(message: unknown): Promise<void> {
    if (this.connectionState !== "connected" || !this.ws) {
      throw new Error("未连接到 Hermes 网关");
    }

    const gatewayMessage: HermesGatewayMessage = {
      type: "command",
      payload: message,
      timestamp: new Date().toISOString()
    };

    this.ws.send(JSON.stringify(gatewayMessage));
  }

  /**
   * 建立 WebSocket 连接
   */
  private async establishConnection(): Promise<void> {
    const hosts = await this.resolveConnectionHosts();
    const errors: string[] = [];

    for (const host of hosts) {
      const url = `ws://${host}:${this.config.port}/hermes`;
      console.log(`[Hermes] 尝试连接到: ${url}`);

      try {
        await this.establishConnectionToUrl(url);
        return;
      } catch (error) {
        errors.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);

        if (this.ws) {
          try {
            this.ws.close();
          } catch {
            // Ignore cleanup errors while probing fallback endpoints.
          }
          this.ws = null;
        }
      }
    }

    throw new Error(`Hermes Gateway 连接失败：${errors.join("; ")}`);
  }

  private async resolveConnectionHosts(): Promise<string[]> {
    const configuredHost = this.config.host.trim();

    if (process.platform !== "win32" || (configuredHost !== "localhost" && configuredHost !== "127.0.0.1")) {
      return [configuredHost];
    }

    const wslIps = await getWslIpAddresses();

    if (wslIps.length > 0) {
      console.log(`[Hermes] 检测到 WSL IP: ${wslIps.join(", ")}`);
    }

    return uniqueValues(["127.0.0.1", "localhost", ...wslIps]);
  }

  private async establishConnectionToUrl(url: string): Promise<void> {
    const wsModule = await import("ws");
    const WebSocketImpl = wsModule.default;
    const socket = new WebSocketImpl(url) as unknown as WebSocket;
    this.ws = socket;

    return new Promise<void>((resolve, reject) => {
      let opened = false;
      let settled = false;

      const rejectOnce = (error: unknown) => {
        if (settled) {
          return;
        }

        settled = true;
        reject(error instanceof Error ? error : new Error(String(error)));
      };

      socket.onopen = () => {
        opened = true;
        settled = true;
        this.setConnectionState("connected");
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit("connected");
        resolve();
      };

      socket.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      socket.onerror = (error) => {
        if (!opened) {
          rejectOnce(error);
          return;
        }

        this.emit("error", error);
      };

      socket.onclose = () => {
        if (!opened) {
          rejectOnce(new Error("WebSocket closed before opening."));
          return;
        }

        this.handleDisconnect();
      };
    });
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(data: string | Buffer): void {
    try {
      const message = JSON.parse(data.toString()) as HermesGatewayMessage;

      switch (message.type) {
        case "event":
          this.emit("event", message.payload as StudioHermesEvent);
          break;
        case "response":
          this.emit("response", message.payload);
          break;
        case "heartbeat":
          // 心跳响应，保持连接活跃
          break;
        default:
          console.warn("未知的消息类型:", message.type);
      }
    } catch (error) {
      console.error("解析消息失败:", error);
    }
  }

  /**
   * 处理断开连接
   */
  private handleDisconnect(): void {
    this.clearHeartbeatTimer();

    if (this.connectionState === "connected") {
      this.emit("disconnected");
      this.scheduleReconnect();
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.setConnectionState("error");
      this.emit("error", new Error("达到最大重连次数"));
      return;
    }

    this.setConnectionState("reconnecting");
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      void this.connect();
    }, this.config.reconnectInterval);
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    this.clearHeartbeatTimer();

    this.heartbeatTimer = setInterval(() => {
      if (this.connectionState === "connected" && this.ws) {
        try {
          const heartbeat: HermesGatewayMessage = {
            type: "heartbeat",
            payload: { timestamp: Date.now() },
            timestamp: new Date().toISOString()
          };
          this.ws.send(JSON.stringify(heartbeat));
        } catch (error) {
          console.error("发送心跳失败:", error);
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * 清除重连定时器
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * 清除心跳定时器
   */
  private clearHeartbeatTimer(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 设置连接状态
   */
  private setConnectionState(state: HermesConnectionState): void {
    const oldState = this.connectionState;
    this.connectionState = state;

    if (oldState !== state) {
      this.emit("stateChange", state, oldState);
    }
  }
}

// 全局单例
let globalGatewayManager: HermesGatewayManager | null = null;

/**
 * 获取全局 Hermes 网关管理器
 */
export function getHermesGatewayManager(): HermesGatewayManager {
  if (!globalGatewayManager) {
    globalGatewayManager = new HermesGatewayManager();
  }
  return globalGatewayManager;
}

/**
 * 重置全局网关管理器（用于测试）
 */
export function resetHermesGatewayManager(): void {
  if (globalGatewayManager) {
    void globalGatewayManager.disconnect();
    globalGatewayManager = null;
  }
}
