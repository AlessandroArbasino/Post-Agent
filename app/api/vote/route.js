import { NextResponse } from 'next/server'
const { handleUpdate } = require('../../services/telegram/bot')

export const runtime = 'nodejs'

export async function POST(request) {
  const update = await request.json()
  await handleUpdate(update)
  return NextResponse.json({ ok: true })
}
