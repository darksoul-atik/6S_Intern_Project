import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { resolve } from 'node:path';

import {
  RANKING_SEED_AUTHOR_ID,
  RANKING_SEED_POSTS,
} from '../posts/testing/ranking-seed.fixture.js';

import { Post, PostSchema } from '../posts/schemas/post.schema.js';

import { User, UserSchema } from '../users/schemas/user.schema.js';

dotenv.config({
  path: resolve(process.cwd(), '.env'),
});

const EXPECTED_DATABASE_NAME = 'devpulse_day13_seed';

async function cleanupRankingSeed(): Promise<void> {
  const mongoUri = process.env.RANKING_SEED_MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      'RANKING_SEED_MONGODB_URI is not defined. Refusing to use MONGODB_URI.',
    );
  }

  console.log('Connecting to ranking seed database...');

  await mongoose.connect(mongoUri);

  const connectedDatabaseName = mongoose.connection.name;

  if (connectedDatabaseName !== EXPECTED_DATABASE_NAME) {
    throw new Error(
      `Safety check failed. Expected database "${EXPECTED_DATABASE_NAME}" but connected to "${connectedDatabaseName}". No data was deleted.`,
    );
  }

  console.log(`Safety check passed. Connected to "${connectedDatabaseName}".`);

  const UserModel =
    mongoose.models[User.name] || mongoose.model(User.name, UserSchema);

  const PostModel =
    mongoose.models[Post.name] || mongoose.model(Post.name, PostSchema);

  const seedPostIds = RANKING_SEED_POSTS.map((post) => post._id);

  const postDeleteResult = await PostModel.deleteMany({
    _id: {
      $in: seedPostIds,
    },
  });

  const userDeleteResult = await UserModel.deleteOne({
    _id: RANKING_SEED_AUTHOR_ID,
  });

  console.log(`Deleted ${postDeleteResult.deletedCount} ranking seed posts.`);

  console.log(`Deleted ${userDeleteResult.deletedCount} ranking seed user.`);
}

cleanupRankingSeed()
  .then(async () => {
    await mongoose.disconnect();

    console.log('Ranking seed cleanup completed successfully.');
  })
  .catch(async (error) => {
    console.error('Ranking seed cleanup failed:', error);

    await mongoose.disconnect();

    process.exitCode = 1;
  });
