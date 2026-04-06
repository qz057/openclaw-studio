"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchRuntimeShellRule = matchRuntimeShellRule;
exports.assessRuntimeCommand = assessRuntimeCommand;
exports.formatRuntimeCommandAssessment = formatRuntimeCommandAssessment;
exports.buildRuntimePermissionMatrix = buildRuntimePermissionMatrix;
exports.buildRuntimeRuleMatchLines = buildRuntimeRuleMatchLines;
const ESCAPED_STAR_PLACEHOLDER = "\x00ESCAPED_STAR\x00";
const ESCAPED_BACKSLASH_PLACEHOLDER = "\x00ESCAPED_BACKSLASH\x00";
const ESCAPED_STAR_PLACEHOLDER_RE = new RegExp(ESCAPED_STAR_PLACEHOLDER, "g");
const ESCAPED_BACKSLASH_PLACEHOLDER_RE = new RegExp(ESCAPED_BACKSLASH_PLACEHOLDER, "g");
const READ_ONLY_PREFIXES = new Set([
    "cat",
    "head",
    "tail",
    "ls",
    "find",
    "grep",
    "rg",
    "sed",
    "awk",
    "sort",
    "uniq",
    "wc",
    "cut",
    "paste",
    "column",
    "tr",
    "file",
    "stat",
    "diff",
    "strings",
    "hexdump",
    "od",
    "base64",
    "nl",
    "jq"
]);
const WRITE_PREFIXES = new Set(["mkdir", "touch", "rm", "rmdir", "mv", "cp", "tee", "chmod", "chown", "ln"]);
const DANGEROUS_PREFIXES = new Set(["sudo", "doas", "pkexec", "systemctl", "service", "launchctl", "shutdown", "reboot", "killall"]);
const PROTECTED_PATH_PATTERNS = [/~\/\.openclaw\b/, /\/etc\b/, /\/usr\b/, /\/var\b/, /\/System\b/, /\/Library\b/];
function extractBaseCommand(command) {
    return command.trim().split(/\s+/)[0] ?? "";
}
function permissionRuleExtractPrefix(permissionRule) {
    const match = permissionRule.match(/^(.+):\*$/);
    return match?.[1] ?? null;
}
function hasWildcards(pattern) {
    if (pattern.endsWith(":*")) {
        return false;
    }
    for (let index = 0; index < pattern.length; index += 1) {
        if (pattern[index] !== "*") {
            continue;
        }
        let backslashCount = 0;
        for (let cursor = index - 1; cursor >= 0 && pattern[cursor] === "\\"; cursor -= 1) {
            backslashCount += 1;
        }
        if (backslashCount % 2 === 0) {
            return true;
        }
    }
    return false;
}
function matchRuntimeShellRule(permissionRule, command) {
    const prefix = permissionRuleExtractPrefix(permissionRule);
    if (prefix !== null) {
        return command === prefix || command.startsWith(`${prefix} `);
    }
    if (!hasWildcards(permissionRule)) {
        return command === permissionRule;
    }
    const trimmedPattern = permissionRule.trim();
    let processed = "";
    for (let index = 0; index < trimmedPattern.length; index += 1) {
        const current = trimmedPattern[index];
        const next = trimmedPattern[index + 1];
        if (current === "\\" && next === "*") {
            processed += ESCAPED_STAR_PLACEHOLDER;
            index += 1;
            continue;
        }
        if (current === "\\" && next === "\\") {
            processed += ESCAPED_BACKSLASH_PLACEHOLDER;
            index += 1;
            continue;
        }
        processed += current;
    }
    const escaped = processed.replace(/[.+?^${}()|[\]\\'"]/g, "\\$&");
    let regexPattern = escaped
        .replace(/\*/g, ".*")
        .replace(ESCAPED_STAR_PLACEHOLDER_RE, "\\*")
        .replace(ESCAPED_BACKSLASH_PLACEHOLDER_RE, "\\\\");
    const unescapedStarCount = (processed.match(/\*/g) || []).length;
    if (regexPattern.endsWith(" .*") && unescapedStarCount === 1) {
        regexPattern = `${regexPattern.slice(0, -3)}( .*)?`;
    }
    return new RegExp(`^${regexPattern}$`, "s").test(command);
}
function detectPathScope(command) {
    const hasProtectedPath = PROTECTED_PATH_PATTERNS.some((pattern) => pattern.test(command));
    const hasSystemPath = /(^|[\s'"])(\/(bin|sbin|opt|Applications|Program Files)|systemctl\b|launchctl\b)/.test(command);
    const hasWorkspaceHint = /(^|[\s'"])(\.\/|\.\.\/|apps\/|packages\/|delivery\/|README\.md\b|package\.json\b)/.test(command);
    if ((hasProtectedPath || hasSystemPath) && hasWorkspaceHint) {
        return "mixed";
    }
    if (hasSystemPath) {
        return "system";
    }
    if (hasProtectedPath) {
        return "protected";
    }
    return "workspace";
}
function classifyCommand(command, pathScope) {
    const reasons = [];
    const baseCommand = extractBaseCommand(command);
    const normalized = command.trim();
    if (DANGEROUS_PREFIXES.has(baseCommand)) {
        reasons.push(`dangerous prefix ${baseCommand}`);
        return {
            classification: "dangerous",
            reasons
        };
    }
    if (/rm\s+-rf\s+(\/|~\/\.openclaw\b)/.test(normalized) || /rm\s+-fr\s+(\/|~\/\.openclaw\b)/.test(normalized)) {
        reasons.push("dangerous removal target");
        return {
            classification: "dangerous",
            reasons
        };
    }
    if (/curl\b.*\|\s*(sh|bash)\b/.test(normalized) || /wget\b.*\|\s*(sh|bash)\b/.test(normalized)) {
        reasons.push("network pipe to shell");
        return {
            classification: "dangerous",
            reasons
        };
    }
    if (WRITE_PREFIXES.has(baseCommand) || />{1,2}\s*\S/.test(normalized) || /\btee\b/.test(normalized) || /\bsed\s+-i\b/.test(normalized)) {
        reasons.push("write-oriented shell form");
        return {
            classification: pathScope === "workspace" ? "workspace-write" : "protected-write",
            reasons
        };
    }
    if (READ_ONLY_PREFIXES.has(baseCommand) || normalized.startsWith("git status") || normalized.startsWith("git diff")) {
        reasons.push("read-only command family");
        return {
            classification: "read-only",
            reasons
        };
    }
    reasons.push("unrecognized command defaults to write-sensitive posture");
    return {
        classification: pathScope === "workspace" ? "workspace-write" : "protected-write",
        reasons
    };
}
function assessRuntimeCommand(command, allowRules = []) {
    const pathScope = detectPathScope(command);
    const { classification, reasons } = classifyCommand(command, pathScope);
    const matchedRule = allowRules.find((rule) => matchRuntimeShellRule(rule, command)) ?? null;
    const approval = classification === "dangerous"
        ? "blocked"
        : classification === "read-only" && pathScope === "workspace"
            ? "not-required"
            : "required";
    return {
        command,
        classification,
        pathScope,
        approval,
        matchedRule,
        reasons
    };
}
function formatRuntimeCommandAssessment(assessment) {
    return `${assessment.command} · ${assessment.classification} · ${assessment.pathScope} · approval ${assessment.approval} · rule ${assessment.matchedRule ?? "none"}`;
}
function buildRuntimePermissionMatrix(allowRules = []) {
    return [
        "rg --files apps/studio",
        "cat ~/.openclaw/openclaw.json",
        "mkdir -p ~/.openclaw/plugins",
        "rm -rf ~/.openclaw",
        "systemctl restart openclaw"
    ].map((command) => assessRuntimeCommand(command, allowRules));
}
function buildRuntimeRuleMatchLines(allowRules = []) {
    if (allowRules.length === 0) {
        return ["allow rule · none"];
    }
    return allowRules.map((rule) => {
        const sample = buildRuntimePermissionMatrix(allowRules).find((assessment) => assessment.matchedRule === rule)?.command ?? "no sample match";
        return `allow rule · ${rule} · sample ${sample}`;
    });
}
