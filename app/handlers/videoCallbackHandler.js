const { publishToInstagram } = require('../utils/publishToInstagram');
const { getVideoAssetIdByType, toggleVideoAsset } = require('../db/dbClient');
const { deleteAssetImage, deleteAssetvideo } = require('../utils/generateVideo');

const manageVideoCallback = async ({ videoUrl }) => {
  if (!videoUrl) {
    throw new Error('Missing field: video_url');
  }

  await publishToInstagram({ url: videoUrl, caption: '', mediaType: 'REELS', isVideo: true });

  const imageAssetId = await getVideoAssetIdByType({ type: process.env.HEYGEN_IMAGE_ASSET_TYPE });
  if (imageAssetId) {
    await deleteAssetImage({ imageAssetId });
  }

  const videoAssetId = await getVideoAssetIdByType({ type: process.env.HEYGEN_VIDEO_ASSET_TYPE });
  if (videoAssetId) {
    await deleteAssetvideo({ videoAssetId });
  }

  await toggleVideoAsset({ type: process.env.HEYGEN_VIDEO_ASSET_TYPE });
  await toggleVideoAsset({ type: process.env.HEYGEN_IMAGE_ASSET_TYPE });

  return { success: true };
};

module.exports = { manageVideoCallback };
