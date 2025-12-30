// src/pages/VisionWizard.tsx
import { upsertVision } from "../lib/visionStore";
import { setActiveVisionId } from "../lib/prefStore";

import { useMemo, useState } from "react";

import VisionStepMilestones from "./steps/VisionStepMilestones";
import type { Milestone } from "./steps/VisionStepMilestones";

import VisionStepPlan from "./steps/VisionStepPlan";
import type { WeeklyPlan } from "./steps/VisionStepPlan";

import VisionStepRisks from "./steps/VisionStepRisks";
import type { RiskItem } from "./steps/VisionStepRisks";

import VisionStepReview from "./steps/VisionStepReview";

type VisionType = "learning" | "work" | "life" | "project";

type DraftVision = {
  type: VisionType | null;
  title: string;

  // Step 3
  northStar: string;
  why: string;
  metric: string;
  deadline: string;

  // Step 4
  milestones: Milestone[];

  // Step 5
  plan: WeeklyPlan;

  // Step 6
  risks: RiskItem[];
};

const TYPE_META: Record<VisionType, { titleZh: string; titleEn: string; desc: string; dot: string }> = {
  learning: { titleZh: "学习", titleEn: "Learning", desc: "技能提升、知识积累、证书路径", dot: "learning" },
  work: { titleZh: "工作", titleEn: "Work", desc: "职业发展、项目推进、收入增长", dot: "work" },
  life: { titleZh: "生活", titleEn: "Life", desc: "健康、关系、生活质量与内在秩序", dot: "life" },
  project: { titleZh: "项目", titleEn: "Project", desc: "创业、创作、产品与长期作品", dot: "project" },
};

// Step2：不同类型的标题示例（只影响 placeholder，不影响逻辑）
const STEP2_TITLE_PLACEHOLDER: Record<VisionType, string> = {
  learning: "英语可用于专业场景的清晰表达",
  work: "交付一个产生真实价值的关键项目",
  life: "形成稳定且可持续的高质量生活",
  project: "FleinX 可线上使用的成熟版本",
};

const STORAGE_KEY = "fx_vis_v1";

// （保留：即使暂时没直接用，也不动你现有逻辑结构）
function readVisions(): any[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
void readVisions;
function writeVisions(list: any[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
void writeVisions;

// 简单日期工具：从 YYYY-MM-DD 加减 N 个月（粗略版：用 JS Date 处理）
function addMonths(dateStr: string, deltaMonths: number) {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  d.setMonth(d.getMonth() + deltaMonths);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function VisionWizard() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);

  const [draft, setDraft] = useState<DraftVision>({
    type: null,
    title: "",
    northStar: "",
    why: "",
    metric: "",
    deadline: "2026-12-31",

    milestones: [
      { date: addMonths("2026-12-31", -9), text: "" },
      { date: addMonths("2026-12-31", -6), text: "" },
      { date: addMonths("2026-12-31", -3), text: "" },
    ],

    plan: { hoursPerWeek: 5, rhythm: "steady", preference: "flexible" },

    risks: [
      { risk: "", plan: "" },
      { risk: "", plan: "" },
    ],
  });

  const goBackToHome = () => {
    window.location.hash = "#/";
  };

  const canNextStep1 = useMemo(() => !!draft.type, [draft.type]);
  const canNextStep2 = useMemo(() => draft.title.trim().length > 0, [draft.title]);
  const canNextStep3 = useMemo(() => {
    return draft.northStar.trim().length > 0 && draft.metric.trim().length > 0 && draft.deadline.trim().length > 0;
  }, [draft.northStar, draft.metric, draft.deadline]);

  // --- Step 1 ---
  if (step === 1) {
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

            <button className="fx-btn fx-btnGhost" onClick={goBackToHome}>
              ← Back
            </button>
          </div>

          <div className="fx-card fx-wizardCard">
            <div className="fx-wizardHeader">
              <div className="fx-step">Step 1 / 7</div>
              <div className="fx-h1">What kind of Vision are you creating?</div>
              <div className="fx-sub">不同的愿景，会引导你走向不同的行动方式。</div>
            </div>

            <div className="fx-grid">
              {(Object.keys(TYPE_META) as VisionType[]).map((t) => {
                const meta = TYPE_META[t];
                const active = draft.type === t;

                return (
                  <button
                    key={t}
                    type="button"
                    className={`fx-typeCard ${active ? "is-active" : ""}`}
                    onClick={() => setDraft((d) => ({ ...d, type: t }))}
                  >
                    <div className={`fx-dot fx-dot-${meta.dot}`} />
                    <div className="fx-typeMain">
                      <div className="fx-typeTitle">
                        {meta.titleZh} <span className="fx-typeEn">{meta.titleEn}</span>
                      </div>
                      <div className="fx-typeDesc">{meta.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="fx-wizardFooter">
              <div className="fx-muted">Select one type to continue. </div>

              <button
                className={`fx-btn fx-btnPrimary ${canNextStep1 ? "" : "is-disabled"}`}
                onClick={() => setStep(2)}
                disabled={!canNextStep1}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Step 2 ---
  if (step === 2) {
    const t = draft.type!;
    const meta = TYPE_META[t];

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

            <button className="fx-btn fx-btnGhost" onClick={() => setStep(1)}>
              ← Back
            </button>
          </div>

          <div className="fx-card fx-wizardCard">
            <div className="fx-wizardHeader">
              <div className="fx-step">Step 2 / 7</div>
              <div className="fx-h1">Name your 2026 Vision</div>
              <div className="fx-sub">
                类型：{meta.titleZh} / {meta.titleEn}
              </div>
            </div>

            <div className="fx-field" style={{ marginTop: 12 }}>
              <div className="fx-fieldTitle">
                <span className="fx-fieldTag">Title</span>
                <span> 给你的 2026 年愿景起个名字</span>
              </div>

              <input
                className="fx-input"
                value={draft.title}
                placeholder={STEP2_TITLE_PLACEHOLDER[t]}
                maxLength={50}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                style={{ marginTop: 10 }}
              />

              <div className="fx-muted" style={{ marginTop: 8 }}>
                {draft.title.length}/50
              </div>
            </div>

            <div className="fx-wizardFooter" style={{ marginTop: 14 }}>
              <div className="fx-muted">Next：我们做 Step 3（愿景问询）。</div>

              <button
                className={`fx-btn fx-btnPrimary ${canNextStep2 ? "" : "is-disabled"}`}
                disabled={!canNextStep2}
                onClick={() => setStep(3)}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Step 3 ---
  if (step === 3) {
    const t = draft.type!;
    const meta = TYPE_META[t];

    const goNext = () => {
      // 同步 milestone 默认日期（如果用户还没改过日期，也能跟着 deadline 走）
      setDraft((d) => ({
        ...d,
        milestones: [
          { date: addMonths(d.deadline, -9), text: d.milestones[0]?.text ?? "" },
          { date: addMonths(d.deadline, -6), text: d.milestones[1]?.text ?? "" },
          { date: addMonths(d.deadline, -3), text: d.milestones[2]?.text ?? "" },
        ],
      }));
      setStep(4);
    };

    // 仅用于 “Q1 标题句” 的一行（不是小字提示；你要求删除的小字都不再渲染）
    const q1Title =
      t === "work"
        ? "2026年，你希望在工作上达成什么“可被确认的结果”？"
        : t === "project"
          ? "2026年，你希望产出什么“明确成果”？"
          : t === "life"
            ? "2026年，你希望生活状态变成什么样？"
            : "2026，你希望“学会什么”并能被确认？";

    const typeChip = `${meta.titleZh} / ${meta.titleEn}`;

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

            <button className="fx-btn fx-btnGhost" onClick={() => setStep(2)}>
              ← Back
            </button>
          </div>

          <div className="fx-card fx-wizardCard">
            <div className="fx-wizardHeader">
              <div className="fx-step">Step 3 / 7</div>
              <div className="fx-h1">Vision Interview</div>

              {/* 重新设计表头：突出 title + type */}
              <div
                className="fx-card"
                style={{
                  marginTop: 12,
                  padding: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div className="fx-muted" style={{ marginBottom: 6 }}>
                    Vision
                  </div>
                  <div
                    className="fx-h2"
                    style={{
                      margin: 0,
                      fontWeight: 720,
                      wordBreak: "break-word",
                    }}
                    title={draft.title}
                  >
                    【{draft.title || "-"}】
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
                  <span className="fx-pill" style={{ padding: "6px 10px" }}>
                    {typeChip}
                  </span>
                </div>
              </div>
            </div>

            {/* Q blocks：只保留标题 + 输入框；删除所有小字说明 */}
            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              {/* Q1 */}
              <div className="fx-qBlock">
                <div className="fx-qTop">
                  <span className="fx-pill fx-pill-q1">Q1 · 明确结果</span>
                  <div className="fx-qTitle">{q1Title}</div>
                </div>

                <input
                  className="fx-input"
                  value={draft.northStar}
                  placeholder="写一句能被确认的结果（尽量具体）"
                  onChange={(e) => setDraft((d) => ({ ...d, northStar: e.target.value }))}
                  style={{ marginTop: 10 }}
                />
              </div>

              {/* Q2 */}
              <div className="fx-qBlock">
                <div className="fx-qTop">
                  <span className="fx-pill fx-pill-q2">Q2 · 核心动机</span>
                  <div className="fx-qTitle">为什么这个愿景对你重要？</div>
                </div>

                <input
                  className="fx-input"
                  value={draft.why}
                  placeholder="写一句理由即可"
                  onChange={(e) => setDraft((d) => ({ ...d, why: e.target.value }))}
                  style={{ marginTop: 10 }}
                />
              </div>

              {/* Q3 */}
              <div className="fx-qBlock">
                <div className="fx-qTop">
                  <span className="fx-pill fx-pill-q3">Q3 · 验收标准</span>
                  <div className="fx-qTitle">怎么验收？</div>
                </div>

                <input
                  className="fx-input"
                  value={draft.metric}
                  placeholder="写 1-2 个验收标准/指标"
                  onChange={(e) => setDraft((d) => ({ ...d, metric: e.target.value }))}
                  style={{ marginTop: 10 }}
                />
              </div>

              {/* Q4 */}
              <div className="fx-qBlock">
                <div className="fx-qTop">
                  <span className="fx-pill fx-pill-q4">Q4 · 截止日期</span>
                  <div className="fx-qTitle">默认 2026-12-31（可修改）</div>
                </div>

                <input
                  className="fx-input"
                  value={draft.deadline}
                  placeholder="YYYY-MM-DD"
                  onChange={(e) => setDraft((d) => ({ ...d, deadline: e.target.value }))}
                  style={{ marginTop: 10 }}
                />
              </div>
            </div>

            <div className="fx-wizardFooter" style={{ marginTop: 14 }}>
              <div className="fx-muted">Next：拆里程碑（Step 4）。</div>

              <button
                className={`fx-btn fx-btnPrimary ${canNextStep3 ? "" : "is-disabled"}`}
                disabled={!canNextStep3}
                onClick={goNext}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Step 4 ---
  if (step === 4) {
    return (
      <VisionStepMilestones
        title={draft.title}
        visionType={draft.type!}
        milestones={draft.milestones}
        onChange={(milestones) => setDraft((d) => ({ ...d, milestones }))}
        onBack={() => setStep(3)}
        onNext={() => setStep(5)}
      />
    );
  }

  // --- Step 5 ---
  if (step === 5) {
    return (
      <VisionStepPlan
        title={draft.title}
        plan={draft.plan}
        onChange={(plan) => setDraft((d) => ({ ...d, plan }))}
        onBack={() => setStep(4)}
        onNext={() => setStep(6)}
      />
    );
  }

  // --- Step 6 ---
  if (step === 6) {
    return (
      <VisionStepRisks
        title={draft.title}
        risks={draft.risks}
        onChange={(risks) => setDraft((d) => ({ ...d, risks }))}
        onBack={() => setStep(5)}
        onNext={() => setStep(7)}
      />
    );
  }

  // --- Step 7 ---
  if (step === 7) {
    const t = draft.type!;
    const meta = TYPE_META[t];

    const onSave = () => {
      const id = `v_${Date.now()}`;

      const payload = {
        id,
        createdAt: new Date().toISOString(),
        type: t,
        typeZh: meta.titleZh,
        typeEn: meta.titleEn,
        title: draft.title.trim(),

        step3: {
          northStar: draft.northStar.trim(),
          why: draft.why.trim(),
          metric: draft.metric.trim(),
          deadline: draft.deadline.trim(),
        },

        milestones: draft.milestones.map((m, i) => ({
          id: `m_${id}_${i}`,
          title: m.text,
          due: m.date,
        })),

        plan: {
          minHoursPerWeek: draft.plan.hoursPerWeek,
          rhythm: draft.plan.rhythm,
          focus: draft.plan.preference,
        },

        risks: draft.risks.map((r, i) => ({
          id: `r_${id}_${i}`,
          risk: r.risk,
          response: r.plan,
        })),
      };

      upsertVision(payload as any);
      setActiveVisionId(id);

      // 保存后通知 Home 刷新
      window.dispatchEvent(new Event("fx:visions_changed"));

      alert("已保存 Vision: " + payload.title + "\nlocalStorage key: fx_vis_v1");
      goBackToHome();
    };

    return (
      <VisionStepReview
        typeLabel={`${meta.titleZh} / ${meta.titleEn}`}
        title={draft.title}
        northStar={draft.northStar}
        metric={draft.metric}
        why={draft.why}
        deadline={draft.deadline}
        milestones={draft.milestones}
        plan={draft.plan}
        risks={draft.risks}
        onBack={() => setStep(6)}
        onSave={onSave}
      />
    );
  }

  return null;
}