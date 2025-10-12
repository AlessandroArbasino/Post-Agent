
const { decryptToken, encryptToken } = require('../utils/crypto');
/**
 * Client PostgreSQL per Neon Database via Vercel Postgres
 * Gestisce connessione e query al database
 */

// Neon serverless client (ESM) via dynamic import for CommonJS compatibility
let neonClientPromise = null;
const getClient = async () => {
    if (!neonClientPromise) {
        neonClientPromise = (async () => {
            const { neon } = await import('@neondatabase/serverless');
            const connectionString = process.env.DATABASE_URL;
            if (!connectionString) {
                throw new Error('DATABASE_URL non configurato');
            }
            return neon(connectionString);
        })();
    }
    return await neonClientPromise;
};

/**
 * Recupera la configurazione WhatsApp dal database
 * Legge il token dal record con token_type = WHATSAPP_TOKEN_TYPE
 * @returns {Promise<{token: string, createdate: any} | null>}
 */
const getWhatsAppConfig = async () => {
    try {
        const sql = await getClient();
        const result = await sql`SELECT token, create_date as createdate
                                 FROM tokens
                                 WHERE token_type = ${process.env.WHATSAPP_TOKEN_TYPE}
                                 LIMIT 1`;

        if (result.length === 0) {
            console.warn('⚠️  Nessuna configurazione WhatsApp trovata nel DB');
            return null;
        }

        const row = result[0];
        return {
            token: decryptToken(row.token),
            createdate: row.createdate
        };
    } catch (error) {
        console.error('❌ Errore recupero configurazione WhatsApp:', error);
        throw error;
    }
};

/**
 * Recupera la configurazione Instagram attiva dal database
 * @returns {Promise<Object>} - {decrypted accessToken, createdate }
 */
const getInstagramConfig = async () => {
    try {
        const sql = await getClient();
        const result = await sql`SELECT token
                                 FROM tokens
                                 WHERE token_type = ${process.env.INSTAGRAM_TOKEN_TYPE}
                                 LIMIT 1`;

        if (result.length === 0) {
            console.warn('⚠️  Nessuna configurazione Instagram trovata nel DB');
            return null;
        }

        const row = result[0];
        return {
            token: decryptToken(row.token),
            createdate: row.createdate
        };
    } catch (error) {
        console.error('❌ Errore recupero configurazione Instagram:', error);
        throw error;
    }
};

/**
 * Aggiorna il token Instagram nel database
 * @param {string} accessToken - Nuovo access token
 * @returns {Promise<boolean>} - true se aggiornato e encrypted con successo
 */
const updateInstagramToken = async (accessToken) => {
    try {
        const encryptedToken = encryptToken(accessToken);
        
        const sql = await getClient();
        await sql`UPDATE tokens
                   SET token = ${encryptedToken},
                       create_date = NOW()
                   WHERE id = (
                       SELECT id FROM tokens
                       WHERE token_type = ${process.env.INSTAGRAM_TOKEN_TYPE}
                       LIMIT 1
                   )`;
        console.log('✅ Token Instagram aggiornato nel database');
        return true;
    } catch (error) {
        console.error('❌ Errore aggiornamento token Instagram:', error);
        throw error;
    }
};

/**
 * Recupera il prossimo prompt dalla coda
 * @returns {Promise<Object|null>} - { id, prompt} o null se coda vuota
 */
const getNextPrompt = async () => {
    try {
        const sql = await getClient();
        const result = await sql`SELECT id, prompt
                                 FROM prompt_queue
                                 ORDER BY create_date ASC
                                 LIMIT 1`;

        if (result.length === 0) {
            console.log('ℹ️  Coda prompt vuota');
            return null;
        }

        const row = result[0];

        return {
            id: row.id,
            prompt: row.prompt,
        };
    } catch (error) {
        console.error('❌ Errore recupero prompt:', error);
        throw error;
    }
};

/**
 * Marca un prompt come completato
 * @param {number} promptId - ID del prompt
 * @returns {Promise<boolean>}
 */
const removeCompletedPrompt = async (promptId) => {
    try {
        const sql = await getClient();
        await sql`DELETE FROM prompt_queue WHERE id = ${promptId}`;
        console.log(`🗑️ Prompt ${promptId} eliminato dopo completamento`);
        return true;
    } catch (error) {
        console.error('❌ Errore marcatura prompt completato:', error);
        throw error;
    }
};

module.exports = {
    getInstagramConfig,
    updateInstagramToken,
    getNextPrompt,
    removeCompletedPrompt,
    getWhatsAppConfig
};

