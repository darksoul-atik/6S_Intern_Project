import type { PipelineStage } from 'mongoose';

import { COMMENT_WEIGHT } from './posts.constants.js';

export function buildTopPostsPipeline(
  page: number,
  limit: number,
): PipelineStage[] {
  const skip = (page - 1) * limit;

  return [
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
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ];
}
