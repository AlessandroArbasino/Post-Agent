// Error middleware/wrapper for Next.js route handlers that reports to Telegram
// Uses existing app/utils/telegramNotifier.js (CommonJS)

/**
 * Install global process-level error handlers once per process.
 * This will report unhandledRejection and uncaughtException to Telegram.
 */
const installGlobalErrorHandlers = () => {
  if (globalThis.__globalErrorHandlersInstalled) return;
  globalThis.__globalErrorHandlersInstalled = true;

  const report = async (title, err) => {
    try {
      const mod = await import('./telegramNotifier.js');
      const sendTelegramNotification = mod.sendTelegramNotification || (mod.default && mod.default.sendTelegramNotification);
      if (typeof sendTelegramNotification === 'function') {
        const errorText = err && err.stack ? err.stack : String(err);
        await sendTelegramNotification({
          status: 'error',
          error: `${title}: ${errorText}`,
        });
      }
    } catch (_) {
      // Swallow to avoid recursive failures
    }
  };

  process.on('unhandledRejection', (reason) => {
    report('unhandledRejection', reason);
  });
  process.on('uncaughtException', (error) => {
    report('uncaughtException', error);
  });
}

/**
 * Wrap a Next.js route handler to catch errors and report them to Telegram.
 * @param {(request: Request, ...rest:any[]) => Promise<Response>|Response} handler
 * @param {object} [options]
 * @param {string} [options.operation] Optional operation name for context
 */
const withErrorReporting = (handler, options = {}) => {
  const { operation } = options;
  return async function wrapped(request, ...rest) {
    try {
      return await handler(request, ...rest);
    } catch (err) {
      try {
        const mod = await import('./telegramNotifier.js');
        console.log('Telegram notification error (success path):4'); 

        const sendTelegramNotification = mod.sendTelegramNotification || (mod.default && mod.default.sendTelegramNotification);
        console.log('error', err); 
          await sendTelegramNotification({
                status: 'error',
                imageUrl: null,
                caption: null,
                originalPrompt: err.context?.originalPrompt,
                refinedPrompt: err.context?.refinedPrompt,
                error: err.message, 
                permalink: null,
                topicId: process.env.ERROR_LOGS_THREAD_ID
          });
      } catch (_) {
        // ignore notification errors
      }
      return new Response(
        JSON.stringify({ success: false, error: err?.message || 'Internal Server Error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}

module.exports = {
    installGlobalErrorHandlers,
    withErrorReporting
}
    