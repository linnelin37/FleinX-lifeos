// src/pages/RecordsPage.tsx
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { getVisionById } from "../lib/visionStore";
import {
  addRecord,
  deleteRecord,
  readRecordsByVision,
  type RecordType,
  RECORDS_CHANGED_EVENT,
} from "../lib/recordStore";

type Props = {
  activeVisionId: string | null;
  onBack: () => void;

};

function typeLabel(t: RecordType) {
  if (t === "note") return "Note";
  if (t === "idea") return "Idea";
  return "LifeLog";
}

function typeDesc(t: RecordType) {
  if (t === "note") return "记录信息、要点、结论";
  if (t === "idea") return "灵感、想法、可行行动";
  return "生活/工作流水、便于复盘";
}

function pillClass(t: RecordType) {
  if (t === "note") return "fx-pill fx-pill-note";
  if (t === "idea") return "fx-pill fx-pill-idea";
  return "fx-pill fx-pill-log";
}

export default function RecordsPage({ activeVisionId, onBack}: Props) {
  const [tick, setTick] = useState(0);

  const vision = useMemo(() => {
    if (!activeVisionId) return null;
    return getVisionById(activeVisionId);
  }, [activeVisionId]);

  const [kind, setKind] = useState<RecordType>("note");
  const [content, setContent] = useState<string>("");

  // recent/search/history (match Time behavior)
  const [search, setSearch] = useState<string>("");
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [historyLimit, setHistoryLimit] = useState<number>(20);

  // Listen changes (same tab + cross tab)
  useEffect(() => {
    const onChanged = () => setTick((x) => x + 1);
    window.addEventListener(RECORDS_CHANGED_EVENT, onChanged as any);
    window.addEventListener("storage", onChanged as any);
    return () => {
      window.removeEventListener(RECORDS_CHANGED_EVENT, onChanged as any);
      window.removeEventListener("storage", onChanged as any);
    };
  }, []);

  // Pull items from store (sorted newest -> oldest)
  const allItems = useMemo(() => {
    if (!activeVisionId) return [];
    void tick;
    const arr = readRecordsByVision(activeVisionId) || [];
    return [...arr].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [activeVisionId, tick]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter((x) => String(x.content || "").toLowerCase().includes(q));
  }, [allItems, search]);

  const recent10 = useMemo(() => filteredItems.slice(0, 10), [filteredItems]);

  const historyItems = useMemo(() => {
    if (!showHistory) return [];
    return filteredItems.slice(10, 10 + historyLimit);
  }, [filteredItems, showHistory, historyLimit]);

  const canSave = !!content.trim();

  const onAdd = () => {
    const text = content.trim();
    if (!text || !activeVisionId) return;

    addRecord({
      visionId: activeVisionId,
      type: kind,
      content: text,
    });

    setContent("");
    // keep UX: after add, stay in Recent view (do not auto open history)
    setTick((x) => x + 1);
  };

  function removeItem(id: string) {
    deleteRecord(id);
    setTick((x) => x + 1);
  }

  // UI helpers (keep minimal, consistent)
  const searchInputStyle: CSSProperties = {
    width: 260,
    maxWidth: "100%",
    height: 38,
    padding: "8px 12px",
    borderRadius: 12,
  };

  // --- No Active Vision ---
  if (!activeVisionId) {
    return (
      <div className="fx-app">
        <div className="fx-bg" />
        <div className="fx-container">
          <div className="fx-topbar">
            <div className="fx-brand">
              <div className="fx-brandMark" />
              <div className="fx-brandText">
                <div className="fx-kicker">FleinX2026</div>
                <div className="fx-title">Records</div>
              </div>
            </div>

            <button className="fx-btn fx-btnGhost" onClick={onBack} type="button">
              ← Back
            </button>
          </div>

          <div className="fx-card fx-main" style={{ padding: 18 }}>
            <div className="fx-h2">No Active Vision</div>
            <div className="fx-sub" style={{ marginTop: 6 }}>
              先去 Home 设一个 Active Vision，再来记录。
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button className="fx-btn fx-btnPrimary" type="button" onClick={onBack}>
                Go to Home →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Active Vision missing ---
  if (!vision) {
    return (
      <div className="fx-app">
        <div className="fx-bg" />
        <div className="fx-container">
          <div className="fx-topbar">
            <div className="fx-brand">
              <div className="fx-brandMark" />
              <div className="fx-brandText">
                <div className="fx-kicker">FleinX2026</div>
                <div className="fx-title">Records</div>
              </div>
            </div>

            <button className="fx-btn fx-btnGhost" onClick={onBack} type="button">
              ← Back
            </button>
          </div>

          <div className="fx-card fx-main" style={{ padding: 18 }}>
            <div className="fx-h2">Active Vision Not Found</div>
            <div className="fx-sub" style={{ marginTop: 6 }}>
              当前 Active Vision 可能已被删除。回到 Home 重新设置即可。
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button className="fx-btn fx-btnPrimary" type="button" onClick={onBack}>
                Go to Home →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====== UI ======
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
              <div className="fx-title">Records</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
    
            <button className="fx-btn fx-btnGhost" onClick={onBack} type="button">
              ← Back
            </button>
          </div>
        </div>

        {/* Main */}
        <div className="fx-card fx-main" style={{ padding: 18 }}>
          {/* Header (match Goals/Time) */}
          <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
            <div className="fx-muted" style={{ fontSize: 12 }}>
              Active Vision
            </div>

            <div
              style={{
                fontSize: 26,
                fontWeight: 860,
                letterSpacing: 0.3,
                lineHeight: 1.12,
                color: "rgba(245,245,255,0.96)",
                textShadow:
                  "0 18px 45px rgba(0,0,0,0.45), 0 10px 28px rgba(79,195,247,0.12), 0 8px 22px rgba(149,120,255,0.10)",
                display: "inline-block",
                padding: "6px 10px",
                borderRadius: 12,
                background: "linear-gradient(90deg, rgba(149,120,255,0.22), rgba(79,195,247,0.14))",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(10px)",
              }}
            >
              {`【${(vision as any).title}】`}
            </div>
          </div>
          <div className="fx-sub" style={{ marginTop: 4 }}>
            你的记录，是否在为你的目标留下可复盘的证据
          </div>
          {/* Add Record */}
          <div className="fx-h3" style={{ marginTop: 6 }}>
            Add Record
          </div>


          {/* Type cards */}
          <div 
           className="fx-reviewProgressGrid"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 12 }}>
            {(["note", "idea", "log"] as RecordType[]).map((t) => {
              const active = kind === t;
              return (
                <button
                  key={t}
                  type="button"
                  className={`fx-typeCard ${active ? "is-active" : ""}`}
                  onClick={() => setKind(t)}
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    textAlign: "left",
                    border: active ? "1px solid rgba(108,99,255,.75)" : "1px solid rgba(255,255,255,.10)",
                    boxShadow: active ? "0 0 0 2px rgba(108,99,255,.18), 0 18px 60px rgba(0,0,0,.40)" : undefined,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className={pillClass(t)}>{typeLabel(t)}</span>
                    <span className="fx-muted">{typeDesc(t)}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Input */}
          <textarea
            className="fx-input"
            style={{
              minHeight: 120,
              padding: 14,
              borderRadius: 16,
              marginTop: 12,
              border: "1px solid rgba(108,99,255,.35)",
              boxShadow: "0 0 0 1px rgba(108,99,255,.10) inset",
            }}
            value={content}
            placeholder="写下你想记录的内容（1-3 句话即可）"
            onChange={(e) => setContent(e.target.value)}
          />

          {/* Actions: Save on LEFT, no chars */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              gap: 12,
              alignItems: "center",
              marginTop: 10,
            }}
          >
            <button
              className={`fx-btn fx-btnPrimary ${canSave ? "" : "is-disabled"}`}
              type="button"
              disabled={!canSave}
              onClick={onAdd}
            >
              Save Record →
            </button>
          </div>

          {/* Recent header + Search (white title, no capsule) */}
          <div
            style={{
              marginTop: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div className="fx-h3" style={{ margin: 0, color: "rgba(255,255,255,0.92)" }}>
              Recent Records
            </div>

            <input
              className="fx-input"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHistoryLimit(20);
              }}
              placeholder="Search in content..."
              style={searchInputStyle}
            />
          </div>

          {/* Recent 10 */}
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {recent10.length ? (
              recent10.map((r) => (
                <div key={r.id} className="fx-card" style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                        <span className={pillClass(r.type)}>{typeLabel(r.type)}</span>
                        <span className="fx-muted">{new Date(r.createdAt).toLocaleString()}</span>
                      </div>

                      <div className="fx-body" style={{ whiteSpace: "pre-wrap" }}>
                        {r.content}
                      </div>
                    </div>

                    <button className="fx-btn fx-btnGhost" type="button" onClick={() => removeItem(r.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="fx-empty">
                <div className="fx-body">No records</div>
              </div>
            )}
          </div>

          {/* History (same interaction as Time) */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div className="fx-muted">History · {Math.max(0, filteredItems.length - 10)}</div>

              <button
                className="fx-btn fx-btnGhost"
                type="button"
                onClick={() => {
                  setShowHistory((v) => !v);
                  setHistoryLimit(20);
                }}
              >
                {showHistory ? "Collapse" : "Show"}
              </button>
            </div>

            {showHistory ? (
              <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                {historyItems.length ? (
                  historyItems.map((r) => (
                    <div key={r.id} className="fx-card" style={{ padding: 16, opacity: 0.96 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                            <span className={pillClass(r.type)}>{typeLabel(r.type)}</span>
                            <span className="fx-muted">{new Date(r.createdAt).toLocaleString()}</span>
                          </div>

                          <div className="fx-body" style={{ whiteSpace: "pre-wrap" }}>
                            {r.content}
                          </div>
                        </div>

                        <button className="fx-btn fx-btnGhost" type="button" onClick={() => removeItem(r.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="fx-empty">
                    <div className="fx-body">No more history</div>
                  </div>
                )}

                {10 + historyLimit < filteredItems.length ? (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
                    <button className="fx-btn fx-btnGhost" type="button" onClick={() => setHistoryLimit((x) => x + 20)}>
                      Load more (+20)
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Footer tip */}
          <div className="fx-footerNote" style={{ marginTop: 14 }}>
            Tip：越具体，越能在 Review 里复原你的推进链路。
          </div>
        </div>
      </div>
    </div>
  );
}