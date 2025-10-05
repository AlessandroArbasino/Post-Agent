const { executeDailyPost } = require('../../../handlers/postHandler');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }
  try {
    const imageOptions = {
      model: process.env.DEFAULT_MODEL,
    };
    const result = await executeDailyPost(imageOptions);
    const status = result?.success ? 200 : 500;
    return res.status(status).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || 'Internal Error' });
  }
}
