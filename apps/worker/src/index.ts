console.log(
  JSON.stringify({
    level: 'info',
    service: 'integration-gateway-worker',
    message: 'Worker process started',
    timestamp: new Date().toISOString(),
  }),
);

// Queue registration will be added when event ingestion is implemented.
