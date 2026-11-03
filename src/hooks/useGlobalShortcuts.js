import { useEffect } from "react";
import { MOD_KEY } from "../constants";

// 一覧画面のキーボード操作: Cmd/Ctrl+K で検索、矢印キーでカード移動、? / D / G / L / J の単キー操作
export function useGlobalShortcuts({ searchRef, modalOpen, setHelpModal, setDarkMode, setViewMode }) {
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
      if (modalOpen) return;

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
  }, [modalOpen, searchRef, setHelpModal, setDarkMode, setViewMode]);
}
