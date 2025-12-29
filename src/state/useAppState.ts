// src/state/useAppState.ts
import { useCallback, useEffect, useState } from "react";
import {
  readVisions,
  deleteVision as removeVision,
  clearVisions,
  type VisionRecord,
  VISIONS_CHANGED_EVENT,
} from "../lib/visionStore";
import { getActiveVisionId, setActiveVisionId } from "../lib/prefStore";

/**
 * 全局 App State（后续接服务端/多人协作就改这里）
 * 目标：visions 变化时，activeVisionId 永远“自愈”到一个可用值（或 null）
 */
export function useAppState() {
  // ---- route ----
  const [route, setRoute] = useState<string>("home");

  // ---- visions ----
  const [visions, setVisions] = useState<VisionRecord[]>(() => readVisions());

  // ---- active vision（持久化）----
  const [activeVisionId, _setActiveVisionId] = useState<string | null>(() => getActiveVisionId());

  /**
   * 根据最新 visions 列表，修正 activeVisionId：
   * - 如果 localStorage 里的 active 仍存在：保留
   * - 如果不存在：选 visions[0]；若没有 vision：置 null
   */
  const ensureActiveVision = useCallback(
    (list: VisionRecord[]) => {
      const current = getActiveVisionId(); // 永远从 localStorage 读“最新真相”
      const exists = !!(current && list.some((v) => v.id === current));

      if (exists) {
        // 同步到 state（避免 state 还停留在旧值）
        if (current !== activeVisionId) _setActiveVisionId(current);
        return;
      }

      const next = list[0]?.id ?? null;
      _setActiveVisionId(next);
      setActiveVisionId(next);
    },
    [activeVisionId]
  );

  // ---- actions ----
  const refresh = useCallback(() => {
    const list = readVisions();
    setVisions(list);
    ensureActiveVision(list);
  }, [ensureActiveVision]);

  const deleteVision = useCallback(
    (id: string) => {
      removeVision(id);

      const list = readVisions();
      setVisions(list);

      // 删除后立刻自愈 active
      ensureActiveVision(list);
    },
    [ensureActiveVision]
  );

  const clearAll = useCallback(() => {
    clearVisions();
    setVisions([]);
    _setActiveVisionId(null);
    setActiveVisionId(null);
  }, []);

  const setActiveVision = useCallback((id: string | null) => {
    _setActiveVisionId(id);
    setActiveVisionId(id);
  }, []);

  // ---- init ----
  useEffect(() => {
    // 首次加载时做一次自愈（比如你点过 Clean all data / 或 active 指向已删的 vision）
    ensureActiveVision(readVisions());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- subscriptions ----
  useEffect(() => {
    const onChanged = () => refresh();

    // 同 tab：visionStore 自己派发的事件
    window.addEventListener(VISIONS_CHANGED_EVENT, onChanged as any);

    // 跨 tab：localStorage 变更
    window.addEventListener("storage", onChanged);

    return () => {
      window.removeEventListener(VISIONS_CHANGED_EVENT, onChanged as any);
      window.removeEventListener("storage", onChanged);
    };
  }, [refresh]);

  return {
    route,
    setRoute,

    visions,
    activeVisionId,

    refresh,
    deleteVision,
    clearAll,
    setActiveVision,
  };
}