import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { ChangelogService } from './changelog.service.js';
import { SyncChangelogDto } from './dto/sync-changelog.dto.js';

@ApiTags('changelog')
@Controller('changelog')
export class ChangelogController {
  constructor(private readonly changelogService: ChangelogService) {}

  @Get()
  @ApiOperation({
    summary: 'Get changelog entries',
    description:
      'Retrieve up to 20 changelog entries synchronized from the latest merged pull requests targeting main.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 20,
    description: 'Max entries to return (default 20, max 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Changelog entries retrieved successfully',
  })
  async getChangelog(@Query('limit') limit?: number) {
    return this.changelogService.getEntries(limit ? Number(limit) : 20);
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Sync latest merged PR into changelog (Admin only)',
    description:
      'Fetches the latest merged pull request targeting main via the active provider and upserts it into MongoDB.',
  })
  @ApiResponse({
    status: 200,
    description: 'Changelog synchronized successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid repository name or format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Admin access required',
  })
  @ApiResponse({
    status: 502,
    description: 'Upstream GitHub authentication/network error',
  })
  @ApiResponse({
    status: 503,
    description: 'Upstream rate limited or provider misconfigured',
  })
  @ApiResponse({
    status: 504,
    description: 'Upstream operation timed out',
  })
  async syncChangelog(@Body() dto?: SyncChangelogDto) {
    return this.changelogService.syncLatestPullRequest(dto);
  }
}
