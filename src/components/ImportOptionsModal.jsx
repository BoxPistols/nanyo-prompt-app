import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

// ─── Modal: ImportOptionsModal ───────────────────────────────────────────────
const IMPORT_MODES = [
  {
    value: "add",
    label: "追加",
    desc: "既存のプロンプトはそのままで、インポートしたプロンプトをすべて新規追加します。",
  },
  {
    value: "merge",
    label: "マージ",
    desc: "同じIDの独自プロンプトは上書き、新しいものは追加します。",
  },
  {
    value: "replace",
    label: "全て置き換え",
    desc: "既存の独自プロンプトをすべて削除し、インポートしたプロンプトに置き換えます。",
  },
];

const ImportOptionsModal = ({ data, onConfirm, onClose }) => {
  const [mode, setMode] = useState("add");

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return createPortal(
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal import-options-modal">
        <div className="modal-header-flex">
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>インポート方式を選択</h2>
          <button className="close-btn" onClick={onClose} aria-label="閉じる">×</button>
        </div>
        <div className="modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '14px', color: 'var(--ink2)', margin: 0 }}>
            <strong>{data.prompts.length}件</strong>のカスタムプロンプト
            {data.favorites?.length ? <span>・お気に入り<strong>{data.favorites.length}件</strong></span> : null}
            が含まれています。
          </p>
          <div className="preview-list">
            {data.prompts.map((p, i) => (
              <div key={p.id ?? i} className="preview-list-item">
                <span className="preview-list-title">{p.title || '（タイトルなし）'}</span>
                {p.c1 && <span className="preview-list-cat">{p.c1}</span>}
              </div>
            ))}
          </div>
          <div className="import-mode-list">
            {IMPORT_MODES.map(m => (
              <label key={m.value} className={`import-mode-item${mode === m.value ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name="import-mode"
                  value={m.value}
                  checked={mode === m.value}
                  onChange={() => setMode(m.value)}
                />
                <div>
                  <span className="import-mode-label">{m.label}</span>
                  <span className="import-mode-desc">{m.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="modal-actions" style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
          <button className="btn-action btn-outline" onClick={onClose}>キャンセル</button>
          <div style={{ flex: 1 }} />
          <button className="btn-action btn-primary" onClick={() => onConfirm(mode)}>インポート実行</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ImportOptionsModal;
