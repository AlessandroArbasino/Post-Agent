/**
 * Utilities to initialize and share the Gemini client and API key
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

let geminiClient = null;

/**
 * Returns the Google API Key or empty string if missing
 */
const getGoogleApiKey = () => {
  return process.env.GOOGLE_API_KEY || '';
};

/**
 * Initialize and return a singleton of GoogleGenerativeAI
 */
const initializeGeminiClient = () => {
  const apiKey = getGoogleApiKey();
  if (!apiKey) {
    console.warn('⚠️  GOOGLE_API_KEY not configured');
    return false;
  }
  try {
    geminiClient = new GoogleGenerativeAI(apiKey);
    console.log('✅ Gemini client initialized');
    return true;
  } catch (err) {
    throw new Error('❌ Gemini initialization error:', err?.message || err);
  }
};

/**
 * Return the existing client or attempt to initialize it
 */
const getGeminiClient = () => {
  if (geminiClient) return geminiClient;
  const ok = initializeGeminiClient();
  return ok ? geminiClient : null;
};

module.exports = {
  getGoogleApiKey,
  initializeGeminiClient,
  getGeminiClient,
};
