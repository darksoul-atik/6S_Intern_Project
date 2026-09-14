import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/strategies/jwt.strategy.js';

@Injectable()
export class ProfileOwnerOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;
    const targetUserId = request.params?.id;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (user.role === 'admin') {
      return true;
    }

    if (!targetUserId || user.userId === targetUserId) {
      return true;
    }

    throw new ForbiddenException(
      'You do not have permission to modify this profile',
    );
  }
}
