import Fastify from 'fastify';
import { healthRoutes } from './routes/health.js';

export function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
  });

  app.register(healthRoutes);

  return app;
}
