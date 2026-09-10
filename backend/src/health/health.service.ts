import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

export interface HealthStatus {
  status: 'ok';
  db: 'connected' | 'disconnected';
}

export interface HealthResponse {
  success: boolean;
  data: HealthStatus;
}

@Injectable()
export class HealthService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  check(): HealthResponse {
    // Mongoose readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const isDbConnected = this.connection.readyState === 1;

    return {
      success: true,
      data: {
        status: 'ok',
        db: isDbConnected ? 'connected' : 'disconnected',
      },
    };
  }
}
