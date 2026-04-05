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
    };
  }

  export class BrowserWindow {
    constructor(options?: BrowserWindowOptions);
    static getAllWindows(): BrowserWindow[];
    webContents: {
      openDevTools(options?: { mode?: string }): void;
    };
    once(event: string, listener: () => void): void;
    show(): void;
    loadURL(url: string): Promise<void>;
    loadFile(path: string): Promise<void>;
  }

  export const app: {
    whenReady(): Promise<void>;
    on(event: string, listener: () => void | Promise<void>): void;
    quit(): void;
  };

  export const ipcMain: {
    handle(channel: string, listener: () => unknown | Promise<unknown>): void;
  };

  export const ipcRenderer: {
    invoke<T = unknown>(channel: string): Promise<T>;
  };

  export const contextBridge: {
    exposeInMainWorld(key: string, api: unknown): void;
  };
}
