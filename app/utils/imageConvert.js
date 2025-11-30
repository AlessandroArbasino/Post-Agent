const sharp = require('sharp');
const { Buffer } = require('buffer');

/**
 * Converte un Buffer contenente dati WebP in un Buffer PNG.
 * @param {Buffer} webpBuffer - Il Buffer contenente l'immagine WebP.
 * @returns {Promise<Buffer>} Un Buffer contenente l'immagine PNG.
 */
const convertWebPToPng = async (webpBuffer) => {
    const pngBuffer = await sharp(webpBuffer)
      .png({
        palette: true, 
        compressionLevel: 9
      })
      .toBuffer();

    return pngBuffer;

}

module.exports = { convertWebPToPng };
