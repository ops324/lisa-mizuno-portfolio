# Lisa Mizuno — Portfolio

DJ / アーティスト Lisa Mizuno のポートフォリオサイト。
シネマティックな演出と日本語タイポグラフィを軸にした、静的サイト（ビルドレス）です。

---

## Tech stack

| 領域 | 採用技術 |
| --- | --- |
| マークアップ / スタイル | セマンティック HTML5 + 素の CSS（カスタムプロパティでトークン管理） |
| スクリプト | Vanilla JavaScript（ESM、ビルドステップなし） |
| アニメーション | GSAP 3.12 + ScrollTrigger（パララックス・クリップパス演出）、Lenis（スムーススクロール） |
| フォント | Cormorant Garamond / Space Grotesk / Shippori Mincho（Google Fonts） |
| ホスティング / CI | Vercel（GitHub 連携で自動デプロイ）/ GitHub Actions |
| 品質ツール | Biome（Lint + Format）・html-validate・Lighthouse CI・gitleaks |

外部スクリプト（GSAP / Lenis）は **SRI（Subresource Integrity）** 付きで読み込み、CDN 改ざんに備えています。

---

## Lighthouse

ローカルの静的ビルドに対し Lighthouse CI で計測（3 回計測の中央値、2026-05-31 時点）。
CI で push ごとに再計測されます。

| Performance | Accessibility | Best Practices | SEO |
| :---: | :---: | :---: | :---: |
| 72 | 96 | 100 | 100 |

> Performance はヒーロー／ギャラリーの動画・大判画像が支配的要因です。本番（Vercel の CDN・圧縮配信）ではこれより高くなります。改善余地は「動画のさらなる軽量化・遅延読み込み」。

---

## アクセシビリティ / パフォーマンス配慮

- `prefers-reduced-motion` を尊重し、該当ユーザーには GSAP / Lenis を無効化
- 背景動画は `muted` / `playsinline` でモバイル含め自動再生、装飾要素は `aria-hidden`
- `:focus-visible` によるキーボードフォーカス可視化、scroll-spy、Esc でのメニュー閉じ
- iOS Safari の `--vh` 問題対策（リサイズ時の再計算を幅変化時のみに限定し、スクロール中のジャンクを回避）

---

## 開発

```bash
npm install          # 開発ツールの取得（本番配信物には含まれない）

npm run lint         # Biome（JS / CSS の Lint + Format チェック）
npm run lint:fix     # 自動修正
npm run format       # 整形のみ
npm run validate:html # html-validate
npm run check        # lint + validate:html をまとめて実行
npm run lighthouse   # Lighthouse CI（事前に dist/ の用意が必要、下記参照）
```

サイト本体はビルド不要です。ローカル確認は任意の静的サーバで:

```bash
npx serve .          # など
```

### Lighthouse をローカルで回す場合

`lighthouserc.json` は `dist/` を静的ルートとして見ます（`node_modules` の混入を避けるため）。

```bash
mkdir -p dist
cp index.html style.css script.js favicon.* apple-touch-icon.png dist/
cp -r images dist/
npm run lighthouse
```

---

## デプロイ

`main` への push で Vercel が自動デプロイします。サイトは一般公開（認証なし）です。

---

## CI（GitHub Actions）

`.github/workflows/ci.yml` が push / PR で 3 ジョブを実行します。

- **Lint & HTML validate** — Biome + html-validate
- **Secret scan** — gitleaks（資格情報・トークンの混入検出）
- **Lighthouse CI** — Performance / Accessibility / Best Practices / SEO

---

## プロジェクト構成

```
.
├── index.html              # 1 ページ構成（Hero / Works / Gallery / About / Connect）
├── style.css               # トークン（:root）+ セクション別スタイル
├── script.js               # スムーススクロール・GSAP 演出・言語トグル等
├── images/                 # 画像・動画アセット
├── biome.json              # Lint / Format 設定
├── .htmlvalidate.json      # HTML バリデーション設定
├── lighthouserc.json       # Lighthouse CI 設定
└── .github/workflows/ci.yml
```
