import { NextResponse } from 'next/server';
const { installGlobalErrorHandlers, withErrorReporting } = require('../../../utils/errorMiddleware');
const { publishToInstagram } = require('../../../utils/publishToInstagram');
export const runtime = 'nodejs';
export const maxDuration = 60;

installGlobalErrorHandlers();

async function handler(request) {
  try {
    console.log('[video_callback] Incoming request');
    console.log('[video_callback] method:', request.method);
    console.log('[video_callback] url:', request.url);
    try {
      const headersObj = Object.fromEntries(request.headers?.entries?.() || []);
      console.log('[video_callback] headers:', headersObj);
    } catch (e) {
      console.log('[video_callback] headers: <unavailable>', e?.message);
    }

    const rawBody = await request.text();
    console.log('[video_callback] raw body:', rawBody);

    let body;
    try {
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch (e) {
      console.log('[video_callback] JSON parse error:', e?.message);
      body = {};
    }
    console.log('[video_callback] parsed body:', body);

    const videoUrl = body?.video_url;
    if (!videoUrl) {
      console.log('[video_callback] missing video_url in body');
      return NextResponse.json({ error: 'Missing field: video_url' }, { status: 400 });
    }

    await publishToInstagram({ url: videoUrl, caption: '', mediaType: 'REELS', isVideo: true });
    console.log('[video_callback] publishToInstagram success for url:', videoUrl);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[video_callback] handler error:', err?.message, err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = await withErrorReporting(handler, { operation: 'video_callback' });
