// src/pages/GoalsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { getVisionById } from "../lib/visionStore";
import { toVisionVM } from "../domain/vision";
import {
  GOALS_CHANGED_EVENT,
  addGoal,
  readGoalsByVision,
  toggleGoalDone,
  deleteGoal,
  setMilestoneDone,
  readMilestoneStatusByVision,
  type GoalItem,
  type MilestoneStatusItem,
} from "../lib/goalStore";

type Props = {
  activeVisionId: string | null;
  onBack: () => void;

};

function pct(n: number, d: number) {
  if (d <= 0) return 0;
  return Math.max(0, Math.min(1, n / d));
}

function msParts(i: 0 | 1 | 2, ms: any[]) {
  const m = ms?.[i];
  const label = `M${i + 1}`;
  if (!m) return { label, due: "", text: "(no milestone)" };

  const due = String(m.date || m.due || m.deadline || "");
  const text = String(m.text || m.title || "");
  return { label, due, text };
}

export default function GoalsPage({ activeVisionId, onBack }: Props) {
  // --- Vision ---
  const vision = useMemo(() => {
    if (!activeVisionId) return null;
    return getVisionById(activeVisionId);
  }, [activeVisionId]);

  const visionVM = useMemo(() => {
    if (!vision) return null;
    return toVisionVM(vision as any);
  }, [vision]);

  const milestones = useMemo(() => visionVM?.milestones || [], [visionVM]);

  // --- store refresh tick ---
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onChanged = () => setTick((x) => x + 1);
    window.addEventListener(GOALS_CHANGED_EVENT, onChanged as any);
    return () => window.removeEventListener(GOALS_CHANGED_EVENT, onChanged as any);
  }, []);

  const goals = useMemo(() => {
    if (!activeVisionId) return [];
    void tick;
    return readGoalsByVision(activeVisionId);
  }, [activeVisionId, tick]);

  const milestoneStatus = useMemo(() => {
    if (!activeVisionId) return [];
    void tick;
    return readMilestoneStatusByVision(activeVisionId);
  }, [activeVisionId, tick]);

  function getMilestoneDone(mi: 0 | 1 | 2): MilestoneStatusItem | undefined {
    return milestoneStatus.find((x) => x.milestoneIndex === mi);
  }

  const goalsByM = useMemo(() => {
    const g0: GoalItem[] = [];
    const g1: GoalItem[] = [];
    const g2: GoalItem[] = [];
    goals.forEach((g) => {
      if (g.milestoneIndex === 0) g0.push(g);
      else if (g.milestoneIndex === 1) g1.push(g);
      else g2.push(g);
    });
    return [g0, g1, g2] as const;
  }, [goals]);

  // --- drafts ---
  const [draft0, setDraft0] = useState("");
  const [draft1, setDraft1] = useState("");
  const [draft2, setDraft2] = useState("");

  function onAdd(i: 0 | 1 | 2) {
    if (!activeVisionId) return;
    const title = (i === 0 ? draft0 : i === 1 ? draft1 : draft2).trim();
    if (!title) return;
    addGoal({ visionId: activeVisionId, milestoneIndex: i, title });
    if (i === 0) setDraft0("");
    if (i === 1) setDraft1("");
    if (i === 2) setDraft2("");
  }

  // --- UI state: per milestone paging ---
  const DEFAULT_TODO_SHOW = 3;
  const PAGE_STEP = 5;

  const [todoShow, setTodoShow] = useState<[number, number, number]>([
    DEFAULT_TODO_SHOW,
    DEFAULT_TODO_SHOW,
    DEFAULT_TODO_SHOW,
  ]);
  const [showDone, setShowDone] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [doneShow, setDoneShow] = useState<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    setTodoShow([DEFAULT_TODO_SHOW, DEFAULT_TODO_SHOW, DEFAULT_TODO_SHOW]);
    setShowDone([false, false, false]);
    setDoneShow([0, 0, 0]);
    setDraft0("");
    setDraft1("");
    setDraft2("");
  }, [activeVisionId]);

  // ====== Empty states ======
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
                <div className="fx-title">Goals</div>
              </div>
            </div>
            <button className="fx-btn fx-btnGhost" onClick={onBack} type="button">
              ← Back
            </button>
          </div>

          <div className="fx-card fx-main" style={{ padding: 18 }}>
            <div className="fx-h2">No Active Vision</div>
            <div className="fx-sub" style={{ marginTop: 6 }}>
              先在 Dashboard 里选一个 Vision，并设为 Active。
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button className="fx-btn fx-btnPrimary" type="button" onClick={onBack}>
                Go to Dashboard →
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
                <div className="fx-title">Goals</div>
              </div>
            </div>
            <button className="fx-btn fx-btnGhost" onClick={onBack} type="button">
              ← Back
            </button>
          </div>

          <div className="fx-card fx-main" style={{ padding: 18 }}>
            <div className="fx-h2">Active Vision Not Found</div>
            <div className="fx-sub" style={{ marginTop: 6 }}>
              当前 Active Vision 可能已被删除。回到 Dashboard 重新设置即可。
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button className="fx-btn fx-btnPrimary" type="button" onClick={onBack}>
                Go to Dashboard →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====== UI helpers (inline only) ======
  const accentByIndex: Record<0 | 1 | 2, string> = {
    0: "rgba(149,120,255,0.95)",
    1: "rgba(79,195,247,0.92)",
    2: "rgba(129,199,132,0.92)",
  };

  const cardAccent = (accent: string) => ({
    padding: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.045)",
    boxShadow: `inset 3px 0 0 ${accent}`,
  });

  const chip = (text: string) => (
    <span
      style={{
        fontSize: 12,
        padding: "2px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.04)",
        color: "rgba(255,255,255,0.75)",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );

  const sectionTitle = (title: string, hint?: string) => (
    <div style={{ display: "grid", gap: 4 }}>
      <div className="fx-h3" style={{ margin: 0, fontSize: 14, fontWeight: 760 }}>
        {title}
      </div>
      {hint ? (
        <div className="fx-muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
          {hint}
        </div>
      ) : null}
    </div>
  );

  // ====== UI ======
  return (
    <div className="fx-app">
      <div className="fx-bg" />
      <div className="fx-container">
        <div className="fx-topbar">
          <div className="fx-brand">
            <div className="fx-brandMark" />
            <div className="fx-brandText">
              <div className="fx-kicker">FleinX2026</div>
              <div className="fx-title">Goals</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
          
            <button className="fx-btn fx-btnGhost" onClick={onBack} type="button">
              ← Back
            </button>
          </div>
        </div>

        <div className="fx-card fx-main" style={{ padding: 18 }}>
          {/* Header */}
          <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
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
              }}
            >
              {`【${(vision as any).title}】`}
            </div>

            <div className="fx-muted" style={{ fontSize: 12 }}>
              你的目标，是否已经被拆解到今天可以行动的一步。
            </div>
          </div>

          {/* Milestones */}
          <div style={{ display: "grid", gap: 12 }}>
            {[0, 1, 2].map((rawIdx) => {
              const idx = rawIdx as 0 | 1 | 2;

              const ms = msParts(idx, milestones);
              const accent = accentByIndex[idx];

              const list = goalsByM[idx];

              // 全量稳定顺序：createdAt 升序
              const allSorted = [...list].sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              );

              // id -> seq（稳定编号：Done 不影响，Delete 才重排）
              const seqMap = new Map<string, string>();
              allSorted.forEach((g, i) => {
                seqMap.set(g.id, `${ms.label}-${i + 1}`);
              });

              const todo = allSorted.filter((g) => g.status !== "done");
              const done = allSorted.filter((g) => g.status === "done");

              const doneCount = done.length;
              const totalCount = allSorted.length;
              const ratio = pct(doneCount, totalCount);

              const msDone = getMilestoneDone(idx);
              const isMilestoneDone = msDone?.status === "done";

              const draft = idx === 0 ? draft0 : idx === 1 ? draft1 : draft2;
              const setDraft = idx === 0 ? setDraft0 : idx === 1 ? setDraft1 : setDraft2;

              const showTodoN = todoShow[idx];
              const visibleTodo = todo.slice(0, showTodoN);

              const isShowDone = showDone[idx];
              const showDoneN = doneShow[idx];
              const visibleDone = done.slice(0, showDoneN);

              return (
                <div key={idx} className="fx-card" style={cardAccent(accent)}>
                  {/* Milestone title */}
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", lineHeight: 1.15 }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 900,
                            letterSpacing: 0.6,
                            color: "rgba(255,255,255,0.92)",
                            padding: "4px 10px",
                            borderRadius: 999,
                            background: `linear-gradient(90deg, ${accent}, rgba(255,255,255,0.08))`,
                            boxShadow: "0 10px 26px rgba(0,0,0,0.35)",
                            border: "1px solid rgba(255,255,255,0.14)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ms.label}
                        </span>

                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 850,
                            color: "rgba(255,255,255,0.92)",
                            textShadow: "0 12px 30px rgba(0,0,0,0.40)",
                            wordBreak: "break-word",
                          }}
                        >
                          {ms.text || "(no milestone)"}
                        </span>
                      </div>

                      {ms.due ? (
                        <div className="fx-muted" style={{ marginTop: 6, fontSize: 12 }}>
                          Date · {ms.due}
                        </div>
                      ) : null}

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                        {chip(`Open ${todo.length}`)}
                        {chip(`Done ${doneCount}`)}
                        {chip(`Total ${totalCount}`)}
                        {isMilestoneDone ? chip("Milestone Done") : null}
                      </div>

                      {/* progress */}
 {/* progress */}
<div style={{ marginTop: 10 }}>
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div
      style={{
        flex: 1,
        height: 8,
        borderRadius: 999,
        background: "rgba(255,255,255,0.07)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.round(ratio * 100)}%`,
          background: "rgba(255,255,255,0.42)",
        }}
      />
    </div>

    <div
      className="fx-muted"
      style={{
        fontSize: 12,
        whiteSpace: "nowrap",
        minWidth: 60,
        textAlign: "right",
      }}
    >
      {Math.round(ratio * 100)}% done
    </div>
  </div>

                 </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <button
                        className="fx-btn fx-btnGhost"
                        type="button"
                        onClick={() =>
                          setMilestoneDone({
                            visionId: activeVisionId,
                            milestoneIndex: idx,
                            done: !isMilestoneDone,
                          })
                        }
                      >
                        {isMilestoneDone ? "Reopen Milestone" : "Mark Milestone Done"}
                      </button>
                    </div>
                  </div>

                  {/* Add area */}
                  <div style={{ marginTop: 14 }}>
                    {sectionTitle("Add a Goal")}
                    <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                      <input
                        className="fx-input"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="例如：完成登录页交互 / 写完复盘模板 / 约一次关键沟通"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") onAdd(idx);
                        }}
                        style={{ flex: 1 }}
                      />
                      <button className="fx-btn fx-btnPrimary" type="button" onClick={() => onAdd(idx)}>
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Open */}
                  <div style={{ marginTop: 14 }}>
                    <div className="fx-h3" style={{ fontSize: 13, marginBottom: 8 }}>
                      Open{" "}
                      <span className="fx-muted" style={{ marginLeft: 8, fontSize: 12 }}>
                        (Top {DEFAULT_TODO_SHOW})
                      </span>
                    </div>

                    <div style={{ display: "grid", gap: 10 }}>
                      {visibleTodo.length ? (
                        visibleTodo.map((g) => (
                          <div
                            key={g.id}
                            className="fx-typeCard"
                            style={{
                              padding: 12,
                              background: "rgba(255,255,255,0.035)",
                              border: "1px solid rgba(255,255,255,0.10)",
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 10,
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <div className="fx-body" style={{ whiteSpace: "pre-wrap" }}>
                                <span style={{ marginRight: 10, opacity: 0.65, fontWeight: 700 }}>
                                  {seqMap.get(g.id)}
                                </span>
                                {g.title}
                              </div>
                              <div className="fx-muted" style={{ marginTop: 6, fontSize: 12 }}>
                                {new Date(g.createdAt).toLocaleString()}
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <button className="fx-btn fx-btnGhost" type="button" onClick={() => toggleGoalDone(g.id)}>
                                Done
                              </button>
                              <button className="fx-btn fx-btnGhost" type="button" onClick={() => deleteGoal(g.id)}>
                                Delete
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="fx-empty">
                          <div className="fx-body">No open goals</div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                      {todo.length > showTodoN ? (
                        <button
                          className="fx-btn fx-btnGhost"
                          type="button"
                          onClick={() =>
                            setTodoShow((prev) => {
                              const next = [...prev] as [number, number, number];
                              next[idx] = Math.min(todo.length, prev[idx] + PAGE_STEP);
                              return next;
                            })
                          }
                        >
                          Show more (+{PAGE_STEP})
                        </button>
                      ) : null}

                      {showTodoN > DEFAULT_TODO_SHOW ? (
                        <button
                          className="fx-btn fx-btnGhost"
                          type="button"
                          onClick={() =>
                            setTodoShow((prev) => {
                              const next = [...prev] as [number, number, number];
                              next[idx] = DEFAULT_TODO_SHOW;
                              return next;
                            })
                          }
                        >
                          Collapse
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Completed */}
                  <div style={{ marginTop: 14 }}>
                    <button
                      className="fx-btn fx-btnGhost"
                      type="button"
                      onClick={() =>
                        setShowDone((prev) => {
                          const next = [...prev] as [boolean, boolean, boolean];
                          next[idx] = !prev[idx];
                          return next;
                        })
                      }
                    >
                      {isShowDone ? "Hide Completed" : `Show Completed (${done.length})`}
                    </button>

                    {isShowDone ? (
                      <div style={{ marginTop: 12 }}>
                        <div className="fx-h3" style={{ fontSize: 13, marginBottom: 8 }}>
                          Completed
                        </div>

                        <div style={{ display: "grid", gap: 10 }}>
                          {visibleDone.length ? (
                            visibleDone.map((g) => (
                              <div
                                key={g.id}
                                className="fx-typeCard"
                                style={{
                                  padding: 12,
                                  background: "rgba(255,255,255,0.03)",
                                  border: "1px solid rgba(255,255,255,0.10)",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: 10,
                                }}
                              >
                                <div style={{ minWidth: 0 }}>
                                  <div className="fx-body" style={{ whiteSpace: "pre-wrap", opacity: 0.7 }}>
                                    <span style={{ marginRight: 10, opacity: 0.65, fontWeight: 700 }}>
                                      {seqMap.get(g.id)}
                                    </span>
                                    {g.title}
                                  </div>
                                  <div className="fx-muted" style={{ marginTop: 6, fontSize: 12 }}>
                                    {g.doneAt ? new Date(g.doneAt).toLocaleString() : ""}
                                  </div>
                                </div>

                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                  <button className="fx-btn fx-btnGhost" type="button" onClick={() => toggleGoalDone(g.id)}>
                                    Undo
                                  </button>
                                  <button className="fx-btn fx-btnGhost" type="button" onClick={() => deleteGoal(g.id)}>
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="fx-empty">
                              <div className="fx-body">No completed goals</div>
                            </div>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                          {done.length > showDoneN ? (
                            <button
                              className="fx-btn fx-btnGhost"
                              type="button"
                              onClick={() =>
                                setDoneShow((prev) => {
                                  const next = [...prev] as [number, number, number];
                                  const base = prev[idx] > 0 ? prev[idx] : PAGE_STEP;
                                  next[idx] = Math.min(done.length, base + PAGE_STEP);
                                  return next;
                                })
                              }
                            >
                              Show more (+{PAGE_STEP})
                            </button>
                          ) : null}

                          {showDoneN > 0 ? (
                            <button
                              className="fx-btn fx-btnGhost"
                              type="button"
                              onClick={() =>
                                setDoneShow((prev) => {
                                  const next = [...prev] as [number, number, number];
                                  next[idx] = 0;
                                  return next;
                                })
                              }
                            >
                              Collapse Completed
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}