// src/pages/WelcomePage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  setWelcomeDone,
  getWelcomeName,
  setWelcomeName,
  getWelcomeNote,
  setWelcomeNote,
} from "../lib/prefStore";

type Props = {
  onContinue: () => void; // 继续进入 Home
};

const FIXED_LINE = "Fleinx 是一个以“事情”为核心的人生项目管理系统。";
const DEFAULT_NOTE = "不记录你忙不忙，只记录:你的人生是否在推进你真正想做成的事情。";

export default function WelcomePage({ onContinue }: Props) {
  const initialName = useMemo(() => getWelcomeName() || "Linne's2026", []);
  const initialNote = useMemo(() => getWelcomeNote() || DEFAULT_NOTE, []);

  const [name, setName] = useState(initialName);
  const [note, setNote] = useState(initialNote);

  useEffect(() => {
    if (!getWelcomeName()) setWelcomeName(initialName);
    if (!getWelcomeNote()) setWelcomeNote(initialNote);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function save() {
    setWelcomeName((name || "").trim() || "My2026");
    setWelcomeNote((note || "").trim() || DEFAULT_NOTE);
  }

  function handleContinue() {
    save();
    setWelcomeDone(true);
    onContinue();
  }

  return (
    <div className="fx-app">
      <div className="fx-bg" />

      <div className="fx-container fx-centerScreen">
        <div className="fx-card fx-main fx-welcomeCard">
          {/* Head */}
          <div className="fx-welcomeHead">
            <div className="fx-avatarPh" title="Avatar placeholder" />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="fx-kicker">FleinX2026</div>
              <div className="fx-welcomeTitle">开启你的 2026</div>
              <div className="fx-sub" style={{ marginTop: 8 }}>
                {FIXED_LINE}
              </div>
            </div>
          </div>

          {/* Focus / Manifesto */}
          <div className="fx-welcomeFocus">
            <div className="fx-welcomeFocusTop">
              <div className="fx-h3" style={{ margin: 0 }}>
                你的年度宣言
              </div>
              <div className="fx-muted"></div>
            </div>

            <textarea
              className="fx-textarea fx-welcomeTextarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={DEFAULT_NOTE}
            />

            <div className="fx-muted" style={{ marginTop: 8 }}>
            
            </div>
          </div>

          {/* Name row */}
          <div className="fx-welcomeRow">
            <div className="fx-welcomeLabel">给你的 2026 命名</div>
            <input
              className="fx-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My2026"
            />
          </div>

          <div className="fx-muted" style={{ marginTop: 10 }}>
            本地单机 · 可部署分享 · 无需登录
          </div>

          {/* Actions */}
          <div className="fx-welcomeActions">
            <button className="fx-btn fx-btnGhost" type="button" onClick={save}>
              保存
            </button>
            <button className="fx-btn fx-btnPrimary" type="button" onClick={handleContinue}>
              继续 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}