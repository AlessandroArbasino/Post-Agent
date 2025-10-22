import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET() {
  try {
    // Import compatible with CommonJS (postHandler uses module.exports)
    const mod = await import('../../handlers/postHandler');
    const executeDailyPost = mod.executeDailyPost || (mod.default && mod.default.executeDailyPost);

    if (typeof executeDailyPost !== 'function') {
      return NextResponse.json({ success: false, error: 'executeDailyPost not available' }, { status: 500 });
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
      lastResult = await executeDailyPost(imageOptions);
    }

    const status = lastResult?.success ? 200 : 500;
    return NextResponse.json(lastResult ?? { success: status === 200 }, { status });
  } catch (err) {
    return NextResponse.json({ success: false, error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
