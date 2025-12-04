const { convertWebPToPng } = require('./imageConvert');
const {generateSpeech} = require('./refinePrompt');

const generateVideo = async ({ backgroundUrl, caption }) => {
  const asset = await uploadAssetToHeygen(backgroundUrl);
  const speechText = await generateSpeech({ prompt: caption });
  const speech = speechText.geminiResponse;
  const videoId = await generateVideoHeygen({ backgroundAssetId: asset.id, backgroundUrl: asset.url, speechText: speech });
  return {videoId : videoId,backgroundAssetId : asset.id};
};

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

const deleteAssetImage = async({imageAssetId})=> {
  const body = {
      asset_id : imageAssetId
    };
    await fetchHeygen({url:'https://api.heygen.com/v1/asset/asset_id/delete',body});
}

const deleteAssetvideo = async({videoAssetId}) => {
  const body = {
    video_id : videoAssetId,
    type : 'heygen_video'
  };
  await fetchHeygen({url:'https://api.heygen.com/v1/video.delete',body:body, method:'DELETE'});
}



const fetchHeygen = async ({ url, body, contentType = 'application/json', duplex, method = 'POST'  }) => {
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