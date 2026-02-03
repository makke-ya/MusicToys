# MusicToys (おんがくのおもちゃばこ)

子供向けの音楽教育ウェブアプリプラットフォームです。楽しく遊びながら音感やリズム感を養うことができます。

## 🎮 収録ゲーム

### 1. [わおんあてクイズ](games/001_chord_quiz/)
和音（コード）の音を聞いて、正しい色を選ぶクイズゲームです。
- **対象年齢**: 3歳〜
- **特徴**: レベル別の和音聞き分け、成績グラフ表示

### 2. [ハーモニーをさがせ！](games/002_harmony_game/)
スライダーを動かして、きれいに響くハーモニーを見つけるゲームです。
- **対象年齢**: 4歳〜
- **特徴**: 純正律・平均律の響きの違いを体感、難易度別ランキング

### 3. [おと・アップダウン](games/003_sound_updown/)
2つの音を聞いて、音が上がったか下がったかを当てるゲームです。
- **対象年齢**: 1歳〜
- **特徴**: 絶対音感・相対音感の基礎トレーニング、かわいいアニメーション

## 🚀 実行方法

### ローカル開発

```bash
# プロジェクトルートで実行
npx http-server -p 8080
# ブラウザで `http://127.0.0.1:8080/` を開く
```

### AWS環境へのデプロイ

詳細は [docs/AWS_SETUP.md](docs/AWS_SETUP.md) を参照してください。

## 📁 プロジェクト構成

```
MusicToys/
├── index.html              # ゲームランチャー（トップページ）
├── games/                  # 各ゲームのディレクトリ
│   ├── 001_chord_quiz/     # 和音当てクイズ
│   ├── 002_harmony_game/   # ハーモニーゲーム
│   └── 003_sound_updown/   # おと・アップダウン
├── static/                 # 共通リソース
│   ├── common/             # 共通JS/CSS
│   ├── sounds/             # 共通音声ファイル
│   ├── thumbnails/         # ゲームサムネイル
│   └── config.js           # 環境設定
├── backend/                # AWS Lambda関数 (共通バックエンド)
│   └── lambda_function.py
└── docs/                   # ドキュメント
    ├── GAME_ARCHITECTURE.md # アーキテクチャ設計書
    └── AWS_SETUP.md        # AWS設定ガイド
```

## 🛠 技術スタック

- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript
- **Backend**: AWS Lambda (Python), DynamoDB
- **Hosting**: GitHub Pages / AWS S3

## 📄 ライセンス

このプロジェクトは教育目的で作成されています。
