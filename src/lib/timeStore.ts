// src/lib/timeStore.ts
import { emitDataChanged } from "./dataEvents";
export const TIME_KEY = "fx_time_v1";
export const TIME_CHANGED_EVENT = "fx_time_changed";

export type TimeItem = {
  id: string;
  createdAt: string;
  visionId: string;
  minutes: number;
  note: string;

  // 新：Goal 维度（推荐）
  goalId?: string;

  // 旧：Milestone 维度（兼容老数据）
  milestoneId?: string;
};

function emitChanged() {
  window.dispatchEvent(new Event(TIME_CHANGED_EVENT));
  emitDataChanged();
}

function safeParse(raw: string | null): any[] {
  try {
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeItem(x: any): TimeItem | null {
  if (!x) return null;

  const visionId = String(x.visionId || "");
  if (!visionId) return null;

  const minutes = Math.max(0, Math.floor(Number(x.minutes) || 0));
  const note = String(x.note || "");

  const goalId = typeof x.goalId === "string" && x.goalId ? x.goalId : undefined;

  // 老数据可能只有 milestoneId（m0/m1/m2）
  const milestoneId =
    typeof x.milestoneId === "string" && x.milestoneId ? x.milestoneId : undefined;

  return {
    id: String(x.id || `t_${Date.now()}`),
    createdAt: String(x.createdAt || new Date().toISOString()),
    visionId,
    minutes,
    note,
    goalId,
    milestoneId,
  };
}

export function readTime(): TimeItem[] {
  const raw = localStorage.getItem(TIME_KEY);
  const arr = safeParse(raw);
  const list: TimeItem[] = [];

  for (const x of arr) {
    const n = normalizeItem(x);
    if (n) list.push(n);
  }
  return list;
}

export function writeTime(list: TimeItem[]) {
  localStorage.setItem(TIME_KEY, JSON.stringify(list));
  emitChanged();
}

export function addTime(input: {
  visionId: string;
  minutes: number;
  note: string;
  goalId?: string; // 新：可选关联未完成 Goal
}) {
  const list = readTime();

  const item: TimeItem = {
    id: `t_${Date.now()}`,
    createdAt: new Date().toISOString(),
    visionId: String(input.visionId || ""),
    minutes: Math.max(0, Math.floor(Number(input.minutes) || 0)),
    note: String(input.note || ""),
    goalId: input.goalId ? String(input.goalId) : undefined,
  };

  writeTime([item, ...list]);
  return item;
}

export function deleteTime(id: string) {
  const list = readTime().filter((x) => x.id !== id);
  writeTime(list);
}

export function readTimeByVision(visionId: string): TimeItem[] {
  const id = String(visionId || "");
  return readTime().filter((x) => x.visionId === id);
}

export function sumMinutesByVision(visionId: string): number {
  return readTimeByVision(visionId).reduce((acc, x) => acc + (Number(x.minutes) || 0), 0);
}
// =====================
// Dashboard helpers
// =====================
function inRangeISO(iso: string | undefined, startISO: string, endISO: string): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  const s = new Date(startISO).getTime();
  const e = new Date(endISO).getTime();
  return Number.isFinite(t) && t >= s && t < e;
}

/**
 * Dashboard 的 T：YTD（截至上个月）minutes 汇总
 * 口径：createdAt 落在 [startISO, endISO)
 */
export function sumMinutesByVisionRange(visionId: string, startISO: string, endISO: string): number {
  const id = String(visionId || "");
  const list = readTimeByVision(id);

  let total = 0;
  for (const x of list) {
    if (inRangeISO(x.createdAt, startISO, endISO)) {
      total += Number(x.minutes) || 0;
    }
  }
  return total;
}