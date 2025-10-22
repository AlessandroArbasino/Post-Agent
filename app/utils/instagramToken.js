/**
 * Utility per gestire i token Instagram (exchange short-lived -> long-lived e refresh)
 */

const fetch = require('node-fetch');
const { updateInstagramToken } = require('../db/dbClient');

/**
 * Scambia un token short-lived in un long-lived token.
 * Prova prima l'endpoint Facebook Graph (fb_exchange_token),
 * in fallback utilizza l'endpoint Instagram Graph (ig_exchange_token).
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
    return { success: false, error: 'INSTAGRAM_APP_ID or INSTAGRAM_APP_SECRET missing' };
  }

  try {
    // 1) Tentativo con Facebook Graph (fb_exchange_token)
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
      return { success: false, error: `Exchange failed: ${text}` };
    }

    const json = JSON.parse(text);
    return { success: true, ...json };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Effettua il refresh di un long-lived token Instagram.
 *
 * Docs: https://developers.facebook.com/docs/instagram-basic-display-api/reference/refresh_access_token
 *
 * @param {string} longLivedToken
 * @returns {Promise<{success: boolean, access_token?: string, token_type?: string, expires_in?: number, error?: string}>}
 */
async function refreshLongLivedToken(longLivedToken) {
  try {
    
    const graphVersion = process.env.IG_GRAPH_VERSION;
    const appId= process.env.INSTAGRAM_APP_ID;
    const appSecret= process.env.INSTAGRAM_APP_SECRET;
    const url = `https://graph.facebook.com/${graphVersion}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${encodeURIComponent(longLivedToken)}`;
    console.log(url);

    const res = await fetch(url, { method: 'GET' });
    const text = await res.text();

    if (!res.ok) {
      return { success: false, error: `Refresh failed: ${text}` };
    }

    const json = JSON.parse(text);
    return { success: true, ...json };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function manageLongLiveToken(longLivedToken) {
    const refreshResult = await refreshLongLivedToken(longLivedToken);
    if (!refreshResult.success) {
        throw new Error(`Token refresh failed: ${refreshResult.error}`);
    }

    try {
      updateInstagramToken(refreshResult.access_token);
      return {success: true, ...refreshResult};
    } catch (error) {
        console.error(`Error updating Instagram token: ${error.message}`);
    }
}

module.exports = {
  exchangeShortLivedToken,
  manageLongLiveToken
};
