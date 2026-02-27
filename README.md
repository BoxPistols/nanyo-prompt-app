# 南陽市DX Prompts

山形県南陽市が公開する「一発OK!! 市民も使える！生成AI活用実例集」のプロンプトデータを、検索・閲覧しやすくしたWebアプリです。

**https://nanyo-prompt.vercel.app/**

南陽市の確認のもと、個人が開発・運営しています。

## プロンプトデータの出典・著作権

本アプリで使用しているプロンプトデータは、山形県南陽市が公開する以下のデータを出典としています。

| 項目 | 内容 |
|------|------|
| 出典 | [山形県南陽市「一発OK!! 市民も使える！生成AI活用実例集」](http://www.city.nanyo.yamagata.jp/dxchosei/5793) |
| 南陽市公式サイト | [http://www.city.nanyo.yamagata.jp/](http://www.city.nanyo.yamagata.jp/) |
| プロンプトデータ（GitHub） | [nanyo-line/prompt](https://github.com/nanyo-line/prompt) |
| 著作権 | 南陽市に帰属 |
| ライセンス | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.ja) |

南陽市DX普及主幹 佐野毅氏（[@ichigonme](https://x.com/ichigonme)）による先進的な取り組みに感謝いたします。

## 機能

- キーワード・ID・カテゴリによる検索（あいまい検索対応）
- カテゴリフィルタ・新着フィルタ
- プロンプトのコピー＆AIツール連携（ChatGPT / Gemini / Claude）
- 入力フォーム付きプロンプトの変数埋め込み
- お気に入り登録
- カスタムプロンプトの追加・編集・削除
- ダークモード
- レスポンシブ対応（モバイル / デスクトップ）

## 開発

```bash
npm install
npm run dev
```

### プロジェクト構成

- `src/` — React フロントエンド（Vite）
  - `src/App.jsx` — メインアプリケーション
  - `src/data/prompts.js` — カテゴリ定義とデータ処理
  - `src/data/raw_data.json` — プロンプトデータ
  - `src/utils/search.js` — 検索ロジック
- `scraper/` — プロンプト本文取得用スクレイパー（Python）

### HTMLプロンプトのパース処理について

南陽市のプロンプトHTMLは `<h3>` 見出し + `<textarea>` の組み合わせで入力フォームを構成しています。スクレイパーは `BeautifulSoup.get_text()` でHTML構造をプレーンテキストに変換するため、以下のようなHTMLパターンで重複が発生する場合があります。

**元のHTML構造（例: #304）**

```html
<h3>AIモデル①の回答</h3>
<textarea name="hensu2">
AIモデル①の名称：
AIモデル①の回答：
</textarea>
```

**テキスト変換後**

```
AIモデル①の回答       ← h3 の見出しテキスト
AIモデル①の名称：     ← textarea のデフォルト値
AIモデル①の回答：     ← textarea のデフォルト値
```

これにより「AIモデル①の回答」「AIモデル①の名称：」「AIモデル①の回答：」が別々の入力欄として認識されてしまいます。

**対処方法**

アプリ側（`src/App.jsx`）のセクション変数パース処理で、コロン（`：`）付きサブ項目を直前の親項目に統合するロジックを実装しています。これにより、上記の3項目は「AIモデル①の回答」1つの入力欄に集約されます。

## 開発者

**Ito Atsushi**
- X: [@AsagiriDesign](https://x.com/AsagiriDesign)
- GitHub: [@BoxPistols](https://github.com/BoxPistols)

## ライセンス

アプリケーションのソースコードは [MIT License](./LICENSE) の下で公開しています。

プロンプトデータ自体は南陽市に著作権が帰属し、[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.ja) の下で提供されています。
