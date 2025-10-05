/**
 * Generazione immagini con Ollama + DeepSeek (Cloud Alternative)
 * Alternativa cloud-ready a ComfyUI per deployment su AWS Lambda
 * 
 * NOTA: Questo file non è integrato nella pipeline principale.
 * È preparato per futura sostituzione di ComfyUI quando si vuole
 * migrare tutto su infrastruttura cloud.
 */

const fetch = require('node-fetch');
const { refinePrompt } = require('./refinePrompt');

/**
 * Configurazione per Ollama + DeepSeek
 */
const OLLAMA_CONFIG = {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    // DeepSeek può essere usato per generazione testo descrittivo
    textModel: process.env.OLLAMA_TEXT_MODEL || 'deepseek-coder',
    // Per immagini, Ollama supporta modelli come stable-diffusion
    imageModel: process.env.OLLAMA_IMAGE_MODEL || 'stable-diffusion',
    timeout: 120000 // 2 minuti
};

/**
 * Alternativa: Usa API esterna per generazione immagini
 * Opzioni cloud-ready:
 * - Stability AI API
 * - Replicate API
 * - HuggingFace Inference API
 * - AWS Bedrock (Stable Diffusion)
 */
const CLOUD_IMAGE_PROVIDERS = {
    stabilityAI: {
        url: 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
        apiKey: process.env.STABILITY_AI_KEY
    },
    replicate: {
        url: 'https://api.replicate.com/v1/predictions',
        apiKey: process.env.REPLICATE_API_TOKEN
    },
    huggingface: {
        url: 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
        apiKey: process.env.HUGGINGFACE_API_KEY
    }
};

/**
 * Genera descrizione dettagliata con Ollama + DeepSeek
 * @param {string} prompt - Prompt originale
 * @returns {Promise<string>} - Prompt arricchito
 */
const enhancePromptWithDeepSeek = async (prompt) => {
    try {
        console.log('🤖 Miglioramento prompt con DeepSeek via Ollama...');
        
        const instruction = `You are an expert prompt engineer for text-to-image AI models. 
Enhance the following prompt to be more detailed, descriptive, and optimized for image generation.
Include details about style, lighting, composition, colors, and atmosphere.
Return ONLY the enhanced prompt, no explanations.

User prompt: ${prompt}`;

        const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_CONFIG.textModel,
                prompt: instruction,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status}`);
        }

        const result = await response.json();
        const enhanced = result.response?.trim() || prompt;
        
        console.log(`✅ Prompt migliorato: ${enhanced.substring(0, 80)}...`);
        return enhanced;

    } catch (error) {
        console.warn('⚠️  Errore DeepSeek enhancement, uso Gemini fallback');
        // Fallback a Gemini se disponibile
        const geminiResult = await refinePrompt(prompt);
        return geminiResult.success ? geminiResult.refined : prompt;
    }
};

/**
 * Genera immagine con Stability AI (Cloud Provider)
 * @param {string} prompt - Prompt raffinato
 * @param {Object} options - Opzioni di generazione
 * @returns {Promise<Object>} - Risultato con immagine base64 o URL
 */
const generateWithStabilityAI = async (prompt, options = {}) => {
    const apiKey = CLOUD_IMAGE_PROVIDERS.stabilityAI.apiKey;
    
    if (!apiKey) {
        throw new Error('STABILITY_AI_KEY non configurata');
    }

    console.log('🎨 Generazione immagine con Stability AI...');

    const response = await fetch(CLOUD_IMAGE_PROVIDERS.stabilityAI.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            text_prompts: [
                {
                    text: prompt,
                    weight: 1
                },
                {
                    text: options.negativePrompt || 'blurry, bad quality, ugly, distorted',
                    weight: -1
                }
            ],
            cfg_scale: options.cfg || 7,
            height: options.height || 1024,
            width: options.width || 1024,
            steps: options.steps || 30,
            samples: 1
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Stability AI error: ${error}`);
    }

    const result = await response.json();
    const imageBase64 = result.artifacts?.[0]?.base64;

    if (!imageBase64) {
        throw new Error('Nessuna immagine restituita da Stability AI');
    }

    console.log('✅ Immagine generata con Stability AI');

    return {
        base64: imageBase64,
        format: 'png'
    };
};

/**
 * Genera immagine con Replicate (Cloud Provider)
 * Supporta vari modelli: SDXL, Flux, etc.
 * @param {string} prompt - Prompt raffinato
 * @param {Object} options - Opzioni di generazione
 * @returns {Promise<Object>} - Risultato con URL immagine
 */
const generateWithReplicate = async (prompt, options = {}) => {
    const apiKey = CLOUD_IMAGE_PROVIDERS.replicate.apiKey;
    
    if (!apiKey) {
        throw new Error('REPLICATE_API_TOKEN non configurata');
    }

    console.log('🎨 Generazione immagine con Replicate...');

    // Crea prediction
    const createResponse = await fetch(CLOUD_IMAGE_PROVIDERS.replicate.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${apiKey}`
        },
        body: JSON.stringify({
            version: options.modelVersion || 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
            input: {
                prompt: prompt,
                negative_prompt: options.negativePrompt || 'blurry, bad quality',
                width: options.width || 1024,
                height: options.height || 1024,
                num_inference_steps: options.steps || 30,
                guidance_scale: options.cfg || 7
            }
        })
    });

    if (!createResponse.ok) {
        const error = await createResponse.text();
        throw new Error(`Replicate create error: ${error}`);
    }

    const prediction = await createResponse.json();
    const predictionId = prediction.id;
    const statusUrl = prediction.urls.get;

    console.log(`⏳ Prediction ID: ${predictionId}, attesa completamento...`);

    // Polling per completamento
    let imageUrl = null;
    const startTime = Date.now();
    const timeout = options.timeout || 120000;

    while (Date.now() - startTime < timeout) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const statusResponse = await fetch(statusUrl, {
            headers: { 'Authorization': `Token ${apiKey}` }
        });

        if (!statusResponse.ok) {
            throw new Error('Errore polling status Replicate');
        }

        const status = await statusResponse.json();

        if (status.status === 'succeeded') {
            imageUrl = status.output?.[0] || status.output;
            break;
        } else if (status.status === 'failed') {
            throw new Error(`Replicate failed: ${status.error}`);
        }

        console.log(`   Status: ${status.status}...`);
    }

    if (!imageUrl) {
        throw new Error('Timeout generazione Replicate');
    }

    console.log('✅ Immagine generata con Replicate');

    return {
        url: imageUrl
    };
};

/**
 * Genera immagine con HuggingFace Inference API
 * @param {string} prompt - Prompt raffinato
 * @param {Object} options - Opzioni di generazione
 * @returns {Promise<Object>} - Risultato con blob immagine
 */
const generateWithHuggingFace = async (prompt, options = {}) => {
    const apiKey = CLOUD_IMAGE_PROVIDERS.huggingface.apiKey;
    
    if (!apiKey) {
        throw new Error('HUGGINGFACE_API_KEY non configurata');
    }

    console.log('🎨 Generazione immagine con HuggingFace...');

    const response = await fetch(CLOUD_IMAGE_PROVIDERS.huggingface.url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            inputs: prompt,
            parameters: {
                negative_prompt: options.negativePrompt || 'blurry, bad quality',
                num_inference_steps: options.steps || 30,
                guidance_scale: options.cfg || 7
            }
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`HuggingFace error: ${error}`);
    }

    const imageBlob = await response.buffer();
    const base64 = imageBlob.toString('base64');

    console.log('✅ Immagine generata con HuggingFace');

    return {
        base64: base64,
        format: 'png',
        blob: imageBlob
    };
};

/**
 * FUNZIONE PRINCIPALE: Genera immagine usando provider cloud
 * Questa funzione può sostituire generateImage.js nella pipeline
 * 
 * @param {string} prompt - Prompt originale
 * @param {Object} options - Opzioni di generazione
 * @returns {Promise<Object>} - Risultato completo
 */
const generateImageCloud = async (prompt, options = {}) => {
    const startTime = Date.now();

    try {
        console.log('\n🌐 GENERAZIONE IMMAGINE CLOUD');
        console.log('='.repeat(60));

        // Validazione input
        if (!prompt || !prompt.trim()) {
            return {
                success: false,
                error: 'Prompt is required'
            };
        }

        console.log(`📝 Prompt originale: ${prompt}`);

        // Step 1: Migliora il prompt
        console.log('\n🤖 FASE 1: Miglioramento prompt');
        const useGemini = options.useGemini !== false; // Default true
        
        let refinedPrompt;
        if (useGemini) {
            const geminiResult = await refinePrompt(prompt);
            refinedPrompt = geminiResult.success ? geminiResult.refined : prompt;
        } else {
            refinedPrompt = await enhancePromptWithDeepSeek(prompt);
        }

        console.log(`✅ Prompt raffinato: ${refinedPrompt.substring(0, 80)}...`);

        // Step 2: Genera immagine con provider selezionato
        console.log('\n🎨 FASE 2: Generazione immagine');
        const provider = options.provider || 'replicate'; // Default: Replicate (free tier disponibile)
        
        let imageResult;
        
        switch (provider) {
            case 'stability':
                imageResult = await generateWithStabilityAI(refinedPrompt, options);
                break;
            
            case 'replicate':
                imageResult = await generateWithReplicate(refinedPrompt, options);
                break;
            
            case 'huggingface':
                imageResult = await generateWithHuggingFace(refinedPrompt, options);
                break;
            
            default:
                throw new Error(`Provider non supportato: ${provider}`);
        }

        const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('\n' + '='.repeat(60));
        console.log('✅ GENERAZIONE CLOUD COMPLETATA');
        console.log(`⏱️  Tempo totale: ${executionTime}s`);
        console.log(`☁️  Provider: ${provider}`);
        console.log('='.repeat(60) + '\n');

        return {
            success: true,
            originalPrompt: prompt,
            refinedPrompt: refinedPrompt,
            imageUrl: imageResult.url,
            imageBase64: imageResult.base64,
            imageBlob: imageResult.blob,
            format: imageResult.format || 'png',
            provider: provider,
            executionTime: `${executionTime}s`,
            settings: {
                width: options.width || 1024,
                height: options.height || 1024,
                steps: options.steps || 30,
                cfg: options.cfg || 7,
                model: options.modelVersion || 'default'
            }
        };

    } catch (error) {
        const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);

        console.error('\n' + '='.repeat(60));
        console.error('❌ ERRORE GENERAZIONE CLOUD');
        console.error(`⏱️  Tempo di esecuzione: ${executionTime}s`);
        console.error('Errore:', error.message);
        console.error('='.repeat(60) + '\n');

        return {
            success: false,
            error: error.message,
            executionTime: `${executionTime}s`
        };
    }
};

/**
 * Helper: Converte base64 in Buffer per upload
 * @param {string} base64Data - Dati base64
 * @returns {Buffer} - Buffer dell'immagine
 */
const base64ToBuffer = (base64Data) => {
    return Buffer.from(base64Data, 'base64');
};

/**
 * Helper: Salva immagine base64 come file temporaneo
 * @param {string} base64Data - Dati base64
 * @param {string} filename - Nome file (opzionale)
 * @returns {string} - Path del file salvato
 */
const saveBase64ToFile = async (base64Data, filename = 'temp_image.png') => {
    const fs = require('fs').promises;
    const path = require('path');
    const os = require('os');
    
    const tempDir = os.tmpdir();
    const filepath = path.join(tempDir, filename);
    
    const buffer = base64ToBuffer(base64Data);
    await fs.writeFile(filepath, buffer);
    
    return filepath;
};

module.exports = {
    generateImageCloud,
    generateWithStabilityAI,
    generateWithReplicate,
    generateWithHuggingFace,
    enhancePromptWithDeepSeek,
    base64ToBuffer,
    saveBase64ToFile,
    OLLAMA_CONFIG,
    CLOUD_IMAGE_PROVIDERS
};
