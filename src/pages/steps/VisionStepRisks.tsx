// src/pages/steps/VisionStepRisks.tsx
import { useMemo } from "react";

export type RiskItem = { risk: string; plan: string };

type Props = {
  title: string;
  risks: RiskItem[];
  onChange: (next: RiskItem[]) => void;
  onBack: () => void;
  onNext: () => void;
};

export default function VisionStepRisks({ title, risks, onChange, onBack, onNext }: Props) {
  const canNext = useMemo(() => {
    return risks.length === 2 && risks.every((r) => r.risk.trim() && r.plan.trim());
  }, [risks]);

  const updateAt = (idx: number, patch: Partial<RiskItem>) => {
    const next = risks.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    onChange(next);
  };

  // UI helper: pill（不用改 App.css 也能用）
  const Pill = ({ text }: { text: string }) => (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 12px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.05)",
        color: "rgba(255,255,255,0.88)",
        fontSize: 12,
        fontWeight: 720,
        letterSpacing: 0.2,
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
            <div className="fx-step">Step 6 / 7</div>
            <div className="fx-h1">Risks & Countermeasures</div>
            <div className="fx-sub">为愿景「{title}」提前写 2 个风险与应对。</div>
          </div>

          {/* 2-up layout */}
          <div
            style={{
              marginTop: 14,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            {[0, 1].map((idx) => (
              <div
                key={idx}
                className="fx-card"
                style={{
                  padding: 16,
                  borderRadius: 18,
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <Pill text={`风险 ${idx + 1}`} />
                  <div className="fx-muted" style={{ fontSize: 12 }}>
                    必填
                  </div>
                </div>

                {/* Risk label */}
                <div style={{ marginTop: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "baseline",
                      marginBottom: 8,
                    }}
                  >
                    <div className="fx-h3" style={{ margin: 0 }}>
                      Risk：
                    </div>
                    <div className="fx-sub" style={{ margin: 0 }}>
                      最大风险是什么？
                    </div>
                  </div>

                  <input
                    className="fx-input"
                    value={risks[idx]?.risk ?? ""}
                    placeholder="坚持不下来 / 时间被工作挤占"
                    onChange={(e) => updateAt(idx, { risk: e.target.value })}
                  />
                </div>

                {/* Response label */}
                <div style={{ marginTop: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "baseline",
                      marginBottom: 8,
                    }}
                  >
                    <div className="fx-h3" style={{ margin: 0 }}>
                      Response：
                    </div>
                    <div className="fx-sub" style={{ margin: 0 }}>
                      应对策略
                    </div>
                  </div>

                  <input
                    className="fx-input"
                    value={risks[idx]?.plan ?? ""}
                    placeholder="最低承诺 30 分钟；周末补齐；公开打卡"
                    onChange={(e) => updateAt(idx, { plan: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* responsive */}
          <div style={{ height: 1 }} />

          <style>{`
            @media (max-width: 980px) {
              .fx-wizardCard > div[style*="grid-template-columns: 1fr 1fr"] {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>

          <div className="fx-wizardFooter" style={{ marginTop: 14 }}>
            <div className="fx-muted">Next：确认页并保存（Step 7）。</div>
            <button className={`fx-btn fx-btnPrimary ${canNext ? "" : "is-disabled"}`} disabled={!canNext} onClick={onNext}>
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}