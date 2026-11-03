import { useEffect } from "react";
import { createPortal } from "react-dom";
import { MOD_LABEL } from "../constants";

// ─── Modal: HelpModal ────────────────────────────────────────────────────────
const HelpModal = ({ onClose, onStartTour, onResetData }) => {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return createPortal(
    <div className="modal-backdrop help-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal help-modal">
        <div className="help-modal-header">
          <h2>このアプリについて</h2>
          <button onClick={onClose} className="run-modal-icon-btn" style={{ fontSize: '20px', color: 'var(--ink2)' }}>×</button>
        </div>
        <div className="help-modal-body">
          <section className="help-section">
            <h3>概要</h3>
            <p>山形県南陽市が公開する「一発OK!! 市民も使える！生成AI活用実例集」のプロンプトデータを、検索・閲覧しやすくしたWebアプリです。南陽市の公式の許諾を得て、DX 担当者と直接調整のうえ Web アプリ化したもので、個人が開発・運営しています。</p>
            <button className="help-tour-btn" onClick={onStartTour}>ガイドツアーを見る</button>
          </section>

          <section className="help-section">
            <h3>使い方</h3>
            <ul>
              <li><strong>検索</strong> — キーワード、プロンプトID、カテゴリ名で検索できます。あいまい検索にも対応しています。</li>
              <li><strong>フィルタ</strong> — カテゴリボタンで絞り込み。「新着」で最近追加されたプロンプトを確認できます。</li>
              <li><strong>プロンプト実行</strong> — カードをクリックするとプロンプトの詳細を表示。「コピーしてAIで使う」でプロンプトをコピーし、選択したAIツール（ChatGPT / Gemini / Claude）を開きます。</li>
              <li><strong>お気に入り</strong> — ハートアイコンでお気に入りに登録。「お気に入り」フィルタで一覧表示できます。</li>
              <li><strong>カスタムプロンプト</strong> — 「追加」ボタンで自分だけのプロンプトを作成・管理できます。作成したデータはサーバーには送信されず、このブラウザ内にのみ保存されます。</li>
            </ul>
          </section>

          <section className="help-section">
            <h3>カスタムプロンプトの作成</h3>
            <p>右上の「＋ 追加」ボタンを押すと新規作成モーダルが開きます。</p>
            <ul>
              <li><strong>テンプレートから作成</strong> — 「文章要約」「コードレビュー」「メール作成」などの雛形を選ぶと各フィールドが自動入力されます。そのまま保存してもOKです。</li>
              <li><strong>シンプル入力</strong> — プロンプト本文を1つのテキストエリアにまとめて書く方式です。</li>
              <li><strong>セクション分割入力</strong> — 「セクション分割入力」ボタンで切り替えると、役割・前提条件・実行指示・ルール・出力形式など8つの欄に分けて入力できます。保存時に1つの本文へ自動変換されます。</li>
              <li><strong>変数の埋め込み</strong> — 本文に <code>{`{変数名}`}</code> と書くと、プロンプト実行時に入力欄が自動生成されます。例：<code>{`{対象の文章}`}</code> と書けば、実行ボタンを押したときにテキスト入力欄が現れます。</li>
              <li><strong>検出された変数</strong> — 入力中に <code>{`{}`}</code> で囲んだ単語を自動検出し、フォーム下部に一覧表示します。</li>
            </ul>
            <h4>セクションの説明</h4>
            <ul>
              <li><strong>目的・ねらい</strong> — このプロンプトで何を達成したいかを書きます。</li>
              <li><strong>あなたの役割</strong> — AIに与える役柄（例：「あなたは優秀な要約専門家です」）。</li>
              <li><strong>前提条件</strong> — AIが知っておくべき背景情報や制約。</li>
              <li><strong>実行指示 ＊</strong> — AIへの具体的な指示文（必須）。</li>
              <li><strong>ルール</strong> — 守らせたいルールや出力の制約。</li>
              <li><strong>出力形式</strong> — 箇条書き・表・マークダウンなど出力の形を指定。</li>
              <li><strong>補足</strong> — その他の補足情報。</li>
              <li><strong>変数設定</strong> — 実行時に入力させる変数名を1行ずつ列挙します。</li>
            </ul>
          </section>

          <section className="help-section">
            <h3>プロンプトデータについて</h3>
            <ul className="help-links">
              <li>出典：<a href="http://www.city.nanyo.yamagata.jp/dxchosei/5793" target="_blank" rel="noopener noreferrer">山形県南陽市「一発OK!! 市民も使える！生成AI活用実例集」</a></li>
              <li>南陽市公式サイト：<a href="http://www.city.nanyo.yamagata.jp/" target="_blank" rel="noopener noreferrer">http://www.city.nanyo.yamagata.jp/</a></li>
              <li>プロンプトデータ（GitHub）：<a href="https://github.com/nanyo-line/prompt" target="_blank" rel="noopener noreferrer">nanyo-line/prompt</a></li>
              <li>著作権：南陽市に帰属し、<a href="https://creativecommons.org/licenses/by/4.0/deed.ja" target="_blank" rel="noopener noreferrer">CC BY 4.0</a> の下で提供されています。</li>
            </ul>
            <p className="help-credit">南陽市DX普及主幹 佐野毅氏（<a href="https://x.com/ichigonme" target="_blank" rel="noopener noreferrer">@ichigonme</a>）による先進的な取り組みに感謝いたします。</p>
          </section>

          <section className="help-section">
            <h3>キーボードショートカット</h3>
            <ul className="help-shortcuts">
              <li><kbd>{MOD_LABEL}+K</kbd> 検索にフォーカス</li>
              <li><kbd>?</kbd> このヘルプを表示</li>
              <li><kbd>D</kbd> ダーク / ライト切替</li>
              <li><kbd>G</kbd> グリッド表示 / <kbd>L</kbd> リスト表示</li>
              <li><kbd>J</kbd> 最初のカードにフォーカス</li>
              <li><kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> カード間を移動</li>
              <li><kbd>Enter</kbd> フォーカス中のカードを開く</li>
              <li><kbd>Esc</kbd> モーダルを閉じる</li>
            </ul>
            <h4>プロンプト実行モーダル内</h4>
            <ul className="help-shortcuts">
              <li><kbd>F</kbd> フルスクリーン切替</li>
              <li><kbd>S</kbd> 設定（AIツール選択）パネル切替</li>
            </ul>
            <p className="help-shortcut-note">※ テキスト入力中は {MOD_LABEL}+K 以外のショートカットは無効です</p>
          </section>

          <section className="help-section">
            <h3>プロンプト入力の例</h3>
            <div className="help-example">
              <p><strong>例：#001 複雑な文章の要点をわかりやすく解説してもらう</strong></p>
              <p>プロンプト内の入力欄に要約したい文章を貼り付けて「コピーしてAIで使う」をクリックすると、プロンプト全体がクリップボードにコピーされ、選択したAIツールが開きます。</p>
              <p>AIツールの入力欄に貼り付けて送信すると、要点が箇条書きで整理された回答が得られます。</p>
            </div>
          </section>

          <section className="help-section">
            <h3>アプリ開発</h3>
            <ul className="help-links">
              <li>開発者：Ito Atsushi（<a href="https://x.com/AsagiriDesign" target="_blank" rel="noopener noreferrer">@AsagiriDesign</a>）</li>
              <li>ソースコード：<a href="https://github.com/BoxPistols/nanyo-prompt-app" target="_blank" rel="noopener noreferrer">GitHub</a>（MIT License）</li>
            </ul>
          </section>

          <section className="help-section">
            <h3>免責事項</h3>
            <ul className="help-disclaimer">
              <li>本アプリで提供するプロンプトは、特定の成果や情報の正確性を保証するものではありません。</li>
              <li>生成AIの特性上、出力結果には誤りや不適切な内容が含まれる可能性があります。生成された回答の正確性・妥当性・安全性および第三者の権利侵害の有無については、利用者自身の責任でファクトチェックを行ってください。</li>
              <li>本アプリの利用または利用できなかったことによって生じた直接的・間接的な損害について、本アプリ開発者および南陽市は一切の責任を負いません。</li>
              <li>元のプロンプトデータは試行的な取り組みとして提供されており、予告なく内容の変更または公開が中止される場合があります。</li>
            </ul>
          </section>

          <section className="help-section">
            <h3>データの保存について</h3>
            <p>このアプリで作成・変更したデータ（カスタムプロンプト・お気に入り・テーマ設定など）は、<strong>すべてお使いのブラウザの中だけに保存</strong>されます。インターネット上のサーバーには一切送信されません。</p>
            <ul>
              <li>別のブラウザやスマートフォンからは参照できません。</li>
              <li>ブラウザの「サイトのデータを削除」や「Cookieをすべて削除」を行うと、データが消える場合があります。</li>
              <li>大切なプロンプトは、下記の「エクスポート」でファイルに保存しておくことをおすすめします。</li>
            </ul>
            <h4>バックアップ・復元・共有</h4>
            <p>カスタムプロンプトとお気に入りをJSONファイルに書き出したり、ファイルから読み込んだりできます。機種変更やブラウザ変更の前にエクスポートしておくと安心です。他の人のプロンプトをインポートして共有することもできます。</p>
            <p style={{ fontSize: '13px', color: 'var(--ink3)', marginTop: '6px' }}>右上のデータアイコン（データベースマーク）からエクスポート・インポートを実行できます。インポート時は「追加」「マージ」「全て置き換え」の3方式から選べます。</p>
          </section>

          <section className="help-section help-reset-section">
            <h3>データの初期化</h3>
            <p>お気に入り、カスタムプロンプト、テーマ設定、オンボーディング履歴など、すべてのローカルデータを削除して初期状態に戻します。</p>
            <button className="help-reset-btn" onClick={onResetData}>すべてのデータを初期化</button>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HelpModal;
