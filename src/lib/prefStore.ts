// src/lib/prefStore.ts
export type UiPrefs = {
  activeVisionId: string | null;
};

const UI_PREF_KEY = "fx_ui_v1";

export function readPrefs(): UiPrefs {
  try {
    const raw = localStorage.getItem(UI_PREF_KEY);
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
  localStorage.setItem(UI_PREF_KEY, JSON.stringify(prefs));
}

export function getActiveVisionId(): string | null {
  return readPrefs().activeVisionId ?? null;
}

export function setActiveVisionId(id: string | null) {
  const prefs = readPrefs();
  writePrefs({ ...prefs, activeVisionId: id });
}
// --- Welcome / Onboarding ---
const WELCOME_DONE_KEY = "fx_welcome_done_v1";
const WELCOME_NAME_KEY = "fx_welcome_name_v1";
const WELCOME_NOTE_KEY = "fx_welcome_note_v1";

export function getWelcomeDone(): boolean {
  return localStorage.getItem(WELCOME_DONE_KEY) === "1";
}
export function setWelcomeDone(done: boolean) {
  localStorage.setItem(WELCOME_DONE_KEY, done ? "1" : "0");
}

export function getWelcomeName(): string {
  return localStorage.getItem(WELCOME_NAME_KEY) || "";
}
export function setWelcomeName(name: string) {
  localStorage.setItem(WELCOME_NAME_KEY, name || "");
}

export function getWelcomeNote(): string {
  return localStorage.getItem(WELCOME_NOTE_KEY) || "";
}
export function setWelcomeNote(note: string) {
  localStorage.setItem(WELCOME_NOTE_KEY, note || "");
}