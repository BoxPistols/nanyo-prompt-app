import { RAW } from "../data/prompts";
import CatIcon from "./CatIcon";
import * as Icons from "./Icons";

// カテゴリ・新着・お気に入り・マイプロンプトは排他的に選ぶ（1 つ選ぶと他は解除）
const CategoryFilters = ({ totalCount, userCount, activeC1, setActiveC1, showNew, setShowNew, showFav, setShowFav, showUser, setShowUser, setPage }) => (
  <div className="filters">
    <button className={`chip ${!activeC1 && !showNew && !showFav && !showUser ? 'active' : ''}`} onClick={()=>{setActiveC1("");setShowNew(false);setShowFav(false);setShowUser(false);setPage(0)}}>
      すべて <span className="chip-count">{totalCount}</span>
    </button>
    {RAW.c1.map(c => (
      <button key={c} className={`chip ${activeC1 === c ? 'active' : ''}`} onClick={()=>{setActiveC1(activeC1===c?"":c);setShowNew(false);setShowFav(false);setShowUser(false);setPage(0)}}>
        <CatIcon cat={c} /> {c}
      </button>
    ))}
    <button className={`chip chip-new ${showNew ? 'active' : ''}`} onClick={()=>{setShowNew(!showNew);setActiveC1("");setShowFav(false);setShowUser(false);setPage(0)}}><Icons.Zap /> 新着</button>
    <button className={`chip ${showFav ? 'active' : ''}`} onClick={()=>{setShowFav(!showFav);setActiveC1("");setShowNew(false);setShowUser(false);setPage(0)}} style={showFav?{background:'#fee2e2',color:'#ef4444',borderColor:'#ef4444'}:{}}><Icons.Heart /> お気に入り</button>
    {userCount > 0 && (
      <button className={`chip chip-user ${showUser ? 'active' : ''}`} onClick={()=>{setShowUser(!showUser);setActiveC1("");setShowNew(false);setShowFav(false);setPage(0)}}><Icons.User /> マイプロンプト <span className="chip-count">{userCount}</span></button>
    )}
  </div>
);

export default CategoryFilters;
