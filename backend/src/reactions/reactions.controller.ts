import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ReactionsService } from './reactions.service.js';
import { ToggleReactionDto } from './dto/toggle-reaction.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';

@ApiTags('reactions')
@Controller('reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Toggle a reaction',
    description:
      'Creates, removes, or switches a like/dislike reaction for a post or comment.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reaction toggled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid reaction data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Missing or invalid Bearer token',
  })
  @ApiResponse({
    status: 404,
    description: 'Post or comment target not found',
  })
  async toggleReaction(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ToggleReactionDto,
  ) {
    return this.reactionsService.toggleReaction(user.userId, dto);
  }
}
