import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./App.css";
import { RAW, INITIAL_PROMPTS } from "./data/prompts";
import contentsData from "./data/contents.json";

// ─── Constants & Helpers ───────────────────────────────────────────────────
const STORAGE_KEY = "nanyo_prompts_v5";
const PER_PAGE = 32;

const AI_TOOLS = [
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/', query: '?q=' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app', query: '?q=' },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai/', query: '' },
  { id: 'qwen', name: 'Qwen', url: 'https://chat.qwenlm.ai/', query: '' },
];

const CAT_COLORS = {
  "文章作成・要約": { bg: "#e0f2fe", fg: "#0369a1", darkBg: "rgba(3, 105, 161, 0.2)", darkFg: "#7dd3fc", icon: "✏️" },
  "文書校正・編集": { bg: "#fce7f3", fg: "#be185d", darkBg: "rgba(190, 24, 93, 0.2)", darkFg: "#f9a8d4", icon: "📝" },
  "アイデア創出・企画": { bg: "#fffbeb", fg: "#b45309", darkBg: "rgba(180, 83, 9, 0.2)", darkFg: "#fcd34d", icon: "💡" },
  "業務改善": { bg: "#dcfce7", fg: "#15803d", darkBg: "rgba(21, 128, 61, 0.2)", darkFg: "#86efac", icon: "⚙️" },
  "情報収集・分析": { bg: "#e0e7ff", fg: "#4338ca", darkBg: "rgba(67, 56, 202, 0.2)", darkFg: "#a5b4fc", icon: "🔍" },
  "コミュニケーション支援": { bg: "#f3e8ff", fg: "#7e22ce", darkBg: "rgba(126, 34, 206, 0.2)", darkFg: "#d8b4fe", icon: "💬" },
  "プログラミング": { bg: "#cffafe", fg: "#0e7490", darkBg: "rgba(14, 116, 144, 0.2)", darkFg: "#67e8f9", icon: "💻" },
  "意識改革・スキルアップ": { bg: "#ffedd5", fg: "#c2410c", darkBg: "rgba(194, 65, 12, 0.2)", darkFg: "#fdba74", icon: "🚀" },
  "その他": { bg: "#f1f5f9", fg: "#475569", darkBg: "rgba(71, 85, 105, 0.2)", darkFg: "#cbd5e1", icon: "📌" },
};

const getColor = (c1, isDark) => {
  const cfg = CAT_COLORS[c1] || CAT_COLORS["その他"];
  return isDark ? { bg: cfg.darkBg, fg: cfg.darkFg, icon: cfg.icon } : cfg;
};

// ─── Icons ───────────────────────────────────────────────────────────────────
const Icons = {
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  Grid: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  List: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Plus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  External: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  Copy: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Ai: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Settings: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Sparkles: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.91 5.81L21 12l-7.09 3.19L12 21l-1.91-5.81L3 12l7.09-3.19L12 3z"/></svg>
};

// ─── Modal: PromptRunModal ──────────────────────────────────────────────────
const PromptRunModal = ({ item, onClose, selectedAiTool, setSelectedAiTool }) => {
  const [showSettings, setShowSettings] = useState(false);
  // コンテンツ解析: 本文抽出、セクション変数抽出、UI混入テキスト除去
  const { promptText, inlinePlaceholders, additionalVars, allPlaceholders } = useMemo(() => {
    let content = (contentsData[item.id] || "プロンプトの本文が読み込めませんでした。")
      .replace(/[\s]*戻る[\s]*プロンプト作成[\s]*クリップボードにコピーされます。[\s]*$/, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');

    // 「変数設定」「ユーザー入力」セクションから変数名を抽出
    const sectionRegex = /\n*(?:変数設定|ユーザー入力)\n([\s\S]*?)(?=\n+補足\n|$)/;
    const sectionMatch = content.match(sectionRegex);
    let sectionVars = [];
    if (sectionMatch) {
      sectionVars = sectionMatch[1]
        .split(/\n\n+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      content = content.replace(sectionRegex, '');
    }

    content = content.replace(/\n{3,}/g, '\n\n').trim();

    // テキスト内の {変数} プレースホルダー抽出
    const inlineMatches = content.match(/\{([^}]+)\}/g) || [];
    const inline = [...new Set(inlineMatches.map(m => m.slice(1, -1)))];

    // セクションにのみ存在する追加変数（テキスト内に {var} がないもの）
    const additional = sectionVars.filter(v => !inline.includes(v));

    return {
      promptText: content,
      inlinePlaceholders: inline,
      additionalVars: additional,
      allPlaceholders: [...inline, ...additional],
    };
  }, [item.id]);

  const [values, setValues] = useState(() => {
    const initial = {};
    allPlaceholders.forEach(p => { initial[p] = ""; });
    return initial;
  });

  const [copyStatus, setCopyStatus] = useState(false);
  const [pasteStatus, setPasteStatus] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // クリップボード用テキスト: インライン変数を置換 + 追加変数を末尾に付加
  const finalPromptText = useMemo(() => {
    let result = promptText;
    inlinePlaceholders.forEach(key => {
      const regex = new RegExp(`\\{${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`, 'g');
      result = result.replace(regex, values[key] || `{${key}}`);
    });
    if (additionalVars.length > 0) {
      const parts = additionalVars.map(key => `${key}: ${values[key] || `{${key}}`}`);
      result += '\n\n' + parts.join('\n');
    }
    return result;
  }, [promptText, values, inlinePlaceholders, additionalVars]);

  // プレビュー描画: インライン変数ハイライト + 追加変数表示
  const renderPreview = () => {
    let parts = [promptText];
    inlinePlaceholders.forEach(p => {
      const newParts = [];
      const token = `{${p}}`;
      const val = values[p] || "";
      parts.forEach(part => {
        if (typeof part !== 'string') { newParts.push(part); return; }
        const subParts = part.split(token);
        for (let i = 0; i < subParts.length; i++) {
          newParts.push(subParts[i]);
          if (i < subParts.length - 1) {
            newParts.push(
              <span key={`${p}-${i}`} style={{
                color: val ? '#2563eb' : '#e11d48', fontWeight: '700',
                backgroundColor: val ? 'var(--primary-light)' : 'rgba(225, 29, 72, 0.1)',
                padding: '0 2px', borderRadius: '2px', borderBottom: `2px solid ${val ? '#2563eb' : '#e11d48'}`
              }}>
                {val || token}
              </span>
            );
          }
        }
      });
      parts = newParts;
    });
    if (additionalVars.length > 0) {
      parts.push('\n\n');
      additionalVars.forEach((p, idx) => {
        const val = values[p] || "";
        parts.push(
          <span key={`append-${p}`}>
            <span style={{ fontWeight: '600' }}>{p}: </span>
            <span style={{
              color: val ? '#2563eb' : '#e11d48', fontWeight: '700',
              backgroundColor: val ? 'var(--primary-light)' : 'rgba(225, 29, 72, 0.1)',
              padding: '0 2px', borderRadius: '2px', borderBottom: `2px solid ${val ? '#2563eb' : '#e11d48'}`
            }}>
              {val || `{${p}}`}
            </span>
            {idx < additionalVars.length - 1 ? '\n' : ''}
          </span>
        );
      });
    }
    return parts;
  };

  const handleCopy = () => {
    const textArea = document.createElement("textarea");
    textArea.value = finalPromptText;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    } catch (err) { console.error('Copy failed', err); }
    document.body.removeChild(textArea);
  };

  const handleAiPaste = () => {
    handleCopy();
    const tool = AI_TOOLS.find(t => t.id === selectedAiTool) || AI_TOOLS[0];
    let url = tool.url;
    if (tool.query) {
      url += tool.query + encodeURIComponent(finalPromptText);
    }
    window.open(url, '_blank');
    setPasteStatus(true);
    setTimeout(() => setPasteStatus(false), 2000);
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '1100px', height: '90vh' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--card)', zIndex: 10, flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h2>
            <p style={{ fontSize: '11px', color: 'var(--ink3)', margin: '4px 0 0' }}>#{item.id} - {item.c1} / {item.c2}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              onClick={() => setShowSettings(!showSettings)} 
              style={{ border: 'none', background: showSettings ? 'var(--primary-light)' : 'transparent', borderRadius: '6px', cursor: 'pointer', color: showSettings ? 'var(--primary)' : 'var(--ink3)', padding: '6px', display: 'flex' }}
              title="AIツールの設定"
            >
              <Icons.Settings />
            </button>
            <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: '24px', cursor: 'pointer', color: 'var(--ink2)', padding: '4px' }}>×</button>
          </div>
        </div>
        
        {showSettings && (
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg)', animation: 'modal-in 0.2s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink2)' }}>貼り付け先AIツール:</span>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {AI_TOOLS.map(tool => (
                  <button 
                    key={tool.id}
                    onClick={() => setSelectedAiTool(tool.id)}
                    className={`chip ${selectedAiTool === tool.id ? 'active' : ''}`}
                    style={{ padding: '4px 12px' }}
                  >
                    {tool.name}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--ink3)', margin: 0, flex: '1 0 100%' }}>※ 一部のツールではURLから直接プロンプトを入力できない場合があります。その際は手動で貼り付けてください。</p>
            </div>
          </div>
        )}

        <div className={`modal-content-wrapper ${allPlaceholders.length > 0 ? 'has-form' : ''}`}>
          {allPlaceholders.length > 0 && (
            <div className="prompt-form">
              <div style={{ marginBottom: '20px', padding: '10px 12px', background: 'var(--primary-light)', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: 'var(--primary)' }}>情報を入力してください。プレビューに反映されます。</p>
              </div>
              {allPlaceholders.map(p => (
                <div key={p} className="form-group" style={{ marginBottom: '16px' }}>
                  <label>{p}</label>
                  <textarea className="prompt-textarea" placeholder={`ここに${p}を入力してください`} value={values[p] || ""} onChange={(e) => setValues(prev => ({ ...prev, [p]: e.target.value }))} />
                </div>
              ))}
            </div>
          )}
          <div className="prompt-preview">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexShrink: 0 }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ink2)', margin: 0 }}>プロンプト プレビュー</h3>
              <span style={{ fontSize: '10px', color: 'var(--ink3)' }}>挿入箇所は自動的に置換されます</span>
            </div>
            <div className="preview-box">{renderPreview()}</div>
          </div>
        </div>
        <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px', backgroundColor: 'var(--card)', zIndex: 10, flexShrink: 0, flexWrap: 'wrap' }}>
          <button className="btn-action btn-outline" onClick={onClose} style={{ flex: '0 0 auto', width: 'auto', padding: '0 20px' }}>キャンセル</button>
          <div style={{ flex: 1 }} className="desktop-spacer" />
          <button className="btn-action btn-outline" onClick={handleAiPaste} style={{ flex: '1 1 200px', fontSize: '15px', fontWeight: '700', height: '48px', borderRadius: '10px', borderColor: 'var(--primary)', color: 'var(--primary)' }}>
            {pasteStatus ? "貼り付け先に移動中..." : <><Icons.Sparkles /> AI Tool貼付</>}
          </button>
          <button className="btn-action btn-primary" onClick={handleCopy} style={{ flex: '1 1 200px', fontSize: '15px', fontWeight: '700', height: '48px', borderRadius: '10px' }}>
            {copyStatus ? "コピーしました！" : <><Icons.Copy /> 完成させてコピー</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Modal: CrudModal ────────────────────────────────────────────────────────
const CrudModal = ({ item, onSave, onDelete, onClose }) => {
  const [form, setForm] = useState(item || { title: "", c1: RAW.c1[0], c2: "", url: "", isNew: false, isUser: true });
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isEdit = !!item;
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? "プロンプトを編集" : "新規プロンプトを追加"}</h2>
          <p>{isEdit ? `#${item.id} の内容を変更します` : "オリジナルのプロンプトを登録できます"}</p>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>タイトル *</label>
            <input className="form-control" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="例: 議事録を要約するプロンプト" autoFocus />
          </div>
          <div className="form-group">
            <label>カテゴリ（大）</label>
            <select className="form-control" value={form.c1} onChange={(e) => set("c1", e.target.value)}>
              {RAW.c1.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>カテゴリ（中）</label>
            <input className="form-control" value={form.c2} onChange={(e) => set("c2", e.target.value)} placeholder="例: 文書作成" />
          </div>
          <div className="form-group">
            <label>URL（任意）</label>
            <input className="form-control" value={form.url || ""} onChange={(e) => set("url", e.target.value)} placeholder="https://..." />
          </div>
          <div className="modal-actions">
            {isEdit && <button className="btn-action btn-text" onClick={() => onDelete(item.id)}><Icons.Trash /> 削除</button>}
            <div style={{ flex: 1 }} />
            <button className="btn-action btn-outline" onClick={onClose}>キャンセル</button>
            <button className="btn-action btn-primary" onClick={() => form.title && onSave(form)} disabled={!form.title}>{isEdit ? "保存" : "追加"}</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────
export default function App() {
  const [prompts, setPrompts] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [activeC1, setActiveC1] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showFav, setShowFav] = useState(false);
  const [favs, setFavs] = useState(new Set());
  const [viewMode, setViewMode] = useState("grid");
  const [darkMode, setDarkMode] = useState(false);
  const [modal, setModal] = useState(null); 
  const [runModal, setRunModal] = useState(null); 
  const [page, setPage] = useState(0);
  const [nextId, setNextId] = useState(3000);
  const [selectedAiTool, setSelectedAiTool] = useState(AI_TOOLS[0].id);
  const [useQuery, setUseQuery] = useState(true);
  const searchRef = useRef(null);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY + "_theme");
      if (savedTheme === "dark" || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setDarkMode(true);
        document.body.classList.add('dark');
      }
      const savedFavs = localStorage.getItem(STORAGE_KEY + "_favs");
      if (savedFavs) setFavs(new Set(JSON.parse(savedFavs)));
      const savedData = localStorage.getItem(STORAGE_KEY + "_data");
      if (savedData) { setPrompts(JSON.parse(savedData)); } else { setPrompts(INITIAL_PROMPTS); }
      
      const savedAiTool = localStorage.getItem(STORAGE_KEY + "_ai_tool");
      if (savedAiTool) setSelectedAiTool(savedAiTool);

      const savedUseQuery = localStorage.getItem(STORAGE_KEY + "_use_query");
      if (savedUseQuery !== null) setUseQuery(savedUseQuery === "true");
    } catch(e) { console.error(e); setPrompts(INITIAL_PROMPTS); }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (darkMode) { document.body.classList.add('dark'); localStorage.setItem(STORAGE_KEY + "_theme", "dark"); } 
    else { document.body.classList.remove('dark'); localStorage.setItem(STORAGE_KEY + "_theme", "light"); }
  }, [darkMode]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY + "_data", JSON.stringify(prompts));
      localStorage.setItem(STORAGE_KEY + "_favs", JSON.stringify([...favs]));
      localStorage.setItem(STORAGE_KEY + "_ai_tool", selectedAiTool);
      localStorage.setItem(STORAGE_KEY + "_use_query", String(useQuery));
    }
  }, [prompts, favs, isLoaded, selectedAiTool, useQuery]);

  const filtered = useMemo(() => {
    let list = prompts;
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || String(p.id).includes(q) || p.c1.toLowerCase().includes(q));
    }
    if (activeC1) list = list.filter(p => p.c1 === activeC1);
    if (showNew) list = list.filter(p => p.isNew);
    if (showFav) list = list.filter(p => favs.has(p.id));
    return list;
  }, [prompts, query, activeC1, showNew, showFav, favs]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  useEffect(() => setPage(0), [query, activeC1, showNew, showFav]);

  const toggleFav = (id) => { setFavs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
  const handleSave = (form) => {
    if (form.id) { setPrompts(prev => prev.map(p => p.id === form.id ? {...p, ...form} : p)); } 
    else { const newP = { ...form, id: nextId, isUser: true }; setPrompts(prev => [newP, ...prev]); setNextId(n => n + 1); }
    setModal(null);
  };
  const handleDelete = (id) => { if(window.confirm("削除しますか？")) { setPrompts(prev => prev.filter(p => p.id !== id)); setModal(null); } };

  if (!isLoaded) return <div style={{padding:40, textAlign:'center'}}>Loading...</div>;

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <h1>南陽市DX <span>Prompts</span></h1>
            <p>生成AI活用実例集 745+ ({prompts.length})</p>
          </div>
          <div className="header-controls">
            <button className={`btn-icon ${darkMode ? 'active' : ''}`} onClick={()=>setDarkMode(!darkMode)}>{darkMode ? '🌙' : '☀️'}</button>
            <button className={`btn-icon ${viewMode==='grid'?'active':''}`} onClick={()=>setViewMode('grid')}><Icons.Grid /></button>
            <button className={`btn-icon ${viewMode==='list'?'active':''}`} onClick={()=>setViewMode('list')}><Icons.List /></button>
            <button className="btn-icon btn-add" onClick={()=>setModal("add")}><Icons.Plus /> 追加</button>
          </div>
        </div>
      </header>
      <div className="search-container">
        <div className="search-box">
          <span className="search-icon"><Icons.Search /></span>
          <input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="キーワード、ID、カテゴリで検索..." />
          {query && <button className="search-clear" onClick={()=>{setQuery("");searchRef.current?.focus()}}>×</button>}
        </div>
      </div>
      <div className="filters">
        <button className={`chip ${!activeC1 && !showNew && !showFav ? 'active' : ''}`} onClick={()=>{setActiveC1("");setShowNew(false);setShowFav(false)}}>
          すべて <span className="chip-count">{prompts.length}</span>
        </button>
        {RAW.c1.map(c => (
          <button key={c} className={`chip ${activeC1 === c ? 'active' : ''}`} onClick={()=>{setActiveC1(activeC1===c?"":c);setShowNew(false);setShowFav(false)}}>
            {CAT_COLORS[c]?.icon} {c}
          </button>
        ))}
        <button className={`chip chip-new ${showNew ? 'active' : ''}`} onClick={()=>{setShowNew(!showNew);setActiveC1("");setShowFav(false)}}>🆕 新着</button>
        <button className={`chip ${showFav ? 'active' : ''}`} onClick={()=>{setShowFav(!showFav);setActiveC1("");setShowNew(false)}} style={showFav?{background:'#fee2e2',color:'#ef4444',borderColor:'#ef4444'}:{}}>♥ お気に入り</button>
      </div>
      <div className={`grid ${viewMode === 'list' ? 'list' : ''}`}>
        {paged.length === 0 ? (
          <div className="empty-state"><span className="empty-icon">📂</span><p>見つかりませんでした</p></div>
        ) : (
          paged.map((p, idx) => {
            const col = getColor(p.c1, darkMode);
            return (
              <div
                key={p.id}
                className={`card ${viewMode==='list'?'list-mode':''}`}
                onClick={() => p.isUser && setModal(p)}
                style={{ cursor: p.isUser ? 'pointer' : 'default', '--i': idx }}
              >
                <button className={`fav-btn ${favs.has(p.id)?'active':''}`} onClick={(e)=>{e.stopPropagation();toggleFav(p.id)}}>{favs.has(p.id)?'♥':'♡'}</button>
                <div className="card-body">
                  <div className="card-meta"><span className="card-id">#{p.id}</span>{p.isNew && <span className="card-new-badge">NEW</span>}</div>
                  <h3 className="card-title">{p.title}</h3>
                  <div className="card-tags">
                    <span className="tag" style={{background:col.bg, color:col.fg}}>{col.icon} {p.c1}</span>
                    {p.c2 && p.c2 !== p.c1 && <span className="tag" style={{background:'var(--primary-light)', color:'var(--ink2)'}}>{p.c2}</span>}
                  </div>
                </div>
                <div className="card-footer" onClick={(e) => e.stopPropagation()}>
                  {p.url ? (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn-action btn-outline"><Icons.External /> 公式</a>
                  ) : (
                    <a href={p.searchUrl} target="_blank" rel="noopener noreferrer" className="btn-action btn-outline"><Icons.Search /> 検索</a>
                  )}
                  <button className="btn-action btn-primary" onClick={() => setRunModal(p)}><Icons.Ai /> AIで実行</button>
                </div>
              </div>
            );
          })
        )}
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-link" disabled={page===0} onClick={()=>setPage(page-1)}>←</button>
          {Array.from({length: Math.min(5, totalPages)}, (_,i) => {
            let p = page - 2 + i;
            if (page < 2) p = i;
            if (page > totalPages - 3) p = totalPages - 5 + i;
            if (p < 0 || p >= totalPages) return null;
            return <button key={p} className={`page-link ${page===p?'active':''}`} onClick={()=>setPage(p)}>{p+1}</button>
          })}
          <button className="page-link" disabled={page>=totalPages-1} onClick={()=>setPage(page+1)}>→</button>
        </div>
      )}
      {modal && <CrudModal item={modal==="add"?null:modal} onClose={()=>setModal(null)} onSave={handleSave} onDelete={handleDelete} />}
      {runModal && (
        <PromptRunModal 
          item={runModal} 
          onClose={()=>setRunModal(null)} 
          selectedAiTool={selectedAiTool}
          setSelectedAiTool={setSelectedAiTool}
        />
      )}
    </div>
  );
}