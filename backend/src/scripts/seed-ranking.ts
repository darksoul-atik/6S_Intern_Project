import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
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

async function seedRankingData(): Promise<void> {
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
      `Safety check failed. Expected database "${EXPECTED_DATABASE_NAME}" but connected to "${connectedDatabaseName}". No seed data was written.`,
    );
  }

  console.log(`Safety check passed. Connected to "${connectedDatabaseName}".`);

  const UserModel =
    mongoose.models[User.name] || mongoose.model(User.name, UserSchema);

  const PostModel =
    mongoose.models[Post.name] || mongoose.model(Post.name, PostSchema);

  /*
   * Remove only our known Day 13 seed records first.
   * This makes the seed script safe to run more than once.
   */
  const seedPostIds = RANKING_SEED_POSTS.map((post) => post._id);

  await PostModel.deleteMany({
    _id: {
      $in: seedPostIds,
    },
  });

  await UserModel.deleteOne({
    _id: RANKING_SEED_AUTHOR_ID,
  });

  /*
   * Create one controlled author so populate(authorId)
   * works during manual API verification.
   */
  const randomPassword = randomBytes(32).toString('hex');
  const passwordHash = await bcrypt.hash(randomPassword, 10);

  await UserModel.create({
    _id: RANKING_SEED_AUTHOR_ID,
    name: 'Day 13 Ranking Seed User',
    email: 'day13-ranking-seed@devpulse.test',
    passwordHash,
    role: 'user',
    headline: 'Controlled ranking verification user',
    bio: null,
    avatarUrl: null,
    reactionsCount: 0,
    commentsCount: 0,
    postsCount: 9,
    topRankedCount: 0,
    skills: [],
    experiences: [],
    portfolioProjects: [],
  });

  /*
   * label exists only in the fixture for readable tests.
   * It is not part of the Post schema, so do not insert it.
   */
  const postsToInsert = RANKING_SEED_POSTS.map(
    ({ label: _label, ...post }) => post,
  );

  await PostModel.insertMany(postsToInsert);

  console.log(`Inserted ${postsToInsert.length} controlled ranking posts.`);

  console.log(
    'Expected active Top order: A -> B -> I -> H -> D -> C -> G -> E -> F',
  );

  console.log(
    'Expected active Latest order: H -> F -> E -> D -> C -> B -> G -> I -> A',
  );

  console.log(
    'Expected active Most Discussed order: I -> B -> D -> A -> H -> C -> F -> G -> E',
  );

  console.log('Post J is soft-deleted and must not appear in any feed.');
}

seedRankingData()
  .then(async () => {
    await mongoose.disconnect();

    console.log('Ranking seed completed successfully.');
  })
  .catch(async (error) => {
    console.error('Ranking seed failed:', error);

    await mongoose.disconnect();

    process.exitCode = 1;
  });
