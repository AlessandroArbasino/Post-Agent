/**
 * Main handler for publishing the daily post
 * Full flow: Refine Prompt → Generate Image → Upload → Post to Instagram
 */

const { refinePrompt, generateInstagramCaption, getPromptFromDefault } = require('../services/ai/promptRefiner');
const { generateImageGradio } = require('../services/ai/imageGenerator');
const { uploadToCloudinary } = require('../services/cloudinary/uploader');
const { publishToInstagram } = require('../services/instagram/publisher');
const { getNextPrompt, removeCompletedPrompt, insertVotingImage } = require('../db/dbClient');
const { sendTelegramNotification } = require('../services/telegram/notifier');

/**
 * Execute the complete daily publishing flow
 * @param {Object} imageOptions - Image generation options (width, height, steps, etc.)
 * @returns {Promise<Object>} - Full operation result
 */
const executeDailyPost = async (imageOptions = {}, instagramPageName = '') => {
    let startTime = Date.now();

    console.log('\n' + '='.repeat(70));
    console.log('🚀 DAILY POST START - FULL PIPELINE');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('='.repeat(70) + '\n');

    let dbPrompt = null;
    let refineResult = null;

    console.log('🤖 STEP 0: Get prompt from database');

    if (process.env.DATABASE_URL) {
        dbPrompt = await getNextPrompt();
    }

    if (!dbPrompt) {
        dbPrompt = await getPromptFromDefault();
    }

    console.log(`   Original prompt: "${dbPrompt.prompt}"`);

    console.log('🤖 STEP 2: Prompt refinement with Gemini AI');
    refineResult = await refinePrompt({ prompt: dbPrompt.prompt });

    console.log(`   ✅ Refined prompt: "${refineResult.geminiResponse.substring(0, 80)}..."\n`);

    // Step 2: Image generation with Gradio
    console.log('🎨 STEP 3: Image generation with Gradio');
    let generateResult = await generateImageGradio(refineResult.geminiResponse, {
        width: imageOptions.width,
        height: imageOptions.height,
        guidance_scale: imageOptions.cfg || 4,
        num_inference_steps: imageOptions.steps || 15,
        seed: imageOptions.seed,
        randomize_seed: imageOptions.randomize_seed ?? true,
    });

    console.log(`   ✅ Image generated (buffer ${generateResult.sourceUri?.length || 0} bytes)`);
    console.log(`   ⏱️  Generation time: ${generateResult.executionTime}\n`);

    // Step 3: Upload image to Cloudinary (for stable public URL) using direct URL
    console.log('📤 STEP 4: Upload to Cloudinary (from URL)');
    const today = new Date().toISOString().slice(0, 10);
    const cloudinaryFolder = `dailypost/${today}`;
    let uploadRes = await uploadToCloudinary(generateResult.sourceUri, {
        folder: cloudinaryFolder,
    });

    let publicImageUrl = uploadRes?.publicUrl;
    if (!publicImageUrl) {
        throw new Error('Upload failed: public URL not available');
    }
    console.log(`   ✅ Image uploaded: ${publicImageUrl}\n`);

    // Step 4: Instagram caption generation with Gemini (parametric on hashtags)
    console.log('✍️  STEP 5: Generate Instagram caption');
    let finalCaption = await generateInstagramCaption({
        refinedPrompt: refineResult.geminiResponse,
        maxHashtags: parseInt(process.env.CAPTION_MAX_HASHTAGS || '5', 10)
    });

    // Step 5: Publish to Instagram (function handles refresh+retry if needed)
    console.log('📱 STEP 6: Publish to Instagram');
    let instagramResult = await publishToInstagram({
        url: publicImageUrl,
        caption: finalCaption.geminiResponse
    });

    let executionTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(70));
    console.log('✅ DAILY POST COMPLETED SUCCESSFULLY');
    console.log(`⏱️  Total execution time: ${executionTime}s`);
    console.log(`📸 Instagram Media ID: ${instagramResult.mediaId}`);
    console.log(`🎨 Refined prompt: "${refineResult.geminiResponse.substring(0, 60)}..."`);

    // Do not remove the prompt if it was obtained from default
    if (dbPrompt?.id) {
        removeCompletedPrompt(dbPrompt.id);
    }
    if (process.env.DATABASE_URL && process.env.VOTING_ENABLED === 'true') {
        await insertVotingImage({
            instagramPostId: instagramResult.mediaId,
            imageUrl: publicImageUrl,
            cloudinaryFolder: cloudinaryFolder,
            instagramCaption: finalCaption.geminiResponse
        });
    }
    // Telegram notification
    try {
        const notifyRes = await sendTelegramNotification({
            status: 'success',
            imageUrl: publicImageUrl,
            originalPrompt: dbPrompt.prompt,
            permalink: instagramResult.permalink,
            topicId: process.env.DAILY_PICS_THREAD_ID
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
        executionTime: `${executionTime}s`
    };

    /*catch (error) {
        let executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error('\n' + '='.repeat(70));
        console.error('❌ ERROR DURING PUBLISHING');
        console.error(`⏱️  Execution time: ${executionTime}s`);
        console.error('Error:', error.message);
        // Attach context for centralized error middleware
        try {
            error.context = {
                originalPrompt: dbPrompt.prompt || "Prompt not available",
                refinedPrompt: refineResult.geminiResponse || "Refined Prompt not available",
            };
            console.log('context', error.context);
        } catch (_) {}
        // Rely on centralized error handler to notify and on route wrapper to respond
        throw error;
    }*/
}

module.exports = {
    executeDailyPost
};
