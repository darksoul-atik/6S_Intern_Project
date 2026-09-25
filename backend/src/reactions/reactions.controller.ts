import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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

import { ReactionsService } from './reactions.service.js';
import { ToggleReactionDto } from './dto/toggle-reaction.dto.js';
import type { ReactionTargetType } from './schemas/reaction.schema.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';

@ApiTags('reactions')
@Controller('reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user reactions',
    description:
      'Retrieves current user reaction types mapped by target ID, optionally filtered by target type and target IDs.',
  })
  @ApiQuery({
    name: 'targetType',
    required: false,
    enum: ['post', 'comment'],
  })
  @ApiQuery({
    name: 'targetIds',
    required: false,
    type: String,
    description: 'Comma-separated target IDs',
  })
  @ApiResponse({
    status: 200,
    description: 'User reactions retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid target type',
  })
  async getMyReactions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('targetIds') targetIds?: string,
    @Query('targetType') targetType?: string,
  ) {
    let parsedTargetType: ReactionTargetType | undefined;

    if (targetType !== undefined) {
      if (targetType !== 'post' && targetType !== 'comment') {
        throw new BadRequestException(
          'targetType must be either "post" or "comment"',
        );
      }

      parsedTargetType = targetType;
    }

    const ids = targetIds ? targetIds.split(',').filter(Boolean) : undefined;

    return this.reactionsService.getUserReactions(
      user.userId,
      ids,
      parsedTargetType,
    );
  }

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
