import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('GET /health', () => {
  it('returns a healthy response', async () => {
    const app = buildApp();
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'ok',
      service: 'integration-gateway-api',
    });

    await app.close();
  });
});
