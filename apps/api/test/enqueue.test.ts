import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockPool: any;
let storedEvents: any[];
let sources: Record<string, string>;

vi.mock('@integration-gateway/database/src/index.js', () => ({
  createDatabasePool: () => mockPool,
}));

const mockAdd = vi.fn();
vi.mock('bullmq', () => ({
  Queue: class {
    constructor() {}
    add = (...args: any[]) => mockAdd(...args);
  },
}));

function makePool() {
  return {
    query: async (sql: string, params: any[] = []) => {
      const normalized = sql.replace(/\s+/g, ' ').trim().toLowerCase();

      if (normalized.startsWith('select id from integration_sources')) {
        const key = params[0];
        if (key && sources[key]) {
          return { rowCount: 1, rows: [{ id: sources[key] }] };
        }
        return { rowCount: 0, rows: [] };
      }

      if (normalized.startsWith('insert into incoming_events')) {
        const [id, sourceId, externalEventId, idempotencyKey, eventType, rawPayload] = params;

        const exists = storedEvents.find(
          (e) => e.source_id === sourceId && e.idempotency_key === idempotencyKey,
        );
        if (exists) {
          const err: any = new Error('duplicate key value violates unique constraint');
          err.code = '23505';
          throw err;
        }

        const row: any = { id, source_id: sourceId, external_event_id: externalEventId, idempotency_key: idempotencyKey, event_type: eventType, raw_payload: rawPayload, processing_status: 'received' };
        storedEvents.push(row);
        return { rowCount: 1 };
      }

      if (normalized.startsWith('update incoming_events set processing_status')) {
        const [status, id] = params;
        const ev = storedEvents.find((e) => e.id === id);
        if (ev) ev.processing_status = status;
        return { rowCount: ev ? 1 : 0 };
      }

      return { rowCount: 0, rows: [] };
    },
  };
}

describe('enqueue behavior', () => {
  beforeEach(() => {
    storedEvents = [];
    sources = { 'test-source': '00000000-0000-0000-0000-000000000001' };
    mockPool = makePool();
    mockAdd.mockReset();
  });

  it('queues event successfully', async () => {
    mockAdd.mockResolvedValue({});
    const { buildApp } = await import('../src/app.js');
    const app = buildApp();

    const res = await app.inject({
      method: 'POST',
      url: '/v1/integrations/test-source/events',
      headers: { 'content-type': 'application/json', 'x-idempotency-key': 'abc' },
      payload: { foo: 'bar' },
    });

    expect(res.statusCode).toBe(202);
    const body = res.json();
    expect(body.status).toBe('queued');
    expect(storedEvents.length).toBe(1);
    expect(storedEvents[0].processing_status).toBe('queued');
    await app.close();
  });

  it('handles queue failure gracefully', async () => {
    mockAdd.mockRejectedValue(new Error('redis down'));
    const { buildApp } = await import('../src/app.js');
    const app = buildApp();

    const res = await app.inject({
      method: 'POST',
      url: '/v1/integrations/test-source/events',
      headers: { 'content-type': 'application/json', 'x-idempotency-key': 'abc' },
      payload: { foo: 'bar' },
    });

    expect(res.statusCode).toBe(503);
    expect(storedEvents.length).toBe(1);
    expect(storedEvents[0].processing_status).toBe('queue_failed');
    await app.close();
  });
});
