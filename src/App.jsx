
import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import "./App.css";
import { RAW, INITIAL_PROMPTS } from "./data/prompts";
import contentsData from "./data/contents.json";

// ─── Constants & Helpers ───────────────────────────────────────────────────
const STORAGE_KEY = "nanyo_prompts_v4";
const PER_PAGE = 32;

const CAT_COLORS = {
  "文章作成・要約": { bg: "#e0f2fe", fg: "#0369a1", icon: "✏️" },
  "文書校正・編集": { bg: "#fce7f3", fg: "#be185d", icon: "📝" },
  "アイデア創出・企画": { bg: "#fffbeb", fg: "#b45309", icon: "💡" },
  "業務改善": { bg: "#dcfce7", fg: "#15803d", icon: "⚙️" },
  "情報収集・分析": { bg: "#e0e7ff", fg: "#4338ca", icon: "🔍" },
  "コミュニケーション支援": { bg: "#f3e8ff", fg: "#7e22ce", icon: "💬" },
  "プログラミング": { bg: "#cffafe", fg: "#0e7490", icon: "💻" },
  "意識改革・スキルアップ": { bg: "#ffedd5", fg: "#c2410c", icon: "🚀" },
  "その他": { bg: "#f1f5f9", fg: "#475569", icon: "📌" },
};

const getColor = (c1) => CAT_COLORS[c1] || CAT_COLORS["その他"];

// ─── Icons ───────────────────────────────────────────────────────────────────
const Icons = {
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  Grid: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  List: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Plus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  External: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  Copy: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Ai: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
};

// ─── Modal: PromptRunModal ──────────────────────────────────────────────────
const PromptRunModal = ({ item, onClose }) => {
  const rawContent = contentsData[item.id] || "プロンプトの本文が読み込めませんでした。";
  
  const placeholders = useMemo(() => {
    const matches = rawContent.match(/\{([^}]+)\}/g) || [];
    return [...new Set(matches.map(m => m.slice(1, -1)))];
  }, [rawContent]);

  const [values, setValues] = useState({});
  const [copyStatus, setCopyStatus] = useState(false);

  useEffect(() => {
    const initialValues = {};
    placeholders.forEach(p => {
      initialValues[p] = "";
    });
    setValues(initialValues);
  }, [placeholders]);

  // クリップボード用の純粋なテキスト
  const finalPromptText = useMemo(() => {
    let result = rawContent;
    Object.entries(values).forEach(([key, val]) => {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\{${escapedKey}\\}`, 'g');
      result = result.replace(regex, val || `{${key}}`);
    });
    return result;
  }, [rawContent, values]);

  // プレビュー表示用のリッチテキスト（挿入箇所を強調）
  const renderPreview = () => {
    let parts = [rawContent];
    placeholders.forEach(p => {
      const newParts = [];
      const token = `{${p}}`;
      parts.forEach(part => {
        if (typeof part !== 'string') {
          newParts.push(part);
          return;
        }
        const subParts = part.split(token);
        for (let i = 0; i < subParts.length; i++) {
          newParts.push(subParts[i]);
          if (i < subParts.length - 1) {
            newParts.push(
              <span key={`${p}-${i}`} style={{ 
                color: values[p] ? '#2563eb' : '#e11d48', 
                fontWeight: '700',
                backgroundColor: values[p] ? '#eff6ff' : '#fff1f2',
                padding: '0 2px',
                borderRadius: '2px',
                borderBottom: `2px solid ${values[p] ? '#2563eb' : '#e11d48'}`
              }}>
                {values[p] || token}
              </span>
            );
          }
        }
      });
      parts = newParts;
    });
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
    } catch (err) {
      console.error('Copy failed', err);
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '1000px', width: '95%', display: 'flex', flexDirection: 'column', maxHeight: '95vh', padding: '0', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', zIndex: 10 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>{item.title}</h2>
            <p style={{ fontSize: '12px', color: 'var(--ink3)', margin: '4px 0 0' }}>#{item.id} - {item.c1} / {item.c2}</p>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: placeholders.length > 0 ? '400px 1fr' : '1fr', flex: 1, overflow: 'hidden' }}>
          
          {/* Left: Input Form */}
          {placeholders.length > 0 && (
            <div className="prompt-form" style={{ padding: '24px', overflowY: 'auto', borderRight: '1px solid var(--border)', backgroundColor: '#fff' }}>
              <div style={{ marginBottom: '20px', padding: '12px', background: 'var(--primary-light)', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--primary-dark)' }}>
                  以下の項目を入力してください。右側のプレビューにリアルタイムで反映されます。
                </p>
              </div>
              {placeholders.map(p => (
                <div key={p} className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '700', display: 'block', marginBottom: '8px', color: 'var(--ink)' }}>{p}</label>
                  <textarea 
                    className="form-control" 
                    style={{ 
                      minHeight: '100px', 
                      borderRadius: '8px', 
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#fff5f5', // 原盤に近い薄いピンク
                      padding: '12px',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => e.target.style.backgroundColor = '#fff'}
                    onBlur={(e) => { if(!values[p]) e.target.style.backgroundColor = '#fff5f5' }}
                    placeholder={`ここに${p}を入力してください`}
                    value={values[p] || ""}
                    onChange={(e) => setValues(prev => ({ ...prev, [p]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Right: Preview */}
          <div className="prompt-preview" style={{ background: '#f8fafc', padding: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--ink2)', margin: 0 }}>プロンプト プレビュー</h3>
              <span style={{ fontSize: '11px', color: 'var(--ink3)' }}>プレースホルダー部分は自動的に差し替わります</span>
            </div>
            <div style={{ 
              flex: 1, 
              background: '#fff', 
              borderRadius: '12px', 
              padding: '24px', 
              fontSize: '14px', 
              lineHeight: '1.7', 
              whiteSpace: 'pre-wrap', 
              overflowY: 'auto',
              border: '1px solid var(--border)',
              boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.05)',
              fontFamily: 'monospace',
              color: '#334155'
            }}>
              {renderPreview()}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px', backgroundColor: '#fff', zIndex: 10 }}>
          <button className="btn-action btn-outline" onClick={onClose} style={{ maxWidth: '120px' }}>キャンセル</button>
          <div style={{ flex: 1 }} />
          <button 
            className="btn-action btn-primary" 
            onClick={handleCopy} 
            style={{ minWidth: '300px', fontSize: '16px', fontWeight: '700', height: '52px', borderRadius: '10px' }}
          >
            {copyStatus ? "クリップボードにコピーしました！" : <><Icons.Copy /> プロンプトを完成させてコピー</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal: CrudModal ────────────────────────────────────────────────────────
const CrudModal = ({ item, onSave, onDelete, onClose }) => {
  const [form, setForm] = useState(item || {
    title: "", c1: RAW.c1[0], c2: "", url: "", isNew: false, isUser: true,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isEdit = !!item;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{isEdit ? "プロンプトを編集" : "新規プロンプトを追加"}</h2>
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
          <label>URL (任意)</label>
          <input className="form-control" value={form.url || ""} onChange={(e) => set("url", e.target.value)} placeholder="https://..." />
        </div>
        <div className="modal-actions">
          {isEdit && <button className="btn-action btn-text" style={{ color: '#ef4444' }} onClick={() => onDelete(item.id)}><Icons.Trash /> 削除</button>}
          <div style={{ flex: 1 }} />
          <button className="btn-action btn-outline" onClick={onClose}>キャンセル</button>
          <button className="btn-action btn-primary" onClick={() => form.title && onSave(form)} disabled={!form.title}>{isEdit ? "保存" : "追加"}</button>
        </div>
      </div>
    </div>
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
  const [modal, setModal] = useState(null); 
  const [runModal, setRunModal] = useState(null); 
  const [page, setPage] = useState(0);
  const [nextId, setNextId] = useState(3000);
  const searchRef = useRef(null);

  // Load Data
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem(STORAGE_KEY + "_favs");
      if (savedFavs) setFavs(new Set(JSON.parse(savedFavs)));
      const savedData = localStorage.getItem(STORAGE_KEY + "_data");
      if (savedData) {
        setPrompts(JSON.parse(savedData));
      } else {
        setPrompts(INITIAL_PROMPTS);
      }
    } catch(e) {
      console.error(e);
      setPrompts(INITIAL_PROMPTS);
    }
    setIsLoaded(true);
  }, []);

  // Save Data
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY + "_data", JSON.stringify(prompts));
      localStorage.setItem(STORAGE_KEY + "_favs", JSON.stringify([...favs]));
    }
  }, [prompts, favs, isLoaded]);

  // Filter
  const filtered = useMemo(() => {
    let list = prompts;
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) || 
        String(p.id).includes(q) || 
        p.c1.toLowerCase().includes(q)
      );
    }
    if (activeC1) list = list.filter(p => p.c1 === activeC1);
    if (showNew) list = list.filter(p => p.isNew);
    if (showFav) list = list.filter(p => favs.has(p.id));
    return list;
  }, [prompts, query, activeC1, showNew, showFav, favs]);

  // Paging
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  useEffect(() => setPage(0), [query, activeC1, showNew, showFav]);

  // Actions
  const toggleFav = (id) => {
    setFavs(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleSave = (form) => {
    if (form.id) {
      setPrompts(prev => prev.map(p => p.id === form.id ? {...p, ...form} : p));
    } else {
      const newP = { ...form, id: nextId, isUser: true };
      setPrompts(prev => [newP, ...prev]);
      setNextId(n => n + 1);
    }
    setModal(null);
  };

  const handleDelete = (id) => {
    if(window.confirm("削除しますか？")) {
      setPrompts(prev => prev.filter(p => p.id !== id));
      setModal(null);
    }
  };

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
            <button className={`btn-icon ${viewMode==='grid'?'active':''}`} onClick={()=>setViewMode('grid')}><Icons.Grid /></button>
            <button className={`btn-icon ${viewMode==='list'?'active':''}`} onClick={()=>setViewMode('list')}><Icons.List /></button>
            <button className="btn-icon btn-add" onClick={()=>setModal("add")}><Icons.Plus /> 追加</button>
          </div>
        </div>
      </header>

      <div className="search-container">
        <div className="search-box">
          <span className="search-icon"><Icons.Search /></span>
          <input 
            ref={searchRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="キーワード、ID、カテゴリで検索..."
          />
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
        <button className={`chip chip-new ${showNew ? 'active' : ''}`} onClick={()=>{setShowNew(!showNew);setActiveC1("");setShowFav(false)}}>
          🆕 新着
        </button>
        <button className={`chip ${showFav ? 'active' : ''}`} onClick={()=>{setShowFav(!showFav);setActiveC1("");setShowNew(false)}} style={showFav?{background:'#fee2e2',color:'#ef4444',borderColor:'#ef4444'}:{}}>
          ♥ お気に入り
        </button>
      </div>

      <div className={`grid ${viewMode === 'list' ? 'list' : ''}`}>
        {paged.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📂</span>
            <p>見つかりませんでした</p>
          </div>
        ) : (
          paged.map(p => {
            const col = getColor(p.c1);
            return (
              <div key={p.id} className={`card ${viewMode==='list'?'list-mode':''}`} onClick={()=>p.isUser && setModal(p)}>
                <button className={`fav-btn ${favs.has(p.id)?'active':''}`} onClick={(e)=>{e.stopPropagation();toggleFav(p.id)}}>
                  {favs.has(p.id)?'♥':'♡'}
                </button>
                <div className="card-body">
                  <div className="card-meta">
                    <span className="card-id">#{p.id}</span>
                    {p.isNew && <span className="card-new-badge">NEW</span>}
                  </div>
                  <h3 className="card-title">{p.title}</h3>
                  <div className="card-tags">
                    <span className="tag" style={{background:col.bg, color:col.fg}}>{col.icon} {p.c1}</span>
                    {p.c2 && <span className="tag" style={{background:'#f1f5f9', color:'#475569'}}>{p.c2}</span>}
                  </div>
                </div>
                <div className="card-footer">
                  {p.url ? (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn-action btn-outline" onClick={e=>e.stopPropagation()}>
                      <Icons.External /> 公式
                    </a>
                  ) : (
                    <a href={p.searchUrl} target="_blank" rel="noopener noreferrer" className="btn-action btn-outline" onClick={e=>e.stopPropagation()}>
                      <Icons.Search /> 検索
                    </a>
                  )}
                  <button className="btn-action btn-primary" onClick={(e)=>{e.stopPropagation();setRunModal(p)}}>
                    <Icons.Ai /> AIで実行
                  </button>
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
      {runModal && <PromptRunModal item={runModal} onClose={()=>setRunModal(null)} />}
    </div>
  );
}
