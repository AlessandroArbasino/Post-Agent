const fetch = (...args) => (globalThis.fetch ? globalThis.fetch(...args) : import('node-fetch').then(({ default: f }) => f(...args)));
const { getInstagramConfig } = require('../../db/dbClient');
const { manageLongLiveToken } = require('./tokenManager');

/**
 * Calculates if Instagram token needs refresh and refreshes it if necessary.
 * Checks if token is older than threshold days and refreshes it automatically.
 * @param {Object} instagramConfig - Instagram configuration object
 * @param {string} instagramConfig.token - Current Instagram access token
 * @param {string} instagramConfig.createdate - Token creation date
 * @returns {Promise<Object>} Updated Instagram configuration
 * @throws {Error} If token refresh fails
 */
const instagramCalculateRefreshToken = async (instagramConfig) => {
    const thresholdDays = parseInt(process.env.DAYS_BETWEEN_TOKEN_REFRESH || '55', 10);
    if (instagramConfig?.createdate) {
        const last = new Date(instagramConfig.createdate);
        const diffDays = (Date.now() - last.getTime()) / 86400000;
        if (diffDays >= thresholdDays) {
            try {
                const refreshResult = await manageLongLiveToken(instagramConfig.token);
                if (!refreshResult?.success) {
                    throw new Error(`Token refresh failed: ${refreshResult?.error || 'unknown'}`);
                }
                instagramConfig = await getInstagramConfig();
            } catch (e) {
                throw new Error(e.message);
            }
        }
    }
    return instagramConfig;
};

/**
 * Creates an Instagram media container via Graph API.
 * @param {Object} params - Media creation parameters
 * @param {string} params.token - Instagram access token
 * @param {string} params.igUserId - Instagram user ID
 * @param {string} params.graphVersion - Graph API version (e.g., 'v21.0')
 * @param {string} params.url - Media URL (image or video)
 * @param {string} params.caption - Media caption
 * @param {boolean} [params.isCarouselItem=false] - Whether this is a carousel item
 * @param {string} [params.mediaType=null] - Media type (e.g., 'STORIES', 'CAROUSEL')
 * @param {Array<string>} [params.childrenIds=null] - Array of child media IDs for carousel
 * @param {boolean} [params.isVideo=false] - Whether the media is a video
 * @returns {Promise<string>} The created media container ID
 * @throws {Error} If media creation fails or response is invalid
 */
const createInstagramMedia = async ({ token, igUserId, graphVersion, url, caption, isCarouselItem = false, mediaType = null, childrenIds = null, isVideo = false }) => {
    const res = await fetch(
        `https://graph.facebook.com/${graphVersion}/${igUserId}/media`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify((() => {
                const payload = {
                    access_token: token,
                    caption: caption || '',
                };
                if (mediaType) {
                    payload.media_type = mediaType;
                }
                if (isCarouselItem) {
                    payload.is_carousel_item = true;
                }
                if (childrenIds) {
                    payload.children = childrenIds;
                }
                if (isVideo) {
                    payload.video_url = url;
                }
                else {
                    payload.image_url = url;
                }
                return payload;
            })())
        }
    );
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Media creation error: ${txt}`);
    }
    const json = await res.json();
    if (!json?.id) {
        throw new Error('Invalid Instagram response: missing media creation id');
    }
    return json.id;
}

/**
 * Publishes an Instagram media container.
 * @param {Object} params - Publishing parameters
 * @param {string} params.token - Instagram access token
 * @param {string} params.igUserId - Instagram user ID
 * @param {string} params.graphVersion - Graph API version
 * @param {string} params.creationId - Media container ID to publish
 * @param {string} [params.postToShareId=null] - Optional sticker asset ID for stories
 * @returns {Promise<string>} The published media ID
 * @throws {Error} If publishing fails or response is invalid
 */
const publishInstagramMedia = async ({ token, igUserId, graphVersion, creationId, postToShareId = null }) => {
    const res = await fetch(
        `https://graph.facebook.com/${graphVersion}/${igUserId}/media_publish`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify((() => {
                const payload = {
                    creation_id: creationId,
                    access_token: token
                };
                if (postToShareId) {
                    payload.sticker_asset_id = postToShareId;
                }
                return payload;
            })())
        }
    );
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Media creation error: ${txt}`);
    }

    const json = await res.json();
    if (!json?.id) {
        throw new Error('Invalid Instagram response: missing media creation id');
    }
    return json.id;
}

/**
 * Fetches Instagram media information via Graph API.
 * @param {Object} params - Fetch parameters
 * @param {string} params.token - Instagram access token
 * @param {string} params.graphVersion - Graph API version
 * @param {string} params.mediaId - Instagram media ID
 * @param {string} params.fields - Comma-separated list of fields to retrieve
 * @returns {Promise<Object>} Media information object
 * @throws {Error} If fetching fails
 */
const fetchInstagramMedia = async ({ token, graphVersion, mediaId, fields }) => {
    const res = await fetch(
        `https://graph.facebook.com/${graphVersion}/${mediaId}?fields=${encodeURIComponent(fields)}&access_token=${token}`,
        { method: 'GET' }
    );
    if (res.ok) {
        return await res.json();
    } else {
        let body = {
            permalink: fields.includes('permalink') ? process.env.INSTAGRAM_PAGE_URL : null,
            likes_count: fields.includes('likes_count') ? 0 : null,
            comments_count: fields.includes('comments_count') ? 0 : null
        }
        return body;
    }
}

// Polls the creation status of a media container until it is FINISHED or ERROR
// Returns an object { status: 'FINISHED'|'ERROR'|'TIMEOUT', last: <lastResponseOrNull> }
const pollCreationStatus = async ({ token, graphVersion, creationId, intervalMs = 1000, maxAttempts = 50 }) => {
    let attempts = 0;
    let last = null;
    while (attempts < maxAttempts) {
        const res = await fetch(
            `https://graph.facebook.com/${graphVersion}/${creationId}?fields=status_code&access_token=${token}`,
            { method: 'GET' }
        );
        if (res.ok) {
            last = await res.json().catch(() => null);
            const code = last?.status_code;
            if (code === 'FINISHED') return { status: 'FINISHED', last };
            if (code === 'ERROR') return { status: 'ERROR', last };
        } else {
            // Non-blocking: wait and retry on transient errors
            try { last = await res.json(); } catch { last = null; }
        }
        await new Promise(r => setTimeout(r, intervalMs));
        attempts++;
    }
    return { status: 'TIMEOUT', last };
}

module.exports = { instagramCalculateRefreshToken, createInstagramMedia, fetchInstagramMedia, publishInstagramMedia, pollCreationStatus };
