// /Users/linne/Projects/FleinX2026/src/pages/steps/VisionStepReview.tsx
import { useMemo } from "react";
import type { Milestone } from "./VisionStepMilestones";
import type { WeeklyPlan } from "./VisionStepPlan";
import type { RiskItem } from "./VisionStepRisks";

type Props = {
  typeLabel: string;
  title: string;
  northStar: string;
  metric: string;
  why: string;
  deadline: string;

  milestones: Milestone[];
  plan: WeeklyPlan;
  risks: RiskItem[];

  onBack: () => void;
  onSave: () => void;
};

export default function VisionStepReview(props: Props) {
  const canSave = useMemo(() => {
    return (
      props.title.trim().length > 0 &&
      props.northStar.trim().length > 0 &&
      props.metric.trim().length > 0 &&
      props.deadline.trim().length > 0 &&
      props.milestones.length === 3 &&
      props.milestones.every((m) => m.date.trim().length > 0 && m.text.trim().length > 0) &&
      typeof props.plan?.hoursPerWeek === "number" &&
      props.plan.hoursPerWeek > 0 &&
      props.risks.length > 0 &&
      props.risks.every((r) => r.risk.trim().length > 0 && r.plan.trim().length > 0)
    );
  }, [props]);

  const whyText = (props.why || "").trim();

  // UI helpers（不影响逻辑）
  const pillBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    lineHeight: 1,
    whiteSpace: "nowrap",
  };

  const tagBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.035)",
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    lineHeight: 1,
    whiteSpace: "nowrap",
  };

  const kvRow: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "110px 1fr",
    gap: 10,
    alignItems: "start",
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.035)",
  };

  const kLabel: React.CSSProperties = {
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    lineHeight: 1.2,
    marginTop: 2,
    whiteSpace: "nowrap",
  };

  const vText: React.CSSProperties = {
    color: "rgba(255,255,255,0.86)",
    fontSize: 13,
    lineHeight: 1.65,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  };

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
              <div className="fx-title">Vision Wizard</div>
            </div>
          </div>

          <button className="fx-btn fx-btnGhost" type="button" onClick={props.onBack}>
            ← Back
          </button>
        </div>

        <div className="fx-card fx-wizardCard">
          {/* Header */}
          <div className="fx-wizardHeader">
            <div className="fx-step">Step 7 / 7</div>
            <div className="fx-h1">Review & Save</div>
            <div className="fx-sub">最后确认一次：这是你要在 2026 推进的“事情”。</div>
          </div>

          {/* Summary Bar (title + meta pills + actions) */}
          <div className="fx-card" style={{ padding: 16, marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start" }}>
              <div style={{ minWidth: 0 }}>
                <div className="fx-h2" style={{ marginTop: 2, wordBreak: "break-word" }}>
                  {props.title || "-"}
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                  <span style={{ ...pillBase, borderColor: "rgba(79,195,247,0.25)", background: "rgba(79,195,247,0.08)" }}>
                    <span style={{ color: "rgba(255,255,255,0.62)" }}>Type</span>
                    <span style={{ color: "rgba(255,255,255,0.90)" }}>{props.typeLabel}</span>
                  </span>

                  <span style={{ ...pillBase, borderColor: "rgba(108,99,255,0.28)", background: "rgba(108,99,255,0.10)" }}>
                    <span style={{ color: "rgba(255,255,255,0.62)" }}>Deadline</span>
                    <span style={{ color: "rgba(255,255,255,0.90)" }}>{props.deadline || "-"}</span>
                  </span>

                
                </div>

                <div className="fx-muted" style={{ marginTop: 10 }}>
                  {canSave
                    ? "确认无误后保存。保存后可在 Home 看到并设为 Active Vision。"
                    : "还有内容未填写完整，补齐后即可保存。"}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, flex: "0 0 auto" }}>
                <button className="fx-btn fx-btnGhost" type="button" onClick={props.onBack}>
                  ← Edit
                </button>

                <button
                  className={`fx-btn fx-btnPrimary ${canSave ? "" : "is-disabled"}`}
                  type="button"
                  disabled={!canSave}
                  onClick={props.onSave}
                >
                  Save Vision →
                </button>
              </div>
            </div>
          </div>

          {/* 2-column layout (left wider) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.35fr 0.65fr",
              gap: 12,
              marginTop: 12,
            }}
          >
            {/* Left column */}
            <div style={{ display: "grid", gap: 12 }}>
              {/* Core (no big title text; use capsule) */}
              <div className="fx-card" style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ ...tagBase, borderColor: "rgba(108,99,255,0.22)", background: "rgba(108,99,255,0.10)" }}>
                    核心信息
                  </span>
                  <div className="fx-muted">清楚方向，后面所有行动都会更省力。</div>
                </div>

                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                  <div style={kvRow}>
                    <div style={kLabel}>明确结果：</div>
                    <div style={vText}>{props.northStar || "—"}</div>
                  </div>

                  <div style={kvRow}>
                    <div style={kLabel}>验收标准：</div>
                    <div style={vText}>{props.metric || "—"}</div>
                  </div>

                  {whyText ? (
                    <div style={kvRow}>
                      <div style={kLabel}>为什么重要？</div>
                      <div style={vText}>{whyText}</div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Milestones */}
              <div className="fx-card" style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ ...tagBase, borderColor: "rgba(255,152,0,0.24)", background: "rgba(255,152,0,0.10)" }}>
                    3段里程碑
                  </span>
                  <div className="fx-muted">把愿景拆成 3 个“可交付节点”，让进度自然发生。</div>
                </div>

                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                  {props.milestones?.length ? (
                    props.milestones.map((m, idx) => (
                      <div
                        key={`${m.date}-${idx}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "92px 1fr",
                          gap: 12,
                          padding: 12,
                          borderRadius: 14,
                          border: "1px solid rgba(255,255,255,0.10)",
                          background: "rgba(255,255,255,0.035)",
                          alignItems: "start",
                        }}
                      >
                        <div style={{ display: "grid", gap: 6 }}>
                          <span
                            style={{
                              ...tagBase,
                              width: "fit-content",
                              borderColor: "rgba(255,255,255,0.12)",
                              background: "rgba(255,255,255,0.04)",
                            }}
                          >
                            M{idx + 1}
                          </span>
                          <div className="fx-muted" style={{ whiteSpace: "nowrap" }}>
                            {m.date || "-"}
                          </div>
                        </div>

                        <div style={{ ...vText, marginTop: 1 }}>{m.text || "—"}</div>
                      </div>
                    ))
                  ) : (
                    <div className="fx-empty">
                      <div className="fx-h3">No milestones</div>
                      <div className="fx-body">建议至少填写 3 个阶段性结果。</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: "grid", gap: 12 }}>
              {/* Weekly */}
              <div className="fx-card" style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ ...tagBase, borderColor: "rgba(79,195,247,0.24)", background: "rgba(79,195,247,0.10)" }}>
                    Weekly Commitment
                  </span>
                  <div className="fx-muted">你愿意用多少“真实时间”推进它</div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 10,
                    marginTop: 12,
                  }}
                >
                  {/* 3 small stat pills */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(255,255,255,0.035)",
                      }}
                    >
                      <div className="fx-muted">Hours / week</div>
                      <div style={{ fontSize: 20, fontWeight: 740, color: "rgba(255,255,255,0.92)", marginTop: 6 }}>
                        {props.plan?.hoursPerWeek ?? 0}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: 12,
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(255,255,255,0.035)",
                      }}
                    >
                      <div className="fx-muted">work Rhythm</div>
                      <div className="fx-body" style={{ marginTop: 6 }}>
                        {props.plan?.rhythm || "-"}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: 12,
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(255,255,255,0.035)",
                      }}
                    >
                      <div className="fx-muted">Execution Preference</div>
                      <div className="fx-body" style={{ marginTop: 6 }}>
                        {props.plan?.preference || "-"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risks */}
              <div className="fx-card" style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ ...tagBase, borderColor: "rgba(255,87,87,0.22)", background: "rgba(255,87,87,0.08)" }}>
                    风险 & 对策
                  </span>
                  <div className="fx-muted">你预计会卡在哪，以及怎么提前处理</div>
                </div>

                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                  {props.risks?.length ? (
                    props.risks.map((r, idx) => (
                      <div
                        key={`${idx}-${r.risk}`}
                        style={{
                          padding: 12,
                          borderRadius: 14,
                          border: "1px solid rgba(255,255,255,0.10)",
                          background: "rgba(255,255,255,0.035)",
                          display: "grid",
                          gap: 10,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span
                            style={{
                              ...tagBase,
                              borderColor: "rgba(255,255,255,0.12)",
                              background: "rgba(255,255,255,0.04)",
                            }}
                          >
                            风险 {idx + 1}
                          </span>
                        </div>

                        <div style={{ display: "grid", gap: 8 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 10 }}>
                            <div style={kLabel}>Risk:</div>
                            <div style={vText}>{r.risk || "—"}</div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 10 }}>
                            <div style={kLabel}>Response:</div>
                            <div style={vText}>{r.plan || "—"}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="fx-empty">
                      <div className="fx-h3">No risks</div>
                      <div className="fx-body">建议至少写 1-2 个风险与对策。</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom hint (keep subtle) */}
          <div className="fx-muted" style={{ marginTop: 12 }}>
            保存后，回到 Home 你就能把它设为 Active Vision 并开始推进。
          </div>
        </div>
      </div>
    </div>
  );
}