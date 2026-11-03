import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { RAW } from "../data/prompts";
import { PROMPT_SECTIONS, buildBody, parseBody } from "../utils/promptBody";
import * as Icons from "./Icons";

// ─── Modal: CrudModal ────────────────────────────────────────────────────────
const PROMPT_SEEDS = [
  {
    name: "文章要約",
    title: "文章を要約するプロンプト",
    c1: "文章作成・要約",
    c2: "要約・整理",
    sections: {
      purpose: "長文や複雑な文章を簡潔にまとめ、要点を把握しやすくする。",
      role: "あなたは優秀な要約のスペシャリストです。文章構造を正確に把握し、重要な情報を漏らさず簡潔にまとめる能力があります。",
      instructions: "以下の{対象の文章}を読み、要点を箇条書きで整理してください。\n重要なキーワードや数値は必ず含めてください。",
      rules: "- 原文の意味を変えない\n- 専門用語はそのまま残す\n- 箇条書きは5〜10項目程度にまとめる",
      output: "マークダウン形式の箇条書き",
      variables: "対象の文章",
    },
  },
  {
    name: "コードレビュー",
    title: "コードレビューを依頼するプロンプト",
    c1: "プログラミング",
    c2: "マクロ・プログラム",
    sections: {
      purpose: "コードの品質向上、バグの早期発見、ベストプラクティスへの準拠を確認する。",
      role: "あなたはシニアソフトウェアエンジニアです。{プログラミング言語}に精通し、可読性・保守性・パフォーマンスの観点からレビューを行います。",
      instructions: "以下の{コード}をレビューしてください。\nバグ、改善点、セキュリティリスクがあれば指摘してください。",
      rules: "- 具体的な修正案を提示する\n- 良い点も指摘する\n- 重要度（高/中/低）をつける",
      output: "## 概要\n（全体評価）\n\n## 指摘事項\n| # | 重要度 | 内容 | 修正案 |\n\n## 良い点",
      variables: "プログラミング言語\nコード",
    },
  },
  {
    name: "メール作成",
    title: "ビジネスメールを作成するプロンプト",
    c1: "コミュニケーション支援",
    c2: "コミュニケーション支援",
    sections: {
      purpose: "状況に応じた適切なビジネスメールを効率的に作成する。",
      role: "あなたはビジネスコミュニケーションの専門家です。日本語のビジネスマナーに精通しています。",
      instructions: "{相手との関係}の方に、{メールの目的}についてビジネスメールを作成してください。",
      rules: "- 丁寧かつ簡潔に\n- 件名も含める\n- 敬語を適切に使用する",
      output: "件名:\n本文:",
      variables: "相手との関係\nメールの目的",
    },
  },
  {
    name: "学習ガイド",
    title: "技術トピックの学習ロードマップ作成",
    c1: "意識改革・スキルアップ",
    c2: "教育関連",
    sections: {
      purpose: "特定の技術トピックについて、体系的な学習計画を作成する。",
      role: "あなたは経験豊富な技術メンターです。初心者から上級者まで、学習者のレベルに応じた効果的な学習プランを設計できます。",
      instructions: "{学習したいトピック}について、{現在のスキルレベル}の学習者向けのロードマップを作成してください。",
      rules: "- 段階的に難易度を上げる\n- 各ステップに推定学習時間を記載\n- 無料で利用できるリソースを優先する\n- 実践的な演習を含める",
      output: "## ロードマップ概要\n## フェーズ1: 基礎（目安: X週間）\n## フェーズ2: 実践（目安: X週間）\n## フェーズ3: 応用（目安: X週間）\n## おすすめリソース",
      variables: "学習したいトピック\n現在のスキルレベル",
    },
  },
  {
    name: "議事録整理",
    title: "会議メモから議事録を作成するプロンプト",
    c1: "業務改善",
    c2: "業務改善・戦略",
    sections: {
      purpose: "散漫な会議メモから、構造化された議事録を効率的に作成する。",
      role: "あなたは議事録作成のエキスパートです。要点を正確に把握し、決定事項とアクションアイテムを明確に整理できます。",
      instructions: "以下の{会議メモ}を整理し、正式な議事録を作成してください。",
      rules: "- 発言の要旨を正確に記録する\n- 決定事項とTODOを明確に分ける\n- 担当者と期限を記載する",
      output: "## 会議名:\n## 日時:\n## 参加者:\n## 議題と討議内容:\n## 決定事項:\n## アクションアイテム:\n| # | 担当 | 内容 | 期限 |",
      variables: "会議メモ",
    },
  },
  {
    name: "UI/UXデザイン",
    title: "UI/UXデザインのレビュー・改善提案プロンプト",
    c1: "アイデア創出・企画",
    c2: "アイデア創出・企画",
    sections: {
      purpose: "Webサイトやアプリの画面デザインについて、ユーザビリティやアクセシビリティの観点から改善点を洗い出し、具体的な改善案を提示する。",
      role: "あなたはUI/UXデザインの専門家です。ユーザー中心設計（UCD）、アクセシビリティ（WCAG）、マテリアルデザインなどのデザインシステムに精通し、使いやすさと視覚的な美しさを両立する提案ができます。",
      instructions: "{対象画面の説明}について、以下の観点からUI/UXデザインのレビューを行い、改善案を提示してください。\n\n1. ユーザビリティ（操作性・学習しやすさ）\n2. 視覚的な階層構造（情報の優先度が伝わるか）\n3. アクセシビリティ（色のコントラスト、フォントサイズ、操作対象のサイズ）\n4. レスポンシブ対応（モバイル・タブレットでの表示）\n5. インタラクション（ホバー、フィードバック、遷移のアニメーション）",
      rules: "- 問題点だけでなく、良い点も指摘する\n- 各指摘に具体的な修正案（CSSやコンポーネントの例）を添える\n- 改善の優先度（高/中/低）を明記する\n- 対象ユーザー層を考慮した提案をする",
      output: "## デザインレビュー概要\n（全体的な印象と評価）\n\n## 良い点\n- ...\n\n## 改善提案\n| # | 優先度 | カテゴリ | 指摘内容 | 改善案 |\n\n## 参考デザインパターン\n（推奨するデザインパターンや参考例）",
      variables: "対象画面の説明",
    },
  },
];

const CrudModal = ({ item, onSave, onDelete, onClose }) => {
  const [form, setForm] = useState(() => {
    if (item) return { ...item };
    return { title: "", c1: RAW.c1[0], c2: "", url: "", body: "", isNew: false, isUser: true };
  });
  const [sections, setSections] = useState(() => parseBody(form.body || ""));
  const [showAllSections, setShowAllSections] = useState(() => {
    const parsed = parseBody(form.body || "");
    return Object.keys(parsed).length > 1;
  });
  const [isMaximized, setIsMaximized] = useState(false);
  const modalRef = useRef(null);

  const isEdit = !!item;

  const isDirty = !isEdit && (form.title || Object.values(sections).some(v => v?.trim()));

  const handleClose = () => {
    if (isDirty && !window.confirm("入力中の内容が失われます。閉じてよいですか？")) return;
    onClose();
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') { handleClose(); return; }
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
      if (e.key === 'f' || e.key === 'F') { e.preventDefault(); setIsMaximized(v => !v); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isDirty]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setSec = (k, v) => setSections((s) => ({ ...s, [k]: v }));

  const handleSubmit = () => {
    if (!form.title) return;
    const body = showAllSections ? buildBody(sections) : (sections.instructions || "");
    onSave({ ...form, body });
  };

  // 変数プレビュー
  const bodyPreview = showAllSections ? buildBody(sections) : (sections.instructions || "");
  const detectedVars = [...new Set((bodyPreview.match(/\{([^}]+)\}/g) || []))];

  return createPortal(
    <div className="modal-backdrop run-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div ref={modalRef} className={`modal run-modal crud-modal ${isMaximized ? 'run-modal-maximized' : ''}`}>
        <div className="run-modal-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="run-modal-title">{isEdit ? "プロンプトを編集" : "新規プロンプトを追加"}</h2>
            <p className="run-modal-meta">{isEdit ? `#${item.id} の内容を変更します` : "作成したプロンプトはこのブラウザに保存されます"}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
            <button onClick={() => setIsMaximized(v => !v)} className="run-modal-icon-btn hide-mobile" title={isMaximized ? "元のサイズに戻す" : "全画面表示"}>
              {isMaximized ? <Icons.Restore /> : <Icons.Maximize />}
            </button>
            <button onClick={handleClose} className="run-modal-icon-btn" style={{ fontSize: '20px', color: 'var(--ink2)' }}>×</button>
          </div>
        </div>
        <div className="modal-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {!isEdit && (
            <div className="form-group">
              <label style={{ fontSize: '13px', color: 'var(--ink3)' }}>テンプレートから作成</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {PROMPT_SEEDS.map(seed => (
                  <button
                    key={seed.name}
                    type="button"
                    className="btn-action btn-outline"
                    style={{ fontSize: '12px', padding: '4px 10px', whiteSpace: 'nowrap' }}
                    onClick={() => {
                      set("title", seed.title);
                      set("c1", seed.c1);
                      set("c2", seed.c2);
                      setSections(seed.sections);
                      setShowAllSections(true);
                    }}
                  >
                    {seed.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="form-group">
            <label>タイトル *</label>
            <input className="form-control" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="例: 議事録を要約するプロンプト" autoFocus />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>カテゴリ（大）</label>
              <select className="form-control" value={form.c1} onChange={(e) => set("c1", e.target.value)}>
                {RAW.c1.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>カテゴリ（中）</label>
              <input className="form-control" list="crud-c2-options" value={form.c2} onChange={(e) => set("c2", e.target.value)} placeholder="例: 文書作成" />
              <datalist id="crud-c2-options">
                {RAW.c2.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0 16px' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <label style={{ fontWeight: 600, margin: 0 }}>プロンプト本文</label>
            <button
              type="button"
              className="btn-action btn-text"
              style={{ fontSize: '12px', padding: '2px 8px' }}
              onClick={() => setShowAllSections(!showAllSections)}
            >
              {showAllSections ? "シンプル入力に切替" : "セクション分割入力"}
            </button>
          </div>

          {!showAllSections ? (
            <div className="form-group">
              <textarea
                className="form-control"
                value={sections.instructions || ""}
                onChange={(e) => setSec("instructions", e.target.value)}
                placeholder={"プロンプト本文を入力してください\n{変数名} で変数を埋め込めます\n\n例:\n以下の{文章}を{出力形式}で要約してください。"}
                rows={8}
                style={{ minHeight: '160px', resize: 'vertical' }}
              />
            </div>
          ) : (
            PROMPT_SECTIONS.map(s => (
              <div className="form-group" key={s.key}>
                <label style={{ fontSize: '13px' }}>{s.label}</label>
                <textarea
                  className="form-control"
                  value={sections[s.key] || ""}
                  onChange={(e) => setSec(s.key, e.target.value)}
                  placeholder={s.placeholder}
                  rows={s.rows}
                  style={{ resize: 'vertical' }}
                />
              </div>
            ))
          )}

          {detectedVars.length > 0 && (
            <div style={{ fontSize: '12px', color: 'var(--ink3)', padding: '4px 0 8px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span>検出された変数:</span>
              {detectedVars.map(v => (
                <span key={v} style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '1px 6px', borderRadius: '4px', fontSize: '11px' }}>{v}</span>
              ))}
            </div>
          )}

          <div className="form-group">
            <label>URL（任意）</label>
            <input className="form-control" value={form.url || ""} onChange={(e) => set("url", e.target.value)} placeholder="https://..." />
          </div>

          <div className="modal-actions">
            {isEdit && <button className="btn-action btn-text" onClick={() => onDelete(item.id)}><Icons.Trash /> 削除</button>}
            <div style={{ flex: 1 }} />
            <button className="btn-action btn-outline" onClick={handleClose}>キャンセル</button>
            <button className="btn-action btn-primary" onClick={handleSubmit} disabled={!form.title}>{isEdit ? "保存" : "追加"}</button>
          </div>
        </div>
        {!isMaximized && <span className="resize-grip hide-mobile"><Icons.GripResize /></span>}
      </div>
    </div>,
    document.body
  );
};

export default CrudModal;
