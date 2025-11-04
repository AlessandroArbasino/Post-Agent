import { NextResponse } from 'next/server'
import { Telegraf } from 'telegraf'
import { createHash } from 'crypto'
const { updateVote, getAllImageForVoting } = require('../../db/dbClient')

export const runtime = 'nodejs'

// Create bot instance once per process
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

// Helper to compute a short stable hash for callback_data
function shortHash(input) {
  return createHash('sha1').update(String(input)).digest('hex').slice(0, 12)
}

// Handle button clicks
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery?.data || ''
  try {
    if (data.startsWith('vote:')) {
      const h = data.slice('vote:'.length)
      const images = await getAllImageForVoting()
      const match = images.find((it) => shortHash(it.image_url) === h)
      if (!match) {
        await ctx.answerCbQuery('Elemento non trovato', { show_alert: true })
        return
      }
      const updated = await updateVote(match.image_url)
      await ctx.answerCbQuery(`Voto registrato (#${updated?.votes ?? ''})`)
    } else {
      await ctx.answerCbQuery('Azione non riconosciuta')
    }
  } catch (e) {
    try { await ctx.answerCbQuery('Errore', { show_alert: true }) } catch {}
  }
})

export async function POST(request) {
  const update = await request.json()
  await bot.handleUpdate(update)
  return NextResponse.json({ ok: true })
}
