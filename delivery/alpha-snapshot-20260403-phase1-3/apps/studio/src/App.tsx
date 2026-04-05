import { useEffect, useState } from "react";
import { studioPageIds, type StudioPageId, type StudioShellState } from "@openclaw/shared";
import { useStudioData } from "./hooks/useStudioData";
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";
import { SessionsPage } from "./pages/SessionsPage";
import { AgentsPage } from "./pages/AgentsPage";
import { CodexPage } from "./pages/CodexPage";
import { SkillsPage } from "./pages/SkillsPage";
import { SettingsPage } from "./pages/SettingsPage";

function resolvePage(): StudioPageId {
  const route = window.location.hash.replace("#", "");

  if (studioPageIds.includes(route as StudioPageId)) {
    return route as StudioPageId;
  }

  return "dashboard";
}

function renderPage(activePage: StudioPageId, data: StudioShellState) {
  switch (activePage) {
    case "dashboard":
      return <DashboardPage dashboard={data.dashboard} status={data.status} />;
    case "home":
      return <HomePage state={data} />;
    case "sessions":
      return <SessionsPage sessions={data.sessions} />;
    case "agents":
      return <AgentsPage agents={data.agents} />;
    case "codex":
      return <CodexPage summary={data.codex.summary} tasks={data.codex.tasks} />;
    case "skills":
      return <SkillsPage skills={data.skills} />;
    case "settings":
      return <SettingsPage settings={data.settings} />;
  }
}

export function App() {
  const { data, error } = useStudioData();
  const [activePage, setActivePage] = useState<StudioPageId>(() => resolvePage());

  useEffect(() => {
    const syncRoute = () => {
      setActivePage(resolvePage());
    };

    window.addEventListener("hashchange", syncRoute);
    syncRoute();

    return () => {
      window.removeEventListener("hashchange", syncRoute);
    };
  }, []);

  if (error) {
    return <div className="state-screen">Failed to load OpenClaw Studio data: {error}</div>;
  }

  if (!data) {
    return <div className="state-screen">Loading OpenClaw Studio...</div>;
  }

  const activePageMeta = data.pages.find((page) => page.id === activePage) ?? {
    id: activePage,
    label: "Studio",
    hint: "Workspace shell"
  };

  return (
    <div className="studio-shell">
      <aside className="left-nav surface">
        <div className="brand-block">
          <span className="brand-mark">OC</span>
          <div>
            <strong>{data.appName}</strong>
            <p>{data.status.mode}</p>
          </div>
        </div>
        <nav className="nav-list">
          {data.pages.map((page) => (
            <a
              key={page.id}
              className={page.id === activePage ? "nav-item nav-item--active" : "nav-item"}
              href={`#${page.id}`}
            >
              <strong>{page.label}</strong>
              <span>{page.hint}</span>
            </a>
          ))}
        </nav>
      </aside>

      <header className="top-bar surface">
        <div>
          <p className="eyebrow">Desktop Shell</p>
          <h2>{activePageMeta.label}</h2>
          <p className="page-summary page-summary--tight">{activePageMeta.hint}</p>
        </div>
        <div className="top-bar-status">
          <div className="status-badge">
            <span>Bridge</span>
            <strong>{data.status.bridge}</strong>
          </div>
          <div className="status-badge">
            <span>Runtime</span>
            <strong>{data.status.runtime}</strong>
          </div>
          <div className="status-badge">
            <span>Version</span>
            <strong>{data.version}</strong>
          </div>
        </div>
      </header>

      <main className="main-panel">{renderPage(activePage, data)}</main>

      <aside className="inspector surface">
        <div className="panel-title-row">
          <h2>{data.inspector.title}</h2>
          <span>Placeholder</span>
        </div>
        <div className="inspector-list">
          {data.inspector.sections.map((section) => (
            <article key={section.id} className="inspector-card">
              <span>{section.label}</span>
              <strong>{section.value}</strong>
            </article>
          ))}
        </div>
      </aside>

      <section className="bottom-dock surface">
        <div className="panel-title-row">
          <h2>Bottom Dock</h2>
          <span>Phase 1 placeholder</span>
        </div>
        <div className="dock-list">
          {data.dock.map((item) => (
            <article key={item.id} className="dock-card">
              <strong>{item.label}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
