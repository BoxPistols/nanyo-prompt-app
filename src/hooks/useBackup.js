import { useState } from "react";
import { sanitizePrompt } from "../utils/backup";

// 自作プロンプトとお気に入りの JSON 書き出し・読み込み
export function useBackup({ prompts, setPrompts, favs, setFavs, setNextId }) {
  const [importOptions, setImportOptions] = useState(null);
  const [exportPreview, setExportPreview] = useState(null);

  const handleExport = () => {
    const userPrompts = prompts.filter(p => p.isUser);
    setExportPreview({ prompts: userPrompts, favCount: favs.size });
  };

  const doExport = () => {
    const userPrompts = prompts.filter(p => p.isUser);
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      app: "nanyo-prompt-app",
      prompts: userPrompts,
      favorites: [...favs],
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nanyo-prompts-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportPreview(null);
  };


  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.version || !Array.isArray(data.prompts)) {
          alert("無効なファイル形式です。nanyo-prompt-appのエクスポートファイルを選択してください。");
          return;
        }
        setImportOptions(data);
      } catch (err) {
        alert("ファイルの読み込みに失敗しました: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const executeImport = (mode) => {
    if (!importOptions) return;
    const data = importOptions;
    setImportOptions(null);

    const rawList = data.prompts.filter(p => {
      const s = sanitizePrompt(p);
      return !!s.title;
    }).map(sanitizePrompt);

    if (mode === "replace") {
      // 既存の独自プロンプトを削除し、インポート分で置き換え
      let maxId = prompts.filter(p => !p.isUser).reduce((m, p) => Math.max(m, p.id || 0), 0);
      const withIds = rawList.map(p => {
        maxId++;
        return { ...p, id: maxId };
      });
      setPrompts(prev => [...withIds, ...prev.filter(p => !p.isUser)]);
      setNextId(prev => Math.max(prev, maxId + 1));
    } else if (mode === "add") {
      // 全件を新規IDで追加
      let maxId = prompts.reduce((m, p) => Math.max(m, p.id || 0), 0);
      const withIds = rawList.map(p => {
        maxId++;
        return { ...p, id: maxId };
      });
      setPrompts(prev => [...withIds, ...prev]);
      setNextId(prev => Math.max(prev, maxId + 1));
    } else {
      // merge: 同IDのユーザープロンプトは上書き、新規は追加
      const existingIds = new Set(prompts.map(p => p.id));
      let maxId = prompts.reduce((m, p) => Math.max(m, p.id || 0), 0);
      const updatesMap = new Map();
      const newPrompts = [];
      for (const p of rawList) {
        if (p.id !== null && existingIds.has(p.id) && prompts.find(ep => ep.id === p.id)?.isUser) {
          updatesMap.set(p.id, p);
        } else if (p.id !== null && existingIds.has(p.id)) {
          maxId++;
          newPrompts.push({ ...p, id: maxId });
        } else {
          newPrompts.push(p);
        }
      }
      setPrompts(prev => {
        const updated = prev.map(ep => updatesMap.has(ep.id) ? { ...ep, ...updatesMap.get(ep.id) } : ep);
        return newPrompts.length > 0 ? [...newPrompts, ...updated] : updated;
      });
      setNextId(prev => Math.max(prev, maxId + 1));
    }

    // お気に入りマージ（全モード共通）
    if (Array.isArray(data.favorites)) {
      setFavs(prev => {
        const n = new Set(prev);
        data.favorites.forEach(id => typeof id === 'number' && n.add(id));
        return n;
      });
    }

    alert("インポートが完了しました。");
  };

  return { exportPreview, setExportPreview, handleExport, doExport, importOptions, setImportOptions, handleImport, executeImport };
}
