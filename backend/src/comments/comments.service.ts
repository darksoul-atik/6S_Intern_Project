import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';

import { Comment, type CommentDocument } from './schemas/comment.schema.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { PostsService } from '../posts/posts.service.js';
import { UsersService } from '../users/users.service.js';

export interface CommentTreeItem {
  id: string;
  postId: string;
  authorId: unknown;
  parentCommentId: string | null;
  body: string;
  createdAt?: Date;
  updatedAt?: Date;
  replies: CommentTreeItem[];
}

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,

    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
  ) {}

  async createComment(
    postId: string,
    authorId: string,
    dto: CreateCommentDto,
  ): Promise<CommentDocument> {
    await this.postsService.findActivePostByIdOrThrow(postId);

    const comment = await this.commentModel.create({
      postId: new Types.ObjectId(postId),
      authorId: new Types.ObjectId(authorId),
      parentCommentId: null,
      body: dto.body,
    });

    await this.postsService.incrementCommentCount(postId);
    await this.usersService.incrementCommentsCount(authorId);

    return comment;
  }

  async createReply(
    postId: string,
    parentCommentId: string,
    authorId: string,
    dto: CreateCommentDto,
  ): Promise<CommentDocument> {
    await this.postsService.findActivePostByIdOrThrow(postId);

    this.validateCommentId(parentCommentId);

    const parent = await this.commentModel.findById(parentCommentId).exec();

    if (!parent) {
      throw new NotFoundException(
        `Comment with ID '${parentCommentId}' not found`,
      );
    }

    if (parent.postId.toString() !== postId) {
      throw new BadRequestException(
        'Parent comment does not belong to this post',
      );
    }

    if (parent.parentCommentId) {
      throw new BadRequestException(
        'Maximum reply depth exceeded. Replies cannot have child replies',
      );
    }

    const reply = await this.commentModel.create({
      postId: new Types.ObjectId(postId),
      authorId: new Types.ObjectId(authorId),
      parentCommentId: parent._id,
      body: dto.body,
    });

    await this.postsService.incrementCommentCount(postId);
    await this.usersService.incrementCommentsCount(authorId);

    return reply;
  }

  async findCommentsByPost(postId: string): Promise<CommentTreeItem[]> {
    await this.postsService.findActivePostByIdOrThrow(postId);

    const comments = await this.commentModel
      .find({
        postId: new Types.ObjectId(postId),
      })
      .sort({
        createdAt: 1,
        _id: 1,
      })
      .populate({
        path: 'authorId',
        select: 'name headline avatarUrl',
      })
      .exec();

    const roots: CommentTreeItem[] = [];
    const rootMap = new Map<string, CommentTreeItem>();

    for (const comment of comments) {
      if (comment.parentCommentId) {
        continue;
      }

      const item = this.toTreeItem(comment);

      roots.push(item);
      rootMap.set(comment._id.toString(), item);
    }

    for (const comment of comments) {
      if (!comment.parentCommentId) {
        continue;
      }

      const parent = rootMap.get(comment.parentCommentId.toString());

      if (parent) {
        parent.replies.push(this.toTreeItem(comment));
      }
    }

    return roots;
  }

  private toTreeItem(comment: CommentDocument): CommentTreeItem {
    return {
      id: comment._id.toString(),
      postId: comment.postId.toString(),
      authorId: comment.authorId,
      parentCommentId: comment.parentCommentId?.toString() ?? null,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      replies: [],
    };
  }

  private validateCommentId(commentId: string): void {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new NotFoundException(`Comment with ID '${commentId}' not found`);
    }
  }
}
