// 現在ページを中心に最大 5 件のページ番号を出す
const Pagination = ({ page, totalPages, setPage }) => (
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
);

export default Pagination;
