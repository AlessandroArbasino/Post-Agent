/**
 * Esempio di utilizzo della funzione refinePrompt
 * 
 * Esegui con: node examples/testRefinePrompt.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { refinePrompt } = require('../utils/refinePrompt');

async function testRefine() {
    console.log('\n🧪 TEST: Raffinamento Prompt con Gemini\n');
    console.log('='.repeat(60) + '\n');

    // Test 1: Prompt semplice
    const test1 = await refinePrompt('un gatto che gioca con una palla');
    console.log('📝 Test 1 - Prompt semplice:');
    console.log(`   Input:  "${test1.original || 'un gatto che gioca con una palla'}"`);
    if (test1.success) {
        console.log(`   Output: "${test1.refined}"`);
        console.log(`   Modello: ${test1.model}`);
    } else {
        console.log(`   ❌ Errore: ${test1.error}`);
    }
    console.log('');

    // Test 2: Prompt complesso
    const test2 = await refinePrompt('voglio un paesaggio futuristico con città volanti');
    console.log('📝 Test 2 - Prompt complesso:');
    console.log(`   Input:  "${test2.original || 'voglio un paesaggio futuristico con città volanti'}"`);
    if (test2.success) {
        console.log(`   Output: "${test2.refined}"`);
        console.log(`   Modello: ${test2.model}`);
    } else {
        console.log(`   ❌ Errore: ${test2.error}`);
    }
    console.log('');

    // Test 3: Prompt vuoto (deve fallire)
    const test3 = await refinePrompt('');
    console.log('📝 Test 3 - Prompt vuoto (deve fallire):');
    console.log(`   Input:  ""`);
    if (!test3.success) {
        console.log(`   ✅ Fallito come previsto: ${test3.error}`);
    } else {
        console.log(`   ❌ Non dovrebbe avere successo!`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completati\n');
}

// Esegui i test
testRefine().catch(error => {
    console.error('❌ Errore durante i test:', error);
    process.exit(1);
});
