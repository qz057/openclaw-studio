import type { StudioModelOption } from "@openclaw/shared";

export interface HermesModelCatalogEntries {
  selectedModelId: string | null;
  modelIds: string[];
  labelMap: Map<string, string>;
}

export function parseModelIdentity(modelId: string): { provider: string | null; model: string } {
  const trimmed = modelId.trim();
  const separatorIndex = trimmed.indexOf("/");

  if (separatorIndex === -1) {
    return {
      provider: null,
      model: trimmed
    };
  }

  return {
    provider: trimmed.slice(0, separatorIndex),
    model: trimmed.slice(separatorIndex + 1)
  };
}

export function buildModelOption(modelId: string, labelMap: Map<string, string>, source: StudioModelOption["source"]): StudioModelOption {
  const identity = parseModelIdentity(modelId);
  const label = labelMap.get(modelId)?.trim();

  return {
    id: modelId,
    label: label && label !== modelId ? `${label} (${modelId})` : modelId,
    provider: identity.provider,
    model: identity.model,
    source
  };
}

export function dedupeModelOptions(options: StudioModelOption[]): StudioModelOption[] {
  const seenIds = new Set<string>();
  const resolved: StudioModelOption[] = [];

  for (const option of options) {
    if (!option.id || seenIds.has(option.id)) {
      continue;
    }

    seenIds.add(option.id);
    resolved.push(option);
  }

  return resolved;
}

function parseYamlScalar(value: string | undefined): string | null {
  const trimmed = value?.trim();

  if (!trimmed || trimmed === "''" || trimmed === '""') {
    return null;
  }

  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1).trim() || null;
  }

  return trimmed;
}

function readYamlChildBlock(rawConfig: string | null, key: string): string {
  if (!rawConfig) {
    return "";
  }

  const match = rawConfig.match(new RegExp(`^${key}:\\n((?:^[ \\t].*(?:\\r?\\n|$))*)`, "m"));
  return match?.[1] ?? "";
}

export function parseHermesSelectedModelId(rawConfig: string | null): string | null {
  const modelBlock = readYamlChildBlock(rawConfig, "model");
  const provider = parseYamlScalar(modelBlock.match(/^\s+provider:\s*(.+)\s*$/m)?.[1]);
  const model = parseYamlScalar(modelBlock.match(/^\s+default:\s*(.+)\s*$/m)?.[1]);

  if (!model) {
    return null;
  }

  return provider ? `${provider}/${model}` : model;
}

export function collectHermesModelCatalogEntries(rawConfig: string | null): HermesModelCatalogEntries {
  const selectedModelId = parseHermesSelectedModelId(rawConfig);
  const modelIds = new Set<string>();
  const labelMap = new Map<string, string>();
  const aliasesBlock = readYamlChildBlock(rawConfig, "model_aliases");
  let currentAlias: { name: string; model: string | null; provider: string | null } | null = null;

  const commitAlias = () => {
    if (!currentAlias?.model) {
      return;
    }

    const modelId = currentAlias.provider ? `${currentAlias.provider}/${currentAlias.model}` : currentAlias.model;
    modelIds.add(modelId);

    if (!labelMap.has(modelId)) {
      labelMap.set(modelId, currentAlias.name);
    }
  };

  for (const rawLine of aliasesBlock.split(/\r?\n/)) {
    const aliasMatch = rawLine.match(/^\s{2}([A-Za-z0-9_.-]+):\s*$/);

    if (aliasMatch) {
      commitAlias();
      currentAlias = {
        name: aliasMatch[1] ?? "",
        model: null,
        provider: null
      };
      continue;
    }

    if (!currentAlias) {
      continue;
    }

    const fieldMatch = rawLine.match(/^\s{4}(model|provider):\s*(.+)\s*$/);

    if (!fieldMatch) {
      continue;
    }

    const value = parseYamlScalar(fieldMatch[2]);

    if (fieldMatch[1] === "model") {
      currentAlias.model = value;
    } else {
      currentAlias.provider = value;
    }
  }

  commitAlias();

  if (selectedModelId) {
    modelIds.add(selectedModelId);
  }

  return {
    selectedModelId,
    modelIds: Array.from(modelIds),
    labelMap
  };
}

/** MODEL_ID_PATTERN matches "provider/model-name" format */
const MODEL_ID_PATTERN = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/;

/**
 * Filters raw stdout lines from `openclaw models list --plain` to extract valid model IDs.
 * Removes ANSI codes, plugin logs, common log prefixes, and validates format.
 */
export function filterModelLines(lines: string[]): string[] {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    // 排除 ANSI 颜色代码
    .filter((line) => !line.includes("\x1B["))
    // 排除插件日志和其他非模型输出
    .filter((line) => !line.includes("[plugins]") && !line.includes("[lcm]"))
    // 排除以常见日志关键字开头的行
    .filter((line) => !line.match(/^(Loading|Initializing|Starting|Loaded|Error|Warning|Info):/i))
    // 使用正则表达式验证模型 ID 格式
    .filter((line) => MODEL_ID_PATTERN.test(line));
}
