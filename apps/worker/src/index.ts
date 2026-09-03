console.log(
  JSON.stringify({
    level: 'info',
    service: 'integration-gateway-worker',
    message: 'Worker process started',
    timestamp: new Date().toISOString(),
  }),
);

import { startWorker } from './processor.js';

startWorker();
