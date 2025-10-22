/**
 * Test for the complete daily posting pipeline
 * 
 * PREREQUISITES:
 * - GOOGLE_API_KEY configured in .env (for prompt refinement if used)
 * - Cloudinary configured
 * - Instagram configured (optional for full test)
 * 
 * Run with: node examples/testFullPipeline.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { executeDailyPost } = require('../handlers/postHandler');


async function testFullPipeline() {
    console.log('\n🧪 TEST: Complete Daily Posting Pipeline\n');
    console.log('='.repeat(70) + '\n');

    // Test with custom prompt
    const testPrompt = 'a mystical forest with glowing mushrooms and fireflies at night';
    const testCaption = '🌲✨ Mystical Forest at Night 🌙\n\n#AIArt #DigitalArt #Fantasy #ForestMagic';

    console.log('📋 Test Configuration:');
    console.log(`   Prompt: "${testPrompt}"`);
    console.log(`   Caption: "${testCaption.substring(0, 50)}..."`);
    console.log('');

    const dailyPostCount = parseInt(process.env.DAILY_POST_NUMBER || '1', 10);
    for (let i = 0; i < dailyPostCount; i++) {
        console.log(`\n🤖 Run ${i + 1} of ${dailyPostCount}`)
        const result = await executeDailyPost(
        {
            width: parseInt(process.env.GENERATED_IMAGE_WIDTH || '512', 10),
            height: parseInt(process.env.GENERATED_IMAGE_HEIGHT || '512', 10),
            steps: parseInt(process.env.GENERATED_IMAGE_STEPS || '15', 10),
            cfg: parseFloat(process.env.GENERATED_IMAGE_CFG || '5'),
            sampler: process.env.GENERATED_IMAGE_SAMPLER || 'euler',
            scheduler: process.env.GENERATED_IMAGE_SCHEDULER || 'normal'
        }
    );

    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(70));

    if (result.success) {
        console.log('\n✅ PIPELINE COMPLETED SUCCESSFULLY!\n');
        console.log('📝 Details:');
        console.log(`   Original prompt: ${result.originalPrompt}`);
        console.log(`   Refined prompt: ${result.refinedPrompt?.substring(0, 80)}...`);
        console.log(`   Local image URL: ${result.localImageUrl}`);
        console.log(`   Cloudinary URL: ${result.cloudinaryUrl}`);
        console.log(`   Instagram Media ID: ${result.instagramMediaId}`);
        console.log(`   Total time: ${result.executionTime}`);
        console.log('');
        console.log('🎨 Image settings:');
        console.log(`   Size: ${result.imageSettings?.width}x${result.imageSettings?.height}`);
        console.log('');
        console.log('✨ The post was published successfully on Instagram!');
    } else {
        console.log('\n❌ PIPELINE FAILED\n');
        console.log('Error:', result.error);
        console.log('Execution time:', result.executionTime);
        
        if (result.error.includes('GOOGLE_API_KEY')) {
            console.log('\n💡 Suggestion: Configure GOOGLE_API_KEY in backend/.env');
        } else if (result.error.includes('Cloudinary')) {
            console.log('\n💡 Suggestion: Verify Cloudinary credentials in backend/.env');
        } else if (result.error.includes('Instagram')) {
            console.log('\n💡 Suggestion: Verify INSTAGRAM_ACCESS_TOKEN and IG_USER_ID');
        }
    }
}
    console.log('\n' + '='.repeat(70) + '\n');
}

// Run the test
testFullPipeline().catch(error => {
    console.error('❌ Critical error during test:', error);
    process.exit(1);
});
