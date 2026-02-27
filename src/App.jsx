import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./App.css";
import { RAW, INITIAL_PROMPTS } from "./data/prompts";
import contentsData from "./data/contents.json";
import { searchPrompts, SEARCH_MODES } from "./utils/search";

// ─── Constants & Helpers ───────────────────────────────────────────────────
const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
const MOD_KEY = isMac ? 'metaKey' : 'ctrlKey';
const MOD_LABEL = isMac ? '⌘' : 'Ctrl';

const STORAGE_KEY = "nanyo_prompts_v5";
const PER_PAGE = 32;
const MAX_QUERY_LENGTH = 2000; // URLクエリの安全な上限文字数

const AI_TOOLS = [
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/', query: '' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app', query: '' },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai/new', query: '' },
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
  Maximize: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>,
  Restore: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>,
  GripResize: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="2" y2="22"/><line x1="22" y1="10" x2="10" y2="22"/><line x1="22" y1="18" x2="18" y2="22"/></svg>,
  Help: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
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

// ─── Onboarding Overlay ──────────────────────────────────────────────────────
const OnboardingOverlay = ({ steps, currentStep, onNext, onSkip }) => {
  const [pos, setPos] = useState(null);
  const step = steps[currentStep];

  useEffect(() => {
    if (!step) return;
    const el = document.querySelector(step.selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const r = el.getBoundingClientRect();
      setPos({ top: r.top, left: r.left, width: r.width, height: r.height });
    } else {
      setPos(null);
    }
  }, [currentStep, step]);

  const isLast = currentStep >= steps.length - 1;
  const tooltipStyle = {};
  if (pos) {
    const below = pos.top + pos.height + 12;
    const above = pos.top - 12;
    if (below + 160 < window.innerHeight) {
      tooltipStyle.top = below + 'px';
    } else {
      tooltipStyle.bottom = (window.innerHeight - above) + 'px';
    }
    tooltipStyle.left = Math.max(12, Math.min(pos.left, window.innerWidth - 340)) + 'px';
  } else {
    tooltipStyle.top = '50%';
    tooltipStyle.left = '50%';
    tooltipStyle.transform = 'translate(-50%, -50%)';
  }

  return createPortal(
    <div className="onboarding-overlay" onClick={onSkip}>
      {pos && <div className="onboarding-highlight" style={{ top: pos.top - 4, left: pos.left - 4, width: pos.width + 8, height: pos.height + 8 }} />}
      <div className="onboarding-tooltip" style={tooltipStyle} onClick={e => e.stopPropagation()}>
        <div className="onboarding-step-count">{currentStep + 1} / {steps.length}</div>
        <h4>{step?.title}</h4>
        <p>{step?.text}</p>
        <div className="onboarding-actions">
          <button className="onboarding-skip" onClick={onSkip}>スキップ</button>
          <button className="onboarding-next" onClick={onNext}>{isLast ? '始める' : '次へ →'}</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Modal: HelpModal ────────────────────────────────────────────────────────
const HelpModal = ({ onClose, onStartTour, onResetData }) => {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return createPortal(
    <div className="modal-backdrop help-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal help-modal">
        <div className="help-modal-header">
          <h2>このアプリについて</h2>
          <button onClick={onClose} className="run-modal-icon-btn" style={{ fontSize: '20px', color: 'var(--ink2)' }}>×</button>
        </div>
        <div className="help-modal-body">
          <section className="help-section">
            <h3>概要</h3>
            <p>山形県南陽市が公開する「一発OK!! 市民も使える！生成AI活用実例集」のプロンプトデータを、検索・閲覧しやすくしたWebアプリです。南陽市の確認のもと、個人が開発・運営しています。</p>
            <button className="help-tour-btn" onClick={onStartTour}>ガイドツアーを見る</button>
          </section>

          <section className="help-section">
            <h3>使い方</h3>
            <ul>
              <li><strong>検索</strong> — キーワード、プロンプトID、カテゴリ名で検索できます。あいまい検索にも対応しています。</li>
              <li><strong>フィルタ</strong> — カテゴリボタンで絞り込み。「新着」で最近追加されたプロンプトを確認できます。</li>
              <li><strong>プロンプト実行</strong> — カードをクリックするとプロンプトの詳細を表示。「コピーしてAIで使う」でプロンプトをコピーし、選択したAIツール（ChatGPT / Gemini / Claude）を開きます。</li>
              <li><strong>お気に入り</strong> — ハートアイコンでお気に入りに登録。「お気に入り」フィルタで一覧表示できます。</li>
              <li><strong>カスタムプロンプト</strong> — 「追加」ボタンで自分だけのプロンプトを作成・管理できます。</li>
            </ul>
          </section>

          <section className="help-section">
            <h3>プロンプトデータについて</h3>
            <ul className="help-links">
              <li>出典：<a href="http://www.city.nanyo.yamagata.jp/dxchosei/5793" target="_blank" rel="noopener noreferrer">山形県南陽市「一発OK!! 市民も使える！生成AI活用実例集」</a></li>
              <li>南陽市公式サイト：<a href="http://www.city.nanyo.yamagata.jp/" target="_blank" rel="noopener noreferrer">http://www.city.nanyo.yamagata.jp/</a></li>
              <li>プロンプトデータ（GitHub）：<a href="https://github.com/nanyo-line/prompt" target="_blank" rel="noopener noreferrer">nanyo-line/prompt</a></li>
              <li>著作権：南陽市に帰属し、<a href="https://creativecommons.org/licenses/by/4.0/deed.ja" target="_blank" rel="noopener noreferrer">CC BY 4.0</a> の下で提供されています。</li>
            </ul>
            <p className="help-credit">南陽市DX普及主幹 佐野毅氏（<a href="https://x.com/ichigonme" target="_blank" rel="noopener noreferrer">@ichigonme</a>）による先進的な取り組みに感謝いたします。</p>
          </section>

          <section className="help-section">
            <h3>キーボードショートカット</h3>
            <ul className="help-shortcuts">
              <li><kbd>{MOD_LABEL}+K</kbd> 検索にフォーカス</li>
              <li><kbd>?</kbd> このヘルプを表示</li>
              <li><kbd>D</kbd> ダーク / ライト切替</li>
              <li><kbd>G</kbd> グリッド表示 / <kbd>L</kbd> リスト表示</li>
              <li><kbd>J</kbd> 最初のカードにフォーカス</li>
              <li><kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> カード間を移動</li>
              <li><kbd>Enter</kbd> フォーカス中のカードを開く</li>
              <li><kbd>Esc</kbd> モーダルを閉じる</li>
            </ul>
            <h4>プロンプト実行モーダル内</h4>
            <ul className="help-shortcuts">
              <li><kbd>F</kbd> フルスクリーン切替</li>
              <li><kbd>S</kbd> 設定（AIツール選択）パネル切替</li>
            </ul>
            <p className="help-shortcut-note">※ テキスト入力中は {MOD_LABEL}+K 以外のショートカットは無効です</p>
          </section>

          <section className="help-section">
            <h3>プロンプト入力の例</h3>
            <div className="help-example">
              <p><strong>例：#001 複雑な文章の要点をわかりやすく解説してもらう</strong></p>
              <p>プロンプト内の入力欄に要約したい文章を貼り付けて「コピーしてAIで使う」をクリックすると、プロンプト全体がクリップボードにコピーされ、選択したAIツールが開きます。</p>
              <p>AIツールの入力欄に貼り付けて送信すると、要点が箇条書きで整理された回答が得られます。</p>
            </div>
          </section>

          <section className="help-section">
            <h3>アプリ開発</h3>
            <ul className="help-links">
              <li>開発者：Ito Atsushi（<a href="https://x.com/AsagiriDesign" target="_blank" rel="noopener noreferrer">@AsagiriDesign</a>）</li>
              <li>ソースコード：<a href="https://github.com/BoxPistols/nanyo-prompt-app" target="_blank" rel="noopener noreferrer">GitHub</a>（MIT License）</li>
            </ul>
          </section>

          <section className="help-section">
            <h3>免責事項</h3>
            <ul className="help-disclaimer">
              <li>本アプリで提供するプロンプトは、特定の成果や情報の正確性を保証するものではありません。</li>
              <li>生成AIの特性上、出力結果には誤りや不適切な内容が含まれる可能性があります。生成された回答の正確性・妥当性・安全性および第三者の権利侵害の有無については、利用者自身の責任でファクトチェックを行ってください。</li>
              <li>本アプリの利用または利用できなかったことによって生じた直接的・間接的な損害について、本アプリ開発者および南陽市は一切の責任を負いません。</li>
              <li>元のプロンプトデータは試行的な取り組みとして提供されており、予告なく内容の変更または公開が中止される場合があります。</li>
            </ul>
          </section>

          <section className="help-section help-reset-section">
            <h3>データの初期化</h3>
            <p>お気に入り、カスタムプロンプト、テーマ設定、オンボーディング履歴など、すべてのローカルデータを削除して初期状態に戻します。</p>
            <button className="help-reset-btn" onClick={onResetData}>すべてのデータを初期化</button>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
};

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

const ModalOnboarding = ({ currentStep, totalSteps, step, onNext, onSkip, containerRef }) => {
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!step || !containerRef.current) return;
    const container = containerRef.current;
    const el = container.querySelector(step.selector)
      || (step.fallbackSelector && container.querySelector(step.fallbackSelector));
    if (el) {
      const r = el.getBoundingClientRect();
      setPos({ top: r.top, left: r.left, width: r.width, height: r.height });
    } else {
      setPos(null);
    }
  }, [currentStep, step, containerRef]);

  const isLast = currentStep >= totalSteps - 1;

  const tooltipStyle = {};
  if (pos) {
    const below = pos.top + pos.height + 12;
    if (below + 160 < window.innerHeight) {
      tooltipStyle.top = (pos.top + pos.height + 12) + 'px';
    } else {
      tooltipStyle.bottom = (window.innerHeight - pos.top + 12) + 'px';
    }
    tooltipStyle.left = Math.max(12, Math.min(pos.left, window.innerWidth - 340)) + 'px';
  } else {
    tooltipStyle.top = '50%';
    tooltipStyle.left = '50%';
    tooltipStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <div className="modal-onboarding-overlay" onClick={onSkip}>
      {pos && (
        <div className="modal-onboarding-highlight" style={{
          top: pos.top - 4,
          left: pos.left - 4,
          width: pos.width + 8,
          height: pos.height + 8,
        }} />
      )}
      <div className="onboarding-tooltip" style={{ ...tooltipStyle, zIndex: 10003 }} onClick={e => e.stopPropagation()}>
        <div className="onboarding-step-count">{currentStep + 1} / {totalSteps}</div>
        <h4>{step?.title}</h4>
        <p>{step?.fallbackSelector && containerRef.current && !containerRef.current.querySelector(step.selector) ? step.fallbackText : step?.text}</p>
        <div className="onboarding-actions">
          <button className="onboarding-skip" onClick={onSkip}>スキップ</button>
          <button className="onboarding-next" onClick={onNext}>{isLast ? '始める' : '次へ →'}</button>
        </div>
      </div>
    </div>
  );
};

const PromptRunModal = ({ item, onClose, selectedAiTool, setSelectedAiTool }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [mobileTab, setMobileTab] = useState("preview"); // "preview" | "form"
  const [isMaximized, setIsMaximized] = useState(false);
  const modalRef = useRef(null);

  // モーダル内オンボーディング
  const [modalIntroStep, setModalIntroStep] = useState(-1);
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
      const rawVars = sectionMatch[1]
        .split(/\n\n+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      // h3見出し＋textarea内容の重複を解消: コロン付きサブ項目を親項目に統合
      // 例: ["AIモデル①の回答", "AIモデル①の名称：", "AIモデル①の回答："] → ["AIモデル①の回答"]
      const merged = [];
      for (let i = 0; i < rawVars.length; i++) {
        const v = rawVars[i];
        // 前の項目（親候補）がコロンなしで、現在の項目がコロン付きサブ項目なら統合対象
        if (merged.length > 0 && /[：:]$/.test(v)) {
          const parent = merged[merged.length - 1];
          if (!/[：:]$/.test(parent) && v.replace(/[：:]$/, '').includes(parent.replace(/の回答|の入力|の情報/g, '').substring(0, 4))) {
            continue; // サブ項目をスキップ（親に統合）
          }
        }
        merged.push(v);
      }
      sectionVars = merged;
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
    try { localStorage.setItem(STORAGE_KEY + "_modal_intro_done", "1"); } catch {}
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
  const [prompts, setPrompts] = useState(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY + "_data");
      if (savedData) {
        const localPrompts = JSON.parse(savedData);
        if (INITIAL_PROMPTS.length > localPrompts.filter(p => !p.isUser).length) {
          const localIds = new Set(localPrompts.map(p => p.id));
          const newFromSource = INITIAL_PROMPTS.filter(p => !localIds.has(p.id));
          const merged = [...localPrompts, ...newFromSource];
          localStorage.setItem(STORAGE_KEY + "_data", JSON.stringify(merged));
          return merged;
        }
        return localPrompts;
      }
      return INITIAL_PROMPTS;
    } catch(e) { console.error(e); return INITIAL_PROMPTS; }
  });
  const [isLoaded] = useState(true);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchMode, setSearchMode] = useState("smart");
  const [activeC1, setActiveC1] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showFav, setShowFav] = useState(false);
  const [favs, setFavs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + "_favs");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [viewMode, setViewMode] = useState("grid");
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + "_theme");
      return saved === "dark" || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch { return false; }
  });
  const [modal, setModal] = useState(null);
  const [runModal, setRunModal] = useState(null);
  const [helpModal, setHelpModal] = useState(false);
  const [page, setPage] = useState(0);
  const [nextId, setNextId] = useState(3000);
  const [selectedAiTool, setSelectedAiTool] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY + "_ai_tool") || AI_TOOLS[0].id;
    } catch { return AI_TOOLS[0].id; }
  });
  const [useQuery] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + "_use_query");
      return saved !== null ? saved === "true" : true;
    } catch { return true; }
  });
  const searchRef = useRef(null);
  const isComposingRef = useRef(false);
  const [introStep, setIntroStep] = useState(-1);

  const INTRO_STEPS = [
    { selector: '.logo', title: '南陽市DX Prompts', text: '山形県南陽市が公開する生成AI活用プロンプト集を検索・活用できるアプリです。' },
    { selector: '.search-box', title: '検索', text: 'キーワード、プロンプトID（例: 001）、カテゴリ名で検索できます。あいまい検索にも対応。' },
    { selector: '.filters', title: 'カテゴリフィルタ', text: 'カテゴリボタンで絞り込み。「新着」「お気に入り」でも絞り込めます。' },
    { selector: '.grid .card', title: 'プロンプトカード', text: '「AIで実行」でプロンプトをコピーし、ChatGPT・Gemini・Claudeに貼り付けて使えます。' },
    { selector: '.header-controls', title: 'ツールバー', text: 'ダークモード、表示切替、ヘルプ（?）、カスタムプロンプト追加ができます。' },
  ];

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

  // intro: 初回チェック（DOM描画後）
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY + "_intro_done")) return;
    } catch { return; }
    const timer = setTimeout(() => {
      setIntroStep(prev => prev === -1 ? 0 : prev);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // intro: Escで閉じる
  useEffect(() => {
    if (introStep < 0) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIntroStep(-1);
        try { localStorage.setItem(STORAGE_KEY + "_intro_done", "1"); } catch {}
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [introStep]);

  // ─── グローバルキーボードショートカット ───
  useEffect(() => {
    const isTyping = () => {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    };

    const getCards = () => Array.from(document.querySelectorAll('.grid .card'));
    const getFocusedCardIndex = () => {
      const cards = getCards();
      return cards.indexOf(document.activeElement);
    };

    const focusCard = (index) => {
      const cards = getCards();
      if (cards[index]) { cards[index].focus(); }
    };

    const getGridColumns = () => {
      const grid = document.querySelector('.grid');
      if (!grid) return 1;
      const style = getComputedStyle(grid);
      const cols = style.getPropertyValue('grid-template-columns').split(' ').length;
      return cols || 1;
    };

    const handleKeydown = (e) => {
      // Cmd/Ctrl+K: 検索フォーカス（入力中でも発火）
      if (e[MOD_KEY] && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      // カードフォーカス中の矢印キー・Enter
      const cardIdx = getFocusedCardIndex();
      if (cardIdx >= 0) {
        const cards = getCards();
        const cols = getGridColumns();
        switch (e.key) {
          case 'ArrowRight': e.preventDefault(); focusCard(Math.min(cardIdx + 1, cards.length - 1)); return;
          case 'ArrowLeft': e.preventDefault(); focusCard(Math.max(cardIdx - 1, 0)); return;
          case 'ArrowDown': e.preventDefault(); focusCard(Math.min(cardIdx + cols, cards.length - 1)); return;
          case 'ArrowUp': e.preventDefault(); focusCard(Math.max(cardIdx - cols, 0)); return;
          case 'Enter':
            e.preventDefault();
            cards[cardIdx]?.querySelector('.btn-primary')?.click();
            return;
        }
      }

      // 入力中はその他のショートカットを無効化
      if (isTyping()) return;

      // モーダルが開いている間はスキップ（Escは各モーダルが処理）
      if (modal || runModal || helpModal) return;

      switch (e.key) {
        case '?':
          e.preventDefault();
          setHelpModal(true);
          break;
        case 'd': case 'D':
          e.preventDefault();
          setDarkMode(prev => !prev);
          break;
        case 'g': case 'G':
          e.preventDefault();
          setViewMode('grid');
          break;
        case 'l': case 'L':
          e.preventDefault();
          setViewMode('list');
          break;
        case 'j': case 'J':
          e.preventDefault();
          focusCard(0);
          break;
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [modal, runModal, helpModal]);

  // ─── 検索デバウンス: 日本語IME変換確定を待つ ───
  useEffect(() => {
    if (isComposingRef.current) return;
    const timer = setTimeout(() => { setDebouncedQuery(query); setPage(0); }, 300);
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

  const toggleFav = (id) => { setFavs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
  const handleSave = (form) => {
    if (form.id) { setPrompts(prev => prev.map(p => p.id === form.id ? {...p, ...form} : p)); } 
    else { const newP = { ...form, id: nextId, isUser: true }; setPrompts(prev => [newP, ...prev]); setNextId(n => n + 1); }
    setModal(null);
  };
  const handleDelete = (id) => { if(window.confirm("削除しますか？")) { setPrompts(prev => prev.filter(p => p.id !== id)); setModal(null); } };

  const handleResetData = () => {
    const ok = window.confirm(
      "すべてのデータを初期化します。\n\nお気に入り、カスタムプロンプト、テーマ設定などが削除されます。この操作は元に戻せません。\n\n本当に初期化しますか？"
    );
    if (!ok) return;
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(STORAGE_KEY))
        .forEach(k => localStorage.removeItem(k));
    } catch {}
    window.location.reload();
  };

  if (!isLoaded) return <div style={{padding:40, textAlign:'center'}}>Loading...</div>;

  return (
    <div className="app">
      {introStep >= 0 && !modal && !runModal && !helpModal && <OnboardingOverlay steps={INTRO_STEPS} currentStep={introStep} onNext={() => {
        if (introStep < INTRO_STEPS.length - 1) {
          setIntroStep(introStep + 1);
        } else {
          setIntroStep(-1);
          try { localStorage.setItem(STORAGE_KEY + "_intro_done", "1"); } catch {}
        }
      }} onSkip={() => {
        setIntroStep(-1);
        try { localStorage.setItem(STORAGE_KEY + "_intro_done", "1"); } catch {}
      }} />}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <h1><svg className="logo-emblem" width="28" height="28" viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" rx="96" fill="var(--primary)"/><g transform="translate(256,256) scale(4.2) translate(-45,-34.6)"><path fill="#fff" d="m45,0-12.948,34.626c-2.259,3.979-5.833,7.239-10.95,6.433-3.843-0.716-6.33-4.145-5.826-8.036 0.504-3.89 3.789-6.632 7.698-6.425 2.927,0.155 5.297,1.915 6.307,4.434l5.693-15.994c-3.196-2.11-6.968-3.422-11.035-3.638-11.764-0.623-22.238,8.12-23.753,19.828-1.515,11.708 6.412,22.638 17.978,24.792 1.446,0.269 2.89,0.391 4.318,0.375 5.771-0.065 11.259-2.377 15.376-6.245l7.142,19.101 12.948-34.627c2.259-3.979 5.833-7.239 10.95-6.433 3.843,0.716 6.33,4.145 5.826,8.036-0.504,3.89-3.788,6.632-7.698,6.425-2.927-0.155-5.298-1.915-6.307-4.434l-5.693,15.994c3.196,2.11 6.968,3.423 11.035,3.638 11.764,0.623 22.238-8.12 23.753-19.828 1.515-11.708-6.412-22.638-17.978-24.792-1.446-0.269-2.89-0.391-4.318-0.375-5.771,0.065-11.259,2.377-15.376,6.245z"/></g></svg>南陽市DX <span>Prompts</span></h1>
            <p>生成AI活用実例集 {prompts.length}件</p>
          </div>
          <div className="header-controls">
            <button className={`btn-icon ${darkMode ? 'active' : ''}`} onClick={()=>setDarkMode(!darkMode)}>{darkMode ? <Icons.Moon /> : <Icons.Sun />}</button>
            <button className={`btn-icon ${viewMode==='grid'?'active':''}`} onClick={()=>setViewMode('grid')}><Icons.Grid /></button>
            <button className={`btn-icon ${viewMode==='list'?'active':''}`} onClick={()=>setViewMode('list')}><Icons.List /></button>
            <button className="btn-icon" onClick={()=>setHelpModal(true)} title="ヘルプ・このアプリについて"><Icons.Help /></button>
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
            onCompositionEnd={e => { isComposingRef.current = false; setQuery(e.target.value); setDebouncedQuery(e.target.value); setPage(0); }}
            placeholder={`検索... (${MOD_LABEL}+K)`} />
          {query && <button className="search-clear" onClick={()=>{setQuery("");searchRef.current?.focus()}}>×</button>}
        </div>
        <div className="search-modes">
          {Object.entries(SEARCH_MODES).map(([key, { label }]) => (
            <button key={key} className={`search-mode-btn ${searchMode === key ? 'active' : ''}`} onClick={() => { setSearchMode(key); setPage(0); }} title={SEARCH_MODES[key].description}>
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
        <button className={`chip ${!activeC1 && !showNew && !showFav ? 'active' : ''}`} onClick={()=>{setActiveC1("");setShowNew(false);setShowFav(false);setPage(0)}}>
          すべて <span className="chip-count">{prompts.length}</span>
        </button>
        {RAW.c1.map(c => (
          <button key={c} className={`chip ${activeC1 === c ? 'active' : ''}`} onClick={()=>{setActiveC1(activeC1===c?"":c);setShowNew(false);setShowFav(false);setPage(0)}}>
            <CatIcon cat={c} /> {c}
          </button>
        ))}
        <button className={`chip chip-new ${showNew ? 'active' : ''}`} onClick={()=>{setShowNew(!showNew);setActiveC1("");setShowFav(false);setPage(0)}}><Icons.Zap /> 新着</button>
        <button className={`chip ${showFav ? 'active' : ''}`} onClick={()=>{setShowFav(!showFav);setActiveC1("");setShowNew(false);setPage(0)}} style={showFav?{background:'#fee2e2',color:'#ef4444',borderColor:'#ef4444'}:{}}><Icons.Heart /> お気に入り</button>
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
                tabIndex={0}
                onClick={() => p.isUser && setModal(p)}
                style={{ '--i': idx }}
              >
                <button className={`fav-btn ${favs.has(p.id)?'active':''}`} onClick={(e)=>{e.stopPropagation();toggleFav(p.id)}}>{favs.has(p.id)?<Icons.HeartFilled />:<Icons.Heart />}</button>
                <div className="card-body">
                  <div className="card-meta">
                    <span className="card-id">#{p.id}</span>
                    {p.createdAt && <span className="card-date">{p.createdAt}</span>}
                    {p.isNew && <span className="card-new-badge">NEW</span>}
                  </div>
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
      {/* ─── Footer ─────────────────────────────────────────────────────── */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-attribution">
            <p className="footer-source">
              プロンプトデータの出典：<a href="http://www.city.nanyo.yamagata.jp/dxchosei/5793" target="_blank" rel="noopener noreferrer">山形県南陽市「一発OK!! 市民も使える！生成AI活用実例集」</a>
            </p>
            <p className="footer-license">
              プロンプトデータは南陽市に著作権が帰属し、<a href="https://creativecommons.org/licenses/by/4.0/deed.ja" target="_blank" rel="noopener noreferrer">CC BY 4.0</a> の下で提供されています。
            </p>
            <p className="footer-app-note">
              本アプリは南陽市の確認のもと、公開データを活用して個人が開発・運営しています。
            </p>
          </div>
          <div className="footer-developer">
            開発：Ito Atsushi（<a href="https://github.com/BoxPistols/nanyo-prompt-app" target="_blank" rel="noopener noreferrer">GitHub</a> / <a href="https://x.com/AsagiriDesign" target="_blank" rel="noopener noreferrer">X</a>）｜<a href="https://github.com/BoxPistols/nanyo-prompt-app/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">MIT License</a>
          </div>
          <details className="footer-disclaimer">
            <summary>免責事項</summary>
            <div className="footer-disclaimer-body">
              <ul>
                <li>本アプリで提供するプロンプトは、特定の成果や情報の正確性を保証するものではありません。</li>
                <li>生成AIの特性上、出力結果には誤りや不適切な内容が含まれる可能性があります。生成された回答の正確性・妥当性・安全性および第三者の権利侵害の有無については、利用者自身の責任でファクトチェックを行ってください。</li>
                <li>本アプリの利用または利用できなかったことによって生じた直接的・間接的な損害（データの損失、業務の中断、権利侵害等を含む）について、本アプリ開発者および南陽市は一切の責任を負いません。</li>
                <li>元のプロンプトデータは試行的な取り組みとして提供されており、予告なく内容の変更または公開が中止される場合があります。</li>
              </ul>
            </div>
          </details>
        </div>
      </footer>
      {modal && <CrudModal item={modal==="add"?null:modal} onClose={()=>setModal(null)} onSave={handleSave} onDelete={handleDelete} />}
      {runModal && (
        <PromptRunModal
          item={runModal}
          onClose={()=>setRunModal(null)}
          selectedAiTool={selectedAiTool}
          setSelectedAiTool={setSelectedAiTool}
        />
      )}
      {helpModal && <HelpModal onClose={() => setHelpModal(false)} onStartTour={() => { setHelpModal(false); setIntroStep(0); }} onResetData={handleResetData} />}
    </div>
  );
}