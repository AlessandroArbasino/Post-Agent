import { NextResponse } from 'next/server';
import { withErrorReporting, installGlobalErrorHandlers } from '../../utils/errorMiddleware';

export const runtime = 'nodejs';

// Install global handlers (idempotent)
installGlobalErrorHandlers();

async function handler() {
  return NextResponse.json(
    {
      ok: true,
      service: 'instagram-daily-post',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

export const GET = withErrorReporting(handler, { operation: 'health' });
