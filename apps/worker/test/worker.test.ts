import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockPool: any;
let storedEvents: any[];

vi.mock('@integration-gateway/database/src/index.js', () => ({
  createDatabasePool: () => mockPool,
}));

// Mock BullMQ Worker so we can invoke the processor directly in tests.
vi.mock('bullmq', () => ({
  Worker: class {
    processor: any;
    constructor(_queueName: string, processor: any, _opts: any) {
      this.processor = processor;
    }
    on() {}
    // helper used by tests to simulate a job
    async simulateJob(job: any) {
      return this.processor(job);
    }
  },
}));

function makePool() {
  return {
    query: async (sql: string, params: any[] = []) => {
      const normalized = sql.replace(/\s+/g, ' ').trim().toLowerCase();

      if (normalized.startsWith('select * from incoming_events where id =')) {
        const id = params[0];
        const ev = storedEvents.find((e) => e.id === id);
        return ev ? { rowCount: 1, rows: [ev] } : { rowCount: 0, rows: [] };
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

describe('worker processor', () => {
  beforeEach(() => {
    storedEvents = [{ id: 'evt-1', processing_status: 'received' }];
    mockPool = makePool();
  });

  it('processes a job and updates statuses', async () => {
    const { startWorker } = await import('../src/processor.js');
    const worker: any = startWorker();

    // simulate job invocation
    await worker.simulateJob({ data: { eventId: 'evt-1' } });

    expect(storedEvents[0].processing_status).toBe('completed');
  });
});
