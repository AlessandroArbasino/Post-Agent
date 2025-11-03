import { NextResponse } from 'next/server'
const {installGlobalErrorHandlers, withErrorReporting} = require('../../utils/errorMiddleware')
const { updateVote } = require('../../db/dbClient')

function isValidUrl(value) {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

// Install global error handlers once per process
installGlobalErrorHandlers()

async function handler(req) {
  const body = await req.json().catch(() => ({}))
  const url = (body.url || '').trim()

  if (!url || !isValidUrl(url)) {
    throw new Error('Invalid or missing url')
  }

  const row = await updateVote(url)
  return NextResponse.json({ url: row.image_url, votes: row.votes }, { status: 200 })
}

export const POST = await withErrorReporting(handler, { operation: 'vote' })
