// src/pages/steps/VisionStepMilestones.tsx
import { useMemo } from "react";

export type VisionType = "learning" | "work" | "life" | "project";

export type Milestone = { date: string; text: string };

const STEP4_MILESTONE_PLACEHOLDER: Record<VisionType, string[]> = {
  learning: [
    "例如：完成 1 次真实场景英文汇报（可录音/可复述）",
    "例如：能在会议中连续表达 10 分钟并回答问题",
    "例如：通过一次测评或完成关键场景练习",
  ],
  work: [
    "例如：完成项目立项/对齐关键人（需求与目标确认）",
    "例如：完成阶段性交付（上线/交付/复盘）",
    "例如：产出可验证结果（效率/成本/收入/风险下降）",
  ],
  life: [
    "例如：连续 8 周保持每周 3 次运动",
    "例如：睡眠节律更稳定（入睡/起床时间更可控）",
    "例如：生活质量出现可感知变化（精力/情绪/关系）",
  ],
  project: [
    "例如：完成 MVP 并开始自用（你是第 1 用户）",
    "例如：完成一次关键迭代（解决一个真实痛点）",
    "例如：获得外部反馈或用户（3-10 个也算）",
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

                <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 10 }}>
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