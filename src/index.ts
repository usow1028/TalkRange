import { createServer } from 'http';
import { createApp } from './api.js';

const PORT = Number(process.env.PORT ?? 3333);

const app = createApp();

createServer(app).listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`TalkRange server listening on port ${PORT}`);
});
