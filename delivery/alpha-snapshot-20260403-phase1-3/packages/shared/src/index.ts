export const studioPageIds = ["dashboard", "home", "sessions", "agents", "codex", "skills", "settings"] as const;

export type StudioPageId = (typeof studioPageIds)[number];
export type StudioTone = "neutral" | "positive" | "warning";

export const studioChannels = {
  shellState: "studio:shell-state",
  sessions: "studio:sessions",
  codexTasks: "studio:codex-tasks"
} as const;

export type StudioChannel = (typeof studioChannels)[keyof typeof studioChannels];

export interface StudioStat {
  label: string;
  value: string;
  tone: StudioTone;
}

export interface StudioMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: StudioTone;
}

export interface HomePanel {
  id: string;
  title: string;
  description: string;
  stats: StudioStat[];
}

export interface HomeActivity {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
}

export interface SessionSummary {
  id: string;
  title: string;
  workspace: string;
  status: "active" | "waiting" | "complete";
  updatedAt: string;
  owner: string;
}

export interface CodexTaskSummary {
  id: string;
  title: string;
  model: string;
  status: "running" | "queued" | "needs-review";
  target: string;
  updatedAt: string;
}

export interface DashboardWorkstream {
  id: string;
  title: string;
  detail: string;
  owner: string;
  stage: string;
  updatedAt: string;
  tone: StudioTone;
}

export interface DashboardAlert {
  id: string;
  title: string;
  detail: string;
  tone: StudioTone;
}

export interface AgentSummary {
  id: string;
  name: string;
  role: string;
  model: string;
  workspace: string;
  status: SessionSummary["status"];
  focus: string;
  approvals: string;
  updatedAt: string;
}

export interface SkillCatalogItem {
  id: string;
  name: string;
  surface: string;
  status: string;
  source: "mock" | "bridge" | "runtime";
  detail: string;
  tone: StudioTone;
}

export interface SkillCatalogSection {
  id: string;
  label: string;
  description: string;
  items: SkillCatalogItem[];
}

export interface SettingItem {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: StudioTone;
}

export interface SettingSection {
  id: string;
  title: string;
  description: string;
  items: SettingItem[];
}

export interface ShellStatus {
  mode: string;
  bridge: "mock" | "hybrid" | "live";
  runtime: "idle" | "ready" | "degraded";
}

export interface InspectorPlaceholder {
  title: string;
  sections: Array<{
    id: string;
    label: string;
    value: string;
  }>;
}

export interface DockItem {
  id: string;
  label: string;
  detail: string;
}

export interface StudioShellState {
  appName: string;
  version: string;
  status: ShellStatus;
  pages: Array<{
    id: StudioPageId;
    label: string;
    hint: string;
  }>;
  dashboard: {
    headline: string;
    metrics: StudioMetric[];
    workstreams: DashboardWorkstream[];
    alerts: DashboardAlert[];
    systemChecks: SettingItem[];
  };
  home: {
    headline: string;
    panels: HomePanel[];
    recentActivity: HomeActivity[];
  };
  sessions: SessionSummary[];
  agents: {
    summary: string;
    metrics: StudioMetric[];
    roster: AgentSummary[];
    recentActivity: HomeActivity[];
  };
  codex: {
    summary: string;
    tasks: CodexTaskSummary[];
  };
  skills: {
    summary: string;
    sections: SkillCatalogSection[];
  };
  settings: {
    summary: string;
    sections: SettingSection[];
  };
  inspector: InspectorPlaceholder;
  dock: DockItem[];
}

export interface StudioApi {
  getShellState(): Promise<StudioShellState>;
  listSessions(): Promise<SessionSummary[]>;
  listCodexTasks(): Promise<CodexTaskSummary[]>;
}

export const mockShellState: StudioShellState = {
  appName: "OpenClaw Studio",
  version: "0.1.0-alpha",
  status: {
    mode: "Studio Alpha",
    bridge: "mock",
    runtime: "ready"
  },
  pages: [
    { id: "dashboard", label: "Dashboard", hint: "Program health, watchlist, and milestones" },
    { id: "home", label: "Home", hint: "Overview and launch state" },
    { id: "sessions", label: "Sessions", hint: "Workspace activity and handoffs" },
    { id: "agents", label: "Agents", hint: "Operator roster and queued lanes" },
    { id: "codex", label: "Codex", hint: "Task queue and operator context" },
    { id: "skills", label: "Skills", hint: "Skills, tools, and MCP inventory" },
    { id: "settings", label: "Settings", hint: "Workspace policy and runtime knobs" }
  ],
  dashboard: {
    headline: "Phase 2 expands the shell around the validated Phase 1 scaffold without changing the renderer/bridge boundary.",
    metrics: [
      {
        id: "metric-bridge",
        label: "Bridge Mode",
        value: "Mock IPC",
        detail: "Ready for hybrid live probes in Phase 3.",
        tone: "warning"
      },
      {
        id: "metric-pages",
        label: "Primary Views",
        value: "7 routes",
        detail: "Dashboard, Home, Sessions, Agents, Codex, Skills, Settings.",
        tone: "positive"
      },
      {
        id: "metric-sessions",
        label: "Tracked Sessions",
        value: "3 sessions",
        detail: "Current shell is rendering typed queue data.",
        tone: "neutral"
      },
      {
        id: "metric-agents",
        label: "Agent Coverage",
        value: "2 active",
        detail: "One watcher lane remains parked pending live bridge work.",
        tone: "positive"
      }
    ],
    workstreams: [
      {
        id: "workstream-shell",
        title: "Phase 1 closeout",
        detail: "README, build validation, and offline smoke path are in place.",
        owner: "Codex",
        stage: "Closed",
        updatedAt: "Today",
        tone: "positive"
      },
      {
        id: "workstream-ui",
        title: "Phase 2 route expansion",
        detail: "Dashboard, Agents, Skills, and Settings now share the typed shell contract.",
        owner: "Codex",
        stage: "In progress",
        updatedAt: "Now",
        tone: "positive"
      },
      {
        id: "workstream-live",
        title: "Phase 3 live bridge",
        detail: "Next step is safe system status and sessions probing with fallback.",
        owner: "Codex",
        stage: "Next",
        updatedAt: "Queued",
        tone: "warning"
      }
    ],
    alerts: [
      {
        id: "alert-electron",
        title: "Electron optional dependency is environment-sensitive",
        detail: "This machine still needs Electron installed before the desktop shell can launch.",
        tone: "warning"
      },
      {
        id: "alert-bridge",
        title: "Runtime data remains mock-first",
        detail: "Only the preload contract and mock runtime are active before Phase 3.",
        tone: "neutral"
      },
      {
        id: "alert-layout",
        title: "Dock and inspector are intentional placeholders",
        detail: "They stay lightweight until advanced layout work lands in later phases.",
        tone: "neutral"
      }
    ],
    systemChecks: [
      {
        id: "check-shell",
        label: "Desktop Shell",
        value: "Compiled",
        detail: "Electron main and preload build successfully.",
        tone: "positive"
      },
      {
        id: "check-renderer",
        label: "Renderer",
        value: "Smokeable",
        detail: "Offline smoke validates the built renderer artifact path.",
        tone: "positive"
      },
      {
        id: "check-runtime",
        label: "Runtime Source",
        value: "Mock runtime",
        detail: "Live system/session probes are intentionally deferred to Phase 3.",
        tone: "warning"
      }
    ]
  },
  home: {
    headline: "Phase 1 scaffold is validated and now carries the wider Studio shell without coupling the renderer to runtime internals.",
    panels: [
      {
        id: "system",
        title: "System",
        description: "Bridge contracts, Electron shell, and renderer shell are online.",
        stats: [
          { label: "Runtime", value: "Ready", tone: "positive" },
          { label: "Bridge", value: "Mock IPC", tone: "warning" },
          { label: "Workspace", value: "Monorepo", tone: "neutral" }
        ]
      },
      {
        id: "focus",
        title: "Focus",
        description: "Primary Studio views are scaffolded and navigable through one shared state shape.",
        stats: [
          { label: "Pages", value: "7 active", tone: "positive" },
          { label: "Inspector", value: "Placeholder", tone: "warning" },
          { label: "Dock", value: "Placeholder", tone: "warning" }
        ]
      },
      {
        id: "validation",
        title: "Validation",
        description: "The current alpha is designed to stay buildable even when GUI launch is unavailable.",
        stats: [
          { label: "Typecheck", value: "Passing", tone: "positive" },
          { label: "Build", value: "Passing", tone: "positive" },
          { label: "Smoke", value: "Offline", tone: "neutral" }
        ]
      }
    ],
    recentActivity: [
      {
        id: "activity-1",
        title: "Workspace skeleton validated",
        detail: "Typecheck, build, and offline smoke now cover the current alpha path.",
        timestamp: "Today"
      },
      {
        id: "activity-2",
        title: "Route shell widened",
        detail: "Dashboard, Agents, Skills, and Settings are wired into the primary navigation.",
        timestamp: "Now"
      },
      {
        id: "activity-3",
        title: "Live bridge remains isolated",
        detail: "Phase 3 will add real probes without leaking runtime logic into the renderer.",
        timestamp: "Next"
      }
    ]
  },
  sessions: [
    {
      id: "SES-101",
      title: "Studio Alpha bootstrap",
      workspace: "openclaw-studio",
      status: "active",
      updatedAt: "2 min ago",
      owner: "Codex"
    },
    {
      id: "SES-087",
      title: "Bridge contract review",
      workspace: "shared/bridge",
      status: "waiting",
      updatedAt: "18 min ago",
      owner: "OpenClaw"
    },
    {
      id: "SES-044",
      title: "Renderer layout pass",
      workspace: "ui/layout",
      status: "complete",
      updatedAt: "1 hr ago",
      owner: "Codex"
    }
  ],
  agents: {
    summary: "Agent lanes are still demo-backed, but the shell now has enough structure to host live roster and approval status later.",
    metrics: [
      {
        id: "agent-metric-active",
        label: "Active Agents",
        value: "2",
        detail: "Primary execution lanes are occupied.",
        tone: "positive"
      },
      {
        id: "agent-metric-waiting",
        label: "Waiting Lanes",
        value: "1",
        detail: "Reserved for live bridge or review work.",
        tone: "warning"
      },
      {
        id: "agent-metric-models",
        label: "Model Mix",
        value: "3 models",
        detail: "Shows how roster cards can expose model coverage.",
        tone: "neutral"
      }
    ],
    roster: [
      {
        id: "AGT-14",
        name: "Shell Integrator",
        role: "Renderer shell owner",
        model: "gpt-5.4",
        workspace: "apps/studio",
        status: "active",
        focus: "Extending the route shell and page registry.",
        approvals: "None pending",
        updatedAt: "Now"
      },
      {
        id: "AGT-11",
        name: "Bridge Watcher",
        role: "Contracts and preload lane",
        model: "gpt-5.3-codex",
        workspace: "packages/bridge",
        status: "waiting",
        focus: "Holding for Phase 3 live bridge probes.",
        approvals: "Waiting for runtime data surface",
        updatedAt: "14 min ago"
      },
      {
        id: "AGT-07",
        name: "Runtime Curator",
        role: "Electron runtime lane",
        model: "gpt-5.2",
        workspace: "electron/runtime",
        status: "complete",
        focus: "Mock runtime path is stable and buildable.",
        approvals: "Closed",
        updatedAt: "39 min ago"
      }
    ],
    recentActivity: [
      {
        id: "agent-activity-1",
        title: "Shell Integrator updated navigation",
        detail: "Route expansion stayed within the shared contract boundary.",
        timestamp: "Now"
      },
      {
        id: "agent-activity-2",
        title: "Bridge Watcher queued live probes",
        detail: "System status and sessions are the first safe real integrations.",
        timestamp: "Next"
      }
    ]
  },
  codex: {
    summary: "Codex task flow is still mock-backed, but the broader shell is ready for runtime-driven expansion once Phase 3 starts.",
    tasks: [
      {
        id: "CDX-21",
        title: "Build studio shell layout",
        model: "gpt-5.4",
        status: "running",
        target: "renderer/shell",
        updatedAt: "Now"
      },
      {
        id: "CDX-18",
        title: "Define typed preload surface",
        model: "gpt-5.3-codex",
        status: "needs-review",
        target: "bridge/contracts",
        updatedAt: "11 min ago"
      },
      {
        id: "CDX-11",
        title: "Prepare runtime placeholders",
        model: "gpt-5.2",
        status: "queued",
        target: "electron/runtime",
        updatedAt: "Queued"
      }
    ]
  },
  skills: {
    summary: "This combined inventory page keeps skills, tools, and MCP surfaces together until deeper management workflows are needed.",
    sections: [
      {
        id: "skills-skill",
        label: "Skills",
        description: "Reusable procedural capabilities available to the Studio operator.",
        items: [
          {
            id: "skill-openai-docs",
            name: "openai-docs",
            surface: "Docs lookup",
            status: "Ready",
            source: "mock",
            detail: "Official docs guidance can be surfaced here when docs workflows are connected.",
            tone: "positive"
          },
          {
            id: "skill-plugin-creator",
            name: "plugin-creator",
            surface: "Scaffolding",
            status: "Indexed",
            source: "mock",
            detail: "Useful for local plugin creation flows once tool actions are exposed.",
            tone: "neutral"
          }
        ]
      },
      {
        id: "skills-tools",
        label: "Tools",
        description: "Shell-facing execution surfaces and runtime helpers.",
        items: [
          {
            id: "tool-ipc",
            name: "Typed IPC bridge",
            surface: "Bridge",
            status: "Operational",
            source: "bridge",
            detail: "Preload exposes the typed renderer API and mock runtime handlers.",
            tone: "positive"
          },
          {
            id: "tool-smoke",
            name: "Offline smoke",
            surface: "Validation",
            status: "Operational",
            source: "runtime",
            detail: "Confirms built artifacts without requiring Electron GUI launch in this sandbox.",
            tone: "positive"
          }
        ]
      },
      {
        id: "skills-mcp",
        label: "MCP",
        description: "External connector surfaces remain intentionally shallow in the alpha shell.",
        items: [
          {
            id: "mcp-runtime",
            name: "Runtime connector lane",
            surface: "MCP",
            status: "Planned",
            source: "mock",
            detail: "Reserved for future connector visibility after the live bridge is stable.",
            tone: "warning"
          }
        ]
      }
    ]
  },
  settings: {
    summary: "Settings stay read-only in the alpha shell, but the structure is ready for future persistence and policy controls.",
    sections: [
      {
        id: "settings-workspace",
        title: "Workspace",
        description: "Current shell and repo context.",
        items: [
          {
            id: "settings-root",
            label: "Workspace root",
            value: "openclaw-studio",
            detail: "Renderer, bridge, and shared contracts live in the monorepo.",
            tone: "neutral"
          },
          {
            id: "settings-version",
            label: "Alpha version",
            value: "0.1.0-alpha",
            detail: "Documentation and validation now match the current scaffold.",
            tone: "positive"
          }
        ]
      },
      {
        id: "settings-runtime",
        title: "Runtime",
        description: "Shell mode and integration posture.",
        items: [
          {
            id: "settings-bridge",
            label: "Bridge mode",
            value: "Mock",
            detail: "Will shift to hybrid when Phase 3 probes are enabled.",
            tone: "warning"
          },
          {
            id: "settings-fallback",
            label: "Fallback policy",
            value: "Renderer-safe",
            detail: "Renderer keeps rendering if runtime access is unavailable.",
            tone: "positive"
          }
        ]
      },
      {
        id: "settings-safety",
        title: "Safety",
        description: "Execution boundaries for the alpha shell.",
        items: [
          {
            id: "settings-scope",
            label: "Runtime scope",
            value: "Minimal",
            detail: "Only the smallest safe bridge integrations should ship in this phase.",
            tone: "positive"
          },
          {
            id: "settings-advanced",
            label: "Advanced polish",
            value: "Deferred",
            detail: "Layout persistence, docks, and palette work stay outside the current milestone.",
            tone: "warning"
          }
        ]
      }
    ]
  },
  inspector: {
    title: "Inspector",
    sections: [
      { id: "selection", label: "Selection", value: "No active node selected" },
      { id: "bridge", label: "Bridge", value: "Typed preload surface available" },
      { id: "next", label: "Next", value: "Begin minimal live bridge in Phase 3" }
    ]
  },
  dock: [
    { id: "dock-1", label: "Logs", detail: "Dock placeholder ready for runtime logs." },
    { id: "dock-2", label: "Approvals", detail: "Approval queue placeholder ready for future flows." },
    { id: "dock-3", label: "Tasks", detail: "Background task strip placeholder is visible." }
  ]
};
