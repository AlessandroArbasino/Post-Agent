/**
 * Configurazione centralizzata per la Lambda Instagram
 * Carica le variabili d'ambiente e le esporta
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

module.exports = {
    // Cloudinary Configuration
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
        folder: process.env.CLOUDINARY_FOLDER || 'instagram-lambda'
    },

    // Instagram Configuration
    instagram: {
        accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
        userId: process.env.IG_USER_ID,
        graphVersion: process.env.IG_GRAPH_VERSION || 'v21.0',
        // App credentials per exchange/refresh token
        appId: process.env.INSTAGRAM_APP_ID,
        appSecret: process.env.INSTAGRAM_APP_SECRET
    },

    // Database (Neon) configuration
    db: {
        useNeon: String(process.env.USE_DB_NEON || 'false').toLowerCase() === 'true',
        databaseUrl: process.env.DATABASE_URL || ''
    },

    // Google AI Configuration
    google: {
        apiKey: process.env.GOOGLE_API_KEY
    },

    // ComfyUI Configuration
    comfyui: {
        baseUrl: process.env.COMFYUI_BASE_URL || 'http://127.0.0.1:8188',
        ckptName: process.env.COMFYUI_CKPT_NAME || 'sd_xl_base_1.0.safetensors',
        defaultWidth: 1024,
        defaultHeight: 1024,
        defaultSteps: 28,
        defaultCfg: 7,
        defaultSampler: 'euler',
        defaultScheduler: 'normal'
    },

    // Scheduler Configuration
    scheduler: {
        // Intervallo in millisecondi (24 ore = 86400000ms)
        interval: 24 * 60 * 60 * 1000,
        useDbPromptQueue: String(process.env.USE_PROMPT_QUEUE_DB || 'false').toLowerCase() === 'true',
        // Prompt fisso per la generazione giornaliera dell'immagine
        defaultPrompt: process.env.DAILY_POST_PROMPT || 'a beautiful futuristic cityscape at sunset with flying cars and neon lights',
        // Didascalia fissa per il post giornaliero
        defaultCaption: process.env.DAILY_POST_CAPTION || '✨ Daily AI Art ✨\n\n#AI #Art #GenerativeAI #DailyPost'
    },


    // Validazione configurazione
    validate() {
        const errors = [];

        if (!this.cloudinary.cloudName || !this.cloudinary.apiKey || !this.cloudinary.apiSecret) {
            errors.push('Cloudinary non configurato: mancano CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY o CLOUDINARY_API_SECRET');
        }

        // Se usiamo DB Neon, la configurazione Instagram arriva dal DB (token e userId)
        if (!this.db.useNeon || !this.scheduler.useDbPromptQueue) {
            if (!this.instagram.accessToken || !this.instagram.userId) {
                errors.push('Instagram non configurato: mancano INSTAGRAM_ACCESS_TOKEN o IG_USER_ID');
            }
        }

        if (!this.google.apiKey) {
            errors.push('Google AI non configurato: manca GOOGLE_API_KEY');
        }

        if (!this.scheduler.defaultPrompt) {
            errors.push('Prompt non configurato: manca DAILY_POST_PROMPT');
        }

        // Validazione DB
        if (this.db.useNeon && !this.db.databaseUrl) {
            errors.push('USE_DB_NEON abilitato ma manca DATABASE_URL');
        }
        
        if (errors.length > 0) {
            console.error('❌ Errori di configurazione:');
            errors.forEach(err => console.error(`  - ${err}`));
            return false;
        }
        
        console.log('✅ Configurazione validata con successo');
        return true;
    }
};
