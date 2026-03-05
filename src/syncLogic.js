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
    return { prompts: [...userPrompts, ...initialPrompts], hasChanged: true };
  }
  return { prompts: localPrompts, hasChanged: false };
}
