import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import type { AuthenticatedUser } from '../../auth/strategies/jwt.strategy.js';
import { PostsService } from '../posts.service.js';

@Injectable()
export class PostOwnerOrAdminGuard implements CanActivate {
  constructor(private readonly postsService: PostsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const user = request.user as AuthenticatedUser | undefined;

    const postId = request.params?.id;

    /*
     * Normally JwtAuthGuard handles missing authentication first.
     *
     * This is still a safety check, following the same pattern
     * already used by ProfileOwnerOrAdminGuard.
     */
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    /*
     * Admin override.
     *
     * Admins are allowed to edit/delete any post.
     */
    if (user.role === 'admin') {
      return true;
    }

    /*
     * For normal users, find the post so we can check
     * who actually owns it.
     *
     * findPostByIdOrThrow() also handles:
     * - malformed IDs
     * - nonexistent posts
     */
    const post = await this.postsService.findPostByIdOrThrow(postId);

    /*
     * MongoDB stores authorId as ObjectId.
     * JWT userId is a string.
     *
     * Convert ObjectId to string before comparing.
     */
    if (post.authorId.toString() === user.userId) {
      return true;
    }

    throw new ForbiddenException(
      'You do not have permission to modify this post',
    );
  }
}
