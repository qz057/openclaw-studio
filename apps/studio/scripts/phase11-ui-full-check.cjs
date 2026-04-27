const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");
const WebSocket = require("ws");

const PAGES = [
  { id: "dashboard", label: "总览", hash: "dashboard" },
  { id: "chat", label: "会话", hash: "session" },
  { id: "sessions", label: "历史", hash: "history" },
  { id: "skills", label: "能力", hash: "capabilities" },
  { id: "settings", label: "配置", hash: "settings" },
  { id: "agents", label: "高级诊断", hash: "diagnostics" }
];

const REMOVED_NAV_LABELS = ["Hermes", "Claude", "Codex", "代理", "Home"];
const PRIMARY_COMMAND_LABELS = ["打开总览", "打开会话", "打开历史", "打开能力", "打开配置", "打开高级诊断"];
const REMOVED_COMMAND_LABELS = ["打开 Home", "打开 Codex", "打开 Claude", "打开 Hermes", "打开代理"];
const MAIN_PAGE_FORBIDDEN_TERMS = ["preview-host", "withheld", "Phase60", "placeholder"];
const VISIBLE_ENGLISH_PHRASES = [
  "Bias the shell",
  "Focus the right rail",
  "Move the shell",
  "Settings now reads",
  "Shell mode and integration posture",
  "Connector-adjacent runtime",
  "No dedicated MCP roots",
  "standard profile",
  "exec ask/always",
  "OpenClaw tool profile",
  "OpenClaw plugin runtime",
  "Runtime connector lane",
  "Active Agents",
  "Waiting Lanes",
  "Shell Integrator",
  "Bridge Watcher",
  "Execution Readiness Snapshot",
  "focused slot handoff",
  "delivery anchor",
  "review closeout",
  "resume anchor",
  "Review Deck",
  "Trace Deck",
  "Operator Shell",
  "Boundary Contract",
  "Focused Slot Trace",
  "Studio Alpha bootstrap",
  "Fallback active",
  "Operational",
  "Offline smoke",
  "Recent sessions",
  "Codex tasks",
  "This operation was aborted",
  "Just now",
  "min ago",
  "hr ago",
  "updated navigation",
  "queued live probes",
  "local-only",
  "in-review",
  "runtime sampled",
  "latest batch",
  "runtime connected",
  "snapshot / service",
  "GPU utilization",
  "MODEL ROUTES",
  "TASK MIX",
  "COLLECTORS",
  "MONO STREAM",
  "CLAUDE LIVE"
];

const DANGEROUS_BUTTON_PATTERNS = [
  /停止/,
  /删除/,
  /卸载/,
  /断开/,
  /发送到/,
  /^发送$/,
  /重试发送/,
  /启动网关/,
  /停止网关/,
  /新建会话/,
  /应用模型/,
  /连接 Hermes/
];

const SAFE_BUTTON_PATTERNS = [
  /刷新/,
  /打开命令面板/,
  /收起/,
  /展开/,
  /检查/,
  /追踪/,
  /窗口/,
  /推进流程/,
  /定位/,
  /查看/,
  /打开$/,
  /详情/,
  /清空/,
  /返回当前会话/
];

const PAGE_ROUTE_CHANGING_BUTTON_PATTERNS = {
  sessions: [
    /继续/,
    /查看/,
    /打开命令面板/,
    /Focused Slot Trace/,
    /聚焦槽位追踪/,
    /Boundary Contract/,
    /边界契约/,
    /Operator Shell/,
    /操作壳层/,
    /Trace Deck/,
    /轨迹台/,
    /Review Deck/,
    /审查台/,
    /聚焦应用槽位/,
    /^打开$/,
    /^立即进入$/,
    /^执行$/
  ]
};

const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_PAGE_WAIT_MS = 500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mkdirp(target) {
  fs.mkdirSync(target, { recursive: true });
}

function hashBuffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex").toUpperCase();
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : null;
      server.close(() => {
        if (!port) {
          reject(new Error("Could not allocate a local port."));
          return;
        }
        resolve(port);
      });
    });
    server.on("error", reject);
  });
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        if ((response.statusCode ?? 500) >= 400) {
          reject(new Error(`GET ${url} failed with status ${response.statusCode}: ${body}`));
          return;
        }

        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on("error", reject);
    request.setTimeout(2000, () => {
      request.destroy(new Error(`GET ${url} timed out`));
    });
  });
}

async function waitForDebugTarget(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const list = await requestJson(`http://127.0.0.1:${port}/json/list`);
      const page = list.find((entry) => entry.type === "page" && entry.webSocketDebuggerUrl) ?? list.find((entry) => entry.webSocketDebuggerUrl);

      if (page) {
        return page;
      }
    } catch (error) {
      lastError = error;
    }

    await sleep(300);
  }

  throw new Error(`Timed out waiting for Electron CDP target on port ${port}: ${lastError?.message ?? "no response"}`);
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
    this.consoleMessages = [];
    this.pageErrors = [];
    this.ws.on("message", (raw) => {
      const message = JSON.parse(raw.toString("utf8"));

      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);

        if (message.error) {
          reject(new Error(message.error.message));
          return;
        }

        resolve(message.result ?? {});
        return;
      }

      this.events.push(message);

      if (message.method === "Runtime.consoleAPICalled") {
        const args = message.params?.args ?? [];
        this.consoleMessages.push({
          type: message.params?.type ?? "unknown",
          text: args.map((arg) => arg.value ?? arg.description ?? "").join(" "),
          timestamp: new Date().toISOString()
        });
      }

      if (message.method === "Runtime.exceptionThrown") {
        this.pageErrors.push({
          text: message.params?.exceptionDetails?.text ?? "Runtime exception",
          exception: message.params?.exceptionDetails?.exception?.description ?? null,
          timestamp: new Date().toISOString()
        });
      }

      if (message.method === "Log.entryAdded") {
        const entry = message.params?.entry;

        if (entry?.level === "error") {
          this.consoleMessages.push({
            type: "log-error",
            text: entry.text,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
  }

  async open(timeoutMs = 10_000) {
    if (this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("CDP websocket open timed out")), timeoutMs);
      this.ws.once("open", () => {
        clearTimeout(timeout);
        resolve();
      });
      this.ws.once("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  command(method, params = {}) {
    const id = this.nextId++;
    const payload = JSON.stringify({ id, method, params });

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(payload);
    });
  }

  async evaluate(expression, options = {}) {
    const result = await this.command("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: Boolean(options.userGesture)
    });

    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text ?? "Runtime evaluation failed");
    }

    return result.result?.value;
  }

  close() {
    try {
      this.ws.close();
    } catch {
      // Best-effort only.
    }
  }
}

function terminateChild(child) {
  if (!child?.pid) {
    return;
  }

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
    return;
  }

  child.kill("SIGKILL");
}

async function waitForChildExit(child, timeoutMs = 5_000) {
  if (!child?.pid || child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  await new Promise((resolve) => {
    const timeout = setTimeout(resolve, timeoutMs);
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

async function cleanupDirectoryWithRetry(targetPath) {
  let lastError = null;

  for (let attempt = 0; attempt < 14; attempt += 1) {
    try {
      fs.rmSync(targetPath, {
        recursive: true,
        force: true,
        maxRetries: 2,
        retryDelay: 250
      });

      if (!fs.existsSync(targetPath)) {
        return null;
      }
    } catch (error) {
      lastError = error;
    }

    await sleep(500);
  }

  return lastError ?? new Error(`Directory still exists: ${targetPath}`);
}

async function waitForAppReady(cdp) {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    const ready = await cdp.evaluate(`(() => {
      const root = document.querySelector("#root");
      const text = document.body?.innerText ?? "";
      return Boolean(root && text.length > 80 && document.querySelector(".left-nav"));
    })()`);

    if (ready) {
      return;
    }

    await sleep(250);
  }

  throw new Error("Timed out waiting for Studio shell to render.");
}

async function getClickableCenter(cdp, selector, text, index = 0) {
  return cdp.evaluate(
    `(() => {
      const normalize = (value) => (value || "").replace(/\\s+/g, " ").trim();
      const elements = Array.from(document.querySelectorAll(${JSON.stringify(selector)}))
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && !element.disabled;
        })
        .filter((element) => normalize(element.innerText || element.textContent).includes(${JSON.stringify(text)}));
      const element = elements[${index}] || null;
      if (!element) return null;
      element.scrollIntoView({ block: "center", inline: "center" });
      const rect = element.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height,
        text: normalize(element.innerText || element.textContent),
        tag: element.tagName,
        className: element.className
      };
    })()`
  );
}

async function realClick(cdp, selector, text, options = {}) {
  const center = await getClickableCenter(cdp, selector, text, options.index ?? 0);

  if (!center) {
    return {
      clicked: false,
      reason: `No clickable element matched ${selector} / ${text}`
    };
  }

  await cdp.command("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: center.x,
    y: center.y,
    button: "none"
  });
  await cdp.command("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: center.x,
    y: center.y,
    button: "left",
    clickCount: 1
  });
  await cdp.command("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: center.x,
    y: center.y,
    button: "left",
    clickCount: 1
  });
  await sleep(options.waitMs ?? DEFAULT_PAGE_WAIT_MS);

  return {
    clicked: true,
    target: center
  };
}

async function openCommandPaletteWithShortcut(cdp, options = {}) {
  await cdp.command("Input.dispatchKeyEvent", {
    type: "keyDown",
    windowsVirtualKeyCode: 75,
    code: "KeyK",
    key: "k",
    modifiers: 2
  });
  await cdp.command("Input.dispatchKeyEvent", {
    type: "keyUp",
    windowsVirtualKeyCode: 75,
    code: "KeyK",
    key: "k",
    modifiers: 2
  });
  await sleep(options.waitMs ?? DEFAULT_PAGE_WAIT_MS);

  return {
    clicked: true,
    method: "Ctrl+K"
  };
}

async function realClickNav(cdp, label) {
  const hashByLabel = {
    "总览": "dashboard",
    "会话": "session",
    "历史": "history",
    "能力": "capabilities",
    "配置": "settings",
    "高级诊断": "diagnostics"
  };
  const center = await cdp.evaluate(
    `(() => {
      const normalize = (value) => (value || "").replace(/\\s+/g, " ").trim();
      const elements = Array.from(document.querySelectorAll(".nav-item"))
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && !element.disabled;
        });
      const element = elements.find((entry) => normalize(entry.innerText || entry.textContent).startsWith(${JSON.stringify(label)})) || null;
      if (!element) return null;
      element.scrollIntoView({ block: "center", inline: "center" });
      const rect = element.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height,
        text: normalize(element.innerText || element.textContent),
        tag: element.tagName,
        className: element.className
      };
    })()`
  );

  if (!center) {
    const hash = hashByLabel[label];

    if (hash) {
      await cdp.evaluate(`(() => { window.location.hash = ${JSON.stringify(`#${hash}`)}; })()`);
      await sleep(900);

      return {
        clicked: true,
        method: "hash-fallback",
        target: null
      };
    }

    return {
      clicked: false,
      reason: `No nav item starts with ${label}`
    };
  }

  await cdp.command("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: center.x,
    y: center.y,
    button: "none"
  });
  await cdp.command("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: center.x,
    y: center.y,
    button: "left",
    clickCount: 1
  });
  await cdp.command("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: center.x,
    y: center.y,
    button: "left",
    clickCount: 1
  });
  await sleep(900);

  return {
    clicked: true,
    target: center
  };
}

async function typeIntoFirstField(cdp, text) {
  const target = await cdp.evaluate(`(() => {
    const field = Array.from(document.querySelectorAll("textarea, input:not([type='hidden'])"))
      .find((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && !element.disabled && !element.readOnly;
      });
    if (!field) return null;
    field.scrollIntoView({ block: "center", inline: "center" });
    const rect = field.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      tag: field.tagName,
      placeholder: field.getAttribute("placeholder") || "",
      valueLength: field.value?.length ?? 0
    };
  })()`);

  if (!target) {
    return {
      typed: false,
      reason: "No editable field found"
    };
  }

  await cdp.command("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: target.x,
    y: target.y,
    button: "left",
    clickCount: 1
  });
  await cdp.command("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: target.x,
    y: target.y,
    button: "left",
    clickCount: 1
  });
  await cdp.command("Input.dispatchKeyEvent", {
    type: "keyDown",
    modifiers: 2,
    windowsVirtualKeyCode: 65,
    code: "KeyA",
    key: "a"
  });
  await cdp.command("Input.dispatchKeyEvent", {
    type: "keyUp",
    modifiers: 2,
    windowsVirtualKeyCode: 65,
    code: "KeyA",
    key: "a"
  });
  await cdp.command("Input.insertText", { text });
  await sleep(300);

  const value = await cdp.evaluate(`(() => {
    const active = document.activeElement;
    return active && "value" in active ? active.value : null;
  })()`);

  return {
    typed: value === text,
    target,
    valueLength: typeof value === "string" ? value.length : null
  };
}

async function collectUiState(cdp) {
  return cdp.evaluate(`(() => {
    const normalize = (value) => (value || "").replace(/\\s+/g, " ").trim();
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const buttons = Array.from(document.querySelectorAll("button"))
      .filter(visible)
      .map((button, index) => ({
        index,
        text: normalize(button.innerText || button.textContent),
        disabled: Boolean(button.disabled),
        className: String(button.className || "")
      }))
      .filter((button) => button.text.length > 0);
    const fields = Array.from(document.querySelectorAll("textarea, input:not([type='hidden']), select"))
      .filter(visible)
      .map((field) => ({
        tag: field.tagName,
        placeholder: field.getAttribute("placeholder") || "",
        disabled: Boolean(field.disabled),
        readOnly: Boolean(field.readOnly),
        valueLength: "value" in field ? String(field.value || "").length : null
      }));
    const activeNav = Array.from(document.querySelectorAll(".nav-item--active"))
      .map((element) => normalize(element.innerText || element.textContent));
    const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
      .filter(visible)
      .slice(0, 12)
      .map((heading) => normalize(heading.innerText || heading.textContent));
    const bodyText = normalize(document.body?.innerText ?? "");
    const internalTermContexts = [];
    const internalTermRegex = /preview-host|withheld|Phase60|placeholder/gi;
    let internalTermMatch = null;
    while ((internalTermMatch = internalTermRegex.exec(bodyText)) && internalTermContexts.length < 8) {
      internalTermContexts.push(bodyText.slice(Math.max(0, internalTermMatch.index - 80), internalTermMatch.index + internalTermMatch[0].length + 80));
    }
    const visibleEnglishPhrases = ${JSON.stringify(VISIBLE_ENGLISH_PHRASES)};
    const visibleEnglishMatches = visibleEnglishPhrases.filter((phrase) => bodyText.toLowerCase().includes(phrase.toLowerCase())).slice(0, 12);
    const visibleEnglishContexts = visibleEnglishMatches.map((phrase) => {
      const index = bodyText.toLowerCase().indexOf(phrase.toLowerCase());
      return bodyText.slice(Math.max(0, index - 70), index + phrase.length + 70);
    });
    return {
      hash: window.location.hash,
      title: document.title,
      bodyLength: bodyText.length,
      bodyPreview: bodyText.slice(0, 500),
      activeNav,
      headings,
      buttons,
      fields,
      modalOpen: Boolean(document.querySelector('[role="dialog"], .command-palette, .command-palette-shell')),
      stuckLoading: /正在加载/.test(bodyText) && bodyText.length < 120,
      hasBlankRoot: !document.querySelector("#root")?.childElementCount,
      reactCrashText: /Minified React error|Cannot read properties of|Unhandled Runtime Error|ReferenceError|TypeError/.test(bodyText),
      hasObjectObjectText: bodyText.includes("[object Object]"),
      hasNaNText: /(^|\\s)NaN($|\\s|%)/.test(bodyText),
      hasOldLiveSessionTitle: bodyText.includes("Codex 实时会话") || bodyText.includes("Claude 实时会话"),
      hasClaudeCodeTitle: bodyText.includes("Claude Code"),
      internalTermMatches: Array.from(new Set(bodyText.match(/preview-host|withheld|Phase60|placeholder/gi) || [])).slice(0, 8),
      internalTermContexts,
      visibleEnglishMatches,
      visibleEnglishContexts,
      hasGatewayControl: bodyText.includes("Gateway 控制") || bodyText.includes("刷新网关"),
      hasModelControl: bodyText.includes("模型设置") || bodyText.includes("待应用模型") || bodyText.includes("应用模型"),
      hasChatOperationResult: bodyText.includes("发送结果") && bodyText.includes("应用结果"),
      hasDiagnosticsTabs: bodyText.includes("运行态探针") && bodyText.includes("桥接与 IPC") && bodyText.includes("安全边界")
    };
  })()`);
}

async function collectCommandPaletteState(cdp) {
  return cdp.evaluate(`(() => {
    const normalize = (value) => (value || "").replace(/\\s+/g, " ").trim();
    const root = document.querySelector(".command-palette");
    if (!root) {
      return {
        open: false,
        entries: [],
        contexts: [],
        internalTermMatches: [],
        visibleEnglishMatches: [],
        removedCommandMatches: [],
        primaryCommandMatches: []
      };
    }
    const bodyText = normalize(root.innerText || root.textContent);
    const entries = Array.from(root.querySelectorAll(".command-palette__item"))
      .map((item) => normalize(item.innerText || item.textContent))
      .filter(Boolean);
    const contexts = Array.from(root.querySelectorAll(".command-context-pill"))
      .map((item) => normalize(item.innerText || item.textContent))
      .filter(Boolean);
    const primaryLabels = ${JSON.stringify(PRIMARY_COMMAND_LABELS)};
    const removedLabels = ${JSON.stringify(REMOVED_COMMAND_LABELS)};
    const visibleEnglishPhrases = ${JSON.stringify(VISIBLE_ENGLISH_PHRASES)};
    return {
      open: true,
      entries,
      contexts,
      bodyPreview: bodyText.slice(0, 700),
      internalTermMatches: Array.from(new Set(bodyText.match(/preview-host|withheld|Phase60|placeholder/gi) || [])).slice(0, 8),
      visibleEnglishMatches: visibleEnglishPhrases.filter((phrase) => bodyText.toLowerCase().includes(phrase.toLowerCase())).slice(0, 12),
      removedCommandMatches: removedLabels.filter((label) => bodyText.includes(label)),
      primaryCommandMatches: primaryLabels.filter((label) => bodyText.includes(label))
    };
  })()`);
}

function isDangerousButton(text) {
  return DANGEROUS_BUTTON_PATTERNS.some((pattern) => pattern.test(text));
}

function isSafeButton(text) {
  return SAFE_BUTTON_PATTERNS.some((pattern) => pattern.test(text)) && !isDangerousButton(text);
}

function isRouteChangingButton(pageId, text) {
  return (PAGE_ROUTE_CHANGING_BUTTON_PATTERNS[pageId] ?? []).some((pattern) => pattern.test(text));
}

async function clickSafePageButtons(cdp, pageId) {
  const before = await collectUiState(cdp);
  const candidates = before.buttons
    .filter((button) => !button.disabled)
    .filter((button) => isSafeButton(button.text))
    .filter((button) => !isRouteChangingButton(pageId, button.text))
    .slice(0, 4);
  const skipped = before.buttons
    .filter((button) => !button.disabled)
    .filter((button) => isDangerousButton(button.text) || isRouteChangingButton(pageId, button.text))
    .map((button) => button.text);
  const clicked = [];

  for (const candidate of candidates) {
    const result = await realClick(cdp, "button", candidate.text, { waitMs: 450 });
    clicked.push({
      text: candidate.text,
      result
    });

    if (candidate.text.includes("打开命令面板")) {
      await cdp.command("Input.dispatchKeyEvent", {
        type: "keyDown",
        windowsVirtualKeyCode: 27,
        code: "Escape",
        key: "Escape"
      });
      await cdp.command("Input.dispatchKeyEvent", {
        type: "keyUp",
        windowsVirtualKeyCode: 27,
        code: "Escape",
        key: "Escape"
      });
      await sleep(250);
    }
  }

  return {
    clicked,
    skippedDangerous: [...new Set(skipped)].slice(0, 12),
    pageId
  };
}

async function screenshot(cdp, outputPath) {
  const result = await cdp.command("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false
  });
  const buffer = Buffer.from(result.data, "base64");
  fs.writeFileSync(outputPath, buffer);

  return {
    path: outputPath,
    size: buffer.length,
    sha256: hashBuffer(buffer)
  };
}

async function main() {
  if (process.platform !== "win32") {
    throw new Error("Phase 11 UI full check must run on Windows because this validates the Windows Electron app.");
  }

  const appRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(appRoot, "..", "..");
  const deliveryRoot = path.join(repoRoot, "delivery");
  const reportFileName = process.env.STUDIO_UI_FULL_CHECK_REPORT_NAME || "phase11-ui-full-check-20260426.json";
  const screenshotDirName = process.env.STUDIO_UI_FULL_CHECK_SCREENSHOT_DIR || "phase11-ui-screenshots-20260426";
  const screenshotRoot = path.join(deliveryRoot, screenshotDirName);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-studio-ui-full-check-"));
  const timeoutMs = Number.parseInt(process.env.STUDIO_UI_FULL_CHECK_TIMEOUT_MS ?? `${DEFAULT_TIMEOUT_MS}`, 10);
  const port = await findFreePort();
  const explicitExe = process.env.STUDIO_UI_FULL_CHECK_EXE ? path.resolve(process.env.STUDIO_UI_FULL_CHECK_EXE) : null;
  const preferPackaged = process.env.STUDIO_UI_FULL_CHECK_PACKAGED === "1";
  const packagedExe = path.join(appRoot, "release", "win-unpacked", "OpenClaw Studio.exe");
  const sourceElectronPath = require("electron");
  const launchTarget = explicitExe
    ? {
        mode: "explicit-packaged",
        command: explicitExe,
        args: [`--remote-debugging-port=${port}`, `--user-data-dir=${userDataDir}`],
        cwd: path.dirname(explicitExe)
      }
    : preferPackaged && fs.existsSync(packagedExe)
    ? {
        mode: "packaged",
        command: packagedExe,
        args: [`--remote-debugging-port=${port}`, `--user-data-dir=${userDataDir}`],
        cwd: path.dirname(packagedExe)
      }
    : {
        mode: "source",
        command: sourceElectronPath,
        args: [`--remote-debugging-port=${port}`, `--user-data-dir=${userDataDir}`, "."],
        cwd: appRoot
      };
  const report = {
    generatedAt: new Date().toISOString(),
    status: "failed",
    host: {
      platform: process.platform,
      arch: process.arch,
      hostname: os.hostname()
    },
    runtime: {
      launchMode: launchTarget.mode,
      launchCommand: launchTarget.command,
      appRoot,
      userDataDir,
      cdpPort: port
    },
    pages: [],
    globalInteractions: [],
    screenshots: [],
    consoleErrors: [],
    pageErrors: [],
    warnings: [],
    failures: []
  };
  let child = null;
  let cdp = null;

  mkdirp(deliveryRoot);
  fs.rmSync(screenshotRoot, { recursive: true, force: true });
  mkdirp(screenshotRoot);

  const finishReport = () => {
    const reportPath = path.join(deliveryRoot, reportFileName);
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    return reportPath;
  };

  const timeoutHandle = setTimeout(() => {
    report.failures.push(`Phase 11 UI full check exceeded ${timeoutMs}ms.`);
    terminateChild(child);
    const reportPath = finishReport();
    console.error(`Phase 11 UI full check timed out. Report: ${reportPath}`);
    process.exit(1);
  }, timeoutMs);

  try {
    child = spawn(launchTarget.command, launchTarget.args, {
      cwd: launchTarget.cwd,
      stdio: "ignore",
      windowsHide: true,
      env: {
        ...process.env,
        OPENCLAW_STUDIO_USER_DATA_DIR: userDataDir
      }
    });

    const target = await waitForDebugTarget(port, 30_000);
    cdp = new CdpClient(target.webSocketDebuggerUrl);
    await cdp.open();
    await cdp.command("Runtime.enable");
    await cdp.command("Page.enable");
    await cdp.command("Log.enable");
    await cdp.command("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false
    });
    await waitForAppReady(cdp);

    const initialState = await collectUiState(cdp);
    report.globalInteractions.push({
      name: "initial-render",
      state: initialState
    });

    const commandPaletteClick = await openCommandPaletteWithShortcut(cdp, { waitMs: 500 });
    const commandPaletteState = await collectCommandPaletteState(cdp);
    report.globalInteractions.push({
      name: "open-command-palette",
      result: commandPaletteClick,
      state: await collectUiState(cdp),
      paletteState: commandPaletteState
    });
    if (!commandPaletteClick.clicked) {
      report.failures.push(`Command palette shortcut failed: ${commandPaletteClick.reason}`);
    }
    if (!commandPaletteState.open) {
      report.failures.push("Command palette did not open after clicking the launcher.");
    }
    const missingPrimaryCommands = PRIMARY_COMMAND_LABELS.filter((label) => !commandPaletteState.primaryCommandMatches.includes(label));
    if (missingPrimaryCommands.length > 0) {
      report.failures.push(`Command palette is missing primary entries: ${missingPrimaryCommands.join(", ")}`);
    }
    if (commandPaletteState.removedCommandMatches.length > 0) {
      report.failures.push(`Command palette still exposes removed entries: ${commandPaletteState.removedCommandMatches.join(", ")}`);
    }
    if (commandPaletteState.internalTermMatches.length > 0) {
      report.failures.push(`Command palette exposes internal terms: ${commandPaletteState.internalTermMatches.join(", ")}`);
    }
    if (commandPaletteState.visibleEnglishMatches.length > 0) {
      report.failures.push(`Command palette exposes untranslated user-facing phrases: ${commandPaletteState.visibleEnglishMatches.join(", ")}`);
    }
    await cdp.command("Input.dispatchKeyEvent", {
      type: "keyDown",
      windowsVirtualKeyCode: 27,
      code: "Escape",
      key: "Escape"
    });
    await cdp.command("Input.dispatchKeyEvent", {
      type: "keyUp",
      windowsVirtualKeyCode: 27,
      code: "Escape",
      key: "Escape"
    });
    await sleep(300);

    for (const page of PAGES) {
      const beforeErrors = cdp.pageErrors.length;
      const beforeConsoleErrors = cdp.consoleMessages.filter((entry) => ["error", "log-error", "assert"].includes(entry.type)).length;
      const navResult = await realClickNav(cdp, page.label);
      const stateAfterNav = await collectUiState(cdp);
      const pagePaletteClick = await openCommandPaletteWithShortcut(cdp, { waitMs: 350 });
      const pagePaletteState = await collectCommandPaletteState(cdp);
      await cdp.command("Input.dispatchKeyEvent", {
        type: "keyDown",
        windowsVirtualKeyCode: 27,
        code: "Escape",
        key: "Escape"
      });
      await cdp.command("Input.dispatchKeyEvent", {
        type: "keyUp",
        windowsVirtualKeyCode: 27,
        code: "Escape",
        key: "Escape"
      });
      await sleep(250);
      const typed = page.id === "chat" ? await typeIntoFirstField(cdp, `Phase 11 UI smoke ${page.id}`) : { typed: false, reason: "No chat input expected on this page" };
      const interactions = await clickSafePageButtons(cdp, page.id);
      const finalState = await collectUiState(cdp);
      const shot = await screenshot(cdp, path.join(screenshotRoot, `${page.id}.png`));
      const pageFailures = [];

      if (!navResult.clicked) {
        pageFailures.push(`Navigation click failed for ${page.label}: ${navResult.reason}`);
      }

      if (!stateAfterNav.hash.includes(page.hash)) {
        pageFailures.push(`Expected hash after nav to include ${page.hash}, actual ${stateAfterNav.hash}`);
      }

      if (!pagePaletteClick.clicked || !pagePaletteState.open) {
        pageFailures.push(`Command palette did not open on ${page.label}: ${pagePaletteClick.reason ?? "not open"}`);
      }

      if (pagePaletteState.internalTermMatches.length > 0) {
        pageFailures.push(`Command palette on ${page.label} exposes internal terms: ${pagePaletteState.internalTermMatches.join(", ")}`);
      }

      if (pagePaletteState.visibleEnglishMatches.length > 0) {
        pageFailures.push(`Command palette on ${page.label} exposes untranslated phrases: ${pagePaletteState.visibleEnglishMatches.join(", ")}`);
      }

      const removedNavItems = finalState.buttons.filter(
        (button) => button.className.includes("nav-item") && REMOVED_NAV_LABELS.some((label) => button.text.includes(label))
      );
      if (removedNavItems.length > 0) {
        pageFailures.push(`Removed nav items are still visible: ${removedNavItems.map((button) => button.text).join(", ")}`);
      }

      if (finalState.bodyLength < 120) {
        pageFailures.push(`Page ${page.id} rendered too little text (${finalState.bodyLength}).`);
      }

      if (finalState.hasBlankRoot) {
        pageFailures.push(`Page ${page.id} has blank React root.`);
      }

      if (finalState.stuckLoading) {
        pageFailures.push(`Page ${page.id} appears stuck in loading state.`);
      }

      if (finalState.reactCrashText) {
        pageFailures.push(`Page ${page.id} contains crash-like text.`);
      }

      if (finalState.hasObjectObjectText) {
        pageFailures.push(`Page ${page.id} contains raw [object Object] text.`);
      }

      if (finalState.hasNaNText) {
        pageFailures.push(`Page ${page.id} contains raw NaN text.`);
      }

      if (finalState.internalTermMatches.length > 0) {
        pageFailures.push(`Page ${page.id} exposes internal terms: ${finalState.internalTermMatches.join(", ")}.`);
      }

      if (finalState.visibleEnglishMatches.length > 0) {
        pageFailures.push(`Page ${page.id} exposes untranslated phrases: ${finalState.visibleEnglishMatches.join(", ")}.`);
      }

      if (page.id === "dashboard" && finalState.hasOldLiveSessionTitle) {
        pageFailures.push("Dashboard still contains removed live-session title text.");
      }

      if (page.id === "dashboard" && !finalState.hasClaudeCodeTitle) {
        pageFailures.push("Dashboard is missing Claude Code stream title.");
      }

      if (page.id === "chat") {
        if (!typed.typed) {
          pageFailures.push(`Chat input was not editable: ${typed.reason ?? "value did not update"}`);
        }
        if (!finalState.hasGatewayControl) {
          pageFailures.push("Chat page is missing gateway control entry.");
        }
        if (!finalState.hasModelControl) {
          pageFailures.push("Chat page is missing model settings entry.");
        }
        if (!finalState.hasChatOperationResult) {
          pageFailures.push("Chat page is missing operation result panels.");
        }
      }

      if (page.id === "agents" && !finalState.hasDiagnosticsTabs) {
        pageFailures.push("Advanced diagnostics page is missing the runtime / IPC / boundary tabs.");
      }

      const afterErrors = cdp.pageErrors.length;
      const afterConsoleErrors = cdp.consoleMessages.filter((entry) => ["error", "log-error", "assert"].includes(entry.type)).length;

      if (afterErrors > beforeErrors) {
        pageFailures.push(`Page ${page.id} produced ${afterErrors - beforeErrors} runtime exception(s).`);
      }

      if (afterConsoleErrors > beforeConsoleErrors) {
        report.warnings.push(`Page ${page.id} produced ${afterConsoleErrors - beforeConsoleErrors} console error log(s); see consoleErrors.`);
      }

      if (!finalState.hash.includes(page.hash)) {
        report.warnings.push(`Page ${page.id} interactions changed route from ${stateAfterNav.hash} to ${finalState.hash}.`);
        await realClickNav(cdp, page.label);
      }

      report.screenshots.push(shot);
      report.pages.push({
        id: page.id,
        label: page.label,
        navResult,
        stateAfterNav,
        pagePaletteClick,
        pagePaletteState,
        typed,
        interactions,
        finalState,
        screenshot: shot,
        failures: pageFailures
      });
      report.failures.push(...pageFailures);
    }

    report.consoleErrors = cdp.consoleMessages.filter((entry) => ["error", "log-error", "assert"].includes(entry.type));
    report.pageErrors = cdp.pageErrors;
    for (const entry of report.consoleErrors) {
      report.failures.push(`Console error: ${entry.text}`);
    }
    report.status = report.failures.length === 0 && report.pageErrors.length === 0 ? "passed" : "failed";
  } finally {
    clearTimeout(timeoutHandle);
    cdp?.close();
    terminateChild(child);
    await waitForChildExit(child);
    const cleanupError = await cleanupDirectoryWithRetry(userDataDir);

    if (cleanupError && fs.existsSync(userDataDir)) {
      report.warnings.push(`Could not remove temp user data dir: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
    }
  }

  const reportPath = finishReport();

  if (report.status !== "passed") {
    console.error(`Phase 11 UI full check failed. Report: ${reportPath}`);
    for (const failure of report.failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(`Phase 11 UI full check passed. Report: ${reportPath}`);
  console.log(`Pages: ${report.pages.length}; screenshots: ${report.screenshots.length}; warnings: ${report.warnings.length}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(`Phase 11 UI full check failed: ${message}`);
  process.exit(1);
});
