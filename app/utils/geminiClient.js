/**
 * Utilità per inizializzare e condividere il client Gemini e l'API key
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');

let geminiClient = null;

/**
 * Restituisce la Google API Key o stringa vuota se mancante
 */
const getGoogleApiKey = () => {
  return process.env.GOOGLE_API_KEY || config.google.apiKey || '';
};

/**
 * Inizializza e restituisce un singleton di GoogleGenerativeAI
 */
const initializeGeminiClient = () => {
  const apiKey = getGoogleApiKey();
  if (!apiKey) {
    console.warn('⚠️  GOOGLE_API_KEY non configurata');
    return false;
  }
  try {
    geminiClient = new GoogleGenerativeAI(apiKey);
    console.log('✅ Client Gemini inizializzato');
    return true;
  } catch (err) {
    console.error('❌ Errore inizializzazione Gemini:', err?.message || err);
    return false;
  }
};

/**
 * Ritorna il client esistente o prova ad inizializzarlo
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
