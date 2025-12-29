// src/pages/PlaceholderPage.tsx

type Props = {
  title: string;
  subtitle?: string;
  onBack: () => void;
};

export default function PlaceholderPage({ title, subtitle, onBack }: Props) {
  return (
    <div className="fx-app">
      <div className="fx-bg" />
      <div className="fx-container">
        <div className="fx-topbar">
          <div className="fx-brand">
            <div className="fx-brandMark" />
            <div className="fx-brandText">
              <div className="fx-kicker">FleinX2026</div>
              <div className="fx-title">{title}</div>
            </div>
          </div>

          <button className="fx-btn fx-btnGhost" onClick={onBack} type="button">
            ← Back
          </button>
        </div>

        <div className="fx-card fx-wizardCard">
          <div className="fx-wizardHeader">
            <div className="fx-step">Coming soon</div>
            <div className="fx-h1">{title}</div>
            <div className="fx-sub">{subtitle ?? "下一步我们把它和 Active Vision 联动起来。"}</div>
          </div>

          <div className="fx-wizardFooter" style={{ marginTop: 14 }}>
            <div className="fx-muted">先保证主框架稳定可扩展，后续只加页面/组件，不反复重写 App.tsx。</div>
          </div>
        </div>
      </div>
    </div>
  );
}