/**
 * Generazione immagini con ComfyUI
 * Raffina il prompt con Gemini e genera l'immagine usando ComfyUI
 */

const fetch = require('node-fetch');
const { getGoogleApiKey } = require('./geminiClient');
const { getGeminiClient } = require('./geminiClient');
const { GoogleGenAI,PersonGeneration } = require('@google/genai');

/**
 * Crea il grafo ComfyUI per text-to-image
 * @param {string} refinedPrompt - Prompt positivo raffinato
 * @param {Object} options - Opzioni di generazione
 * @returns {Object} - Grafo ComfyUI
 */
const createComfyUIGraph = (refinedPrompt, options = {}) => {
    const {
        ckptName = 'sd_xl_base_1.0.safetensors',
        width = 1024,
        height = 1024,
        steps = 28,
        cfg = 7,
        samplerName = 'euler',
        scheduler = 'normal',
        negativePrompt = '',
        seed = Math.floor(Math.random() * 1e15)
    } = options;

    return {
        // Load checkpoint
        '1': {
            'class_type': 'CheckpointLoaderSimple',
            'inputs': { 'ckpt_name': ckptName }
        },
        // Positive prompt
        '2': {
            'class_type': 'CLIPTextEncode',
            'inputs': { 'text': refinedPrompt, 'clip': ['1', 1] }
        },
        // Negative prompt
        '3': {
            'class_type': 'CLIPTextEncode',
            'inputs': { 'text': negativePrompt, 'clip': ['1', 1] }
        },
        // Create empty latent
        '4': {
            'class_type': 'EmptyLatentImage',
            'inputs': { 'width': width, 'height': height, 'batch_size': 1 }
        },
        // KSampler
        '5': {
            'class_type': 'KSampler',
            'inputs': {
                'seed': seed,
                'steps': steps,
                'cfg': cfg,
                'sampler_name': samplerName,
                'scheduler': scheduler,
                'denoise': 1,
                'model': ['1', 0],
                'positive': ['2', 0],
                'negative': ['3', 0],
                'latent_image': ['4', 0]
            }
        },
        // Decode
        '6': {
            'class_type': 'VAEDecode',
            'inputs': { 'samples': ['5', 0], 'vae': ['1', 2] }
        },
        // Save image
        '7': {
            'class_type': 'SaveImage',
            'inputs': { 'images': ['6', 0], 'filename_prefix': 'ai_app' }
        }
    };
};

/**
 * Valida il checkpoint contro i modelli disponibili in ComfyUI
 * @param {string} comfyUIBaseUrl - URL base di ComfyUI
 * @param {string} ckptName - Nome del checkpoint richiesto
 * @returns {Promise<string>} - Nome del checkpoint validato
 */
const validateCheckpoint = async (comfyUIBaseUrl, ckptName) => {
    try {
        const response = await fetch(`${comfyUIBaseUrl}/object_info`);
        if (!response.ok) {
            console.warn('⚠️  Impossibile validare checkpoint, uso quello fornito');
            return ckptName;
        }

        const info = await response.json();
        const loaderInfo = info?.CheckpointLoaderSimple;
        const choices = loaderInfo?.input?.required?.ckpt_name?.[0] || [];

        if (Array.isArray(choices)) {
            if (choices.length === 0) {
                throw new Error('Nessun checkpoint disponibile in ComfyUI. Carica un modello in ComfyUI/models/checkpoints');
            }
            
            if (!choices.includes(ckptName)) {
                console.log(`⚠️  Checkpoint "${ckptName}" non trovato, uso "${choices[0]}"`);
                return choices[0];
            }
        }

        console.log(`✅ Checkpoint validato: ${ckptName}`);
        return ckptName;

    } catch (error) {
        console.warn('⚠️  Errore validazione checkpoint:', error.message);
        return ckptName;
    }
};

/**
 * Attende che ComfyUI completi la generazione dell'immagine
 * @param {string} comfyUIBaseUrl - URL base di ComfyUI
 * @param {string} promptId - ID del prompt ComfyUI
 * @param {number} timeoutMs - Timeout in millisecondi
 * @returns {Promise<string>} - URL dell'immagine generata
 */
const pollComfyUIHistory = async (comfyUIBaseUrl, promptId, timeoutMs = 90000) => {
    const startedAt = Date.now();
    
    while (true) {
        // Controllo timeout
        if (Date.now() - startedAt > timeoutMs) {
            throw new Error('Timeout generazione immagine con ComfyUI');
        }

        // Attesa prima del prossimo poll
        await new Promise(resolve => setTimeout(resolve, 1200));

        // Richiesta stato
        const historyResponse = await fetch(`${comfyUIBaseUrl}/history/${promptId}`);
        if (!historyResponse.ok) {
            const errorText = await historyResponse.text();
            throw new Error(`Errore polling ComfyUI history: ${errorText}`);
        }

        const historyJson = await historyResponse.json();
        const item = historyJson[promptId];

        if (!item) continue; // Non ancora pronto

        // Cerca l'immagine negli output
        const nodeOutputs = item?.outputs || {};
        for (const key of Object.keys(nodeOutputs)) {
            const output = nodeOutputs[key];
            if (output?.images && Array.isArray(output.images) && output.images.length > 0) {
                const found = output.images[0];
                const file = found.filename;
                const subfolder = encodeURIComponent(found.subfolder || '');
                const type = encodeURIComponent(found.type || 'output');
                const imageUrl = `${comfyUIBaseUrl}/view?filename=${encodeURIComponent(file)}&subfolder=${subfolder}&type=${type}`;
                
                console.log(`✅ Immagine generata: ${imageUrl}`);
                return imageUrl;
            }
        }
    }
};

/**
 * Genera un'immagine con ComfyUI partendo da un prompt
 * @param {string} prompt - Prompt originale dall'utente
 * @param {Object} options - Opzioni di generazione
 * @returns {Promise<Object>} - Risultato con prompt raffinato e URL immagine
 */
const generateImage = async (prompt, options = {}) => {
    const startTime = Date.now();

    try {
        console.log('\n🎨 GENERAZIONE IMMAGINE CON COMFYUI');
        console.log('='.repeat(60));

        // Validazione input
        if (!prompt || !prompt.trim()) {
            return {
                success: false,
                error: 'Prompt is required'
            };
        }

        // Configurazione ComfyUI
        const COMFYUI_BASE_URL = process.env.COMFYUI_BASE_URL || 'http://127.0.0.1:8188';
        const DEFAULT_CKPT = process.env.COMFYUI_CKPT_NAME || 'sd_xl_base_1.0.safetensors';

        console.log(`📝 Prompt originale: ${prompt}`);
        console.log(`🖥️  ComfyUI URL: ${COMFYUI_BASE_URL}`);


        // Step 2: Valida checkpoint
        console.log('\n🔍 FASE 2: Validazione checkpoint');
        const ckptName = await validateCheckpoint(
            COMFYUI_BASE_URL,
            options.ckpt || DEFAULT_CKPT
        );

        // Step 3: Crea il grafo ComfyUI
        console.log('\n🎨 FASE 3: Creazione grafo ComfyUI');
        const clientId = `client_${Math.random().toString(36).slice(2)}`;
        const graph = createComfyUIGraph(prompt, {
            ckptName,
            width: options.width || 1024,
            height: options.height || 1024,
            steps: options.steps || 28,
            cfg: options.cfg || 7,
            samplerName: options.sampler || 'euler',
            scheduler: options.scheduler || 'normal',
            negativePrompt: options.negativePrompt || '',
            seed: options.seed
        });

        console.log(`   Dimensioni: ${options.width || 1024}x${options.height || 1024}`);
        console.log(`   Steps: ${options.steps || 28}, CFG: ${options.cfg || 7}`);
        console.log(`   Sampler: ${options.sampler || 'euler'}, Scheduler: ${options.scheduler || 'normal'}`);

        // Step 4: Invia il grafo a ComfyUI
        console.log('\n📤 FASE 4: Invio grafo a ComfyUI');
        const submitResponse = await fetch(`${COMFYUI_BASE_URL}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: graph, client_id: clientId })
        });

        if (!submitResponse.ok) {
            const errorText = await submitResponse.text();
            throw new Error(`Errore submit ComfyUI: ${errorText}`);
        }

        const submitJson = await submitResponse.json();
        const promptId = submitJson.prompt_id || submitJson?.promptId;

        if (!promptId) {
            throw new Error('Risposta ComfyUI non valida: manca prompt_id');
        }

        console.log(`✅ Prompt ID: ${promptId}`);

        // Step 5: Attendi generazione
        console.log('\n⏳ FASE 5: Attesa generazione immagine...');
        const imageUrl = await pollComfyUIHistory(
            COMFYUI_BASE_URL,
            promptId,
            options.timeout || 90000
        );

        const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('\n' + '='.repeat(60));
        console.log('✅ GENERAZIONE COMPLETATA');
        console.log(`⏱️  Tempo totale: ${executionTime}s`);
        console.log('='.repeat(60) + '\n');

        return {
            success: true,
            prompt: prompt,
            imageUrl,
            executionTime: `${executionTime}s`,
            settings: {
                width: options.width || 1024,
                height: options.height || 1024,
                steps: options.steps || 28,
                cfg: options.cfg || 7,
                sampler: options.sampler || 'euler',
                scheduler: options.scheduler || 'normal',
                checkpoint: ckptName
            }
        };

    } catch (error) {
        const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.error('\n' + '='.repeat(60));
        console.error('❌ ERRORE GENERAZIONE IMMAGINE');
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

const generateGeminiImage = async (prompt, options = {}) => {
    const startTime = Date.now();
    try {
        // Validazione input
        if (!prompt || !prompt.trim()) {
            return { success: false, error: 'Prompt is required' };
        }

        const API_KEY = getGoogleApiKey();
        if (!API_KEY) {
            return { success: false, error: 'GOOGLE_API_KEY non configurata' };
        }

        // Parametri Imagen
        const numberOfImages = 1;
        const outputMimeType = options.outputMimeType || 'image/jpeg';
        const aspectRatio = options.aspectRatio || '1:1';
        const personGeneration = options.personGeneration || 'allow_adult';

        const ai = new GoogleGenAI({
            apiKey: API_KEY
        })
        
    const response = await ai.models.generateImages({
        model: 'models/imagen-3.0-generate-002',
        prompt: { text: `${prompt}` },
        config: {
        numberOfImages,
        outputMimeType,
        personGeneration: PersonGeneration.ALLOW_ADULT,
        aspectRatio,
        personGeneration
        },
    });

        const json = await response.json();
        console.log(json);

        // Estrarre i bytes base64 indipendentemente dallo schema di risposta
        let b64 = '';
        // Caso 1: { images: [ { image: { bytesBase64Encoded }, mimeType } ] }
        b64 = json?.images?.[0]?.image?.bytesBase64Encoded || b64;
        // Caso 2: { generatedImages: [ { inlineData: { data } } ] }
        b64 = json?.generatedImages?.[0]?.inlineData?.data || b64;
        // Caso 3: { generatedImages: [ { b64Data } ] }
        b64 = json?.generatedImages?.[0]?.b64Data || b64;

        if (!b64) {
            throw new Error('Risposta Imagen priva di dati immagine attesi');
        }

        const buffer = Buffer.from(b64, 'base64');

        const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('\n' + '='.repeat(60));
        console.log('✅ GENERAZIONE IMMAGINE (GEMINI IMAGEN 3.0) COMPLETATA');
        console.log(`⏱️  Tempo totale: ${executionTime}s`);
        console.log('='.repeat(60) + '\n');

        return {
            success: true,
            prompt: prompt,
            buffer,
            mimeType: outputMimeType,
            executionTime: `${executionTime}s`,
            settings: {
                outputMimeType,
                aspectRatio,
                numberOfImages,
                personGeneration
            }
        };
    } catch (error) {
        const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error('\n' + '='.repeat(60));
        console.error('❌ ERRORE GENERAZIONE IMMAGINE (GEMINI)');
        console.error(`⏱️  Tempo di esecuzione: ${executionTime}s`);
        console.error('Errore:', error.message);
        console.error('='.repeat(60) + '\n');
        return {
            success: false,
            error: error.message,
            executionTime: `${executionTime}s`
        };
    }
}


module.exports = {
    generateImage,
    createComfyUIGraph,
    validateCheckpoint,
    pollComfyUIHistory,
    generateGeminiImage
};
