/**
 * Test della pipeline completa di posting giornaliero
 * 
 * PREREQUISITI:
 * - ComfyUI in esecuzione su http://127.0.0.1:8188
 * - Checkpoint presente in ComfyUI/models/checkpoints
 * - GOOGLE_API_KEY configurata in .env
 * - Cloudinary configurato
 * - Instagram configurato (opzionale per test completo)
 * 
 * Esegui con: node examples/testFullPipeline.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { executeDailyPost } = require('../handlers/postHandler');

async function testFullPipeline() {
    console.log('\n🧪 TEST: Pipeline Completa di Posting Giornaliero\n');
    console.log('='.repeat(70) + '\n');

    // Test con prompt personalizzato
    const testPrompt = 'a mystical forest with glowing mushrooms and fireflies at night';
    const testCaption = '🌲✨ Mystical Forest at Night 🌙\n\n#AIArt #DigitalArt #Fantasy #ForestMagic';

    console.log('📋 Configurazione Test:');
    console.log(`   Prompt: "${testPrompt}"`);
    console.log(`   Caption: "${testCaption.substring(0, 50)}..."`);
    console.log('');

    // Esegui la pipeline completa
    const result = await executeDailyPost(
        {
            width: 1024,
            height: 1024,
            steps: 20,  // Meno steps per test più veloce
            cfg: 7,
            sampler: 'euler',
            scheduler: 'normal'
        }
    );

    console.log('\n' + '='.repeat(70));
    console.log('📊 RISULTATI TEST');
    console.log('='.repeat(70));

    if (result.success) {
        console.log('\n✅ PIPELINE COMPLETATA CON SUCCESSO!\n');
        console.log('📝 Dettagli:');
        console.log(`   Prompt originale: ${result.originalPrompt}`);
        console.log(`   Prompt raffinato: ${result.refinedPrompt?.substring(0, 80)}...`);
        console.log(`   URL locale immagine: ${result.localImageUrl}`);
        console.log(`   URL Cloudinary: ${result.cloudinaryUrl}`);
        console.log(`   Instagram Media ID: ${result.instagramMediaId}`);
        console.log(`   Tempo totale: ${result.executionTime}`);
        console.log('');
        console.log('🎨 Impostazioni immagine:');
        console.log(`   Dimensioni: ${result.imageSettings?.width}x${result.imageSettings?.height}`);
        console.log(`   Steps: ${result.imageSettings?.steps}`);
        console.log(`   CFG: ${result.imageSettings?.cfg}`);
        console.log(`   Checkpoint: ${result.imageSettings?.checkpoint}`);
        console.log('');
        console.log('✨ Il post è stato pubblicato con successo su Instagram!');
    } else {
        console.log('\n❌ PIPELINE FALLITA\n');
        console.log('Errore:', result.error);
        console.log('Tempo di esecuzione:', result.executionTime);
        
        if (result.error.includes('GOOGLE_API_KEY')) {
            console.log('\n💡 Suggerimento: Configura GOOGLE_API_KEY in backend/.env');
        } else if (result.error.includes('ComfyUI')) {
            console.log('\n💡 Suggerimento: Assicurati che ComfyUI sia in esecuzione su http://127.0.0.1:8188');
        } else if (result.error.includes('Cloudinary')) {
            console.log('\n💡 Suggerimento: Verifica le credenziali Cloudinary in backend/.env');
        } else if (result.error.includes('Instagram')) {
            console.log('\n💡 Suggerimento: Verifica INSTAGRAM_ACCESS_TOKEN e IG_USER_ID');
        }
    }

    console.log('\n' + '='.repeat(70) + '\n');
}

// Esegui il test
testFullPipeline().catch(error => {
    console.error('❌ Errore critico durante il test:', error);
    process.exit(1);
});
