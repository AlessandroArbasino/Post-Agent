import { convertWebPToPng } from './imageConvert';

export async function generateVideo({backgroundUrl, backgroundAssetId,speechText} = {}) {

  console.log('backgroundUrl',backgroundUrl);
  console.log('backgroundAssetId',backgroundAssetId);
    const body={
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
          offset: {x: 0, y: -0.5},
        },
        voice: {
          type: 'text',
          voice_id: process.env.VIDEO_GENERATION_VOICE_ID,
          input_text:speechText,
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
          fit: 'cover',
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
          "y": 0.5
        },
        text_align: "left",
        line_height: 1
      }
      }
    ],
    dimension: {width: 720, height: 1280},
    folder_id: null,
    callback_url: process.env.VIDEO_GENERATION_CALLBACK_URL
  }

  const response = await fetchHeygen({ url: process.env.HEYGEN_UPLOAD_ASSET_URL, body });
  return response.data.video_id;
}

export async function getVideoUrl(videoId) {
  movioApi.auth(process.env.VIDEO_GENERATION_API_KEY);
  const response = await movioApi.videoStatus({ video_id: videoId });
  return response.data.video_url != null ? response.data.video_url : null;
}

export async function fetchHeygen({url,body,contentType='application/json',duplex}){
 const options = {
   method: 'POST',
   headers: {
     accept: 'application/json',
     'content-type': contentType,
     'x-api-key': process.env.VIDEO_GENERATION_API_KEY
   },
   body: contentType === 'application/json' ? JSON.stringify(body) : body

 };

 if(duplex){
  options.duplex=duplex;
 }

 const response = await fetch(url, options);
 if (!response.ok) {
   const text = await response.text();
   throw new Error(`HeyGen request failed ${response.status}: ${text}`);
 }
 return await response.json();
}

export async function uploadAssetToHeygen(url){
  const srcResp = await fetch(url);
  if (!srcResp.ok) {
    const text = await srcResp.text();
    throw new Error(`Failed to download image (${srcResp.status}): ${text}`);
  }

  // Always convert to PNG Buffer (sharp requires a Buffer, not a ReadableStream)
  const webpBuffer = Buffer.from(await srcResp.arrayBuffer());
  const pngBuffer = await convertWebPToPng(webpBuffer);

  const heygenResponce=await fetchHeygen({url: process.env.HEYGEN_VIDEO_CREATION_URL,body:pngBuffer,contentType:'image/png',duplex: 'half'});
  console.log(heygenResponce);
  return {id:heygenResponce.data.id,url:heygenResponce.data.url};
}