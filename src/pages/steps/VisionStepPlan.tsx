import { useMemo } from "react";

export type PlanRhythm = "steady" | "sprint" | "explore";
export type TimePreference = "weekdayNight" | "weekendMorning" | "flexible";

export type WeeklyPlan = {
  hoursPerWeek: number;
  rhythm: PlanRhythm;
  preference: TimePreference;
};

type Props = {
  title: string;
  plan: WeeklyPlan;
  onChange: (next: WeeklyPlan) => void;
  onBack: () => void;
  onNext: () => void;
};

export default function VisionStepPlan({ title, plan, onChange, onBack, onNext }: Props) {
  const canNext = useMemo(() => plan.hoursPerWeek > 0, [plan.hoursPerWeek]);

  const set = (patch: Partial<WeeklyPlan>) => onChange({ ...plan, ...patch });

  return (
    <div className="fx-app">
      <div className="fx-bg" />
      <div className="fx-container">
        <div className="fx-topbar">
          <div className="fx-brand">
            <div className="fx-brandMark" />
            <div className="fx-brandText">
              <div className="fx-kicker">FleinX2026</div>
              <div className="fx-title">Vision Wizard</div>
            </div>
          </div>

          <button className="fx-btn fx-btnGhost" onClick={onBack}>
            ← Back
          </button>
        </div>

        <div className="fx-card fx-wizardCard">
          <div className="fx-wizardHeader">
            <div className="fx-step">Step 5 / 7</div>
            <div className="fx-h1">Weekly Commitment</div>
            <div className="fx-sub">为愿景「{title}」设定最低投入与节奏，用来驱动 TimeBlocks。</div>
          </div>

          <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
            <div>
              <div className="fx-muted" style={{ marginBottom: 8 }}>
                每周最低投入（小时/周）
              </div>
              <input
                className="fx-input"
                value={String(plan.hoursPerWeek)}
                placeholder="例如：5"
                onChange={(e) => set({ hoursPerWeek: Math.max(0, Number(e.target.value || 0)) })}
              />
            </div>

            <div>
              <div className="fx-muted" style={{ marginBottom: 8 }}>
                节奏风格
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[
                  { k: "steady" as const, label: "稳步 steady" },
                  { k: "sprint" as const, label: "冲刺 sprint" },
                  { k: "explore" as const, label: "探索 explore" },
                ].map((x) => (
                  <button
                    key={x.k}
                    type="button"
                    className={`fx-typeCard ${plan.rhythm === x.k ? "is-active" : ""}`}
                    onClick={() => set({ rhythm: x.k })}
                  >
                    <div className="fx-typeDesc">{x.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="fx-muted" style={{ marginBottom: 8 }}>
                你更喜欢把时间放在哪个段？
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[
                  { k: "weekdayNight" as const, label: "工作日晚上" },
                  { k: "weekendMorning" as const, label: "周末上午" },
                  { k: "flexible" as const, label: "灵活安排" },
                ].map((x) => (
                  <button
                    key={x.k}
                    type="button"
                    className={`fx-typeCard ${plan.preference === x.k ? "is-active" : ""}`}
                    onClick={() => set({ preference: x.k })}
                  >
                    <div className="fx-typeDesc">{x.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="fx-wizardFooter" style={{ marginTop: 14 }}>
            <div className="fx-muted">Next：我们写风险与对策（Step 6）。</div>
            <button
              className={`fx-btn fx-btnPrimary ${canNext ? "" : "is-disabled"}`}
              disabled={!canNext}
              onClick={onNext}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}