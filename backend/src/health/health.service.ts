import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

export interface DatabaseHealth {
  status: 'connected' | 'disconnected';
  connectionState: number;
}

export interface HealthStatus {
  status: 'ok';
  db: 'connected' | 'disconnected';
  database: DatabaseHealth;
  timestamp: string;
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
    const readyState = this.connection?.readyState ?? 0;
    const isDbConnected = readyState === 1;

    return {
      success: true,
      data: {
        status: 'ok',
        db: isDbConnected ? 'connected' : 'disconnected',
        database: {
          status: isDbConnected ? 'connected' : 'disconnected',
          connectionState: readyState,
        },
        timestamp: new Date().toISOString(),
      },
    };
  }
}

