declare module "electron" {
  export interface BrowserWindowOptions {
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    backgroundColor?: string;
    show?: boolean;
    title?: string;
    webPreferences?: {
      preload?: string;
      contextIsolation?: boolean;
      nodeIntegration?: boolean;
      sandbox?: boolean;
    };
  }

  export interface Event {
    preventDefault(): void;
  }

  export interface WebContents {
    id: number;
    openDevTools(options?: { mode?: string }): void;
    on(event: string, listener: (...args: any[]) => void): void;
    send(channel: string, ...args: unknown[]): void;
    isDestroyed(): boolean;
    setWindowOpenHandler(handler: (details: { url: string }) => { action: "allow" | "deny" }): void;
  }

  export class BrowserWindow {
    constructor(options?: BrowserWindowOptions);
    static getAllWindows(): BrowserWindow[];
    webContents: WebContents;
    once(event: string, listener: () => void): void;
    show(): void;
    focus(): void;
    restore(): void;
    isMinimized(): boolean;
    isVisible(): boolean;
    loadURL(url: string): Promise<void>;
    loadFile(path: string): Promise<void>;
  }

  export const app: {
    whenReady(): Promise<void>;
    on(event: string, listener: (...args: any[]) => void | Promise<void>): void;
    quit(): void;
    requestSingleInstanceLock(): boolean;
    disableHardwareAcceleration(): void;
    commandLine: {
      appendSwitch(name: string): void;
    };
  };

  export const ipcMain: {
    handle(channel: string, listener: (_event: unknown, ...args: unknown[]) => unknown | Promise<unknown>): void;
  };

  export const ipcRenderer: {
    invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
  };

  export const contextBridge: {
    exposeInMainWorld(key: string, api: unknown): void;
  };

  export const session: {
    defaultSession: {
      setPermissionRequestHandler(
        handler: (webContents: WebContents, permission: string, callback: (allow: boolean) => void) => void
      ): void;
    };
  };
}
