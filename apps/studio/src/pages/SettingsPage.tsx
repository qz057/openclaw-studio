import type { StudioShellState } from "@openclaw/shared";

interface SettingsPageProps {
  settings: StudioShellState["settings"];
}

export function SettingsPage({ settings }: SettingsPageProps) {
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Configuration</p>
          <h1>Settings</h1>
        </div>
        <p className="page-summary">{settings.summary}</p>
      </div>

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
