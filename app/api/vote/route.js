import { NextResponse } from 'next/server'
import { Telegraf } from 'telegraf'
import { createHash } from 'crypto'
const { updateVote, getAllImageForVoting, getVotingUser, insertVotingUser, updateVotingUser } = require('../../db/dbClient')
const { formatTemplate } = require('../../services/telegram/notifier')

export const runtime = 'nodejs'

// Create bot instance once per process
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

// Helper to compute a short stable hash for callback_data
const shortHash = (input) => {
  return createHash('sha1').update(String(input)).digest('hex').slice(0, 12)
}

// Handle button clicks
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery?.data || ''
  try {
    if (data.startsWith('vote:')) {
      const h = data.slice('vote:'.length)
      // Prevent duplicate votes per Telegram user
      const voterId = ctx.from?.id || ctx.callbackQuery?.from?.id

      const images = await getAllImageForVoting()
      const match = images.find((it) => shortHash(it.image_url) === h)

      if (!match) {
        await ctx.answerCbQuery('Element not found', { show_alert: true })
        return
      }
      if (voterId) {
        const existing = await getVotingUser(String(voterId))
        if (existing) {
          const previosVotingImage = images.find((it) => it.voting_number === existing.voted_image_number);
          if (previosVotingImage.voting_number !== match.voting_number) {
            await updateVote(previosVotingImage.image_url, -1);
            await updateVotingUser(String(voterId), match.voting_number);
            await updateVote(match.image_url, 1)
            await ctx.answerCbQuery('Your vote has changed from image number ' + previosVotingImage.voting_number + ' to image number ' + match.voting_number, { show_alert: true })
          } else {
            await ctx.answerCbQuery('You have already voted for this image', { show_alert: true })
          }
        } else {
          await insertVotingUser(String(voterId), match.voting_number);
          await updateVote(match.image_url, 1)
          await ctx.answerCbQuery(`Thank you for voting image number ${match.voting_number}!`, { show_alert: true })
        }
      }
    } else {
      await ctx.answerCbQuery('Data does not begin with "vote:", please try again', { show_alert: true })
    }
  } catch (e) {
    await ctx.answerCbQuery('Something went wrong', { show_alert: true })
  }
})

// Welcome new members joining the group
bot.on('new_chat_members', async (ctx) => {
  const members = ctx.message?.new_chat_members || []
  for (const m of members) {
    const full_name = m.username || (m.first_name || 'User') + (m.last_name ? ` ${m.last_name}` : '')
    const user_tag_html = `<a href="tg://user?id=${m.id}">${full_name}</a>`
    const caption = formatTemplate(process.env.TELEGRAM_WELCOME_TEMPLATE, [user_tag_html]);
    const opts = { message_thread_id: process.env.WELCOME_THREAD_ID, parse_mode: 'HTML' }
    await ctx.reply(caption, opts)
  }
})

export async function POST(request) {
  const update = await request.json()
  await bot.handleUpdate(update)
  return NextResponse.json({ ok: true })
}
