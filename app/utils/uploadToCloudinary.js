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

/**
 * Delete a Cloudinary folder by path.
 * @param {string} path - Cloudinary folder path to delete
 * @returns {Promise<any>} - Cloudinary API response
 */
const deleteFolder = async (path) => {
  return cloudinary.api.delete_folder(path)
}

// Build a Cloudinary fetch URL with a bottom-left text label overlay.
// This avoids local image processing and works on Vercel.
/**
 * Create a Cloudinary fetch URL with a bottom-left text label overlay.
 * @param {string} url - Public image URL to transform (fetched by Cloudinary)
 * @param {string|number} label - Text label (number/hash) to overlay
 * @param {Object} [opts]
 * @param {number} [opts.size=512] - Target square size (width/height)
 * @param {number} [opts.margin=12] - Margin from the bottom-left corner
 * @param {number} [opts.fontSize=28] - Overlay font size
 * @param {string} [opts.fontFamily='Arial'] - Overlay font family
 * @param {string} [opts.fontWeight='bold'] - Overlay font weight
 * @param {string} [opts.textColor='white'] - Overlay text color
 * @returns {Promise<string>} - Signed Cloudinary fetch URL with transformations
 */
const labeledImageUrl = async (url, label, opts = {}) => {
  const size = opts.size ?? 512
  const margin = opts.margin ?? 12
  const fontSize = opts.fontSize ?? 28
  const fontFamily = opts.fontFamily ?? 'Arial'
  const fontWeight = opts.fontWeight ?? 'bold'
  const textColor = opts.textColor ?? 'white'

  const transformation = [
    { width: size, height: size, crop: 'fill' },
    {
      overlay: {
        font_family: fontFamily,
        font_weight: fontWeight,
        font_size: fontSize,
        text: `#${label}`,
      },
      color: textColor,
      gravity: 'south_west',
      x: margin,
      y: margin,
    },
  ]

  return cloudinary.url(url, {
    type: 'fetch',
    secure: true,
    transformation,
  })
}

module.exports = {
    uploadToCloudinary,
    deleteFolder,
    labeledImageUrl
};
