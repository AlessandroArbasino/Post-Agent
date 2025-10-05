/**
 * Test della funzione generateImage
 * 
 * PREREQUISITI:
 * - ComfyUI deve essere in esecuzione su http://127.0.0.1:8188
 * - Un checkpoint deve essere presente in ComfyUI/models/checkpoints
 * - GOOGLE_API_KEY deve essere configurata in .env
 * 
 * Esegui con: node examples/testGenerateImage.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { generateImage } = require('../utils/generateImage');

async function testImageGeneration() {
    console.log('\n🧪 TEST: Generazione Immagine con ComfyUI\n');
    console.log('='.repeat(60) + '\n');

    // Test 1: Generazione base con prompt semplice
    console.log('📝 Test 1 - Generazione base:');
    const test1 = await generateImage('un gatto cyberpunk in una città futuristica');
    
    if (test1.success) {
        console.log('\n✅ Test 1 completato con successo!');
        console.log(`   Prompt originale: ${test1.originalPrompt}`);
        console.log(`   Prompt raffinato: ${test1.refinedPrompt.substring(0, 100)}...`);
        console.log(`   URL immagine: ${test1.imageUrl}`);
        console.log(`   Tempo di esecuzione: ${test1.executionTime}`);
        console.log(`   Checkpoint: ${test1.settings.checkpoint}`);
    } else {
        console.log(`\n❌ Test 1 fallito: ${test1.error}`);
    }

    console.log('\n' + '-'.repeat(60) + '\n');

    // Test 2: Generazione con opzioni personalizzate
    console.log('📝 Test 2 - Generazione con opzioni personalizzate:');
    const test2 = await generateImage(
        'una foresta magica con alberi bioluminescenti',
        {
            width: 512,
            height: 768,
            steps: 20,
            cfg: 8.5,
            sampler: 'euler_ancestral',
            scheduler: 'karras',
            negativePrompt: 'blurry, low quality, ugly'
        }
    );
    
    if (test2.success) {
        console.log('\n✅ Test 2 completato con successo!');
        console.log(`   Dimensioni: ${test2.settings.width}x${test2.settings.height}`);
        console.log(`   Steps: ${test2.settings.steps}, CFG: ${test2.settings.cfg}`);
        console.log(`   URL immagine: ${test2.imageUrl}`);
        console.log(`   Tempo di esecuzione: ${test2.executionTime}`);
    } else {
        console.log(`\n❌ Test 2 fallito: ${test2.error}`);
    }

    console.log('\n' + '-'.repeat(60) + '\n');

    // Test 3: Generazione con prompt vuoto (deve fallire)
    console.log('📝 Test 3 - Prompt vuoto (deve fallire):');
    const test3 = await generateImage('');
    
    if (!test3.success) {
        console.log(`\n✅ Test 3 fallito come previsto: ${test3.error}`);
    } else {
        console.log('\n❌ Test 3 non dovrebbe avere successo!');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Tutti i test completati\n');
    
    console.log('💡 Note:');
    console.log('   - Le immagini sono salvate in ComfyUI/output/');
    console.log('   - Puoi visualizzare le immagini aprendo gli URL nel browser');
    console.log('   - Assicurati che ComfyUI sia in esecuzione prima di eseguire i test\n');
}

// Esegui i test
testImageGeneration().catch(error => {
    console.error('❌ Errore durante i test:', error);
    process.exit(1);
});
