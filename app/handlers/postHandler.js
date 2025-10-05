/**
 * Handler principale per la pubblicazione del post giornaliero
 * Flusso completo: Refine Prompt → Generate Image → Upload → Post Instagram
 */

const { refinePrompt } = require('../utils/refinePrompt');
const { generateImage } = require('../utils/generateImage');
const { uploadBufferToCloudinary,uploadToCloudinary } = require('../utils/uploadToCloudinary');
const { publishToInstagram } = require('../utils/publishToInstagram');
const { manageLongLiveToken } = require('../utils/instagramToken');
const { generateGeminiImage } = require('../utils/generateImage');
const { getNextPrompt, removeCompletedPrompt } = require('../db/dbClient');
const config = require('../config');
const crypto = require('crypto');

/**
 * Esegue il flusso completo di pubblicazione giornaliera
 * @param {Object} imageOptions - Opzioni per la generazione dell'immagine (width, height, steps, etc.)
 * @returns {Promise<Object>} - Risultato completo dell'operazione
 */
const executeDailyPost = async (imageOptions = {}) => {
    const startTime = Date.now();
    console.log('\n' + '='.repeat(70));
    console.log('🚀 AVVIO POST GIORNALIERO - PIPELINE COMPLETA');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('='.repeat(70) + '\n');

    try {
        // Step 1: Ottieni prompt da database
        console.log('🤖 FASE 1: Ottieni prompt da database');
        const dbPrompt = await getNextPrompt();
        const prompt = dbPrompt.prompt;
        const promptId = dbPrompt.id;
        console.log(`   Prompt originale: "${prompt}"`);

        console.log('🤖 FASE 2: Raffinamento prompt con Gemini AI');
        const refineResult = await refinePrompt(prompt, imageOptions.model || process.env.DEFAULT_MODEL);
        
        if (!refineResult.success) {
            throw new Error(`Raffinamento prompt fallito: ${refineResult.error}`);
        }
        
        const refinedPrompt = refineResult.refined;
        console.log(`   ✅ Prompt raffinato: "${refinedPrompt.substring(0, 80)}..."\n`);

        // Step 2: Generazione dell'immagine con ComfyUI
        console.log('🎨 FASE 3: Generazione immagine con ComfyUI');
        const generateResult = await generateImage(refinedPrompt, {
            ...imageOptions,
        });

        if (!generateResult.success) {
            throw new Error(`Generazione immagine fallita: ${generateResult.error}`);
        }
        console.log(`   ✅ Immagine generata (buffer ${generateResult.buffer?.length || 0} bytes)`);
        console.log(`   ⏱️  Tempo generazione: ${generateResult.executionTime}\n`);

        // Step 3: Upload immagine a Cloudinary (per URL pubblico stabile)
        console.log('📤 FASE 4: Upload su Cloudinary');
        const cloudinaryRes = await uploadToCloudinary(generateResult.imageUrl, {
            folder: 'daily-posts',
            publicId: `daily_${Date.now()}`
        });

        const publicImageUrl = cloudinaryRes.publicUrl;
        if (!publicImageUrl) {
            throw new Error('Upload fallito: URL pubblico non disponibile');
        }
        console.log(`   ✅ Immagine caricata: ${publicImageUrl}\n`);

        // Step 4: Pubblicazione su Instagram (la funzione gestisce refresh+retry se necessario)
        console.log('📱 FASE 5: Pubblicazione su Instagram');
        const instagramResult = await publishToInstagram(publicImageUrl, refinedPrompt);

        if (!instagramResult.success) {
            throw new Error(`Pubblicazione fallita: ${instagramResult.error}`);
        }

        const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('\n' + '='.repeat(70));
        console.log('✅ POST GIORNALIERO COMPLETATO CON SUCCESSO');
        console.log(`⏱️  Tempo totale di esecuzione: ${executionTime}s`);
        console.log(`📸 Instagram Media ID: ${instagramResult.mediaId}`);
        console.log(`🎨 Prompt raffinato: "${refinedPrompt.substring(0, 60)}..."`);

        removeCompletedPrompt(promptId);

        return {
            success: true,
            timestamp: new Date().toISOString(),
            executionTime: `${executionTime}s`,
            originalPrompt: prompt,
            refinedPrompt: refinedPrompt,
            localImageUrl: null,
            cloudinaryUrl: publicImageUrl,
            instagramMediaId: instagramResult.mediaId,
            instagramCreationId: instagramResult.creationId,
            imageSettings: generateResult.settings
        };

    } catch (error) {
        const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.error('\n' + '='.repeat(70));
        console.error('❌ ERRORE DURANTE LA PUBBLICAZIONE');
        console.error(`⏱️  Tempo di esecuzione: ${executionTime}s`);
        console.error('Errore:', error.message);
        console.error('='.repeat(70) + '\n');

        return {
            success: false,
            timestamp: new Date().toISOString(),
            executionTime: `${executionTime}s`,
            error: error.message,
            stack: error.stack
        };
    }
};

module.exports = {
    executeDailyPost
};
