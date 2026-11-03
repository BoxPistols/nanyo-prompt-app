import { MOD_LABEL } from "../constants";
import { SEARCH_MODES } from "../utils/search";
import * as Icons from "./Icons";

// IME 変換中は検索を走らせず、変換確定 (compositionend) で即時に反映する
const SearchPanel = ({ searchRef, isComposingRef, query, setQuery, setDebouncedQuery, debouncedQuery, searchMode, setSearchMode, setPage, resultCount, matchTypeSummary, contentsReady, contentsFailed, onRetryContents }) => (
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
    {debouncedQuery && resultCount > 0 && matchTypeSummary && (
      <div className="search-info">
        <span className="search-result-count">{resultCount}件</span>
        <span className="search-match-types">
          {matchTypeSummary.keyword > 0 && <span className="match-badge match-keyword">キーワード {matchTypeSummary.keyword}</span>}
          {matchTypeSummary.intent > 0 && <span className="match-badge match-intent">意図 {matchTypeSummary.intent}</span>}
          {matchTypeSummary.fuzzy > 0 && <span className="match-badge match-fuzzy">あいまい {matchTypeSummary.fuzzy}</span>}
        </span>
      </div>
    )}
    {debouncedQuery && resultCount === 0 && (
      <div className="search-info">
        <span className="search-result-count search-no-result">0件 - 検索条件を変えてお試しください</span>
      </div>
    )}
    {debouncedQuery && searchMode === 'intent' && !contentsReady && (
      <div className="search-info" role="status">
        <span className="search-result-count search-no-result">
          {contentsFailed
            ? '本文を読み込めなかったため、いまは本文を検索できません。'
            : '本文を読み込み中です。読み込みが終わると本文も検索対象になります。'}
        </span>
        {contentsFailed && <button className="search-retry" onClick={onRetryContents}>本文を再読み込み</button>}
      </div>
    )}
  </div>
);

export default SearchPanel;
