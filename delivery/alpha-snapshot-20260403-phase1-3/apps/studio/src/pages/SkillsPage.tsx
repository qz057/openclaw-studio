import type { StudioShellState } from "@openclaw/shared";

interface SkillsPageProps {
  skills: StudioShellState["skills"];
}

export function SkillsPage({ skills }: SkillsPageProps) {
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Capabilities</p>
          <h1>Skills / Tools / MCP</h1>
        </div>
        <p className="page-summary">{skills.summary}</p>
      </div>

      <div className="catalog-grid">
        {skills.sections.map((section) => (
          <article key={section.id} className="surface card">
            <div className="card-header card-header--stack">
              <div>
                <h2>{section.label}</h2>
                <p>{section.description}</p>
              </div>
              <span>{section.items.length} entries</span>
            </div>
            <div className="stack-list">
              {section.items.map((item) => (
                <article key={item.id} className="list-row list-row--stacked">
                  <div className="row-heading">
                    <div>
                      <strong>{item.name}</strong>
                      <p>
                        {item.surface} · {item.source}
                      </p>
                    </div>
                    <span className={`tone-chip tone-chip--${item.tone}`}>{item.status}</span>
                  </div>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
