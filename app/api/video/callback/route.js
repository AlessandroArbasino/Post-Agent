import { NextResponse } from 'next/server';
const { installGlobalErrorHandlers, withErrorReporting } = require('../../../utils/errorMiddleware');
const { manageVideoCallback } = require('../../../handlers/videoCallbackHandler');

export const runtime = 'nodejs';
export const maxDuration = 60;

installGlobalErrorHandlers();

const handler = async (request) => {
  const rawBody = await request.text();

  let body;
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch (e) {
    body = {};
  }

  console.log('Body:', body);

  const videoUrl = body?.event_data?.url;

  console.log('Video URL:', videoUrl);

  await manageVideoCallback({ videoUrl: videoUrl })
  return NextResponse.json({ success: true });
}

export const POST = await withErrorReporting(handler, { operation: 'video_callback' });
