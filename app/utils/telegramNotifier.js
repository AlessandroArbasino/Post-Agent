/**
 * Utility to send Telegram notifications at the end of the process
 * - Uses Telegram Bot API to send success/error messages
 * - Message templates are in .env and support dynamic parameters {0},{1},{2},{3}
 */

const {markAllSentNow} = require('../db/dbClient')
const {labeledImageUrl} = require('./uploadToCloudinary')
/**
 * Replaces {0},{1},{2},{3} in the template with provided values
 * @param {string} template
 * @param {Array<string>} params
 */
function formatTemplate(template = '', params = []) {
  return template
    .replaceAll('{0}', params[0] ?? '')
    .replaceAll('{1}', params[1] ?? '')
    .replaceAll('{2}', params[2] ?? '')
    .replaceAll('{3}', params[3] ?? '');
}

/**
 * Send a text message on Telegram
 * @param {Object} options
 * @param {string} options.token - Bot token
 * @param {string|number} options.chatId - Chat ID or username (e.g., @channel)
 * @param {string} options.text - Message text
 * @param {string} [options.parseMode] - MarkdownV2 | Markdown | HTML
 */
async function sendTelegramText({ token, chatId, text, parseMode, topicId }) {
  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`;
  const body = {
    chat_id: chatId,
    text,
  };
  if (parseMode) body.parse_mode = parseMode;
  if (topicId) body.message_thread_id = topicId;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(`Telegram sendMessage failed: ${res.status} ${res.statusText} ${data?.description || ''}`);
  }
  return data;
}

/**
 * Send a photo on Telegram (optional, if imageUrl is provided)
 * @param {Object} options
 * @param {string} options.token - Bot token
 * @param {string|number} options.chatId - Chat ID
 * @param {string} options.photo - Public image URL
 * @param {string} [options.caption] - Caption
 * @param {string} [options.parseMode] - MarkdownV2 | Markdown | HTML
 */
async function sendTelegramPhoto({ token, chatId, photo, caption, parseMode, topicId }) {
  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/sendPhoto`;
  const body = {
    chat_id: chatId,
    photo,
  };
  if (caption) body.caption = caption;
  if (parseMode) body.parse_mode = parseMode;
  if (topicId) body.message_thread_id = topicId;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(`Telegram sendPhoto failed: ${res.status} ${res.statusText} ${data?.description || ''}`);
  }
  return data;
}

/**
 * Send a Telegram notification for success/error
 * @param {Object} payload
 * @param {'success'|'error'} payload.status
 * @param {string} [payload.imageUrl] - Public image URL (if available)
 * @param {string} [payload.caption] - Caption/description used in the post
 * @param {string} [payload.originalPrompt] - Original prompt
 * @param {string} [payload.refinedPrompt] - Refined prompt
 * @param {string} [payload.error] - Error message
 * @param {string} [payload.permalink] - Public link to the Instagram post
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendTelegramNotification({ status, imageUrl, caption, originalPrompt, refinedPrompt, error, permalink, topicId }) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const parseMode = process.env.TELEGRAM_PARSE_MODE || undefined; // opzionale

    if (!token || !chatId) {
      return { success: false, error: 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured' };
    }

    // Recupero template da .env
    const successTpl = process.env.TELEGRAM_SUCCESS_TEMPLATE || 'Pipeline OK\nOriginal: {0}\nRefined: {1}\nCaption: {2}\nLink: {3}';
    const failureTpl = process.env.TELEGRAM_FAILURE_TEMPLATE || 'Pipeline KO\nOriginal: {0}\nRefined: {1}\nError: {2}\n';

    // Parametri dinamici per i template
    const successParams = [originalPrompt || '', refinedPrompt || '', caption || '', permalink || ''];
    const failureParams = [originalPrompt || '', refinedPrompt || '', error || ''];

    if (status === 'success') {
      // Se abbiamo un'immagine, inviamo la foto con caption formattata; altrimenti testo
      if (imageUrl) {
        const captionText = formatTemplate(successTpl, successParams);
        await sendTelegramPhoto({ token, chatId, photo: imageUrl, caption: captionText, parseMode, topicId });
        return { success: true };
      } else {
        const text = formatTemplate(successTpl, successParams);
        await sendTelegramText({ token, chatId, text, parseMode, topicId });
        return { success: true };
      }
    } else {
      const text = formatTemplate(failureTpl, failureParams);
      await sendTelegramText({ token, chatId, text, parseMode, topicId });
      return { success: true };
    }
}

async function editMessageToPlainText({ messageId, template, topicId }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) throw new Error('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured');
  if (!messageId && messageId !== 0) throw new Error('messageId is required');

  const res = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: Number(messageId) || messageId,
      text: template,
      reply_markup: null,
      disable_web_page_preview: true,
      message_thread_id: topicId,
    }),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Telegram editMessageText failed: ${res.status} ${txt}`)
  }
  const data = await res.json().catch(() => ({}))
  if (data && data.ok === false) {
    throw new Error(`Telegram editMessageText failed: ${data.description || 'unknown error'}`)
  }
  return data
}

async function sendWinnerNotification({ photoUrl,permalink, parseMode }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const mode = parseMode || process.env.TELEGRAM_PARSE_MODE || undefined;
  if (!token || !chatId) {
    throw new Error('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured');
  }
  const caption = formatTemplate(process.env.TELEGRAM_WINNER_TEMPLATE || 'Winner: {0}', [permalink]);
  if (!permalink) {
    throw new Error('Permalink not provided');
  }

  return await sendTelegramPhoto({ token, chatId, photo: photoUrl, caption, parseMode: mode, topicId });
}

/**
 * Send annotated media groups and a follow-up inline keyboard message.
 * Marks all images as sent afterwards.
 * @param {string[]} urls - Array of image URLs to display in groups
 * @param {Array<Array<{text:string, url:string}>>} rows - Inline keyboard rows
 * @returns {Promise<any>} - Telegram API response for the sendMessage call
 */
async function sendMessageWithInlineKeyboard(urls, rows, topicId) {
  const header = process.env.TELEGRAM_GROUP_IMAGE_HEADER
  await sendAnnotatedMediaGroupsWithOptionalHeader(urls, header, topicId)

  const text = process.env.TELEGRAM_KEYBOARD_HEADER
  const result = await sendInlineKeyboard(text, rows, topicId)
  
  await markAllSentNow()
  return result
}

/**
 * Send a Telegram message with an inline keyboard.
 * @param {string} text - Message text content
 * @param {Array<Array<{text:string, url:string}>>} rows - Inline keyboard rows
 * @returns {Promise<any>} - Telegram API response JSON
 */
async function sendInlineKeyboard(text, rows, topicId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: rows },
      disable_web_page_preview: true,
      message_thread_id: topicId,
    }),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Telegram sendMessage failed: ${res.status} ${txt}`)
  }
  return res.json()
}


/**
 * Send images in groups (max 10) with optional header in the first group's caption.
 * Labels each image with an incremental number using Cloudinary transformation.
 * @param {string[]} urls - Array of image URLs
 * @param {string} [headerText] - Optional caption for the first image of the first group
 * @returns {Promise<void>}
 */
async function sendAnnotatedMediaGroupsWithOptionalHeader(urls, headerText, topicId) {
  if (!urls || urls.length === 0) throw new Error('No images to send')

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const chunk = (arr, size) => {
    const out = []
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
    return out
  }

  const groups = chunk(urls, 10)

  let globalIndex = 0
  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi]
    const media = []

    for (let i = 0; i < g.length; i++) {
      const url = g[i]
      const label = ++globalIndex
      const transformed = url// labeledImageUrl(url, label)
      media.push({ type: 'photo', media: transformed })
    }

    // Header come caption sul primo elemento del PRIMO gruppo
    if (gi === 0 && headerText) {
      media[0].caption = headerText
      media[0].parse_mode = 'HTML'
    }

    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, media, message_thread_id: topicId }),
    })

    if (!resp.ok) {
      const txt = await resp.text()
      throw new Error(`Telegram sendMediaGroup (annotated) failed: ${resp.status} ${txt}`)
    }
    await resp.json()
  }
}

module.exports = {
  sendTelegramNotification,
  sendMessageWithInlineKeyboard,
  sendWinnerNotification,
  formatTemplate,
  editMessageToPlainText
};
