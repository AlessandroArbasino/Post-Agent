/**
 * Prompt refinement via Google Gemini
 * Uses Gemini to improve and make prompts more descriptive
 */

const { getGeminiClient } = require('./geminiClient');
const { findEnvVariable } = require('./envUtils');

const getPromptFromDefault = async ({ } = {}) => {
    const result = await getGeminiPrompt({});
    //As the db responce
    return {id: null,prompt: result.geminiResponse};
};

const refinePrompt = async ({prompt } = {}) => {
    return getGeminiPrompt({prompt:prompt});
};

const generateInstagramCaption = async ({refinedPrompt, maxHashtags } = {}) => {
    return getGeminiPrompt({prompt: refinedPrompt, maxHashtags:maxHashtags});
};

const getGeminiPrompt = async ({prompt=null, maxHashtags = null} = {}) => {
    let instruction;
    if(!prompt){
        instruction = findEnvVariable('PROMPT_DEFAULT_INSTRUCTION');
    }
    else{
       let baseInstruction = maxHashtags ? `${findEnvVariable('PROMPT_CAPTION_INSTRUCTION')} ${prompt}` : `${findEnvVariable('PROMPT_REFINE_INSTRUCTION')} ${prompt}`;
       instruction = maxHashtags ? `${baseInstruction.replace('{N}', String(maxHashtags)).replace('{prompt}', prompt)}`: `${findEnvVariable('PROMPT_REFINE_INSTRUCTION')} ${prompt}`;
    }
    const text = await geminiGenerateText({ instruction });
    const geminiResponse = (text || '').trim();
    if (!geminiResponse) {
        throw new Error('Empty response from Gemini');
    }

    console.log('✅ Prompt refined successfully');

     return { success: true, original: prompt, geminiResponse: geminiResponse };
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
    getPromptFromDefault
};
