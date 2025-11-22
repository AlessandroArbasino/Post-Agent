import sharp from 'sharp';
import { Buffer } from 'buffer';

/**
 * Converte un Buffer contenente dati WebP in un Buffer PNG.
 * @param {Buffer} webpBuffer - Il Buffer contenente l'immagine WebP.
 * @returns {Promise<Buffer>} Un Buffer contenente l'immagine PNG.
 */
async function convertWebPToPng(webpBuffer) {
    const pngBuffer = await sharp(webpBuffer)
      .png({
        palette: true, 
        compressionLevel: 9
      })
      .toBuffer();

    return pngBuffer;

}


export { convertWebPToPng };
