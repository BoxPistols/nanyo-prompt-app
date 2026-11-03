import { useState, useEffect } from "react";
import { STORAGE_KEY } from "../constants";

export const INTRO_STEPS = [
  { selector: '.logo', title: '南陽市DX Prompts', text: '山形県南陽市が公開する生成AI活用プロンプト集を検索・活用できるアプリです。' },
  { selector: '.search-box', title: '検索', text: 'キーワード、プロンプトID（例: 001）、カテゴリ名で検索できます。あいまい検索にも対応。' },
  { selector: '.filters', title: 'カテゴリフィルタ', text: 'カテゴリボタンで絞り込み。「新着」「お気に入り」でも絞り込めます。' },
  { selector: '.grid .card', title: 'プロンプトカード', text: '「AIで実行」でプロンプトをコピーし、ChatGPT・Gemini・Claudeに貼り付けて使えます。' },
  { selector: '.header-controls', title: 'ツールバー', text: 'ダークモード、表示切替、ヘルプ（?）、カスタムプロンプト追加ができます。' },
];

const markIntroDone = () => {
  try { localStorage.setItem(STORAGE_KEY + "_intro_done", "1"); } catch { /* 保存できなくても次回ツアーが再表示されるだけ */ }
};

// 初回訪問時のガイドツアー。完了・スキップ・Esc のいずれでも「表示済み」を記録する
export function useIntroTour() {
  const [introStep, setIntroStep] = useState(-1);

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
        markIntroDone();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [introStep]);

  const nextIntro = () => {
    if (introStep < INTRO_STEPS.length - 1) {
      setIntroStep(introStep + 1);
    } else {
      setIntroStep(-1);
      markIntroDone();
    }
  };
  const skipIntro = () => {
    setIntroStep(-1);
    markIntroDone();
  };
  const startIntro = () => setIntroStep(0);

  return { introStep, nextIntro, skipIntro, startIntro };
}
