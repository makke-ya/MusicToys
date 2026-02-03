# 和音当てクイズアプリ

子供向けの音楽教育アプリケーション。和音（コード）の音を聞いて、正しい色を選ぶクイズゲームです。

## 📊 イベントフロー図

### ユーザージャーニー全体図

```mermaid
flowchart TD
    Start([アプリ起動]) --> Index[index.html<br/>トップページ]
    Index --> |名前入力| LevelSelect[level_select.html<br/>レベル選択]
    LevelSelect --> |設定選択| ChordCheck[chord_check.html<br/>和音確認]
    ChordCheck --> |スタート| Quiz[quiz.html<br/>クイズ画面]
    Quiz --> |10問完了| Result[result.html<br/>結果表示]
    Result --> |もういちど| ChordCheck
    Result --> |タイトルへ| Index
    Result --> |グラフをみる| Stats[stats.html<br/>成績グラフ]
    Stats --> |もどる| Index
    
    ChordCheck -.->|もどる| LevelSelect
    
    Index -.->|エラー発生| Error[error.html<br/>エラー画面]
    Quiz -.->|エラー発生| Error
    Error -.->|再読込/タイトルへ| Index
    
    style Quiz fill:#e1f5ff
    style Result fill:#fff4e1
    style Error fill:#ffe1e1
```

### クイズ画面の詳細フロー

```mermaid
stateDiagram-v2
    [*] --> 音声再生中
    音声再生中 --> ボタン表示: 2秒後
    ボタン表示 --> 回答待機: ボタン有効化
    回答待機 --> 回答処理: ボタンクリック
    
    回答処理 --> 正解判定: answered=true
    正解判定 --> 正解表示: 正解の場合
    正解判定 --> 不正解表示: 不正解の場合
    
    正解表示 --> 次の問題準備: 1.5秒後
    不正解表示 --> 次の問題準備: 1.5秒後
    
    回答待機 --> 回答待機: answered=true時は無視
    
    次の問題準備 --> 音声再生中: index < 10
    次の問題準備 --> [*]: index >= 10<br/>結果画面へ遷移
    
    note right of 回答処理
        競合状態防止機構:
        1. answered フラグチェック
        2. ボタン即座に無効化
        3. index範囲チェック
    end note
```

### データフロー図

```mermaid
flowchart LR
    subgraph Browser["ブラウザ (localStorage)"]
        LS1[selectedLevel]
        LS2[instant]
        LS3[username]
        LS4[iconSet]
        LS5[lastAnswers]
        LS6[pastResults]
    end
    
    subgraph Pages["ページ"]
        P1[index.html]
        P2[level_select.html]
        P3[quiz.html]
        P4[result.html]
    end
    
    subgraph AWS["AWS Services"]
        S3[S3 Bucket<br/>静的ホスティング]
        API[API Gateway]
        Lambda[Lambda関数]
        DDB[DynamoDB]
    end
    
    P1 -->|保存| LS3
    P2 -->|保存| LS1
    P2 -->|保存| LS2
    P2 -->|保存| LS4
    P3 -->|保存| LS5
    P4 -->|読取| LS5
    P4 -->|保存| LS6
    P4 -->|POST| API
    
    API --> Lambda
    Lambda --> DDB
    
    S3 -.->|配信| Pages
    
    style AWS fill:#fff3cd
    style Browser fill:#d4edda
```

## 🎯 主な機能

### 1. レベル選択 (1-13)
- 和音の種類が段階的に増加
- レベル1: 2種類の和音
- レベル13: 14種類の和音

### 2. 解答モード
- **すぐにこたえをみる**: 即座に正誤判定（子供向け）
- **あとでこたえをみる**: 確定ボタンで判定（学習モード）

### 3. アイコン選択
- **どうぶつ**: 動物イラストで視覚的にサポート
- **のりもの**: 乗り物イラスト
- **なし**: 色のみ

### 4. 誤操作防止機能 (子供向け最適化)
- ✅ ピンチズーム無効化
- ✅ ダブルタップズーム無効化
- ✅ テキスト選択無効化
- ✅ 長押しメニュー無効化
- ✅ 競合状態防止（連打対策）

### 5. 成績記録
- **ローカル**: `localStorage`に最新20件保存
- **クラウド**: AWS DynamoDBに永続保存
- **グラフ表示**: Chart.jsで成績推移可視化

## 🛠 技術スタック

### フロントエンド
- **HTML5** + **Tailwind CSS**: レスポンシブUI
- **Vanilla JavaScript**: 軽量で高速
- **Vue.js**: 一部ページで使用
- **Chart.js**: 成績グラフ表示

### バックエンド（オプション）
- **AWS S3**: 静的ホスティング
- **AWS API Gateway**: REST API
- **AWS Lambda**: Python 3.12
- **AWS DynamoDB**: NoSQLデータベース

### 音声ファイル
- **MP3形式**: `static/sounds/`配置
- **命名規則**: `01_red.mp3`, `02_yellow.mp3`...

## 🔧 主要コンポーネント

### site.js
- `generateQuiz()`: クイズ問題生成（連続回避ロジック）
- `createChordButton()`: 和音ボタン動的生成
- `getSoundsForLevel()`: レベル別音声ファイル取得

### quiz.html
- **競合状態防止機構**:
  1. `answered`フラグで重複回答防止
  2. ボタン即座無効化
  3. `index`範囲チェック（オーバーフロー防止）
- **自動進行**: 1.5秒後に次の問題へ

### result.html
- **ローカル保存**: `pastResults`に追加
- **AWS送信**: API Gateway経由でDynamoDBへ
- **評価メッセージ**: 正解率に応じた励まし

## 📱 モバイル最適化

### タッチ操作
- `touch-action: manipulation`: ダブルタップズーム無効
- `user-select: none`: テキスト選択無効
- `-webkit-touch-callout: none`: 長押しメニュー無効

### ビューポート設定
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
```

### レスポンシブグリッド
- モバイル: 2列レイアウト
- タブレット以上: 4列レイアウト
