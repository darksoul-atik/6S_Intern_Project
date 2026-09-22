import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Comment, CommentSchema } from './schemas/comment.schema.js';
import { CommentsService } from './comments.service.js';
import { CommentOwnerOrAdminGuard } from './guards/comment-owner-or-admin.guard.js';

import { AuthModule } from '../auth/auth.module.js';
import { PostsModule } from '../posts/posts.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Comment.name,
        schema: CommentSchema,
      },
    ]),
    AuthModule,
    PostsModule,
    UsersModule,
  ],

  providers: [CommentsService, CommentOwnerOrAdminGuard],

  exports: [CommentsService, MongooseModule],
})
export class CommentsModule {}
