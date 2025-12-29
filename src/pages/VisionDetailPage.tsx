// src/pages/VisionDetailPage.tsx
import { useEffect, useMemo, useState } from "react";
import { getVisionById, upsertVision, type VisionRecord } from "../lib/visionStore";
import { sumMinutesByVision } from "../lib/timeStore";
import { toVisionVM } from "../domain/vision";

type Props = {
  id: string;
  onBack: () => void;
  onSetActive: (id: string) => void;
};

function rhythmLabel(r: string) {
  if (r === "steady") return "稳步 steady";
  if (r === "sprint") return "冲刺 sprint";
  if (r === "explore") return "探索 explore";
  return r || "-";
}

function preferenceLabel(p: string) {
  if (p === "weekdayNight") return "工作日晚上";
  if (p === "weekendMorning") return "周末上午";
  if (p === "flexible") return "灵活安排";
  return p || "-";
}

function formatMins(mins: number) {
  const m = Math.max(0, Math.floor(mins || 0));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h <= 0) return `${m} min`;
  if (r === 0) return `${h}h`;
  return `${h}h ${r}m`;
}

export default function VisionDetailPage({ id, onBack, onSetActive }: Props) {
  const base = useMemo(() => getVisionById(id), [id]);
  const v = useMemo(() => (base ? toVisionVM(base as any) : null), [base]);

  // ---- Edit state（仍然只做 Step3 + title + deadline）----
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [northStar, setNorthStar] = useState("");
  const [metric, setMetric] = useState("");
  const [why, setWhy] = useState("");

  const [dirty, setDirty] = useState(false);
  const [savedHint, setSavedHint] = useState<string>("");

  useEffect(() => {
    if (!base) return;
    setTitle(base.title || "");
    setDeadline(base.step3?.deadline || "");
    setNorthStar(base.step3?.northStar || "");
    setMetric(base.step3?.metric || "");
    setWhy(base.step3?.why || "");
    setDirty(false);
    setSavedHint("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, !!base]);

  function markDirty() {
    if (!dirty) setDirty(true);
    if (savedHint) setSavedHint("");
  }

  function onSave() {
    if (!base) return;

    const next: VisionRecord = {
      ...base,
      title: title || "",
      step3: {
        ...(base.step3 || { northStar: "", metric: "", deadline: "" }),
        northStar: northStar || "",
        metric: metric || "",
        why: why || "",
        deadline: deadline || "",
      },
    };

    upsertVision(next);

    setDirty(false);
    setSavedHint("Saved ✓");
    window.setTimeout(() => setSavedHint(""), 1200);
  }

  function onReset() {
    if (!base) return;
    setTitle(base.title || "");
    setDeadline(base.step3?.deadline || "");
    setNorthStar(base.step3?.northStar || "");
    setMetric(base.step3?.metric || "");
    setWhy(base.step3?.why || "");
    setDirty(false);
    setSavedHint("");
  }

  if (!base || !v) {
    return (
      <div className="fx-app">
        <div className="fx-bg" />
        <div className="fx-container">
          <div className="fx-topbar">
            <div className="fx-brand">
              <div className="fx-brandMark" />
              <div className="fx-brandText">
                <div className="fx-kicker">FleinX2026</div>
                <div className="fx-title">Vision Detail</div>
              </div>
            </div>

            <button className="fx-btn fx-btnGhost" onClick={onBack} type="button">
              ← Back
            </button>
          </div>

          <div className="fx-card fx-main" style={{ padding: 18 }}>
            <div className="fx-h2">Not Found</div>
            <div className="fx-sub">这个 Vision 可能被删除了，或 id 不存在。</div>
          </div>
        </div>
      </div>
    );
  }

  const totalMins = sumMinutesByVision(id);

  // ========= UI helpers (inline, minimal file change) =========
  const sectionCard = (accent: string) => ({
    padding: 16,
    border: `1px solid rgba(255,255,255,0.12)`,
    boxShadow: `inset 3px 0 0 ${accent}`,
    background: "rgba(255,255,255,0.045)",
  });

  const sectionHeader = (titleText: string, pill?: string, right?: string) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 12,
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
        <div className="fx-h2" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
          {titleText}
        </div>
        {pill ? (
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
            {pill}
          </span>
        ) : null}
      </div>

      {right ? (
        <div className="fx-muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
          {right}
        </div>
      ) : null}
    </div>
  );

  const miniPill = (text: string, tint: string) => (
    <span
      style={{
        display: "inline-block",
        fontSize: 12,
        padding: "2px 10px",
        borderRadius: 999,
        background: tint,
        border: "1px solid rgba(255,255,255,0.12)",
        color: "rgba(255,255,255,0.85)",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );

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
              <div className="fx-title">Vision Detail</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {savedHint ? <span className="fx-muted">{savedHint}</span> : null}

            <button className="fx-btn fx-btnGhost" type="button" onClick={() => onSetActive(id)}>
              Set Active
            </button>

            <button className="fx-btn fx-btnGhost" type="button" onClick={onBack}>
              ← Back
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="fx-card fx-wizardCard">
          {/* Header (clean) */}
          <div style={{ padding: 18, paddingBottom: 0 }}>
            <div className="fx-h1" style={{ fontSize: 22, fontWeight: 750 }}>
              Your 2026 Map
            </div>
            <div className="fx-sub" style={{ marginTop: 6 }}>
              今天只打磨核心一页，让愿景更清晰、更可执行。
            </div>
          </div>

          {/* Summary Header */}
          <div className="fx-card" style={{ padding: 16, marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
              <div style={{ minWidth: 0 }}>
                <div className="fx-muted">Vision Type</div>
                <div className="fx-h2" style={{ marginTop: 6, wordBreak: "break-word" }}>
                  {v.typeLabel}
                </div>
              </div>

              <div style={{ textAlign: "right", minWidth: 240 }}>
                <div className="fx-muted">Due</div>
                <input
                  className="fx-input"
                  type="text"
                  placeholder="e.g. 2026-12-31 / Q3 / Dec"
                  value={deadline}
                  onChange={(e) => {
                    setDeadline(e.target.value);
                    markDirty();
                  }}
                  style={{ marginTop: 8 }}
                />
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="fx-muted">Vision Title</div>
              <input
                className="fx-input"
                type="text"
                placeholder="给这个 Vision 一个清晰标题"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  markDirty();
                }}
                style={{ marginTop: 8 }}
              />
            </div>

            {/* Save bar */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
              <button className="fx-btn fx-btnGhost" type="button" onClick={onReset} disabled={!dirty}>
                Reset
              </button>
              <button
                className={`fx-btn fx-btnPrimary ${dirty ? "" : "is-disabled"}`}
                type="button"
                onClick={onSave}
                disabled={!dirty}
              >
                Save
              </button>
            </div>
          </div>

          {/* 2-column layout */}
          <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 12, marginTop: 12, padding: 12 }}>
            {/* Left */}
            <div style={{ display: "grid", gap: 12 }}>
              {/* Vision Core (Editable) */}
              <div className="fx-card" style={sectionCard("rgba(149,120,255,0.95)")}>
                {sectionHeader("Vision Core", "Edit")}

                {/* NorthStar */}
                <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {miniPill("NorthStar", "rgba(149,120,255,0.18)")}
                    <div className="fx-muted">核心结果</div>
                  </div>
                  <textarea
                    className="fx-textarea"
                    placeholder="写清楚：你要达到的“最终结果”是什么？"
                    value={northStar}
                    onChange={(e) => {
                      setNorthStar(e.target.value);
                      markDirty();
                    }}
                    style={{ minHeight: 110 }}
                  />
                </div>

                {/* Metric */}
                <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {miniPill("Metric", "rgba(79,195,247,0.16)")}
                    <div className="fx-muted">验收指标</div>
                  </div>
                  <textarea
                    className="fx-textarea"
                    placeholder="写清楚：用什么指标判断你做成了？"
                    value={metric}
                    onChange={(e) => {
                      setMetric(e.target.value);
                      markDirty();
                    }}
                    style={{ minHeight: 90 }}
                  />
                </div>

                {/* Why */}
                <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {miniPill("Why", "rgba(129,199,132,0.16)")}
                    <div className="fx-muted">动机</div>
                  </div>
                  <textarea
                    className="fx-textarea"
                    placeholder="选填：为什么你在意这个？"
                    value={why}
                    onChange={(e) => {
                      setWhy(e.target.value);
                      markDirty();
                    }}
                    style={{ minHeight: 90 }}
                  />
                </div>
              </div>

              {/* Milestones（只读） */}
              <div className="fx-card" style={sectionCard("rgba(79,195,247,0.85)")}>
                {sectionHeader("Milestones", "3 steps")}

                <div style={{ display: "grid", gap: 10 }}>
                  {v.milestones.length ? (
                    v.milestones.map((m, idx) => (
                      <div
                        key={`${m.date}-${idx}`}
                        className="fx-typeCard"
                        style={{
                          padding: 12,
                          background: "rgba(255,255,255,0.035)",
                          border: "1px solid rgba(255,255,255,0.10)",
                          display: "grid",
                          gridTemplateColumns: "170px 1fr",
                          gap: 12,
                          alignItems: "start",
                        }}
                      >
                        <div className="fx-muted" style={{ whiteSpace: "nowrap" }}>
                          M{idx + 1} · {m.date || "-"}
                        </div>
                        <div className="fx-body" style={{ whiteSpace: "pre-wrap" }}>
                          {m.text || "-"}
                        </div>
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

            {/* Right */}
            <div style={{ display: "grid", gap: 12 }}>
              {/* Time Summary */}
              <div className="fx-card" style={sectionCard("rgba(129,199,132,0.85)")}>
                {sectionHeader("Time Summary", "Total", formatMins(totalMins))}

                <div
                  className="fx-typeCard"
                  style={{
                    marginTop: 4,
                    padding: 12,
                    background: "rgba(255,255,255,0.035)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <div className="fx-muted">Total Time</div>
                  <div className="fx-h2" style={{ marginTop: 6 }}>
                    {formatMins(totalMins)}
                  </div>
                </div>

                <div className="fx-sub" style={{ marginTop: 10 }}>
                  你的一点点投入，会慢慢变成复利。
                </div>
              </div>

              {/* Weekly Commitment（只读） */}
              <div className="fx-card" style={sectionCard("rgba(149,120,255,0.75)")}>
                {sectionHeader("Weekly Commitment", "Plan")}

                <div
                  className="fx-typeCard"
                  style={{
                    padding: 12,
                    background: "rgba(255,255,255,0.035)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <div className="fx-muted">Hours / week</div>
                  <div className="fx-h2" style={{ marginTop: 6 }}>
                    {v.plan.hoursPerWeek ?? 0}
                  </div>
                </div>

                <div
                  className="fx-typeCard"
                  style={{
                    marginTop: 10,
                    padding: 12,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <div className="fx-muted">Rhythm</div>
                  <div className="fx-body" style={{ marginTop: 6 }}>
                    {rhythmLabel(v.plan.rhythm)}
                  </div>
                </div>

                <div
                  className="fx-typeCard"
                  style={{
                    marginTop: 10,
                    padding: 12,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <div className="fx-muted">Preference</div>
                  <div className="fx-body" style={{ marginTop: 6 }}>
                    {preferenceLabel(v.plan.preference)}
                  </div>
                </div>

                <div className="fx-sub" style={{ marginTop: 10 }}>
                  给自己一个现实的节奏，然后持续发生。
                </div>
              </div>

              {/* Risks（只读） */}
              <div className="fx-card" style={sectionCard("rgba(255,152,0,0.80)")}>
                {sectionHeader("Risks & Responses", "Pre-mortem")}

                <div style={{ display: "grid", gap: 10 }}>
                  {v.risks.length ? (
                    v.risks.map((r, idx) => (
                      <div
                        key={idx}
                        className="fx-typeCard"
                        style={{
                          padding: 12,
                          background: "rgba(255,255,255,0.035)",
                          border: "1px solid rgba(255,255,255,0.10)",
                          display: "grid",
                          gap: 10,
                        }}
                      >
                        <div className="fx-muted" style={{ fontSize: 12 }}>
                          R{idx + 1}
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1.1fr 0.9fr", // 55/45
                            gap: 12,
                          }}
                        >
                          <div style={{ display: "grid", gap: 8 }}>
                            <div>{miniPill("Risk", "rgba(255,152,0,0.16)")}</div>
                            <div className="fx-body" style={{ whiteSpace: "pre-wrap" }}>
                              {r.risk || "-"}
                            </div>
                          </div>

                          <div style={{ display: "grid", gap: 8 }}>
                            <div>{miniPill("Response", "rgba(129,199,132,0.14)")}</div>
                            <div className="fx-body" style={{ whiteSpace: "pre-wrap" }}>
                              {r.plan || "-"}
                            </div>
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

                <div className="fx-sub" style={{ marginTop: 10 }}>
                  提前想清楚“会卡在哪”，就更容易持续走下去。
                </div>
              </div>
            </div>
          </div>

          {/* Footer note removed (per your request) */}
          <div style={{ height: 10 }} />
        </div>
      </div>
    </div>
  );
}