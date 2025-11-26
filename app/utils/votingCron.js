const { sendMessageWithInlineKeyboard, sendWinnerNotification, editMessageToPlainText, editMediaCaption, deleteMessageById} = require('./telegramNotifier')
const { getAllImageFolders, deleteAllVotingImages, deleteAllVotingUsers, getTelegramMessage , insertTelegramMessage, deleteTelegramMessage} = require('../db/dbClient')
const { publishToInstagram, publishCarouselToInstagram, } = require('./publishToInstagram')
const { deleteFolder } = require('./uploadToCloudinary')
const { getBestPhoto } = require('./scoring')
const { generateInstagramCaption } = require('./refinePrompt')
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

  await publishToInstagram({url : process.env.INSTAGRAM_DEFAULT_START_VOTING_STORY_URL, caption : '', mediaType : 'STORIES',isVideo : true})
  await sendMessageWithInlineKeyboard(imageurls, rows, topicId)

  return { total: images.length, sent_buttons: rows.length }
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
  //Publish the presentation image as Instagram Story to announce the winner
  await publishToInstagram({url : process.env.INSTAGRAM_DEFAULT_END_VOTING_STORY_URL, caption : '', mediaType : 'STORIES',isVideo : true})
  //Publish the winner image as Instagram Story
  const publishResult = await publishToInstagram({url : top.image_url, caption : '', mediaType : 'STORIES'})

const caption =  generateInstagramCaption({refinedPrompt: process.env.WINNING_CAROUSEL_CAPTION_TEMPLATE,
    maxHashtags: parseInt(process.env.CAPTION_MAX_HASHTAGS || '5', 10) });
  //Publish the winner image as Instagram Carousel
  await publishCarouselToInstagram({secondImageUrl : top.image_url, caption : caption})

  await sendWinnerNotification({ photoUrl: top.image_url, permalink: publishResult.permalink, parseMode: undefined, topicId })

  const votingMedia = await getTelegramMessage('voting_media')
  if (votingMedia) {
    await editMediaCaption({ telegramMessageId: votingMedia.telegram_message_id, caption: process.env.END_VOTING_TEMPLATE, parseMode: 'HTML' })
  }

  const keyboard = await getTelegramMessage('voting_keyboard')
  if (keyboard) {
    await deleteMessageById({telegramMessageId: keyboard.telegram_message_id})
  }

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

  if(process.env.DATABASE_URL) {
    await deleteAllVotingImages()
    await deleteAllVotingUsers()
    await deleteTelegramMessage('voting_media')
    await deleteTelegramMessage('voting_keyboard')
  }

  return {
    ok: true,
    published: publishResult,
    image_url: top.image_url,
    votes: top.votes,
  }
}

module.exports = {votingCron, publishWinner };

