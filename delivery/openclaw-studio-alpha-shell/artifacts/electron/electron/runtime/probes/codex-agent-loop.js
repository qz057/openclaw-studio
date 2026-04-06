"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeCodexAgentLoop = analyzeCodexAgentLoop;
exports.buildCodexAgentLoopOverview = buildCodexAgentLoopOverview;
const TURN_PATTERNS = [/^turn_context$/i, /^user_message$/i];
const TOOL_CALL_PATTERNS = [/tool[_ -]?(use|call)/i, /function[_ -]?call/i, /mcp[_ -]?call/i, /bash[_ -]?command/i];
const TOOL_RESULT_PATTERNS = [/tool[_ -]?result/i, /function[_ -]?result/i, /tool[_ -]?(output|complete|success|error)/i, /stdout/i, /stderr/i];
const RETRY_PATTERNS = [/retry/i, /fallback/i, /resume/i, /recover/i];
const COMPACT_PATTERNS = [/compact/i, /collapse/i, /summary/i, /snip/i];
const BUDGET_PATTERNS = [/budget/i, /token/i, /max_output/i];
const INTERRUPTION_PATTERNS = [/interrupt/i, /abort/i, /cancel/i];
const STOP_GATE_PATTERNS = [/stop_hook/i, /hook_stopped/i, /prevent_continuation/i, /max_turns/i, /blocked/i];
const COMPLETE_PATTERNS = [/task_complete/i, /^complete$/i, /^completed$/i];
function parseTimestamp(value) {
    if (!value) {
        return null;
    }
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
}
function formatCount(value, singular, plural = `${singular}s`) {
    return `${value} ${value === 1 ? singular : plural}`;
}
function getLabels(event) {
    return [event.type, event.customType, event.payload?.type]
        .filter((value) => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean);
}
function matchesAny(labels, patterns) {
    return labels.some((label) => patterns.some((pattern) => pattern.test(label)));
}
function formatStateLabel(state) {
    switch (state) {
        case "stable":
            return "Stable";
        case "continuing":
            return "Continuing";
        case "recovering":
            return "Recovering";
        case "interrupted":
            return "Interrupted";
        case "complete":
            return "Complete";
    }
}
function chooseStateTone(state, status) {
    switch (state) {
        case "recovering":
        case "interrupted":
            return "warning";
        case "continuing":
            return "positive";
        case "complete":
            return "positive";
        case "stable":
            return status === "running" ? "positive" : "neutral";
    }
}
function deriveContinuation(turnCount, toolCallCount, toolResultCount) {
    if (toolCallCount > toolResultCount) {
        return `Tool follow-up pending (${toolResultCount}/${toolCallCount} results observed).`;
    }
    if (toolCallCount > 0) {
        return `Tool chain settled (${toolResultCount}/${toolCallCount} results observed).`;
    }
    if (turnCount > 1) {
        return `Multi-turn continuation with ${formatCount(turnCount, "turn")}.`;
    }
    return "Single-turn direct response path.";
}
function analyzeCodexAgentLoop(events, status, updatedAtMs, now = Date.now()) {
    let turnCount = 0;
    let toolCallCount = 0;
    let toolResultCount = 0;
    let retryCount = 0;
    let compactCount = 0;
    let budgetCount = 0;
    let interruptionCount = 0;
    let stopGateCount = 0;
    let completionCount = 0;
    let latestToolTimestamp = 0;
    let latestRecoveryTimestamp = 0;
    let latestInterruptionTimestamp = 0;
    let latestCompletionTimestamp = 0;
    for (const event of events) {
        const labels = getLabels(event);
        if (labels.length === 0) {
            continue;
        }
        const timestamp = parseTimestamp(event.timestamp ?? event.payload?.timestamp) ?? updatedAtMs;
        if (matchesAny(labels, TURN_PATTERNS)) {
            turnCount += 1;
        }
        if (matchesAny(labels, TOOL_CALL_PATTERNS)) {
            toolCallCount += 1;
            latestToolTimestamp = Math.max(latestToolTimestamp, timestamp);
        }
        if (matchesAny(labels, TOOL_RESULT_PATTERNS)) {
            toolResultCount += 1;
            latestToolTimestamp = Math.max(latestToolTimestamp, timestamp);
        }
        if (matchesAny(labels, RETRY_PATTERNS)) {
            retryCount += 1;
            latestRecoveryTimestamp = Math.max(latestRecoveryTimestamp, timestamp);
        }
        if (matchesAny(labels, COMPACT_PATTERNS)) {
            compactCount += 1;
            latestRecoveryTimestamp = Math.max(latestRecoveryTimestamp, timestamp);
        }
        if (matchesAny(labels, BUDGET_PATTERNS)) {
            budgetCount += 1;
            latestRecoveryTimestamp = Math.max(latestRecoveryTimestamp, timestamp);
        }
        if (matchesAny(labels, INTERRUPTION_PATTERNS)) {
            interruptionCount += 1;
            latestInterruptionTimestamp = Math.max(latestInterruptionTimestamp, timestamp);
        }
        if (matchesAny(labels, STOP_GATE_PATTERNS)) {
            stopGateCount += 1;
        }
        if (matchesAny(labels, COMPLETE_PATTERNS)) {
            completionCount += 1;
            latestCompletionTimestamp = Math.max(latestCompletionTimestamp, timestamp);
        }
    }
    if (turnCount === 0 && events.length > 0) {
        turnCount = 1;
    }
    const recoveryCount = retryCount + compactCount + budgetCount;
    const continuation = deriveContinuation(turnCount, toolCallCount, toolResultCount);
    const latestTransition = (() => {
        if (status === "complete" || latestCompletionTimestamp > 0 || completionCount > 0) {
            return "Task completion observed";
        }
        if (latestInterruptionTimestamp >= latestRecoveryTimestamp && latestInterruptionTimestamp >= latestToolTimestamp && interruptionCount > 0) {
            return "Interruption marker observed";
        }
        if (latestRecoveryTimestamp > 0 && recoveryCount > 0) {
            if (retryCount > 0) {
                return "Retry or resume marker observed";
            }
            if (compactCount > 0) {
                return "Compaction marker observed";
            }
            if (budgetCount > 0) {
                return "Budget continuation marker observed";
            }
        }
        if (toolCallCount > toolResultCount) {
            return "Tool follow-up still open";
        }
        if (toolCallCount > 0) {
            return "Tool batch settled";
        }
        return now - updatedAtMs < 45 * 60 * 1000 ? "Recent assistant turn observed" : "Recent session snapshot only";
    })();
    const state = (() => {
        if (status === "complete" || latestCompletionTimestamp > 0 || completionCount > 0) {
            return "complete";
        }
        if (latestInterruptionTimestamp >= latestRecoveryTimestamp && latestInterruptionTimestamp >= latestToolTimestamp && interruptionCount > 0) {
            return "interrupted";
        }
        if (recoveryCount > 0) {
            return "recovering";
        }
        if (toolCallCount > 0 || turnCount > 1 || status === "running") {
            return "continuing";
        }
        return "stable";
    })();
    const tone = chooseStateTone(state, status);
    const summary = `${formatCount(turnCount, "turn")} observed. ${continuation} ` +
        `${recoveryCount > 0 ? `${formatCount(recoveryCount, "recovery marker")} detected.` : "No recovery markers detected."} ` +
        `${stopGateCount > 0 ? `${formatCount(stopGateCount, "stop gate")} surfaced.` : "No explicit stop gates surfaced."} ` +
        `${interruptionCount > 0 ? `${formatCount(interruptionCount, "interruption")} observed.` : "No interruptions observed."} ` +
        `Latest transition: ${latestTransition}.`;
    return {
        state,
        tone,
        turnCount,
        toolCallCount,
        toolResultCount,
        recoveryCount,
        retryCount,
        compactCount,
        budgetCount,
        stopGateCount,
        interruptionCount,
        continuation,
        lastTransition: latestTransition,
        summary
    };
}
function buildCodexAgentLoopOverview(snapshots) {
    const primary = snapshots[0] ?? null;
    if (!primary) {
        return {
            summary: "No readable live Codex turn history was available, so the shell keeps a typed fallback loop contract that still distinguishes turn state, tool follow-up posture, recovery markers, and interruption handling.",
            stats: [
                { label: "Loop State", value: "Fallback", tone: "warning" },
                { label: "Turns", value: "0 observed", tone: "neutral" },
                { label: "Tool Chain", value: "0 / 0", tone: "neutral" },
                { label: "Recovery / Stop", value: "0 / 0", tone: "neutral" }
            ],
            signals: [
                {
                    id: "codex-loop-state",
                    label: "State",
                    value: "Fallback contract",
                    detail: "The renderer still exposes a stable agent-loop surface even before live Codex session logs are readable.",
                    tone: "warning"
                },
                {
                    id: "codex-loop-continuation",
                    label: "Continuation",
                    value: "Not observed",
                    detail: "Tool continuation and turn follow-up will populate here from live local session logs when available.",
                    tone: "neutral"
                },
                {
                    id: "codex-loop-recovery",
                    label: "Recovery / Stop",
                    value: "0 / 0",
                    detail: "Retry, compaction, token-budget, and stop-gate markers stay read-only and local-only.",
                    tone: "neutral"
                }
            ]
        };
    }
    const totalTurns = snapshots.reduce((sum, snapshot) => sum + snapshot.turnCount, 0);
    const totalToolCalls = snapshots.reduce((sum, snapshot) => sum + snapshot.toolCallCount, 0);
    const totalToolResults = snapshots.reduce((sum, snapshot) => sum + snapshot.toolResultCount, 0);
    const totalRecoveries = snapshots.reduce((sum, snapshot) => sum + snapshot.recoveryCount, 0);
    const totalStopGates = snapshots.reduce((sum, snapshot) => sum + snapshot.stopGateCount, 0);
    const totalInterruptions = snapshots.reduce((sum, snapshot) => sum + snapshot.interruptionCount, 0);
    return {
        summary: `Read-only agent-loop analysis is now derived from local Codex session logs: ${primary.summary} ` +
            `Across ${formatCount(snapshots.length, "session")}, ${formatCount(totalTurns, "turn")} and ${formatCount(totalToolCalls, "tool call")} were observed without replaying or mutating any task.`,
        stats: [
            {
                label: "Loop State",
                value: formatStateLabel(primary.state),
                tone: primary.tone
            },
            {
                label: "Turns",
                value: formatCount(totalTurns, "turn"),
                tone: totalTurns > 0 ? "positive" : "neutral"
            },
            {
                label: "Tool Chain",
                value: `${totalToolResults} / ${totalToolCalls}`,
                tone: totalToolCalls > totalToolResults ? "warning" : totalToolCalls > 0 ? "positive" : "neutral"
            },
            {
                label: "Recovery / Stop",
                value: `${totalRecoveries} / ${totalStopGates}`,
                tone: totalRecoveries > 0 || totalStopGates > 0 ? "warning" : "neutral"
            }
        ],
        signals: [
            {
                id: "codex-loop-state",
                label: "State",
                value: `${formatStateLabel(primary.state)} · ${primary.lastTransition}`,
                detail: primary.summary,
                tone: primary.tone
            },
            {
                id: "codex-loop-continuation",
                label: "Continuation",
                value: primary.continuation,
                detail: `${primary.toolResultCount}/${primary.toolCallCount} tool results observed on the most recent session chain.`,
                tone: primary.toolCallCount > primary.toolResultCount ? "warning" : primary.toolCallCount > 0 ? "positive" : "neutral"
            },
            {
                id: "codex-loop-recovery",
                label: "Recovery / Stop",
                value: `${totalRecoveries} recovery · ${totalStopGates} stop`,
                detail: `retry ${snapshots.reduce((sum, snapshot) => sum + snapshot.retryCount, 0)} · compact ${snapshots.reduce((sum, snapshot) => sum + snapshot.compactCount, 0)} · budget ${snapshots.reduce((sum, snapshot) => sum + snapshot.budgetCount, 0)}`,
                tone: totalRecoveries > 0 || totalStopGates > 0 ? "warning" : "neutral"
            },
            {
                id: "codex-loop-interruptions",
                label: "Interruptions",
                value: totalInterruptions > 0 ? `${totalInterruptions} observed` : "None observed",
                detail: "Interruption handling stays read-only here; the shell reports observed abort/cancel markers but does not resume or replay tasks.",
                tone: totalInterruptions > 0 ? "warning" : "positive"
            }
        ]
    };
}
