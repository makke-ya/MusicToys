# AWS環境セットアップ手順

クイズの結果をクラウド（AWS）に保存し、管理者ダッシュボードで閲覧するための設定手順です。GitHub Pages等で公開する場合のセキュリティ設定も含みます。

## 1. DynamoDBの作成（データベース）

1. AWSコンソールで [DynamoDB](https://console.aws.amazon.com/dynamodb/) を開きます。
2. 「テーブルの作成」をクリックします。
3. **テーブル名**: `ChordQuizResults` (または `ChordQuizDB` ※Lambdaコードと合わせる)
4. **パーティションキー**: `userId` (文字列)
5. **ソートキー**: `timestamp` (文字列)
6. その他の設定はデフォルトのまま「テーブルの作成」をクリックします。

## 2. Lambda関数の作成（プログラム）

1. AWSコンソールで [Lambda](https://console.aws.amazon.com/lambda/) を開きます。
2. 「関数の作成」をクリックします。
3. **一から作成** を選択。
4. **関数名**: `ChordQuizResultHandler` (任意)
5. **ランタイム**: `Python 3.12` (または最新)
6. 作成後、「コード」タブでデフォルトのコードを削除し、ローカルの `backend/lambda_function.py` の内容をコピー＆ペーストします。
7. 「Deploy」をクリックして保存します。

### 環境変数の設定 (重要)
コード内にパスワードを直接書かないために、環境変数を使用します。

1. Lambdaの「設定」タブ → 「環境変数」を開きます。
2. 「編集」をクリックし、以下の変数を追加します。
   - **キー**: `ADMIN_KEY`
   - **値**: (任意の管理者用パスワード ※例: `kanasana123`)
3. 「保存」します。

## 3. 権限の設定（IAM）

LambdaがDynamoDBにアクセスできるようにします。

1. Lambda関数の「設定」タブ → 「アクセス権限」を開きます。
2. 「実行ロール」のリンクをクリックしてIAMコンソールを開きます。
3. 「許可を追加」→「ポリシーをアタッチ」で `AmazonDynamoDBFullAccess` を追加します。

## 4. API Gatewayの作成（公開用URL）

1. AWSコンソールで [API Gateway](https://console.aws.amazon.com/apigateway/) を開きます。
2. **HTTP API** を選択して「構築」。
3. **統合を追加**: 作成したLambda関数 (`ChordQuizResultHandler`) を指定。
4. **API名**: `ChordQuizAPI` (任意)
5. ルートの設定:
   - メソッド: `ANY` (または `GET`, `POST`, `OPTIONS` を個別に設定)
   - リソースパス: `/result`
6. 作成完了後、**APIエンドポイントURL** を控えておきます。

## 5. アプリへの反映 (config.js)

1. ローカルの `static/config.js` を開きます（無ければ `config.sample.js` から作成）。
2. `API_ENDPOINT` に、上記で作成したURLを入力します。
   ```javascript
   API_ENDPOINT: 'https://xxxx.execute-api.ap-northeast-1.amazonaws.com/result'
   ```

## 6. セキュリティ設定 (GitHub Pages公開用)

公開サーバーに配置する場合、以下の設定を行ってください。

### A. CORS設定 (ドメイン制限)
1. API Gatewayのサイドメニュー「CORS」を開く。
2. **Access-Control-Allow-Origin**: GitHub PagesのURLのみを指定 (例: `https://yourname.github.io`)
   - ※末尾に `/` をつけないこと
   - ※まだテスト中なら `*` でも可
3. **Methods**: `GET, POST, OPTIONS`
4. **Headers**: `content-type`
5. 保存します。

### B. スロットリング (連打対策)
1. サイドメニュー「ステージ」→ `$default` (または作成したステージ) を選択。
2. 「ルート設定」タブ等はデフォルトのままでOKですが、「編集」から「スロットリング」を有効化することをお勧めします。
   - **レート**: `10` (1秒あたり10リクエスト)
   - **バースト**: `20`
   - ※これで攻撃を受けてもAWSの高額請求を防げます。

