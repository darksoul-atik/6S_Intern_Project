import { describe, it, expect } from 'vitest';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';
import { ServiceUnavailableException } from '@nestjs/common';
import type { Connection } from 'mongoose';

describe('HealthController', () => {
  it('should return health response when database is connected', () => {
    const mockConnection = { readyState: 1 } as unknown as Connection;
    const service = new HealthService(mockConnection);
    const controller = new HealthController(service);

    const result = controller.getHealth();
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('ok');
    expect(result.data.db).toBe('connected');
  });

  it('should throw ServiceUnavailableException (503) when database is disconnected', () => {
    const mockConnection = { readyState: 0 } as unknown as Connection;
    const service = new HealthService(mockConnection);
    const controller = new HealthController(service);

    expect(() => controller.getHealth()).toThrow(ServiceUnavailableException);
  });
});
