import { getColor } from "../utils/categoryColors";
import CatIcon from "./CatIcon";
import * as Icons from "./Icons";

const PromptGrid = ({ paged, viewMode, darkMode, favs, toggleFav, setModal, setRunModal }) => (
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
              {p.url && /^https?:\/\//i.test(p.url) ? (
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn-action btn-outline"><Icons.External /> 公式</a>
              ) : (
                <a href={p.isUser ? `https://www.google.com/search?q=${encodeURIComponent(p.title)}` : p.searchUrl} target="_blank" rel="noopener noreferrer" className="btn-action btn-outline"><Icons.Search /> Google検索</a>
              )}
              <button className="btn-action btn-primary" onClick={() => setRunModal(p)}><Icons.Ai /> AIで実行</button>
            </div>
          </div>
        );
      })
    )}
  </div>
);

export default PromptGrid;
