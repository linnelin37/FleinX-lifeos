// src/lib/recordStore.ts
import { emitDataChanged } from "./dataEvents";
export const RECORDS_KEY = "fx_rec_v1";
export const RECORDS_CHANGED_EVENT = "fx_rec_changed";

export type RecordType = "note" | "idea" | "log";

export type RecordItem = {
  id: string;
  createdAt: string; // ISO
  visionId: string;

  type: RecordType;
  content: string;
};

function emitChanged() {
  window.dispatchEvent(new Event(RECORDS_CHANGED_EVENT));
  emitDataChanged(); 
}

function isRecordType(x: any): x is RecordType {
  return x === "note" || x === "idea" || x === "log";
}

function normalizeRecords(input: any): RecordItem[] {
  if (!Array.isArray(input)) return [];

  const out: RecordItem[] = [];
  for (const r of input) {
    if (!r) continue;

    const visionId = typeof r.visionId === "string" ? r.visionId : "";
    const type: RecordType = isRecordType(r.type) ? r.type : "note";
    const content = typeof r.content === "string" ? r.content : "";

    const id = typeof r.id === "string" ? r.id : `rec_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const createdAt =
      typeof r.createdAt === "string" ? r.createdAt : new Date().toISOString();

    // 最小有效性：必须挂 visionId 且 content 非空（你也可以允许空，但一般没意义）
    if (!visionId) continue;

    out.push({ id, createdAt, visionId, type, content });
  }
  return out;
}

export function readRecords(): RecordItem[] {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return normalizeRecords(parsed);
  } catch {
    return [];
  }
}

export function writeRecords(list: RecordItem[]) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(list));
  emitChanged();
}

export function addRecord(input: Omit<RecordItem, "id" | "createdAt">) {
  const list = readRecords();

  const item: RecordItem = {
    id: `rec_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    visionId: input.visionId,
    type: input.type,
    content: input.content,
  };

  writeRecords([item, ...list]);
  return item;
}

export function deleteRecord(id: string) {
  const list = readRecords().filter((r) => r.id !== id);
  writeRecords(list);
}

export function clearRecords() {
  localStorage.removeItem(RECORDS_KEY);
  emitChanged();
}

export function readRecordsByVision(visionId: string): RecordItem[] {
  return readRecords().filter((r) => r.visionId === visionId);
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
 * Dashboard 的 R：YTD（截至上个月）records 数
 * 口径：createdAt 落在 [startISO, endISO)
 */
export function countRecordsByVisionRange(visionId: string, startISO: string, endISO: string): number {
  const id = String(visionId || "");
  const list = readRecordsByVision(id);

  let cnt = 0;
  for (const r of list) {
    if (inRangeISO(r.createdAt, startISO, endISO)) cnt += 1;
  }
  return cnt;
}