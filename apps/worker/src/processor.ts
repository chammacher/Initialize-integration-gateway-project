import { Worker } from 'bullmq';
import { createDatabasePool } from '@integration-gateway/database/src/index.js';
import { IncomingEventStatus } from '@integration-gateway/contracts';

const pool = createDatabasePool();

export function startWorker(redisUrl = process.env.REDIS_URL) {
  const worker = new Worker(
    'integration-events',
    async (job) => {
      const { eventId } = job.data as { eventId: string };

      const res = await pool.query('SELECT * FROM incoming_events WHERE id = $1', [eventId]);
      if (!res.rowCount) {
        throw new Error(`Event ${eventId} not found`);
      }

      await pool.query('UPDATE incoming_events SET processing_status = $1 WHERE id = $2', [IncomingEventStatus.PROCESSING, eventId]);

      // Placeholder processing
      // ... perform normalization/processing here later

      await pool.query('UPDATE incoming_events SET processing_status = $1, processed_at = NOW() WHERE id = $2', [IncomingEventStatus.COMPLETED, eventId]);
    },
    { connection: redisUrl ? { connection: redisUrl } as any : undefined },
  );

  worker.on('completed', (job) => {
    console.log('Job completed', job.id);
  });

  worker.on('failed', (job, err) => {
    console.error('Job failed', job?.id, err?.message);
  });

  return worker;
}
