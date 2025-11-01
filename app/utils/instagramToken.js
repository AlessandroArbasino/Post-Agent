/**
 * Utility to manage Instagram tokens (exchange short-lived -> long-lived and refresh)
 */

const fetch = require('node-fetch');
const { updateInstagramToken } = require('../db/dbClient');

/**
 * Exchanges a short-lived token for a long-lived token.
 * Tries the Facebook Graph endpoint first (fb_exchange_token),
 * and falls back to the Instagram Graph endpoint (ig_exchange_token).
 *
 * Docs:
 * - https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived/
 * - https://developers.facebook.com/docs/instagram-basic-display-api/reference/refresh_access_token
 *
 * @param {string} shortLivedToken
 * @returns {Promise<{success: boolean, access_token?: string, token_type?: string, expires_in?: number, error?: string}>}
 */
async function exchangeShortLivedToken(shortLivedToken) {
  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  const graphVersion = (process.env.IG_GRAPH_VERSION || 'v21.0').replace(/^v/, 'v');

  if (!appId || !appSecret) {
    throw new Error('INSTAGRAM_APP_ID or INSTAGRAM_APP_SECRET missing');
  }

  // 1) Attempt with Facebook Graph (fb_exchange_token)
  const fbUrl = `https://graph.facebook.com/${graphVersion}/oauth/access_token` +
    `?grant_type=fb_exchange_token&client_id=${encodeURIComponent(appId)}` +
    `&client_secret=${encodeURIComponent(appSecret)}` +
    `&fb_exchange_token=${encodeURIComponent(shortLivedToken)}`;

  let res = await fetch(fbUrl, { method: 'GET' });
  let text = await res.text();

  if (res.ok) {
    const json = JSON.parse(text);
    return { success: true, ...json };
  }

  // 2) Fallback: Instagram Graph (ig_exchange_token)
  const igUrl = `https://graph.instagram.com/access_token` +
    `?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(appSecret)}` +
    `&access_token=${encodeURIComponent(shortLivedToken)}`;

  res = await fetch(igUrl, { method: 'GET' });
  text = await res.text();

  if (!res.ok) {
    throw new Error(`Exchange failed: ${text}`);
  }

  const json = JSON.parse(text);
  return { success: true, ...json };
}

/**
 * Refreshes an Instagram long-lived token.
 *
 * Docs: https://developers.facebook.com/docs/instagram-basic-display-api/reference/refresh_access_token
 *
 * @param {string} longLivedToken
 * @returns {Promise<{success: boolean, access_token?: string, token_type?: string, expires_in?: number, error?: string}>}
 */
async function refreshLongLivedToken(longLivedToken) {
    const graphVersion = process.env.IG_GRAPH_VERSION;
    const appId= process.env.INSTAGRAM_APP_ID;
    const appSecret= process.env.INSTAGRAM_APP_SECRET;
    const url = `https://graph.facebook.com/${graphVersion}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${encodeURIComponent(longLivedToken)}`;
    console.log(url);

    const res = await fetch(url, { method: 'GET' });
    const text = await res.text();

    if (!res.ok) {
      throw new Error(`Refresh failed: ${text}`);
    }

    const json = JSON.parse(text);
    return { success: true, ...json };
}

async function manageLongLiveToken(longLivedToken) {
    const refreshResult = await refreshLongLivedToken(longLivedToken);

    updateInstagramToken(refreshResult.access_token);
    return {success: true, ...refreshResult};
}

module.exports = {
  exchangeShortLivedToken,
  manageLongLiveToken
};
