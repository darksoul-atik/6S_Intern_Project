import { describe, it, expect } from 'vitest';
import { HealthService } from './health.service.js';
import type { Connection } from 'mongoose';

describe('HealthService', () => {
  it('should report connected status and connectionState 1 when mongoose readyState is 1', () => {
    const mockConnection = { readyState: 1 } as unknown as Connection;
    const service = new HealthService(mockConnection);

    const result = service.check();

    expect(result.success).toBe(true);
    expect(result.data.status).toBe('ok');
    expect(result.data.db).toBe('connected');
    expect(result.data.database.status).toBe('connected');
    expect(result.data.database.connectionState).toBe(1);
    expect(result.data.timestamp).toBeDefined();
    expect(new Date(result.data.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('should report disconnected status and connectionState 0 when mongoose readyState is 0', () => {
    const mockConnection = { readyState: 0 } as unknown as Connection;
    const service = new HealthService(mockConnection);

    const result = service.check();

    expect(result.success).toBe(true);
    expect(result.data.status).toBe('degraded');
    expect(result.data.db).toBe('disconnected');
    expect(result.data.database.status).toBe('disconnected');
    expect(result.data.database.connectionState).toBe(0);
    expect(result.data.timestamp).toBeDefined();
  });
});
