import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import type { StudioModelCatalog, StudioModelMutationResult, StudioModelOption } from "@openclaw/shared";

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_CAPTURE_CHARS = 128_000;
const OPENCLAW_CONFIG_PATH_SEGMENTS = [".openclaw", "openclaw.json"] as const;
const HERMES_CONFIG_PATH_SEGMENTS = [".hermes", "config.yaml"] as const;

interface CommandInvocation {
  command: string;
  args: string[];
  env: NodeJS.ProcessEnv;
  label: string;
}

interface OpenClawConfigFile {
  models?: {
    providers?: Record<string, { models?: Array<{ id?: string; name?: string }> }>;
  };
  agents?: {
    defaults?: {
      models?: Record<string, { alias?: string }>;
      model?: {
        primary?: string;
      };
    };
  };
}

function getOpenClawConfigPath(): string {
  return path.join(os.homedir(), ...OPENCLAW_CONFIG_PATH_SEGMENTS);
}

function getHermesConfigPath(): string {
  return path.join(os.homedir(), ...HERMES_CONFIG_PATH_SEGMENTS);
}

function formatProbeFailure(cause: unknown): string {
  const rawMessage = cause instanceof Error ? cause.message : String(cause);
  return (rawMessage.split(/\r?\n/).find(Boolean) ?? rawMessage).trim();
}

async function runCommandCapture(
  invocation: CommandInvocation,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxCaptureChars = MAX_CAPTURE_CHARS
): Promise<{ stdout: string; stderr: string }> {
  const stdout = { value: "" };
  const stderr = { value: "" };

  return await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(invocation.command, invocation.args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: invocation.env
    });

    const timeoutHandle = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`${invocation.label} timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout.value += chunk.toString();

      if (stdout.value.length > maxCaptureChars) {
        stdout.value = stdout.value.slice(-maxCaptureChars);
      }
    });

    child.stderr.on("data", (chunk) => {
      stderr.value += chunk.toString();

      if (stderr.value.length > maxCaptureChars) {
        stderr.value = stderr.value.slice(-maxCaptureChars);
      }
    });

    child.on("error", (error) => {
      clearTimeout(timeoutHandle);
      reject(error);
    });

    child.on("exit", (code) => {
      clearTimeout(timeoutHandle);

      if (code !== 0) {
        reject(
          new Error(
            [
              `${invocation.label} exited with code ${code ?? 1}.`,
              stderr.value.trim() || stdout.value.trim() || invocation.label
            ].join("\n")
          )
        );
        return;
      }

      resolve({
        stdout: stdout.value,
        stderr: stderr.value
      });
    });
  });
}

function buildOpenClawCommand(args: string[], label: string): CommandInvocation {
  if (process.platform === "win32") {
    return {
      command: "wsl.exe",
      args: ["-e", "bash", "-lc", `openclaw ${args.map((arg) => `"${arg.replace(/(["\\$`])/g, "\\$1")}"`).join(" ")}`],
      env: {
        ...process.env
      },
      label
    };
  }

  return {
    command: "openclaw",
    args,
    env: {
      ...process.env
    },
    label
  };
}

function buildWslReadCommand(targetPath: "~/.openclaw/openclaw.json" | "~/.hermes/config.yaml"): CommandInvocation {
  return {
    command: "wsl.exe",
    args: ["-e", "bash", "-lc", `cat ${targetPath}`],
    env: {
      ...process.env
    },
    label: `read ${targetPath}`
  };
}

async function readOpenClawConfig(): Promise<OpenClawConfigFile | null> {
  try {
    const raw =
      process.platform === "win32"
        ? (await runCommandCapture(buildWslReadCommand("~/.openclaw/openclaw.json"))).stdout
        : await fs.readFile(getOpenClawConfigPath(), "utf8");
    return JSON.parse(raw) as OpenClawConfigFile;
  } catch {
    return null;
  }
}

async function readHermesConfigRaw(): Promise<string | null> {
  try {
    return process.platform === "win32"
      ? (await runCommandCapture(buildWslReadCommand("~/.hermes/config.yaml"))).stdout
      : await fs.readFile(getHermesConfigPath(), "utf8");
  } catch {
    return null;
  }
}

function collectConfiguredModelIds(config: OpenClawConfigFile | null): string[] {
  const ids = new Set<string>();

  for (const modelId of Object.keys(config?.agents?.defaults?.models ?? {})) {
    if (modelId.trim()) {
      ids.add(modelId.trim());
    }
  }

  for (const [providerId, providerConfig] of Object.entries(config?.models?.providers ?? {})) {
    for (const model of providerConfig.models ?? []) {
      if (model.id?.trim()) {
        ids.add(`${providerId}/${model.id.trim()}`);
      }
    }
  }

  return Array.from(ids);
}

function collectConfiguredModelLabels(config: OpenClawConfigFile | null): Map<string, string> {
  const labels = new Map<string, string>();

  for (const [modelId, modelConfig] of Object.entries(config?.agents?.defaults?.models ?? {})) {
    if (modelId.trim()) {
      labels.set(modelId.trim(), modelConfig.alias?.trim() || modelId.trim());
    }
  }

  for (const [providerId, providerConfig] of Object.entries(config?.models?.providers ?? {})) {
    for (const model of providerConfig.models ?? []) {
      if (!model.id?.trim()) {
        continue;
      }

      const fullId = `${providerId}/${model.id.trim()}`;

      if (!labels.has(fullId)) {
        labels.set(fullId, model.name?.trim() || fullId);
      }
    }
  }

  return labels;
}

import { parseModelIdentity, buildModelOption, dedupeModelOptions, filterModelLines } from "./model-config-utils.js";

async function listOpenClawModelIds(): Promise<string[]> {
  const invocation = buildOpenClawCommand(["models", "list", "--plain"], "openclaw models list --plain");
  const captured = await runCommandCapture(invocation, 45_000, 64_000);

  return filterModelLines(captured.stdout.split(/\r?\n/));
}

async function readOpenClawSelectedModelId(config: OpenClawConfigFile | null): Promise<string | null> {
  if (config?.agents?.defaults?.model?.primary?.trim()) {
    return config.agents.defaults.model.primary.trim();
  }

  try {
    const invocation = buildOpenClawCommand(["config", "get", "agents.defaults.model.primary"], "openclaw config get agents.defaults.model.primary");
    const captured = await runCommandCapture(invocation);
    const selectedModelId = captured.stdout.trim();
    return selectedModelId || null;
  } catch {
    return null;
  }
}

// dedupeModelOptions is imported from ./model-config-utils.js

export async function loadOpenClawModelCatalog(): Promise<StudioModelCatalog> {
  const config = await readOpenClawConfig();
  const labelMap = collectConfiguredModelLabels(config);
  const configuredIds = collectConfiguredModelIds(config);
  const selectedModelId = await readOpenClawSelectedModelId(config);

  let discoveredIds: string[] = [];

  try {
    discoveredIds = await listOpenClawModelIds();
  } catch {
    discoveredIds = [];
  }

  const orderedIds = [
    ...(selectedModelId ? [selectedModelId] : []),
    ...discoveredIds,
    ...configuredIds
  ];

  return {
    selectedModelId,
    options: dedupeModelOptions(
      orderedIds.map((modelId, index) =>
        buildModelOption(modelId, labelMap, index < discoveredIds.length + Number(Boolean(selectedModelId)) ? "runtime" : "config")
      )
    )
  };
}

export async function setOpenClawModel(modelId: string): Promise<StudioModelMutationResult> {
  const normalizedModelId = modelId.trim();

  if (!normalizedModelId) {
    return {
      applied: false,
      error: "模型不能为空。",
      catalog: await loadOpenClawModelCatalog()
    };
  }

  try {
    const invocation = buildOpenClawCommand(["models", "set", normalizedModelId], `openclaw models set ${normalizedModelId}`);
    await runCommandCapture(invocation, 60_000, 64_000);

    return {
      applied: true,
      error: null,
      catalog: await loadOpenClawModelCatalog()
    };
  } catch (cause) {
    return {
      applied: false,
      error: formatProbeFailure(cause),
      catalog: await loadOpenClawModelCatalog()
    };
  }
}

function parseHermesSelectedModelId(rawConfig: string | null): string | null {
  if (!rawConfig) {
    return null;
  }

  const modelBlockMatch = rawConfig.match(/^model:\n((?:^[ \t].*(?:\r?\n|$))*)/m);
  const modelBlock = modelBlockMatch?.[1] ?? "";
  const provider = modelBlock.match(/^\s+provider:\s*(.+)\s*$/m)?.[1]?.trim() ?? null;
  const model = modelBlock.match(/^\s+default:\s*(.+)\s*$/m)?.[1]?.trim() ?? null;

  if (!model) {
    return null;
  }

  if (provider && provider !== "''" && provider !== "\"\"") {
    return `${provider}/${model}`;
  }

  return model;
}

function formatYamlScalar(value: string | null): string {
  if (!value) {
    return "''";
  }

  return /[\s:#'"]/u.test(value) ? `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"` : value;
}

function upsertModelBlockLine(block: string, key: "default" | "provider", value: string | null): string {
  const linePattern = new RegExp(`^(\\s{2}${key}:).*$`, "m");
  const formattedValue = formatYamlScalar(value);

  if (linePattern.test(block)) {
    return block.replace(linePattern, `$1 ${formattedValue}`);
  }

  const suffix = block.endsWith("\n") ? "" : "\n";
  return `${block}${suffix}  ${key}: ${formattedValue}\n`;
}

function updateHermesConfigModel(rawConfig: string, modelId: string): string {
  const identity = parseModelIdentity(modelId);
  const modelBlockMatch = rawConfig.match(/^model:\n((?:^[ \t].*(?:\r?\n|$))*)/m);
  const existingBlock = modelBlockMatch ? `model:\n${modelBlockMatch[1]}` : "model:\n";
  let nextBlock = existingBlock;

  nextBlock = upsertModelBlockLine(nextBlock, "default", identity.model);
  nextBlock = upsertModelBlockLine(nextBlock, "provider", identity.provider);

  if (modelBlockMatch) {
    return rawConfig.replace(modelBlockMatch[0], nextBlock);
  }

  return `${nextBlock}\n${rawConfig}`;
}

async function writeHermesConfigRaw(rawConfig: string): Promise<void> {
  if (process.platform !== "win32") {
    await fs.writeFile(getHermesConfigPath(), rawConfig, "utf8");
    return;
  }

  const encodedConfig = Buffer.from(rawConfig, "utf8").toString("base64");
  const invocation: CommandInvocation = {
    command: "wsl.exe",
    args: [
      "-e",
      "bash",
      "-lc",
      [
        "python3 - \"$1\" <<'PY'",
        "import base64",
        "import pathlib",
        "import sys",
        "target = pathlib.Path.home() / '.hermes' / 'config.yaml'",
        "target.write_text(base64.b64decode(sys.argv[1]).decode('utf-8'), encoding='utf-8')",
        "PY"
      ].join("\n"),
      "--",
      encodedConfig
    ],
    env: {
      ...process.env
    },
    label: "write ~/.hermes/config.yaml"
  };

  await runCommandCapture(invocation, 30_000, 8_000);
}

export async function loadHermesModelCatalog(): Promise<StudioModelCatalog> {
  const [hermesConfigRaw, openClawCatalog] = await Promise.all([
    readHermesConfigRaw(),
    loadOpenClawModelCatalog().catch(() => ({
      selectedModelId: null,
      options: []
    }))
  ]);

  const selectedModelId = parseHermesSelectedModelId(hermesConfigRaw) ?? openClawCatalog.selectedModelId;
  const options = [...openClawCatalog.options];

  if (selectedModelId && !options.some((option) => option.id === selectedModelId)) {
    options.unshift({
      id: selectedModelId,
      label: selectedModelId,
      ...parseModelIdentity(selectedModelId),
      source: "fallback"
    });
  }

  return {
    selectedModelId,
    options: dedupeModelOptions(options)
  };
}

export async function setHermesModel(modelId: string): Promise<StudioModelMutationResult> {
  const normalizedModelId = modelId.trim();

  if (!normalizedModelId) {
    return {
      applied: false,
      error: "模型不能为空。",
      catalog: await loadHermesModelCatalog()
    };
  }

  const currentRawConfig = await readHermesConfigRaw();

  if (!currentRawConfig) {
    return {
      applied: false,
      error: "未找到 Hermes 配置文件。",
      catalog: await loadHermesModelCatalog()
    };
  }

  try {
    await writeHermesConfigRaw(updateHermesConfigModel(currentRawConfig, normalizedModelId));

    return {
      applied: true,
      error: null,
      catalog: await loadHermesModelCatalog()
    };
  } catch (cause) {
    return {
      applied: false,
      error: formatProbeFailure(cause),
      catalog: await loadHermesModelCatalog()
    };
  }
}
