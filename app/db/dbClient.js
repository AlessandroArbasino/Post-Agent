
const { decryptToken, encryptToken } = require('../utils/crypto');
/**
 * PostgreSQL client for Neon Database via Vercel Postgres
 * Manages connection and database queries
 */

// Neon serverless client (ESM) via dynamic import for CommonJS compatibility
let neonClientPromise = null;
const getClient = async () => {
    if (!neonClientPromise) {
        neonClientPromise = (async () => {
            const { neon } = await import('@neondatabase/serverless');
            const connectionString = process.env.DATABASE_URL;
            if (!connectionString) {
                throw new Error('DATABASE_URL not configured');
            }
            return neon(connectionString);
        })();
    }
    return await neonClientPromise;
};

/**
 * Retrieve the active Instagram configuration from the database
 * @returns {Promise<Object>} - { token, createdate }
 */
const getInstagramConfig = async () => {
    try {
        const sql = await getClient();
        const result = await sql`SELECT token
                                 FROM tokens
                                 WHERE token_type = ${process.env.INSTAGRAM_TOKEN_TYPE}
                                 LIMIT 1`;

        if (result.length === 0) {
            console.warn('⚠️  No Instagram configuration found in DB');
            return null;
        }

        const row = result[0];
        return {
            token: decryptToken(row.token),
            createdate: row.create_date
        };
    } catch (error) {
        console.error('❌ Error retrieving Instagram configuration:', error);
        throw error;
    }
};

/**
 * Update the Instagram token in the database
 * @param {string} accessToken - New access token
 * @returns {Promise<boolean>} - true if updated and encrypted successfully
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
        console.log('✅ Instagram token updated in database');
        return true;
    } catch (error) {
        console.error('❌ Error updating Instagram token:', error);
        throw error;
    }
};

/**
 * Retrieve the next prompt from the queue
 * @returns {Promise<Object|null>} - { id, prompt } or null if the queue is empty
 */
const getNextPrompt = async () => {
    try {
        const sql = await getClient();
        const result = await sql`SELECT id, prompt
                                 FROM prompt_queue
                                 ORDER BY create_date ASC
                                 LIMIT 1`;

        if (result.length === 0) {
            console.log('ℹ️  Prompt queue is empty');
            return null;
        }

        const row = result[0];

        return {
            id: row.id,
            prompt: row.prompt,
        };
    } catch (error) {
        console.error('❌ Error fetching next prompt:', error);
        throw error;
    }
};

/**
 * Mark a prompt as completed
 * @param {number} promptId - Prompt ID
 * @returns {Promise<boolean>}
 */
const removeCompletedPrompt = async (promptId) => {
    try {
        const sql = await getClient();
        await sql`DELETE FROM prompt_queue WHERE id = ${promptId}`;
        console.log(`🗑️ Prompt ${promptId} deleted after completion`);
        return true;
    } catch (error) {
        console.error('❌ Error deleting completed prompt:', error);
        throw error;
    }
};

/**
 * Insert a new image record for voting
 * @param {Object} params
 * @param {string} params.instagramPostId
 * @param {string} params.imageUrl
 * @param {string} params.cloudinaryFolder
 * @returns {Promise<{id:number}>}
 */
const insertVotingImage = async ({ instagramPostId, imageUrl, cloudinaryFolder }) => {
    try {
        const sql = await getClient();
        const rows = await sql`INSERT INTO voting_images (instagram_post_id, image_url, cloudinary_folder, create_date)
                               VALUES (${instagramPostId}, ${imageUrl}, ${cloudinaryFolder}, NOW())
                               RETURNING id`;
        const id = rows?.[0]?.id;
        console.log('✅ voting_images insert id:', id);
        return { id };
    } catch (error) {
        throw error;
    }
};

module.exports = {
    getInstagramConfig,
    updateInstagramToken,
    getNextPrompt,
    removeCompletedPrompt,
    insertVotingImage
};

