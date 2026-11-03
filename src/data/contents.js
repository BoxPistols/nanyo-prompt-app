// 本文データ (約 6MB) は JS バンドルに含めず、ハッシュ付き静的アセットとして配信する。
// ファイル自体は src/data/contents.json のまま置くことで、日次同期 (scraper/sync_upstream.py)
// の出力先を変えずに済み、内容が変わればビルドごとに URL も変わるのでキャッシュが古くならない。
import contentsUrl from "./contents.json?url";

let contentsPromise = null;

export const loadContents = () => {
  if (!contentsPromise) {
    contentsPromise = fetch(contentsUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`contents.json: HTTP ${res.status}`);
        return res.json();
      })
      .catch((err) => {
        // 失敗した Promise を保持すると再試行できなくなるため破棄する
        contentsPromise = null;
        throw err;
      });
  }
  return contentsPromise;
};
