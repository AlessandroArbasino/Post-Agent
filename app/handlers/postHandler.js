/**
 * Main handler for publishing the daily post
 * Full flow: Refine Prompt → Generate Image → Upload → Post to Instagram
 */

const { refinePrompt, generateInstagramCaption, getPromptFromDefault } = require('../utils/refinePrompt');
const { generateImageGradio } = require('../utils/generateImageGradio');
const { uploadToCloudinary } = require('../utils/uploadToCloudinary');
const { publishToInstagram } = require('../utils/publishToInstagram');
const { getNextPrompt, removeCompletedPrompt } = require('../db/dbClient');
const { sendTelegramNotification } = require('../utils/telegramNotifier');

/**
 * Execute the complete daily publishing flow
 * @param {Object} imageOptions - Image generation options (width, height, steps, etc.)
 * @returns {Promise<Object>} - Full operation result
 */
const executeDailyPost = async (imageOptions = {}) => {
    let startTime = Date.now();

    console.log('\n' + '='.repeat(70));
    console.log('🚀 DAILY POST START - FULL PIPELINE');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('='.repeat(70) + '\n');

    try {
        console.log('🤖 STEP 0: Get prompt from database');
        let dbPrompt = null;
        
        if(process.env.DATABASE_URL) {
            dbPrompt = await getNextPrompt();
        }

        if (!dbPrompt) {
            dbPrompt = await getPromptFromDefault();
        }
        console.log(`   Original prompt: "${dbPrompt.prompt}"`);

        console.log('🤖 STEP 2: Prompt refinement with Gemini AI');
        let refineResult = await refinePrompt(dbPrompt.prompt, imageOptions.model || process.env.DEFAULT_MODEL);
        
        if (!refineResult.success) {
            throw new Error(`Prompt refinement failed: ${refineResult.error}`);
        }
        
        console.log(`   ✅ Refined prompt: "${refineResult.refined.substring(0, 80)}..."\n`);

        // Step 2: Image generation with Gradio
        console.log('🎨 STEP 3: Image generation with Gradio');
        let generateResult = await generateImageGradio(refineResult.refined, {
            width: imageOptions.width,
            height: imageOptions.height,
            guidance_scale: imageOptions.cfg || 4,
            num_inference_steps: imageOptions.steps || 15,
            seed: imageOptions.seed,
            randomize_seed: imageOptions.randomize_seed ?? true,
        });

        if (!generateResult.success) {
            throw new Error(`Image generation failed: ${generateResult.error}`);
        }
        console.log(`   ✅ Image generated (buffer ${generateResult.sourceUri?.length || 0} bytes)`);
        console.log(`   ⏱️  Generation time: ${generateResult.executionTime}\n`);

        // Step 3: Upload image to Cloudinary (for stable public URL) using direct URL
        console.log('📤 STEP 4: Upload to Cloudinary (from URL)');
        let uploadRes = await uploadToCloudinary(generateResult.sourceUri, {

        });

        let publicImageUrl = uploadRes?.publicUrl;
        if (!publicImageUrl) {
            throw new Error('Upload failed: public URL not available');
        }
        console.log(`   ✅ Image uploaded: ${publicImageUrl}\n`);

        // Step 4: Instagram caption generation with Gemini (parametric on hashtags)
        console.log('✍️  STEP 5: Generate Instagram caption');
        let finalCaption = await generateInstagramCaption(refineResult.refined, 
            { maxHashtags: parseInt(process.env.CAPTION_MAX_HASHTAGS || '5', 10), 
                model: process.env.DEFAULT_MODEL });

        // Step 5: Publish to Instagram (function handles refresh+retry if needed)
        console.log('📱 STEP 6: Publish to Instagram');
        let instagramResult = await publishToInstagram(publicImageUrl, finalCaption.caption);

        if (!instagramResult.success) {
            throw new Error(`Publishing failed: ${instagramResult.error}`);
        }

        let executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('\n' + '='.repeat(70));
        console.log('✅ DAILY POST COMPLETED SUCCESSFULLY');
        console.log(`⏱️  Total execution time: ${executionTime}s`);
        console.log(`📸 Instagram Media ID: ${instagramResult.mediaId}`);
        console.log(`🎨 Refined prompt: "${refineResult.refined.substring(0, 60)}..."`);

        // Do not remove the prompt if it was obtained from default
        if (dbPrompt?.id) {
            removeCompletedPrompt(dbPrompt.id);
        }

        // Telegram notification
        try {
            const notifyRes = await sendTelegramNotification({
                status: 'success',
                imageUrl: publicImageUrl,
                caption: finalCaption.caption,
                originalPrompt: refineResult.original,
                refinedPrompt: refineResult.refined,
                permalink: instagramResult.permalink
            });
            if (!notifyRes?.success) {
                console.warn('⚠️ Telegram notification failed (success path):', notifyRes?.error);
            }
        } catch (e) {
            console.warn('⚠️ Telegram notification error (success path):', e.message);
        }

        return {
            success: true,
            timestamp: new Date().toISOString(),
            executionTime: `${executionTime}s`,
            originalPrompt: refineResult.original,
            refinedPrompt: refineResult.refined,
            localImageUrl: null,
            cloudinaryUrl: publicImageUrl,
            instagramMediaId: instagramResult.mediaId,
            instagramCreationId: instagramResult.creationId,
            imageSettings: generateResult.settings
        };

    } catch (error) {
        let executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.error('\n' + '='.repeat(70));
        console.error('❌ ERROR DURING PUBLISHING');
        console.error(`⏱️  Execution time: ${executionTime}s`);
        console.error('Error:', error.message);

        try {
            const notifyErrRes = await sendTelegramNotification({
                status: 'error',
                imageUrl: null,
                caption: null,
                originalPrompt: refineResult.original,
                refinedPrompt: refineResult.refined,
                error: error.message,
                permalink: null
            });
            if (!notifyErrRes?.success) {
                console.warn('⚠️ Telegram notification failed (error path):', notifyErrRes?.error);
            }
        } catch (e) {
            console.warn('⚠️ Telegram notification error (error path):', e.message);
        }

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
