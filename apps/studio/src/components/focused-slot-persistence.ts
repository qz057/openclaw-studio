import type { StudioHostExecutorState } from "@openclaw/shared";
import { getDefaultTraceFocusSlotId } from "./host-trace-state";

export const focusedSlotStorageKey = "openclaw-studio.focused-slot";

function isStoredSlotAvailable(hostExecutor: StudioHostExecutorState, slotId: string) {
  return hostExecutor.bridge.trace.slotRoster.some((entry) => entry.slotId === slotId);
}

export function readPersistedFocusedSlotId(): string | null {
  try {
    return window.localStorage.getItem(focusedSlotStorageKey);
  } catch {
    return null;
  }
}

export function writePersistedFocusedSlotId(slotId: string | null) {
  try {
    if (slotId) {
      window.localStorage.setItem(focusedSlotStorageKey, slotId);
      return;
    }

    window.localStorage.removeItem(focusedSlotStorageKey);
  } catch {
    // Ignore storage failures so the simulated shell stays renderable in restricted environments.
  }
}

export function resolvePersistedFocusedSlotId(hostExecutor: StudioHostExecutorState, preferredSlotId?: string | null): string | null {
  if (preferredSlotId && isStoredSlotAvailable(hostExecutor, preferredSlotId)) {
    return preferredSlotId;
  }

  return getDefaultTraceFocusSlotId(hostExecutor);
}
