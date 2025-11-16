/**
 * Publishing to Instagram via Graph API
 * Handles media container creation and publishing
 */

const { getInstagramConfig } = require('../db/dbClient');
const { instagramCalculateRefreshToken, createInstagramMedia, fetchInstagramMedia, publishInstagramMedia,pollCreationStatus } = require('../utils/instagramUtility');
const { findEnvVariable } = require('./envUtils');

/**
 * Publish an image to Instagram
 * @param {string} imageUrl - Public image URL (must be accessible by Instagram)
 * @param {string} caption - Post caption
 * @param {boolean} isInstagramStories - Whether to publish to Instagram Stories
 * @returns {Promise<Object>} - Publishing result
 */
const publishToInstagram = async ({url, caption = '',mediaType = null, postToShareId = null,isVideo = false}) => {
    const graphVersion = process.env.INSTAGRAM_GRAPH_VERSION || 'v21.0';
    let instagramConfig = await getInstagramConfig();
    
    // Refresh token only if older than N days (DAYS_BETWEEN_TOKEN_REFRESH)
    await instagramCalculateRefreshToken(instagramConfig);

    const { creationId, mediaId, permalink } = await managePublish({token : instagramConfig.token,
        igUserId : findEnvVariable('IG_USER_ID'),
        graphVersion : graphVersion,
        url : url,
        caption : caption,
        postToShareId : postToShareId,
        mediaType : mediaType,
        isVideo : isVideo});

    return { success: true, mode: 'executed', creationId, mediaId, permalink, message: 'Instagram post published successfully' };
};

const publishCarouselToInstagram = async ({secondImageUrl, caption = ''}) => {
    const graphVersion = process.env.INSTAGRAM_GRAPH_VERSION || 'v21.0';
    let instagramConfig = await getInstagramConfig();

    // Refresh token only if older than N days (DAYS_BETWEEN_TOKEN_REFRESH)
    await instagramCalculateRefreshToken(instagramConfig);

    const defaultImageUrl = process.env.INSTAGRAM_DEFAULT_WINNING_IMAGE_URL;

    const { creationId, mediaId, permalink } = await manageCarouselPublish({token : instagramConfig.token,
        igUserId : findEnvVariable('IG_USER_ID'),
        graphVersion : graphVersion,
        imageUrls : [defaultImageUrl, secondImageUrl],
        caption : caption});

    return { success: true, mode: 'executed', creationId, mediaId, permalink, message: 'Instagram carousel published successfully' };
};

const managePublish = async({token, igUserId, graphVersion, url, caption, postToShareId = null, mediaType = null,isVideo = false}) => {
    // Step 1: Create media container
    const creationId = await createInstagramMedia({token : token, 
        igUserId : igUserId, 
        graphVersion : graphVersion, 
        url : url, 
        caption : caption,
        isCarouselItem : false, 
        mediaType : mediaType, 
        childrenIds : null,
        isVideo : isVideo});

    await pollCreationStatus({token : token,
        graphVersion : graphVersion,
        creationId : creationId});

    // Step 2: Publish media
    const mediaId = await publishInstagramMedia({token : token,
         igUserId : igUserId,
         graphVersion : graphVersion,
         creationId : creationId,
         postToShareId : postToShareId});

    // Step 3: Retrieve permalink of published media
    const fetchResponse = await fetchInstagramMedia({token : token,
         graphVersion : graphVersion,
         mediaId : mediaId,
         fields : 'permalink'});

    return { creationId, mediaId, permalink: fetchResponse.permalink };
}

const manageCarouselPublish = async ({token, igUserId, graphVersion, imageUrls, caption = ''}) => {
    const childrenIds = [];
    for (const url of imageUrls) {
        const id = await createInstagramMedia({token : token,
             igUserId : igUserId,
             graphVersion : graphVersion,
             isCarouselItem : true,
             url : url});
        childrenIds.push(id);
    }

    const creationId = await createInstagramMedia({token : token,
         igUserId : igUserId,
         graphVersion : graphVersion,
         mediaType : 'CAROUSEL',
         childrenIds : childrenIds,
         caption : caption});

    await pollCreationStatus({token : token,
        graphVersion : graphVersion,
        creationId : creationId});

    const mediaId = await publishInstagramMedia({token : token,
         igUserId : igUserId,
         graphVersion : graphVersion,
         creationId : creationId,
         caption : caption});

    const fetchResponse = await fetchInstagramMedia({token : token,
         graphVersion : graphVersion,
         mediaId : mediaId,
         fields : 'permalink'});

    return { creationId, mediaId, permalink: fetchResponse.permalink };
};

const fetchInstagramMetrics = async(mediaId) => {
  const graphVersion = process.env.IG_GRAPH_VERSION
  let instagramConfig = await getInstagramConfig();

  const fetchResponse = await fetchInstagramMedia({token : instagramConfig.token,
       graphVersion : graphVersion,
       mediaId : mediaId,
       fields : 'like_count,comments_count'});
  return {
    like_count: fetchResponse.like_count ?? 0,
    comments_count: fetchResponse.comments_count ?? 0,
  }
}


module.exports = {
    publishToInstagram,
    publishCarouselToInstagram,
    fetchInstagramMetrics
};
