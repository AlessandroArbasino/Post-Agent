/**
 * Utility per costruire payload dei messaggi WhatsApp Cloud API
 */

/**
 * Costruisce un payload generico di tipo "template"
 * @param {Object} params
 * @param {string} params.to - Numero di destinazione in formato internazionale
 * @param {string} params.templateName - Nome del template approvato su WhatsApp
 * @param {string} [params.language='it'] - Codice lingua del template
 * @param {Array} params.components - Componenti del template (header/body/buttons...)
 */
function buildTemplateMessage({ to, templateName, language = 'it', components = [] }) {
  return {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: language },
      components
    }
  };
}

/**
 * Template helper: immagine nel header + testo nel body (fino a 3 parametri di testo)
 * Nota: Assicurati che il template "image_with_caption" accetti questi parametri.
 */
function buildSuccessTemplate({ to, imageUrl, textParams = [], language = 'it' }) {
  const bodyParameters = (textParams || []).slice(0, 3).map(t => ({ type: 'text', text: t }));

  return buildTemplateMessage({
    to,
    templateName: process.env.WHATSAPP_SUCCESS_TEMPLATE,
    language,
    components: [
      { type: 'header', parameters: [{ type: 'image', image: { link: imageUrl } }] },
      { type: 'body', parameters: bodyParameters }
    ]
  });
}

/**
 * Template helper: immagine nel header + testo nel body (fino a 3 parametri di testo)
 * Nota: Assicurati che il template "image_with_caption" accetti questi parametri.
 */
function buildFailureTemplate({ to, textParams = [], language = 'it' }) {
    const bodyParameters = (textParams || []).slice(0, 3).map(t => ({ type: 'text', text: t }));
    console.log('[WA] /messages body:', bodyParameters);
    console.log('[WA] /messages body String:', bodyParameters.toString());
    return buildTemplateMessage({
      to,
      templateName: process.env.WHATSAPP_FAILURE_TEMPLATE,
      language,
      components: [
        { type: 'body', parameters: bodyParameters}
      ]
    });
  }

/**
 * Costruisce un payload testuale semplice (fallback)
 */
function buildTextMessage({ to, textBody }) {
  return {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: textBody }
  };
}

module.exports = {
  buildSuccessTemplate,
  buildFailureTemplate
};
