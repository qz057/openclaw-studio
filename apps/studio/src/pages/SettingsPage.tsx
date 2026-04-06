import type { StudioPageId, StudioShellState } from "@openclaw/shared";
import { WindowSharedStateBoard } from "../components/WindowSharedStateBoard";

interface SettingsWindowingSurfaceProps {
  activeRouteId: StudioPageId;
  activeWindowId: string | null;
  activeLaneId: string | null;
  activeBoardId: string | null;
}

interface SettingsPageProps {
  settings: StudioShellState["settings"];
  windowing: StudioShellState["windowing"];
  windowingSurface: SettingsWindowingSurfaceProps;
}

export function SettingsPage({ settings, windowing, windowingSurface }: SettingsPageProps) {
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Configuration</p>
          <h1>Settings</h1>
        </div>
        <p className="page-summary">{settings.summary}</p>
      </div>

      <WindowSharedStateBoard
        windowing={windowing}
        activeRouteId={windowingSurface.activeRouteId}
        activeWindowId={windowingSurface.activeWindowId}
        activeLaneId={windowingSurface.activeLaneId}
        activeBoardId={windowingSurface.activeBoardId}
        compact
        title="Settings Coordination Surface"
        summary="Settings now exposes the same phase56 window roster, shared-state lane, sync health, and local-only blockers that drive the main shell coordination board."
      />

      <div className="section-stack">
        {settings.sections.map((section) => (
          <article key={section.id} className="surface card">
            <div className="card-header card-header--stack">
              <div>
                <h2>{section.title}</h2>
                <p>{section.description}</p>
              </div>
              <span>{section.items.length} items</span>
            </div>
            <div className="setting-list">
              {section.items.map((item) => (
                <article key={item.id} className="setting-row">
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.detail}</p>
                  </div>
                  <div className="setting-meta">
                    <span className={`tone-chip tone-chip--${item.tone}`}>{item.value}</span>
                  </div>
                </article>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
