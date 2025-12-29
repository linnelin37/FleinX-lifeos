// src/lib/visionStore.ts
import { emitDataChanged } from "./dataEvents";
export const STORAGE_KEY = "fx_vis_v1";
export const VISIONS_CHANGED_EVENT = "fx_vis_changed";

export type VisionType = "learning" | "work" | "life" | "project";

export type VisionRecord = {
  id: string;
  createdAt: string;

  type: VisionType;
  typeZh?: string;
  typeEn?: string;
  title: string;

  // Step 3（建议统一放在 step3 里）
  step3?: {
    northStar: string;
    why?: string;
    metric: string;
    deadline: string;
  };

  // Step 4/5/6（按你 Wizard 的真实数据结构来）
  milestones?: Array<{ date: string; text: string }>;
  plan?: { hoursPerWeek: number; rhythm: string; preference: string };
  risks?: Array<{ risk: string; plan: string }>;
};

function emitVisionsChanged() {
  // 同 tab 生效（storage 事件在同 tab 不触发）
  window.dispatchEvent(new Event(VISIONS_CHANGED_EVENT));
   emitDataChanged();
}

export function readVisions(): VisionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as VisionRecord[]) : [];
  } catch {
    return [];
  }
}

export function writeVisions(list: VisionRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  emitVisionsChanged();
}

export function getVisionById(id: string): VisionRecord | null {
  return readVisions().find((v) => v.id === id) ?? null;
}

export function upsertVision(v: VisionRecord) {
  const list = readVisions();
  const idx = list.findIndex((x) => x.id === v.id);
  if (idx >= 0) list[idx] = v;
  else list.unshift(v);
  writeVisions(list);
}

export function deleteVision(id: string) {
  const list = readVisions().filter((v) => v.id !== id);
  writeVisions(list);
}

export function clearVisions() {
  localStorage.removeItem(STORAGE_KEY);
  emitVisionsChanged();
}