import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: false, description: 'Indicates operation failed' })
  success: boolean;

  @ApiProperty({ example: 500, description: 'Standard HTTP status code' })
  statusCode: number;

  @ApiProperty({
    example: 'Database connection failed or service unavailable',
    description: 'Human-readable error description',
  })
  message: string;

  @ApiProperty({
    example: [],
    description: 'List of granular validation or system error messages',
    type: [String],
  })
  errors: string[];
}
