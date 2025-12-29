// src/api/visionRepo.ts
import {
  readVisions,
  getVisionById,
  upsertVision,
  deleteVision,
  clearVisions,
  type VisionRecord,
} from "../lib/visionStore";

/**
 * VisionRepo：数据适配层
 * - 现在：localStorage（visionStore）
 * - 未来：换成 fetch/REST/GraphQL，只改这里
 */
export const visionRepo = {
  list(): VisionRecord[] {
    return readVisions();
  },

  getById(id: string): VisionRecord | null {
    return getVisionById(id);
  },

  upsert(v: VisionRecord): void {
    upsertVision(v);
  },

  remove(id: string): void {
    deleteVision(id);
  },

  clear(): void {
    clearVisions();
  },
};