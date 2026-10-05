import 'dotenv/config';
import mongoose from 'mongoose';

import { COMMENT_WEIGHT } from '../posts/posts.constants.js';

async function main(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not configured');
  }

  await mongoose.connect(mongoUri);

  try {
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('MongoDB connection is not available');
    }

    const posts = db.collection('posts');

    /*
    |--------------------------------------------------------------------------
    | Existing Post Indexes
    |--------------------------------------------------------------------------
    */

    const indexes = await posts.indexes();

    console.log('\n================ POST INDEXES ================\n');
    console.dir(indexes, {
      depth: null,
      colors: true,
    });

    /*
    |--------------------------------------------------------------------------
    | Latest Feed
    |--------------------------------------------------------------------------
    |
    | createdAt DESC
    | -> _id DESC
    |--------------------------------------------------------------------------
    */

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

    console.log('\n================ LATEST EXPLAIN ================\n');

    console.dir(latestExplain, {
      depth: null,
      colors: true,
    });

    /*
    |--------------------------------------------------------------------------
    | Top Feed
    |--------------------------------------------------------------------------
    |
    | rankScore =
    | (like - dislike)
    | +
    | (commentCount * COMMENT_WEIGHT)
    |
    | rankScore is calculated at query time,
    | so there is intentionally no rankScore index.
    |--------------------------------------------------------------------------
    */

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
                      COMMENT_WEIGHT,
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

    console.log('\n================ TOP EXPLAIN ================\n');

    console.dir(topExplain, {
      depth: null,
      colors: true,
    });

    /*
    |--------------------------------------------------------------------------
    | Most Discussed Feed
    |--------------------------------------------------------------------------
    |
    | commentCount DESC
    | -> createdAt DESC
    | -> _id DESC
    |
    | Expected compound index:
    |
    | {
    |   commentCount: -1,
    |   createdAt: -1,
    |   _id: -1
    | }
    |--------------------------------------------------------------------------
    */

    const mostDiscussedExplain = await db.command({
      explain: {
        find: 'posts',

        filter: {
          deletedAt: {
            $exists: false,
          },
        },

        sort: {
          commentCount: -1,
          createdAt: -1,
          _id: -1,
        },

        limit: 10,
      },

      verbosity: 'executionStats',
    });

    console.log('\n================ MOST DISCUSSED EXPLAIN ================\n');

    console.dir(mostDiscussedExplain, {
      depth: null,
      colors: true,
    });
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(
    '\nQuery-plan verification failed. Check database connectivity and query configuration.',
  );

  process.exitCode = 1;
});
