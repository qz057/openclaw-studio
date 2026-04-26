const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const appRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(appRoot, "..", "..");
const reportPath = path.join(workspaceRoot, "delivery", "phase6-contract-audit-20260426.json");

const files = {
  shared: path.join(workspaceRoot, "packages", "shared", "src", "index.ts"),
  bridge: path.join(workspaceRoot, "packages", "bridge", "src", "index.ts"),
  fallback: path.join(workspaceRoot, "packages", "bridge", "src", "fallback.ts"),
  preload: path.join(appRoot, "electron", "preload.ts"),
  main: path.join(appRoot, "electron", "main.ts"),
  runtime: path.join(appRoot, "electron", "runtime", "studio-runtime.ts"),
  mockRuntime: path.join(appRoot, "electron", "runtime", "mock-runtime.ts"),
  packageJson: path.join(appRoot, "package.json"),
  rcManifest: path.join(workspaceRoot, "delivery", "openclaw-studio-rc-manifest-20260426.md"),
  rcSmokeReport: path.join(workspaceRoot, "delivery", "phase4-rc-smoke-20260426.json"),
  phase5Closeout: path.join(workspaceRoot, "delivery", "phase5-runtime-gateway-closeout-20260426.md")
};

const apiContracts = [
  { api: "getShellState", channel: ["shellState"], namespace: "studioRead", wrapper: "loadStudioSnapshot" },
  { api: "listSessions", channel: ["sessions"], namespace: "studioRead", wrapper: "listStudioSessions" },
  { api: "listCodexTasks", channel: ["codexTasks"], namespace: "studioRead", wrapper: "listCodexTasks" },
  { api: "getClaudeSnapshot", channel: ["claudeSnapshot"], namespace: "studioRead", wrapper: "loadClaudeSnapshot" },
  { api: "getClaudeSessionMessages", channel: ["claudeSessionMessages"], namespace: "studioRead", wrapper: "loadClaudeSessionMessages" },
  { api: "getOpenClawChatState", channel: ["openclawChatState"], namespace: "studioRead", wrapper: "loadOpenClawChatState" },
  { api: "sendOpenClawChatTurn", channel: ["openclawChatTurn"], namespace: "studioSession", wrapper: "sendOpenClawChatTurn" },
  { api: "createOpenClawChatSession", channel: ["openclawChatCreateSession"], namespace: "studioSession", wrapper: "createOpenClawChatSession" },
  { api: "getOpenClawGatewayServiceState", channel: ["openclawGatewayState"], namespace: "studioRead", wrapper: "loadOpenClawGatewayServiceState" },
  { api: "startOpenClawGatewayService", channel: ["openclawGatewayStart"], namespace: "studioGateway", wrapper: "startOpenClawGatewayService" },
  { api: "stopOpenClawGatewayService", channel: ["openclawGatewayStop"], namespace: "studioGateway", wrapper: "stopOpenClawGatewayService" },
  { api: "getOpenClawModelCatalog", channel: ["openclawChatModels"], namespace: "studioRead", wrapper: "loadOpenClawModelCatalog" },
  { api: "setOpenClawModel", channel: ["openclawChatSetModel"], namespace: "studioGateway", wrapper: "setOpenClawModel" },
  { api: "getHermesState", channel: ["hermesState"], namespace: "studioRead", wrapper: "loadHermesState" },
  { api: "getHermesSnapshot", channel: ["hermesSnapshot"], namespace: "studioRead", wrapper: "loadHermesSnapshot" },
  { api: "getHermesSessionMessages", channel: ["hermesSessionMessages"], namespace: "studioRead", wrapper: "loadHermesSessionMessages" },
  { api: "createHermesSession", channel: ["hermesCreateSession"], namespace: "studioSession", wrapper: "createHermesSession" },
  { api: "getHermesGatewayServiceState", channel: ["hermesGatewayState"], namespace: "studioRead", wrapper: "loadHermesGatewayServiceState" },
  { api: "startHermesGatewayService", channel: ["hermesGatewayStart"], namespace: "studioGateway", wrapper: "startHermesGatewayService" },
  { api: "stopHermesGatewayService", channel: ["hermesGatewayStop"], namespace: "studioGateway", wrapper: "stopHermesGatewayService" },
  { api: "connectHermes", channel: ["hermesConnect"], namespace: "studioSession", wrapper: "connectHermes" },
  { api: "disconnectHermes", channel: ["hermesDisconnect"], namespace: "studioSession", wrapper: "disconnectHermes" },
  { api: "sendHermesMessage", channel: ["hermesSendMessage"], namespace: "studioSession", wrapper: "sendHermesMessage" },
  { api: "getHermesModelCatalog", channel: ["hermesModels"], namespace: "studioRead", wrapper: "loadHermesModelCatalog" },
  { api: "setHermesModel", channel: ["hermesSetModel"], namespace: "studioGateway", wrapper: "setHermesModel" },
  { api: "subscribeHermesEvents", channel: ["hermesSubscribe", "hermesUnsubscribe", "hermesEvent"], namespace: "studioSession", wrapper: "subscribeToHermesEvents" },
  { api: "loadHermesSessions", channel: ["hermesGetSessions"], namespace: "studioRead", wrapper: "loadHermesSessions" },
  { api: "loadHermesSession", channel: ["hermesGetMessages"], namespace: "studioRead", wrapper: "loadHermesSession" },
  { api: "getHermesSessions", channel: ["hermesGetSessions"], namespace: "studioRead", wrapper: "getHermesSessions" },
  { api: "getHermesMessages", channel: ["hermesGetMessages"], namespace: "studioRead", wrapper: "getHermesMessages" },
  { api: "getHostExecutorState", channel: ["hostExecutorState"], namespace: "studioRead", wrapper: "loadHostExecutorState" },
  { api: "getHostBridgeState", channel: ["hostBridgeState"], namespace: "studioRead", wrapper: "loadHostBridgeState" },
  { api: "handoffHostPreview", channel: ["hostPreviewHandoff"], namespace: "studioRuntime", wrapper: "handoffHostPreview" },
  { api: "getRuntimeItemDetail", channel: ["runtimeItemDetail"], namespace: "studioRead", wrapper: "loadRuntimeItemDetail" },
  { api: "runRuntimeItemAction", channel: ["runtimeItemAction"], namespace: "studioRuntime", wrapper: "loadRuntimeItemAction" },
  { api: "getPerformanceMetrics", channel: ["performanceMetrics"], namespace: "studioRead", wrapper: "getPerformanceMetrics" },
  { api: "subscribePerformanceAlerts", channel: ["performanceSubscribe", "performanceUnsubscribe", "performanceAlert"], namespace: "studioRead", wrapper: "subscribeToPerformanceAlerts" }
];

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function has(source, pattern) {
  return pattern.test(source);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractStudioApiMethods(sharedSource) {
  const match = sharedSource.match(/export interface StudioApi\s*\{([\s\S]*?)\n\}/);
  if (!match) {
    throw new Error("Could not find StudioApi interface.");
  }

  const methods = [];
  const methodPattern = /^\s{2}([A-Za-z0-9_]+)\(/gm;
  let methodMatch;
  while ((methodMatch = methodPattern.exec(match[1])) !== null) {
    methods.push(methodMatch[1]);
  }
  return methods;
}

function extractStudioChannels(sharedSource) {
  const match = sharedSource.match(/export const studioChannels\s*=\s*\{([\s\S]*?)\n\} as const;/);
  if (!match) {
    throw new Error("Could not find studioChannels.");
  }

  const channels = [];
  const channelPattern = /^\s{2}([A-Za-z0-9_]+):/gm;
  let channelMatch;
  while ((channelMatch = channelPattern.exec(match[1])) !== null) {
    channels.push(channelMatch[1]);
  }
  return channels;
}

function sha256(targetPath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(targetPath));
  return hash.digest("hex").toUpperCase();
}

function size(targetPath) {
  return fs.statSync(targetPath).size;
}

function collect() {
  const sources = Object.fromEntries(Object.entries(files).map(([key, filePath]) => [key, read(filePath)]));
  const studioApiMethods = extractStudioApiMethods(sources.shared);
  const studioChannelKeys = extractStudioChannels(sources.shared);
  const expectedApiMethods = apiContracts.map((contract) => contract.api);
  const expectedChannelKeys = new Set(apiContracts.flatMap((contract) => contract.channel));
  const failures = [];
  const warnings = [];

  const untrackedApiMethods = studioApiMethods.filter((method) => !expectedApiMethods.includes(method));
  const missingApiMethods = expectedApiMethods.filter((method) => !studioApiMethods.includes(method));
  if (untrackedApiMethods.length > 0) {
    failures.push({ id: "studio-api-untracked", detail: untrackedApiMethods.join(", ") });
  }
  if (missingApiMethods.length > 0) {
    failures.push({ id: "studio-api-missing", detail: missingApiMethods.join(", ") });
  }

  const apiRows = apiContracts.map((contract) => {
    const apiPattern = new RegExp(`(?:async\\s+)?${escapeRegExp(contract.api)}\\s*\\(`);
    const bridgeWrapperPattern = new RegExp(`export\\s+async\\s+function\\s+${escapeRegExp(contract.wrapper)}\\s*\\(`);
    const bridgeCallPattern = new RegExp(`getStudioApi\\(\\)\\)\\.${escapeRegExp(contract.api)}\\s*\\(`);
    const preloadApiPattern = new RegExp(`\\b${escapeRegExp(contract.api)}\\s*\\(`);
    const namespacePattern = new RegExp(`${escapeRegExp(contract.api)}:\\s*studioApi\\.${escapeRegExp(contract.api)}\\b`);
    const channelResults = contract.channel.map((channelKey) => ({
      key: channelKey,
      declared: studioChannelKeys.includes(channelKey),
      preload: sources.preload.includes(`studioChannels.${channelKey}`),
      main: sources.main.includes(`studioChannels.${channelKey}`)
    }));
    const row = {
      api: contract.api,
      namespace: contract.namespace,
      wrapper: contract.wrapper,
      shared: studioApiMethods.includes(contract.api),
      bridgeWrapper: has(sources.bridge, bridgeWrapperPattern),
      bridgeCallsApi: has(sources.bridge, bridgeCallPattern),
      fallback: has(sources.fallback, apiPattern),
      preload: has(sources.preload, preloadApiPattern),
      namespaceExport: has(sources.preload, namespacePattern),
      mainChannels: channelResults,
      runtime: has(sources.runtime, apiPattern),
      mockRuntime: has(sources.mockRuntime, apiPattern)
    };

    for (const [field, passed] of Object.entries({
      shared: row.shared,
      bridgeWrapper: row.bridgeWrapper,
      bridgeCallsApi: row.bridgeCallsApi,
      fallback: row.fallback,
      preload: row.preload,
      namespaceExport: row.namespaceExport,
      runtime: row.runtime,
      mockRuntime: row.mockRuntime
    })) {
      if (!passed) {
        failures.push({ id: `api-${field}`, api: contract.api, detail: `${contract.api} missing ${field}` });
      }
    }

    for (const channel of channelResults) {
      if (!channel.declared || !channel.preload || !channel.main) {
        failures.push({
          id: "api-channel",
          api: contract.api,
          channel: channel.key,
          detail: JSON.stringify(channel)
        });
      }
    }

    return row;
  });

  const unusedChannelKeys = studioChannelKeys.filter((key) => !expectedChannelKeys.has(key));
  if (unusedChannelKeys.length > 0) {
    warnings.push({ id: "studio-channel-untracked", detail: unusedChannelKeys.join(", ") });
  }

  const packageJson = JSON.parse(sources.packageJson);
  for (const scriptName of ["typecheck", "test", "build", "smoke", "dist:win", "package:smoke", "phase4:rc-smoke", "contract:audit"]) {
    if (!packageJson.scripts?.[scriptName]) {
      failures.push({ id: "package-script-missing", detail: scriptName });
    }
  }

  const zipPath = path.join(appRoot, "release", "OpenClaw Studio-0.1.0-win-x64.zip");
  const exePath = path.join(appRoot, "release", "win-unpacked", "OpenClaw Studio.exe");
  const artifact = {
    zipPath,
    zipExists: fs.existsSync(zipPath),
    zipSize: fs.existsSync(zipPath) ? size(zipPath) : null,
    zipSha256: fs.existsSync(zipPath) ? sha256(zipPath) : null,
    exePath,
    exeExists: fs.existsSync(exePath),
    exeSize: fs.existsSync(exePath) ? size(exePath) : null,
    exeSha256: fs.existsSync(exePath) ? sha256(exePath) : null
  };

  if (!artifact.zipExists || !artifact.exeExists) {
    failures.push({ id: "artifact-missing", detail: JSON.stringify(artifact) });
  }

  if (artifact.zipSha256 && !sources.rcManifest.includes(artifact.zipSha256)) {
    failures.push({ id: "manifest-zip-hash-stale", detail: artifact.zipSha256 });
  }
  if (artifact.exeSha256 && !sources.rcManifest.includes(artifact.exeSha256)) {
    failures.push({ id: "manifest-exe-hash-stale", detail: artifact.exeSha256 });
  }
  if (artifact.zipSha256 && !sources.phase5Closeout.includes(artifact.zipSha256)) {
    failures.push({ id: "phase5-zip-hash-stale", detail: artifact.zipSha256 });
  }
  if (artifact.exeSha256 && !sources.phase5Closeout.includes(artifact.exeSha256)) {
    failures.push({ id: "phase5-exe-hash-stale", detail: artifact.exeSha256 });
  }

  const rcSmoke = JSON.parse(sources.rcSmokeReport);
  if (rcSmoke.artifact?.zipSha256 !== artifact.zipSha256 || rcSmoke.artifact?.exeSha256 !== artifact.exeSha256) {
    failures.push({
      id: "rc-smoke-artifact-mismatch",
      detail: JSON.stringify({
        reportZip: rcSmoke.artifact?.zipSha256,
        actualZip: artifact.zipSha256,
        reportExe: rcSmoke.artifact?.exeSha256,
        actualExe: artifact.exeSha256
      })
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    workspaceRoot,
    apiMethodCount: studioApiMethods.length,
    channelCount: studioChannelKeys.length,
    rows: apiRows,
    artifact,
    warnings,
    failures,
    passed: failures.length === 0
  };
}

function main() {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  const report = collect();
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Contract audit ${report.passed ? "passed" : "failed"}. Report: ${reportPath}`);
  console.log(`API methods: ${report.apiMethodCount}; channels: ${report.channelCount}; warnings: ${report.warnings.length}; failures: ${report.failures.length}`);
  if (!report.passed) {
    for (const failure of report.failures) {
      console.error(`${failure.id}${failure.api ? ` ${failure.api}` : ""}${failure.channel ? ` ${failure.channel}` : ""}: ${failure.detail}`);
    }
    process.exit(1);
  }
}

main();
