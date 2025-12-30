// src/lib/prefStore.ts
export type UiPrefs = {
  activeVisionId: string | null;
};

const UI_PREF_KEY = "fx_ui_v1";

// --- Welcome / Onboarding ---
const WELCOME_DONE_KEY = "fx_welcome_done_v1";
const WELCOME_NAME_KEY = "fx_welcome_name_v1";
const WELCOME_NOTE_KEY = "fx_welcome_note_v1";

// --- Internal event (for instant UI refresh without reload) ---
const PREFS_EVENT = "fx:prefs_changed";

function safeGet(key: string): string {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function emitPrefsChanged() {
  try {
    window.dispatchEvent(new CustomEvent(PREFS_EVENT));
  } catch {}
}

/**
 * Subscribe to prefs changes within the same tab.
 * (Note: native "storage" event does NOT fire in the same tab.)
 */
export function onPrefsChanged(handler: () => void) {
  const fn = () => handler();
  window.addEventListener(PREFS_EVENT, fn);
  // Also listen to cross-tab changes
  window.addEventListener("storage", fn);
  return () => {
    window.removeEventListener(PREFS_EVENT, fn);
    window.removeEventListener("storage", fn);
  };
}

// -------------------- UI Prefs --------------------
export function readPrefs(): UiPrefs {
  try {
    const raw = safeGet(UI_PREF_KEY);
    if (!raw) return { activeVisionId: null };
    const p = JSON.parse(raw);
    return {
      activeVisionId: typeof p?.activeVisionId === "string" ? p.activeVisionId : null,
    };
  } catch {
    return { activeVisionId: null };
  }
}

export function writePrefs(prefs: UiPrefs) {
  try {
    safeSet(UI_PREF_KEY, JSON.stringify(prefs));
    emitPrefsChanged();
  } catch {}
}

export function getActiveVisionId(): string | null {
  return readPrefs().activeVisionId ?? null;
}

export function setActiveVisionId(id: string | null) {
  const prefs = readPrefs();
  writePrefs({ ...prefs, activeVisionId: id });
}

// -------------------- Welcome --------------------
export function getWelcomeDone(): boolean {
  return safeGet(WELCOME_DONE_KEY) === "1";
}

export function setWelcomeDone(done: boolean) {
  safeSet(WELCOME_DONE_KEY, done ? "1" : "0");
  emitPrefsChanged();
}

export function getWelcomeName(): string {
  return safeGet(WELCOME_NAME_KEY);
}

export function setWelcomeName(name: string) {
  safeSet(WELCOME_NAME_KEY, (name || "").trim());
  emitPrefsChanged();
}

export function getWelcomeNote(): string {
  return safeGet(WELCOME_NOTE_KEY);
}

export function setWelcomeNote(note: string) {
  safeSet(WELCOME_NOTE_KEY, note || "");
  emitPrefsChanged();
}

// -------------------- Display Name (alias) --------------------
// 统一口径：DisplayName 就是 WelcomeName
export function getDisplayName(): string {
  return getWelcomeName();
}

export function setDisplayName(name: string) {
  setWelcomeName(name);
}