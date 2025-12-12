import { generateVideo, uploadAssetToHeygen } from '../../../services/heygen/videoGenerator';
import { generateSpeech } from '../../../services/ai/promptRefiner';

export async function GET() {
  try {
    await generateVideo({
      backgroundUrl: "https://res.cloudinary.com/dwpapdlgk/image/upload/v1763824440/dailypost/2025-11-22/bghm3xkxlhxbuzggtvod.webp",
      caption: "Even in the everyday, hope finds a way to shine through. ✨ Feeling this little spark of magic today. What are you holding onto hope for right now? Let me know in the comments! 👇"
    })
    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
