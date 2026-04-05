import type { StudioTone } from "@openclaw/shared";

export interface CommandPaletteEntry {
  id: string;
  label: string;
  description: string;
  tone: StudioTone;
  meta: string[];
  badge?: string;
}

export interface CommandPaletteSection {
  id: string;
  label: string;
  summary: string;
  entries: CommandPaletteEntry[];
}

export interface CommandPaletteShortcutHint {
  id: string;
  combo: string;
  label: string;
}

interface CommandPaletteProps {
  sections: CommandPaletteSection[];
  contexts: Array<{
    id: string;
    label: string;
  }>;
  shortcuts: CommandPaletteShortcutHint[];
  open: boolean;
  query: string;
  placeholder: string;
  selectedEntryId: string | null;
  onClose: () => void;
  onExecuteEntry: (entryId: string) => void;
  onQueryChange: (value: string) => void;
  onSelectEntry: (entryId: string) => void;
  onMoveSelection: (direction: -1 | 1) => void;
}

export function CommandPalette({
  sections,
  contexts,
  shortcuts,
  open,
  query,
  placeholder,
  selectedEntryId,
  onClose,
  onExecuteEntry,
  onQueryChange,
  onSelectEntry,
  onMoveSelection
}: CommandPaletteProps) {
  if (!open) {
    return null;
  }

  const hasEntries = sections.some((section) => section.entries.length > 0);

  return (
    <div className="command-palette-backdrop" role="presentation" onClick={onClose}>
      <section
        className="command-palette surface"
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
        onClick={(event: any) => {
          event.stopPropagation();
        }}
      >
        <div className="command-palette__header">
          <div>
            <p className="eyebrow">Command Surface</p>
            <h2>Command Palette</h2>
          </div>
          <button type="button" className="command-palette__close" onClick={onClose}>
            Esc
          </button>
        </div>
        <label className="command-palette__input">
          <span>Workflow-aware local action router</span>
          <input
            autoFocus
            value={query}
            placeholder={placeholder}
            onChange={(event: any) => {
              onQueryChange(event.target.value);
            }}
            onKeyDown={(event: any) => {
              if (event.key === "Escape") {
                onClose();
                return;
              }

              if (event.key === "ArrowDown") {
                event.preventDefault();
                onMoveSelection(1);
                return;
              }

              if (event.key === "ArrowUp") {
                event.preventDefault();
                onMoveSelection(-1);
                return;
              }

              if (event.key === "Enter" && selectedEntryId) {
                event.preventDefault();
                onExecuteEntry(selectedEntryId);
              }
            }}
          />
        </label>
        <div className="command-palette__contexts">
          {contexts.map((context) => (
            <span key={context.id} className="command-context-pill">
              {context.label}
            </span>
          ))}
        </div>
        {shortcuts.length ? (
          <div className="command-palette__contexts">
            {shortcuts.map((shortcut) => (
              <span key={shortcut.id} className="command-context-pill">
                {shortcut.combo} · {shortcut.label}
              </span>
            ))}
          </div>
        ) : null}
        <div className="command-palette__list">
          {hasEntries ? (
            sections.map((section) =>
              section.entries.length ? (
                <section key={section.id} className="command-palette__section">
                  <div className="command-palette__section-header">
                    <div>
                      <strong>{section.label}</strong>
                      <p>{section.summary}</p>
                    </div>
                  </div>
                  <div className="command-palette__section-list">
                    {section.entries.map((entry) => {
                      const active = entry.id === selectedEntryId;

                      return (
                        <button
                          key={entry.id}
                          type="button"
                          className={`command-palette__item command-palette__item--${entry.tone}${
                            active ? " command-palette__item--active" : ""
                          }`}
                          aria-selected={active}
                          onMouseEnter={() => {
                            onSelectEntry(entry.id);
                          }}
                          onFocus={() => {
                            onSelectEntry(entry.id);
                          }}
                          onClick={() => {
                            onExecuteEntry(entry.id);
                          }}
                        >
                          <div>
                            <div className="command-palette__item-header">
                              <strong>{entry.label}</strong>
                              {entry.badge ? <span className="command-palette__badge">{entry.badge}</span> : null}
                            </div>
                            <p>{entry.description}</p>
                          </div>
                          <div className="command-palette__meta">
                            {entry.meta.map((value) => (
                              <span key={`${entry.id}-${value}`}>{value}</span>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null
            )
          ) : (
            <div className="command-palette__empty">
              <strong>No local orchestration matches</strong>
              <p>Try another route, workflow, slot, or keyboard shortcut label.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
