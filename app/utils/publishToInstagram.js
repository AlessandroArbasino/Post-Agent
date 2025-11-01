/**
 * Publishing to Instagram via Graph API
 * Handles media container creation and publishing
 */

const fetch = (...args) => (globalThis.fetch ? globalThis.fetch(...args) : import('node-fetch').then(({ default: f }) => f(...args)));
const { getInstagramConfig } = require('../db/dbClient');
const { manageLongLiveToken } = require('../utils/instagramToken');

/**
 * Publish an image to Instagram
 * @param {string} imageUrl - Public image URL (must be accessible by Instagram)
 * @param {string} caption - Post caption
 * @returns {Promise<Object>} - Publishing result
 */
const publishToInstagram = async (imageUrl, caption = '') => {
    const graphVersion = process.env.INSTAGRAM_GRAPH_VERSION || 'v21.0';
    let instagramConfig = null;

    // Get Instagram config from DB if connected to DB, otherwise from ENV without crypto
    if(process.env.DATABASE_URL) {
        instagramConfig = await getInstagramConfig();
    }else{
        instagramConfig = {
            token: process.env.INSTAGRAM_ACCESS_TOKEN,
            //assuming token is valid and not expired if there is no database connection
            createdate: new Date().toISOString()
        };
    }


    // Refresh token only if older than N days (DAYS_BETWEEN_TOKEN_REFRESH)
    const thresholdDays = parseInt(process.env.DAYS_BETWEEN_TOKEN_REFRESH || '55', 10);
    if (instagramConfig?.createdate) {
        const last = new Date(instagramConfig.createdate);
        const diffDays = (Date.now() - last.getTime()) / 86400000; // 86400000 = 24 * 60 * 60 * 1000 milliseconds in a day
        if (diffDays >= thresholdDays) {
            try {
                const refreshResult = await manageLongLiveToken(instagramConfig.token);
                if (!refreshResult?.success) {
                    throw new Error(`Token refresh failed: ${refreshResult?.error || 'unknown'}`);
                }
                // Ricarica dal DB il token aggiornato
                instagramConfig = await getInstagramConfig();
            } catch (e) {
                throw new Error(e.message);
            }
        }
    }

    const token = instagramConfig.token;
    let igUserId = process.env.IG_USER_ID;

    if (!token || !igUserId) {
        throw new Error('Token or IG_USER_ID not configured (DB or ENV)');
    }

    console.log('📸 Starting publish to Instagram...');
    console.log(`   Image URL: ${imageUrl}`);
    console.log(`   Caption: ${caption.substring(0, 50)}...`);

    const { creationId, mediaId, permalink } = await managePublish(token, igUserId, graphVersion, imageUrl, caption);
        console.log(`🎉 Post published successfully! Media ID: ${mediaId}`);
        if (permalink) console.log(`🔗 Permalink: ${permalink}`);
        return { success: true, mode: 'executed', creationId, mediaId, permalink, message: 'Instagram post published successfully' };
};

async function managePublish(token, igUserId, graphVersion, imageUrl, caption) {
    // Step 1: Create media container
    const createMediaResponse = await fetch(
        `https://graph.facebook.com/${graphVersion}/${igUserId}/media`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image_url: imageUrl,
                caption: caption || '',
                access_token: token
            })
        }
    );

    if (!createMediaResponse.ok) {
        const errorText = await createMediaResponse.text();
        throw new Error(`Media creation error: ${errorText}`);
    }

    const mediaJson = await createMediaResponse.json();
    const creationId = mediaJson.id;
    if (!creationId) {
        throw new Error('Invalid Instagram response: missing creation_id');
    }

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 2: Publish media
    const publishMediaResponse = await fetch(
        `https://graph.facebook.com/${graphVersion}/${igUserId}/media_publish`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                creation_id: creationId,
                access_token: token
            })
        }
    );

    if (!publishMediaResponse.ok) {
        const errorText = await publishMediaResponse.text();
        throw new Error(`Publishing error: ${errorText}`);
    }

    const publishJson = await publishMediaResponse.json();
    const mediaId = publishJson.id;

    // Step 3: Retrieve permalink of published media
    let permalink = null;
    try {
        const permalinkRes = await fetch(
            `https://graph.facebook.com/${graphVersion}/${mediaId}?fields=permalink&access_token=${token}`,
            { method: 'GET' }
        );
        if (permalinkRes.ok) {
            const p = await permalinkRes.json();
            permalink = p?.permalink || null;
        } else {
            const txt = await permalinkRes.text();
            console.warn(`⚠️ Unable to obtain permalink: ${txt}`);
        }
    } catch (e) {
        console.warn(`⚠️ Permalink request error: ${e?.message || e}`);
    }

    return { creationId, mediaId, permalink };
}


module.exports = {
    publishToInstagram
};
