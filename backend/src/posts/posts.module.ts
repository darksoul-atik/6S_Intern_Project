import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Post, PostSchema } from './schemas/post.schema.js';

import { PostsService } from './posts.service.js';
import { PostsController } from './posts.controller.js';

import { PostOwnerOrAdminGuard } from './guards/post-owner-or-admin.guard.js';
import { PostCleanupTask } from './tasks/post-cleanup.task.js';

import { UsersModule } from '../users/users.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { SummarizerModule } from '../summarizer/summarizer.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Post.name,
        schema: PostSchema,
      },
    ]),

    UsersModule,

    AuthModule,

    SummarizerModule,
  ],

  controllers: [PostsController],

  providers: [PostsService, PostOwnerOrAdminGuard, PostCleanupTask],

  exports: [PostsService, MongooseModule],
})
export class PostsModule {}
