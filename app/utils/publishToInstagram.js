/**
 * Pubblicazione su Instagram tramite Graph API
 * Gestisce la creazione del media container e la pubblicazione
 */

const fetch = require('node-fetch');
const { getInstagramConfig } = require('../db/dbClient');
const { manageLongLiveToken } = require('../utils/instagramToken');

/**
 * Pubblica un'immagine su Instagram
 * @param {string} imageUrl - URL pubblico dell'immagine (deve essere accessibile da Instagram)
 * @param {string} caption - Didascalia del post
 * @returns {Promise<Object>} - Risultato della pubblicazione
 */
const publishToInstagram = async (imageUrl, caption = '') => {
    const graphVersion = process.env.INSTAGRAM_GRAPH_VERSION || 'v21.0';

    let instagramConfig = await getInstagramConfig();

    // Refresh token solo se più vecchio di N giorni (DAYS_BETWEEN_TOKEN_REFRESH)
    const thresholdDays = parseInt(process.env.DAYS_BETWEEN_TOKEN_REFRESH || '55', 10);
    if (instagramConfig?.createdate) {
        const last = new Date(instagramConfig.createdate);
        const diffDays = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays >= thresholdDays) {
            try {
                const refreshResult = await manageLongLiveToken(instagramConfig.token);
                if (!refreshResult?.success) {
                    throw new Error(`Refresh token fallito: ${refreshResult?.error || 'unknown'}`);
                }
                // Ricarica dal DB il token aggiornato
                instagramConfig = await getInstagramConfig();
            } catch (e) {
                return { success: false, mode: 'error', error: e.message };
            }
        }
    }

    const token = instagramConfig.token;
    let igUserId = process.env.IG_USER_ID;

    if (!token || !igUserId) {
        return { success: false, mode: 'error', error: 'Token o IG_USER_ID non configurati (DB o ENV)' };
    }


    try {
        console.log('📸 Inizio pubblicazione su Instagram...');
        console.log(`   URL immagine: ${imageUrl}`);
        console.log(`   Didascalia: ${caption.substring(0, 50)}...`);

        try {
            const { creationId, mediaId } = await managePublish(token, igUserId, graphVersion, imageUrl, caption);
            console.log(`🎉 Post pubblicato con successo! Media ID: ${mediaId}`);
            return { success: true, mode: 'executed', creationId, mediaId, message: 'Post Instagram pubblicato con successo' };
        } catch (err) {
            throw err;
        }
    } catch (error) {
        console.error('❌ Errore publishToInstagram:', error);
        return { success: false, mode: 'error', error: error.message };
    }
};

async function managePublish(token, igUserId, graphVersion, imageUrl, caption) {
    // Step 1: Creazione media container
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
        throw new Error(`Errore creazione media: ${errorText}`);
    }

    const mediaJson = await createMediaResponse.json();
    const creationId = mediaJson.id;
    if (!creationId) {
        throw new Error('Risposta Instagram non valida: manca creation_id');
    }

    // Attesa processing
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 2: Pubblicazione media
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
        throw new Error(`Errore pubblicazione: ${errorText}`);
    }

    const publishJson = await publishMediaResponse.json();
    return { creationId, mediaId: publishJson.id };
}


module.exports = {
    publishToInstagram
};
