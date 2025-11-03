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
 * Upload an image to Cloudinary directly from URL (without buffering in memory)
 * @param {string} imageUrl - Image URL to upload
 * @param {Object} options - Upload options (folder, publicId)
 * @returns {Promise<{success:boolean, publicUrl?:string, cloudinaryData?:any, error?:string}>}
 */
const uploadToCloudinary = async (imageUrl, options = {}) => {
    const result = await cloudinary.uploader.upload(imageUrl, {
        resource_type: 'image',
        folder: options.folder || process.env.CLOUDINARY_FOLDER || undefined,
        public_id: options.publicId || undefined,
        overwrite: true,
    });

    console.log('✅ Cloudinary upload completed:', result.secure_url);
    return { success: true, publicUrl: result.secure_url, cloudinaryData: result };
};

module.exports = {
    uploadToCloudinary
};
