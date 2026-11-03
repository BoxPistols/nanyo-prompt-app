import { useState, useRef } from "react";
import { ANNOUNCEMENTS } from "../constants";
import { useAnnouncements } from "../hooks/useAnnouncements";
import { useOutsideClick } from "../hooks/useOutsideClick";
import * as Icons from "./Icons";

const AppHeader = ({ promptCount, darkMode, setDarkMode, viewMode, setViewMode, setHelpModal, setModal, onExport, onImport }) => {
  const [dataMenu, setDataMenu] = useState(false);
  const dataMenuRef = useRef(null);
  const [announcementDrawer, setAnnouncementDrawer] = useState(false);
  const announcementRef = useRef(null);
  const { activeAnnouncements, pastAnnouncements, hasUnread, dismissAnnouncement, dismissAllAnnouncements } = useAnnouncements();

  useOutsideClick(dataMenuRef, dataMenu, setDataMenu);
  useOutsideClick(announcementRef, announcementDrawer, setAnnouncementDrawer);

  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo">
          <h1><svg className="logo-emblem" width="28" height="28" viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" rx="96" fill="var(--primary)"/><g transform="translate(256,256) scale(4.2) translate(-45,-34.6)"><path fill="#fff" d="m45,0-12.948,34.626c-2.259,3.979-5.833,7.239-10.95,6.433-3.843-0.716-6.33-4.145-5.826-8.036 0.504-3.89 3.789-6.632 7.698-6.425 2.927,0.155 5.297,1.915 6.307,4.434l5.693-15.994c-3.196-2.11-6.968-3.422-11.035-3.638-11.764-0.623-22.238,8.12-23.753,19.828-1.515,11.708 6.412,22.638 17.978,24.792 1.446,0.269 2.89,0.391 4.318,0.375 5.771-0.065 11.259-2.377 15.376-6.245l7.142,19.101 12.948-34.627c2.259-3.979 5.833-7.239 10.95-6.433 3.843,0.716 6.33,4.145 5.826,8.036-0.504,3.89-3.788,6.632-7.698,6.425-2.927-0.155-5.298-1.915-6.307-4.434l-5.693,15.994c3.196,2.11 6.968,3.423 11.035,3.638 11.764,0.623 22.238-8.12 23.753-19.828 1.515-11.708-6.412-22.638-17.978-24.792-1.446-0.269-2.89-0.391-4.318-0.375-5.771,0.065-11.259,2.377-15.376,6.245z"/></g></svg>南陽市DX <span>Prompts</span></h1>
          <p>生成AI活用実例集 {promptCount}件</p>
        </div>
        <div className="header-controls">
          <button className={`btn-icon ${darkMode ? 'active' : ''}`} onClick={()=>setDarkMode(!darkMode)} data-tip={darkMode ? 'ライトモードに切替（D）' : 'ダークモードに切替（D）'}>{darkMode ? <Icons.Moon /> : <Icons.Sun />}</button>
          <button className={`btn-icon ${viewMode==='grid'?'active':''}`} onClick={()=>setViewMode('grid')} data-tip="グリッド表示（G）"><Icons.Grid /></button>
          <button className={`btn-icon ${viewMode==='list'?'active':''}`} onClick={()=>setViewMode('list')} data-tip="リスト表示（L）"><Icons.List /></button>
          <button className="btn-icon" onClick={()=>setHelpModal(true)} data-tip="ヘルプ（?）"><Icons.Help /></button>
          <div className="data-menu-wrapper" ref={dataMenuRef}>
            <button className={`btn-icon ${dataMenu ? 'active' : ''}`} onClick={() => setDataMenu(v => !v)} data-tip="データ管理"><Icons.Database /></button>
            {dataMenu && (
              <div className="data-menu-dropdown">
                <button className="data-menu-item" onClick={() => { onExport(); setDataMenu(false); }}>
                  <Icons.Download /> エクスポート（書き出し）
                </button>
                <label className="data-menu-item">
                  <Icons.Upload /> インポート（読み込み）
                  <input type="file" accept=".json" style={{ display: 'none' }} onChange={(e) => { onImport(e); setDataMenu(false); }} />
                </label>
              </div>
            )}
          </div>
          {ANNOUNCEMENTS.length > 0 && (
            <div className="announcement-wrapper" ref={announcementRef}>
              <button className={`btn-icon ${announcementDrawer ? 'active' : ''}`} onClick={() => setAnnouncementDrawer(v => !v)} data-tip="お知らせ">
                <Icons.Bell />
                {hasUnread && <span className="announcement-dot" />}
              </button>
              {announcementDrawer && (
                <div className="announcement-drawer">
                  <div className="announcement-drawer-header">
                    <h3>お知らせ</h3>
                    {hasUnread && activeAnnouncements.length > 1 && (
                      <button className="announcement-drawer-action" onClick={dismissAllAnnouncements}>すべて既読</button>
                    )}
                  </div>
                  <div className="announcement-drawer-body">
                    {activeAnnouncements.length > 0 && activeAnnouncements.map(a => (
                      <div key={a.id} className="announcement-item">
                        <div className="announcement-item-header">
                          <span className="announcement-label">{a.label}</span>
                          <span className="announcement-date">{a.date}</span>
                          <button className="announcement-item-dismiss" onClick={() => dismissAnnouncement(a.id)} aria-label="既読にする"><Icons.Close /></button>
                        </div>
                        <div className="announcement-item-title">{a.title}</div>
                        {a.body && <div className="announcement-item-body">{a.body}</div>}
                      </div>
                    ))}
                    {!hasUnread && <div className="announcement-drawer-empty">新しいお知らせはありません</div>}
                    {pastAnnouncements.length > 0 && (
                      <details className="announcement-past">
                        <summary>過去のお知らせ ({pastAnnouncements.length})</summary>
                        {pastAnnouncements.map(a => (
                          <div key={a.id} className="announcement-item is-past">
                            <div className="announcement-item-header">
                              <span className="announcement-label">{a.label}</span>
                              <span className="announcement-date">{a.date}</span>
                            </div>
                            <div className="announcement-item-title">{a.title}</div>
                            {a.body && <div className="announcement-item-body">{a.body}</div>}
                          </div>
                        ))}
                      </details>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <button className="btn-icon btn-add" onClick={()=>setModal("add")} data-tip="自分のプロンプトを追加"><Icons.Plus /> 追加</button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
