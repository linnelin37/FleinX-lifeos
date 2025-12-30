// src/pages/MonthlyBoardPage.tsx
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { VisionRecord } from "../lib/visionStore";

import { DATA_CHANGED_EVENT } from "../lib/dataEvents";
import { sumMinutesByVisionRange } from "../lib/timeStore";
import { countGoalsDoneByVisionRange } from "../lib/goalStore";
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

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatHoursHalfFromMins(mins: number) {
  const m = Math.max(0, Number(mins) || 0);
  if (m <= 0) return "0h";
  const h = m / 60;
  const half = Math.round(h * 2) / 2;
  if (half <= 0) return "0h";
  if (Number.isInteger(half)) return `${half}h`;
  return `${half.toFixed(1)}h`;
}

function monthRangeISO(year: number, month1to12: number) {
  const m = clamp(month1to12, 1, 12);
  const start = new Date(year, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, m, 1, 0, 0, 0, 0);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

function getCurrentYear() {
  return new Date().getFullYear();
}

function last3MonthsOfYear(year: number) {
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth1to12 = now.getMonth() + 1;
  if (curYear !== year) return [10, 11, 12];

  const a = Math.max(1, curMonth1to12 - 2);
  const out: number[] = [];
  for (let m = a; m <= curMonth1to12; m++) out.push(m);
  return out;
}

export default function MonthlyBoardPage({ visions, activeVisionId, onBack, onGo }: Props) {
  const year = useMemo(() => getCurrentYear(), []);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((x) => x + 1);
    window.addEventListener(DATA_CHANGED_EVENT, bump as any);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, bump as any);
  }, []);

  // ===== UI helpers (match Dashboard page style) =====
  const softPanel = (borderColor: string): CSSProperties => ({
    border: `1px solid ${borderColor}`,
    boxShadow: "0 18px 48px rgba(0,0,0,0.35)",
    background: "rgba(255,255,255,0.03)",
  });
void softPanel;

  const sectionCard: CSSProperties = {
    padding: 16,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.02)",
  };

  const innerFrame: CSSProperties = {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)",
    padding: 16,
  };

  const activeFrame: CSSProperties = {
    borderRadius: 18,
    border: "1px solid rgba(108,99,255,0.65)",
    boxShadow: "0 0 0 1px rgba(108,99,255,.25), 0 18px 60px rgba(0,0,0,.35)",
    background: "rgba(255,255,255,0.02)",
    padding: 16,
  };

  const monthRowBox: CSSProperties = {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.02)",
  };

  function SectionHeader({
    title,
    countText,
    collapsed,
    onToggle,
  }: {
    title: string;
    countText: string;
    collapsed: boolean;
    onToggle: () => void;
  }) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <div className="fx-h3" style={{ margin: 0 }}>
          {title} <span className="fx-muted">· {countText}</span>
        </div>

        <button className="fx-btn fx-btnGhost" type="button" onClick={onToggle}>
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>
    );
  }

  // ===== groups by type =====
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

  // expand year per vision (true=12 months, false=recent 3)
  const [expandedYear, setExpandedYear] = useState<Record<string, boolean>>({});
  function toggleVisionYear(id: string) {
    setExpandedYear((m) => ({ ...m, [id]: !m[id] }));
  }

  // collapse per type section
  const [collapsedType, setCollapsedType] = useState<Record<string, boolean>>({});
  function toggleType(type: string) {
    setCollapsedType((m) => ({ ...m, [type]: !m[type] }));
  }

  const allMonths = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const defaultMonths = useMemo(() => last3MonthsOfYear(year), [year]);

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
              <div className="fx-title">Monthly Board · {year}</div>
            </div>
          </div>

          <button className="fx-btn fx-btnGhost" type="button" onClick={onBack}>
            ← Back
          </button>
        </div>

        {/* Main */}
        <div className="fx-card fx-main" style={{ padding: 18 }}>
          {/* Header Guidance (same vibe as Dashboard) */}
          <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
            <div className="fx-h3" style={{ margin: 0 }}>
              Year Overview · {year}
            </div>
            <div className="fx-sub">不是推你向前，而是确认你没有偏航。</div>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            {groups.map((g) => {
              const list = g.list || [];
              const isCollapsed = !!collapsedType[g.type];

              return (
                <div key={g.type} style={sectionCard}>
                  <SectionHeader
                    title={typeLabel(g.type)}
                    countText={`${list.length} Vision`}
                    collapsed={isCollapsed}
                    onToggle={() => toggleType(g.type)}
                  />

                  {isCollapsed ? null : (
                    <div style={{ display: "grid", gap: 12 }}>
                      {list.map((v) => {
                        const isActive = v.id === activeVisionId;
                        const isExpanded = !!expandedYear[v.id];
                        const months = isExpanded ? allMonths : defaultMonths;

                        const rows = months.map((m) => {
                          const { startISO, endISO } = monthRangeISO(year, m);
                          const mins = sumMinutesByVisionRange(v.id, startISO, endISO);
                          const gd = countGoalsDoneByVisionRange(v.id, startISO, endISO);
                          const rc = countRecordsByVisionRange(v.id, startISO, endISO);
                          return {
                            key: `${year}-${m}`,
                            label: `${year}-${pad2(m)}`,
                            t: formatHoursHalfFromMins(mins),
                            g: Number(gd || 0),
                            r: Number(rc || 0),
                          };
                        });

                        return (
                          <div
                            key={v.id}
                            className="fx-typeCard"
                            style={{
                              padding: 0,
                              ...(isActive ? activeFrame : innerFrame),
                            }}
                          >
                            {/* ====== Layout: LEFT (Vision) | RIGHT (Months) | FAR RIGHT (Action) ====== */}
                            <div
                            className="fx-mbRow"
                              style={{
                                display: "grid",
                                gridTemplateColumns: "360px 1fr 160px",
                                gap: 18,
                                alignItems: "center",
                              }}
                            >
                              {/* LEFT: Vision block (exact order you asked) */}
                             <div className="fx-mbLeft" style={{ minWidth: 0 }}>
                                

                                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                                  <div
                                    className="fx-h2"
                                    style={{
                                      margin: 0,
                                      fontSize: 22,
                                      fontWeight: 850,
                                      lineHeight: 1.15,
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      maxWidth: "100%",
                                    }}
                                    title={v.title}
                                  >
                                    {`【${v.title || "-"}】`}
                                  </div>

                                  {isActive ? (
                                    <span
                                      className="fx-muted"
                                      style={{
                                        fontSize: 12,
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                        border: "1px solid rgba(108,99,255,.55)",
                                        background: "rgba(108,99,255,.10)",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      (Active)
                                    </span>
                                  ) : null}
                                </div>

                    

                                {/* Open Vision strictly below Vision name */}
                                <div style={{ marginTop: 12 }}>
                                  <button className="fx-btn fx-btnGhost" type="button" onClick={() => onGo(`#/vision/${v.id}`)}>
                                    Open Vision →
                                  </button>
                                </div>
                              </div>

                              {/* RIGHT: Months list (NO pills / NO capsule) */}
                              <div className="fx-mbRight" style={{ minWidth: 0 }}>
                                <div className="fx-muted" style={{ fontSize: 12, marginBottom: 10 }}>
                                  {isExpanded ? "Year Summary" : "Recent 3 months"} 
                                </div>

                                <div style={{ display: "grid", gap: 10 }}>
                                  {rows.map((m) => (
                                    <div key={m.key} style={monthRowBox}>
                                      <div
                                        style={{
                                          display: "grid",
                                          gridTemplateColumns: "100px 1fr",
                                          gap: 10,
                                          alignItems: "center",
                                        }}
                                      >
                                        <div className="fx-muted" style={{ fontWeight: 800 }}>
                                          {m.label}
                                        </div>
                                        <div className="fx-body" style={{ opacity: 0.92 }}>
                                          T: {m.t} &nbsp;&nbsp; G: {m.g} &nbsp;&nbsp; R: {m.r}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* FAR RIGHT: Expand Year (same placement as Check on Dashboard) */}
                             <div className="fx-mbAction" style={{ display: "grid", justifyItems: "center", gap: 8 }}>
                                <button className="fx-btn fx-btnPrimary" type="button" onClick={() => toggleVisionYear(v.id)}>
                                  {isExpanded ? "Collapse" : "Expand Year →"}
                                </button>

                                <div className="fx-muted" style={{ fontSize: 12 }}>
                                  {isExpanded ? "Year" : "Recent"}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {!visions.length ? (
              <div className="fx-empty">
                <div className="fx-h3">No visions yet</div>
                <div className="fx-body">先去 Home 创建 Vision；Monthly Board 会按 Type 自动汇总。</div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}