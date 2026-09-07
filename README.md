# スターライト・グランプリ

軽量な低ポリゴンの宇宙レース。レーサーと専用機を選び、月面・火星・リング惑星・氷の彗星を走ります。

[公開版](https://esma-dev-studio.github.io/starlight-grand-prix/)

## ローカル起動

実行時のパッケージインストールやビルドは不要です。プロジェクトのフォルダで以下を実行し、`http://127.0.0.1:8765` を開きます。

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

ES Modules を使用するため、HTML ファイルの直接オープンではなく HTTP サーバーを使ってください。Three.js 0.160.0 は `vendor/` に固定して同梱しています。ライセンスは `vendor/THREE-LICENSE.txt` にあります。

## 操作

- キーボード: 矢印 / WASD、スペースでドリフト、E / Shiftで道具、Escでポーズ。
- タッチ: 左のパッドで左右、右の「すすむ」を同時に押す。「どうぐ」が光ったらタップ。
- タイトルとポーズ画面から「あそびかた」を開けます。

## 品質チェック

テストには Node.js と開発用の `playwright`、`sharp` が必要です。ゲームの実行には不要です。

```powershell
npm install --no-save --package-lock=false playwright sharp
npx playwright install chromium
node tools/race-check.cjs
node tools/touch-check.cjs
node tools/perf-check.cjs
```

- `race-check`: 全4コースのCPU走行、左右の物理方向、6種の道具の実効果、リスタート後のGPUリソース解放。
- `touch-check`: iPad・スマートフォン相当の縦横4サイズ、同時タッチ、画面遷移、HUDの重なり、空白でない3Dキャンバス。
- `perf-check`: 同じ月面カメラ・タッチ端末設定で旧版 `507a6b6` と描画コストを比較。`QA_BASE_REF` で比較先を変更できます。
- スクリーンショットと計測JSONは Git 対象外の `artifacts/` に出力されます。
- テスト専用操作は Playwright がローカル応答に注入します。公開ゲームには含まれません。

画面エミュレーションは実機の速度・Safari互換性の保証ではありません。実物のiPadでの長時間プレイは別途確認が必要です。

## アート

`vehicle-art.js` がゲーム内の5台とパイロットを生成します。選択画像は `node tools/render-vehicles.cjs`、表紙は `node tools/render-cover.cjs` で同じ3Dモデルからオフライン描画します。メニュー表示のために3Dを常時回す必要はありません。

`scene-art.js` は地球、地形の路肩、接地影と走路に重なる背景物の除外を担当します。大きな形と色でコースの違いを出し、リアルタイムの影や多数の点光源に依存しない構成です。
