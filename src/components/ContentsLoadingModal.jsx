import { useEffect } from "react";
import { createPortal } from "react-dom";

// 本文データの取得が終わる前にカードを開いたときの待機表示。取得完了で PromptRunModal に差し替わる
const ContentsLoadingModal = ({ item, failed, onRetry, onClose }) => {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return createPortal(
    <div className="modal-backdrop run-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal run-modal" role="dialog" aria-modal="true" aria-labelledby="contents-loading-title" aria-busy={!failed}>
        <div className="run-modal-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 id="contents-loading-title" className="run-modal-title">{item.title}</h2>
            <p className="run-modal-meta">#{item.id} - {item.c1} / {item.c2}</p>
          </div>
          <button onClick={onClose} className="run-modal-icon-btn" aria-label="閉じる" style={{ fontSize: '20px', color: 'var(--ink2)' }}>×</button>
        </div>
        <div className="modal-body contents-status" role="status">
          {failed ? (
            <>
              <p>プロンプト本文を読み込めませんでした。通信状況を確認して、もう一度お試しください。</p>
              <button className="btn-action btn-primary contents-status-retry" onClick={onRetry}>再読み込み</button>
            </>
          ) : (
            <p>プロンプト本文を読み込んでいます…</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ContentsLoadingModal;
