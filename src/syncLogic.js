/**
 * ソースデータ同期ロジック
 * localStorageに保存されたプロンプトと最新のソースデータをマージする
 */

/**
 * ローカルデータと最新ソースデータを比較し、必要に応じてマージする
 * @param {Array} localPrompts - localStorageから取得したプロンプト配列
 * @param {Array} initialPrompts - 最新のソースプロンプト配列
 * @returns {{ prompts: Array, hasChanged: boolean }}
 */
export function mergePrompts(localPrompts, initialPrompts) {
  const localSource = localPrompts.filter(p => !p.isUser);
  const userPrompts = localPrompts.filter(p => p.isUser);
  const initialIds = new Set(initialPrompts.map(p => p.id));
  const localSourceIds = new Set(localSource.map(p => p.id));
  const hasChanged = initialIds.size !== localSourceIds.size ||
    [...initialIds].some(id => !localSourceIds.has(id));

  if (hasChanged) {
    const removedIds = [...localSourceIds].filter(id => !initialIds.has(id));
    return {
      prompts: [...userPrompts, ...initialPrompts],
      hasChanged: true,
      removedIds,
    };
  }
  return { prompts: localPrompts, hasChanged: false, removedIds: [] };
}

/**
 * お気に入りから削除済みプロンプトのIDを除去する
 * @param {Set} favs - 現在のお気に入りIDセット
 * @param {Array} removedIds - 削除されたプロンプトのID配列
 * @returns {{ favs: Set, cleaned: number }}
 */
export function cleanFavs(favs, removedIds) {
  if (!removedIds.length) return { favs, cleaned: 0 };
  const removedSet = new Set(removedIds);
  const cleaned = [...favs].filter(id => removedSet.has(id));
  if (!cleaned.length) return { favs, cleaned: 0 };
  const newFavs = new Set([...favs].filter(id => !removedSet.has(id)));
  return { favs: newFavs, cleaned: cleaned.length };
}
