import type { StudioTone } from "@openclaw/shared";
import { formatProductText } from "../lib/product-text";

export interface CommandPaletteEntryDetailLine {
  id: string;
  label: string;
  value: string;
}

export interface CommandPaletteEntry {
  id: string;
  actionId: string;
  label: string;
  description: string;
  tone: StudioTone;
  meta: string[];
  badge?: string;
  detailLines?: CommandPaletteEntryDetailLine[];
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
  const selectedSection =
    sections.find((section) => section.entries.some((entry) => entry.id === selectedEntryId)) ??
    sections.find((section) => section.entries.length > 0) ??
    null;
  const selectedEntry =
    selectedSection?.entries.find((entry) => entry.id === selectedEntryId) ??
    selectedSection?.entries[0] ??
    null;

  return (
    <div className="command-palette-backdrop" role="presentation" onClick={onClose}>
      <section
        className="command-palette surface"
        role="dialog"
        aria-modal="true"
        aria-label="命令面板"
        onClick={(event: any) => {
          event.stopPropagation();
        }}
      >
        <div className="command-palette__header">
          <div>
            <p className="eyebrow">命令面</p>
            <h2>命令面板</h2>
          </div>
          <button type="button" className="command-palette__close" onClick={onClose}>
            Esc
          </button>
        </div>
        <label className="command-palette__input">
          <span>感知当前流程的本地动作路由器</span>
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
              {formatProductText(context.label)}
            </span>
          ))}
        </div>
        {shortcuts.length ? (
          <div className="command-palette__contexts">
            {shortcuts.map((shortcut) => (
              <span key={shortcut.id} className="command-context-pill">
                {shortcut.combo} · {formatProductText(shortcut.label)}
              </span>
            ))}
          </div>
        ) : null}
        <div className="command-palette__body">
          <div className="command-palette__list">
            {hasEntries ? (
              sections.map((section) =>
                section.entries.length ? (
                  <section key={section.id} className="command-palette__section">
                    <div className="command-palette__section-header">
                      <div>
                        <strong>{formatProductText(section.label)}</strong>
                        <p>{formatProductText(section.summary)}</p>
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
                                <strong>{formatProductText(entry.label)}</strong>
                                {entry.badge ? <span className="command-palette__badge">{formatProductText(entry.badge)}</span> : null}
                              </div>
                              <p>{formatProductText(entry.description)}</p>
                            </div>
                            <div className="command-palette__meta">
                              {entry.meta.map((value) => (
                                <span key={`${entry.id}-${value}`}>{formatProductText(value)}</span>
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
                <strong>没有匹配的本地编排动作</strong>
                <p>可以换一个页面、流程、槽位或快捷键关键词。</p>
              </div>
            )}
          </div>
          {selectedEntry ? (
            <aside className="command-palette__preview surface">
              <div className="command-palette__section-header">
                <div>
                  <span>命令预览</span>
                  <strong>{formatProductText(selectedEntry.label)}</strong>
                  <p>{formatProductText(selectedEntry.description)}</p>
                </div>
              </div>
              <div className="command-palette__contexts">
                {selectedSection ? <span className="command-context-pill">{formatProductText(selectedSection.label)}</span> : null}
                {selectedEntry.badge ? <span className="command-context-pill">{formatProductText(selectedEntry.badge)}</span> : null}
              </div>
              {selectedEntry.detailLines?.length ? (
                <div className="windowing-preview-list">
                  {selectedEntry.detailLines.map((line) => (
                    <div key={line.id} className="windowing-preview-line">
                      <span>{formatProductText(line.label)}</span>
                      <strong>{formatProductText(line.value)}</strong>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="command-palette__meta">
                {selectedEntry.meta.map((value) => (
                  <span key={`${selectedEntry.id}-preview-${value}`}>{formatProductText(value)}</span>
                ))}
              </div>
              <div className="windowing-preview-line windowing-preview-line--stacked">
                <span>执行提示</span>
                <strong>按 Enter 执行当前受控本地动作。</strong>
                <p>方向键只切换选择，不离开当前审查上下文。</p>
              </div>
            </aside>
          ) : null}
        </div>
      </section>
    </div>
  );
}
