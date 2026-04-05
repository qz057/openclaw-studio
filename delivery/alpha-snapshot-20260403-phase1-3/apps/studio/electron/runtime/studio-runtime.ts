import {
  mockShellState,
  type CodexTaskSummary,
  type SessionSummary,
  type SettingItem,
  type StudioApi,
  type StudioShellState
} from "@openclaw/shared";
import { probeLiveSessions } from "./probes/sessions";
import { probeLiveSystemStatus } from "./probes/system-status";

function cloneState(): StudioShellState {
  return JSON.parse(JSON.stringify(mockShellState)) as StudioShellState;
}

function updateSettingItem(items: SettingItem[], id: string, patch: Partial<SettingItem>) {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

function buildShellState(
  baseState: StudioShellState,
  systemStatus: Awaited<ReturnType<typeof probeLiveSystemStatus>>,
  sessions: Awaited<ReturnType<typeof probeLiveSessions>>
): StudioShellState {
  const shellState = cloneState();
  const hasLiveSessions = sessions.source === "live" && sessions.sessions.length > 0;
  const bridgeMode = systemStatus.source === "live" || hasLiveSessions ? "hybrid" : "mock";

  shellState.status = {
    ...systemStatus.status,
    bridge: bridgeMode
  };

  shellState.dashboard.metrics = shellState.dashboard.metrics.map((metric) => {
    switch (metric.id) {
      case "metric-bridge":
        return {
          ...metric,
          value: bridgeMode === "hybrid" ? "Hybrid live" : "Mock IPC",
          detail: bridgeMode === "hybrid" ? "System probes and/or sessions are reading the local OpenClaw runtime." : metric.detail,
          tone: bridgeMode === "hybrid" ? "positive" : metric.tone
        };
      case "metric-sessions":
        return {
          ...metric,
          value: `${hasLiveSessions ? sessions.sessions.length : baseState.sessions.length} ${hasLiveSessions ? "live" : "sessions"}`,
          detail: hasLiveSessions ? `Loaded from ${sessions.directory}.` : metric.detail,
          tone: hasLiveSessions ? "positive" : metric.tone
        };
      case "metric-agents":
        return {
          ...metric,
          value: hasLiveSessions ? "1 live source" : metric.value,
          detail: hasLiveSessions ? "Session roster is now probing the local OpenClaw session directory." : metric.detail,
          tone: hasLiveSessions ? "positive" : metric.tone
        };
      default:
        return metric;
    }
  });

  shellState.dashboard.systemChecks = systemStatus.checks.map((check) => ({ ...check }));
  shellState.sessions = hasLiveSessions ? sessions.sessions : baseState.sessions;

  shellState.home.panels = shellState.home.panels.map((panel) => {
    if (panel.id !== "system") {
      return panel;
    }

    return {
      ...panel,
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
            value: hasLiveSessions ? "Live session dir" : stat.value,
            tone: hasLiveSessions ? "positive" : stat.tone
          };
        }

        return stat;
      })
    };
  });

  shellState.home.recentActivity = [
    {
      id: "activity-live-bridge",
      title: hasLiveSessions ? "Live sessions probe enabled" : "Live bridge probe attempted",
      detail: hasLiveSessions
        ? `Session list now reads real JSONL files from ${sessions.directory}.`
        : "Live runtime access is unavailable, so the shell stayed on safe mock fallback.",
      timestamp: "Now"
    },
    ...shellState.home.recentActivity.slice(0, 2)
  ];

  shellState.settings.sections = shellState.settings.sections.map((section) => {
    if (section.id !== "settings-runtime") {
      return section;
    }

    return {
      ...section,
      items: updateSettingItem(
        updateSettingItem(section.items, "settings-bridge", {
          value: bridgeMode === "hybrid" ? "Hybrid" : "Mock",
          detail:
            bridgeMode === "hybrid"
              ? "System status and/or sessions are now backed by local runtime probes."
              : "Live runtime probes were unavailable, so the shell stayed mock-backed.",
          tone: bridgeMode === "hybrid" ? "positive" : "warning"
        }),
        "settings-fallback",
        {
          value: hasLiveSessions ? "Active" : "Renderer-safe",
          detail: hasLiveSessions
            ? "Renderer is receiving live sessions with mock-safe fallback still available."
            : "Renderer keeps rendering even when live runtime access is unavailable.",
          tone: hasLiveSessions ? "positive" : "positive"
        }
      )
    };
  });

  shellState.inspector.sections = shellState.inspector.sections.map((section) => {
    if (section.id === "bridge") {
      return {
        ...section,
        value: bridgeMode === "hybrid" ? "Hybrid runtime probes active" : section.value
      };
    }

    if (section.id === "next") {
      return {
        ...section,
        value: hasLiveSessions ? "Expand Codex/runtime live surfaces incrementally" : section.value
      };
    }

    return section;
  });

  return shellState;
}

export function createStudioRuntime(): StudioApi {
  return {
    async getShellState(): Promise<StudioShellState> {
      const baseState = cloneState();
      const [systemStatus, sessions] = await Promise.all([probeLiveSystemStatus(), probeLiveSessions()]);

      return buildShellState(baseState, systemStatus, sessions);
    },
    async listSessions(): Promise<SessionSummary[]> {
      const liveSessions = await probeLiveSessions();
      return liveSessions.source === "live" && liveSessions.sessions.length > 0 ? liveSessions.sessions : cloneState().sessions;
    },
    async listCodexTasks(): Promise<CodexTaskSummary[]> {
      return cloneState().codex.tasks;
    }
  };
}
