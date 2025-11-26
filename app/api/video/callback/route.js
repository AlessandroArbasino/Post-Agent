import { NextResponse } from 'next/server';
const { installGlobalErrorHandlers, withErrorReporting } = require('../../../utils/errorMiddleware');
const { publishToInstagram } = require('../../../utils/publishToInstagram');
export const runtime = 'nodejs';
export const maxDuration = 60;

installGlobalErrorHandlers();

async function handler(request) {
  try {
    const rawBody = await request.text();

    let body;
    try {
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch (e) {
      body = {};
    } 

    const videoUrl = body?.event_data?.url;
    if (!videoUrl) {
      return NextResponse.json({ error: 'Missing field: video_url' }, { status: 400 });
    }

    await publishToInstagram({ url: videoUrl, caption: '', mediaType: 'REELS', isVideo: true });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = await withErrorReporting(handler, { operation: 'video_callback' });
