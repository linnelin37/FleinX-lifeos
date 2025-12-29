// src/lib/goalStore.ts
import { emitDataChanged } from "./dataEvents";
export const GOALS_KEY = "fx_goals_v1";
export const MILESTONE_STATUS_KEY = "fx_milestone_status_v1";
export const GOALS_CHANGED_EVENT = "fx_goals_changed";

export type GoalStatus = "todo" | "done";

export type GoalItem = {
  id: string;
  createdAt: string;
  visionId: string;

  milestoneIndex: 0 | 1 | 2; // M1/M2/M3
  title: string;

  status: GoalStatus;
  doneAt?: string;
};

export type MilestoneStatusItem = {
  id: string; // `${visionId}:m${milestoneIndex}`
  visionId: string;
  milestoneIndex: 0 | 1 | 2;
  status: "open" | "done";
  doneAt?: string;
};

function emitChanged() {
  window.dispatchEvent(new Event(GOALS_CHANGED_EVENT));
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

function normalizeGoal(x: any): GoalItem | null {
  if (!x) return null;

  const visionId = String(x.visionId || "");
  if (!visionId) return null;

  const mi = Number(x.milestoneIndex);
  const milestoneIndex = (mi === 0 || mi === 1 || mi === 2 ? mi : 0) as 0 | 1 | 2;

  const title = String(x.title || "").trim();
  if (!title) return null;

  const status: GoalStatus = x.status === "done" ? "done" : "todo";

  return {
    id: String(x.id || `g_${Date.now()}`),
    createdAt: String(x.createdAt || new Date().toISOString()),
    visionId,
    milestoneIndex,
    title,
    status,
    doneAt: x.doneAt ? String(x.doneAt) : undefined,
  };
}

function normalizeMilestoneStatus(x: any): MilestoneStatusItem | null {
  if (!x) return null;

  const visionId = String(x.visionId || "");
  if (!visionId) return null;

  const mi = Number(x.milestoneIndex);
  const milestoneIndex = (mi === 0 || mi === 1 || mi === 2 ? mi : 0) as 0 | 1 | 2;

  const status = x.status === "done" ? "done" : "open";

  return {
    id: String(x.id || `${visionId}:m${milestoneIndex}`),
    visionId,
    milestoneIndex,
    status,
    doneAt: x.doneAt ? String(x.doneAt) : undefined,
  };
}

// ---------------------
// Goals CRUD
// ---------------------
export function readGoals(): GoalItem[] {
  const arr = safeParse(localStorage.getItem(GOALS_KEY));
  const list: GoalItem[] = [];
  for (const x of arr) {
    const n = normalizeGoal(x);
    if (n) list.push(n);
  }
  // 新→旧：按 createdAt 倒序
  list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return list;
}

export function writeGoals(list: GoalItem[]) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(list));
  emitChanged();
}

export function readGoalsByVision(visionId: string): GoalItem[] {
  const id = String(visionId || "");
  return readGoals().filter((g) => g.visionId === id);
}

export function readOpenGoalsByVision(visionId: string): GoalItem[] {
  return readGoalsByVision(visionId).filter((g) => g.status !== "done");
}

export function addGoal(input: { visionId: string; milestoneIndex: 0 | 1 | 2; title: string }) {
  const list = readGoals();

  const item: GoalItem = {
    id: `g_${Date.now()}`,
    createdAt: new Date().toISOString(),
    visionId: String(input.visionId || ""),
    milestoneIndex: input.milestoneIndex,
    title: String(input.title || "").trim(),
    status: "todo",
  };

  writeGoals([item, ...list]);
  return item;
}

export function toggleGoalDone(goalId: string) {
  const id = String(goalId || "");
  const now = new Date().toISOString();

  const list = readGoals().map((g) => {
    if (g.id !== id) return g;
    if (g.status === "done") {
       return { ...g, status: "todo" as GoalStatus, doneAt: undefined };
    }
    return { ...g, status: "done" as GoalStatus, doneAt: now };
  });

  writeGoals(list);
}

export function deleteGoal(goalId: string) {
  const id = String(goalId || "");
  const list = readGoals().filter((g) => g.id !== id);
  writeGoals(list);
}

// ---------------------
// Milestone Status (done/open) - per Vision
// ---------------------
export function readMilestoneStatus(): MilestoneStatusItem[] {
  const arr = safeParse(localStorage.getItem(MILESTONE_STATUS_KEY));
  const list: MilestoneStatusItem[] = [];
  for (const x of arr) {
    const n = normalizeMilestoneStatus(x);
    if (n) list.push(n);
  }
  return list;
}

export function writeMilestoneStatus(list: MilestoneStatusItem[]) {
  localStorage.setItem(MILESTONE_STATUS_KEY, JSON.stringify(list));
  emitChanged();
}

export function readMilestoneStatusByVision(visionId: string): MilestoneStatusItem[] {
  const id = String(visionId || "");
  return readMilestoneStatus().filter((x) => x.visionId === id);
}

export function setMilestoneDone(input: { visionId: string; milestoneIndex: 0 | 1 | 2; done: boolean }) {
  const visionId = String(input.visionId || "");
  const milestoneIndex = input.milestoneIndex;

  const id = `${visionId}:m${milestoneIndex}`;
  const now = new Date().toISOString();

  const list = readMilestoneStatus().filter((x) => x.id !== id);

  const item: MilestoneStatusItem = {
    id,
    visionId,
    milestoneIndex,
    status: input.done ? "done" : "open",
    doneAt: input.done ? now : undefined,
  };

  writeMilestoneStatus([item, ...list]);
  return item;
}
// =====================
// Dashboard helpers
// =====================
export type MilestoneProgress = {
  milestoneIndex: 0 | 1 | 2;
  total: number;
  done: number;
  pct: number; // 0..1
};

function inRangeISO(iso: string | undefined, startISO: string, endISO: string): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  const s = new Date(startISO).getTime();
  const e = new Date(endISO).getTime();
  return Number.isFinite(t) && t >= s && t < e;
}

/**
 * Milestone Progress（按 goal 的完成情况统计）
 * - total: 该 milestone 下 goal 总数
 * - done : status=done 的数量
 * - pct  : done/total（0..1）
 */
export function getMilestoneProgressByVision(visionId: string): MilestoneProgress[] {
  const id = String(visionId || "");
  const list = readGoalsByVision(id);

  const out: MilestoneProgress[] = [
    { milestoneIndex: 0, total: 0, done: 0, pct: 0 },
    { milestoneIndex: 1, total: 0, done: 0, pct: 0 },
    { milestoneIndex: 2, total: 0, done: 0, pct: 0 },
  ];

  for (const g of list) {
    const i = g.milestoneIndex;
    out[i].total += 1;
    if (g.status === "done") out[i].done += 1;
  }

  for (const x of out) {
    x.pct = x.total <= 0 ? 0 : Math.max(0, Math.min(1, x.done / x.total));
  }

  return out;
}

/**
 * Dashboard 的 G：YTD（截至上个月）完成的 goals 数
 * 口径：doneAt 落在 [startISO, endISO) 里
 */
export function countGoalsDoneByVisionRange(visionId: string, startISO: string, endISO: string): number {
  const id = String(visionId || "");
  const list = readGoalsByVision(id);

  let cnt = 0;
  for (const g of list) {
    if (g.status === "done" && inRangeISO(g.doneAt, startISO, endISO)) cnt += 1;
  }
  return cnt;
}