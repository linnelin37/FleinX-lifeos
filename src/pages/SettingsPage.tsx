// src/pages/SettingsPage.tsx
import { useMemo, useRef, useState } from "react";
import { clearAllData, downloadJson, exportBackup, importBackup } from "../lib/backup";

type Props = {
  onBack: () => void;
};

export default function SettingsPage({ onBack }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const filename = useMemo(() => {
    const d = new Date();
    const pad2 = (n: number) => String(n).padStart(2, "0");
    return `FleinX2026-backup-${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}.json`;
  }, []);

  function onExport() {
    const payload = exportBackup();
    downloadJson(filename, payload);
    setMsg("Exported. JSON 已下载到本地。");
  }

  async function onPickFile() {
    fileRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const raw = await f.text();
    setText(raw);
    setMsg("File loaded. 你可以直接点 Import 恢复。");
  }

  function onImport() {
    try {
      const payload = JSON.parse(text || "{}");
      importBackup(payload);
      setMsg("Imported. 已恢复数据。");
    } catch (err: any) {
      setMsg(`Import failed: ${err?.message || String(err)}`);
    }
  }

  function onClear() {
    const ok = window.confirm("确定要清空所有本地数据吗？此操作不可撤销。\n建议先 Export 备份。");
    if (!ok) return;
    clearAllData();
    setMsg("Cleared. 已清空本地数据。");
  }

  return (
    <div className="fx-app">
      <div className="fx-bg" />
      <div className="fx-container">
        <div className="fx-topbar">
          <div className="fx-brand">
            <div className="fx-brandMark" />
            <div className="fx-brandText">
              <div className="fx-kicker">FleinX2026</div>
              <div className="fx-title">Settings · Backup</div>
            </div>
          </div>

          <button className="fx-btn fx-btnGhost" type="button" onClick={onBack}>
            ← Back
          </button>
        </div>

        <div className="fx-card fx-main">
          <div className="fx-cardHeader">
            <div>
              <div className="fx-h2">Data Backup (Local)</div>
              <div className="fx-sub">单机长期使用：导出备份 / 导入恢复 / 清空数据</div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="fx-btn fx-btnPrimary" type="button" onClick={onExport}>
                Export JSON →
              </button>

              <button className="fx-btn fx-btnGhost" type="button" onClick={onPickFile}>
                Load JSON file
              </button>

              <button className="fx-btn fx-btnGhost" type="button" onClick={onImport} disabled={!text.trim()}>
                Import (Restore)
              </button>

              <button className="fx-btn fx-btnGhost" type="button" onClick={onClear}>
                Clear all data
              </button>

              <input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }} onChange={onFileChange} />
            </div>

            {msg ? (
              <div className="fx-empty">
                <div className="fx-body">{msg}</div>
              </div>
            ) : null}

            <div className="fx-h3" style={{ marginTop: 6 }}>
              Backup JSON
            </div>
            <div className="fx-sub">把导出的 JSON 粘贴到这里，或用 “Load JSON file” 载入。</div>

            <textarea
              className="fx-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='Paste backup JSON here... (example: { "app": "FleinX2026", "version": 1, ... })'
              style={{ minHeight: 220 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}