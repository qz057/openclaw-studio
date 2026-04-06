"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStudioRuntime = createStudioRuntime;
const shared_1 = require("@openclaw/shared");
const codex_1 = require("./probes/codex");
const project_context_1 = require("./probes/project-context");
const runtime_observations_1 = require("./probes/runtime-observations");
const sessions_1 = require("./probes/sessions");
const skills_1 = require("./probes/skills");
const startup_routing_1 = require("./probes/startup-routing");
const system_status_1 = require("./probes/system-status");
const tools_mcp_1 = require("./probes/tools-mcp");
function cloneState() {
    return JSON.parse(JSON.stringify(shared_1.mockShellState));
}
function updateSettingItem(items, id, patch) {
    return items.map((item) => (item.id === id ? { ...item, ...patch } : item));
}
function formatRelativeTime(timestampMs) {
    if (!timestampMs) {
        return "Unknown";
    }
    const diffMs = Date.now() - timestampMs;
    if (diffMs < 60_000) {
        return "Just now";
    }
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 60) {
        return `${minutes} min ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours} hr ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
}
function deriveStatus(timestampMs) {
    if (!timestampMs) {
        return "waiting";
    }
    const ageMs = Date.now() - timestampMs;
    if (ageMs < 8 * 60 * 60 * 1000) {
        return "active";
    }
    if (ageMs < 48 * 60 * 60 * 1000) {
        return "waiting";
    }
    return "complete";
}
function shortenHomePath(rawPath) {
    if (!rawPath) {
        return "Unavailable";
    }
    const homeDirectory = process.env.HOME;
    if (homeDirectory && rawPath.startsWith(homeDirectory)) {
        return rawPath.replace(homeDirectory, "~");
    }
    return rawPath;
}
function formatCount(value, singular, plural = `${singular}s`) {
    return `${value} ${value === 1 ? singular : plural}`;
}
function formatModelLabel(provider, model) {
    if (provider && model) {
        return `${provider}/${model}`;
    }
    if (model) {
        return model;
    }
    if (provider) {
        return provider;
    }
    return "Unknown";
}
function parseIsoTimestamp(value) {
    if (!value) {
        return null;
    }
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
}
function formatBoundaryLayerLabel(layer) {
    switch (layer) {
        case "local-only":
            return "Local-only";
        case "preview-host":
            return "Preview-host";
        case "withheld":
            return "Withheld";
        default:
            return "Future executor";
    }
}
function formatBoundaryHostState(hostState) {
    return hostState === "future-executor" ? "Future executor" : "Withheld";
}
function createInspectorTraceFocus(boundary) {
    const trace = boundary.hostExecutor.bridge.trace;
    return trace.slotRoster.find((entry) => entry.slotId === trace.focusSlotId) ?? trace.slotRoster[0] ?? null;
}
function createDockItemsFromTraceFocus(traceFocus) {
    if (!traceFocus) {
        return [];
    }
    return [
        {
            id: "dock-focus-slot",
            label: "Focus slot",
            value: traceFocus.label,
            detail: "Bottom dock follows the same per-slot focus as the inspector and trace roster.",
            tone: "neutral",
            slotId: traceFocus.slotId
        },
        {
            id: "dock-focus-handler",
            label: "Handler",
            value: `${traceFocus.handlerState} / disabled`,
            detail: traceFocus.handlerLabel,
            tone: traceFocus.handlerState === "registered" ? "positive" : "warning",
            slotId: traceFocus.slotId
        },
        {
            id: "dock-focus-validator",
            label: "Validator",
            value: `${traceFocus.validatorState} / slot-linked`,
            detail: `${traceFocus.validatorLabel} · ${traceFocus.requiredPayloadFieldCount} payload / ${traceFocus.requiredResultFieldCount} result fields`,
            tone: traceFocus.validatorState === "registered" ? "positive" : "warning",
            slotId: traceFocus.slotId
        },
        {
            id: "dock-focus-result",
            label: "Result",
            value: `${traceFocus.primaryStatus} / ${traceFocus.primaryStage}`,
            detail: `${traceFocus.failureCode} · ${traceFocus.failureDisposition}`,
            tone: traceFocus.primaryStatus === "blocked" ? "neutral" : "warning",
            slotId: traceFocus.slotId
        },
        {
            id: "dock-focus-rollback",
            label: "Rollback / audit",
            value: `${traceFocus.rollbackDisposition} / placeholder`,
            detail: "Rollback posture and placeholder audit linkage stay synchronized with the focused slot.",
            tone: traceFocus.rollbackDisposition === "not-needed" ? "positive" : "warning",
            slotId: traceFocus.slotId
        }
    ];
}
function getInteractiveSessions(sessionProbe) {
    return sessionProbe.sessionRecords.filter((session) => session.kind === "interactive");
}
function getCronBackedSessions(sessionProbe) {
    return sessionProbe.sessionRecords.filter((session) => session.kind === "cron");
}
function createMetrics(bridgeMode, sessionProbe, interactiveSessions, cronBackedSessions, runtimeObservations) {
    const hasLiveSessions = sessionProbe.source === "live" && sessionProbe.sessionRecords.length > 0;
    const hasLiveRuntime = runtimeObservations.source === "live";
    const bridgeMetric = {
        id: "metric-bridge",
        label: "Bridge Mode",
        value: bridgeMode === "hybrid" ? "Hybrid live" : "Mock IPC",
        detail: bridgeMode === "hybrid"
            ? "System probes, recent sessions, and runtime observations are reading local OpenClaw data."
            : "Renderer-safe mock data remains active until local runtime signals are available.",
        tone: bridgeMode === "hybrid" ? "positive" : "warning"
    };
    const sessionsMetric = hasLiveSessions
        ? {
            id: "metric-sessions",
            label: "Recent Sessions",
            value: formatCount(sessionProbe.sessionRecords.length, "session"),
            detail: `${formatCount(interactiveSessions.length, "interactive session")}, ${formatCount(cronBackedSessions.length, "scheduled session")} across ${formatCount(sessionProbe.agentCount, "agent directory")}.`,
            tone: "positive"
        }
        : {
            id: "metric-sessions",
            label: "Recent Sessions",
            value: "Fallback",
            detail: "Recent session JSONL files were unavailable, so the shell stayed on the typed mock snapshot.",
            tone: "warning"
        };
    const runtimeMetric = hasLiveRuntime
        ? {
            id: "metric-runtime",
            label: "Runtime Footprint",
            value: `${formatCount(runtimeObservations.configuredAgents.length, "agent")} / ${formatCount(runtimeObservations.cronJobsCount, "cron job")}`,
            detail: runtimeObservations.cronTotalRuns > 0
                ? `${runtimeObservations.cronOkRuns} ok, ${runtimeObservations.cronErrorRuns} error across ${formatCount(runtimeObservations.cronTotalRuns, "run log")}.`
                : "OpenClaw config was detected, but no cron run logs were available yet.",
            tone: runtimeObservations.cronErrorRuns > 0 ? "warning" : "positive"
        }
        : {
            id: "metric-runtime",
            label: "Runtime Footprint",
            value: "Fallback",
            detail: "No local OpenClaw config or cron observations were available.",
            tone: "warning"
        };
    const modelsMetric = hasLiveRuntime
        ? {
            id: "metric-models",
            label: "Model Coverage",
            value: formatCount(runtimeObservations.modelCount, "model"),
            detail: runtimeObservations.modelLabels.length > 0
                ? runtimeObservations.modelLabels.slice(0, 3).join(" · ")
                : "Configured model labels were unavailable in the local runtime files.",
            tone: runtimeObservations.modelCount > 0 ? "neutral" : "warning"
        }
        : {
            id: "metric-models",
            label: "Model Coverage",
            value: "Unknown",
            detail: "Model configuration remains mock-backed until local runtime config is readable.",
            tone: "warning"
        };
    return [bridgeMetric, sessionsMetric, runtimeMetric, modelsMetric];
}
function createWorkstreams(sessionProbe, interactiveSessions, runtimeObservations) {
    const latestInteractiveSession = interactiveSessions[0] ?? null;
    const latestCronRun = runtimeObservations.recentCronRuns[0] ?? null;
    const configTouchedAt = parseIsoTimestamp(runtimeObservations.lastTouchedAt);
    return [
        {
            id: "workstream-interactive",
            title: "Interactive session lane",
            detail: latestInteractiveSession
                ? `Latest operator session is “${latestInteractiveSession.title}” from ${shortenHomePath(latestInteractiveSession.cwd)}.`
                : "No recent interactive session was detected in the local agent session directories.",
            owner: latestInteractiveSession?.owner ?? "Runtime",
            stage: latestInteractiveSession ? latestInteractiveSession.status : "Fallback",
            updatedAt: latestInteractiveSession?.updatedAt ?? "Unknown",
            tone: latestInteractiveSession ? (latestInteractiveSession.status === "active" ? "positive" : "neutral") : "warning"
        },
        {
            id: "workstream-scheduled",
            title: "Scheduled runtime lane",
            detail: latestCronRun
                ? `${runtimeObservations.cronOkRuns} ok / ${runtimeObservations.cronErrorRuns} error across ${formatCount(runtimeObservations.cronTotalRuns, "run log")}; latest job ${latestCronRun.jobId} finished ${latestCronRun.status}.`
                : runtimeObservations.cronJobsCount > 0
                    ? "Cron jobs are configured locally, but no recent run logs were found."
                    : "No cron jobs are configured in the detected OpenClaw runtime.",
            owner: "Cron",
            stage: latestCronRun ? latestCronRun.status : runtimeObservations.cronJobsCount > 0 ? "Waiting" : "Idle",
            updatedAt: latestCronRun ? formatRelativeTime(latestCronRun.runAtMs) : "Unknown",
            tone: latestCronRun ? (latestCronRun.status === "ok" ? "positive" : "warning") : "neutral"
        },
        {
            id: "workstream-config",
            title: "Local runtime config",
            detail: runtimeObservations.source === "live"
                ? `${formatCount(runtimeObservations.configuredAgents.length, "configured agent")}, ${formatCount(runtimeObservations.providerCount, "provider")}, and ${formatCount(runtimeObservations.modelCount, "model")} were indexed from ${shortenHomePath(runtimeObservations.configPath)}.`
                : "OpenClaw config was unavailable, so the shell stayed on its typed fallback posture.",
            owner: "Config",
            stage: runtimeObservations.source === "live" ? "Observed" : "Fallback",
            updatedAt: formatRelativeTime(configTouchedAt),
            tone: runtimeObservations.source === "live" ? "positive" : "warning"
        }
    ];
}
function createAlerts(runtimeObservations, sessionProbe, toolsMcpProbe) {
    return [
        {
            id: "alert-electron",
            title: "Electron launch still depends on a local optional install",
            detail: "The desktop shell remains buildable and smokeable even if Electron is not present in node_modules here.",
            tone: "warning"
        },
        runtimeObservations.cronErrorRuns > 0
            ? {
                id: "alert-cron",
                title: "Cron logs include failed runs",
                detail: `${runtimeObservations.cronErrorRuns} of ${runtimeObservations.cronTotalRuns} recorded cron runs finished with errors.`,
                tone: "warning"
            }
            : {
                id: "alert-cron",
                title: runtimeObservations.cronJobsCount > 0 ? "Cron logs look healthy" : "No cron jobs configured",
                detail: runtimeObservations.cronJobsCount > 0
                    ? `Recent cron observations are readable and ${runtimeObservations.cronDeliveredRuns} delivered outputs were recorded.`
                    : "The dashboard detected no configured cron jobs and kept the rest of the shell stable.",
                tone: runtimeObservations.cronJobsCount > 0 ? "neutral" : "neutral"
            },
        {
            id: "alert-fallback",
            title: toolsMcpProbe.source === "live" ? "Tools probes are live, MCP execution stays local-only" : "Tools and MCP remain conservative",
            detail: toolsMcpProbe.source === "live"
                ? toolsMcpProbe.discoveredMcpRoots.length > 0
                    ? "Tool and MCP root probing is now live, and the detail panel can execute connector controls only against Studio-local in-memory state."
                    : "Tool probing is now live across OpenClaw, Codex, and workspace surfaces; no dedicated MCP roots were found, so connector controls remain constrained to Studio-local in-memory state."
                : sessionProbe.source === "live" || runtimeObservations.source === "live"
                    ? "Dashboard and Agents now use local data, but tool and MCP surfaces still stay on safe structured fallback."
                    : "The shell remains entirely fallback-safe until more reliable local runtime signals are available.",
            tone: "neutral"
        }
    ];
}
function createSystemChecks(systemStatus, runtimeObservations, skillProbe, codexProbe) {
    return [
        ...systemStatus.checks.map((check) => ({ ...check })),
        {
            id: "check-openclaw-config",
            label: "OpenClaw Config",
            value: runtimeObservations.source === "live" ? "Detected" : "Unavailable",
            detail: shortenHomePath(runtimeObservations.configPath),
            tone: runtimeObservations.source === "live" ? "positive" : "warning"
        },
        {
            id: "check-cron-logs",
            label: "Cron Logs",
            value: runtimeObservations.cronTotalRuns > 0
                ? `${runtimeObservations.cronTotalRuns} runs`
                : runtimeObservations.cronJobsCount > 0
                    ? "No runs"
                    : "Not configured",
            detail: runtimeObservations.cronTotalRuns > 0
                ? `${runtimeObservations.cronOkRuns} ok / ${runtimeObservations.cronErrorRuns} error across ${formatCount(runtimeObservations.cronJobsCount, "job")}.`
                : "No cron run logs were available in the local OpenClaw home.",
            tone: runtimeObservations.cronTotalRuns > 0
                ? runtimeObservations.cronErrorRuns > 0
                    ? "warning"
                    : "positive"
                : runtimeObservations.cronJobsCount > 0
                    ? "neutral"
                    : "neutral"
        },
        {
            id: "check-skills",
            label: "Skill Scan",
            value: skillProbe.source === "live" ? `${skillProbe.totalSkills} indexed` : "Fallback",
            detail: skillProbe.source === "live"
                ? `${skillProbe.sections.length} live skill section(s) discovered across ${formatCount(skillProbe.rootsScanned.length, "known root")}.`
                : "No local skill roots were readable, so the skills catalog stayed on its structured mock snapshot.",
            tone: skillProbe.source === "live" ? "positive" : "neutral"
        },
        {
            id: "check-codex",
            label: "Codex Runtime",
            value: codexProbe.source === "live"
                ? codexProbe.tasks.length > 0
                    ? `${codexProbe.tasks.length} sessions`
                    : codexProbe.authPresent || codexProbe.configuredModel || codexProbe.reviewModel
                        ? "Config only"
                        : "Observed"
                : "Fallback",
            detail: codexProbe.source === "live"
                ? `${codexProbe.authPresent ? "auth present" : codexProbe.requiresOpenAiAuth ? "auth missing" : "auth not required"} · ${formatCount(codexProbe.enabledPluginCount, "plugin")} enabled of ${codexProbe.pluginCount} · ${formatCount(codexProbe.shellSnapshotsCount, "shell snapshot")}.`
                : "No local Codex config or session roots were readable, so the shell kept the typed fallback state.",
            tone: codexProbe.source === "live"
                ? codexProbe.requiresOpenAiAuth && !codexProbe.authPresent
                    ? "warning"
                    : "positive"
                : "neutral"
        }
    ];
}
function createHomeActivity(baseActivity, sessionProbe, interactiveSessions, runtimeObservations) {
    const latestInteractiveSession = interactiveSessions[0] ?? null;
    const latestCronRun = runtimeObservations.recentCronRuns[0] ?? null;
    const nextItems = [
        {
            id: "activity-runtime-snapshot",
            title: sessionProbe.source === "live" || runtimeObservations.source === "live"
                ? "Runtime snapshot is now locally observed"
                : "Runtime snapshot stayed on fallback",
            detail: sessionProbe.source === "live" || runtimeObservations.source === "live"
                ? "Dashboard and Agents are now driven by local system, session, and runtime observations where available."
                : "No usable local runtime signals were detected, so the shell kept rendering the mock-safe baseline.",
            timestamp: "Now"
        }
    ];
    if (latestInteractiveSession) {
        nextItems.push({
            id: "activity-latest-session",
            title: `Latest interactive session: ${latestInteractiveSession.title}`,
            detail: `${formatModelLabel(latestInteractiveSession.provider, latestInteractiveSession.model)} in ${shortenHomePath(latestInteractiveSession.cwd)}.`,
            timestamp: latestInteractiveSession.updatedAt
        });
    }
    if (latestCronRun) {
        nextItems.push({
            id: "activity-latest-cron",
            title: `Latest cron run: ${latestCronRun.jobId}`,
            detail: `${latestCronRun.status} via ${formatModelLabel(latestCronRun.provider, latestCronRun.model)}.`,
            timestamp: formatRelativeTime(latestCronRun.runAtMs)
        });
    }
    return [...nextItems, ...baseActivity].slice(0, 3);
}
function createAgentRoster(sessionProbe, interactiveSessions, cronBackedSessions, runtimeObservations) {
    const roster = [];
    const latestInteractiveSession = interactiveSessions[0] ?? null;
    const latestCronRun = runtimeObservations.recentCronRuns[0] ?? null;
    for (const configuredAgent of runtimeObservations.configuredAgents) {
        const agentSessions = sessionProbe.sessionRecords.filter((session) => session.owner === configuredAgent.id);
        const latestAgentSession = agentSessions[0] ?? null;
        roster.push({
            id: `agent-${configuredAgent.id}`,
            name: configuredAgent.id,
            role: "Configured agent",
            model: configuredAgent.model ?? formatModelLabel(latestAgentSession?.provider, latestAgentSession?.model),
            workspace: shortenHomePath(configuredAgent.workspace ?? latestAgentSession?.cwd ?? null),
            status: latestAgentSession?.status ?? "waiting",
            focus: latestAgentSession
                ? `Latest local session: ${latestAgentSession.title}`
                : "No recent local session was observed for this configured agent.",
            approvals: runtimeObservations.cronJobsCount > 0
                ? `${formatCount(runtimeObservations.cronJobsCount, "cron job")} configured`
                : "No approval surface detected",
            isolation: "config-scoped lane",
            handoff: latestAgentSession ? `Session ${latestAgentSession.id.slice(0, 8)}` : "Awaiting session handoff",
            updatedAt: latestAgentSession?.updatedAt ?? formatRelativeTime(parseIsoTimestamp(runtimeObservations.lastTouchedAt))
        });
    }
    if (latestInteractiveSession) {
        roster.push({
            id: "runtime-interactive",
            name: "Interactive sessions",
            role: "Runtime session lane",
            model: formatModelLabel(latestInteractiveSession.provider, latestInteractiveSession.model),
            workspace: shortenHomePath(latestInteractiveSession.cwd),
            status: latestInteractiveSession.status,
            focus: `${formatCount(interactiveSessions.length, "recent session")} detected outside cron-driven runs.`,
            approvals: "Session titles are derived from local JSONL content",
            isolation: "session-local lane",
            handoff: "Runtime session handoff active",
            updatedAt: latestInteractiveSession.updatedAt
        });
    }
    if (latestCronRun || cronBackedSessions.length > 0 || runtimeObservations.cronJobsCount > 0) {
        roster.push({
            id: "runtime-cron",
            name: "Scheduled runtime",
            role: "Cron execution lane",
            model: formatModelLabel(latestCronRun?.provider ?? cronBackedSessions[0]?.provider, latestCronRun?.model ?? cronBackedSessions[0]?.model),
            workspace: shortenHomePath(runtimeObservations.defaultWorkspace),
            status: deriveStatus(latestCronRun?.runAtMs ?? cronBackedSessions[0]?.updatedAtMs ?? null),
            focus: runtimeObservations.cronTotalRuns > 0
                ? `${runtimeObservations.cronOkRuns} ok / ${runtimeObservations.cronErrorRuns} error across ${formatCount(runtimeObservations.cronTotalRuns, "logged run")}.`
                : runtimeObservations.cronJobsCount > 0
                    ? "Cron jobs are configured locally, but no recent run logs were detected."
                    : "Recent scheduled session prompts were detected without a current cron config snapshot.",
            approvals: runtimeObservations.cronDeliveredRuns > 0
                ? `${formatCount(runtimeObservations.cronDeliveredRuns, "delivered output")} recorded`
                : "No delivered outputs recorded",
            isolation: "background lane",
            handoff: latestCronRun ? `Cron ${latestCronRun.jobId}` : "Background handoff pending",
            updatedAt: formatRelativeTime(latestCronRun?.runAtMs ?? cronBackedSessions[0]?.updatedAtMs ?? null)
        });
    }
    return roster;
}
function createAgentMetrics(roster, interactiveSessions, runtimeObservations) {
    const activeLanes = roster.filter((agent) => agent.status === "active").length;
    const discoveredModels = new Set(roster
        .map((agent) => agent.model)
        .concat(runtimeObservations.modelLabels)
        .filter((value) => Boolean(value) && value !== "Unknown"));
    return [
        {
            id: "agent-metric-active",
            label: "Active Lanes",
            value: String(activeLanes),
            detail: `${formatCount(roster.length, "lane")} rendered from local config and runtime observations.`,
            tone: activeLanes > 0 ? "positive" : "warning"
        },
        {
            id: "agent-metric-runtime",
            label: "Runtime Signals",
            value: runtimeObservations.cronTotalRuns > 0
                ? `${runtimeObservations.cronTotalRuns} cron logs`
                : `${interactiveSessions.length} recent sessions`,
            detail: runtimeObservations.cronTotalRuns > 0
                ? `${runtimeObservations.cronOkRuns} ok / ${runtimeObservations.cronErrorRuns} error.`
                : "No cron logs were available, so the roster is leaning on direct session activity.",
            tone: runtimeObservations.cronErrorRuns > 0 ? "warning" : "neutral"
        },
        {
            id: "agent-metric-models",
            label: "Model Coverage",
            value: formatCount(discoveredModels.size, "model"),
            detail: discoveredModels.size > 0
                ? Array.from(discoveredModels).slice(0, 3).join(" · ")
                : "No live model labels were available from the local runtime.",
            tone: discoveredModels.size > 0 ? "neutral" : "warning"
        }
    ];
}
function createAgentActivity(baseActivity, interactiveSessions, runtimeObservations) {
    const latestInteractiveSession = interactiveSessions[0] ?? null;
    const latestCronRun = runtimeObservations.recentCronRuns[0] ?? null;
    const items = [];
    if (latestInteractiveSession) {
        items.push({
            id: "agent-activity-session",
            title: `Interactive lane touched ${shortenHomePath(latestInteractiveSession.cwd)}`,
            detail: `Latest session “${latestInteractiveSession.title}” used ${formatModelLabel(latestInteractiveSession.provider, latestInteractiveSession.model)}.`,
            timestamp: latestInteractiveSession.updatedAt
        });
    }
    if (latestCronRun) {
        items.push({
            id: "agent-activity-cron",
            title: `Cron lane finished ${latestCronRun.jobId}`,
            detail: `${latestCronRun.status} via ${formatModelLabel(latestCronRun.provider, latestCronRun.model)}.`,
            timestamp: formatRelativeTime(latestCronRun.runAtMs)
        });
    }
    if (runtimeObservations.source === "live") {
        items.push({
            id: "agent-activity-config",
            title: "Configured agents were indexed from local runtime config",
            detail: `${formatCount(runtimeObservations.configuredAgents.length, "configured agent")} discovered in ${shortenHomePath(runtimeObservations.configPath)}.`,
            timestamp: formatRelativeTime(parseIsoTimestamp(runtimeObservations.lastTouchedAt))
        });
    }
    return [...items, ...baseActivity].slice(0, 3);
}
function createAgentDelegationState(baseAgents, roster, interactiveSessions, runtimeObservations, codexProbe) {
    if (runtimeObservations.source !== "live" && interactiveSessions.length === 0) {
        return {
            delegationSummary: baseAgents.delegationSummary,
            delegationNotes: baseAgents.delegationNotes
        };
    }
    const latestInteractiveSession = interactiveSessions[0] ?? null;
    const latestCronRun = runtimeObservations.recentCronRuns[0] ?? null;
    const latestTask = codexProbe.tasks[0] ?? null;
    return {
        delegationSummary: `Delegation remains local-only and observational: ${formatCount(roster.length, "lane")} are visible, ` +
            `${formatCount(runtimeObservations.cronJobsCount, "background cron path")} are tracked, and result handoff stays on shell surfaces instead of spawning host-side workers.`,
        delegationNotes: [
            {
                id: "agent-delegation-spawn",
                label: "Spawn path",
                value: `${formatCount(roster.length, "lane")} observed`,
                detail: "Configured agents, runtime session lanes, and cron-backed lanes are modeled as delegation paths; Studio does not spawn worktrees, tmux panes, or remote workers.",
                tone: "neutral"
            },
            {
                id: "agent-delegation-isolation",
                label: "Isolation",
                value: "local-only / shared repo",
                detail: "Isolation is expressed as lane ownership and workspace scoping only. Real subagent process isolation remains outside this shell.",
                tone: "warning"
            },
            {
                id: "agent-delegation-background",
                label: "Background",
                value: latestCronRun ? `${latestCronRun.jobId} ${latestCronRun.status}` : `${runtimeObservations.cronJobsCount} configured`,
                detail: runtimeObservations.cronJobsCount > 0
                    ? `${runtimeObservations.cronDeliveredRuns} delivered outputs recorded across ${runtimeObservations.cronTotalRuns} logged runs.`
                    : "No background cron path is currently configured.",
                tone: runtimeObservations.cronJobsCount > 0 ? "neutral" : "warning"
            },
            {
                id: "agent-delegation-handoff",
                label: "Result handoff",
                value: latestInteractiveSession && latestTask ? `${latestInteractiveSession.workspace} -> ${latestTask.target}` : "No active handoff",
                detail: latestInteractiveSession && latestTask
                    ? `Latest runtime session “${latestInteractiveSession.title}” aligns with Codex task “${latestTask.title}”.`
                    : "Result handoff is currently represented only by the observed shell surfaces.",
                tone: latestInteractiveSession && latestTask ? "positive" : "neutral"
            }
        ]
    };
}
function createSkillsState(baseSkills, skillProbe, toolsMcpProbe) {
    const baseSkillSections = baseSkills.sections.filter((section) => section.id !== "skills-tools" && section.id !== "skills-mcp" && section.id !== "skills-sources");
    const baseToolsSection = baseSkills.sections.find((section) => section.id === "skills-tools") ?? null;
    const baseMcpSection = baseSkills.sections.find((section) => section.id === "skills-mcp") ?? null;
    const baseSourcesSection = baseSkills.sections.find((section) => section.id === "skills-sources") ?? null;
    const skillSections = skillProbe.source === "live" && skillProbe.sections.length > 0 ? skillProbe.sections : baseSkillSections;
    if (skillSections.length === 0 && toolsMcpProbe.source !== "live") {
        return baseSkills;
    }
    const toolItems = toolsMcpProbe.source === "live"
        ? [
            ...(baseToolsSection?.items.map((item) => item.id === "tool-ipc"
                ? {
                    ...item,
                    detail: "Preload exposes the typed renderer API and now carries live system, session, skill, Codex, and tool/MCP observations."
                }
                : item.id === "tool-smoke"
                    ? {
                        ...item,
                        detail: "Smoke remains the offline validation path while the runtime progressively adds live local probes."
                    }
                    : item) ?? []),
            {
                id: "tool-openclaw-runtime",
                name: "OpenClaw tool profile",
                surface: "Runtime",
                status: toolsMcpProbe.openclawToolProfile ? "Configured" : "Unavailable",
                source: "runtime",
                detail: toolsMcpProbe.openclawToolProfile
                    ? `${toolsMcpProbe.openclawToolProfile} profile · exec ${toolsMcpProbe.execSecurity ?? "unknown"}/${toolsMcpProbe.execAsk ?? "unknown"} · search ${toolsMcpProbe.webSearchEnabled ? `on (${toolsMcpProbe.webSearchProvider ?? "configured"})` : "off"} · fetch ${toolsMcpProbe.webFetchEnabled ? "on" : "off"}${toolsMcpProbe.openclawAlsoAllow.length > 0 ? ` · alsoAllow ${toolsMcpProbe.openclawAlsoAllow.join(", ")}` : ""}.`
                    : "openclaw.json was unavailable or did not expose a tool profile.",
                origin: "OpenClaw Config",
                path: shortenHomePath(toolsMcpProbe.openclawConfigPath),
                tone: toolsMcpProbe.openclawToolProfile ? "positive" : "warning"
            },
            {
                id: "tool-openclaw-plugins",
                name: "OpenClaw plugin runtime",
                surface: "Plugin",
                status: toolsMcpProbe.pluginInstallCount > 0 || toolsMcpProbe.pluginLoadPaths.length > 0 ? "Observed" : "Sparse",
                source: "runtime",
                detail: `${formatCount(toolsMcpProbe.pluginInstallCount, "install")}, ${formatCount(toolsMcpProbe.pluginEntryCount, "entry", "entries")}, ${formatCount(toolsMcpProbe.pluginAllowCount, "allow rule")}.${toolsMcpProbe.pluginInstallIds.length > 0
                    ? ` Installs: ${toolsMcpProbe.pluginInstallIds.join(" · ")}.`
                    : ""}${toolsMcpProbe.pluginEntryIds.length > 0
                    ? ` Entries: ${toolsMcpProbe.pluginEntryIds.join(" · ")}.`
                    : ""}${toolsMcpProbe.pluginLoadPaths.length > 0
                    ? ` Load paths: ${toolsMcpProbe.pluginLoadPaths.map((pluginPath) => shortenHomePath(pluginPath)).join(" · ")}.`
                    : " No additional plugin load paths were configured."}`,
                origin: "OpenClaw Plugins",
                path: toolsMcpProbe.pluginLoadPaths.length > 0
                    ? shortenHomePath(toolsMcpProbe.pluginLoadPaths[0])
                    : shortenHomePath(toolsMcpProbe.openclawConfigPath),
                tone: toolsMcpProbe.pluginInstallCount > 0 || toolsMcpProbe.pluginLoadPaths.length > 0 ? "positive" : "neutral"
            },
            {
                id: "tool-codex-runtime",
                name: "Codex local runtime",
                surface: "CLI",
                status: toolsMcpProbe.codexConfigPresent && toolsMcpProbe.codexAuthPresent && toolsMcpProbe.codexSessionsPresent ? "Ready" : "Partial",
                source: "runtime",
                detail: `config ${toolsMcpProbe.codexConfigPresent ? "present" : "missing"} · auth ${toolsMcpProbe.codexAuthPresent ? "present" : "missing"} · sessions ${toolsMcpProbe.codexSessionsPresent ? "present" : "missing"} · shell snapshots ${toolsMcpProbe.codexShellSnapshotsPresent ? "present" : "missing"} · curated plugin cache ${toolsMcpProbe.codexPluginCachePresent ? "present" : "missing"} · temp plugin checkout ${toolsMcpProbe.codexPluginTempRepoPresent ? "present" : "missing"}.`,
                origin: "Codex Home",
                path: shortenHomePath(toolsMcpProbe.codexConfigPath),
                tone: toolsMcpProbe.codexConfigPresent && toolsMcpProbe.codexAuthPresent && toolsMcpProbe.codexSessionsPresent ? "positive" : "neutral"
            },
            {
                id: "tool-workspace-tooling",
                name: "Workspace tooling",
                surface: "Tooling",
                status: toolsMcpProbe.toolingRootPresent ? "Detected" : "Unavailable",
                source: "runtime",
                detail: toolsMcpProbe.toolingRootPresent
                    ? `${shortenHomePath(toolsMcpProbe.toolingRoot)} is present · playwright-runner ${toolsMcpProbe.playwrightRunnerPresent ? "detected" : "missing"} · ${formatCount(toolsMcpProbe.hookCount, "hook directory", "hook directories")}.${toolsMcpProbe.hookNames.length > 0 ? ` Hooks: ${toolsMcpProbe.hookNames.join(" · ")}.` : ""}`
                    : "No shared workspace tooling root was detected under ~/.openclaw/workspace/.tooling.",
                origin: "Workspace",
                path: shortenHomePath(toolsMcpProbe.toolingRoot),
                tone: toolsMcpProbe.toolingRootPresent ? "positive" : "warning"
            }
        ]
        : (baseToolsSection?.items ?? []);
    const mcpItems = toolsMcpProbe.source === "live"
        ? [
            {
                id: "mcp-root-scan",
                name: "Dedicated MCP roots",
                surface: "MCP",
                status: toolsMcpProbe.discoveredMcpRoots.length > 0 ? "Detected" : "Not found",
                source: "runtime",
                detail: toolsMcpProbe.discoveredMcpRoots.length > 0
                    ? `Found ${formatCount(toolsMcpProbe.discoveredMcpRoots.length, "dedicated root")} at ${toolsMcpProbe.discoveredMcpRoots
                        .map((root) => shortenHomePath(root))
                        .join(" · ")}. Detail now supports Studio-local root selection plus blocked host/runtime connect previews without touching the host runtime.`
                    : `Scanned ${toolsMcpProbe.mcpRootsScanned.map((root) => shortenHomePath(root)).join(" · ")} and found no dedicated MCP config roots. Detail still exposes Studio-local root selection history plus blocked host/runtime connect previews.`,
                origin: "Runtime Probe",
                path: toolsMcpProbe.discoveredMcpRoots.length > 0 ? shortenHomePath(toolsMcpProbe.discoveredMcpRoots[0]) : undefined,
                tone: toolsMcpProbe.discoveredMcpRoots.length > 0 ? "positive" : "warning"
            },
            {
                id: "mcp-adjacent-runtime",
                name: "Connector-adjacent runtime",
                surface: "Plugin bridge",
                status: toolsMcpProbe.codexPluginCachePresent || toolsMcpProbe.pluginInstallCount > 0 || toolsMcpProbe.pluginLoadPaths.length > 0
                    ? "Observed"
                    : "Fallback",
                source: "runtime",
                detail: `Codex plugin cache ${toolsMcpProbe.codexPluginCachePresent ? "present" : "missing"} · OpenClaw plugin installs ${toolsMcpProbe.pluginInstallCount} (${toolsMcpProbe.pluginInstallIds.join(" · ") || "none"}) · load paths ${toolsMcpProbe.pluginLoadPaths.length}.${toolsMcpProbe.discoveredMcpRoots.length === 0
                    ? ` Dedicated MCP roots are absent here; scanned ${toolsMcpProbe.mcpRootsScanned
                        .map((root) => shortenHomePath(root))
                        .join(" · ")} and kept connector rows on Studio-local execution plus blocked host/runtime previews only.`
                    : " Dedicated roots were found, and the detail panel now exposes Studio-local bridge stage, activate, apply, and blocked host/runtime preview controls."}`,
                origin: "Codex + OpenClaw",
                path: toolsMcpProbe.pluginLoadPaths.length > 0
                    ? shortenHomePath(toolsMcpProbe.pluginLoadPaths[0])
                    : shortenHomePath(toolsMcpProbe.codexConfigPath),
                tone: toolsMcpProbe.codexPluginCachePresent || toolsMcpProbe.pluginInstallCount > 0 || toolsMcpProbe.pluginLoadPaths.length > 0
                    ? "neutral"
                    : "warning"
            },
            ...(baseMcpSection
                ? baseMcpSection.items.map((item) => ({
                    ...item,
                    status: toolsMcpProbe.discoveredMcpRoots.length > 0 ? "Fallback active" : "Fallback active",
                    detail: toolsMcpProbe.discoveredMcpRoots.length > 0
                        ? "Dedicated MCP roots exist locally, but the alpha shell still keeps connector actions on structured fallback until a stable bridge is defined."
                        : "No dedicated MCP roots were detected locally, so the alpha shell keeps connector actions on structured fallback instead of inventing readiness."
                }))
                : [])
        ]
        : (baseMcpSection?.items ?? []);
    const toolsSection = baseToolsSection
        ? {
            ...baseToolsSection,
            description: toolsMcpProbe.source === "live"
                ? "Shell-facing execution surfaces now mix bridge helpers with local OpenClaw, Codex, and workspace tooling probes."
                : baseToolsSection.description,
            items: toolItems
        }
        : null;
    const mcpSection = baseMcpSection
        ? {
            ...baseMcpSection,
            description: toolsMcpProbe.source === "live"
                ? "Known local MCP roots are now probed directly; when none are found the shell says so and keeps fallback connector rows."
                : baseMcpSection.description,
            items: mcpItems
        }
        : null;
    const sourceFallbackItems = new Map((baseSourcesSection?.items ?? []).map((item) => [item.id, item]));
    const getSkillSourceCount = (sectionId) => skillProbe.sections.find((section) => section.id === sectionId)?.items.length ?? 0;
    const sourcesSection = skillProbe.source === "live" || toolsMcpProbe.source === "live" || baseSourcesSection
        ? {
            id: "skills-sources",
            label: "Extension Sources",
            description: "Capability provenance across local skill roots, extension bundles, plugin caches, and MCP roots.",
            items: [
                {
                    ...(sourceFallbackItems.get("skill-source-openclaw-home") ?? {}),
                    id: "skill-source-openclaw-home",
                    name: "OpenClaw home skills",
                    surface: "Skill root",
                    status: getSkillSourceCount("skills-openclaw-home") > 0 ? `${getSkillSourceCount("skills-openclaw-home")} indexed` : "Not found",
                    source: skillProbe.source === "live" ? "runtime" : "mock",
                    detail: skillProbe.source === "live"
                        ? `Root ${shortenHomePath(skillProbe.rootsScanned[0] ?? "")} -> ${getSkillSourceCount("skills-openclaw-home")} indexed skills.`
                        : sourceFallbackItems.get("skill-source-openclaw-home")?.detail ?? "OpenClaw home skill root fallback.",
                    origin: "OpenClaw Home",
                    path: skillProbe.source === "live" ? shortenHomePath(skillProbe.rootsScanned[0] ?? "") : sourceFallbackItems.get("skill-source-openclaw-home")?.path,
                    tone: getSkillSourceCount("skills-openclaw-home") > 0 ? "positive" : "neutral"
                },
                {
                    ...(sourceFallbackItems.get("skill-source-workspace") ?? {}),
                    id: "skill-source-workspace",
                    name: "Workspace skills",
                    surface: "Skill root",
                    status: getSkillSourceCount("skills-workspace") > 0 ? `${getSkillSourceCount("skills-workspace")} indexed` : "Not found",
                    source: skillProbe.source === "live" ? "runtime" : "mock",
                    detail: skillProbe.source === "live"
                        ? `Root ${shortenHomePath(skillProbe.rootsScanned[1] ?? "")} -> ${getSkillSourceCount("skills-workspace")} indexed skills.`
                        : sourceFallbackItems.get("skill-source-workspace")?.detail ?? "Workspace skill root fallback.",
                    origin: "Workspace",
                    path: skillProbe.source === "live" ? shortenHomePath(skillProbe.rootsScanned[1] ?? "") : sourceFallbackItems.get("skill-source-workspace")?.path,
                    tone: getSkillSourceCount("skills-workspace") > 0 ? "positive" : "neutral"
                },
                {
                    ...(sourceFallbackItems.get("skill-source-extensions") ?? {}),
                    id: "skill-source-extensions",
                    name: "Extension bundles",
                    surface: "Extension root",
                    status: getSkillSourceCount("skills-extensions") > 0 ? `${getSkillSourceCount("skills-extensions")} indexed` : "Not found",
                    source: skillProbe.source === "live" ? "runtime" : "mock",
                    detail: skillProbe.source === "live"
                        ? `Root ${shortenHomePath(skillProbe.rootsScanned[2] ?? "")} -> ${getSkillSourceCount("skills-extensions")} extension-bundled skills.`
                        : sourceFallbackItems.get("skill-source-extensions")?.detail ?? "Extension bundle fallback.",
                    origin: "Extensions",
                    path: skillProbe.source === "live" ? shortenHomePath(skillProbe.rootsScanned[2] ?? "") : sourceFallbackItems.get("skill-source-extensions")?.path,
                    tone: getSkillSourceCount("skills-extensions") > 0 ? "positive" : "neutral"
                },
                {
                    ...(sourceFallbackItems.get("skill-source-plugin-load-paths") ?? {}),
                    id: "skill-source-plugin-load-paths",
                    name: "Plugin load paths",
                    surface: "Plugin source",
                    status: toolsMcpProbe.source === "live"
                        ? toolsMcpProbe.pluginLoadPaths.length > 0 || toolsMcpProbe.codexPluginCachePresent
                            ? "Observed"
                            : "Fallback"
                        : sourceFallbackItems.get("skill-source-plugin-load-paths")?.status ?? "Fallback",
                    source: toolsMcpProbe.source === "live" ? "runtime" : "mock",
                    detail: toolsMcpProbe.source === "live"
                        ? `Load paths ${toolsMcpProbe.pluginLoadPaths.length} · curated cache ${toolsMcpProbe.codexPluginCachePresent ? "present" : "missing"} · installs ${toolsMcpProbe.pluginInstallCount}.`
                        : sourceFallbackItems.get("skill-source-plugin-load-paths")?.detail ?? "Plugin source fallback.",
                    origin: "OpenClaw Plugins",
                    path: toolsMcpProbe.source === "live"
                        ? shortenHomePath(toolsMcpProbe.pluginLoadPaths[0] ?? toolsMcpProbe.codexConfigPath)
                        : sourceFallbackItems.get("skill-source-plugin-load-paths")?.path,
                    tone: toolsMcpProbe.source === "live"
                        ? toolsMcpProbe.pluginLoadPaths.length > 0 || toolsMcpProbe.codexPluginCachePresent || toolsMcpProbe.pluginInstallCount > 0
                            ? "positive"
                            : "neutral"
                        : sourceFallbackItems.get("skill-source-plugin-load-paths")?.tone ?? "neutral"
                },
                {
                    ...(sourceFallbackItems.get("skill-source-mcp-roots") ?? {}),
                    id: "skill-source-mcp-roots",
                    name: "Dedicated MCP roots",
                    surface: "MCP source",
                    status: toolsMcpProbe.source === "live"
                        ? toolsMcpProbe.discoveredMcpRoots.length > 0
                            ? `${toolsMcpProbe.discoveredMcpRoots.length} detected`
                            : "Not found"
                        : sourceFallbackItems.get("skill-source-mcp-roots")?.status ?? "Fallback",
                    source: toolsMcpProbe.source === "live" ? "runtime" : "mock",
                    detail: toolsMcpProbe.source === "live"
                        ? `Scanned ${toolsMcpProbe.mcpRootsScanned.map((root) => shortenHomePath(root)).join(" · ")} -> ${toolsMcpProbe.discoveredMcpRoots.length > 0 ? toolsMcpProbe.discoveredMcpRoots.map((root) => shortenHomePath(root)).join(" · ") : "no dedicated roots"}.`
                        : sourceFallbackItems.get("skill-source-mcp-roots")?.detail ?? "MCP root fallback.",
                    origin: "MCP Runtime",
                    path: toolsMcpProbe.source === "live" && toolsMcpProbe.discoveredMcpRoots.length > 0
                        ? shortenHomePath(toolsMcpProbe.discoveredMcpRoots[0])
                        : sourceFallbackItems.get("skill-source-mcp-roots")?.path,
                    tone: toolsMcpProbe.source === "live"
                        ? toolsMcpProbe.discoveredMcpRoots.length > 0
                            ? "positive"
                            : "warning"
                        : sourceFallbackItems.get("skill-source-mcp-roots")?.tone ?? "warning"
                }
            ]
        }
        : null;
    const summaryParts = [];
    if (skillProbe.source === "live" && skillProbe.sections.length > 0) {
        summaryParts.push(`Indexed ${skillProbe.totalSkills} local skill directories from known OpenClaw and Codex roots.`);
    }
    if (toolsMcpProbe.source === "live") {
        summaryParts.push("Tools now probe local OpenClaw, Codex, and workspace runtime surfaces.");
        summaryParts.push("MCP detail now distinguishes read-only inspection, dry-run planning, Studio-local control state, and blocked host/runtime previews.");
        summaryParts.push(toolsMcpProbe.discoveredMcpRoots.length > 0
            ? `Detected ${formatCount(toolsMcpProbe.discoveredMcpRoots.length, "dedicated MCP root")}.`
            : "No dedicated MCP roots were found, so connector rows stay on structured fallback.");
    }
    if (sourcesSection) {
        summaryParts.push("Extension provenance now distinguishes bundled skill roots, external extension bundles, plugin load-path sources, and dedicated MCP roots.");
    }
    return {
        summary: summaryParts.length > 0 ? summaryParts.join(" ") : baseSkills.summary,
        sections: [
            ...skillSections,
            ...(sourcesSection ? [sourcesSection] : []),
            ...(toolsSection ? [toolsSection] : []),
            ...(mcpSection ? [mcpSection] : [])
        ]
    };
}
function createCodexObservations(codexProbe) {
    if (codexProbe.source !== "live") {
        return cloneState().codex.observations;
    }
    const configuredModel = formatModelLabel(codexProbe.provider, codexProbe.configuredModel);
    const reviewModel = codexProbe.reviewModel ? formatModelLabel(codexProbe.provider, codexProbe.reviewModel) : "Unavailable";
    return [
        {
            id: "codex-observation-config",
            label: "Config",
            value: codexProbe.configuredModel || codexProbe.provider ? configuredModel : "Observed",
            detail: `review ${reviewModel}${codexProbe.reasoningEffort ? ` · effort ${codexProbe.reasoningEffort}` : ""}`,
            tone: codexProbe.configuredModel || codexProbe.provider ? "positive" : "neutral"
        },
        {
            id: "codex-observation-auth",
            label: "Auth / Plugins",
            value: codexProbe.requiresOpenAiAuth ? (codexProbe.authPresent ? "Ready" : "Missing") : codexProbe.authPresent ? "Present" : "Not required",
            detail: `${formatCount(codexProbe.enabledPluginCount, "plugin")} enabled of ${codexProbe.pluginCount} configured.`,
            tone: codexProbe.requiresOpenAiAuth ? (codexProbe.authPresent ? "positive" : "warning") : "neutral"
        },
        {
            id: "codex-observation-sessions",
            label: "Session Roots",
            value: `${codexProbe.tasks.length} recent`,
            detail: `${shortenHomePath(codexProbe.sessionsRoot)} · ${formatCount(codexProbe.shellSnapshotsCount, "shell snapshot")}.`,
            tone: codexProbe.tasks.length > 0 || codexProbe.shellSnapshotsCount > 0 ? "positive" : "neutral"
        },
        {
            id: "codex-observation-paths",
            label: "Config Path",
            value: codexProbe.latestCliVersion ?? "CLI unknown",
            detail: shortenHomePath(codexProbe.configPath),
            tone: codexProbe.latestCliVersion ? "neutral" : "warning"
        }
    ];
}
function createCodexState(baseCodex, codexProbe, projectContext) {
    if (codexProbe.source !== "live") {
        return {
            ...baseCodex,
            contextSummary: projectContext.summary,
            contextNotes: projectContext.notes
        };
    }
    const hasLiveTasks = codexProbe.tasks.length > 0;
    return {
        summary: hasLiveTasks
            ? "Recent Codex task sessions are now read from local ~/.codex session logs, and the detail panel also reflects local config, auth, plugin, and shell-snapshot metadata. Status stays heuristic and safe: unfinished logs updated recently show as running, older unfinished logs show as recent, and completed logs stay complete."
            : "Codex config and auth readiness are observable locally even when no recent session logs were readable, so the page now surfaces local config/auth/plugin roots instead of staying on a generic placeholder. The agent-loop surface also remains read-only and observational: it summarizes turn continuity, recovery hints, and interruptions without replaying any session.",
        stats: codexProbe.stats,
        tasks: hasLiveTasks ? codexProbe.tasks : baseCodex.tasks,
        observations: createCodexObservations(codexProbe),
        loopSummary: codexProbe.loopSummary,
        loopStats: codexProbe.loopStats,
        loopSignals: codexProbe.loopSignals,
        contextSummary: projectContext.summary,
        contextNotes: projectContext.notes
    };
}
function buildShellState(baseState, systemStatus, sessionProbe, runtimeObservations, skillProbe, codexProbe, projectContext, startupRouting, toolsMcpProbe, toolsMcpControlSession) {
    const shellState = cloneState();
    const hasLiveSessions = sessionProbe.source === "live" && sessionProbe.sessionRecords.length > 0;
    const hasLiveRuntime = runtimeObservations.source === "live";
    const hasLiveSkills = skillProbe.source === "live" && skillProbe.totalSkills > 0;
    const hasLiveCodex = codexProbe.source === "live";
    const hasLiveToolsMcp = toolsMcpProbe.source === "live";
    const bridgeMode = systemStatus.source === "live" || hasLiveSessions || hasLiveRuntime || hasLiveSkills || hasLiveCodex || hasLiveToolsMcp ? "hybrid" : "mock";
    const interactiveSessions = getInteractiveSessions(sessionProbe);
    const cronBackedSessions = getCronBackedSessions(sessionProbe);
    const roster = hasLiveSessions || hasLiveRuntime ? createAgentRoster(sessionProbe, interactiveSessions, cronBackedSessions, runtimeObservations) : baseState.agents.roster;
    shellState.status = {
        ...systemStatus.status,
        bridge: bridgeMode
    };
    shellState.boundary = (0, tools_mcp_1.buildToolsMcpShellBoundarySummary)(toolsMcpProbe, toolsMcpControlSession);
    shellState.dashboard.headline =
        bridgeMode === "hybrid"
            ? "Local OpenClaw observations now feed the shell summary from system probes, session history, runtime config, and skill indexing while renderer-safe fallback stays intact. The boundary ladder below shows how far execution can go before host mutation is withheld."
            : baseState.dashboard.headline;
    shellState.dashboard.metrics = createMetrics(bridgeMode, sessionProbe, interactiveSessions, cronBackedSessions, runtimeObservations);
    shellState.dashboard.workstreams = createWorkstreams(sessionProbe, interactiveSessions, runtimeObservations);
    shellState.dashboard.alerts = createAlerts(runtimeObservations, sessionProbe, toolsMcpProbe);
    shellState.dashboard.systemChecks = createSystemChecks(systemStatus, runtimeObservations, skillProbe, codexProbe);
    shellState.sessions = hasLiveSessions ? sessionProbe.sessions : baseState.sessions;
    shellState.home.panels = shellState.home.panels.map((panel) => {
        if (panel.id !== "system") {
            return panel;
        }
        return {
            ...panel,
            description: bridgeMode === "hybrid"
                ? "Bridge contracts, Electron shell, and renderer shell are now observing local OpenClaw runtime signals."
                : panel.description,
            stats: panel.stats.map((stat) => {
                if (stat.label === "Runtime") {
                    return {
                        ...stat,
                        value: shellState.status.runtime === "ready" ? "Ready" : "Degraded",
                        tone: shellState.status.runtime === "ready" ? "positive" : "warning"
                    };
                }
                if (stat.label === "Bridge") {
                    return {
                        ...stat,
                        value: bridgeMode === "hybrid" ? "Hybrid live" : "Mock IPC",
                        tone: bridgeMode === "hybrid" ? "positive" : "warning"
                    };
                }
                if (stat.label === "Workspace") {
                    return {
                        ...stat,
                        value: hasLiveRuntime ? shortenHomePath(runtimeObservations.defaultWorkspace) : stat.value,
                        tone: hasLiveRuntime ? "positive" : stat.tone
                    };
                }
                return stat;
            })
        };
    });
    shellState.home.recentActivity = createHomeActivity(baseState.home.recentActivity, sessionProbe, interactiveSessions, runtimeObservations);
    shellState.agents = {
        summary: hasLiveSessions || hasLiveRuntime
            ? "Local OpenClaw config, recent sessions, and cron run logs are now shaping the roster. When a probe is missing, the shell keeps a typed fallback instead of breaking."
            : baseState.agents.summary,
        metrics: hasLiveSessions || hasLiveRuntime ? createAgentMetrics(roster, interactiveSessions, runtimeObservations) : baseState.agents.metrics,
        roster,
        recentActivity: hasLiveSessions || hasLiveRuntime
            ? createAgentActivity(baseState.agents.recentActivity, interactiveSessions, runtimeObservations)
            : baseState.agents.recentActivity,
        ...createAgentDelegationState(baseState.agents, roster, interactiveSessions, runtimeObservations, codexProbe)
    };
    shellState.codex = createCodexState(baseState.codex, codexProbe, projectContext);
    shellState.skills = createSkillsState(baseState.skills, skillProbe, toolsMcpProbe);
    shellState.settings.summary = `${baseState.settings.summary} ${startupRouting.summary}`;
    shellState.settings.sections = shellState.settings.sections.map((section) => {
        if (section.id === "settings-runtime") {
            return {
                ...section,
                items: updateSettingItem(updateSettingItem(section.items, "settings-bridge", {
                    value: bridgeMode === "hybrid" ? "Hybrid" : "Mock",
                    detail: bridgeMode === "hybrid"
                        ? "Dashboard, Agents, Codex, Skills, and Tools/MCP now mix local runtime observations with typed fallback where probes stay intentionally read-only."
                        : "Live runtime probes were unavailable, so the shell stayed mock-backed.",
                    tone: bridgeMode === "hybrid" ? "positive" : "warning"
                }), "settings-fallback", {
                    value: hasLiveSessions || hasLiveRuntime || hasLiveCodex || hasLiveToolsMcp ? "Active" : "Renderer-safe",
                    detail: hasLiveSessions || hasLiveRuntime || hasLiveCodex || hasLiveToolsMcp
                        ? "Renderer is receiving live-backed observations with typed fallback still available for missing probes."
                        : "Renderer keeps rendering even when live runtime access is unavailable.",
                    tone: "positive"
                })
            };
        }
        if (section.id === "settings-startup") {
            return {
                ...section,
                items: startupRouting.items.map((item) => ({ ...item }))
            };
        }
        return section;
    });
    shellState.inspector.summary =
        hasLiveToolsMcp || hasLiveRuntime
            ? "Shared boundary state now summarizes the live local-only layer, preview-host contract, per-slot trace focus, release approval pipeline posture, dock linkage, blockers, and future executor posture."
            : baseState.inspector.summary;
    shellState.inspector.boundary = shellState.boundary;
    const traceFocus = createInspectorTraceFocus(shellState.boundary);
    const currentReleaseStage = (0, shared_1.selectStudioReleaseApprovalPipelineStage)(shellState.boundary.hostExecutor.releaseApprovalPipeline);
    shellState.inspector.sections = [
        {
            id: "layer",
            label: "Current layer",
            value: formatBoundaryLayerLabel(shellState.boundary.currentLayer)
        },
        {
            id: "host",
            label: "Host state",
            value: formatBoundaryHostState(shellState.boundary.hostState)
        },
        {
            id: "next",
            label: "Next layer",
            value: formatBoundaryLayerLabel(shellState.boundary.nextLayer)
        },
        {
            id: "slot-focus",
            label: "Trace focus",
            value: traceFocus?.label ?? "Unavailable"
        },
        {
            id: "handler",
            label: "Handler state",
            value: traceFocus ? `${traceFocus.handlerState} / disabled` : "Unavailable"
        },
        {
            id: "validator",
            label: "Validator state",
            value: traceFocus ? `${traceFocus.validatorState} / slot-linked` : "Unavailable"
        },
        {
            id: "approval-pipeline",
            label: "Approval pipeline",
            value: currentReleaseStage ? `${currentReleaseStage.label} / ${currentReleaseStage.status}` : "Unavailable"
        },
        {
            id: "rollback",
            label: "Rollback posture",
            value: traceFocus ? `${traceFocus.rollbackDisposition} / ${traceFocus.terminalStatus}` : "Unavailable"
        },
        {
            id: "audit",
            label: "Audit posture",
            value: traceFocus?.rollbackDisposition === "incomplete" ? "Rollback-linked" : "Placeholder linked"
        },
        {
            id: "blocked",
            label: "Blocked reasons",
            value: `${shellState.boundary.blockedReasons.length} active`
        },
        {
            id: "slots",
            label: "Future slots",
            value: `${shellState.boundary.futureExecutorSlots.length} planned`
        }
    ];
    shellState.inspector.linkage = {
        ...shellState.inspector.linkage,
        workspaceViewId: shellState.windowing.posture.activeWorkspaceViewId,
        windowIntentId: shellState.windowing.posture.focusedIntentId ?? shellState.inspector.linkage.windowIntentId,
        detachedPanelId: shellState.windowing.posture.activeDetachedPanelId ?? shellState.inspector.linkage.detachedPanelId,
        focusedSlotId: traceFocus?.slotId ?? shellState.inspector.linkage.focusedSlotId
    };
    shellState.inspector.drilldowns = shellState.inspector.drilldowns.map((drilldown) => {
        if (drilldown.id !== "drilldown-active-flow-insight") {
            return drilldown;
        }
        return {
            ...drilldown,
            lines: drilldown.lines.map((line) => {
                if (line.id !== "drilldown-flow-slot") {
                    return line;
                }
                return {
                    ...line,
                    value: traceFocus?.label ?? line.value,
                    detail: traceFocus?.summary ??
                        line.detail
                };
            })
        };
    });
    shellState.dock = createDockItemsFromTraceFocus(traceFocus);
    return shellState;
}
function createStudioRuntime() {
    const toolsMcpControlSession = (0, tools_mcp_1.createToolsMcpLocalControlSession)();
    async function getLiveHostBridgeState() {
        const toolsMcpProbe = await (0, tools_mcp_1.probeLiveToolsMcp)();
        return toolsMcpProbe.source === "live"
            ? (0, tools_mcp_1.buildToolsMcpHostExecutorState)(toolsMcpProbe, toolsMcpControlSession).bridge
            : cloneState().boundary.hostExecutor.bridge;
    }
    async function handoffLiveHostPreview(itemId, actionId) {
        return (0, tools_mcp_1.handoffToolsMcpHostPreview)(itemId, actionId, toolsMcpControlSession);
    }
    async function invokeHostBridgeSlot(channel, handoff) {
        const toolsMcpProbe = await (0, tools_mcp_1.probeLiveToolsMcp)();
        const hostExecutor = toolsMcpProbe.source === "live"
            ? (0, tools_mcp_1.buildToolsMcpHostExecutorState)(toolsMcpProbe, toolsMcpControlSession)
            : cloneState().boundary.hostExecutor;
        return (0, tools_mcp_1.simulateToolsMcpHostPreviewHandoff)(handoff, hostExecutor, channel);
    }
    return {
        async getShellState() {
            const baseState = cloneState();
            const [systemStatus, sessionProbe, runtimeObservations, skillProbe, codexProbe, toolsMcpProbe, startupRouting] = await Promise.all([
                (0, system_status_1.probeLiveSystemStatus)(),
                (0, sessions_1.probeLiveSessions)(),
                (0, runtime_observations_1.probeLiveRuntimeObservations)(),
                (0, skills_1.probeLiveSkills)(),
                (0, codex_1.probeLiveCodex)(),
                (0, tools_mcp_1.probeLiveToolsMcp)(),
                (0, startup_routing_1.probeStartupRouting)()
            ]);
            const projectContext = await (0, project_context_1.probeProjectContext)(sessionProbe, codexProbe);
            return buildShellState(baseState, systemStatus, sessionProbe, runtimeObservations, skillProbe, codexProbe, projectContext, startupRouting, toolsMcpProbe, toolsMcpControlSession);
        },
        async listSessions() {
            const liveSessions = await (0, sessions_1.probeLiveSessions)();
            return liveSessions.source === "live" && liveSessions.sessions.length > 0 ? liveSessions.sessions : cloneState().sessions;
        },
        async listCodexTasks() {
            const codexProbe = await (0, codex_1.probeLiveCodex)();
            return codexProbe.source === "live" && codexProbe.tasks.length > 0 ? codexProbe.tasks : cloneState().codex.tasks;
        },
        async getHostExecutorState() {
            const toolsMcpProbe = await (0, tools_mcp_1.probeLiveToolsMcp)();
            return toolsMcpProbe.source === "live"
                ? (0, tools_mcp_1.buildToolsMcpHostExecutorState)(toolsMcpProbe, toolsMcpControlSession)
                : cloneState().boundary.hostExecutor;
        },
        async getHostBridgeState() {
            return getLiveHostBridgeState();
        },
        async handoffHostPreview(itemId, actionId) {
            const handoff = await handoffLiveHostPreview(itemId, actionId);
            return invokeHostBridgeSlot((handoff?.mapping.channel ?? ""), handoff);
        },
        async invokeHostBridgeSlot(channel, handoff) {
            return invokeHostBridgeSlot(channel, handoff);
        },
        async getRuntimeItemDetail(itemId) {
            return (0, tools_mcp_1.readToolsMcpDetail)(itemId, toolsMcpControlSession);
        },
        async runRuntimeItemAction(itemId, actionId) {
            return (0, tools_mcp_1.runToolsMcpAction)(itemId, actionId, toolsMcpControlSession);
        }
    };
}
