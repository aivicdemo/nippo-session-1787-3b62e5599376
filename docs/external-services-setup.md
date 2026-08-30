# 外部サービス接続設定手順

「朝会報告管理システム」 が利用する外部サービスの接続設定手順です。 設定値は稼働環境の環境変数として与えます。 ソースコードに直接書き込まないでください。

## Slack API / Microsoft Teams API

用途: 毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信する
実装ファイル: `src/adapters/notification-service-adapter.ts`

### 必要な設定値

| 環境変数 | 用途 | 取得方法 |
| --- | --- | --- |
| `SLACK_BOT_TOKEN` | Slack APIへの認証に使用するボットトークン | Slack Workspace管理画面 > アプリ管理 > 対象アプリ > OAuth & Permissions > Bot User OAuth Token から取得 |
| `SLACK_SIGNING_SECRET` | Slack APIからのリクエスト署名検証に使用するシークレット | Slack Workspace管理画面 > アプリ管理 > 対象アプリ > Basic Information > Signing Secret から取得 |
| `TEAMS_WEBHOOK_URL` | Microsoft Teams通知送信先のWebhook URL | Microsoft Teams > チャネル設定 > コネクタ > 受信Webhook > URL をコピーして取得 |
| `NOTIFICATION_SCHEDULE_TIME` | 毎日のリマインド通知を送信する時刻（HH:mm形式） | 業務要件に基づいて設定（例：09:00） |
| `NOTIFICATION_TIMEZONE` | スケジュール実行のタイムゾーン | 稼働環境のタイムゾーン指定（例：Asia/Tokyo） |
| `SLACK_CHANNEL_ID` | Slackでリマインド通知を送信するチャネルID | Slack > 対象チャネル > チャネル詳細 > チャネルID から取得 |
| `TEAMS_CHANNEL_ID` | Microsoft Teamsでリマインド通知を送信するチャネルID | Microsoft Teams > 対象チャネル > 詳細 > チャネルID から取得 |
| `NOTIFICATION_SERVICE_ENABLED` | 通知サービスの有効/無効を制御するフラグ | 稼働環境に応じて設定（true または false） |

### 接続手順

1. Slack Workspace管理者に連絡し、朝会報告管理システム用のSlackアプリを作成する
2. Slack アプリ管理画面で OAuth & Permissions を設定し、chat:write、users:read スコープを付与する
3. Slack アプリの Bot User OAuth Token と Signing Secret を取得し、環境変数に設定する
4. Microsoft Teams管理者に連絡し、対象チャネルの受信Webhook を作成する
5. Teams Webhook URL を環境変数 TEAMS_WEBHOOK_URL に設定する
6. Slack チャネルID と Teams チャネルID を環境変数に設定する
7. リマインド通知の送信時刻とタイムゾーンを環境変数に設定する
8. NotificationServiceAdapter の初期化テストを実行し、Slack と Teams 両方への送信が成功することを確認する
9. スケジュール機能が正常に動作することを確認するため、テスト送信を実施する
10. 本番環境への投入前に、実際のチームメンバーへの送信テストを実施する

## OpenAI API GPT-5.6

用途: 課題キーワードの自動抽出と課題の影響度判定を行う
実装ファイル: `src/adapters/openai-gpt-text-analysis.ts`

### 必要な設定値

| 環境変数 | 用途 | 取得方法 |
| --- | --- | --- |
| `OPENAI_API_KEY` | OpenAI API への認証に使う秘密鍵 | OpenAI の管理画面（https://platform.openai.com/account/api-keys）でAPI キーを生成・発行する |
| `OPENAI_ORG_ID` | 組織単位でのアクセス制御と利用額管理に使う組織識別子 | OpenAI の組織管理画面（https://platform.openai.com/account/org-settings）で確認する |
| `OPENAI_MODEL_ID` | 利用する GPT モデルの識別子（例：gpt-5.6） | OpenAI の利用可能モデル一覧から、アクセス権を持つモデル名を確認する |
| `OPENAI_REQUEST_TIMEOUT_MS` | API リクエストのタイムアウト時間（ミリ秒） | 業務要件に応じて設定（推奨値：30000） |
| `OPENAI_MAX_TOKENS` | API レスポンスの最大トークン数 | 業務要件に応じて設定（推奨値：2000） |
| `OPENAI_TEMPERATURE` | 生成テキストの多様性を制御するパラメータ（0-2） | 業務要件に応じて設定（推奨値：0.3、低いほど確定的） |
| `HARDWARE_PASSKEY_ENABLED` | ハードウェア保護パスキーによる高度なアカウントセキュリティの有効化フラグ | 9月1日までに OpenAI アカウント設定で有効化し、true に設定する |

### 接続手順

1. OpenAI と利用契約を締結し、GPT-5.6 へのアクセス権を申請する（個人は Trusted Access リクエスト、組織はチーム向け申請）
2. OpenAI 管理画面でハードウェア保護パスキーを設定し、高度なアカウントセキュリティを有効化する（9月1日期限）
3. OpenAI 管理画面から API キーを生成し、組織 ID を確認する
4. 稼働環境の環境変数に OPENAI_API_KEY、OPENAI_ORG_ID、OPENAI_MODEL_ID、OPENAI_REQUEST_TIMEOUT_MS、OPENAI_MAX_TOKENS、OPENAI_TEMPERATURE、HARDWARE_PASSKEY_ENABLED を設定する
5. TextAnalysisServiceAdapter の各操作（extractKeywords、assessImpactScore、classifyIssueSeverity）に対して、サンプル日報テキストを用いた疎通確認を実施する
6. API 利用額の監視設定を OpenAI 管理画面で構成する
