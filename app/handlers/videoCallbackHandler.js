const { publishToInstagram } = require('../services/instagram/publisher');
const { getVideoAssetIdByType, toggleVideoAsset } = require('../db/dbClient');
const { deleteAssetImage, deleteAssetvideo } = require('../services/heygen/videoGenerator');

/**
 * Manages the callback from HeyGen when video generation is complete.
 * Publishes the video to Instagram as a Reel and cleans up HeyGen assets.
 * @param {Object} params - Callback parameters
 * @param {string} params.videoUrl - URL of the generated video
 * @returns {Promise<{success: boolean}>} Success status
 * @throws {Error} If videoUrl is missing
 */
const manageVideoCallback = async ({ videoUrl }) => {
  console.log('Video URL:', videoUrl);

  const imageAssetId = await getVideoAssetIdByType({ type: process.env.HEYGEN_IMAGE_ASSET_TYPE });
  const videoAssetId = await getVideoAssetIdByType({ type: process.env.HEYGEN_VIDEO_ASSET_TYPE });

  console.log('Image Asset ID:', imageAssetId);
  console.log('Video Asset ID:', videoAssetId);

  //Heygen calls the callback multiple times, so we need to check if the video is already published
  if (imageAssetId && videoAssetId) {
    await publishToInstagram({ url: videoUrl, caption: '', mediaType: 'REELS', isVideo: true });
  } else {
    console.log('Video already published');
  }


  if (imageAssetId) {
    await deleteAssetImage({ imageAssetId });
  }


  if (videoAssetId) {
    await deleteAssetvideo({ videoAssetId });
  }

  await toggleVideoAsset({ type: process.env.HEYGEN_VIDEO_ASSET_TYPE });
  await toggleVideoAsset({ type: process.env.HEYGEN_IMAGE_ASSET_TYPE });

  return { success: true };
};

module.exports = { manageVideoCallback };
