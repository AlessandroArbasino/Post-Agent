/**
 * Test generazione immagini con provider cloud (alternativa a ComfyUI)
 * 
 * PROVIDER SUPPORTATI:
 * - Stability AI (richiede STABILITY_AI_KEY)
 * - Replicate (richiede REPLICATE_API_TOKEN) ⭐ Consigliato: ha free tier
 * - HuggingFace (richiede HUGGINGFACE_API_KEY)
 * 
 * NOTA: Questo è preparato per deployment AWS Lambda - tutto cloud, no dipendenze locali
 * 
 * Esegui con: node examples/testCloudGeneration.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { generateImageCloud } = require('../utils/generateImageOllama');

async function testCloudGeneration() {
    console.log('\n🧪 TEST: Generazione Immagini Cloud (AWS-Ready)\n');
    console.log('='.repeat(70) + '\n');

    // Test 1: Replicate (consigliato per AWS - ha free tier)
    console.log('📝 Test 1 - Replicate API (consigliato):');
    const test1 = await generateImageCloud(
        'a serene japanese garden with cherry blossoms and koi pond',
        {
            provider: 'replicate',
            width: 1024,
            height: 1024,
            steps: 25,
            cfg: 7,
            useGemini: true // Usa Gemini per raffinare il prompt
        }
    );

    if (test1.success) {
        console.log('\n✅ Test 1 completato!');
        console.log(`   Provider: ${test1.provider}`);
        console.log(`   Prompt originale: ${test1.originalPrompt}`);
        console.log(`   Prompt raffinato: ${test1.refinedPrompt.substring(0, 80)}...`);
        console.log(`   URL immagine: ${test1.imageUrl}`);
        console.log(`   Tempo: ${test1.executionTime}`);
        console.log(`   Dimensioni: ${test1.settings.width}x${test1.settings.height}`);
    } else {
        console.log(`\n❌ Test 1 fallito: ${test1.error}`);
        if (test1.error.includes('REPLICATE_API_TOKEN')) {
            console.log('\n💡 Setup Replicate:');
            console.log('   1. Vai su https://replicate.com');
            console.log('   2. Crea account (free tier disponibile)');
            console.log('   3. Ottieni API token da https://replicate.com/account/api-tokens');
            console.log('   4. Aggiungi REPLICATE_API_TOKEN=your_token in backend/.env');
        }
    }

    console.log('\n' + '-'.repeat(70) + '\n');

    // Test 2: HuggingFace (alternativa gratuita)
    console.log('📝 Test 2 - HuggingFace Inference API:');
    const test2 = await generateImageCloud(
        'a cyberpunk street at night with neon signs',
        {
            provider: 'huggingface',
            steps: 20,
            cfg: 8,
            useGemini: false // Usa DeepSeek via Ollama (se disponibile)
        }
    );

    if (test2.success) {
        console.log('\n✅ Test 2 completato!');
        console.log(`   Provider: ${test2.provider}`);
        console.log(`   Formato: ${test2.format}`);
        console.log(`   Base64 length: ${test2.imageBase64?.length || 0} chars`);
        console.log(`   Tempo: ${test2.executionTime}`);
        
        if (test2.imageBase64) {
            console.log('\n💡 Immagine disponibile come base64, pronta per upload su Cloudinary');
        }
    } else {
        console.log(`\n❌ Test 2 fallito: ${test2.error}`);
        if (test2.error.includes('HUGGINGFACE_API_KEY')) {
            console.log('\n💡 Setup HuggingFace:');
            console.log('   1. Vai su https://huggingface.co');
            console.log('   2. Crea account gratuito');
            console.log('   3. Genera token da https://huggingface.co/settings/tokens');
            console.log('   4. Aggiungi HUGGINGFACE_API_KEY=your_token in backend/.env');
        }
    }

    console.log('\n' + '-'.repeat(70) + '\n');

    // Test 3: Stability AI (più professionale, a pagamento)
    console.log('📝 Test 3 - Stability AI (opzionale, a pagamento):');
    const test3 = await generateImageCloud(
        'a majestic mountain landscape at golden hour',
        {
            provider: 'stability',
            width: 1024,
            height: 1024,
            steps: 30,
            cfg: 7.5,
            negativePrompt: 'blurry, low quality, distorted'
        }
    );

    if (test3.success) {
        console.log('\n✅ Test 3 completato!');
        console.log(`   Provider: ${test3.provider}`);
        console.log(`   Base64 disponibile: ${!!test3.imageBase64}`);
        console.log(`   Tempo: ${test3.executionTime}`);
    } else {
        console.log(`\n❌ Test 3 fallito: ${test3.error}`);
        if (test3.error.includes('STABILITY_AI_KEY')) {
            console.log('\n💡 Setup Stability AI:');
            console.log('   1. Vai su https://platform.stability.ai');
            console.log('   2. Crea account (richiede carta di credito)');
            console.log('   3. Ottieni API key');
            console.log('   4. Aggiungi STABILITY_AI_KEY=your_key in backend/.env');
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 RIEPILOGO TEST CLOUD GENERATION');
    console.log('='.repeat(70));
    console.log('\n🌐 DEPLOYMENT AWS LAMBDA:');
    console.log('   ✅ Nessuna dipendenza GPU locale richiesta');
    console.log('   ✅ Tutto funziona via API REST');
    console.log('   ✅ Scalabile automaticamente');
    console.log('   ✅ Costi solo per utilizzo effettivo');
    
    console.log('\n💰 CONSIGLIO PER AWS:');
    console.log('   🥇 Replicate - Free tier + pay-as-you-go');
    console.log('   🥈 HuggingFace - Gratuito (con rate limits)');
    console.log('   🥉 Stability AI - Qualità migliore ma a pagamento');
    
    console.log('\n📦 PROSSIMI PASSI:');
    console.log('   1. Scegli un provider e configura le API keys');
    console.log('   2. Testa la generazione con questo script');
    console.log('   3. Modifica handlers/postHandler.js per usare generateImageCloud');
    console.log('   4. Deploy su AWS Lambda senza dipendenze da ComfyUI locale');
    
    console.log('\n' + '='.repeat(70) + '\n');
}

// Esegui i test
testCloudGeneration().catch(error => {
    console.error('❌ Errore critico durante i test:', error);
    process.exit(1);
});
