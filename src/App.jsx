import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./App.css";
import { RAW, INITIAL_PROMPTS } from "./data/prompts";
import contentsData from "./data/contents.json";
import { searchPrompts, SEARCH_MODES } from "./utils/search";

// ─── Constants & Helpers ───────────────────────────────────────────────────
const STORAGE_KEY = "nanyo_prompts_v5";
const PER_PAGE = 32;
const MAX_QUERY_LENGTH = 2000; // URLクエリの安全な上限文字数

const AI_TOOLS = [
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/', query: '' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app', query: '' },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai/new', query: '' },
  { id: 'qwen', name: 'Qwen', url: 'https://chat.qwenlm.ai/', query: '' },
];

// ─── Icons ───────────────────────────────────────────────────────────────────
const Icons = {
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  Grid: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  List: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Plus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  External: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  Copy: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Ai: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.91 5.81L21 12l-7.09 3.19L12 21l-1.91-5.81L3 12l7.09-3.19L12 3z"/></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Settings: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Sparkles: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.91 5.81L21 12l-7.09 3.19L12 21l-1.91-5.81L3 12l7.09-3.19L12 3z"/></svg>,
  // Category icons
  Pen: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>,
  FileCheck: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>,
  Lightbulb: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>,
  Wrench: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  BarChart: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  MessageCircle: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
  Code: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  TrendingUp: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  TagIcon: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>,
  // UI icons
  Sun: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Moon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Heart: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>,
  HeartFilled: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>,
  FolderOpen: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/></svg>,
  Zap: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
};

// Category icon mapping
const CAT_ICON_MAP = {
  "文章作成・要約": Icons.Pen,
  "文書校正・編集": Icons.FileCheck,
  "アイデア創出・企画": Icons.Lightbulb,
  "業務改善": Icons.Wrench,
  "情報収集・分析": Icons.BarChart,
  "コミュニケーション支援": Icons.MessageCircle,
  "プログラミング": Icons.Code,
  "意識改革・スキルアップ": Icons.TrendingUp,
  "その他": Icons.TagIcon,
};
const CatIcon = ({ cat }) => { const Icon = CAT_ICON_MAP[cat]; return Icon ? <span className="cat-icon"><Icon /></span> : null; };

const CAT_COLORS = {
  "文章作成・要約": { bg: "#e0f2fe", fg: "#0369a1", darkBg: "rgba(3, 105, 161, 0.25)", darkFg: "#7dd3fc" },
  "文書校正・編集": { bg: "#fce7f3", fg: "#be185d", darkBg: "rgba(190, 24, 93, 0.25)", darkFg: "#f9a8d4" },
  "アイデア創出・企画": { bg: "#fffbeb", fg: "#b45309", darkBg: "rgba(180, 83, 9, 0.25)", darkFg: "#fcd34d" },
  "業務改善": { bg: "#dcfce7", fg: "#15803d", darkBg: "rgba(21, 128, 61, 0.25)", darkFg: "#86efac" },
  "情報収集・分析": { bg: "#e0e7ff", fg: "#4338ca", darkBg: "rgba(67, 56, 202, 0.25)", darkFg: "#a5b4fc" },
  "コミュニケーション支援": { bg: "#f3e8ff", fg: "#7e22ce", darkBg: "rgba(126, 34, 206, 0.25)", darkFg: "#d8b4fe" },
  "プログラミング": { bg: "#cffafe", fg: "#0e7490", darkBg: "rgba(14, 116, 144, 0.25)", darkFg: "#67e8f9" },
  "意識改革・スキルアップ": { bg: "#ffedd5", fg: "#c2410c", darkBg: "rgba(194, 65, 12, 0.25)", darkFg: "#fdba74" },
  "その他": { bg: "#f1f5f9", fg: "#475569", darkBg: "rgba(71, 85, 105, 0.25)", darkFg: "#cbd5e1" },
};

const getColor = (c1, isDark) => {
  const cfg = CAT_COLORS[c1] || CAT_COLORS["その他"];
  return isDark ? { bg: cfg.darkBg, fg: cfg.darkFg } : cfg;
};

// ─── Modal: PromptRunModal ──────────────────────────────────────────────────
const PromptRunModal = ({ item, onClose, selectedAiTool, setSelectedAiTool, useQuery, setUseQuery }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [mobileTab, setMobileTab] = useState("preview"); // "preview" | "form"
  const [isMaximized, setIsMaximized] = useState(false);
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
  const [editedPrompt, setEditedPrompt] = useState("");

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

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

  // ─── Prevent body scroll when modal is open ───
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

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

  // editedPromptを初期化・同期
  useEffect(() => {
    setEditedPrompt(finalPromptText);
  }, [finalPromptText]);

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
                color: val ? 'var(--primary)' : 'var(--danger)', fontWeight: '700',
                backgroundColor: val ? 'var(--primary-light)' : 'rgba(239, 68, 68, 0.08)',
                padding: '0 2px', borderRadius: '2px', borderBottom: `2px solid ${val ? 'var(--primary)' : 'var(--danger)'}`
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
              color: val ? 'var(--primary)' : 'var(--danger)', fontWeight: '700',
              backgroundColor: val ? 'var(--primary-light)' : 'rgba(239, 68, 68, 0.08)',
              padding: '0 2px', borderRadius: '2px', borderBottom: `2px solid ${val ? 'var(--primary)' : 'var(--danger)'}`
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

  return createPortal(
    <div className="modal-backdrop run-modal-backdrop" onClick={onClose}>
      <div className={`modal run-modal ${isMaximized ? 'run-modal-maximized' : ''}`} onClick={(e) => e.stopPropagation()}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '10px', color: 'var(--ink3)' }}>編集可能</span>
                <button
                  className="preview-maximize-btn"
                  onClick={() => setIsMaximized(!isMaximized)}
                  title={isMaximized ? "元に戻す" : "全画面プレビュー"}
                >
                  {isMaximized ? '⊟' : '⊞'}
                </button>
              </div>
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
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchMode, setSearchMode] = useState("smart");
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
  const isComposingRef = useRef(false);

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

  // ─── 検索デバウンス: 日本語IME変換確定を待つ ───
  useEffect(() => {
    if (isComposingRef.current) return;
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const filtered = useMemo(() => {
    let list = prompts;
    if (debouncedQuery) {
      list = searchPrompts(list, debouncedQuery, searchMode, contentsData);
    }
    if (activeC1) list = list.filter(p => p.c1 === activeC1);
    if (showNew) list = list.filter(p => p.isNew);
    if (showFav) list = list.filter(p => favs.has(p.id));
    return list;
  }, [prompts, debouncedQuery, searchMode, activeC1, showNew, showFav, favs]);

  // 検索結果のマッチタイプ集計
  const matchTypeSummary = useMemo(() => {
    if (!debouncedQuery) return null;
    const types = { keyword: 0, intent: 0, fuzzy: 0 };
    filtered.forEach(p => {
      const mt = p._matchType || "";
      if (mt.includes("keyword")) types.keyword++;
      if (mt.includes("intent")) types.intent++;
      if (mt.includes("fuzzy")) types.fuzzy++;
    });
    return types;
  }, [filtered, debouncedQuery]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  useEffect(() => setPage(0), [debouncedQuery, searchMode, activeC1, showNew, showFav]);

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
            <button className={`btn-icon ${darkMode ? 'active' : ''}`} onClick={()=>setDarkMode(!darkMode)}>{darkMode ? <Icons.Moon /> : <Icons.Sun />}</button>
            <button className={`btn-icon ${viewMode==='grid'?'active':''}`} onClick={()=>setViewMode('grid')}><Icons.Grid /></button>
            <button className={`btn-icon ${viewMode==='list'?'active':''}`} onClick={()=>setViewMode('list')}><Icons.List /></button>
            <button className="btn-icon btn-add" onClick={()=>setModal("add")}><Icons.Plus /> 追加</button>
          </div>
        </div>
      </header>
      <div className="search-container">
        <div className="search-box">
          <span className="search-icon"><Icons.Search /></span>
          <input ref={searchRef} value={query}
            onChange={e => setQuery(e.target.value)}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={e => { isComposingRef.current = false; setQuery(e.target.value); setDebouncedQuery(e.target.value); }}
            placeholder="キーワード、ID、カテゴリで検索..." />
          {query && <button className="search-clear" onClick={()=>{setQuery("");searchRef.current?.focus()}}>×</button>}
        </div>
        <div className="search-modes">
          {Object.entries(SEARCH_MODES).map(([key, { label }]) => (
            <button key={key} className={`search-mode-btn ${searchMode === key ? 'active' : ''}`} onClick={() => setSearchMode(key)} title={SEARCH_MODES[key].description}>
              {label}
            </button>
          ))}
        </div>
        {debouncedQuery && filtered.length > 0 && matchTypeSummary && (
          <div className="search-info">
            <span className="search-result-count">{filtered.length}件</span>
            <span className="search-match-types">
              {matchTypeSummary.keyword > 0 && <span className="match-badge match-keyword">キーワード {matchTypeSummary.keyword}</span>}
              {matchTypeSummary.intent > 0 && <span className="match-badge match-intent">意図 {matchTypeSummary.intent}</span>}
              {matchTypeSummary.fuzzy > 0 && <span className="match-badge match-fuzzy">あいまい {matchTypeSummary.fuzzy}</span>}
            </span>
          </div>
        )}
        {debouncedQuery && filtered.length === 0 && (
          <div className="search-info">
            <span className="search-result-count search-no-result">0件 - 検索条件を変えてお試しください</span>
          </div>
        )}
      </div>
      <div className="filters">
        <button className={`chip ${!activeC1 && !showNew && !showFav ? 'active' : ''}`} onClick={()=>{setActiveC1("");setShowNew(false);setShowFav(false)}}>
          すべて <span className="chip-count">{prompts.length}</span>
        </button>
        {RAW.c1.map(c => (
          <button key={c} className={`chip ${activeC1 === c ? 'active' : ''}`} onClick={()=>{setActiveC1(activeC1===c?"":c);setShowNew(false);setShowFav(false)}}>
            <CatIcon cat={c} /> {c}
          </button>
        ))}
        <button className={`chip chip-new ${showNew ? 'active' : ''}`} onClick={()=>{setShowNew(!showNew);setActiveC1("");setShowFav(false)}}><Icons.Zap /> 新着</button>
        <button className={`chip ${showFav ? 'active' : ''}`} onClick={()=>{setShowFav(!showFav);setActiveC1("");setShowNew(false)}} style={showFav?{background:'#fee2e2',color:'#ef4444',borderColor:'#ef4444'}:{}}><Icons.Heart /> お気に入り</button>
      </div>
      <div className={`grid ${viewMode === 'list' ? 'list' : ''}`}>
        {paged.length === 0 ? (
          <div className="empty-state"><span className="empty-icon"><Icons.FolderOpen /></span><p>見つかりませんでした</p></div>
        ) : (
          paged.map((p, idx) => {
            const col = getColor(p.c1, darkMode);
            return (
              <div
                key={p.id}
                className={`card ${viewMode==='list'?'list-mode':''}`}
                onClick={() => p.isUser && setModal(p)}
                style={{ '--i': idx }}
              >
                <button className={`fav-btn ${favs.has(p.id)?'active':''}`} onClick={(e)=>{e.stopPropagation();toggleFav(p.id)}}>{favs.has(p.id)?<Icons.HeartFilled />:<Icons.Heart />}</button>
                <div className="card-body">
                  <div className="card-meta"><span className="card-id">#{p.id}</span>{p.isNew && <span className="card-new-badge">NEW</span>}</div>
                  <h3 className="card-title">{p.title}</h3>
                  <div className="card-tags">
                    <span className="tag" style={{background:col.bg, color:col.fg}}><CatIcon cat={p.c1} /> {p.c1}</span>
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
          useQuery={useQuery}
          setUseQuery={setUseQuery}
        />
      )}
    </div>
  );
}