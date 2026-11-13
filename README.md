# MusicToys (おんがくのおもちゃばこ)

子供向けの音楽教育ウェブアプリプラットフォームです。楽しく遊びながら音感・リズム感・音階・和音などを養うことができます。

🌐 **公開ページ (GitHub Pages)**: https://makke-ya.github.io/MusicToys

## 🎮 収録ゲーム

### 1. [わおんあてクイズ](games/001_chord_quiz/level_select.html)
和音（コード）の音を聞いて、正しい色を選ぶクイズゲームです。
- **対象年齢**: 3歳〜
- **特徴**: レベル別の和音聞き分け、成績グラフ表示

### 2. [ハーモニーをさがせ！](games/002_harmony_game/level_select.html)
スライダーを動かして、きれいに響くハーモニーを見つけるゲームです。
- **対象年齢**: 4歳〜
- **特徴**: 純正律・平均律の響きの違いを体感、難易度別ランキング

### 3. [おと・アップダウン](games/003_sound_updown/index.html)
2つの音を聞いて、音が上がったか下がったかを当てるゲームです。
- **対象年齢**: 1歳〜
- **特徴**: 絶対音感・相対音感の基礎トレーニング、かわいいアニメーション

### 4. [リズムにのろう！](games/004_rhythm_tap/index.html)
お手本のリズムを聞いて、同じリズムでたいこをたたいてマネするゲームです。
- **対象年齢**: 2歳〜
- **特徴**: 50レベルの段階的リズム練習、複数の打楽器音色、星評価＆ランキング

### 5. [メロディーおぼえよう！](games/005_melody_memory/index.html)
有名な童謡やアレンジ曲のメロディーを聞いて、同じ順番で音を鳴らすゲームです。
- **対象年齢**: 3歳〜
- **特徴**: ひかりガイドから耳コピまで50レベル、5種類の音色、ランキング対応

### 6. [おとのかいだん・パズル！](games/006_scale_puzzle/index.html)
音の高さを聞き比べて、階段のブロックを正しい順番に並べる音階パズルゲームです。
- **対象年齢**: 3歳〜
- **特徴**: 穴埋め・並べ替え・移調を含む50レベル、移動ド／固定ド表示切替対応

### 7. [まちがいさがし・おんがくたんてい！](games/007_melody_detective/index.html)
お手本先生とまねっこ生徒のメロディーを聞き比べて、違う音を見つける耳トレゲームです。
- **対象年齢**: 3歳〜
- **特徴**: 同じ／違うの2択から音の位置当てまで50レベル、リプレイ聴き比べ対応

### 8. [おおきい？ちいさい？たいこでドン！](games/008_dynamics_beat/index.html)
お手本の強い音（ドン！）と弱い音（トッ）を聞き分けて、同じ順番でたいこをたたく強弱リズムゲームです。
- **対象年齢**: 2歳〜
- **特徴**: フォルテ・ピアノ・メゾフォルテの聞き分け50レベル

### 9. [わおんの きもち！](games/009_chord_mood/index.html)
明るい☀️・悲しい🌧️・不思議🌙などの和音の響きを聞き分けて、お天気パネルをタッチするゲームです。
- **対象年齢**: 3歳〜
- **特徴**: メジャー／マイナー／サスフォー等の響き学習、不正解時の聴き比べリプレイ対応

## 📊 管理ダッシュボード

各ゲームのプレイ結果・スコア履歴を一覧・グラフで確認できます。
- 公開URL: https://makke-ya.github.io/MusicToys/games/admin.html
- ファイル: [games/admin.html](games/admin.html)（閲覧には `ADMIN_KEY` が必要です）

## 🚀 実行方法

### ローカル開発

```bash
# プロジェクトルートで実行
npx http-server -p 8080
# ブラウザで `http://127.0.0.1:8080/` を開く
```

### テスト実行

```bash
# 単体テスト (Jest)
npm test

# 結合テスト (Puppeteer)
npm run testi
```

### AWS環境へのデプロイ

詳細は [docs/AWS_SETUP.md](docs/AWS_SETUP.md) を参照してください。

## 📁 プロジェクト構成

```
MusicToys/
├── index.html                  # ゲームランチャー（トップページ）
├── games/                      # 各ゲームのディレクトリ
│   ├── admin.html              # 全ゲーム共通 管理ダッシュボード
│   ├── 001_chord_quiz/         # わおんあてクイズ
│   ├── 002_harmony_game/       # ハーモニーをさがせ！
│   ├── 003_sound_updown/       # おと・アップダウン
│   ├── 004_rhythm_tap/         # リズムにのろう！
│   ├── 005_melody_memory/      # メロディーおぼえよう！
│   ├── 006_scale_puzzle/       # おとのかいだん・パズル！
│   ├── 007_melody_detective/   # まちがいさがし・おんがくたんてい！
│   ├── 008_dynamics_beat/      # おおきい？ちいさい？たいこでドン！
│   └── 009_chord_mood/         # わおんの きもち！
├── static/                     # 共通リソース
│   ├── common/                 # 共通JS/CSS (score-manager.js, site.js 等)
│   ├── sounds/                 # 共通音声ファイル
│   ├── thumbnails/             # ゲームサムネイル
│   └── config.js               # 環境設定 (API_ENDPOINT 等)
├── backend/                    # AWS Lambda関数 (共通バックエンド)
│   └── lambda_function.py
├── __tests__/                  # 単体テスト (Jest)
├── integration/                # 結合テスト (Puppeteer)
└── docs/                       # ドキュメント
    ├── GAME_ARCHITECTURE.md    # アーキテクチャ設計書
    └── AWS_SETUP.md            # AWS設定ガイド
```

## 🛠 技術スタック

- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript, Vue.js 3, Chart.js, Web Audio API
- **Backend**: AWS Lambda (Python), API Gateway, DynamoDB
- **Testing**: Jest, Puppeteer
- **Hosting**: GitHub Pages / AWS S3

## 📄 ライセンス

このプロジェクトは教育目的で作成されています。
