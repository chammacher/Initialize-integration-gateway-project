import Fastify from 'fastify';
import { healthRoutes } from './routes/health.js';
import { eventsRoutes } from './routes/events.js';

export function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
  });

  app.register(healthRoutes);
  app.register(eventsRoutes);

  return app;
}
