import { generateVideo,uploadAssetToHeygen } from '../../../utils/generateVideo';
import { generateSpeech } from '../../../utils/refinePrompt';

export async function GET() {
  try {
    const asset = await uploadAssetToHeygen("https://res.cloudinary.com/dwpapdlgk/image/upload/v1763824440/dailypost/2025-11-22/bghm3xkxlhxbuzggtvod.webp")
    const speechText = await generateSpeech({prompt:"Even in the everyday, hope finds a way to shine through. ✨ Feeling this little spark of magic today. What are you holding onto hope for right now? Let me know in the comments! 👇"});
    const speech =speechText.geminiResponse;
    const videoId = await generateVideo({backgroundAssetId:asset.id,backgroundUrl:asset.url,speechText:speech});
    return Response.json({ ok:true,video_id: videoId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
