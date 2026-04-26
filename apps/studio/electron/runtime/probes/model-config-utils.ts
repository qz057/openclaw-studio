import type { StudioModelOption } from "@openclaw/shared";

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
