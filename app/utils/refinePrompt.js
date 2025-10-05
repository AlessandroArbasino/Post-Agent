/**
 * Raffinamento prompt tramite Google Gemini
 * Utilizza Gemini per migliorare e rendere più descrittivi i prompt
 */

const { getGeminiClient, initializeGeminiClient } = require('./geminiClient');

/**
 * Inizializza il client Gemini con l'API key
 * @returns {boolean} - true se inizializzato con successo
 */
// initializeGeminiClient già fornisce un singleton condiviso

/**
 * Raffina un prompt utilizzando Gemini
 * @param {string} prompt - Prompt originale da raffinare
 * @param {string} model - Modello Gemini da utilizzare (default: gemini-2.0-flash)
 * @returns {Promise<Object>} - Risultato con prompt raffinato
 */
const refinePrompt = async (prompt, model = 'gemini-2.0-flash') => {
    try {
        // Validazione input
        if (!prompt || !prompt.trim()) {
            return {
                success: false,
                error: 'prompt is required'
            };
        }

        // Verifica inizializzazione client condiviso
        if (!getGeminiClient()) {
            const initialized = initializeGeminiClient();
            if (!initialized) {
                return {
                    success: false,
                    error: 'GOOGLE_API_KEY non configurata o client non inizializzato'
                };
            }
        }

        console.log('🤖 Raffinamento prompt con Gemini...');
        console.log(`   Input: ${prompt.substring(0, 100)}...`);

        // Crea il modello
        const genModel = getGeminiClient().getGenerativeModel({ model: model || 'gemini-2.0-flash' });
        // Istruzione per Gemini
        const instruction = `${process.env.PROMPT_REFINE_INSTRUCTION} ${prompt}`;

        // Genera contenuto
        const result = await genModel.generateContent(instruction);

        // Estrai il testo dalla risposta
        const text = result?.response?.text?.() || 
                     result?.response?.candidates?.[0]?.content?.parts?.map(p => p.text).join(' ') || 
                     '';
        
        const refined = (text || '').trim();

        // Validazione output
        if (!refined) {
            return {
                success: false,
                error: 'Risposta vuota da Gemini'
            };
        }

        console.log('✅ Prompt raffinato con successo');
        console.log(`   Output: ${refined.substring(0, 100)}...`);

        return {
            success: true,
            original: prompt,
            refined: refined,
            model: model
        };

    } catch (error) {
        console.error('❌ Errore refinePrompt:', error);
        return {
            success: false,
            error: error?.message || 'Errore durante la chiamata a Gemini (refine)'
        };
    }
};

// Inizializza il client all'avvio del modulo
initializeGeminiClient();

module.exports = {
    refinePrompt,
    initializeGeminiClient
};
