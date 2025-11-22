import { NextResponse } from 'next/server';
const { installGlobalErrorHandlers, withErrorReporting } = require('../../../utils/errorMiddleware');
const { publishToInstagram } = require('../../../utils/publishToInstagram');
export const runtime = 'nodejs';
export const maxDuration = 60;

installGlobalErrorHandlers();

async function handler(request) {
  const body = await request.json();
  const videoUrl = body?.video_url;
  if (!videoUrl) {
    return NextResponse.json({ error: 'Missing field: video_url' }, { status: 400 });
  }

  await publishToInstagram({ url: videoUrl, caption: '', mediaType: 'REELS', isVideo: true });
  return NextResponse.json({ success: true });
}

export const POST = await withErrorReporting(handler, { operation: 'video_callback' });
