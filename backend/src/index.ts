import { createApp, initializeApp } from './app';

const port = Number(process.env.PORT || 4000);
const app = createApp();

initializeApp()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((error: unknown) => {
    console.error('DB init failed', error);
    process.exit(1);
  });
