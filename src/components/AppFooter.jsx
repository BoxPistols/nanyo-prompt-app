const AppFooter = () => (
  <footer className="app-footer">
    <div className="footer-inner">
      <div className="footer-attribution">
        <p className="footer-source">
          プロンプトデータの出典：<a href="http://www.city.nanyo.yamagata.jp/dxchosei/5793" target="_blank" rel="noopener noreferrer">山形県南陽市「一発OK!! 市民も使える！生成AI活用実例集」</a>
        </p>
        <p className="footer-license">
          プロンプトデータは南陽市に著作権が帰属し、<a href="https://creativecommons.org/licenses/by/4.0/deed.ja" target="_blank" rel="noopener noreferrer">CC BY 4.0</a> の下で提供されています。
        </p>
        <p className="footer-app-note">
          本アプリは南陽市の公式の許諾を得て、DX 担当者と直接調整のうえ公開データを Web アプリ化したもので、個人が開発・運営しています。
        </p>
      </div>
      <div className="footer-developer">
        開発：Ito Atsushi（<a href="https://github.com/BoxPistols/nanyo-prompt-app" target="_blank" rel="noopener noreferrer">GitHub</a> / <a href="https://x.com/AsagiriDesign" target="_blank" rel="noopener noreferrer">X</a> / <a href="https://zenn.dev/ait/articles/nanyo-prompt-app" target="_blank" rel="noopener noreferrer">技術記事</a>）｜<a href="https://github.com/BoxPistols/nanyo-prompt-app/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">MIT License</a>
      </div>
      <details className="footer-disclaimer">
        <summary>免責事項</summary>
        <div className="footer-disclaimer-body">
          <ul>
            <li>本アプリで提供するプロンプトは、特定の成果や情報の正確性を保証するものではありません。</li>
            <li>生成AIの特性上、出力結果には誤りや不適切な内容が含まれる可能性があります。生成された回答の正確性・妥当性・安全性および第三者の権利侵害の有無については、利用者自身の責任でファクトチェックを行ってください。</li>
            <li>本アプリの利用または利用できなかったことによって生じた直接的・間接的な損害（データの損失、業務の中断、権利侵害等を含む）について、本アプリ開発者および南陽市は一切の責任を負いません。</li>
            <li>元のプロンプトデータは試行的な取り組みとして提供されており、予告なく内容の変更または公開が中止される場合があります。</li>
          </ul>
        </div>
      </details>
    </div>
  </footer>
);

export default AppFooter;
