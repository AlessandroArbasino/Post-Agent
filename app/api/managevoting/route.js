import { NextResponse } from 'next/server'
const {installGlobalErrorHandlers, withErrorReporting} = require('../../utils/errorMiddleware')
const { voteHandler } = require('../../handlers/voteHandler')

export const runtime = 'nodejs'

// Install global error handlers once per process
installGlobalErrorHandlers()

async function handler() {
  const result = await voteHandler()
  //evitare di avere 2 cron job separati perche eccederebbe il piano hobby di vercel
  return NextResponse.json({ ok: true, ...result })
}

export const GET = await withErrorReporting(handler, { operation: 'managevoting' })
