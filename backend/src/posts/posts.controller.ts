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
import { GetPostsQueryDto } from './dto/get-posts-query.dto.js';
import { SearchPostsQueryDto } from './dto/search-posts-query.dto.js';
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
  | latest:
  | createdAt DESC -> _id DESC
  |
  | top:
  | rankScore DESC -> createdAt DESC -> _id DESC
  |
  | most-discussed:
  | commentCount DESC -> createdAt DESC -> _id DESC
  |
  | If sort is omitted, latest is used.
  |
  | Soft-deleted Posts are automatically excluded
  | by PostsService.
  |--------------------------------------------------------------------------
  */

  @Get()
  @ApiOperation({
    summary: 'Get paginated posts',
    description:
      'Returns active posts using latest, top, or most-discussed ordering. The default sort is latest.',
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
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['top', 'latest', 'most-discussed'],
    example: 'latest',
    description:
      'Feed ordering. "latest" sorts by createdAt and _id. "top" sorts by rankScore, createdAt, and _id. "most-discussed" sorts by commentCount, createdAt, and _id.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated posts retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameter',
  })
  async getAllPosts(@Query() query: GetPostsQueryDto) {
    return this.postsService.findAllPosts({
      page: query.page,
      limit: query.limit,
      sort: query.sort,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Search Posts
  |--------------------------------------------------------------------------
  |
  | Public endpoint.
  |
  | Full-text search across post title and body.
  | Soft-deleted posts are excluded.
  |--------------------------------------------------------------------------
  */

  @Get('search')
  @ApiOperation({
    summary: 'Search posts',
    description:
      'Performs full-text search across active post titles and bodies. Results are ordered by text relevance.',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    example: 'react authentication',
    description: 'Search term. Must contain between 2 and 200 characters.',
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
    description: 'Number of search results per page. Maximum value is 50.',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid search query, page, or limit',
  })
  async searchPosts(@Query() query: SearchPostsQueryDto) {
    return this.postsService.searchPosts({
      q: query.q,
      page: query.page,
      limit: query.limit,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Get One Post
  |--------------------------------------------------------------------------
  |
  | Public endpoint.
  |
  | Soft-deleted Posts return 404.
  |--------------------------------------------------------------------------
  */

  @Get(':id')
  @ApiOperation({
    summary: 'Get a post by ID',
    description:
      'Returns one active post with safe public author information. Soft-deleted, invalid, or missing posts return 404.',
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
  | Author or admin only.
  |
  | Soft-deleted Posts cannot be updated.
  |--------------------------------------------------------------------------
  */

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PostOwnerOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a post',
    description:
      'Allows the original post author or an administrator to update the title or body of an active post.',
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
  | Restore Soft-Deleted Post
  |--------------------------------------------------------------------------
  |
  | POST /posts/:id/restore
  |
  | Author or admin only.
  |
  | Restore is allowed only within 5 days
  | of deletedAt.
  |--------------------------------------------------------------------------
  */

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, PostOwnerOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Restore a soft-deleted post',
    description:
      'Allows the original author or an administrator to restore a soft-deleted post within 5 days of deletion.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the post',
    example: '66e138fc29094e137127e4e0',
  })
  @ApiResponse({
    status: 201,
    description: 'Post restored successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Post is not soft-deleted or the 5-day restore period has expired',
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
  async restorePost(@Param('id') id: string) {
    return this.postsService.restorePost(id);
  }

  /*
  |--------------------------------------------------------------------------
  | Permanently Delete Soft-Deleted Post
  |--------------------------------------------------------------------------
  |
  | DELETE /posts/:id/permanent
  |
  | Author or admin only.
  |
  | The Post MUST already be soft-deleted.
  |--------------------------------------------------------------------------
  */

  @Delete(':id/permanent')
  @UseGuards(JwtAuthGuard, PostOwnerOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Permanently delete a soft-deleted post',
    description:
      'Permanently removes an already soft-deleted post. Active posts must be soft-deleted first.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the post',
    example: '66e138fc29094e137127e4e0',
  })
  @ApiResponse({
    status: 200,
    description: 'Post permanently deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Post must be soft-deleted first',
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
  async permanentlyDeletePost(@Param('id') id: string) {
    return this.postsService.permanentlyDeletePost(id);
  }

  /*
  |--------------------------------------------------------------------------
  | Soft Delete Post
  |--------------------------------------------------------------------------
  |
  | DELETE /posts/:id
  |
  | Author or admin only.
  |
  | This does NOT physically remove the document.
  |--------------------------------------------------------------------------
  */

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PostOwnerOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Soft-delete a post',
    description:
      'Soft-deletes an active post by setting deletedAt and deletedBy. The post may be restored within 5 days.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the post',
    example: '66e138fc29094e137127e4e0',
  })
  @ApiResponse({
    status: 200,
    description: 'Post soft-deleted successfully',
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
    description: 'Post not found or post is already soft-deleted',
  })
  async deletePost(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.postsService.removePost(id, user.userId);
  }
}
