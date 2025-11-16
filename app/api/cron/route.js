import { NextResponse } from 'next/server';
const {installGlobalErrorHandlers, withErrorReporting} = require('../../utils/errorMiddleware')
const { setPageName } = require('../../utils/envUtils');

export const runtime = 'nodejs';
export const maxDuration = 60;

// Install global error handlers once per process
installGlobalErrorHandlers();

async function handler() {
  try {
    // Import compatible with CommonJS (postHandler uses module.exports)
    const mod = await import('../../handlers/postHandler');
    const executeDailyPost = mod.executeDailyPost || (mod.default && mod.default.executeDailyPost);

    if (typeof executeDailyPost !== 'function') {
      throw new Error('executeDailyPost not available');
    }

    const imageOptions = {
      model: process.env.DEFAULT_MODEL,
      width: parseInt(process.env.GENERATED_IMAGE_WIDTH || '512', 10),
      height: parseInt(process.env.GENERATED_IMAGE_HEIGHT || '512', 10),
      steps: parseInt(process.env.GENERATED_IMAGE_STEPS || '15', 10),
      cfg: parseFloat(process.env.GENERATED_IMAGE_CFG || '5'),
      sampler: process.env.GENERATED_IMAGE_SAMPLER || 'euler',
      scheduler: process.env.GENERATED_IMAGE_SCHEDULER || 'normal'
    };

    const dailyPostCount = parseInt(process.env.DAILY_POST_NUMBER || '1', 10);
    let lastResult = null;

    for (let i = 0; i < dailyPostCount; i++) {
      // Esegue l'intera pipeline
      // eslint-disable-next-line no-await-in-loop
      setPageName('');
      lastResult = await executeDailyPost(imageOptions);
    }

    return NextResponse.json(lastResult ?? { success: true }, { status: 200 });
  } catch (err) {
    // Let withErrorReporting handle Telegram notification and response 500
    throw err;
  }
}

export const GET = await withErrorReporting(handler, { operation: 'cron' });
