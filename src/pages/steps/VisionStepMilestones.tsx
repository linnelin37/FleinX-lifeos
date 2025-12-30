// src/pages/steps/VisionStepMilestones.tsx
import { useMemo } from "react";

export type VisionType = "learning" | "work" | "life" | "project";

export type Milestone = { date: string; text: string };

const STEP4_MILESTONE_PLACEHOLDER: Record<VisionType, string[]> = {
  learning: [
    "完成一次英文汇报",
    "完成核心能力验证",
    "完成真实场景练习",
  ],
  work: [
    "完成关键事项对齐",
    "完成阶段目标交付",
    "产出可验证的结果",
  ],
  life: [
    "保持稳定运动节律",
    "建立规律的作息习惯",
    "感知生活状态变化",
  ],
  project: [
    "完成MVP版本开发",
    "完成一次关键迭代",
    "获得外部用户反馈",
  ],
};

type Props = {
  title: string;
  visionType: VisionType;
  milestones: Milestone[];
  onChange: (next: Milestone[]) => void;
  onBack: () => void;
  onNext: () => void;
};

export default function VisionStepMilestones({
  title,
  visionType,
  milestones,
  onChange,
  onBack,
  onNext,
}: Props) {
  const canNext = useMemo(() => {
    return milestones.length === 3 && milestones.every((m) => m.date.trim() && m.text.trim());
  }, [milestones]);

  const hints = STEP4_MILESTONE_PLACEHOLDER[visionType] || [];

  const updateAt = (idx: number, patch: Partial<Milestone>) => {
    const next = milestones.map((m, i) => (i === idx ? { ...m, ...patch } : m));
    onChange(next);
  };

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

          <button className="fx-btn fx-btnGhost" onClick={onBack} type="button">
            ← Back
          </button>
        </div>

        <div className="fx-card fx-wizardCard">
          <div className="fx-wizardHeader">
            <div className="fx-step">Step 4 / 7</div>
            <div className="fx-h1">Milestones</div>
            <div className="fx-sub">把愿景「{title}」拆成 3 个阶段性结果。</div>
          </div>

          <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
            {milestones.map((m, idx) => (
              <div key={`${m.date}-${idx}`} style={{ display: "grid", gap: 8 }}>
                <div className="fx-muted">M{idx + 1}：阶段里程碑</div>

                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10 }}>
                  <input
                    className="fx-input"
                    value={m.date}
                    placeholder="YYYY-MM-DD"
                    onChange={(e) => updateAt(idx, { date: e.target.value })}
                  />

                  <input
                    className="fx-input"
                    value={m.text}
                    placeholder={hints[idx] || "写一句可被确认的阶段结果"}
                    onChange={(e) => updateAt(idx, { text: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="fx-wizardFooter" style={{ marginTop: 14 }}>
            <div className="fx-muted">Next：我们定义每周投入与节奏（Step 5）。</div>

            <button
              className={`fx-btn fx-btnPrimary ${canNext ? "" : "is-disabled"}`}
              disabled={!canNext}
              onClick={onNext}
              type="button"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}