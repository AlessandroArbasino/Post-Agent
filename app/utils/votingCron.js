const { sendMessageWithInlineKeyboard } = require('./telegramNotifier')
const { getTopImage, getAllImageFolders } = require('../db/dbClient')
const { publishToInstagram } = require('./publishToInstagram')
const { deleteFolder } = require('./uploadToCloudinary')

/**
 * Send a voting prompt to Telegram with inline keyboard buttons.
 * Builds one button per image and sends annotated previews.
 * @param {Array<{image_url:string, [key:string]:any}>} images - List of images to vote on
 * @returns {Promise<{total:number, sent_buttons:number}>}
 */
const votingCron = async(images) => {
  const base = process.env.APP_BASE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const rows = images.map((u, i) => [
    {
      text: `Vota #${i + 1}`,
      url: `${base}/api/vote?url=${encodeURIComponent(u.image_url)}`,
    },
  ])

  const header = process.env.INLINE_KEYBOARD_HEADER
  const imageurls = images.map((u) => u.image_url)

  if (rows.length > 0) {
    await sendMessageWithInlineKeyboard(imageurls, header || 'Seleziona un voto', rows)
  }

  return { total: images.length, sent_buttons: rows.length }
}

/**
 * Publish the weekly winner to Instagram and optionally clean Cloudinary folders.
 * Uses `getTopImage()` and posts as Instagram Story.
 * @returns {Promise<{ok:boolean, published:any, image_url:string, votes:number, caption:string} | {error:string, status:number}>}
 */
const publishWinner = async() => {
  const top = await getTopImage()
  if (!top) {
    return { error: 'No images available to publish', status: 404 }
  }

  const caption = `The winner is ${top.image_url}`
  const publishResult = await publishToInstagram(top.image_url, caption, true)

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

  return {
    ok: true,
    published: publishResult,
    image_url: top.image_url,
    votes: top.votes,
    caption,
  }
}

module.exports = {votingCron, publishWinner };

