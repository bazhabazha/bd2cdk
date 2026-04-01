# Brown Dust 2 (BD2) Auto CDK & Coupon Redeemer (ブラウンダスト2 自動CDK・クーポン入力スクリプト)

[English](README.md) | [中文](README_zh.md) | [日本語](README_ja.md)

このプロジェクトは、**Brown Dust 2 (ブラウンダスト2) の CDK / クーポンコード**の取得と入力を自動化する Google Apps Script (GAS) です。

指定したソースWebサイトから最新のCDKを自動的にスクレイピングし、既に試行したコードを除外（重複リクエストを回避）し、ユーザーIDを使用してゲームのAPIに直接入力リクエストを送信します。

## 主な機能

*   **自動取得:** 設定されたソース（デフォルト: kamigame.jp）から最新のCDKを取得します。
*   **最新コードの処理:** 直近のコードを処理します（設定可能、デフォルト: 5）。
*   **APIへの直接入力:** JSONペイロードでユーザーIDと固定のApp IDを直接使用して入力します。
*   **スマートストレージ:** 入力に成功したコードを保存します。
*   **エラー処理:** 特定のAPIエラーコード（例: "ExpiredCode" 期限切れ、"InvalidCode" 無効なコード、"AlreadyUsed" 使用済み）に基づき、永続的な失敗として保存し、不要なAPIの再試行を大幅に減らします。
*   **タイマー駆動型トリガー:** Google Apps Scriptのタイマー機能を使用して、バックグラウンドで完全自動実行されます。
*   **クォータの最適化:** Googleの `PropertiesService` の制限を超えないよう、保存数の上限（例: 成功コード500個）を実装しています。
*   **オプションツール:** 必要に応じて保存されたコードを消去する機能が含まれています。

## 前提条件

*   Google アカウント。
*   Google Apps Script (GAS) の基本的な知識。
*   Brown Dust 2 (ブラウンダスト2) のユーザーID。

## セットアップ手順

1.  **新しい GAS プロジェクトの作成:** [script.google.com](https://script.google.com/) にアクセスし、「+ 新しいプロジェクト」をクリックして、デフォルトのコードを削除します。
2.  **コードのコピー:** このリポジトリの `Code.gs` にあるすべてのスクリプトコードをコピーし、スクリプトエディタに貼り付けます。
3.  **ユーザーIDの取得:** ご自身のユーザーIDを見つけます。これは通常、クーポン入力ページのURL（`https://redeem.bd2.pmang.cloud/bd2/index.html?lang=en-EN&userId=YOUR_USER_ID_HERE`）にあります。
4.  **スクリプトの設定:**
    *   スクリプトの上部付近にある `const USER_ID = "YOUR_USER_ID_HERE";` を見つけます。`"YOUR_USER_ID_HERE"` を実際のユーザーIDに置き換えます。
    *   `PERMANENT_ERROR_CODES` を確認します。これには "ExpiredCode"、"InvalidCode"、"AlreadyUsed" などの一般的な永続的なエラーが含まれています。コードが入力不可であることを示す別のエラーを見つけた場合は、その `errorCode` 文字列をこのSetに追加してください。
    *   必要に応じて `REQUEST_DELAY_MS` (リクエスト遅延) または `MAX_CDKS_TO_FETCH` (最大取得数) を調整します。
5.  **スクリプトの保存:** 保存アイコン (💾) をクリックし、プロジェクトに名前を付けます (例: "BD2 自動入力")。
6.  **テスト実行と承認:**
    *   ツールバーのドロップダウンメニューから `autoRedeemCDKs` 関数を選択します。「**実行**」(▶️) をクリックします。
    *   Googleからのプロンプトが表示されたら、スクリプトを承認します。
    *   「実行ログ」(`表示` -> `実行ログ` または下部のコンソール) を確認します。コードが取得されたこと、および入力試行の結果が記録されていること (Success=true/false, Message, ErrorCode) を確認します。永続的な失敗（例: "ExpiredCode"）が保存対象として記録されていることを確認します。
7.  **自動トリガーの設定:**
    *   左側のメニューから、「トリガー」アイコン（時計の形）をクリックします。右下の「+ トリガーを追加」をクリックします。
    *   **実行する関数を選択:** `autoRedeemCDKs`
    *   **実行するデプロイを選択:** `Head`
    *   **イベントのソースを選択:** `時間主導型`
    *   **時間ベースのトリガーのタイプを選択:** 希望に合わせて設定します (例: `日付ベースのタイマー` または `時間ベースのタイマー`)。「**保存**」をクリックします。

## 設定変数の説明

*   `USER_ID`: **あなたのBD2ユーザーID。**
*   `REDEEM_API_URL`: 入力用のAPIエンドポイント (入力済み)。
*   `REDEEM_METHOD`: HTTPメソッド (入力済み)。
*   `REDEEM_CONTENT_TYPE`: ペイロードのコンテンツタイプ (入力済み)。
*   `APP_ID_PAYLOAD_KEY`, `USER_ID_PAYLOAD_KEY`, `CDK_PAYLOAD_KEY`: ペイロードのJSONキー (入力済み)。
*   `APP_ID_PAYLOAD_VALUE`: BD2の固定App ID値 (入力済み)。
*   `checkRedeemResponse(responseJson)`: APIレスポンスを解釈する関数。
*   `PERMANENT_ERROR_CODES`: **永続的な失敗を示すエラーコードのセット（必要に応じてカスタマイズ可能）。**
*   `REDEEMED_CODES_PROPERTY_KEY`, `PERMANENTLY_FAILED_CODES_PROPERTY_KEY`: Googleの内部ストレージに使用されるキー。
*   `CDK_SOURCE_URL`: コードを取得するソースWebサイトのURL (入力済み)。
*   `REQUEST_DELAY_MS`: レート制限を回避するための、入力試行間の遅延（ミリ秒単位）。
*   `MAX_CDKS_TO_FETCH`: 取得および処理するコードの数。

## オプションの管理機能

GASエディタから手動で実行できます:

*   `resetRedeemedCodes()`: 成功したコードのストレージをクリアします。
*   `resetPermanentlyFailedCodes()`: 永続的な失敗コードのストレージをクリアします。
*   `resetAllAttemptedCodes()`: 両方のストレージリストをクリアします。**注意して使用してください！**
*   `viewStoredCodes()`: デバッグ目的で、現在保存されているコードをログに出力します。

## 免責事項

この自動化スクリプトを使用すると、ゲームまたはソースWebサイトの利用規約に違反する可能性があります。**自己責任で使用してください。** 作成者は、いかなる結果（例：アカウント停止、制限）についても責任を負いません。スクリプトは外部WebサイトのHTMLおよびゲームのAPI構造に依存しているため、いずれかが変更された場合、機能しなくなる可能性があります。
