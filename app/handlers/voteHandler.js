const { getAllImageForVoting } = require('../db/dbClient');
const { votingCron, publishWinner } = require('../utils/votingCron');

/**
 * Orchestrates the voting flow.
 * If no images were previously sent, triggers voting flow; otherwise publishes the winner.
 * @returns {Promise<{action:'voting'|'publish'} & Record<string, any>>}
 */
const voteHandler = async() => {
  const images = await getAllImageForVoting()
  const anySent = Array.isArray(images) && images.some((i) => i.sent_date)

  let result = null
  if (!anySent) {
    result = await votingCron(images)
  } else {
    result = await publishWinner()
  }

  return { action: anySent ? 'publish' : 'voting', ...result }
}

module.exports = { voteHandler };
  
