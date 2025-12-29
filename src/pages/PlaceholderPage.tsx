// src/pages/PlaceholderPage.tsx

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
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

          <button
            className="fx-btn fx-btnGhost"
            onClick={() => (onBack ? onBack() : (window.location.hash = "#/"))}
            type="button"
          >
            ← Back
          </button>
        </div>

        <div className="fx-card fx-main">
          <div className="fx-cardHeader">
            <div>
              <div className="fx-h2">{title}</div>
              {subtitle ? <div className="fx-sub">{subtitle}</div> : null}
            </div>
          </div>

          <div className="fx-empty">
            <div className="fx-h3">Coming Soon</div>
            <div className="fx-body">这个模块我们下一步接入 Active Vision 联动后再完善。</div>
          </div>
        </div>
      </div>
    </div>
  );
}