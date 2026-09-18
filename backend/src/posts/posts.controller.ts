import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { PostsService } from './posts.service.js';

import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';

import { PostOwnerOrAdminGuard } from './guards/post-owner-or-admin.guard.js';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /*
  |--------------------------------------------------------------------------
  | Create Post
  |--------------------------------------------------------------------------
  |
  | Authentication required.
  |
  | authorId comes from the authenticated JWT user,
  | NOT from the request body.
  |--------------------------------------------------------------------------
  */

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new post',
    description:
      'Creates a post for the currently authenticated user. The author is determined from the authenticated JWT.',
  })
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid post data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Missing or invalid Bearer token',
  })
  async createPost(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePostDto,
  ) {
    return this.postsService.createPost(user.userId, dto);
  }

  /*
  |--------------------------------------------------------------------------
  | List Posts
  |--------------------------------------------------------------------------
  |
  | Public endpoint.
  |
  | Example:
  | GET /posts?page=1&limit=10
  |--------------------------------------------------------------------------
  */

  @Get()
  @ApiOperation({
    summary: 'Get paginated posts',
    description:
      'Returns posts ordered from newest to oldest with pagination metadata and safe public author information.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number. Minimum value is 1.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Number of posts per page. Maximum value is 100.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated posts retrieved successfully',
  })
  async getAllPosts(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    /*
     * Follow the same pagination style already used
     * by UsersController.
     */
    const pageNum = Math.max(1, parseInt(page, 10) || 1);

    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    return this.postsService.findAllPosts({
      page: pageNum,
      limit: limitNum,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Get One Post
  |--------------------------------------------------------------------------
  |
  | Public endpoint.
  |--------------------------------------------------------------------------
  */

  @Get(':id')
  @ApiOperation({
    summary: 'Get a post by ID',
    description:
      'Returns one post with safe public author information. Invalid or missing post IDs return 404.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the post',
    example: '66e138fc29094e137127e4e0',
  })
  @ApiResponse({
    status: 200,
    description: 'Post retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  async getPost(@Param('id') id: string) {
    return this.postsService.findOnePost(id);
  }

  /*
  |--------------------------------------------------------------------------
  | Update Post
  |--------------------------------------------------------------------------
  |
  | Only:
  | - original author
  | - admin
  |
  | can update the post.
  |--------------------------------------------------------------------------
  */

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PostOwnerOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a post',
    description:
      'Allows the original post author or an administrator to update the post title or body.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the post',
    example: '66e138fc29094e137127e4e0',
  })
  @ApiResponse({
    status: 200,
    description: 'Post updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid post data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Missing or invalid Bearer token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: User does not own the post and is not an admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  async updatePost(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.postsService.updatePost(id, dto);
  }

  /*
  |--------------------------------------------------------------------------
  | Delete Post
  |--------------------------------------------------------------------------
  |
  | Only:
  | - original author
  | - admin
  |
  | can delete.
  |--------------------------------------------------------------------------
  */

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PostOwnerOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a post',
    description:
      'Hard deletes a post. Only the original author or an administrator may delete it.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the post',
    example: '66e138fc29094e137127e4e0',
  })
  @ApiResponse({
    status: 200,
    description: 'Post deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Missing or invalid Bearer token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: User does not own the post and is not an admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  async deletePost(@Param('id') id: string) {
    return this.postsService.removePost(id);
  }
}
