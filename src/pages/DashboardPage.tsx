// src/pages/DashboardPage.tsx
import { useEffect, useMemo, useState } from "react";
import type { VisionRecord } from "../lib/visionStore";

import { DATA_CHANGED_EVENT } from "../lib/dataEvents";
import { sumMinutesByVisionRange } from "../lib/timeStore";
import { countGoalsDoneByVisionRange, getMilestoneProgressByVision } from "../lib/goalStore";
import { countRecordsByVisionRange } from "../lib/recordStore";

type Props = {
  visions: VisionRecord[];
  activeVisionId: string | null;
  onBack: () => void;
  onGo: (hash: string) => void;
};

type VisionType = "project" | "work" | "life" | "learning" | string;

const TYPE_ZH: Record<string, string> = {
  project: "项目",
  work: "工作",
  life: "生活",
  learning: "学习",
};

const TYPE_EN: Record<string, string> = {
  project: "Project",
  work: "Work",
  life: "Life",
  learning: "Learning",
};

function typeLabel(type: VisionType) {
  const key = String(type);
  const zh = TYPE_ZH[key] ?? key;
  const en = TYPE_EN[key] ?? "";
  return `${zh} / ${en || key}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pctToText(p: number) {
  const x = Math.round(clamp(p, 0, 1) * 100);
  return `${x}%`;
}

/** mins -> hours, rounding to nearest 0.5h, show like 0h / 1h / 1.5h */
function formatHoursHalfFromMins(mins: number) {
  const m = Math.max(0, Number(mins) || 0);
  if (m <= 0) return "0h";
  const h = m / 60;
  const half = Math.round(h * 2) / 2; // 0.5 step
  if (half <= 0) return "0h";
  if (Number.isInteger(half)) return `${half}h`;
  return `${half.toFixed(1)}h`; // 1.5h
}

function ytdRangeToNow() {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1, 0, 0, 0, 0);
  const end = now; // 含本月：到“现在”
  return { year, startISO: start.toISOString(), endISO: end.toISOString() };
}

export default function DashboardPage({ visions, activeVisionId, onBack, onGo }: Props) {
  const { year, startISO, endISO } = useMemo(() => ytdRangeToNow(), []);

  // 联动刷新：统一用 DATA_CHANGED_EVENT
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((x) => x + 1);
    window.addEventListener(DATA_CHANGED_EVENT, bump as any);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, bump as any);
  }, []);

  // Type 分组 + 稳定排序（type 固定顺序；组内 Active 优先；title 次序）
  const groups = useMemo(() => {
    void tick;

    const map = new Map<string, VisionRecord[]>();
    for (const v of visions) {
      const k = String((v as any).type || "other");
      const arr = map.get(k) || [];
      arr.push(v);
      map.set(k, arr);
    }

    const entries = Array.from(map.entries()).map(([type, list]) => {
      list.sort((a, b) => {
        const aa = a.id === activeVisionId ? -1 : 0;
        const bb = b.id === activeVisionId ? -1 : 0;
        if (aa !== bb) return aa - bb;
        return String(a.title || "").localeCompare(String(b.title || ""));
      });
      return { type, list };
    });

    const order = ["project", "work", "life", "learning"];
    entries.sort((a, b) => {
      const ia = order.indexOf(a.type);
      const ib = order.indexOf(b.type);
      if (ia === -1 && ib === -1) return a.type.localeCompare(b.type);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    return entries;
  }, [visions, activeVisionId, tick]);

  const DEFAULT_LIMIT = 5;
  const [openTypes, setOpenTypes] = useState<Record<string, boolean>>({});

  // 初次默认展开（只补齐缺省项，不覆盖用户折叠选择）
  useEffect(() => {
    setOpenTypes((prev) => {
      const next = { ...prev };
      for (const g of groups) {
        if (typeof next[g.type] !== "boolean") next[g.type] = true;
      }
      return next;
    });
  }, [groups]);

  // 小工具：YTD 三个小胶囊（更“实”、更像你 Done 胶囊的体系）
  const ytdPillStyle = (isActive: boolean) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    background: isActive ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 10px 28px rgba(0,0,0,0.25)",
    whiteSpace: "nowrap" as const,
  });

  return (
    <div className="fx-app">
      <div className="fx-bg" />
      <div className="fx-container">
        {/* Topbar */}
        <div className="fx-topbar">
          <div className="fx-brand">
            <div className="fx-brandMark" />
            <div className="fx-brandText">
              <div className="fx-kicker">FleinX2026</div>
              <div className="fx-title">Dashboard · {year}</div>
            </div>
          </div>

          <button className="fx-btn fx-btnGhost" type="button" onClick={onBack}>
            ← Back
          </button>
        </div>

        {/* Header / YTD Hero (减少后台说明感) */}
        <div className="fx-card" style={{ padding: 14 }}>
          <div className="fx-h2 fx-ytdHero" style={{ margin: 0 }}>
            Year Overview · {year}
          </div>

          <div className="fx-ytdMeta" style={{ marginTop: 6 }}>
            不是激励你开始，而是确认你已经在路上了。 Keep going!
          </div>

         
        </div>

        {/* Groups */}
        <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
          {groups.map((g) => {
            const isOpen = !!openTypes[g.type];
            const fullList = g.list || [];
            const shown = isOpen ? fullList.slice(0, DEFAULT_LIMIT) : [];

            return (
              <div key={g.type} className="fx-card" style={{ padding: 14 }}>
                {/* Group header (去掉 Type: 前缀，更像 section title) */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
                    <div className="fx-h3" style={{ margin: 0, whiteSpace: "nowrap" }}>
                      {typeLabel(g.type)}
                    </div>
                    <div className="fx-muted" style={{ whiteSpace: "nowrap" }}>
                      · {fullList.length} {fullList.length === 1 ? "Vision" : "Visions"}
                    </div>
                  </div>

                  <button
                    className="fx-btn fx-btnGhost"
                    type="button"
                    onClick={() => setOpenTypes((prev) => ({ ...prev, [g.type]: !prev[g.type] }))}
                  >
                    {isOpen ? "Collapse" : "Expand"}
                  </button>
                </div>

                {isOpen ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    {shown.map((v) => {
                      const isActive = v.id === activeVisionId;

                      // YTD 数据
                      const mins = sumMinutesByVisionRange(v.id, startISO, endISO);
                      const gDone = countGoalsDoneByVisionRange(v.id, startISO, endISO);
                      const rCnt = countRecordsByVisionRange(v.id, startISO, endISO);

                      const mp = getMilestoneProgressByVision(v.id);
                      const m1 = mp[0];
                      const m2 = mp[1];
                      const m3 = mp[2];

                      return (
                        <div key={v.id} className={`fx-typeCard ${isActive ? "is-active" : ""}`} style={{ padding: 14 }}>
                          {/* 4 columns */}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "minmax(260px, 1fr) 240px 260px 180px",
                              gap: 16,
                              alignItems: "center",
                            }}
                          >
                            {/* 1) Vision (更突出) */}
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 18,
                                  fontWeight: 800,
                                  letterSpacing: 0.2,
                                  lineHeight: 1.2,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  marginBottom: 10,
                                }}
                                title={v.title}
                              >
                                {v.title ? (v.title.startsWith("【") ? v.title : `【${v.title}】`) : "【-】"}{" "}
                                {isActive ? <span className="fx-muted" style={{ fontWeight: 700 }}>（Active）</span> : null}
                              </div>

                              {/* Open Vision 降级：保持 Ghost，但视觉更“轻” */}
                              <button
                                className="fx-btn fx-btnGhost"
                                type="button"
                                style={{ opacity: 0.9 }}
                                onClick={() => onGo(`#/vision/${v.id}`)}
                              >
                                Open Vision →
                              </button>
                            </div>

                            {/* 2) Milestone Progress (更辅助：更细更灰) */}
                            <div>
                              <div className="fx-muted" style={{ marginBottom: 8 }}>
                                Milestones
                              </div>

                              {[
                                { label: "M1", p: m1?.pct ?? 0 },
                                { label: "M2", p: m2?.pct ?? 0 },
                                { label: "M3", p: m3?.pct ?? 0 },
                              ].map((x) => (
                                <div
                                  key={x.label}
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "28px 1fr 44px",
                                    gap: 8,
                                    alignItems: "center",
                                    marginBottom: 8,
                                    opacity: 0.9,
                                  }}
                                >
                                  <div className="fx-muted">{x.label}</div>
                                  <div
                                    style={{
                                      height: 6,
                                      borderRadius: 999,
                                      background: "rgba(255,255,255,0.07)",
                                      overflow: "hidden",
                                    }}
                                  >
                                    <div
                                      style={{
                                        height: "100%",
                                        width: `${Math.round(clamp(x.p, 0, 1) * 100)}%`,
                                        background: "rgba(255,255,255,0.45)",
                                      }}
                                    />
                                  </div>
                                  <div className="fx-muted" style={{ textAlign: "right" }}>
                                    {pctToText(x.p)}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* 3) YTD Summary (更突出) */}
                            <div>
                              <div className="fx-muted" style={{ marginBottom: 8 }}>
                                YTD Summary
                              </div>

                              <div className="fx-card" style={{ padding: 10 }}>
                                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                  {[
                                    { k: "T", v: formatHoursHalfFromMins(mins) },
                                    { k: "G", v: String(gDone || 0) },
                                    { k: "R", v: String(rCnt || 0) },
                                  ].map((x) => (
                                    <div key={x.k} style={ytdPillStyle(isActive)}>
                                      <span className="fx-muted" style={{ fontWeight: 800 }}>
                                        {x.k}:
                                      </span>
                                      <span className="fx-h3" style={{ margin: 0, fontSize: 14 }}>
                                        {x.v}
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {/* Show 12 months 降级：更轻、更小 */}
                                <button
                                  className="fx-btn fx-btnGhost"
                                  type="button"
                                  style={{
                                    width: "100%",
                                    justifyContent: "center",
                                    marginTop: 10,
                                    opacity: 0.85,
                                  }}
                                  onClick={() => onGo("#/months")}
                                >
                                  Show 12 months →
                                </button>
                              </div>
                            </div>

                            {/* 4) Check (主 CTA) */}
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                                alignItems: "flex-end",
                              }}
                            >
                              <button
                                className="fx-btn fx-btnPrimary"
                                type="button"
                                onClick={() => onGo(`#/review?visionId=${encodeURIComponent(v.id)}&month=now`)}
                              >
                                Check →
                              </button>
                              <div className="fx-muted" style={{ textAlign: "right" }}>
                                Review
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="fx-muted" style={{ padding: "8px 2px" }}>
                    Collapsed
                  </div>
                )}
              </div>
            );
          })}

          {!visions.length ? (
            <div className="fx-empty">
              <div className="fx-h3">No visions yet</div>
              <div className="fx-body">先去 Home 创建 Vision；Dashboard 会按 Type 自动汇总。</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}