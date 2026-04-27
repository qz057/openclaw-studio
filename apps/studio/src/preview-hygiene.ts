const PREVIEW_CLEAN_EPOCH = "2026-04-28-clean-preview-v1";
const PREVIEW_CLEAN_EPOCH_KEY = "openclaw-studio.preview-clean-epoch";

const PREVIEW_RESIDUE_KEYS = [
  "openclaw-studio.chat-page.v2",
  "openclaw-studio.chat-page.fresh-session",
  "openclaw-studio.hermes-page.v1",
  "openclaw-studio.hermes-page.fresh-session",
  "openclaw-studio.focused-slot",
  "openclaw-studio.companion-route-memory",
  "openclaw-studio.workbench-state.v1",
  "openclaw-studio.shell-layout",
  "openclaw-studio.reviewDeck"
] as const;

export function applyPreviewHygiene(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (window.localStorage.getItem(PREVIEW_CLEAN_EPOCH_KEY) === PREVIEW_CLEAN_EPOCH) {
      return;
    }

    for (const key of PREVIEW_RESIDUE_KEYS) {
      window.localStorage.removeItem(key);
    }

    window.sessionStorage.clear();
    window.localStorage.setItem(PREVIEW_CLEAN_EPOCH_KEY, PREVIEW_CLEAN_EPOCH);
  } catch {
    // Storage cleanup must never block the app from rendering.
  }
}
