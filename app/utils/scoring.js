const { fetchInstagramMetrics } = require('./publishToInstagram')
const { getAllImageForVoting } = require('../db/dbClient')

function getMultiplier(name, fallback, def = 1) {
  const v = process.env[name] ?? (fallback ? process.env[fallback] : undefined)
  const n = Number(v)
  return Number.isFinite(n) ? n : def
}

const LIKE_MULT = getMultiplier('SCORE_LIKE_MULTIPLIER', 'IG_LIKE_MULTIPLIER', 1)
const COMMENT_MULT = getMultiplier('SCORE_COMMENT_MULTIPLIER', 'IG_COMMENT_MULTIPLIER', 1)
const VOTE_MULT = getMultiplier('SCORE_VOTE_MULTIPLIER', 'IG_VOTE_MULTIPLIER', 1)

/**
 * Compute score for each item using IG metrics and votes.
 * Score = like_count*LIKE_MULT + comments_count*COMMENT_MULT + votes*VOTE_MULT.
 * @param {Array<{instagram_post_id?:string, votes?:number}>} items - Items to score
 * @returns {Promise<Array<any>>} - Items augmented with like_count, comments_count, score
 */
export async function scoreItems(items) {
  const results = await Promise.all(
    items.map(async (it) => {
      let like_count = 0
      let comments_count = 0
      if (it.instagram_post_id) {
        try {
          const m = await fetchInstagramMetrics(it.instagram_post_id)
          like_count = m.like_count ?? 0
          comments_count = m.comments_count ?? 0
        } catch {
          like_count = 0
          comments_count = 0
        }
      }
      const score = like_count * LIKE_MULT + comments_count * COMMENT_MULT + (it.votes ?? 0) * VOTE_MULT
      return { image_url: it.image_url, like_count, comments_count, score }
    })
  )
  return results
}

/**
 * Return the highest scored item from a list.
 * Uses `scoreItems()` and selects the item with max `score`.
 * @returns {Promise<any>} - Best item
 */
export async function getBestPhoto() {
  const picture = await getAllImageForVoting()
  if (!picture || picture.length === 0) throw new Error('No images available to publish')
  const scored = await scoreItems(picture)
  let best = null
  for (const s of scored) {
    if (!best || s.score > best.score) best = s
  }
  return best
}
