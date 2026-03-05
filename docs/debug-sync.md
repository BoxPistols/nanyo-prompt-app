# データ同期のデバッグ方法

アプリのソースデータ（南陽市公式プロンプト）が更新された際、ユーザーが自分で追加したプロンプトが正しく保持されるかを確認する手順です。

## 自動テスト

```bash
npx vitest run
```

`src/syncLogic.test.js` に10件のテストがあり、以下を検証します:

- ソースデータが増減しても、ユーザー追加プロンプトが残ること
- ソースが完全に入れ替わっても、ユーザー追加プロンプトが残ること
- ソースの件数が同じでも中身が変わったケースを検知できること

## ブラウザでの手動デバッグ

ブラウザの開発者ツール（F12 → Console タブ）で実行します。

### 1. 現在のデータ状況を確認

```js
const data = JSON.parse(localStorage.getItem('nanyo_prompts_v5_data'));
const user = data.filter(p => p.isUser);
const source = data.filter(p => !p.isUser);
console.log(`全体: ${data.length}件, ソース: ${source.length}件, ユーザー追加: ${user.length}件`);
console.table(user.map(p => ({ id: p.id, title: p.title })));
```

### 2. テスト用のユーザープロンプトを追加

UIの「+ 追加」ボタンからでも可能ですが、Consoleから直接追加もできます:

```js
const data = JSON.parse(localStorage.getItem('nanyo_prompts_v5_data'));
data.unshift({ id: 99999, title: "テスト用プロンプト", isUser: true });
localStorage.setItem('nanyo_prompts_v5_data', JSON.stringify(data));
location.reload();
```

リロード後に「テスト用プロンプト」が表示されていれば追加成功です。

### 3. データ同期を疑似的に発生させる

ソースプロンプトを1件削除して、ソースデータの件数を意図的にずらします:

```js
const data = JSON.parse(localStorage.getItem('nanyo_prompts_v5_data'));
const idx = data.findIndex(p => !p.isUser);
console.log(`削除するソースプロンプト: "${data[idx].title}"`);
data.splice(idx, 1);
localStorage.setItem('nanyo_prompts_v5_data', JSON.stringify(data));
location.reload();
```

リロード時に `mergePrompts` が発動し、ソースデータが最新の `INITIAL_PROMPTS` に置き換わります。

### 4. ユーザープロンプトが保持されているか確認

```js
const data = JSON.parse(localStorage.getItem('nanyo_prompts_v5_data'));
const user = data.filter(p => p.isUser);
console.log(`ユーザープロンプト: ${user.length}件`);
console.table(user.map(p => ({ id: p.id, title: p.title })));
```

手順2で追加した「テスト用プロンプト」が残っていれば、同期ロジックは正常に動作しています。

### 5. テスト後のクリーンアップ

テスト用プロンプトを削除する場合:

```js
const data = JSON.parse(localStorage.getItem('nanyo_prompts_v5_data'));
const cleaned = data.filter(p => p.id !== 99999);
localStorage.setItem('nanyo_prompts_v5_data', JSON.stringify(cleaned));
location.reload();
```

## お気に入りの確認

お気に入り（ハートマーク）はプロンプトIDで管理されています:

```js
const favs = JSON.parse(localStorage.getItem('nanyo_prompts_v5_favs') || '[]');
console.log(`お気に入り: ${favs.length}件`, favs);
```

## 同期ロジックの仕組み

`src/syncLogic.js` の `mergePrompts` 関数が同期処理を担当しています:

1. localStorageのデータを「ソース（`isUser: false`）」と「ユーザー追加（`isUser: true`）」に分離
2. ソースのIDセットと `INITIAL_PROMPTS` のIDセットを比較
3. 差異がある場合:ユーザー追加分を保持しつつ、ソースを最新に入れ替え
4. 差異がない場合:localStorageのデータをそのまま使用
