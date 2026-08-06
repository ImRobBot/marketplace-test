import { createApp, initializeApp } from './app';
import { logger } from './logger';

const port = Number(process.env.PORT || 4000);
const app = createApp();

initializeApp()
  .then(() => {
    app.listen(port, () => {
      logger.info({ port }, 'Server listening');
    });
  })
  .catch((error: unknown) => {
    logger.error({ err: error }, 'DB init failed');
    process.exit(1);
  });
