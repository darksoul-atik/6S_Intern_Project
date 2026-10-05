import 'dotenv/config';
import mongoose from 'mongoose';
import { resolve } from 'node:path';
import * as dotenv from 'dotenv';

import {
  EXPECTED_LATEST_ORDER,
  EXPECTED_MOST_DISCUSSED_ORDER,
  EXPECTED_RANK_SCORES,
  EXPECTED_TOP_ORDER,
  RANKING_SEED_POSTS,
} from '../posts/testing/ranking-seed.fixture.js';

import { Post, PostSchema } from '../posts/schemas/post.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { PostsService } from '../posts/posts.service.js';

dotenv.config({
  path: resolve(process.cwd(), '.env'),
});

const EXPECTED_DATABASE_NAME = 'devpulse_day13_seed';

function getLabels(posts: any[]): string[] {
  const labelsById = new Map(
    RANKING_SEED_POSTS.map((post) => [post._id.toString(), post.label]),
  );

  return posts.map((post) => {
    const id = post.id ? post.id.toString() : post._id.toString();
    const label = labelsById.get(id);
    if (!label) {
      throw new Error(`Unknown ranking seed post ID: ${id}`);
    }
    return label;
  });
}

async function verifyFeeds(): Promise<void> {
  const mongoUri = process.env.RANKING_SEED_MONGODB_URI;

  if (!mongoUri) {
    throw new Error('RANKING_SEED_MONGODB_URI is not configured in .env');
  }

  console.log('\n======================================================');
  console.log('⚡ DEVPULSE SEED FEED VERIFICATION (DAY 13)');
  console.log('======================================================\n');

  await mongoose.connect(mongoUri);

  if (mongoose.connection.name !== EXPECTED_DATABASE_NAME) {
    throw new Error(
      `Safety check failed. Connected to "${mongoose.connection.name}", expected "${EXPECTED_DATABASE_NAME}".`,
    );
  }

  console.log(`Connected to database: "${mongoose.connection.name}"`);

  const userModel =
    mongoose.models[User.name] || mongoose.model(User.name, UserSchema);
  const postModel =
    mongoose.models[Post.name] || mongoose.model(Post.name, PostSchema);

  await Promise.all([userModel.init(), postModel.init()]);

  const service = new PostsService(postModel, {} as any);

  /*
  |--------------------------------------------------------------------------
  | 1. Top Ranked Feed Verification
  |--------------------------------------------------------------------------
  */
  console.log('\n--- 1. Testing Ranked Feed (sort=top) ---');
  const topResult = await service.findAllPosts({
    page: 1,
    limit: 20,
    sort: 'top',
  });

  const topLabels = getLabels(topResult.posts);
  console.log(
    'Expected Top Order:        ',
    [...EXPECTED_TOP_ORDER].join(' -> '),
  );
  console.log('Actual Top Order:          ', topLabels.join(' -> '));

  const topMatches =
    JSON.stringify(topLabels) === JSON.stringify([...EXPECTED_TOP_ORDER]);
  if (!topMatches) {
    throw new Error('Top feed order mismatch!');
  }
  console.log('✅ Top Feed Order: 100% MATCH');

  // Verify rankScores
  topResult.posts.forEach((post: any, idx) => {
    const label = topLabels[idx] as keyof typeof EXPECTED_RANK_SCORES;
    const expectedScore = EXPECTED_RANK_SCORES[label];
    if (post.rankScore !== expectedScore) {
      throw new Error(
        `Post ${label} rankScore mismatch! Expected ${expectedScore}, got ${post.rankScore}`,
      );
    }
  });
  console.log('✅ Rank Scores: All 9 active posts match expected formulas');

  // Verify tie-breakers
  const bIdx = topLabels.indexOf('B');
  const iIdx = topLabels.indexOf('I');
  if (bIdx > iIdx) throw new Error('Tie-breaker B vs I failed');
  console.log(
    '✅ Top Tie-Breaker (createdAt): Post B ranks before Post I (score 12 tie broken by newer date)',
  );

  const hIdx = topLabels.indexOf('H');
  const dIdx = topLabels.indexOf('D');
  const cIdx = topLabels.indexOf('C');
  if (hIdx > dIdx || hIdx > cIdx)
    throw new Error('Tie-breaker H vs D/C failed');
  if (dIdx > cIdx) throw new Error('Tie-breaker D vs C (_id) failed');
  console.log(
    '✅ Top Tie-Breaker (_id): Post D ranks before Post C (identical score 8 & identical date broken by _id)',
  );

  /*
  |--------------------------------------------------------------------------
  | 2. Latest Feed Verification
  |--------------------------------------------------------------------------
  */
  console.log('\n--- 2. Testing Latest Feed (sort=latest) ---');
  const latestResult = await service.findAllPosts({
    page: 1,
    limit: 20,
    sort: 'latest',
  });

  const latestLabels = getLabels(latestResult.posts);
  console.log(
    'Expected Latest Order:     ',
    [...EXPECTED_LATEST_ORDER].join(' -> '),
  );
  console.log('Actual Latest Order:       ', latestLabels.join(' -> '));

  const latestMatches =
    JSON.stringify(latestLabels) === JSON.stringify([...EXPECTED_LATEST_ORDER]);
  if (!latestMatches) {
    throw new Error('Latest feed order mismatch!');
  }
  console.log('✅ Latest Feed Order: 100% MATCH');

  /*
  |--------------------------------------------------------------------------
  | 3. Most Discussed Feed Verification
  |--------------------------------------------------------------------------
  */
  console.log('\n--- 3. Testing Most Discussed Feed (sort=most-discussed) ---');
  const mostDiscussedResult = await service.findAllPosts({
    page: 1,
    limit: 20,
    sort: 'most-discussed',
  });

  const mostDiscussedLabels = getLabels(mostDiscussedResult.posts);
  console.log(
    'Expected Most Discussed:   ',
    [...EXPECTED_MOST_DISCUSSED_ORDER].join(' -> '),
  );
  console.log('Actual Most Discussed:     ', mostDiscussedLabels.join(' -> '));

  const mostDiscussedMatches =
    JSON.stringify(mostDiscussedLabels) ===
    JSON.stringify([...EXPECTED_MOST_DISCUSSED_ORDER]);
  if (!mostDiscussedMatches) {
    throw new Error('Most Discussed feed order mismatch!');
  }
  console.log('✅ Most Discussed Feed Order: 100% MATCH');

  // Verify Most Discussed tie-breakers
  const mdDIdx = mostDiscussedLabels.indexOf('D');
  const mdAIdx = mostDiscussedLabels.indexOf('A');
  if (mdDIdx > mdAIdx)
    throw new Error('Most discussed tie-breaker D vs A failed');
  console.log(
    '✅ Most Discussed Tie-Breaker: Post D ranks before Post A (commentCount 3 tie broken by newer date)',
  );

  const mdHIdx = mostDiscussedLabels.indexOf('H');
  const mdCIdx = mostDiscussedLabels.indexOf('C');
  if (mdHIdx > mdCIdx)
    throw new Error('Most discussed tie-breaker H vs C failed');
  console.log(
    '✅ Most Discussed Tie-Breaker: Post H ranks before Post C (commentCount 2 tie broken by newer date)',
  );

  const mdFIdx = mostDiscussedLabels.indexOf('F');
  const mdGIdx = mostDiscussedLabels.indexOf('G');
  if (mdFIdx > mdGIdx)
    throw new Error('Most discussed tie-breaker F vs G failed');
  console.log(
    '✅ Most Discussed Tie-Breaker: Post F ranks before Post G (commentCount 1 tie broken by newer date)',
  );

  /*
  |--------------------------------------------------------------------------
  | 4. Soft-Deleted Post Exclusion Verification
  |--------------------------------------------------------------------------
  */
  console.log('\n--- 4. Testing Soft-Deleted Post Exclusion ---');
  const allLabels = [...topLabels, ...latestLabels, ...mostDiscussedLabels];
  if (allLabels.includes('J')) {
    throw new Error('Soft-deleted Post J leaked into feed results!');
  }
  console.log(
    '✅ Soft-deleted Post J is completely excluded from all feed sort queries',
  );

  /*
  |--------------------------------------------------------------------------
  | 5. Pagination Stability Verification (3 Pages, limit=3)
  |--------------------------------------------------------------------------
  */
  console.log(
    '\n--- 5. Testing Multi-Page Pagination Stability (3 Pages, limit=3) ---',
  );
  const sortModes: Array<'top' | 'latest' | 'most-discussed'> = [
    'top',
    'latest',
    'most-discussed',
  ];

  for (const sort of sortModes) {
    const page1 = await service.findAllPosts({ page: 1, limit: 3, sort });
    const page2 = await service.findAllPosts({ page: 2, limit: 3, sort });
    const page3 = await service.findAllPosts({ page: 3, limit: 3, sort });

    const p1Labels = getLabels(page1.posts);
    const p2Labels = getLabels(page2.posts);
    const p3Labels = getLabels(page3.posts);

    const combined = [...p1Labels, ...p2Labels, ...p3Labels];
    const uniqueCount = new Set(combined).size;

    console.log(`\nSort [${sort}]:`);
    console.log(`  Page 1 (3 items): ${p1Labels.join(', ')}`);
    console.log(`  Page 2 (3 items): ${p2Labels.join(', ')}`);
    console.log(`  Page 3 (3 items): ${p3Labels.join(', ')}`);
    console.log(
      `  Combined:         ${combined.join(', ')} (Total: ${combined.length}, Unique: ${uniqueCount})`,
    );

    if (page1.total !== 9 || page1.totalPages !== 3) {
      throw new Error(`Pagination metadata incorrect for ${sort}`);
    }

    if (combined.length !== 9 || uniqueCount !== 9) {
      throw new Error(
        `Pagination boundary drift or item duplication detected in ${sort}!`,
      );
    }

    // Re-verify repeated page request stability
    const repeatPage1 = await service.findAllPosts({ page: 1, limit: 3, sort });
    const repeatP1Labels = getLabels(repeatPage1.posts);
    if (JSON.stringify(p1Labels) !== JSON.stringify(repeatP1Labels)) {
      throw new Error(`Repeated page 1 request unstable for ${sort}!`);
    }

    console.log(
      `  ✅ Pagination stays 100% intact, zero duplicates, zero dropped items`,
    );
  }

  console.log('\n======================================================');
  console.log('🎉 ALL SEED FEED VERIFICATIONS PASSED WITH 100% SUCCESS');
  console.log('======================================================\n');
}

verifyFeeds()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(
      '\n❌ Feed verification failed. Check database connectivity and seed data.',
    );
    await mongoose.disconnect();
    process.exit(1);
  });
