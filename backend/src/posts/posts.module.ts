import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Post, PostSchema } from './schemas/post.schema.js';
import { PostsService } from './posts.service.js';
import { PostsController } from './posts.controller.js';
import { PostOwnerOrAdminGuard } from './guards/post-owner-or-admin.guard.js';

import { UsersModule } from '../users/users.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    /*
     * Register the Post model so PostsService can inject:
     *
     * @InjectModel(Post.name)
     */
    MongooseModule.forFeature([
      {
        name: Post.name,
        schema: PostSchema,
      },
    ]),

    /*
     * Needed because PostsService uses UsersService
     * for postsCount increment/decrement.
     *
     * Your current UsersModule already exports UsersService.
     */
    UsersModule,

    /*
     * Needed so this module can use the existing
     * JwtAuthGuard exported by AuthModule.
     */
    AuthModule,
  ],

  controllers: [PostsController],

  providers: [PostsService, PostOwnerOrAdminGuard],

  /*
   * Export PostsService because later features
   * such as comments/reactions may need it.
   */
  exports: [PostsService, MongooseModule],
})
export class PostsModule {}
