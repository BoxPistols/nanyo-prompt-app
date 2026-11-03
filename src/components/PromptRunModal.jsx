import { useState, useRef, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { STORAGE_KEY, AI_TOOLS } from "../constants";
import * as Icons from "./Icons";
import ModalOnboarding from "./ModalOnboarding";
import { parsePromptContent, fillPrompt } from "../utils/promptContent";

// ─── Modal: PromptRunModal & モーダル内オンボーディング ──────────────────────
const MODAL_INTRO_STEPS = [
  {
    selector: '.modal-content-wrapper',
    title: 'プロンプトの使い方',
    text: 'このモーダルでは、プロンプトに情報を入力してAIに送るテキストを作成できます。順に説明します。',
  },
  {
    selector: '.prompt-form',
    title: '入力フォーム',
    text: '左側のフォームに情報を入力すると、右側のプレビューにリアルタイムで反映されます。',
    fallbackSelector: '.prompt-preview',
    fallbackText: 'プレビュー欄は直接編集もできます。自由にテキストを調整してください。',
    mobileTab: 'form',
  },
  {
    selector: '.prompt-preview',
    title: 'プレビュー確認',
    text: '完成したプロンプトをここで確認できます。内容を直接編集することもできます。',
    mobileTab: 'preview',
  },
  {
    selector: '.run-modal-footer',
    title: 'コピー & AI貼付',
    text: '「コピー」でクリップボードに保存。「AI貼付」でコピー後にAIツールを自動で開きます。',
  },
];

const PromptRunModal = ({ item, contents, onClose, selectedAiTool, setSelectedAiTool }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [mobileTab, setMobileTab] = useState("preview"); // "preview" | "form"
  const [isMaximized, setIsMaximized] = useState(false);
  const modalRef = useRef(null);

  // モーダル内オンボーディング
  const [modalIntroStep, setModalIntroStep] = useState(-1);
  // コンテンツ解析: 本文抽出、セクション変数抽出、UI混入テキスト除去
  const { promptText, inlinePlaceholders, additionalVars, allPlaceholders } = useMemo(
    () => parsePromptContent(item.body || contents?.[item.id] || "プロンプトの本文が読み込めませんでした。"),
    [item.id, item.body, contents]
  );

  const [values, setValues] = useState(() => {
    const initial = {};
    allPlaceholders.forEach(p => { initial[p] = ""; });
    return initial;
  });

  const [copyStatus, setCopyStatus] = useState(false);
  const [pasteStatus, setPasteStatus] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState("");

  // モーダルオンボーディング: 初回チェック
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY + "_modal_intro_done")) return;
    } catch { return; }
    const timer = setTimeout(() => {
      setModalIntroStep(0);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const dismissModalIntro = () => {
    setModalIntroStep(-1);
    // 保存できなくても次回また案内が出るだけなので無視する
    try { localStorage.setItem(STORAGE_KEY + "_modal_intro_done", "1"); } catch { /* noop */ }
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (modalIntroStep >= 0) { dismissModalIntro(); return; }
        onClose(); return;
      }
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
      if (e.key === 'f' || e.key === 'F') { e.preventDefault(); setIsMaximized(v => !v); }
      if (e.key === 's' || e.key === 'S') { e.preventDefault(); setShowSettings(v => !v); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, modalIntroStep]);

  // ─── Keyboard awareness via visualViewport API ───
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handleResize = () => {
      const keyboardOffset = window.innerHeight - vv.height;
      document.documentElement.style.setProperty(
        '--keyboard-offset',
        `${Math.max(0, keyboardOffset)}px`
      );
    };
    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', handleResize);
    return () => {
      vv.removeEventListener('resize', handleResize);
      vv.removeEventListener('scroll', handleResize);
      document.documentElement.style.removeProperty('--keyboard-offset');
    };
  }, []);

  // クリップボード用テキスト: インライン変数を置換 + 追加変数を末尾に付加
  const finalPromptText = useMemo(
    () => fillPrompt({ promptText, values, inlinePlaceholders, additionalVars }),
    [promptText, values, inlinePlaceholders, additionalVars]
  );

  // editedPromptを初期化・同期
  useEffect(() => {
    setEditedPrompt(finalPromptText);
  }, [finalPromptText]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedPrompt);
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    } catch (err) { console.error('Copy failed', err); }
  };

  const handleAiPaste = () => {
    handleCopy();
    const tool = AI_TOOLS.find(t => t.id === selectedAiTool) || AI_TOOLS[0];
    let url = tool.url;

    // 全てのAIツールでクリップボード貼り付けを想定（URLクエリは使用しない）

    window.open(url, '_blank');
    setPasteStatus(true);
    setTimeout(() => setPasteStatus(false), 2000);
  };

  const hasForm = allPlaceholders.length > 0;

  // フォームがない場合はステップ1（入力フォーム）をスキップ
  const introSteps = hasForm ? MODAL_INTRO_STEPS : MODAL_INTRO_STEPS.filter((_, i) => i !== 1);
  const currentIntroStep = introSteps[modalIntroStep];

  // モバイル: オンボーディングのステップに応じてタブを自動切替
  useEffect(() => {
    if (modalIntroStep < 0 || !currentIntroStep?.mobileTab) return;
    setMobileTab(currentIntroStep.mobileTab);
  }, [modalIntroStep, currentIntroStep]);

  const modalIntroContent = modalIntroStep >= 0 && currentIntroStep ? (
    <ModalOnboarding
      currentStep={modalIntroStep}
      totalSteps={introSteps.length}
      step={currentIntroStep}
      containerRef={modalRef}
      onNext={() => {
        if (modalIntroStep < introSteps.length - 1) {
          setModalIntroStep(modalIntroStep + 1);
        } else {
          dismissModalIntro();
        }
      }}
      onSkip={dismissModalIntro}
    />
  ) : null;

  return createPortal(
    <div className="modal-backdrop run-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) { if (modalIntroStep >= 0) return; onClose(); } }}>
      <div ref={modalRef} className={`modal run-modal ${isMaximized ? 'run-modal-maximized' : ''}`}>
        {/* ─── Header (compact on mobile) ─── */}
        <div className="run-modal-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="run-modal-title">{item.title}</h2>
            <p className="run-modal-meta">#{item.id} - {item.c1} / {item.c2}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="run-modal-icon-btn"
              style={{ background: showSettings ? 'var(--primary-light)' : 'transparent', color: showSettings ? 'var(--primary)' : 'var(--ink3)' }}
              title="AIツールの設定"
            >
              <Icons.Settings />
            </button>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="run-modal-icon-btn hide-mobile"
              title={isMaximized ? "元のサイズに戻す" : "全画面表示"}
            >
              {isMaximized ? <Icons.Restore /> : <Icons.Maximize />}
            </button>
            <button onClick={onClose} className="run-modal-icon-btn" style={{ fontSize: '20px', color: 'var(--ink2)' }}>×</button>
          </div>
        </div>

        {showSettings && (
          <div className="run-modal-settings">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ink2)' }}>AIツール:</span>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {AI_TOOLS.map(tool => (
                  <button key={tool.id} onClick={() => setSelectedAiTool(tool.id)} className={`chip ${selectedAiTool === tool.id ? 'active' : ''}`} style={{ padding: '3px 10px', fontSize: '11px' }}>
                    {tool.name}
                  </button>
                ))}
              </div>
              <p className="run-modal-settings-note">※ コピー後、AIツールを新タブで開きます。貼り付けてご利用ください。</p>
            </div>
          </div>
        )}

        {/* ─── Mobile tab switcher (form有りの時のみ) ─── */}
        {hasForm && (
          <div className="mobile-tab-bar">
            <button className={`mobile-tab ${mobileTab === 'preview' ? 'active' : ''}`} onClick={() => setMobileTab('preview')}>
              プレビュー
            </button>
            <button className={`mobile-tab ${mobileTab === 'form' ? 'active' : ''}`} onClick={() => setMobileTab('form')}>
              入力 ({allPlaceholders.length})
            </button>
          </div>
        )}

        {/* ─── Content area ─── */}
        <div className={`modal-content-wrapper ${hasForm ? 'has-form' : ''} mobile-tab-${mobileTab}`}>
          {hasForm && (
            <div className="prompt-form">
              <div style={{ marginBottom: '16px', padding: '8px 10px', background: 'var(--primary-light)', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: '600', color: 'var(--primary)' }}>情報を入力してください。プレビューに反映されます。</p>
              </div>
              {allPlaceholders.map(p => (
                <div key={p} className="form-group" style={{ marginBottom: '14px' }}>
                  <label>{p}</label>
                  <textarea className="prompt-textarea" placeholder={`${p}を入力`} value={values[p] || ""} onChange={(e) => setValues(prev => ({ ...prev, [p]: e.target.value }))} />
                </div>
              ))}
            </div>
          )}
          <div className="prompt-preview">
            <div className="preview-header">
              <h3 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ink2)', margin: 0 }}>プロンプト プレビュー</h3>
              <span style={{ fontSize: '10px', color: 'var(--ink3)' }}>編集可能</span>
            </div>
            <textarea
              className="preview-box editable"
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              placeholder="プロンプトがここに表示されます"
            />
          </div>
        </div>

        {/* ─── Footer (compact on mobile) ─── */}
        <div className="run-modal-footer">
          <button className="btn-action btn-outline run-modal-cancel" onClick={onClose}>閉じる</button>
          <button className="btn-action btn-outline run-modal-ai-btn" onClick={handleAiPaste}>
            {pasteStatus ? "移動中..." : <><Icons.Sparkles /> AI貼付</>}
          </button>
          <button className="btn-action btn-primary run-modal-copy-btn" onClick={handleCopy}>
            {copyStatus ? "Copied!" : <><Icons.Copy /> コピー</>}
          </button>
        </div>
        {!isMaximized && <span className="resize-grip hide-mobile"><Icons.GripResize /></span>}
        {modalIntroContent}
      </div>
    </div>,
    document.body
  );
};

export default PromptRunModal;
