import { beforeEach, describe, expect, it, vi } from 'vitest';

// We'll mock the database pool used by the events route so tests run fast.
let mockPool: any;
let storedEvents: any[];
let sources: Record<string, string>;

vi.mock('@integration-gateway/database/src/index.js', () => ({
  createDatabasePool: () => mockPool,
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

        // enforce uniqueness on (source_id, idempotency_key)
        const exists = storedEvents.find(
          (e) => e.source_id === sourceId && e.idempotency_key === idempotencyKey,
        );
        if (exists) {
          const err: any = new Error('duplicate key value violates unique constraint');
          err.code = '23505';
          throw err;
        }

        const row = { id, source_id: sourceId, external_event_id: externalEventId, idempotency_key: idempotencyKey, event_type: eventType, raw_payload: rawPayload };
        storedEvents.push(row);
        return { rowCount: 1 };
      }

      return { rowCount: 0, rows: [] };
    },
  };
}

describe('POST /v1/integrations/:source/events', () => {
  beforeEach(() => {
    storedEvents = [];
    sources = { 'test-source': '00000000-0000-0000-0000-000000000001', 'other-source': '00000000-0000-0000-0000-000000000002' };
    mockPool = makePool();
  });

  it('valid event returns 202', async () => {
    const { buildApp } = await import('../src/app.js');
    const app = buildApp();

    const res = await app.inject({
      method: 'POST',
      url: '/v1/integrations/test-source/events',
      headers: { 'content-type': 'application/json', 'x-idempotency-key': 'abc' },
      payload: { foo: 'bar' },
    });

    expect(res.statusCode).toBe(202);
    await app.close();
  });

  it('invalid payload returns 400', async () => {
    const { buildApp } = await import('../src/app.js');
    const app = buildApp();

    const res = await app.inject({
      method: 'POST',
      url: '/v1/integrations/test-source/events',
      headers: { 'content-type': 'application/json', 'x-idempotency-key': 'abc' },
      // send invalid JSON string as body via raw body
      body: 'not-json',
    });

    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('unknown source is rejected', async () => {
    const { buildApp } = await import('../src/app.js');
    const app = buildApp();

    const res = await app.inject({
      method: 'POST',
      url: '/v1/integrations/unknown-source/events',
      headers: { 'content-type': 'application/json', 'x-idempotency-key': 'abc' },
      payload: { foo: 'bar' },
    });

    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it('valid event is persisted correctly', async () => {
    const { buildApp } = await import('../src/app.js');
    const app = buildApp();

    const payload = { hello: 'world' };
    const res = await app.inject({
      method: 'POST',
      url: '/v1/integrations/test-source/events',
      headers: { 'content-type': 'application/json', 'x-idempotency-key': 'idemp-1', 'x-event-type': 'person.created' },
      payload,
    });

    expect(res.statusCode).toBe(202);
    expect(storedEvents.length).toBe(1);
    expect(storedEvents[0].idempotency_key).toBe('idemp-1');
    expect(storedEvents[0].raw_payload).toEqual(payload);
    expect(storedEvents[0].source_id).toBe(sources['test-source']);

    await app.close();
  });

  it('same idempotency key across different sources is allowed', async () => {
    const { buildApp } = await import('../src/app.js');
    const app = buildApp();

    const payload = { a: 1 };

    const res1 = await app.inject({
      method: 'POST',
      url: '/v1/integrations/test-source/events',
      headers: { 'content-type': 'application/json', 'x-idempotency-key': 'shared-key' },
      payload,
    });
    expect(res1.statusCode).toBe(202);

    const res2 = await app.inject({
      method: 'POST',
      url: '/v1/integrations/other-source/events',
      headers: { 'content-type': 'application/json', 'x-idempotency-key': 'shared-key' },
      payload,
    });
    expect(res2.statusCode).toBe(202);

    expect(storedEvents.length).toBe(2);
    await app.close();
  });
});
