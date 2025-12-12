const { convertWebPToPng } = require('../common/imageProcessor');
const { generateSpeech } = require('../ai/promptRefiner');

/**
 * Generates a video with avatar using HeyGen API.
 * Uploads background image, generates speech from caption, and creates video.
 * @param {Object} params - Generation parameters
 * @param {string} params.backgroundUrl - URL of the background image
 * @param {string} params.caption - Caption text to generate speech from
 * @returns {Promise<{videoId: string, backgroundAssetId: string}>} Video and asset IDs
 */
const generateVideo = async ({ backgroundUrl, caption }) => {
  const asset = await uploadAssetToHeygen(backgroundUrl);
  const speechText = await generateSpeech({ prompt: caption });
  const speech = speechText.geminiResponse;
  const videoId = await generateVideoHeygen({ backgroundAssetId: asset.id, backgroundUrl: asset.url, speechText: speech });
  return { videoId: videoId, backgroundAssetId: asset.id };
};

/**
 * Creates a video using HeyGen API with specified avatar, voice, and background.
 * @param {Object} params - Video generation parameters
 * @param {string} params.backgroundUrl - URL of the background image
 * @param {string} params.backgroundAssetId - HeyGen asset ID for the background
 * @param {string} params.speechText - Text for the avatar to speak
 * @returns {Promise<string>} The generated video ID
 */
const generateVideoHeygen = async ({ backgroundUrl, backgroundAssetId, speechText } = {}) => {
  const body = {
    caption: 'false',
    video_inputs: [
      {
        character: {
          type: 'avatar',
          avatar_id: process.env.VIDEO_GENERATION_AVATAR_ID,
          scale: 1,
          avatar_style: 'normal',
          talking_style: 'stable',
          super_resolution: false,
          expression: 'happy',
          matting: false,
          offset: { x: -0.3, y: 0 },
        },
        voice: {
          type: 'text',
          voice_id: process.env.VIDEO_GENERATION_VOICE_ID,
          input_text: speechText,
          speed: '1',
          pitch: '0',
          duration: '1',
          emotion: 'Friendly',
          locale: 'en-US'
        },
        background: {
          type: 'image',
          value: '#FFFFFF',
          play_style: 'freeze',
          fit: 'crop',
          url: backgroundUrl
        },
        text: {
          type: "text",
          text: "Welcome to HeyGen",
          font_family: "Arial",
          font_size: 10,
          font_weight: "bold",
          position: {
            "x": 0.5,
            "y": 0
          },
          text_align: "left",
          line_height: 1
        }
      }
    ],
    dimension: { width: 720, height: 1280 },
    folder_id: null,
    callback_url: process.env.VIDEO_GENERATION_CALLBACK_URL
  };

  const response = await fetchHeygen({ url: process.env.HEYGEN_UPLOAD_ASSET_URL, body });
  return response.data.video_id;
};

/**
 * Deletes an image asset from HeyGen.
 * @param {Object} params - Deletion parameters
 * @param {string} params.imageAssetId - The HeyGen image asset ID to delete
 * @returns {Promise<void>}
 */
const deleteAssetImage = async ({ imageAssetId }) => {
  const body = {
    asset_id: imageAssetId
  };
  await fetchHeygen({ url: 'https://api.heygen.com/v1/asset/asset_id/delete', body });
}

/**
 * Deletes a video asset from HeyGen.
 * @param {Object} params - Deletion parameters
 * @param {string} params.videoAssetId - The HeyGen video asset ID to delete
 * @returns {Promise<void>}
 */
const deleteAssetvideo = async ({ videoAssetId }) => {
  const body = {
    video_id: videoAssetId,
    type: 'heygen_video'
  };
  await fetchHeygen({ url: 'https://api.heygen.com/v1/video.delete', body: body, method: 'DELETE' });
}



/**
 * Makes HTTP requests to HeyGen API with authentication.
 * @param {Object} params - Request parameters
 * @param {string} params.url - API endpoint URL
 * @param {Object|Buffer} params.body - Request body (JSON object or Buffer)
 * @param {string} [params.contentType='application/json'] - Content-Type header
 * @param {string} [params.duplex] - Duplex mode for streaming
 * @param {string} [params.method='POST'] - HTTP method
 * @returns {Promise<Object>} Parsed JSON response from HeyGen API
 * @throws {Error} If the request fails
 */
const fetchHeygen = async ({ url, body, contentType = 'application/json', duplex, method = 'POST' }) => {
  const options = {
    method: method,
    headers: {
      accept: 'application/json',
      'content-type': contentType,
      'x-api-key': process.env.VIDEO_GENERATION_API_KEY
    },
    body: contentType === 'application/json' ? JSON.stringify(body) : body
  };

  if (duplex) {
    options.duplex = duplex;
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HeyGen request failed ${response.status}: ${text}`);
  }
  return await response.json();
};

/**
 * Uploads an image to HeyGen, converting it to PNG format.
 * Downloads the image from URL, converts WebP to PNG, and uploads to HeyGen.
 * @param {string} url - Public URL of the image to upload
 * @returns {Promise<{id: string, url: string}>} HeyGen asset ID and URL
 * @throws {Error} If image download or upload fails
 */
const uploadAssetToHeygen = async (url) => {
  const srcResp = await fetch(url);
  if (!srcResp.ok) {
    const text = await srcResp.text();
    throw new Error(`Failed to download image (${srcResp.status}): ${text}`);
  }

  // Always convert to PNG Buffer (sharp requires a Buffer, not a ReadableStream)
  const webpBuffer = Buffer.from(await srcResp.arrayBuffer());
  const pngBuffer = await convertWebPToPng(webpBuffer);

  const heygenResponce = await fetchHeygen({ url: process.env.HEYGEN_VIDEO_CREATION_URL, body: pngBuffer, contentType: 'image/png', duplex: 'half' });
  console.log(heygenResponce);
  return { id: heygenResponce.data.id, url: heygenResponce.data.url };
};

module.exports = { generateVideo, deleteAssetImage, deleteAssetvideo };