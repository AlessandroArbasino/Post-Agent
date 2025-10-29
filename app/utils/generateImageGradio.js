/**
 * Image generation via Gradio Client (e.g. black-forest-labs/FLUX.1-dev)
 * - Generates an image via @gradio/client and returns the source URL and optionally the Buffer
 * - Upload and saving are delegated to the calling handler (e.g., postHandler)
 */

const fs = require('fs').promises;



// Private function: download an image URL and return a data URI
async function _bufferFromUrlViaDataUri(src) {
  const res = await fetch(src);
  const base64 = Buffer.from(await res.arrayBuffer()).toString('base64');
  const contentType = res.headers.get('content-type') || 'image/webp';
  const dataUri = `data:${contentType};base64,${base64}`;
  return dataUri;
}

/**
 * Download an image from URL or data URL and return a Buffer
 * @param {string} src - http(s) URL or data URL (data:image/png;base64,....)
 */
async function getImageBufferFromSource(src) {
  if (!src) throw new Error('invalid image source');
  console.log('src: ' + src);
  // data URL
  if (src.startsWith('data:')) {
    const base64 = src.split(',')[1] || '';
    return Buffer.from(base64, 'base64');
  }
  // URL or local path
  return await _bufferFromUrlViaDataUri(src);
}

/**
 * Try to extract an image URL (or data URL) from the Gradio result
 * @param {any} result - result of client.predict
 * @returns {string|null}
 */
function extractImageSourceFromGradioResult(result) {
  // common pattern: result.data is an array and the first element contains the image
  const resultData = result?.data;
  if (!resultData) return null;

  // Case 1: direct string (URL or data URL)
  if (typeof resultData === 'string') return resultData;

  // Case 2: array with string
  if (Array.isArray(resultData) && resultData.length > 0) {
    if (typeof resultData[0] === 'string') return resultData[0];
    // Object with possible keys { url, path, image }
    const first = resultData[0];
    if (first && typeof first === 'object') {
      if (typeof first.url === 'string') return first.url;
      if (typeof first.path === 'string') return first.path; // talvolta un file temporaneo
      if (typeof first.image === 'string') return first.image; // fallback
    }
  }

  // Case 3: direct object
  if (typeof resultData === 'object') {
    if (typeof resultData.url === 'string') return resultData.url;
    if (typeof resultData.path === 'string') return resultData.path;
    if (typeof resultData.image === 'string') return resultData.image;
  }

  return null;
}

/**
 * Generate an image with Gradio and return the source URL and optionally the buffer
 * @param {string} prompt - Testo da generare
 * @param {Object} options - Opzioni gradio e di salvataggio/upload
 * @param {string} [options.spaceId=process.env.GRADIO_SPACE_ID||"black-forest-labs/FLUX.1-dev"] - Space gradio
 * @param {string} [options.endpoint="/infer"] - Endpoint di predict
 * @param {number} [options.seed=0]
 * @param {boolean} [options.randomize_seed=true]
 * @param {number} [options.width=768]
 * @param {number} [options.height=768]
 * @param {number} [options.guidance_scale=4]
 * @param {number} [options.num_inference_steps=28]
 * @param {boolean} [options.returnBuffer=false] - Se true scarica anche il buffer dell'immagine
 * @returns {Promise<{success:boolean, sourceUrl:string, buffer:Buffer|null, executionTime:string, settings:Object, error?:string}>}
 */
async function generateImageGradio(prompt, options = {}) {
  const started = Date.now();
  try {
    // dynamic import per ESM client
    const { Client } = await import('@gradio/client');

    const spaceId = options.spaceId || process.env.GRADIO_SPACE_ID || 'black-forest-labs/FLUX.1-dev';
    const endpoint = options.endpoint || '/infer';

    const payload = {
      prompt: prompt || options.prompt || 'Hello!!',
      seed: options.seed ?? 0,
      randomize_seed: options.randomize_seed ?? true,
      width: options.width ?? 768,
      height: options.height ?? 768,
      guidance_scale: options.guidance_scale ?? 4,
      num_inference_steps: options.num_inference_steps ?? 28,
    };

    console.log(`🎛️  Gradio connect → ${spaceId}`);
    const client = await Client.connect(spaceId, { hf_token: process.env.HUGGING_FACE_TOKEN });
    console.log('🔌 Gradio connect OK');

    console.log(`🚀 Gradio predict → ${endpoint}`);
    let result;
    try {
      result = await client.predict(endpoint, payload);
    } catch (e) {
      console.warn('⚠️ predict with object payload failed, retrying with array:', e?.message || e);
      const arrPayload = [
        payload.prompt,
        payload.seed,
        payload.randomize_seed,
        payload.width,
        payload.height,
        payload.guidance_scale,
        payload.num_inference_steps,
      ];
      result = await client.predict(endpoint, arrPayload);
    }
    // Minimal log to avoid verbosity
    if (result && typeof result === 'object') {
      const keys = Object.keys(result);
      console.log('📦 Gradio result keys:', keys.slice(0, 5).join(', '), keys.length > 5 ? '...' : '');
    }

    const imgSrc = extractImageSourceFromGradioResult(result);
    if (!imgSrc) throw new Error('Unable to extract image from Gradio result');

    // Always return buffer
    console.log(`🖼️  Source image: ${imgSrc}`);
    const imageUri = await getImageBufferFromSource(imgSrc);

    const executionTime = ((Date.now() - started) / 1000).toFixed(2);
    return {
      success: true,
      sourceUrl: imgSrc,
      sourceUri : imageUri,
      executionTime: `${executionTime}s`,
      settings: payload,
    };
  } catch (error) {
    const executionTime = ((Date.now() - started) / 1000).toFixed(2);
    console.error('❌ generateImageGradio error:', error?.message || error);
    const err = new Error(error?.message || String(error));
    err.meta = { executionTime: `${executionTime}s`, settings: options };
    throw err;
  }
}

module.exports = {
  generateImageGradio,
};
