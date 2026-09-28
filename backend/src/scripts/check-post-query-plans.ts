import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { resolve } from 'node:path';

dotenv.config({
  path: resolve(process.cwd(), '.env'),
});

async function checkPostQueryPlans(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined');
  }

  await mongoose.connect(mongoUri);

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('MongoDB connection is not available');
  }

  const posts = db.collection('posts');

  console.log('\n=== POST INDEXES ===\n');

  const indexes = await posts.indexes();

  console.dir(indexes, {
    depth: null,
  });

  console.log('\n=== LATEST QUERY EXPLAIN ===\n');

  const latestExplain = await db.command({
    explain: {
      find: 'posts',
      filter: {
        deletedAt: {
          $exists: false,
        },
      },
      sort: {
        createdAt: -1,
        _id: -1,
      },
      limit: 10,
    },
    verbosity: 'executionStats',
  });

  console.dir(
    {
      winningPlan: latestExplain.queryPlanner?.winningPlan,
      executionStats: latestExplain.executionStats,
    },
    {
      depth: null,
    },
  );

  console.log('\n=== TOP QUERY EXPLAIN ===\n');

  const topExplain = await db.command({
    explain: {
      aggregate: 'posts',
      pipeline: [
        {
          $match: {
            deletedAt: {
              $exists: false,
            },
          },
        },
        {
          $addFields: {
            rankScore: {
              $add: [
                {
                  $subtract: [
                    {
                      $ifNull: ['$reactionCounts.like', 0],
                    },
                    {
                      $ifNull: ['$reactionCounts.dislike', 0],
                    },
                  ],
                },
                {
                  $multiply: [
                    {
                      $ifNull: ['$commentCount', 0],
                    },
                    2,
                  ],
                },
              ],
            },
          },
        },
        {
          $sort: {
            rankScore: -1,
            createdAt: -1,
            _id: -1,
          },
        },
        {
          $limit: 10,
        },
      ],
      cursor: {},
    },
    verbosity: 'executionStats',
  });

  console.dir(topExplain, {
    depth: null,
  });
}

checkPostQueryPlans()
  .then(async () => {
    await mongoose.disconnect();
  })
  .catch(async (error) => {
    console.error(error);

    await mongoose.disconnect();

    process.exitCode = 1;
  });
