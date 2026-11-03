import React, { useState, useMemo, useEffect, useRef } from "react";
import { Analytics } from '@vercel/analytics/react';
import "./App.css";
import { searchPrompts } from "./utils/search";
import { STORAGE_KEY, PER_PAGE, AI_TOOLS } from "./constants";
import { usePromptLibrary } from "./hooks/usePromptLibrary";
import { usePromptContents } from "./hooks/usePromptContents";
import { useDarkMode } from "./hooks/useDarkMode";
import { useIntroTour, INTRO_STEPS } from "./hooks/useIntroTour";
import { useBodyScrollLock } from "./hooks/useBodyScrollLock";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import { useBackup } from "./hooks/useBackup";
import AppHeader from "./components/AppHeader";
import SearchPanel from "./components/SearchPanel";
import CategoryFilters from "./components/CategoryFilters";
import PromptGrid from "./components/PromptGrid";
import Pagination from "./components/Pagination";
import AppFooter from "./components/AppFooter";
import OnboardingOverlay from "./components/OnboardingOverlay";
import HelpModal from "./components/HelpModal";
import ExportPreviewModal from "./components/ExportPreviewModal";
import ImportOptionsModal from "./components/ImportOptionsModal";
import ContentsLoadingModal from "./components/ContentsLoadingModal";
import PromptRunModal from "./components/PromptRunModal";
import CrudModal from "./components/CrudModal";

export default function App() {
  const { prompts, setPrompts, favs, setFavs, setNextId, nextId, toggleFav } = usePromptLibrary();
  const { contents, failed: contentsFailed, retry: retryContents } = usePromptContents();
  const [darkMode, setDarkMode] = useDarkMode();
  const { introStep, nextIntro, skipIntro, startIntro } = useIntroTour();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchMode, setSearchMode] = useState("smart");
  const [activeC1, setActiveC1] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showFav, setShowFav] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState(null);
  const [runModal, setRunModal] = useState(null);
  const [helpModal, setHelpModal] = useState(false);
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

  const { exportPreview, setExportPreview, handleExport, doExport, importOptions, setImportOptions, handleImport, executeImport } =
    useBackup({ prompts, setPrompts, favs, setFavs, setNextId });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + "_ai_tool", selectedAiTool);
    localStorage.setItem(STORAGE_KEY + "_use_query", String(useQuery));
  }, [selectedAiTool, useQuery]);

  useBodyScrollLock(!!(modal || runModal || helpModal || importOptions || exportPreview));
  useGlobalShortcuts({ searchRef, modalOpen: !!(modal || runModal || helpModal), setHelpModal, setDarkMode, setViewMode });

  // ─── 検索デバウンス: 日本語IME変換確定を待つ ───
  useEffect(() => {
    if (isComposingRef.current) return;
    const timer = setTimeout(() => { setDebouncedQuery(query); setPage(0); }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const userCount = useMemo(() => prompts.filter(p => p.isUser).length, [prompts]);

  const filtered = useMemo(() => {
    let list = prompts;
    if (debouncedQuery) {
      list = searchPrompts(list, debouncedQuery, searchMode, contents || {});
    }
    if (activeC1) list = list.filter(p => p.c1 === activeC1);
    if (showNew) list = list.filter(p => p.isNew);
    if (showFav) list = list.filter(p => favs.has(p.id));
    if (showUser) list = list.filter(p => p.isUser);
    return list;
  }, [prompts, debouncedQuery, searchMode, contents, activeC1, showNew, showFav, showUser, favs]);

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

  const handleSave = (form) => {
    if (form.id) {
      setPrompts(prev => prev.map(p => p.id === form.id ? {...p, ...form} : p));
    } else {
      const newP = {
        ...form,
        id: nextId,
        isUser: true,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setPrompts(prev => [newP, ...prev]);
      setNextId(n => n + 1);
    }
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
    } catch {
      // ストレージにアクセスできない場合は消すデータも無いので、そのまま再読み込みする
    }
    window.location.reload();
  };

  return (
    <div className="app">
      {introStep >= 0 && !modal && !runModal && !helpModal && <OnboardingOverlay steps={INTRO_STEPS} currentStep={introStep} onNext={nextIntro} onSkip={skipIntro} />}
      <AppHeader
        promptCount={prompts.length}
        darkMode={darkMode} setDarkMode={setDarkMode}
        viewMode={viewMode} setViewMode={setViewMode}
        setHelpModal={setHelpModal} setModal={setModal}
        onExport={handleExport} onImport={handleImport}
      />
      <SearchPanel
        searchRef={searchRef} isComposingRef={isComposingRef}
        query={query} setQuery={setQuery}
        debouncedQuery={debouncedQuery} setDebouncedQuery={setDebouncedQuery}
        searchMode={searchMode} setSearchMode={setSearchMode}
        setPage={setPage}
        resultCount={filtered.length} matchTypeSummary={matchTypeSummary}
        contentsReady={!!contents} contentsFailed={contentsFailed} onRetryContents={retryContents}
      />
      <CategoryFilters
        totalCount={prompts.length} userCount={userCount}
        activeC1={activeC1} setActiveC1={setActiveC1}
        showNew={showNew} setShowNew={setShowNew}
        showFav={showFav} setShowFav={setShowFav}
        showUser={showUser} setShowUser={setShowUser}
        setPage={setPage}
      />
      <PromptGrid paged={paged} viewMode={viewMode} darkMode={darkMode} favs={favs} toggleFav={toggleFav} setModal={setModal} setRunModal={setRunModal} />
      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} setPage={setPage} />}
      <AppFooter />
      {modal && <CrudModal item={modal==="add"?null:modal} onClose={()=>setModal(null)} onSave={handleSave} onDelete={handleDelete} />}
      {runModal && !runModal.body && !contents && (
        <ContentsLoadingModal
          item={runModal}
          failed={contentsFailed}
          onRetry={retryContents}
          onClose={()=>setRunModal(null)}
        />
      )}
      {runModal && (runModal.body || contents) && (
        <PromptRunModal
          item={runModal}
          contents={contents}
          onClose={()=>setRunModal(null)}
          selectedAiTool={selectedAiTool}
          setSelectedAiTool={setSelectedAiTool}
        />
      )}
      {helpModal && <HelpModal onClose={() => setHelpModal(false)} onStartTour={() => { setHelpModal(false); startIntro(); }} onResetData={handleResetData} />}
      {exportPreview && <ExportPreviewModal prompts={exportPreview.prompts} favCount={exportPreview.favCount} onConfirm={doExport} onClose={() => setExportPreview(null)} />}
      {importOptions && <ImportOptionsModal data={importOptions} onConfirm={executeImport} onClose={() => setImportOptions(null)} />}
      <Analytics />
    </div>
  );
}

