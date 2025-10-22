/**
 * Image upload to Cloudinary
 * Handles uploading from URL and returns the public URL
 */

const cloudinary = require('cloudinary').v2;

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

/**
 * Upload an image Buffer to Cloudinary
 * @param {Buffer} buffer - Image buffer
 * @param {Object} options - Upload options (folder, publicId)
 * @returns {Promise<Object>} - Object with upload details
 */
const uploadBufferToCloudinary = (buffer, options = {}) => {

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
                if (error) {
                    console.error('❌ Cloudinary upload error:', error);
                    return reject(error);
                }
                console.log('✅ Cloudinary upload completed:', result.secure_url);
                resolve(result);
            }
        );
        // Capture low-level stream errors
        stream.on && stream.on('error', (err) => {
            console.error('❌ Cloudinary stream error:', err);
        });
        try {
            stream.end(buffer);
        } catch (endErr) {
            console.error('❌ Error during stream.end(buffer):', endErr);
            reject(endErr);
        }
    });
};

/**
 * Upload an image to Cloudinary directly from URL (without buffering in memory)
 * @param {string} imageUrl - Image URL to upload
 * @param {Object} options - Upload options (folder, publicId)
 * @returns {Promise<{success:boolean, publicUrl?:string, cloudinaryData?:any, error?:string}>}
 */
const uploadToCloudinary = async (imageUrl, options = {}) => {
    try {
        const result = await cloudinary.uploader.upload(imageUrl, {
            resource_type: 'image',
            folder: options.folder || process.env.CLOUDINARY_FOLDER || undefined,
            public_id: options.publicId || undefined,
            overwrite: true,
        });

        console.log('✅ Cloudinary upload completed:', result.secure_url);
        return { success: true, publicUrl: result.secure_url, cloudinaryData: result };
    } catch (error) {
        console.error('❌ uploadToCloudinary error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    uploadToCloudinary,
    uploadBufferToCloudinary
};
