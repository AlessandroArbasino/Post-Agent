/**
 * Utility to manage Instagram tokens (exchange short-lived -> long-lived and refresh)
 */

const fetch = require('node-fetch');
const { updateInstagramToken } = require('../db/dbClient');
const { findEnvVariable } = require('./envUtils');

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
    const appId= findEnvVariable('INSTAGRAM_APP_ID');
    const appSecret= findEnvVariable('INSTAGRAM_APP_SECRET');
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
  manageLongLiveToken
};
