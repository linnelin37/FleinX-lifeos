// src/lib/backup.ts
import { emitDataChanged } from "./dataEvents";

type BackupPayload = {
  app: "FleinX2026";
  version: 1;
  exportedAt: string;
  data: Record<string, any>;
};

const KEYS = [
  // core data
  "fx_vis_v1",
  "fx_time_v1",
  "fx_goals_v1",
  "fx_milestone_status_v1",
  "fx_rec_v1",

  // ui prefs + onboarding
  "fx_ui_v1",
  "fx_welcome_done_v1",
  "fx_welcome_name_v1",
  "fx_welcome_note_v1",
] as const;

export function exportBackup(): BackupPayload {
  const data: Record<string, any> = {};

  for (const k of KEYS) {
    const raw = localStorage.getItem(k);
    if (raw == null) continue;
    try {
      data[k] = JSON.parse(raw);
    } catch {
      // not json (shouldn't happen, but safe)
      data[k] = raw;
    }
  }

  return {
    app: "FleinX2026",
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function importBackup(payload: any) {
  if (!payload || payload.app !== "FleinX2026" || payload.version !== 1 || !payload.data) {
    throw new Error("Invalid backup file (app/version mismatch).");
  }

  const data = payload.data as Record<string, any>;

  // 写入我们识别的 key（避免污染别的 localStorage）
  for (const k of KEYS) {
    if (!(k in data)) continue;

    const v = data[k];
    if (v === undefined || v === null) {
      localStorage.removeItem(k);
      continue;
    }

    if (typeof v === "string") localStorage.setItem(k, v);
    else localStorage.setItem(k, JSON.stringify(v));
  }

  emitDataChanged();
}

export function clearAllData() {
  for (const k of KEYS) localStorage.removeItem(k);
  emitDataChanged();
}

export function downloadJson(filename: string, obj: any) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  setTimeout(() => URL.revokeObjectURL(url), 500);
}