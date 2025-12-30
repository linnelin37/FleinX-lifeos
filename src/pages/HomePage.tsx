// src/pages/HomePage.tsx
import { useEffect, useMemo, useState } from "react";
import type { VisionRecord } from "../lib/visionStore";
import { getWelcomeName } from "../lib/prefStore";

type Props = {
  visions: VisionRecord[];
  activeVisionId: string | null;

  onCreate: () => void;
  onRefresh: () => void;
  onClearAll: () => void;
  onDelete: (id: string) => void;
  onSetActive: (id: string | null) => void;

  onGo: (hash: string) => void;
};

function typeLabel(v: VisionRecord) {
  const zh =
    (v as any).typeZh ||
    ({
      learning: "学习",
      work: "工作",
      life: "生活",
      project: "项目",
    } as const)[v.type] ||
    v.type;

  const en =
    ({
      learning: "Learning",
      work: "Work",
      life: "Life",
      project: "Project",
    } as const)[v.type] || "";

  return `${zh} / ${en}`;
}

function dotClassByType(type: VisionRecord["type"]) {
  if (type === "learning") return "fx-dot-learning";
  if (type === "work") return "fx-dot-work";
  if (type === "life") return "fx-dot-life";
  return "fx-dot-project";
}

function normalizeHomeTitle(name: string) {
  const t = (name || "").trim();
  return t.length ? t : "My2026";
}

export default function HomePage(props: Props) {
  const { visions, activeVisionId, onCreate, onRefresh, onClearAll, onDelete, onSetActive, onGo } = props;

  const hasVisions = visions.length > 0;

  // Home title (from Welcome)
  const [homeTitle, setHomeTitle] = useState(() => normalizeHomeTitle(getWelcomeName()));

  useEffect(() => {
    const sync = () => setHomeTitle(normalizeHomeTitle(getWelcomeName()));
    sync();

    // When prefStore writes, it should dispatch: new Event("fx:prefs_changed")
    window.addEventListener("fx:prefs_changed", sync);

    // fallback: in case user edits storage from devtools etc.
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("fx:prefs_changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const tabs = useMemo(
    () => [
     
      { t: "Goals", h: "#/goals" },
      { t: "Time", h: "#/time" },
      { t: "Records", h: "#/records" },
      { t: "Review", h: "#/review" },
       { t: "Dashboard", h: "#/dashboard" },
      { t: "Settings", h: "#/settings" },
    ],
    []
  );

  return (
    <div className="fx-app">
      <div className="fx-bg" />

      <div className="fx-container">
        {/* Topbar */}
        <div className="fx-topbar fx-topbarHome">
          {/* Row 1: Brand */}
          <div className="fx-topbarRow">
            <div className="fx-brand">
              <div className="fx-brandMark" />
              <div className="fx-brandText" style={{ minWidth: 0 }}>
                <div className="fx-kicker">FleinX2026</div>
                <div
                  className="fx-title"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {homeTitle}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Tabs (mobile 横向滚动由 CSS 控制，不在这里加 Menu) */}
          <div className="fx-tabs fx-tabsHome">
            {tabs.map((x) => (
              <button key={x.t} type="button" className="fx-tab" onClick={() => onGo(x.h)}>
                {x.t}
              </button>
            ))}
          </div>
        </div>

        {/* Layout */}
        <div className="fx-layout">
          {/* Left: Vision list */}
          <div className="fx-card fx-main">
            <div className="fx-cardHeader">
              <div style={{ minWidth: 0 }}>
                <div className="fx-h2">2026 Vision</div>
                <div className="fx-sub">把一年变成一条清晰的路线</div>
              </div>

              <button className="fx-btn fx-btnPrimary" onClick={onCreate} type="button">
                Create 2026 Vision
              </button>
            </div>

            {!hasVisions ? (
              <div className="fx-empty">
                <div className="fx-h3">你还没有创建 Vision</div>
                <div className="fx-body" style={{ marginTop: 6 }}>
                  先做第一张卡片。
                  <br />
                  之后 Goals / Time / Records / Review 都会围绕 Active Vision 自动联动。
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
                  {visions.map((v) => {
                    const isActive = v.id === activeVisionId;
                    const due = (v as any)?.step3?.deadline ?? "2026-12-31";
                    const dotCls = dotClassByType(v.type);

                    return (
                      <div key={v.id} className={`fx-card fx-visionCard ${isActive ? "is-active" : ""}`} style={{ padding: 16 }}>
                        {/* top line */}
                        <div
                          className="fx-visionTop"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            alignItems: "center",
                          }}
                        >
                          <div className="fx-visionType" style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                            <span className={`fx-dot ${dotCls}`} />
                            <div className="fx-muted" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {typeLabel(v)}
                            </div>
                          </div>

                          {isActive ? <div className="fx-badge">Active</div> : null}
                        </div>

                        {/* title */}
                        <div className="fx-visionTitle" style={{ marginTop: 10 }}>
                          {`【${v.title || "-"}】`}
                        </div>

                        {/* due */}
                        <div className="fx-visionMeta" style={{ marginTop: 8 }}>
                          Due · {due}
                        </div>

                        {/* actions */}
                        <div className="fx-visionActions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                          <button className="fx-btn fx-btnGhost" type="button" onClick={() => onGo(`#/vision/${v.id}`)}>
                            Open →
                          </button>

                          <button
                            className={`fx-btn ${isActive ? "fx-btnGhost" : "fx-btnPrimary"}`}
                            type="button"
                            onClick={() => onSetActive(isActive ? null : v.id)}
                          >
                            {isActive ? "Unset" : "Set Active"}
                          </button>

                          <button className="fx-btn fx-btnGhost" type="button" onClick={() => onDelete(v.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* utilities */}
                <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  <button className="fx-btn fx-btnGhost" type="button" onClick={onClearAll}>
                    Clear All
                  </button>
                  <button className="fx-btn fx-btnGhost" type="button" onClick={onRefresh}>
                    Refresh
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right: Modules */}
          <div className="fx-right">
            <div className="fx-card fx-mods">
              <div className="fx-h2">Modules</div>
              <div className="fx-sub">从今天开始，把愿景变成可执行的日常推进</div>

              {[
                { title: "Goals", desc: "把愿景拆成今天能完成的一小步", h: "#/goals" },
                { title: "Time", desc: "记录你真正为它付出的时间", h: "#/time" },
                { title: "Records", desc: "留下关键想法，未来回头看", h: "#/records" },
                { title: "Review", desc: "停下来，看清你在走哪条路", h: "#/review" },
                { title: "Settings", desc: "把系统调成你最舒服的状态", h: "#/settings" },
              ].map((m) => (
                <div key={m.title} className="fx-modItem">
                  <div className="fx-modTitle">{m.title}</div>
                  <div className="fx-modDesc">{m.desc}</div>
                  <button className="fx-link" type="button" onClick={() => onGo(m.h)}>
                    Open →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}