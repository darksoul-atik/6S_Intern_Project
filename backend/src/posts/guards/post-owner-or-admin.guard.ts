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
     * JwtAuthGuard should normally reject unauthenticated
     * requests before this guard runs.
     *
     * Keep this as a defensive check.
     */
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    /*
     * Admin override.
     *
     * Admins may manage any user's post.
     */
    if (user.role === 'admin') {
      return true;
    }

    /*
     * IMPORTANT:
     *
     * Use the ANY-post lookup here.
     *
     * The guard must be able to check ownership for:
     *
     * - active posts
     * - soft-deleted posts
     *
     * because restore and permanent-delete operate
     * on soft-deleted posts.
     */
    const post = await this.postsService.findAnyPostByIdOrThrow(postId);

    /*
     * Post author owns the resource.
     */
    if (post.authorId.toString() === user.userId) {
      return true;
    }

    throw new ForbiddenException(
      'You do not have permission to modify this post',
    );
  }
}
