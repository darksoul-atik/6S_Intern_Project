import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Post, PostSchema } from './schemas/post.schema.js';

import { PostsService } from './posts.service.js';
import { PostsController } from './posts.controller.js';

import { PostOwnerOrAdminGuard } from './guards/post-owner-or-admin.guard.js';
import { PostCleanupTask } from './tasks/post-cleanup.task.js';

import { UsersModule } from '../users/users.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    /*
     * Registers the Post Mongoose model.
     */
    MongooseModule.forFeature([
      {
        name: Post.name,
        schema: PostSchema,
      },
    ]),

    /*
     * PostsService uses UsersService for:
     *
     * create       → postsCount +1
     * soft delete  → postsCount -1
     * restore      → postsCount +1
     */
    UsersModule,

    /*
     * Reuse the existing authentication setup
     * and guards.
     */
    AuthModule,
  ],

  controllers: [PostsController],

  providers: [
    PostsService,

    /*
     * Author/admin authorization.
     */
    PostOwnerOrAdminGuard,

    /*
     * Hourly scheduled cleanup task.
     *
     * Once registered as a Nest provider,
     * its @Cron() method becomes active.
     */
    PostCleanupTask,
  ],

  /*
   * PostsService will be useful later for
   * comments, reactions, ranking and summarization.
   */
  exports: [PostsService, MongooseModule],
})
export class PostsModule {}
