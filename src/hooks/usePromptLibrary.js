import { useState, useEffect } from "react";
import { INITIAL_PROMPTS } from "../data/prompts";
import { mergePrompts, cleanFavs } from "../syncLogic";
import { STORAGE_KEY } from "../constants";

// プロンプト一覧・お気に入り・採番を localStorage と同期して保持する。
// 起動時に保存済みデータと最新の同期データを突き合わせ、上流で消えたプロンプトとそのお気に入りを取り除く
export function usePromptLibrary() {
  const [prompts, setPrompts] = useState(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY + "_data");
      if (savedData) {
        const localPrompts = JSON.parse(savedData);
        const result = mergePrompts(localPrompts, INITIAL_PROMPTS);
        if (result.hasChanged) {
          localStorage.setItem(STORAGE_KEY + "_data", JSON.stringify(result.prompts));
          // 削除されたプロンプトのお気に入りをクリーンアップ
          if (result.removedIds.length > 0) {
            try {
              const savedFavs = localStorage.getItem(STORAGE_KEY + "_favs");
              if (savedFavs) {
                const favSet = new Set(JSON.parse(savedFavs));
                const { favs: cleanedFavs, cleaned } = cleanFavs(favSet, result.removedIds);
                if (cleaned > 0) {
                  localStorage.setItem(STORAGE_KEY + "_favs", JSON.stringify([...cleanedFavs]));
                }
              }
            } catch {
              // お気に入りの掃除に失敗しても、存在しない ID は一覧に出ないため致命的ではない
            }
          }
        }
        return result.prompts;
      }
      return INITIAL_PROMPTS;
    } catch(e) { console.error(e); return INITIAL_PROMPTS; }
  });
  const [favs, setFavs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + "_favs");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [nextId, setNextId] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + "_data");
      if (saved) {
        const arr = JSON.parse(saved);
        const maxId = arr.reduce((m, p) => Math.max(m, p.id || 0), 0);
        return Math.max(3000, maxId + 1);
      }
    } catch {
      // 保存データを読めない場合は利用者プロンプトも復元されないので、既定の開始値で ID は衝突しない
    }
    return 3000;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + "_data", JSON.stringify(prompts));
    localStorage.setItem(STORAGE_KEY + "_favs", JSON.stringify([...favs]));
  }, [prompts, favs]);

  const toggleFav = (id) => { setFavs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };

  return { prompts, setPrompts, favs, setFavs, nextId, setNextId, toggleFav };
}
