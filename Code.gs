/**
 * Brown Dust 2 Auto CDK Redeemer Google Apps Script
 *
 * This script automates fetching and redeeming CDK (Coupon) codes for Brown Dust 2.
 * It fetches codes from a specified source, filters out codes previously attempted,
 * and attempts to redeem new codes using the user's ID via the game's API.
 * Successful redemptions and specific permanent failures are stored to avoid retries.
 *
 * Target Redemption API Endpoint: https://loj2urwaua.execute-api.ap-northeast-1.amazonaws.com/prod/coupon
 * Authentication: User ID and fixed appId in JSON payload. No cookies needed for API.
 * Target CDK Source: https://kamigame.jp/browndust2/page/271541029042155604.html
 *
 * Author: MAJIKO
 * Date: [Current Date]
 */

// ====== USER CONFIGURATION START ======

// *** REQUIRED ***
// Your Brown Dust 2 User ID. Found in the redemption page URL's userId parameter.
// Example: https://redeem.bd2.pmang.cloud/bd2/index.html?lang=en-EN&userId=YOUR_USER_ID_HERE
const USER_ID = "YOUR_USER_ID_HERE"; // <<<<<<< Replace with your actual User ID (e.g., "MAJIKO" or numeric ID)

// *** API Information (Based on provided details - verify if issues occur) ***
// The API endpoint URL for redeeming CDK codes.
const REDEEM_API_URL = "https://loj2urwaua.execute-api.ap-northeast-1.amazonaws.com/prod/coupon";

// The HTTP method for the redemption request.
const REDEEM_METHOD = "POST";

// The Content-Type header for the request payload.
const REDEEM_CONTENT_TYPE = "application/json";

// Key names for App ID, User ID, and Coupon Code in the JSON payload.
// Based on payload: {appId: ..., userId: ..., code: ...}
const APP_ID_PAYLOAD_KEY = "appId";
const USER_ID_PAYLOAD_KEY = "userId";
const CDK_PAYLOAD_KEY = "code";

// The fixed value for the App ID in the JSON payload.
const APP_ID_PAYLOAD_VALUE = "bd2-live";

// *** How to interpret API responses (Based on provided success/failure examples) ***
// Determines success/failure from API JSON response.
// Needs adjustment if API response format changes.
function checkRedeemResponse(responseJson) {
    Logger.log("Checking response JSON: " + JSON.stringify(responseJson));

    // Check for explicit success field: {"success": true}
    if (responseJson && responseJson.success === true) {
        return { success: true, message: responseJson.message || "Redemption successful!", errorCode: responseJson.errorCode };
    }
    // Check for AppError structure: {"name": "AppError", "errorCode": "..."}
    else if (responseJson && responseJson.name === 'AppError' && typeof responseJson.errorCode !== 'undefined') {
        return { success: false, message: responseJson.message || `${responseJson.errorCode} error`, errorCode: responseJson.errorCode };
    }
    // Handle other unexpected JSON structures
    else if (responseJson) {
         return { success: false, message: responseJson.message || `Unexpected API response JSON: ${JSON.stringify(responseJson).substring(0, 200)}...`, errorCode: responseJson.errorCode };
    }
    // Handle non-JSON or empty response
    else {
         return { success: false, message: "API returned non-JSON or empty response.", errorCode: null };
    }
}


// *** Storage Configuration ***
// PropertiesService key for storing successfully redeemed codes.
const REDEEMED_CODES_PROPERTY_KEY = 'bd2_redeemed_cdk_codes';

// PropertiesService key for storing permanently failed codes (based on error codes).
const PERMANENTLY_FAILED_CODES_PROPERTY_KEY = 'bd2_permanently_failed_cdk_codes';

// API error codes indicating permanent failure (codes that should not be retried).
// ADD other error codes you observe (e.g., "CouponAlreadyUsed") here!
const PERMANENT_ERROR_CODES = new Set([
  "ExpiredCode", // From log
  "InvalidCode", // From log
  "AlreadyUsed", // From log
  // Add more permanent error codes here if observed!
]);


// *** CDK Source Configuration ***
// URL of the CDK list page on kamigame.jp.
const CDK_SOURCE_URL = "https://kamigame.jp/browndust2/page/271541029042155604.html";

// Delay in ms between redemption attempts to avoid rate limits. (3000-5000 recommended)
const REQUEST_DELAY_MS = 4000; // 4 seconds default

// Max number of CDKs to fetch from the source page (processes the newest ones).
const MAX_CDKS_TO_FETCH = 5; // Fetch up to the first 5 codes.

// ====== USER CONFIGURATION END ======


/**
 * Main function triggered by time-driven trigger.
 * Fetches, filters, and redeems CDKs.
 */
function autoRedeemCDKs() {
  Logger.log("--- Script started (Brown Dust 2) ---");

  // Check if required configs are set
  if (!USER_ID || USER_ID === "YOUR_USER_ID_HERE") {
      Logger.log("Error: USER_ID is not configured. Please update the script.");
      // Optional email notification
      // try { MailApp.sendEmail(Session.getActiveUser().getEmail(), "BD2 CDK Script Error: User ID Not Configured", "Please update the USER_ID variable in the script."); } catch(e) { Logger.log("Failed to send email: " + e); }
      return; // Stop execution
  }

  // Get set of codes previously attempted (success or permanent failure)
  const previouslyAttemptedSet = getPreviouslyRedeemedAndFailedCDKs();
  Logger.log(`Found ${previouslyAttemptedSet.size} previously attempted codes in storage.`);

  let allCDKs;
  try {
    // Fetch and parse CDK source page
    allCDKs = fetchAndParseCDKs(CDK_SOURCE_URL);
    Logger.log(`Found ${allCDKs.length} potential CDKs from source (limited to first ${MAX_CDKS_TO_FETCH}).`);
  } catch (e) {
    Logger.log(`Error fetching/parsing CDK source: ${e}. Cannot proceed.`);
    // Optional email notification
    // try { MailApp.sendEmail(Session.getActiveUser().getEmail(), "BD2 CDK Script Error: Fetch/Parse Failed", `Error: ${e}`); } catch(e) { Logger.log("Failed to send email: " + e); }
    return; // Stop if source fetch fails
  }

  // Filter out codes already attempted
  const newCDKs = filterNewCDKs(allCDKs, previouslyAttemptedSet);
  Logger.log(`Found ${newCDKs.length} truly new CDKs to attempt redemption.`);

  if (newCDKs.length === 0) {
    Logger.log("No new CDKs found. Exiting.");
    return;
  }

  // Optional: Reverse if you want to process older new codes first
  // newCDKs.reverse();

  // Attempt to redeem each new CDK
  for (let i = 0; i < newCDKs.length; i++) {
    const cdk = newCDKs[i].code;

    // Final check against in-memory set for robustness
     if (previouslyAttemptedSet.has(cdk)) {
         Logger.log(`Skipping CDK ${cdk} as it was found in attempted set just before attempting.`);
         continue;
     }

    Logger.log(`Attempting to redeem CDK: ${cdk}`);

    try {
      // Call function to send redemption request (uses User ID)
      const result = redeemCDK(cdk, USER_ID); // Pass code and User ID
      Logger.log(`Redemption result for ${cdk}: Success=${result.success}, Message=${result.message}${result.errorCode ? ', ErrorCode=' + result.errorCode : ''}`);

      // Store successful redemptions
      if (result.success) {
        storeRedeemedCDK(cdk);
        previouslyAttemptedSet.add(cdk);
      }
      // Store failures with permanent error codes
      else if (result.errorCode && PERMANENT_ERROR_CODES.has(result.errorCode)) {
           storePermanentlyFailedCDK(cdk);
           previouslyAttemptedSet.add(cdk);
           Logger.log(`Marking CDK ${cdk} as permanently failed due to ErrorCode: ${result.errorCode}`);
      }
      // Other failures are not marked permanent and may be retried later

      // Add delay between requests
      Utilities.sleep(REQUEST_DELAY_MS);

    } catch (e) {
      // Catch unhandled redemption errors (e.g., network issues)
      Logger.log(`Error redeeming CDK ${cdk}: ${e}`);
      // Wait even after error
      Utilities.sleep(REQUEST_DELAY_MS);
    }
  }

  Logger.log("--- Script finished (Brown Dust 2) ---");
}


/**
 * Fetches CDK codes from kamigame.jp.
 * Parses HTML for input value within <div class="copyme">, extracts first MAX_CDKS_TO_FETCH codes.
 * Date is 'N/A' as not provided in this structure.
 * @param {string} url - CDK list page URL.
 * @returns {Array<{code: string, date: string}>} - Array of CDK objects.
 * @throws {Error} if fetch/parse fails critically.
 */
function fetchAndParseCDKs(url) {
  const options = { 'muteHttpExceptions': true };
  let response;
  try {
    response = UrlFetchApp.fetch(url, options);
  } catch (e) {
     throw new Error(`Failed to fetch page URL (${url}): ${e}`);
  }

  if (response.getResponseCode() !== 200) {
    throw new Error(`Failed to fetch page, response code: ${response.getResponseCode()}`);
  }
  const html = response.getContentText();

  const cdks = [];
  // Regex to find value="CDK_CODE" within <input> inside <div class="copyme">.
  const cdkRegex = /<div[^>]*class="copyme"[^>]*>.*?<input[^>]*value="([^"]*)"[^>]*>.*?<\/div>/gs;
  let match;

  // Extract codes, limiting quantity
  while ((match = cdkRegex.exec(html)) !== null && cdks.length < MAX_CDKS_TO_FETCH) {
    const rawCode = match[1];
    const cleanCode = rawCode.trim();

    if (cleanCode) {
      cdks.push({ code: cleanCode, date: 'N/A' });
    } else {
         Logger.log(`Warning: Extracted empty code from input value within <div class="copyme">, skipping.`);
    }
  }

  if (cdks.length === 0) {
    Logger.log(`Could not find any CDK codes with the specified regex pattern.`);
    // Optionally throw error here if desired
    // throw new Error("Could not find any CDK codes in the HTML.");
    return [];
  }

  return cdks;
}


/**
 * Filters codes previously attempted (success or permanent failure).
 * @param {Array<{code: string, date: string}>} allCDKs - All CDKs from source.
 * @param {Set<string>} attemptedCodesSet - Set of codes not to attempt.
 * @returns {Array<{code: string, date: string}>} - List of new CDKs.
 */
function filterNewCDKs(allCDKs, attemptedCodesSet) {
  return allCDKs.filter(cdk => !attemptedCodesSet.has(cdk.code));
}

/**
 * Attempts to redeem a single CDK code via API.
 * Uses User ID and fixed App ID in JSON payload.
 * @param {string} cdk - CDK code to redeem.
 * @param {string} userId - User ID.
 * @returns {{success: boolean, message: string, errorCode?: string}} - Redemption result.
 */
function redeemCDK(cdk, userId) {
  // Build headers
  const headers = {
    'Content-Type': REDEEM_CONTENT_TYPE,
    'Origin': 'https://redeem.bd2.pmang.cloud',
    'Referer': `https://redeem.bd2.pmang.cloud/bd2/index.html?lang=en-EN&userId=${userId}`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0',
    // Add other headers from your inspection if needed
  };

  // Build JSON payload
  const payload = JSON.stringify({
    [APP_ID_PAYLOAD_KEY]: APP_ID_PAYLOAD_VALUE,
    [USER_ID_PAYLOAD_KEY]: userId,
    [CDK_PAYLOAD_KEY]: cdk
  });

  Logger.log(`Sending request to ${REDEEM_API_URL} with payload: ${payload}`);

  // UrlFetchApp options
  const options = {
    'method' : REDEEM_METHOD,
    'headers' : headers,
    'payload' : payload,
    'followRedirects' : false,
    'muteHttpExceptions': true
  };

  let response;
  try {
    response = UrlFetchApp.fetch(REDEEM_API_URL, options);
  } catch (e) {
    return { success: false, message: `UrlFetchApp error: ${e}`, errorCode: null };
  }

  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  Logger.log(`Redemption HTTP Status Code for ${cdk}: ${responseCode}`);

  // Check HTTP status and parse JSON
  if (responseCode >= 200 && responseCode < 300) {
      try {
           const responseJson = JSON.parse(responseText);
           return checkRedeemResponse(responseJson);
      } catch (e) {
           return { success: false, message: `Failed to parse JSON after HTTP ${responseCode}: ${e}. Response text: ${responseText.substring(0, 200)}...`, errorCode: null };
      }
  } else {
    // Handle HTTP errors
    try {
      const responseJson = JSON.parse(responseText);
      const apiCheckResult = checkRedeemResponse(responseJson);
       if (apiCheckResult.success) {
            Logger.log(`Warning: checkRedeemResponse returned success=true for HTTP status ${responseCode}! JSON: ${JSON.stringify(responseJson).substring(0, 200)}...`);
       }
       return apiCheckResult;
    } catch (e) {
      return { success: false, message: `HTTP error ${responseCode}. Could not parse JSON. Response text: ${responseText.substring(0, 200)}...`, errorCode: null };
    }
  }
}


/**
 * Helper to get a stored array from PropertiesService.
 */
function getStoredArray(propertyKey) {
  const properties = PropertiesService.getUserProperties();
  const storedString = properties.getProperty(propertyKey);
  let storedArray = [];
  if (storedString) {
    try {
      storedArray = JSON.parse(storedString);
      if (!Array.isArray(storedArray)) storedArray = [];
    } catch (e) {
      Logger.log(`Error parsing stored array for key ${propertyKey}: ${e}.`);
    }
  }
  return storedArray;
}

/**
 * Helper to add a value to a stored array in PropertiesService with an optional limit.
 */
function addToStoredArray(propertyKey, value, limit) {
  const properties = PropertiesService.getUserProperties();
  let storedArray = getStoredArray(propertyKey);

  if (!storedArray.includes(value)) {
    storedArray.push(value);
    if (limit && storedArray.length > limit) {
      storedArray = storedArray.slice(storedArray.length - limit);
    }
    try {
      properties.setProperty(propertyKey, JSON.stringify(storedArray));
      Logger.log(`Stored ${value} in ${propertyKey}. Total stored: ${storedArray.length}`);
    } catch (e) {
      Logger.log(`Error storing data to ${propertyKey}: ${e}. Consider Spreadsheet storage if exceeding quotas.`);
    }
  }
}

/**
 * Retrieves set of previously attempted codes from storage.
 * @returns {Set<string>} - Codes not to attempt again.
 */
function getPreviouslyRedeemedAndFailedCDKs() {
  const redeemed = getStoredArray(REDEEMED_CODES_PROPERTY_KEY);
  const failed = getStoredArray(PERMANENTLY_FAILED_CODES_PROPERTY_KEY);
  return new Set([...redeemed, ...failed]);
}


/**
 * Adds a successfully redeemed code to storage.
 * @param {string} cdk - Code to store.
 */
function storeRedeemedCDK(cdk) {
  const MAX_STORED_CODES = 500;
  addToStoredArray(REDEEMED_CODES_PROPERTY_KEY, cdk, MAX_STORED_CODES);
}

/**
 * Adds a permanently failed code to storage.
 * @param {string} cdk - Code to store.
 */
function storePermanentlyFailedCDK(cdk) {
  const MAX_STORED_FAILED_CODES = 1000;
  addToStoredArray(PERMANENTLY_FAILED_CODES_PROPERTY_KEY, cdk, MAX_STORED_FAILED_CODES);
}


// --- Optional Management Functions ---

/**
 * (Optional) Resets stored successful codes. Use with caution!
 */
function resetRedeemedCodes() {
  PropertiesService.getUserProperties().deleteProperty(REDEEMED_CODES_PROPERTY_KEY);
  Logger.log(`Successfully redeemed codes list (${REDEEMED_CODES_PROPERTY_KEY}) reset.`);
}

/**
 * (Optional) Resets stored permanently failed codes. Use with caution!
 */
function resetPermanentlyFailedCodes() {
  PropertiesService.getUserProperties().deleteProperty(PERMANENTLY_FAILED_CODES_PROPERTY_KEY);
  Logger.log(`Permanently failed codes list (${PERMANENTLY_FAILED_CODES_PROPERTY_KEY}) reset.`);
}

/**
 * (Optional) Resets all stored attempted codes. Use with extreme caution!
 */
function resetAllAttemptedCodes() {
    resetRedeemedCodes();
    resetPermanentlyFailedCodes();
    Logger.log("All attempted codes lists (success and failed) have been reset.");
}

/**
 * (Optional) Logs stored codes. For debugging.
 */
function viewStoredCodes() {
  Logger.log("--- Stored Codes in PropertiesService (Brown Dust 2) ---");

  const redeemed = getStoredArray(REDEEMED_CODES_PROPERTY_KEY);
  Logger.log(`Successfully redeemed codes (${redeemed.length}): ${redeemed.length > 50 ? redeemed.slice(0, 25).join(', ') + ', ... ' + redeemed.slice(-25).join(', ') : redeemed.join(', ')}`);

  Logger.log("---");

  const failed = getStoredArray(PERMANENTLY_FAILED_CODES_PROPERTY_KEY);
  Logger.log(`Permanently failed codes (${failed.length}): ${failed.length > 50 ? failed.slice(0, 25).join(', ') + ', ... ' + failed.slice(-25).join(', ') : failed.join(', ')}`);

  Logger.log("--- End of Stored Codes ---");
}