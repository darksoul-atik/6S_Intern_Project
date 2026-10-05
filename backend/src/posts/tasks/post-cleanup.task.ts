import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PostsService } from '../posts.service.js';

@Injectable()
export class PostCleanupTask {
  private readonly logger = new Logger(PostCleanupTask.name);

  constructor(private readonly postsService: PostsService) {}

  /*
  |--------------------------------------------------------------------------
  | Purge Expired Soft-Deleted Posts
  |--------------------------------------------------------------------------
  |
  | Runs once every hour.
  |
  | PostsService contains the actual cleanup rule:
  | deletedAt older than 5 days → permanent deletion.
  |--------------------------------------------------------------------------
  */

  @Cron(CronExpression.EVERY_HOUR)
  async purgeExpiredPosts(): Promise<void> {
    try {
      const deletedCount = await this.postsService.purgeExpiredDeletedPosts();

      /*
       * Avoid filling logs every hour when
       * there was nothing to clean up.
       */
      if (deletedCount > 0) {
        this.logger.log(
          `Permanently deleted ${deletedCount} expired soft-deleted post(s).`,
        );
      }
    } catch {
      /*
       * Do not log the raw exception message here.
       *
       * Raw database errors may contain connection details,
       * internal provider information, or implementation details.
       *
       * The scheduled job should fail safely without crashing
       * the application.
       */
      this.logger.error('Failed to purge expired soft-deleted posts.');
    }
  }
}
