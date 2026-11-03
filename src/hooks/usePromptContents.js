import { useState, useEffect } from "react";
import { loadContents } from "../data/contents";

// 本文は一覧表示に不要なので、一覧を先に描画してから非同期で取得する
export function usePromptContents() {
  const [contents, setContents] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    loadContents().then(setContents).catch(() => setFailed(true));
  }, []);
  const retry = () => {
    setFailed(false);
    loadContents().then(setContents).catch(() => setFailed(true));
  };
  return { contents, failed, retry };
}
