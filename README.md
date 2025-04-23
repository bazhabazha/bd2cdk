# Brown Dust 2 Auto CDK Redeemer (Google Apps Script)

Automates fetching and redeeming Brown Dust 2 CDK (Coupon) codes using Google Apps Script.

It gets codes from a specified source website, filters out codes already attempted, and sends redemption requests to the game's API using your User ID.

## Features

*   Fetches latest CDKs from a configurable source (kamigame.jp).
*   Processes the top N codes (default: 5).
*   Redeems using your User ID and a fixed App ID in the API request payload.
*   Stores successful redemptions.
*   Stores permanent failures (based on API error codes like "ExpiredCode", "InvalidCode", "AlreadyUsed") to avoid retries.
*   Runs automatically with a time-driven trigger.
*   Includes optional functions to manage stored codes.

## Prerequisites

*   Google Account.
*   Basic GAS knowledge.
*   Your Brown Dust 2 User ID.

## Setup Guide

1.  **Create a New GAS Project:** Go to [script.google.com](https://script.google.com/), click "+ New project", delete default code.
2.  **Copy Code:** Copy the full script code from `Code.gs` in this repo. Paste into the editor.
3.  **Get Your User ID:** Find your User ID. It's often in the redemption page URL (`https://redeem.bd2.pmang.cloud/bd2/index.html?lang=en-EN&userId=YOUR_USER_ID_HERE`).
4.  **Configure Script:**
    *   Find `const USER_ID = "YOUR_USER_ID_HERE";` near the top. Replace `"YOUR_USER_ID_HERE"` with your actual User ID.
    *   Review `PERMANENT_ERROR_CODES`. It includes common errors like "ExpiredCode", "InvalidCode", "AlreadyUsed". If you encounter other errors that should be permanent, add their `errorCode` string to this Set.
    *   Adjust `REQUEST_DELAY_MS` or `MAX_CDKS_TO_FETCH` if needed.
5.  **Save Script:** Click save icon, name your project.
6.  **Run Test (Authorize):**
    *   Select `autoRedeemCDKs` from the function dropdown. Click Run (▶️).
    *   Authorize the script when prompted.
    *   Check "Execution logs" (`View` -> `Execution logs`). Verify codes were fetched and redemption attempts logged results (Success=true/false, Message, ErrorCode). Ensure permanent failures (like "ExpiredCode", "AlreadyUsed") are logged as stored.
7.  **Set Trigger:**
    *   Left menu -> "Triggers" (clock). "+ Add Trigger".
    *   Function: `autoRedeemCDKs`. Deployment: `Head`. Event source: `Time-driven`. Frequency: Set as desired (e.g., Daily). Save.

## Configuration Variables

*   `USER_ID`: **Your User ID.**
*   `REDEEM_API_URL`: API endpoint (pre-filled).
*   `REDEEM_METHOD`: HTTP method (pre-filled).
*   `REDEEM_CONTENT_TYPE`: Payload type (pre-filled).
*   `APP_ID_PAYLOAD_KEY`, `USER_ID_PAYLOAD_KEY`, `CDK_PAYLOAD_KEY`: Payload key names (pre-filled).
*   `APP_ID_PAYLOAD_VALUE`: Fixed App ID value (pre-filled).
*   `checkRedeemResponse(responseJson)`: Interprets API response (pre-filled based on logs, verify success).
*   `PERMANENT_ERROR_CODES`: **Set of error codes indicating permanent failure (customize if needed).**
*   `REDEEMED_CODES_PROPERTY_KEY`, `PERMANENTLY_FAILED_CODES_PROPERTY_KEY`: Storage keys.
*   `CDK_SOURCE_URL`: Source website URL (pre-filled).
*   `REQUEST_DELAY_MS`: Delay between attempts.
*   `MAX_CDKS_TO_FETCH`: Number of codes to fetch.

## Optional Functions

Run manually from editor:

*   `resetRedeemedCodes()`: Clears successful codes storage.
*   `resetPermanentlyFailedCodes()`: Clears permanent failed codes storage.
*   `resetAllAttemptedCodes()`: Clears both storage lists. **Use with extreme caution!**
*   `viewStoredCodes()`: Logs stored codes for debugging.

## Disclaimer

Using this script might violate game/website ToS. Use at your own risk. Author is not responsible for consequences (e.g., account issues). Script relies on external website HTML/API structure and may break if they change.