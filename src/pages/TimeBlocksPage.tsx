// src/pages/TimeBlocksPage.tsx
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { getVisionById } from "../lib/visionStore";
import {
  TIME_CHANGED_EVENT,
  addTime,
  deleteTime,
  readTimeByVision,
  sumMinutesByVision,
  type TimeItem,
} from "../lib/timeStore";
import { GOALS_CHANGED_EVENT, readGoalsByVision, type GoalItem } from "../lib/goalStore";

type Props = {
  activeVisionId: string | null;
  onBack: () => void;
  onOpenVision: (id: string) => void; // 保留签名不改（即使页面不再用）
};

function formatMins(mins: number) {
  const m = Math.max(0, Math.floor(mins || 0));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h <= 0) return `${m}min`;
  if (r === 0) return `${h}h`;
  return `${h}h${r}m`;
}

function normalizeMilestones(v: any): Array<{ date: string; text: string }> {
  const ms = v?.milestones;
  if (!Array.isArray(ms)) return [];

  if (ms.length && typeof ms[0]?.date === "string") {
    return ms.map((m: any) => ({ date: String(m.date || ""), text: String(m.text || "") }));
  }
  if (ms.length && typeof ms[0]?.due === "string") {
    return ms.map((m: any) => ({ date: String(m.due || ""), text: String(m.title || "") }));
  }
  return [];
}

function legacyMilestoneLabel(
  milestoneId: string | undefined,
  milestones: Array<{ date: string; text: string }>
) {
  if (!milestoneId) return "";
  const idxStr = String(milestoneId).replace("m", "");
  const idx = Number(idxStr);
  if (!Number.isFinite(idx) || idx < 0 || idx >= milestones.length) return String(milestoneId);
  const t = milestones[idx]?.text || `Milestone ${idx + 1}`;
  return `M${idx + 1} · ${t}`;
}

export default function TimeBlocksPage({ activeVisionId, onBack }: Props) {
  const [tick, setTick] = useState(0);

  // form
  const [minutesStr, setMinutesStr] = useState<string>("30");
  const [note, setNote] = useState<string>("");
  const [goalId, setGoalId] = useState<string>(""); // empty = No Goal
  const [err, setErr] = useState<string>("");

  // list
  const [search, setSearch] = useState<string>("");
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [historyLimit, setHistoryLimit] = useState<number>(20);

  // goal picker popover
  const [goalPickerOpen, setGoalPickerOpen] = useState(false);
  const goalPickerWrapRef = useRef<HTMLDivElement | null>(null);

  // refresh tick
  useEffect(() => {
    const onChanged = () => setTick((x) => x + 1);
    window.addEventListener(TIME_CHANGED_EVENT, onChanged as any);
    return () => window.removeEventListener(TIME_CHANGED_EVENT, onChanged as any);
  }, []);

  useEffect(() => {
    const onChanged = () => setTick((x) => x + 1);
    window.addEventListener(GOALS_CHANGED_EVENT, onChanged as any);
    return () => window.removeEventListener(GOALS_CHANGED_EVENT, onChanged as any);
  }, []);

  // click outside closes popover
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!goalPickerOpen) return;
      const el = goalPickerWrapRef.current;
      if (!el) return;
      if (!el.contains(e.target as any)) setGoalPickerOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [goalPickerOpen]);

  const vision = useMemo(() => {
    if (!activeVisionId) return null;
    return getVisionById(activeVisionId);
  }, [activeVisionId]);

  const milestones = useMemo(() => (vision ? normalizeMilestones(vision as any) : []), [vision]);

  const allTimeItems = useMemo(() => {
    if (!activeVisionId) return [];
    void tick;
    return readTimeByVision(activeVisionId);
  }, [activeVisionId, tick]);

  const totalMins = useMemo(() => {
    if (!activeVisionId) return 0;
    void tick;
    return sumMinutesByVision(activeVisionId);
  }, [activeVisionId, tick]);

  const allGoals = useMemo(() => {
    if (!activeVisionId) return [];
    void tick;
    return readGoalsByVision(activeVisionId);
  }, [activeVisionId, tick]);

  const openGoals = useMemo(() => allGoals.filter((g) => g.status !== "done"), [allGoals]);

  const goalMap = useMemo(() => {
    const m = new Map<string, GoalItem>();
    allGoals.forEach((g) => m.set(g.id, g));
    return m;
  }, [allGoals]);

  // ====== seq map (M1-1 / M1-2 …) ======
  const goalSeqMap = useMemo(() => {
    const byM: Record<0 | 1 | 2, GoalItem[]> = { 0: [], 1: [], 2: [] };
    allGoals.forEach((g) => {
      const mi = (g.milestoneIndex ?? 0) as 0 | 1 | 2;
      byM[mi].push(g);
    });

    const map = new Map<string, string>();
    ([0, 1, 2] as const).forEach((mi) => {
      const sorted = [...byM[mi]].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      sorted.forEach((g, i) => map.set(g.id, `M${mi + 1}-${i + 1}`));
    });

    return map;
  }, [allGoals]);

  function goalLabelById(id: string | undefined) {
    if (!id) return "No Goal";
    const g = goalMap.get(id);
    if (!g) return "No Goal";
    const seq = goalSeqMap.get(id) || `M${(g.milestoneIndex ?? 0) + 1}-?`;
    return `${seq} · ${g.title}`;
  }

  const openGoalOptions = useMemo(() => {
    return [...openGoals].sort((a, b) => {
      const am = a.milestoneIndex ?? 0;
      const bm = b.milestoneIndex ?? 0;
      if (am !== bm) return am - bm;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [openGoals]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allTimeItems;
    return allTimeItems.filter((x) => String(x.note || "").toLowerCase().includes(q));
  }, [allTimeItems, search]);

  const recent10 = useMemo(() => filteredItems.slice(0, 10), [filteredItems]);

  const historyItems = useMemo(() => {
    if (!showHistory) return [];
    return filteredItems.slice(10, 10 + historyLimit);
  }, [filteredItems, showHistory, historyLimit]);

  function submit() {
    setErr("");

    if (!activeVisionId) {
      setErr("请先在 Home 设置 Active Vision。");
      return;
    }

    const mins = Math.max(0, Math.floor(Number(minutesStr) || 0));
    const n = note.trim();

    if (mins <= 0) {
      setErr("minutes 必须 > 0");
      return;
    }
    if (!n) {
      setErr("note 不能为空（写一句你做了什么）");
      return;
    }

    addTime({
      visionId: activeVisionId,
      minutes: mins,
      note: n,
      goalId: goalId ? goalId : undefined,
    });

    setNote("");
    setGoalId("");
    setGoalPickerOpen(false);
  }

  function removeItem(x: TimeItem) {
    deleteTime(x.id);
  }

  // --------------------------
  // UI helpers
  // --------------------------
  const tinyPill: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.2,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.035)",
    color: "rgba(255,255,255,0.92)",
    whiteSpace: "nowrap",
  };

  // ✅ 发光胶囊：只用于时间 30min / 40min 等
  const glowMinsPill: CSSProperties = {
    ...tinyPill,
    border: "1px solid rgba(149,120,255,0.70)",
    boxShadow: "0 0 0 1px rgba(149,120,255,0.22), 0 0 18px rgba(149,120,255,0.28)",
    background: "rgba(255,255,255,0.03)",
  };

  const sectionCard: CSSProperties = {
    padding: 16,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.02)",
  };

  // ✅ 手机端友好：改成 flex，label 更窄，输入区域自适应
  const row: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "nowrap",
  };

  const labelCol: CSSProperties = {
    width: 64,
    flex: "0 0 auto",
  };

  const fieldCol: CSSProperties = {
    flex: "1 1 0px",
    minWidth: 0,
  };

  const label: CSSProperties = {
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(255,255,255,0.78)",
  };

  const divider: CSSProperties = { height: 1, background: "rgba(255,255,255,0.08)" };

  // --------------------------
  // Empty states
  // --------------------------
  if (!activeVisionId) {
    return (
      <div className="fx-app">
        <div className="fx-bg" />
        <div className="fx-container">
          <div className="fx-topbar">
            <div className="fx-brand">
              <div className="fx-brandMark" />
              <div className="fx-brandText">
                <div className="fx-kicker">FleinX2026</div>
                <div className="fx-title">Time</div>
              </div>
            </div>

            <button className="fx-btn fx-btnGhost" onClick={onBack} type="button">
              ← Back
            </button>
          </div>

          <div className="fx-card fx-main" style={{ padding: 18 }}>
            <div className="fx-h2">No Active Vision</div>
            <div className="fx-sub" style={{ marginTop: 6 }}>
              请先在 Home 选择一个 Vision 并设为 Active。
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button className="fx-btn fx-btnPrimary" type="button" onClick={onBack}>
                Go to Home →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vision) {
    return (
      <div className="fx-app">
        <div className="fx-bg" />
        <div className="fx-container">
          <div className="fx-topbar">
            <div className="fx-brand">
              <div className="fx-brandMark" />
              <div className="fx-brandText">
                <div className="fx-kicker">FleinX2026</div>
                <div className="fx-title">Time</div>
              </div>
            </div>

            <button className="fx-btn fx-btnGhost" onClick={onBack} type="button">
              ← Back
            </button>
          </div>

          <div className="fx-card fx-main" style={{ padding: 18 }}>
            <div className="fx-h2">Active Vision Not Found</div>
            <div className="fx-sub" style={{ marginTop: 6 }}>
              当前 Active Vision 可能已被删除。请回到 Home 重新设置。
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button className="fx-btn fx-btnPrimary" type="button" onClick={onBack}>
                Go to Home →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------
  // UI
  // --------------------------
  const visionTitle = String((vision as any).title || "-");
  const subtitle = "你的时间，是否在持续推进你真正想做成的事情。";

  return (
    <div className="fx-app">
      <div className="fx-bg" />
      <div className="fx-container">
        {/* Topbar（✅只留 Back，去掉 Open Vision） */}
        <div className="fx-topbar">
          <div className="fx-brand">
            <div className="fx-brandMark" />
            <div className="fx-brandText">
              <div className="fx-kicker">FleinX2026</div>
              <div className="fx-title">Time</div>
            </div>
          </div>

          <button className="fx-btn fx-btnGhost" onClick={onBack} type="button">
            ← Back
          </button>
        </div>

        <div className="fx-card fx-main" style={{ padding: 18 }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 220 }}>
              <div className="fx-muted" style={{ fontSize: 12, marginBottom: 8 }}>
                Active Vision
              </div>

              <div
                style={{
                  fontSize: 26,
                  fontWeight: 860,
                  letterSpacing: 0.3,
                  lineHeight: 1.12,
                  color: "rgba(245,245,255,0.96)",
                  textShadow:
                    "0 18px 45px rgba(0,0,0,0.45), 0 10px 28px rgba(79,195,247,0.12), 0 8px 22px rgba(149,120,255,0.10)",
                  display: "inline-block",
                  padding: "6px 10px",
                  borderRadius: 12,
                  background: "linear-gradient(90deg, rgba(149,120,255,0.22), rgba(79,195,247,0.14))",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backdropFilter: "blur(10px)",
                }}
              >
                {`【${visionTitle}】`}
              </div>

              <div className="fx-muted" style={{ fontSize: 12, marginTop: 10 }}>
                {subtitle}
              </div>
            </div>

            <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <span style={tinyPill}>TOTAL</span>
              <div style={{ fontSize: 16, fontWeight: 900, color: "rgba(255,255,255,0.94)" }}>
                {formatMins(totalMins)}
              </div>
            </div>
          </div>

          {/* Add Time */}
          <div style={{ ...sectionCard, marginTop: 14, borderColor: "rgba(149,120,255,0.20)" }}>
            <div className="fx-h3" style={{ margin: 0 }}>
              Add Time
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              {/* Minutes */}
              <div style={row}>
                <div style={{ ...label, ...labelCol }}>Minutes</div>
                <div style={fieldCol}>
                  <input
                    className="fx-input"
                    value={minutesStr}
                    placeholder="30"
                    onChange={(e) => setMinutesStr(e.target.value)}
                    inputMode="numeric"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {/* Goal picker */}
              <div style={row} ref={goalPickerWrapRef}>
                <div style={{ ...label, ...labelCol }}>Goal</div>

                <div style={{ ...fieldCol, position: "relative" }}>
                  <button
                    type="button"
                    className="fx-input"
                    onClick={() => setGoalPickerOpen((v) => !v)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {goalLabelById(goalId || undefined)}
                    </span>
                    <span style={{ opacity: 0.7 }}>▾</span>
                  </button>

                  {goalPickerOpen ? (
                    <div
                      style={{
                        position: "absolute",
                        zIndex: 60,
                        left: 0,
                        right: "auto",
                        width: "min(520px, 100%)",
                        marginTop: 8,
                        borderRadius: 16,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(20,22,30,0.92)",
                        boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
                        backdropFilter: "blur(14px)",
                        overflow: "hidden",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setGoalId("");
                          setGoalPickerOpen(false);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 12px",
                          background: goalId ? "transparent" : "rgba(255,255,255,0.06)",
                          border: 0,
                          color: "rgba(255,255,255,0.92)",
                          cursor: "pointer",
                        }}
                      >
                        {goalId ? "No Goal" : "✓ No Goal"}
                      </button>

                      <div style={divider} />

                      <div style={{ maxHeight: 280, overflow: "auto" }}>
                        {openGoalOptions.length ? (
                          openGoalOptions.map((g) => {
                            const seq = goalSeqMap.get(g.id) || `M${(g.milestoneIndex ?? 0) + 1}-?`;
                            const labelText = `${seq} · ${g.title}`;
                            const selected = goalId === g.id;

                            return (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() => {
                                  setGoalId(g.id);
                                  setGoalPickerOpen(false);
                                }}
                                style={{
                                  width: "100%",
                                  textAlign: "left",
                                  padding: "10px 12px",
                                  background: selected ? "rgba(149,120,255,0.16)" : "transparent",
                                  border: 0,
                                  color: "rgba(255,255,255,0.92)",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 10,
                                }}
                              >
                                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {labelText}
                                </span>
                                <span style={{ opacity: selected ? 0.95 : 0.35 }}>{selected ? "✓" : ""}</span>
                              </button>
                            );
                          })
                        ) : (
                          <div style={{ padding: "10px 12px", color: "rgba(255,255,255,0.60)" }}>No open goals</div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Note */}
              <div style={row}>
                <div style={{ ...label, ...labelCol }}>Note</div>
                <div style={fieldCol}>
                  <input
                    className="fx-input"
                    value={note}
                    placeholder="写完一段关键逻辑"
                    onChange={(e) => setNote(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {err ? (
                <div className="fx-body" style={{ color: "rgba(255,255,255,0.86)", opacity: 0.95 }}>
                  {err}
                </div>
              ) : null}

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 2 }}>
                <button className="fx-btn fx-btnPrimary" type="button" onClick={submit}>
                  Save →
                </button>
                <button
                  className="fx-btn fx-btnGhost"
                  type="button"
                  onClick={() => {
                    setNote("");
                    setGoalId("");
                    setGoalPickerOpen(false);
                    setErr("");
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Recent */}
          <div style={{ ...sectionCard, marginTop: 14, borderColor: "rgba(255,255,255,0.10)" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div className="fx-h3" style={{ margin: 0 }}>
                Recent
              </div>

              <input
                className="fx-input"
                value={search}
                placeholder="Search in note…"
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHistoryLimit(20);
                }}
                style={{ maxWidth: 260 }}
              />
            </div>

            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              {recent10.length ? (
                recent10.map((x) => {
                  const g = x.goalId ? goalMap.get(String(x.goalId)) : undefined;
                  const legacy = !g && (x as any).milestoneId ? legacyMilestoneLabel((x as any).milestoneId, milestones) : "";
                  const goalLine = g ? `Goal · ${goalLabelById(g.id)}` : legacy ? `Legacy · ${legacy}` : "";

                  return (
                    <div
                      key={x.id}
                      className="fx-card"
                      style={{
                        padding: 16,
                        borderRadius: 18,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            {/* ✅ 只让时间胶囊发光 */}
                            <span style={glowMinsPill}>{formatMins(x.minutes)}</span>

                            <div className="fx-muted" style={{ fontSize: 12 }}>
                              {new Date(x.createdAt).toLocaleString()}
                            </div>
                          </div>

                          {goalLine ? (
                            <div className="fx-muted" style={{ marginTop: 8, fontSize: 12 }}>
                              {goalLine}
                            </div>
                          ) : null}
                        </div>

                        <button className="fx-btn fx-btnGhost" type="button" onClick={() => removeItem(x)}>
                          Delete
                        </button>
                      </div>

                      <div className="fx-body" style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>
                        {x.note}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="fx-empty">
                  <div className="fx-body">No time records</div>
                </div>
              )}
            </div>

            {/* History */}
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div className="fx-muted" style={{ fontSize: 12 }}>
                  History · {Math.max(0, filteredItems.length - 10)}
                </div>

                <button
                  className="fx-btn fx-btnGhost"
                  type="button"
                  onClick={() => {
                    setShowHistory((v) => !v);
                    setHistoryLimit(20);
                  }}
                >
                  {showHistory ? "Hide" : "Show"}
                </button>
              </div>

              {showHistory ? (
                <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                  {historyItems.length ? (
                    historyItems.map((x) => {
                      const g = x.goalId ? goalMap.get(String(x.goalId)) : undefined;
                      const legacy = !g && (x as any).milestoneId ? legacyMilestoneLabel((x as any).milestoneId, milestones) : "";
                      const goalLine = g ? `Goal · ${goalLabelById(g.id)}` : legacy ? `Legacy · ${legacy}` : "";

                      return (
                        <div
                          key={x.id}
                          className="fx-card"
                          style={{
                            padding: 16,
                            borderRadius: 18,
                            border: "1px solid rgba(255,255,255,0.10)",
                            background: "rgba(255,255,255,0.02)",
                            opacity: 0.96,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                {/* ✅ 只让时间胶囊发光 */}
                                <span style={glowMinsPill}>{formatMins(x.minutes)}</span>

                                <div className="fx-muted" style={{ fontSize: 12 }}>
                                  {new Date(x.createdAt).toLocaleString()}
                                </div>
                              </div>

                              {goalLine ? (
                                <div className="fx-muted" style={{ marginTop: 8, fontSize: 12 }}>
                                  {goalLine}
                                </div>
                              ) : null}
                            </div>

                            <button className="fx-btn fx-btnGhost" type="button" onClick={() => removeItem(x)}>
                              Delete
                            </button>
                          </div>

                          <div className="fx-body" style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>
                            {x.note}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="fx-empty">
                      <div className="fx-body">No more history</div>
                    </div>
                  )}

                  {10 + historyLimit < filteredItems.length ? (
                    <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
                      <button className="fx-btn fx-btnGhost" type="button" onClick={() => setHistoryLimit((x) => x + 20)}>
                        Load more (+20)
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}