// src/pages/ReviewPage.tsx
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { getVisionById } from "../lib/visionStore";
import { toVisionVM } from "../domain/vision";
import { readGoalsByVision, GOALS_CHANGED_EVENT, type GoalItem } from "../lib/goalStore";
import * as recordStore from "../lib/recordStore";
import { readTimeByVision, TIME_CHANGED_EVENT } from "../lib/timeStore";

type Props = {
  activeVisionId: string | null;
  onBack: () => void;
  onOpenVision: (id: string) => void;
  onGo: (hash: string) => void;
};

type RecordItem = recordStore.RecordItem;

// ========= helpers =========
function monthLabelFromDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
function addMonths(d: Date, delta: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + delta);
  return x;
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function formatHours(h: number) {
  const x = Math.max(0, Number(h) || 0);
  return x % 1 === 0 ? `${x} h` : `${x.toFixed(1)} h`;
}
function inSameMonth(isoOrAny: string | undefined, anchorMonth: Date) {
  if (!isoOrAny) return false;
  const d = new Date(isoOrAny);
  return d.getFullYear() === anchorMonth.getFullYear() && d.getMonth() === anchorMonth.getMonth();
}
function weeksInMonthReal(anchorMonth: Date) {
  const y = anchorMonth.getFullYear();
  const m = anchorMonth.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  return days / 7;
}
function readRecordsByVisionCompat(visionId: string): RecordItem[] {
  const anyStore: any = recordStore as any;

  if (typeof anyStore.readRecordsByVision === "function") {
    return anyStore.readRecordsByVision(visionId) as RecordItem[];
  }
  if (typeof anyStore.getRecordsByVisionId === "function") {
    return anyStore.getRecordsByVisionId(visionId) as RecordItem[];
  }
  if (typeof anyStore.readRecords === "function") {
    const all = anyStore.readRecords() as RecordItem[];
    return Array.isArray(all) ? all.filter((r) => r.visionId === visionId) : [];
  }
  return [];
}

export default function ReviewPage({ activeVisionId, onBack, onOpenVision, onGo }: Props) {
  // =========================
  // Month control
  // =========================
  const [monthDate, setMonthDate] = useState<Date>(() => new Date());
  const month = useMemo(() => monthLabelFromDate(monthDate), [monthDate]);

  // =========================
  // Refresh ticks (Goals/Time/Records)
  // =========================
  const [goalsTick, setGoalsTick] = useState(0);
  const [timeTick, setTimeTick] = useState(0);
  const [recordsTick, setRecordsTick] = useState(0);

  useEffect(() => {
    const onGoalsChanged = () => setGoalsTick((x) => x + 1);
    window.addEventListener(GOALS_CHANGED_EVENT, onGoalsChanged as any);
    return () => window.removeEventListener(GOALS_CHANGED_EVENT, onGoalsChanged as any);
  }, []);

  useEffect(() => {
    const onTimeChanged = () => setTimeTick((x) => x + 1);
    window.addEventListener(TIME_CHANGED_EVENT, onTimeChanged as any);
    return () => window.removeEventListener(TIME_CHANGED_EVENT, onTimeChanged as any);
  }, []);

  useEffect(() => {
    const anyStore: any = recordStore as any;
    const evt = anyStore.RECORDS_CHANGED_EVENT as string | undefined;

    const onRecordsChanged = () => setRecordsTick((x) => x + 1);

    if (evt) window.addEventListener(evt, onRecordsChanged as any);
    window.addEventListener("storage", onRecordsChanged);

    return () => {
      if (evt) window.removeEventListener(evt, onRecordsChanged as any);
      window.removeEventListener("storage", onRecordsChanged);
    };
  }, []);

  // =========================
  // Vision
  // =========================
  const vid = activeVisionId;

  const vision = useMemo(() => {
    if (!vid) return null;
    return getVisionById(vid);
  }, [vid]);

  const visionVM = useMemo(() => {
    if (!vision) return null;
    return toVisionVM(vision as any);
  }, [vision]);

  // =========================
  // Aggregation (THIS MONTH)
  // =========================
  const planHoursPerWeek = Number(visionVM?.plan?.hoursPerWeek || 0);
  const plannedHours = planHoursPerWeek > 0 ? planHoursPerWeek * weeksInMonthReal(monthDate) : 0;

  const monthTimeItems = useMemo(() => {
    if (!vid) return [];
    void timeTick;
    const all = readTimeByVision(vid);
    return all.filter((t) => inSameMonth(t.createdAt, monthDate));
  }, [vid, monthDate, timeTick]);

  const actualMinutes = useMemo(
    () => monthTimeItems.reduce((acc, x) => acc + (Number(x.minutes) || 0), 0),
    [monthTimeItems]
  );
  const actualHours = actualMinutes / 60;

  const progressPct = clamp(plannedHours > 0 ? actualHours / plannedHours : 0, 0, 1);
  const pctText = `${Math.round(progressPct * 100)}%`;

  const goalsDoneCount = useMemo(() => {
    if (!vid) return 0;
    void goalsTick;
    const all = readGoalsByVision(vid) as GoalItem[];
    return all.filter((g) => g.status === "done" && inSameMonth(g.doneAt || g.createdAt, monthDate)).length;
  }, [vid, monthDate, goalsTick]);

  const recordsCount = useMemo(() => {
    if (!vid) return 0;
    void recordsTick;
    const all = readRecordsByVisionCompat(vid);
    return all.filter((r) => inSameMonth(r.createdAt, monthDate)).length;
  }, [vid, monthDate, recordsTick]);

  // =========================
  // Reflection (UI-only)
  // =========================
  const [a1, setA1] = useState("");
  const [a2, setA2] = useState("");
  const [a3, setA3] = useState("");
  const [saved, setSaved] = useState(false);

  function onSaveReview() {
    setSaved(true); // UI-only：不落库
  }

  // =========================
  // Guards
  // =========================
  const noActive = !activeVisionId;
  const notFound = !!activeVisionId && (!vision || !visionVM);

  if (noActive) {
    return (
      <div className="fx-app">
        <div className="fx-bg" />
        <div className="fx-container">
          <div className="fx-topbar">
            <div className="fx-brand">
              <div className="fx-brandMark" />
              <div className="fx-brandText">
                <div className="fx-kicker">FleinX2026</div>
                <div className="fx-title">Review</div>
              </div>
            </div>

            <button className="fx-btn fx-btnGhost" onClick={onBack} type="button">
              ← Back
            </button>
          </div>

          <div className="fx-card fx-main" style={{ padding: 18 }}>
            <div className="fx-h2">No Active Vision</div>
            <div className="fx-sub" style={{ marginTop: 6 }}>
              请先在 Home 设置 Active Vision。
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

  if (notFound) {
    return (
      <div className="fx-app">
        <div className="fx-bg" />
        <div className="fx-container">
          <div className="fx-topbar">
            <div className="fx-brand">
              <div className="fx-brandMark" />
              <div className="fx-brandText">
                <div className="fx-kicker">FleinX2026</div>
                <div className="fx-title">Review</div>
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

  const visionTitle = visionVM!.title || "-";

  // ===== UI helpers (local) =====
  const pillStyle = (bg: string, bd: string): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "0.5px 3px",
    borderRadius: 999,
    border: `1px solid ${bd}`,
    background: bg,
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
    fontWeight: 700,
    letterSpacing: 0.1,
    whiteSpace: "nowrap",
  });

  const softPanel = (borderColor: string): CSSProperties => ({
    border: `1px solid ${borderColor}`,
    boxShadow: "0 18px 48px rgba(0,0,0,0.35)",
    background: "rgba(255,255,255,0.03)",
  });

  // ✅ 改：标题用白色（fx-h3），右侧提示同一行
  function SectionHeader({
    title,
    hint,
  }: {
    title: string;
    hint?: string;
  }) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <div className="fx-h3" style={{ margin: 0 }}>
          {title}
        </div>

        {hint ? (
          <div
            className="fx-muted"
            style={{
              maxWidth: 720,
              lineHeight: 1.35,
              opacity: 0.9,
              textAlign: "left",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={hint}
          >
            {hint}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="fx-app">
      <div className="fx-bg" />
      <div className="fx-container">
        {/* Header */}
        <div className="fx-topbar">
          <div className="fx-brand">
            <div className="fx-brandMark" />
            <div className="fx-brandText">
              <div className="fx-kicker">FleinX2026</div>
              <div className="fx-title">Review · {month}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="fx-btn fx-btnGhost" type="button" onClick={() => onOpenVision(activeVisionId!)}>
              Open Vision →
            </button>
            <button className="fx-btn fx-btnGhost" onClick={onBack} type="button">
              ← Back
            </button>
          </div>
        </div>

        <div className="fx-card fx-main" style={{ padding: 18 }}>
          {/* Active Vision (match Goals/Time) */}
          <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
            <div className="fx-muted" style={{ fontSize: 12 }}>
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
                maxWidth: "100%",
              }}
              title={visionTitle}
            >
              {`【${visionTitle}】`}
            </div>
          </div>
{/* Guide line */}
<div className="fx-muted" style={{ fontSize: 12, marginBottom: 10 }}>
  你的复盘，不是评判对错，而是校准方向与节奏。
</div>
          {/* Month switch */}
          <div
            className="fx-typeCard"
            style={{
              padding: 14,
              ...softPanel("rgba(255,255,255,0.10)"),
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            <button className="fx-btn fx-btnGhost" type="button" onClick={() => setMonthDate((d) => addMonths(d, -1))}>
              ← Prev
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="fx-muted">Month</div>
              <div className="fx-h3" style={{ margin: 0 }}>
                {month}
              </div>
            </div>

            <button className="fx-btn fx-btnGhost" type="button" onClick={() => setMonthDate((d) => addMonths(d, 1))}>
              Next →
            </button>

            <div style={{ flex: 1 }} />

            <button className="fx-btn fx-btnGhost" type="button" onClick={() => setMonthDate(new Date())}>
              This Month
            </button>
          </div>

          {/* ===================== PROGRESS ===================== */}
          <div className="fx-typeCard fx-stack" style={{ padding: 16, ...softPanel("rgba(124,92,255,0.40)") }}>
            <SectionHeader title="Progress" hint="一点点推进也算数。持续把“实际”拉近到“计划”。" />

            {/* Dashboards (keep card feeling) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              <div className="fx-card" style={{ padding: 14, ...softPanel("rgba(79,165,255,0.35)"), minHeight: 98 }}>
                <div className="fx-muted">Planned</div>
                <div className="fx-h2" style={{ marginTop: 8 }}>
                  {formatHours(plannedHours)}
                </div>
                <div className="fx-muted" style={{ marginTop: 6 }}>
                  Based on {planHoursPerWeek > 0 ? `${planHoursPerWeek}h/week` : "no plan"}
                </div>
              </div>

              <div className="fx-card" style={{ padding: 14, ...softPanel("rgba(124,92,255,0.35)"), minHeight: 98 }}>
                <div className="fx-muted">Actual</div>
                <div className="fx-h2" style={{ marginTop: 8 }}>
                  {formatHours(actualHours)}
                </div>
                <div className="fx-muted" style={{ marginTop: 6 }}>
                  From Time logs
                </div>
              </div>

              <div className="fx-card" style={{ padding: 14, ...softPanel("rgba(65,204,160,0.30)"), minHeight: 98 }}>
                <div className="fx-muted">Progress</div>
                <div className="fx-h2" style={{ marginTop: 8 }}>
                  {pctText}
                </div>
                <div className="fx-muted" style={{ marginTop: 6 }}>
                  Actual / Planned
                </div>
              </div>
            </div>

            {/* DONE + bar (keep capsule; you didn't ask to remove this one) */}
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div
  style={{
    ...pillStyle("rgba(65,204,160,0.14)", "rgba(65,204,160,0.45)"),
    fontSize: 11,
    padding: "2px 10px",
    fontWeight: 700,
  }}
>
  DONE {pctText}
</div>
                <div className="fx-muted">{Math.round(progressPct * 100)}% completed</div>
              </div>



              <div style={{ marginTop: 10 }}>
                <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.round(progressPct * 100)}%`,
                      background: "rgba(65,204,160,0.70)",
                      boxShadow: "0 0 18px rgba(65,204,160,0.35)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ===================== SNAPSHOT ===================== */}
          <div className="fx-typeCard fx-stack" style={{ padding: 16, marginTop: 12, ...softPanel("rgba(79,165,255,0.30)") }}>
            <SectionHeader title="This Month Snapshot" hint="只看关键数字。需要细节就点进去。" />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              <div className="fx-card" style={{ padding: 14, ...softPanel("rgba(79,165,255,0.22)") }}>
                <div className="fx-muted">Time Spent</div>
                <div className="fx-h2" style={{ marginTop: 8 }}>
                  {formatHours(actualHours)}
                </div>
                <div className="fx-muted" style={{ marginTop: 8 }}>
                  Logs (this month): {monthTimeItems.length}
                </div>
                <div style={{ marginTop: 12 }}>
                  <button className="fx-btn fx-btnGhost" type="button" onClick={() => onGo("#/time")}>
                    View Time →
                  </button>
                </div>
              </div>

              <div className="fx-card" style={{ padding: 14, ...softPanel("rgba(124,92,255,0.22)") }}>
                <div className="fx-muted">Goals Done</div>
                <div className="fx-h2" style={{ marginTop: 8 }}>
                  {goalsDoneCount}
                </div>
                <div className="fx-muted" style={{ marginTop: 8 }}>
                  Completed (this month)
                </div>
                <div style={{ marginTop: 12 }}>
                  <button className="fx-btn fx-btnGhost" type="button" onClick={() => onGo("#/goals")}>
                    View Goals →
                  </button>
                </div>
              </div>

              <div className="fx-card" style={{ padding: 14, ...softPanel("rgba(65,204,160,0.20)") }}>
                <div className="fx-muted">Records</div>
                <div className="fx-h2" style={{ marginTop: 8 }}>
                  {recordsCount}
                </div>
                <div className="fx-muted" style={{ marginTop: 8 }}>
                  Created (this month)
                </div>
                <div style={{ marginTop: 12 }}>
                  <button className="fx-btn fx-btnGhost" type="button" onClick={() => onGo("#/records")}>
                    View Records →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ===================== REFLECTION ===================== */}
          <div className="fx-typeCard fx-stack" style={{ padding: 16, marginTop: 12, ...softPanel("rgba(65,204,160,0.26)") }}>
            <SectionHeader title="Reflection" hint="写一句就够。写完你会更清楚下个月怎么用力。" />

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div className="fx-muted" style={{ marginBottom: 8 }}>
                  1) 这个月我最满意的一件事是？
                </div>
                <input className="fx-input" value={a1} onChange={(e) => setA1(e.target.value)} placeholder="一句话即可" />
              </div>

              <div>
                <div className="fx-muted" style={{ marginBottom: 8 }}>
                  2) 如果只选一件需要改进的，会是什么？
                </div>
                <input className="fx-input" value={a2} onChange={(e) => setA2(e.target.value)} placeholder="一句话即可" />
              </div>

              <div>
                <div className="fx-muted" style={{ marginBottom: 8 }}>
                  3) 下个月我想继续坚持的是？
                </div>
                <input className="fx-input" value={a3} onChange={(e) => setA3(e.target.value)} placeholder="一句话即可" />
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 2, flexWrap: "wrap" }}>
                <button className="fx-btn fx-btnPrimary" type="button" onClick={onSaveReview}>
                  Save My Review →
                </button>

                <button
                  className="fx-btn fx-btnGhost"
                  type="button"
                  onClick={() => {
                    setA1("");
                    setA2("");
                    setA3("");
                    setSaved(false);
                  }}
                >
                  Clear
                </button>

                {saved ? <div className="fx-muted">Saved (UI only)</div> : null}
              </div>
            </div>
          </div>

          {/* Optional: after saved */}
          {saved ? (
            <div className="fx-card" style={{ marginTop: 12, padding: 16, ...softPanel("rgba(124,92,255,0.25)") }}>
              <div className="fx-h3">Next Month Setup</div>
              <div className="fx-sub" style={{ marginTop: 6 }}>
                Nice work. 给下个月加 1-3 个可完成的小步？
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <button className="fx-btn fx-btnPrimary" type="button" onClick={() => onGo("#/goals")}>
                  Set Up Next Month Goals →
                </button>

                <button className="fx-btn fx-btnGhost" type="button" onClick={() => setSaved(false)}>
                  Not now
                </button>
              </div>
            </div>
          ) : null}

          {/* Footer */}
          <div className="fx-footerNote" style={{ marginTop: 14 }}>
            Keep going. 记录会变成你的证据链。
          </div>
        </div>
      </div>
    </div>
  );
}