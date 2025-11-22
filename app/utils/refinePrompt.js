/**
 * Prompt refinement via Google Gemini
 * Uses Gemini to improve and make prompts more descriptive
 */

const { getGeminiClient } = require('./geminiClient');
const { findEnvVariable } = require('./envUtils');

const getPromptFromDefault = async ({ } = {}) => {
    const result = await getGeminiPrompt({instruction:findEnvVariable('PROMPT_DEFAULT_INSTRUCTION')});
    //As the db responce
    return {id: null,prompt: result.geminiResponse};
};

const refinePrompt = async ({prompt } = {}) => {
    const instruction = `${findEnvVariable('PROMPT_REFINE_INSTRUCTION')} ${prompt}`
    return getGeminiPrompt({instruction:instruction});
};

const generateSpeech = async ({prompt } = {}) => {
    const instruction = `${findEnvVariable('VIDEO_SPEECH_PROMPT')} ${prompt}`
    return getGeminiPrompt({instruction:instruction});
};

const generateInstagramCaption = async ({refinedPrompt, maxHashtags } = {}) => {
    const baseInstruction = `${findEnvVariable('PROMPT_CAPTION_INSTRUCTION')} ${refinedPrompt}`;
    const instruction = `${baseInstruction.replace('{N}', String(maxHashtags)).replace('{prompt}', baseInstruction)}`
    return getGeminiPrompt({ instruction:instruction});
};

const getGeminiPrompt = async ({instruction} = {}) => {
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
