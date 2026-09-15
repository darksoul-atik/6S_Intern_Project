import { ApiProperty } from '@nestjs/swagger';

export class DatabaseHealthDto {
  @ApiProperty({
    description: 'Live database connection status',
    enum: ['connected', 'disconnected'],
    example: 'connected',
  })
  status: 'connected' | 'disconnected';

  @ApiProperty({
    description: 'Mongoose readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting',
    example: 1,
  })
  connectionState: number;
}

export class HealthDataDto {
  @ApiProperty({
    description: 'API operational status',
    example: 'ok',
  })
  status: string;

  @ApiProperty({
    description: 'Live database connection status (compact)',
    enum: ['connected', 'disconnected'],
    example: 'connected',
  })
  db: 'connected' | 'disconnected';

  @ApiProperty({
    description: 'Detailed database connection status',
    type: () => DatabaseHealthDto,
  })
  database: DatabaseHealthDto;

  @ApiProperty({
    description: 'Server timestamp in ISO 8601 format',
    example: '2026-09-15T08:00:00.000Z',
  })
  timestamp: string;
}

export class HealthResponseDto {
  @ApiProperty({
    description: 'Indicates whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Health diagnostic details',
    type: () => HealthDataDto,
  })
  data: HealthDataDto;
}

