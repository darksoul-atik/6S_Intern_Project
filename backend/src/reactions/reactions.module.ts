import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Reaction, ReactionSchema } from './schemas/reaction.schema.js';

import { ReactionsService } from './reactions.service.js';

import { AuthModule } from '../auth/auth.module.js';
import { PostsModule } from '../posts/posts.module.js';
import { CommentsModule } from '../comments/comments.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Reaction.name,
        schema: ReactionSchema,
      },
    ]),

    AuthModule,
    PostsModule,
    CommentsModule,
  ],

  controllers: [],

  providers: [ReactionsService],

  exports: [ReactionsService, MongooseModule],
})
export class ReactionsModule {}
