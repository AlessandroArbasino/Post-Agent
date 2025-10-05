/**
 * Upload di immagini a Cloudinary
 * Gestisce il caricamento da URL e restituisce l'URL pubblico
 */

const fetch = require('node-fetch');
const cloudinary = require('cloudinary').v2;
const config = require('../config');

// Configurazione Cloudinary
cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true
});

/**
 * Carica un'immagine da Buffer a Cloudinary
 * @param {Buffer} buffer - Buffer dell'immagine
 * @param {Object} options - Opzioni di upload (folder, publicId)
 * @returns {Promise<Object>} - Oggetto con i dettagli dell'upload
 */
const uploadBufferToCloudinary = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'image',
                folder: options.folder || process.env.CLOUDINARY_FOLDER || undefined,
                public_id: options.publicId || undefined,
                overwrite: true
            },
            (error, result) => {
                if (error) {
                    console.error('❌ Errore upload Cloudinary:', error);
                    return reject(error);
                }
                console.log('✅ Upload Cloudinary completato:', result.secure_url);
                resolve(result);
            }
        );
        stream.end(buffer);
    });
};

/**
 * Scarica un'immagine da URL e la carica su Cloudinary
 * @param {string} imageUrl - URL dell'immagine da caricare
 * @param {Object} options - Opzioni di upload
 * @returns {Promise<string>} - URL pubblico dell'immagine caricata
 */
const uploadToCloudinary = async (imageUrl, options = {}) => {
    try {
        console.log(`📤 Download immagine da: ${imageUrl}`);
        
        // Scarica l'immagine
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Errore download immagine: ${response.status} ${response.statusText}`);
        }
        
        const buffer = await response.buffer();
        console.log(`📦 Immagine scaricata, dimensione: ${buffer.length} bytes`);
        
        // Upload a Cloudinary
        const uploadResult = await uploadBufferToCloudinary(buffer, options);
        
        return {
            success: true,
            publicUrl: uploadResult.secure_url,
            cloudinaryData: uploadResult
        };
        
    } catch (error) {
        console.error('❌ Errore uploadToCloudinary:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    uploadToCloudinary,
    uploadBufferToCloudinary
};
