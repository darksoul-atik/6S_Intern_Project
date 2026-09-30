import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Types } from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { PostSchema } from './schemas/post.schema.js';

describe('Post full-text search integration', () => {
  let mongoServer: MongoMemoryServer;
  let postModel: any;

  const authorId = new Types.ObjectId();

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri());

    postModel = mongoose.model('Post', PostSchema);

    // Text indexes must exist before $text queries can run.
    await postModel.syncIndexes();
  });

  beforeEach(async () => {
    await postModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  async function searchPosts(q: string) {
    return postModel
      .find(
        {
          $text: {
            $search: q,
          },
          deletedAt: {
            $exists: false,
          },
        },
        {
          score: {
            $meta: 'textScore',
          },
        },
      )
      .sort({
        score: {
          $meta: 'textScore',
        },
        createdAt: -1,
        _id: -1,
      })
      .exec();
  }

  it('should find a post when the search term appears in the title', async () => {
    await postModel.create({
      authorId,
      title: 'React Authentication Guide',
      body: 'A guide for frontend developers.',
    });

    const results = await searchPosts('React');

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('React Authentication Guide');
  });

  it('should find a post when the search term appears in the body', async () => {
    await postModel.create({
      authorId,
      title: 'Frontend Development',
      body: 'This post explains authentication with React.',
    });

    const results = await searchPosts('React');

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Frontend Development');
  });

  it('should return an empty array when no posts match', async () => {
    await postModel.create({
      authorId,
      title: 'MongoDB Indexes',
      body: 'This post discusses database indexing.',
    });

    const results = await searchPosts('React');

    expect(results).toEqual([]);
  });

  it('should exclude soft-deleted posts from search results', async () => {
    await postModel.create({
      authorId,
      title: 'React Deleted Post',
      body: 'This post should not appear.',
      deletedAt: new Date(),
      deletedBy: authorId,
    });

    const results = await searchPosts('React');

    expect(results).toEqual([]);
  });

  it('should prefer a title match over a body-only match', async () => {
    await postModel.create([
      {
        authorId,
        title: 'React Development',
        body: 'Frontend development guide.',
      },
      {
        authorId,
        title: 'Frontend Development',
        body: 'This guide discusses React.',
      },
    ]);

    const results = await searchPosts('React');

    expect(results).toHaveLength(2);
    expect(results[0].title).toBe('React Development');
  });

  it('should handle a valid special-character search without crashing', async () => {
    await postModel.create({
      authorId,
      title: 'Node.js Development',
      body: 'Building backend applications.',
    });

    await expect(searchPosts('Node.js')).resolves.toBeDefined();
  });
});
