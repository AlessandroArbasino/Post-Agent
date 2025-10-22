/**
 * Utility to send Telegram notifications at the end of the process
 * - Uses Telegram Bot API to send success/error messages
 * - Message templates are in .env and support dynamic parameters {0},{1},{2},{3}
 */

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
async function sendTelegramText({ token, chatId, text, parseMode }) {
  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`;
  const body = {
    chat_id: chatId,
    text,
  };
  if (parseMode) body.parse_mode = parseMode;

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
async function sendTelegramPhoto({ token, chatId, photo, caption, parseMode }) {
  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/sendPhoto`;
  const body = {
    chat_id: chatId,
    photo,
  };
  if (caption) body.caption = caption;
  if (parseMode) body.parse_mode = parseMode;

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
async function sendTelegramNotification({ status, imageUrl, caption, originalPrompt, refinedPrompt, error, permalink }) {
  try {
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
        await sendTelegramPhoto({ token, chatId, photo: imageUrl, caption: captionText, parseMode });
        return { success: true };
      } else {
        const text = formatTemplate(successTpl, successParams);
        await sendTelegramText({ token, chatId, text, parseMode });
        return { success: true };
      }
    } else {
      const text = formatTemplate(failureTpl, failureParams);
      await sendTelegramText({ token, chatId, text, parseMode });
      return { success: true };
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
}

module.exports = {
  sendTelegramNotification,
};
