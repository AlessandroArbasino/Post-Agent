const { sendMessageWithInlineKeyboard, sendWinnerNotification, editMessageToPlainText } = require('./telegramNotifier')
const { getAllImageFolders, deleteAllVotingImages, deleteAllVotingUsers, getTelegramMessage , insertTelegramMessage} = require('../db/dbClient')
const { publishToInstagram } = require('./publishToInstagram')
const { deleteFolder } = require('./uploadToCloudinary')
const { getBestPhoto } = require('./scoring')
const crypto = require('crypto')

/**
 * Send a voting prompt to Telegram with inline keyboard buttons.
 * Builds one button per image and sends annotated previews.
 * @param {Array<{image_url:string, [key:string]:any}>} images - List of images to vote on
 * @returns {Promise<{total:number, sent_buttons:number}>}
 */
const votingCron = async(images, topicId) => {
  const shortHash = (s) => crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 12)

  const rows = images.map((u, i) => [
    {
      text: `Vota #${i + 1}`,
      callback_data: `vote:${shortHash(u.image_url)}`,
    },
  ])

  const imageurls = images.map((u) => u.image_url)

  let telegramMessageId = undefined
  if (rows.length > 0) {
    const res = await sendMessageWithInlineKeyboard(imageurls, rows, topicId)
    telegramMessageId = res?.result?.message_id ?? res?.message_id
    if (telegramMessageId && process.env.DATABASE_URL) {
      await insertTelegramMessage(String(telegramMessageId), 'voting_keyboard') 
    }
  }

  return { total: images.length, sent_buttons: rows.length, telegram_message_id: telegramMessageId }
}

/**
 * Publish the weekly winner to Instagram and optionally clean Cloudinary folders.
 * Uses `getBestPhoto()` and posts as Instagram Story.
 * @returns {Promise<{ok:boolean, published:any, image_url:string, votes:number, caption:string} | {error:string, status:number}>}
 */
const publishWinner = async(topicId) => {
  const top = await getBestPhoto()
  if (!top) {
    return { error: 'No images available to publish', status: 404 }
  }

  const publishResult = await publishToInstagram(top.image_url, '', true)

  await sendWinnerNotification({ photoUrl: top.image_url, permalink: publishResult.permalink, parseMode: undefined, topicId })

  if (process.env.CLOUDINARY_ENABLE_DELETE === 'true') {
    try {
      const rows = await getAllImageFolders()
      const folders = rows.map((r) => r.cloudinary_folder)
      for (const f of folders) {
        await deleteFolder(f)
      }
    } catch (e) {
      console.warn('Cloudinary bulk cleanup skipped/failed', e)
    }
  }

  const message = await getTelegramMessage('voting_keyboard')
  if (message) {
    await editMessageToPlainText({ telegramMessageId: message.telegram_message_id, template: process.env.END_VOTING_TEMPLATE, topicId: process.env.VOTE_HUB_THREAD_ID })
  }
  
  if(process.env.DATABASE_URL) {
    await deleteAllVotingImages()
  }

  if(process.env.DATABASE_URL) {
    await deleteAllVotingUsers()
  }

  return {
    ok: true,
    published: publishResult,
    image_url: top.image_url,
    votes: top.votes,
  }
}

module.exports = {votingCron, publishWinner };

