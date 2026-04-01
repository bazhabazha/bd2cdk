# Brown Dust 2 (BD2) Auto CDK & Coupon Redeemer (棕色尘埃2 自动CDK兑换脚本)

[English](README.md) | [中文](README_zh.md) | [日本語](README_ja.md)

本项目提供了一个基于 Google Apps Script (GAS) 的自动化脚本，专门用于自动获取并兑换 **Brown Dust 2 (棕色尘埃2) 的 CDK / Coupon 优惠码**。

它会自动从指定的来源网站抓取最新的 CDK，过滤掉已经尝试过的优惠码（以避免重复发送请求），并直接使用您的用户 ID 向游戏的 API 发送兑换请求。

## 主要特性

*   **自动抓取:** 从可配置的来源（默认为 kamigame.jp）获取最新的 CDK。
*   **Top N 处理:** 处理最近的优惠码（可配置，默认为前 5 个）。
*   **直接 API 兑换:** 在 JSON payload 中直接使用您的用户 ID 和固定的 App ID 进行兑换。
*   **智能存储:** 存储成功兑换的优惠码。
*   **失败处理:** 基于特定的 API 错误代码（例如 "ExpiredCode" 兑换码过期, "InvalidCode" 无效兑换码, "AlreadyUsed" 已使用）永久存储失败记录，大幅减少不必要的 API 重试。
*   **定时触发:** 使用 Google Apps Script 的时间驱动触发器在后台完全自动运行。
*   **配额优化:** 实施存储限制（例如 500 个成功代码），以确保完全符合 Google 的 `PropertiesService` 限制。
*   **可选工具:** 包含用于清除已存储代码的函数。

## 准备工作

*   一个 Google 账号。
*   对 Google Apps Script (GAS) 有基本了解。
*   您的 Brown Dust 2 (棕色尘埃2) 用户 ID。

## 详细安装指南

1.  **创建新的 GAS 项目:** 访问 [script.google.com](https://script.google.com/)，点击 "+ 新建项目"，并删除任何默认代码。
2.  **复制代码:** 复制本仓库 `Code.gs` 中的完整脚本代码，并粘贴到脚本编辑器中。
3.  **获取您的用户 ID:** 找到您的用户 ID。这通常可以在兑换页面的 URL 中找到 (`https://redeem.bd2.pmang.cloud/bd2/index.html?lang=en-EN&userId=YOUR_USER_ID_HERE`)。
4.  **配置脚本:**
    *   在脚本顶部附近找到 `const USER_ID = "YOUR_USER_ID_HERE";` 这一行。将 `"YOUR_USER_ID_HERE"` 替换为您实际的 用户 ID。
    *   检查 `PERMANENT_ERROR_CODES`。它包含常见的永久性错误，如 "ExpiredCode", "InvalidCode" 和 "AlreadyUsed"。如果您发现其他表示代码无法被兑换的错误，请将其 `errorCode` 字符串添加到此 Set 中。
    *   如有需要，调整 `REQUEST_DELAY_MS` (请求延迟) 或 `MAX_CDKS_TO_FETCH` (最大获取数量)。
5.  **保存脚本:** 点击保存图标 (💾) 并为您的项目命名 (例如 "BD2 自动兑换")。
6.  **运行测试并授权:**
    *   在工具栏的下拉菜单中选择 `autoRedeemCDKs` 函数。点击 **运行** (▶️)。
    *   在 Google 提示时授权脚本。
    *   检查 "执行日志" (`查看` -> `执行日志` 或直接查看底部控制台)。验证代码是否已被抓取，以及兑换尝试是否记录了结果 (Success=true/false, Message, ErrorCode)。确保永久性失败（如 "ExpiredCode"）被记录为已存储。
7.  **设置自动触发器:**
    *   在左侧菜单中，点击 "触发器" 图标（时钟形状）。点击右下角的 "+ 添加触发器"。
    *   **选择要运行的函数:** `autoRedeemCDKs`。
    *   **选择应运行的部署:** `Head`。
    *   **选择事件来源:** `时间驱动`。
    *   **选择基于时间的触发器类型:** 根据需要设置 (例如，`每日定时器` 或 `每小时定时器`)。点击 **保存**。

## 配置变量说明

*   `USER_ID`: **您的 BD2 用户 ID。**
*   `REDEEM_API_URL`: 兑换的 API 端点 (已预填)。
*   `REDEEM_METHOD`: HTTP 方法 (已预填)。
*   `REDEEM_CONTENT_TYPE`: Payload 内容类型 (已预填)。
*   `APP_ID_PAYLOAD_KEY`, `USER_ID_PAYLOAD_KEY`, `CDK_PAYLOAD_KEY`: Payload JSON 键 (已预填)。
*   `APP_ID_PAYLOAD_VALUE`: BD2 固定的 App ID 值 (已预填)。
*   `checkRedeemResponse(responseJson)`: 解释 API 响应的函数。
*   `PERMANENT_ERROR_CODES`: **指示永久性失败的错误代码集（如有需要可自定义）。**
*   `REDEEMED_CODES_PROPERTY_KEY`, `PERMANENTLY_FAILED_CODES_PROPERTY_KEY`: 用于 Google 内部存储的键。
*   `CDK_SOURCE_URL`: 获取代码的源网站 URL (已预填)。
*   `REQUEST_DELAY_MS`: 兑换尝试之间的毫秒延迟，以避免触发速率限制。
*   `MAX_CDKS_TO_FETCH`: 要获取和处理的代码数量。

## 可选管理函数

您可以从 GAS 编辑器手动运行这些函数：

*   `resetRedeemedCodes()`: 清除成功兑换代码的存储。
*   `resetPermanentlyFailedCodes()`: 清除永久失败代码的存储。
*   `resetAllAttemptedCodes()`: 清除两个存储列表。**请谨慎使用！**
*   `viewStoredCodes()`: 记录当前存储的代码以供调试。

## 免责声明

使用此自动化脚本可能会违反游戏或源网站的服务条款。**风险自负。** 作者对任何后果（例如，账号封禁、限制）概不负责。该脚本依赖于外部网站的 HTML 和游戏的 API 结构；如果其中任何一个发生更改，脚本可能会失效。
