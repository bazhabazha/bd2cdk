# Brown Dust 2 (BD2) Auto CDK & Coupon Redeemer

[English](README.md) | [中文](README_zh.md) | [日本語](README_ja.md)

This project provides a Google Apps Script that automates the process of fetching and redeeming **Brown Dust 2 (BD2) CDK / Coupon codes**.

It automatically scrapes the latest CDKs from a specified source website, filters out codes that have already been attempted (to avoid redundant requests), and sends redemption requests directly to the game's API using your personal User ID.

## Key Features

*   **Automated Fetching:** Retrieves the latest CDKs from a configurable source (default: kamigame.jp).
*   **Top N Processing:** Processes the most recent codes (configurable, default: 5).
*   **Direct API Redemption:** Redeems using your User ID and a fixed App ID directly via the game's JSON payload.
*   **Smart Storage:** Stores successfully redeemed codes.
*   **Failure Handling:** Permanently stores failures based on specific API error codes (e.g., "ExpiredCode", "InvalidCode", "AlreadyUsed") to drastically reduce unnecessary API retries.
*   **Time-Driven Trigger:** Runs fully automatically in the background using Google Apps Script's time-driven triggers.
*   **Quota Optimization:** Implements storage limits (e.g., 500 successful codes) to ensure it stays well within Google's `PropertiesService` constraints.
*   **Optional Utilities:** Includes functions to clear out stored codes if needed.

## Prerequisites

*   A Google Account.
*   Basic understanding of Google Apps Script (GAS).
*   Your Brown Dust 2 User ID.

## Step-by-Step Setup Guide

1.  **Create a New GAS Project:** Go to [script.google.com](https://script.google.com/), click "+ New project", and delete any default code.
2.  **Copy the Code:** Copy the full script code from `Code.gs` in this repository and paste it into the script editor.
3.  **Get Your User ID:** Locate your User ID. This can usually be found in the redemption page URL (`https://redeem.bd2.pmang.cloud/bd2/index.html?lang=en-EN&userId=YOUR_USER_ID_HERE`).
4.  **Configure the Script:**
    *   Find the line `const USER_ID = "YOUR_USER_ID_HERE";` near the top of the script. Replace `"YOUR_USER_ID_HERE"` with your actual User ID.
    *   Review `PERMANENT_ERROR_CODES`. It includes common permanent errors like "ExpiredCode", "InvalidCode", and "AlreadyUsed". If you discover other errors that mean a code can never be redeemed, add their `errorCode` string to this Set.
    *   Adjust `REQUEST_DELAY_MS` or `MAX_CDKS_TO_FETCH` if desired.
5.  **Save the Script:** Click the save icon (💾) and name your project (e.g., "BD2 Auto Redeemer").
6.  **Run a Test (Authorize):**
    *   Select the `autoRedeemCDKs` function from the dropdown menu in the toolbar. Click **Run** (▶️).
    *   Authorize the script when Google prompts you.
    *   Check the "Execution logs" (`View` -> `Execution logs` or just view the bottom console). Verify that codes were fetched and that redemption attempts log the results (Success=true/false, Message, ErrorCode). Ensure permanent failures (like "ExpiredCode") are logged as being stored.
7.  **Set Up the Automatic Trigger:**
    *   On the left menu, click the "Triggers" icon (clock shape). Click "+ Add Trigger" in the bottom right.
    *   **Choose which function to run:** `autoRedeemCDKs`.
    *   **Choose which deployment should run:** `Head`.
    *   **Select event source:** `Time-driven`.
    *   **Select type of time based trigger:** Set as desired (e.g., `Day timer` or `Hour timer`). Click **Save**.

## Configuration Variables Explained

*   `USER_ID`: **Your BD2 User ID.**
*   `REDEEM_API_URL`: API endpoint for redemption (pre-filled).
*   `REDEEM_METHOD`: HTTP method (pre-filled).
*   `REDEEM_CONTENT_TYPE`: Payload content type (pre-filled).
*   `APP_ID_PAYLOAD_KEY`, `USER_ID_PAYLOAD_KEY`, `CDK_PAYLOAD_KEY`: Payload JSON keys (pre-filled).
*   `APP_ID_PAYLOAD_VALUE`: Fixed App ID value for BD2 (pre-filled).
*   `checkRedeemResponse(responseJson)`: Function that interprets the API response.
*   `PERMANENT_ERROR_CODES`: **Set of error codes that indicate a permanent failure (customize if needed).**
*   `REDEEMED_CODES_PROPERTY_KEY`, `PERMANENTLY_FAILED_CODES_PROPERTY_KEY`: Keys used for Google's internal storage.
*   `CDK_SOURCE_URL`: Source website URL for fetching codes (pre-filled).
*   `REQUEST_DELAY_MS`: Delay in milliseconds between redemption attempts to avoid rate limits.
*   `MAX_CDKS_TO_FETCH`: Number of codes to fetch and process.

## Optional Management Functions

You can run these manually from the GAS editor:

*   `resetRedeemedCodes()`: Clears the storage of successfully redeemed codes.
*   `resetPermanentlyFailedCodes()`: Clears the storage of permanent failed codes.
*   `resetAllAttemptedCodes()`: Clears both storage lists. **Use with caution!**
*   `viewStoredCodes()`: Logs the currently stored codes for debugging purposes.

## Disclaimer

Using this automation script might violate the Terms of Service of the game or the source website. **Use at your own risk.** The author is not responsible for any consequences (e.g., account bans, restrictions). The script relies on an external website's HTML and the game's API structure; it may break if either of them changes.
