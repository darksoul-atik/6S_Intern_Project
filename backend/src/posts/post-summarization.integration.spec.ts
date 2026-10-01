import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Types } from 'mongoose';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { PostSchema } from './schemas/post.schema.js';
import { PostsService } from './posts.service.js';

describe('Post summarization integration', () => {
  let mongoServer: MongoMemoryServer;
  let postModel: any;
  let postsService: PostsService;

  const authorId = new Types.ObjectId();

  const usersService = {
    incrementPostsCount: vi.fn(),
    decrementPostsCount: vi.fn(),
  };

  const summarizerService = {
    summarize: vi.fn(),
  };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri());

    postModel = mongoose.model('PostSummarization', PostSchema);
  });

  beforeEach(async () => {
    await postModel.deleteMany({});

    vi.clearAllMocks();

    postsService = new PostsService(
      postModel,
      usersService as any,
      summarizerService as any,
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should summarize an active post using only its title and body', async () => {
    const post = await postModel.create({
      authorId,
      title: 'Learning NestJS',
      body: 'I built an API using NestJS and MongoDB.',
    });

    summarizerService.summarize.mockResolvedValue({
      summary: 'The post describes building an API with NestJS and MongoDB.',
      tags: ['NestJS', 'MongoDB'],
    });

    const result = await postsService.summarizePost(post._id.toString());

    expect(summarizerService.summarize).toHaveBeenCalledOnce();

    expect(summarizerService.summarize).toHaveBeenCalledWith({
      title: 'Learning NestJS',
      body: 'I built an API using NestJS and MongoDB.',
    });

    expect(result).toEqual({
      summary: 'The post describes building an API with NestJS and MongoDB.',
      tags: ['NestJS', 'MongoDB'],
    });
  });

  it('should return 404 for a missing post', async () => {
    const missingPostId = new Types.ObjectId().toString();

    await expect(
      postsService.summarizePost(missingPostId),
    ).rejects.toMatchObject({
      status: 404,
    });

    expect(summarizerService.summarize).not.toHaveBeenCalled();
  });

  it('should return 404 for an invalid post ID', async () => {
    await expect(
      postsService.summarizePost('invalid-post-id'),
    ).rejects.toMatchObject({
      status: 404,
    });

    expect(summarizerService.summarize).not.toHaveBeenCalled();
  });

  it('should not summarize a soft-deleted post', async () => {
    const post = await postModel.create({
      authorId,
      title: 'Deleted NestJS Post',
      body: 'This post should not be summarized.',
      deletedAt: new Date(),
      deletedBy: authorId,
    });

    await expect(
      postsService.summarizePost(post._id.toString()),
    ).rejects.toMatchObject({
      status: 404,
    });

    expect(summarizerService.summarize).not.toHaveBeenCalled();
  });

  it('should propagate a summarizer error', async () => {
    const post = await postModel.create({
      authorId,
      title: 'Test Post',
      body: 'Test body.',
    });

    const error = new Error('Summarizer failed');

    summarizerService.summarize.mockRejectedValue(error);

    await expect(postsService.summarizePost(post._id.toString())).rejects.toBe(
      error,
    );
  });
});
