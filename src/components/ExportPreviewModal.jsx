import { useEffect } from "react";
import { createPortal } from "react-dom";

// ─── Modal: ExportPreviewModal ───────────────────────────────────────────────
const ExportPreviewModal = ({ prompts, favCount, onConfirm, onClose }) => {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return createPortal(
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal import-options-modal">
        <div className="modal-header-flex">
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>エクスポート確認</h2>
          <button className="close-btn" onClick={onClose} aria-label="閉じる">×</button>
        </div>
        <div className="modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '14px', color: 'var(--ink2)', margin: 0 }}>
            以下 <strong>{prompts.length}件</strong>のカスタムプロンプト
            {favCount > 0 ? <span>・お気に入り<strong>{favCount}件</strong></span> : null}
            をJSONファイルに書き出します。
          </p>
          <div className="preview-list">
            {prompts.map((p, i) => (
              <div key={p.id ?? i} className="preview-list-item">
                <span className="preview-list-title">{p.title || '（タイトルなし）'}</span>
                {p.c1 && <span className="preview-list-cat">{p.c1}</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="modal-actions" style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
          <button className="btn-action btn-outline" onClick={onClose}>キャンセル</button>
          <div style={{ flex: 1 }} />
          <button className="btn-action btn-primary" onClick={onConfirm}>ダウンロード</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ExportPreviewModal;
