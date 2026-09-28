import { Types } from 'mongoose';

export const RANKING_SEED_AUTHOR_ID = new Types.ObjectId(
  '660000000000000000000001',
);

export const RANKING_SEED_POSTS = [
  {
    _id: new Types.ObjectId('670000000000000000000001'),
    label: 'A',
    title: 'Ranking Seed Post A',
    body: 'Controlled Day 13 ranking seed post A.',
    authorId: RANKING_SEED_AUTHOR_ID,
    reactionCounts: {
      like: 8,
      dislike: 1,
    },
    commentCount: 3,
    createdAt: new Date('2026-09-20T10:00:00.000Z'),
    updatedAt: new Date('2026-09-20T10:00:00.000Z'),
  },

  {
    _id: new Types.ObjectId('670000000000000000000002'),
    label: 'B',
    title: 'Ranking Seed Post B',
    body: 'Controlled Day 13 ranking seed post B.',
    authorId: RANKING_SEED_AUTHOR_ID,
    reactionCounts: {
      like: 4,
      dislike: 0,
    },
    commentCount: 4,
    createdAt: new Date('2026-09-24T12:00:00.000Z'),
    updatedAt: new Date('2026-09-24T12:00:00.000Z'),
  },

  {
    _id: new Types.ObjectId('670000000000000000000003'),
    label: 'C',
    title: 'Ranking Seed Post C',
    body: 'Controlled Day 13 ranking seed post C.',
    authorId: RANKING_SEED_AUTHOR_ID,
    reactionCounts: {
      like: 6,
      dislike: 2,
    },
    commentCount: 2,
    createdAt: new Date('2026-09-25T09:00:00.000Z'),
    updatedAt: new Date('2026-09-25T09:00:00.000Z'),
  },

  {
    _id: new Types.ObjectId('670000000000000000000004'),
    label: 'D',
    title: 'Ranking Seed Post D',
    body: 'Controlled Day 13 ranking seed post D.',
    authorId: RANKING_SEED_AUTHOR_ID,
    reactionCounts: {
      like: 2,
      dislike: 0,
    },
    commentCount: 3,
    createdAt: new Date('2026-09-25T09:00:00.000Z'),
    updatedAt: new Date('2026-09-25T09:00:00.000Z'),
  },

  {
    _id: new Types.ObjectId('670000000000000000000005'),
    label: 'E',
    title: 'Ranking Seed Post E',
    body: 'Controlled Day 13 ranking seed post E.',
    authorId: RANKING_SEED_AUTHOR_ID,
    reactionCounts: {
      like: 3,
      dislike: 3,
    },
    commentCount: 0,
    createdAt: new Date('2026-09-26T08:00:00.000Z'),
    updatedAt: new Date('2026-09-26T08:00:00.000Z'),
  },

  {
    _id: new Types.ObjectId('670000000000000000000006'),
    label: 'F',
    title: 'Ranking Seed Post F',
    body: 'Controlled Day 13 ranking seed post F.',
    authorId: RANKING_SEED_AUTHOR_ID,
    reactionCounts: {
      like: 1,
      dislike: 5,
    },
    commentCount: 1,
    createdAt: new Date('2026-09-27T15:00:00.000Z'),
    updatedAt: new Date('2026-09-27T15:00:00.000Z'),
  },

  {
    _id: new Types.ObjectId('670000000000000000000007'),
    label: 'G',
    title: 'Ranking Seed Post G',
    body: 'Controlled Day 13 ranking seed post G.',
    authorId: RANKING_SEED_AUTHOR_ID,
    reactionCounts: {
      like: 10,
      dislike: 5,
    },
    commentCount: 1,
    createdAt: new Date('2026-09-23T18:00:00.000Z'),
    updatedAt: new Date('2026-09-23T18:00:00.000Z'),
  },

  {
    _id: new Types.ObjectId('670000000000000000000008'),
    label: 'H',
    title: 'Ranking Seed Post H',
    body: 'Controlled Day 13 ranking seed post H.',
    authorId: RANKING_SEED_AUTHOR_ID,
    reactionCounts: {
      like: 5,
      dislike: 1,
    },
    commentCount: 2,
    createdAt: new Date('2026-09-28T07:00:00.000Z'),
    updatedAt: new Date('2026-09-28T07:00:00.000Z'),
  },

  {
    _id: new Types.ObjectId('670000000000000000000009'),
    label: 'I',
    title: 'Ranking Seed Post I',
    body: 'Controlled Day 13 ranking seed post I.',
    authorId: RANKING_SEED_AUTHOR_ID,
    reactionCounts: {
      like: 0,
      dislike: 0,
    },
    commentCount: 6,
    createdAt: new Date('2026-09-22T11:00:00.000Z'),
    updatedAt: new Date('2026-09-22T11:00:00.000Z'),
  },

  {
    _id: new Types.ObjectId('67000000000000000000000a'),
    label: 'J',
    title: 'Ranking Seed Post J',
    body: 'Soft-deleted post that must never appear in either feed.',
    authorId: RANKING_SEED_AUTHOR_ID,
    reactionCounts: {
      like: 100,
      dislike: 0,
    },
    commentCount: 50,
    createdAt: new Date('2026-09-28T08:00:00.000Z'),
    updatedAt: new Date('2026-09-28T08:00:00.000Z'),
    deletedAt: new Date('2026-09-28T08:30:00.000Z'),
  },
] as const;

/*
|--------------------------------------------------------------------------
| Independently calculated expected results
|--------------------------------------------------------------------------
|
| Do NOT generate these arrays with calculatePostRankScore().
| They are the hand-worked oracle used to verify production ranking logic.
|--------------------------------------------------------------------------
*/

export const EXPECTED_TOP_ORDER = [
  'A',
  'B',
  'I',
  'H',
  'D',
  'C',
  'G',
  'E',
  'F',
] as const;

export const EXPECTED_LATEST_ORDER = [
  'H',
  'F',
  'E',
  'D',
  'C',
  'B',
  'G',
  'I',
  'A',
] as const;

export const EXPECTED_RANK_SCORES = {
  A: 13,
  B: 12,
  C: 8,
  D: 8,
  E: 0,
  F: -2,
  G: 7,
  H: 8,
  I: 12,
  J: 200,
} as const;
