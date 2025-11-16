const fetch = (...args) => (globalThis.fetch ? globalThis.fetch(...args) : import('node-fetch').then(({ default: f }) => f(...args)));
const { getInstagramConfig } = require('../db/dbClient');
const { manageLongLiveToken } = require('../utils/instagramToken');

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

const createInstagramMedia = async ({token, igUserId, graphVersion, url, caption, isCarouselItem = false,mediaType = null,childrenIds = null,isVideo = false}) => {
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

const publishInstagramMedia = async ({token, igUserId, graphVersion, creationId,postToShareId = null}) => {
    const res = await fetch(
        `https://graph.facebook.com/${graphVersion}/${igUserId}/media_publish`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body:JSON.stringify((() => {
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

const fetchInstagramMedia = async ({token, graphVersion, mediaId, fields}) => {
    const res = await fetch(
        `https://graph.facebook.com/${graphVersion}/${mediaId}?fields=${encodeURIComponent(fields)}&access_token=${token}`,
        { method: 'GET' }
    );
    if (res.ok) {
        return await res.json();
    } else {
        const txt = await res.text();
        throw new Error(`⚠️ Unable to obtain fields (${fields}): ${txt}`);
    }
}

// Polls the creation status of a media container until it is FINISHED or ERROR
// Returns an object { status: 'FINISHED'|'ERROR'|'TIMEOUT', last: <lastResponseOrNull> }
const pollCreationStatus = async ({ token, graphVersion, creationId, intervalMs = 1000, maxAttempts = 30 }) => {
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
