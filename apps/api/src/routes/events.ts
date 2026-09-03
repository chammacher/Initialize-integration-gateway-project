import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { createDatabasePool } from '@integration-gateway/database/src/index.js';

const bodySchema = z.record(z.any()).optional();

export async function eventsRoutes(app: FastifyInstance) {
  const pool = createDatabasePool();

  app.post('/v1/integrations/:source/events', async (request, reply) => {
    // Validate headers
    const idempotencyKey = (request.headers['x-idempotency-key'] as string) || '';
    if (!idempotencyKey) {
      reply.code(400);
      return { error: 'Missing X-Idempotency-Key header' };
    }

    const eventType = (request.headers['x-event-type'] as string) || 'unknown';
    const externalEventId = (request.headers['x-external-event-id'] as string) || null;

    // Validate body
    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'Invalid JSON body' };
    }

    const sourceKey = String(request.params.source);

    // Identify integration source
    const res = await pool.query(
      'SELECT id FROM integration_sources WHERE source_key = $1 AND status = $2',
      [sourceKey, 'active'],
    );

    if (!res.rowCount) {
      reply.code(404);
      return { error: 'Integration source not found' };
    }

    const sourceId = res.rows[0].id;

    // Store raw incoming event
    const id = randomUUID();
    await pool.query(
      `INSERT INTO incoming_events (id, source_id, external_event_id, idempotency_key, event_type, raw_payload)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, sourceId, externalEventId, idempotencyKey, eventType, parsed.success ? parsed.data : {}],
    );

    reply.code(202);
    return { status: 'accepted' };
  });
}
