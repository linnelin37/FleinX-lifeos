// src/pages/WelcomePage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  getWelcomeDone,
  setWelcomeDone,
  getWelcomeName,
  setWelcomeName,
  getWelcomeNote,
  setWelcomeNote,
} from "../lib/prefStore";

type Props = {
  onContinue: () => void; // 继续进入 Home
};

const FIXED_LINE =
  "FleinX 是一个以「事情」为核心的人生项目管理系统。";

const DEFAULT_NAME = "My2026";

const DEFAULT_NOTE =
  "不记录你有多忙，\n只记录：你的人生是否正在推进你真正想做成的事情。";

function normalizeName(v: string) {
  const t = (v || "").trim();
  return t.length ? t : DEFAULT_NAME;
}

function normalizeNote(v: string) {
  const t = (v || "").trim();
  return t.length ? t : DEFAULT_NOTE;
}

export default function WelcomePage({ onContinue }: Props) {
  // 只在首渲染读取一次，避免反复读 localStorage
  const init = useMemo(() => {
    const storedName = getWelcomeName();
    const storedNote = getWelcomeNote();
    const done = getWelcomeDone();

    return {
      name: normalizeName(storedName),
      note: normalizeNote(storedNote),
      done,
    };
  }, []);

  const [name, setName] = useState(init.name);
  const [note, setNote] = useState(init.note);

  // 如果 localStorage 里没值，首次进入就写入默认值，保证 Home 有数据源
  useEffect(() => {
    if (!getWelcomeName()) setWelcomeName(init.name);
    if (!getWelcomeNote()) setWelcomeNote(init.note);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function save() {
    const nextName = normalizeName(name);
    const nextNote = normalizeNote(note);

    setName(nextName);
    setNote(nextNote);

    setWelcomeName(nextName);
    setWelcomeNote(nextNote);
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
              <div className="fx-muted" />
            </div>

            <textarea
              className="fx-textarea fx-welcomeTextarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={DEFAULT_NOTE}
            />

            <div className="fx-muted" style={{ marginTop: 8 }}>
              写一句能在你动摇时，帮你找回方向的话。
            </div>
          </div>

          {/* Name row */}
          <div className="fx-welcomeRow">
            <div className="fx-welcomeLabel">给你的 2026 命名</div>
            <input
              className="fx-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={DEFAULT_NAME}
              autoComplete="off"
            />
          </div>

          <div className="fx-muted" style={{ marginTop: 10 }}>
            单机本地存储版本
          </div>

          {/* Actions */}
          <div className="fx-welcomeActions">
            <button className="fx-btn fx-btnGhost" type="button" onClick={save}>
              保存
            </button>
            <button className="fx-btn fx-btnPrimary" type="button" onClick={handleContinue}>
              {init.done ? "进入 →" : "继续 →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}