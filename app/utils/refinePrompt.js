/**
 * Prompt refinement via Google Gemini
 * Uses Gemini to improve and make prompts more descriptive
 */

const { getGeminiClient, initializeGeminiClient } = require('./geminiClient');

/**
 * Initialize the Gemini client with the API key
 * @returns {boolean} - true if initialized successfully
 */
// initializeGeminiClient already provides a shared singleton

/**
 * Refine a prompt using Gemini
 * @param {string} prompt - Original prompt to refine
 * @param {string} model - Gemini model to use (default: gemini-2.0-flash)
 * @returns {Promise<Object>} - Result with refined prompt
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

        console.log('🤖 Refining prompt with Gemini...');
        console.log(`   Input: ${prompt.substring(0, 100)}...`);

        // Instruction for Gemini
        const instruction = `${process.env.PROMPT_REFINE_INSTRUCTION} ${prompt}`;

        // Unified call to Gemini
        const text = await geminiGenerateText({ instruction, model });
        
        const refined = (text || '').trim();

        // Output validation
        if (!refined) {
            return {
                success: false,
                error: 'Empty response from Gemini'
            };
        }

        console.log('✅ Prompt refined successfully');
        console.log(`   Output: ${refined.substring(0, 100)}...`);

        return {
            success: true,
            original: prompt,
            refined: refined,
            model: model
        };

    } catch (error) {
        console.error('❌ refinePrompt error:', error);
        return {
            success: false,
            error: error?.message || 'Error during Gemini call (refine)'
        };
    }
};

const getPromptFromDefault = async ({ model = 'gemini-2.0-flash' } = {}) => {
    try {
        console.log('🧠 Direct Gemini call with default prompt...');

        const text = await geminiGenerateText({ instruction: process.env.PROMPT_DEFAULT_INSTRUCTION, model });
        const response = (text || '').trim();

        if (!response) {
            return { success: false, error: 'Empty response from Gemini (default prompt)' };
        }

        console.log('✅ Response obtained from Gemini');
        console.log(`   Output: ${response.substring(0, 100)}...`);

       return {
            success: true,
            id : null,
            prompt: response,
            model: model
        };
    } catch (error) {
        console.error('❌ callGeminiWithDefaultPrompt error:', error);
        return { success: false, error: error?.message || 'Error during Gemini call (default prompt)' };
    }
};

/**
 * Helper: extract text from a Gemini response in a resilient way
 * @param {any} result
 * @returns {string}
 */
function extractTextFromGeminiResult(result) {
    return (
        result?.response?.text?.() ||
        (Array.isArray(result?.response?.candidates)
            ? (result.response.candidates[0]?.content?.parts || [])
                .map(p => (typeof p?.text === 'string' ? p.text : ''))
                .join(' ')
            : '') ||
        ''
    );
}

async function geminiGenerateText({ instruction, model = 'gemini-2.0-flash' }) {
    // Initialize shared client
    if (!getGeminiClient()) {
        const initialized = initializeGeminiClient();
        if (!initialized) {
            throw new Error('GOOGLE_API_KEY not configured or client not initialized');
        }
    }

    const genModel = getGeminiClient().getGenerativeModel({ model: model || 'gemini-2.0-flash' });
    const result = await genModel.generateContent(instruction);
    return extractTextFromGeminiResult(result);
}

/**
 * Generate an Instagram caption starting from an already refined prompt,
 * adding up to N hashtags (parametric).
 * Reuses the same Gemini call logic as in refinePrompt.
 *
 * @param {string} refinedPrompt - Already refined prompt to derive the caption from
 * @param {Object} options
 * @param {number} [options.maxHashtags=5] - Maximum number of hashtags to include
 * @param {string} [options.model='gemini-2.0-flash'] - Model to use
 * @returns {Promise<{success:boolean, caption?:string, model?:string, error?:string}>}
 */
const generateInstagramCaption = async (refinedPrompt, { maxHashtags = 5, model = 'gemini-2.0-flash' } = {}) => {
    try {
        // Input validation
        if (!refinedPrompt || !refinedPrompt.trim()) {
            throw new Error('refinedPrompt is required');
        }

        console.log('📝 Generating Instagram caption with Gemini...');
        console.log(`   Input (refined prompt): ${refinedPrompt.substring(0, 100)}...`);

        // Instruction: use ENV if provided, otherwise sensible fallback
        const baseInstruction = process.env.PROMPT_CAPTION_INSTRUCTION

        const instruction = `${baseInstruction.replace('{N}', String(maxHashtags)).replace('{prompt}', refinedPrompt)}`;

        // Unified call to Gemini
        const captionRaw = await geminiGenerateText({ instruction, model });
        const caption = (captionRaw || '').trim();

        if (!caption) {
            return { success: false, error: 'Empty response from Gemini (caption)' };
        }

        console.log('✅ Caption generated successfully');
        console.log(`   Output: ${caption.substring(0, 100)}...`);

        return { success: true, caption, model };
    } catch (error) {
        console.error('❌ generateInstagramCaption error:', error);
        throw new Error(error?.message || 'Error during Gemini call (caption)');
    }
};

// Initialize the client on module load
initializeGeminiClient();

module.exports = {
    refinePrompt,
    initializeGeminiClient,
    generateInstagramCaption,
    getPromptFromDefault
};
