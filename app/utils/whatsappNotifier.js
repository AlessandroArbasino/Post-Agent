/**
 * Utility per inviare notifiche WhatsApp a fine processo
 * - Recupera il token da DB (come per Instagram)
 * - Usa WhatsApp Cloud API per inviare messaggi (immagine+caption o testo di errore)
 */

const fetch = require('node-fetch');
const { getWhatsAppConfig } = require('../db/dbClient');
const { buildSuccessTemplate, buildFailureTemplate } = require('./whatsappTemplates');

/**
 * Invia una notifica WhatsApp con immagine e caption, oppure testo di errore.
 * @param {Object} payload
 * @param {'success'|'error'} payload.status
 * @param {string} [payload.imageUrl] - URL pubblico dell'immagine (Cloudinary)
 * @param {string} [payload.caption] - Didascalia/descrizione usata nel post
 * @param {string} [payload.originalPrompt] - Prompt originale
 * @param {string} [payload.refinedPrompt] - Prompt raffinato
 * @param {string} [payload.error] - Messaggio di errore in caso di failure
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendWhatsAppNotification({ status, imageUrl, caption, originalPrompt, refinedPrompt, error }) {
  try {
    const cfg = await getWhatsAppConfig();
    if (!cfg || !cfg.token) {
      return { success: false, error: 'Token WhatsApp non trovato nel DB' };
    }

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const to = process.env.WHATSAPP_TO;
    const graphVersion = (process.env.WHATSAPP_GRAPH_VERSION || 'v21.0').replace(/^v/, 'v');

    if (!phoneNumberId || !to) {
      return { success: false, error: 'WHATSAPP_PHONE_NUMBER_ID o WHATSAPP_TO non configurati' };
    }

    console.log('[WA] Notifica richiesta:', { status, hasImage: !!imageUrl });
    console.log('[WA] Config:', {
      graphVersion,
      phoneNumberId: phoneNumberId?.slice(-6),
      to: to?.slice(-6)
    });

    const messagesUrl = `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(phoneNumberId)}/messages`;

    // Se c'è un'immagine ed è un successo, inviamo direttamente con image.link e caption.
    // In fallback, inviamo un messaggio di testo.
    const tryImage = status === 'success' && imageUrl;

    const commonHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cfg.token}`
    };

    if (tryImage) {
      try {
        // Usa template centralizzato: 3 parametri body riempiti con lo stesso testo per compatibilità
        const successPayload = buildSuccessTemplate({
          to,
          imageUrl,
          language: 'it',
          textParams: [originalPrompt, refinedPrompt, caption]
        });
        const resLink = await fetch(messagesUrl, { method: 'POST', headers: commonHeaders, body: JSON.stringify(successPayload) });
        const linkText = await resLink.text();
        console.log('[WA] /messages (image.link) status:', resLink.status, resLink.statusText, linkText);
        if (resLink.ok) {
          return { success: true };
        }
      } catch (linkErr) {
        console.warn('[WA] Invio con image.link ha generato errore:', linkErr?.message || linkErr);
      }
      // Prosegui verso fallback testuale
    }
    else{
      console.log('[WA] Invio con testo per generazione fallita');
        failurePayload = buildFailureTemplate({
            to,
            language: 'it',
            textParams: [originalPrompt, refinedPrompt, error]
          });
          console.log('[WA] URL:', messagesUrl);
          const resLink = await fetch(messagesUrl, { method: 'POST', headers: commonHeaders, body: JSON.stringify(failurePayload) });
          console.log('[WA] /messages body:', failurePayload);
          const linkText = await resLink.text();
          console.log('[WA] /messages (text) status:', resLink.status, resLink.statusText, linkText);
          if (resLink.ok) {
            return { success: false };
          }
    }

    console.log('[WA] /messages (text) status:', res2.status, res2.statusText, res2Text);
    if (!res2.ok) {
      return { success: false, error: `Invio WhatsApp fallito: ${res2Text}` };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

module.exports = {
  sendWhatsAppNotification
};
