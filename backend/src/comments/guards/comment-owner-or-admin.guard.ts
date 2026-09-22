import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import type { AuthenticatedUser } from '../../auth/strategies/jwt.strategy.js';
import { CommentsService } from '../comments.service.js';

@Injectable()
export class CommentOwnerOrAdminGuard implements CanActivate {
  constructor(private readonly commentsService: CommentsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const user = request.user as AuthenticatedUser | undefined;
    const commentId = request.params?.id;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (user.role === 'admin') {
      return true;
    }

    const comment =
      await this.commentsService.findCommentByIdOrThrow(commentId);

    if (comment.authorId.toString() === user.userId) {
      return true;
    }

    throw new ForbiddenException(
      'You do not have permission to delete this comment',
    );
  }
}
