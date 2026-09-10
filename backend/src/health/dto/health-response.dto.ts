import { ApiProperty } from '@nestjs/swagger';

export class HealthDataDto {
  @ApiProperty({
    description: 'API operational status',
    example: 'ok',
  })
  status: string;

  @ApiProperty({
    description: 'Live database connection status',
    enum: ['connected', 'disconnected'],
    example: 'connected',
  })
  db: 'connected' | 'disconnected';
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
