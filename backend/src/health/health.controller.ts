import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService, type HealthResponse } from './health.service.js';
import { HealthResponseDto } from './dto/health-response.dto.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Check live API and database connection status',
    description:
      'Inspects live Mongoose connection state and reports backend health status.',
  })
  @ApiResponse({
    status: 200,
    description: 'System health status retrieved successfully',
    type: HealthResponseDto,
  })
  getHealth(): HealthResponse {
    return this.healthService.check();
  }
}

