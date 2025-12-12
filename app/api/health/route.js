import { NextResponse } from 'next/server';
import { withErrorReporting, installGlobalErrorHandlers } from '../../services/middleware/error';

export const runtime = 'nodejs';

// Install global handlers (idempotent)
installGlobalErrorHandlers();

const handler = async () => {
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
