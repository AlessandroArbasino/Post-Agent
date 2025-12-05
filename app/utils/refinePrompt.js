/**
 * Prompt refinement via Google Gemini
 * Uses Gemini to improve and make prompts more descriptive
 */

const { getGeminiClient } = require('./geminiClient');
const { findEnvVariable } = require('./envUtils');

/**
 * Generates a default prompt using Gemini AI.
 * @param {Object} [params={}] - Optional parameters (currently unused)
 * @returns {Promise<{id: null, prompt: string}>} Object with null id and generated prompt
 */
const getPromptFromDefault = async ({ } = {}) => {
    const result = await getGeminiPrompt({ instruction: findEnvVariable('PROMPT_DEFAULT_INSTRUCTION') });
    //As the db responce
    return { id: null, prompt: result.geminiResponse };
};

/**
 * Refines a user prompt using Gemini AI to make it more descriptive.
 * @param {Object} params - Refinement parameters
 * @param {string} params.prompt - The original prompt to refine
 * @returns {Promise<{success: boolean, geminiResponse: string}>} Refined prompt result
 */
const refinePrompt = async ({ prompt } = {}) => {
    const instruction = `${findEnvVariable('PROMPT_REFINE_INSTRUCTION')} ${prompt}`
    return getGeminiPrompt({ instruction: instruction });
};

/**
 * Generates speech text from a prompt using Gemini AI.
 * @param {Object} params - Generation parameters
 * @param {string} params.prompt - The prompt to generate speech from
 * @returns {Promise<{success: boolean, geminiResponse: string}>} Generated speech text
 */
const generateSpeech = async ({ prompt } = {}) => {
    const instruction = `${findEnvVariable('VIDEO_SPEECH_PROMPT')} ${prompt}`
    return getGeminiPrompt({ instruction: instruction });
};

/**
 * Generates an Instagram caption with hashtags using Gemini AI.
 * @param {Object} params - Caption generation parameters
 * @param {string} params.refinedPrompt - The refined prompt to base the caption on
 * @param {number} params.maxHashtags - Maximum number of hashtags to include
 * @returns {Promise<{success: boolean, geminiResponse: string}>} Generated caption with hashtags
 */
const generateInstagramCaption = async ({ refinedPrompt, maxHashtags } = {}) => {
    const baseInstruction = `${findEnvVariable('PROMPT_CAPTION_INSTRUCTION')} ${refinedPrompt}`;
    const instruction = `${baseInstruction.replace('{N}', String(maxHashtags)).replace('{prompt}', baseInstruction)}`
    return getGeminiPrompt({ instruction: instruction });
};

/**
 * Wrapper function for Gemini prompt generation with error handling.
 * @param {Object} params - Generation parameters
 * @param {string} params.instruction - The instruction/prompt for Gemini
 * @returns {Promise<{success: boolean, geminiResponse: string}>} Gemini response
 * @throws {Error} If Gemini returns an empty response
 */
const getGeminiPrompt = async ({ instruction } = {}) => {
    const text = await geminiGenerateText({ instruction });
    const geminiResponse = (text || '').trim();
    if (!geminiResponse) {
        throw new Error('Empty response from Gemini');
    }

    return { success: true, geminiResponse: geminiResponse };
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

/**
 * Generates text using the Gemini AI model.
 * @param {Object} params - Generation parameters
 * @param {string} params.instruction - The instruction/prompt for text generation
 * @returns {Promise<string>} Generated text from Gemini
 */
async function geminiGenerateText({ instruction }) {
    const genModel = getGeminiClient().getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });
    const result = await genModel.generateContent(instruction);
    return extractTextFromGeminiResult(result);
}

// Initialize the client on module load
getGeminiClient();

module.exports = {
    refinePrompt,
    generateInstagramCaption,
    getPromptFromDefault,
    generateSpeech
};
