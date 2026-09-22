import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CommentsService } from './comments.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { CommentOwnerOrAdminGuard } from './guards/comment-owner-or-admin.guard.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';

@ApiTags('comments')
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('posts/:postId/comments')
  @ApiOperation({
    summary: 'Get comments for a post',
    description:
      'Returns top-level comments with their flat replies. Maximum reply depth is 1.',
  })
  @ApiParam({
    name: 'postId',
    description: 'MongoDB ObjectId of the post',
  })
  @ApiResponse({
    status: 200,
    description: 'Comments retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  async getComments(@Param('postId') postId: string) {
    return this.commentsService.findCommentsByPost(postId);
  }

  @Post('posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a top-level comment',
  })
  @ApiParam({
    name: 'postId',
    description: 'MongoDB ObjectId of the post',
  })
  @ApiResponse({
    status: 201,
    description: 'Comment created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid comment data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  async createComment(
    @Param('postId') postId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.createComment(postId, user.userId, dto);
  }

  @Post('posts/:postId/comments/:commentId/replies')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reply to a top-level comment',
    description:
      'Replies are limited to one level. A reply cannot have child replies.',
  })
  @ApiParam({
    name: 'postId',
    description: 'MongoDB ObjectId of the post',
  })
  @ApiParam({
    name: 'commentId',
    description: 'MongoDB ObjectId of the parent comment',
  })
  @ApiResponse({
    status: 201,
    description: 'Reply created successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Parent belongs to another post or maximum reply depth exceeded',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Post or parent comment not found',
  })
  async createReply(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.createReply(
      postId,
      commentId,
      user.userId,
      dto,
    );
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard, CommentOwnerOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a comment',
    description:
      'Deleting a reply removes only that reply. Deleting a top-level comment removes the entire thread.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the comment',
  })
  @ApiResponse({
    status: 200,
    description: 'Comment deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'User does not own the comment and is not an admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Comment not found',
  })
  async deleteComment(@Param('id') id: string) {
    return this.commentsService.deleteComment(id);
  }
}
