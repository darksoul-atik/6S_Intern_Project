import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type ChangelogEntryDocument = HydratedDocument<ChangelogEntry>;

export type ChangelogSource = 'github-app' | 'mock';

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      if (ret._id) {
        ret.id = ret._id.toString();
        delete ret._id;
      }
      delete ret.__v;
      return ret;
    },
  },
})
export class ChangelogEntry {
  @Prop({
    required: true,
    trim: true,
    lowercase: true,
  })
  owner!: string;

  @Prop({
    required: true,
    trim: true,
    lowercase: true,
  })
  repo!: string;

  @Prop({
    required: true,
    type: Number,
  })
  prNumber!: number;

  @Prop({
    required: true,
    trim: true,
    maxlength: 500,
  })
  title!: string;

  @Prop({
    required: true,
    trim: true,
    default: 'unknown',
  })
  authorLogin!: string;

  @Prop({
    required: true,
    type: Date,
  })
  mergedAt!: Date;

  @Prop({
    required: true,
    trim: true,
  })
  htmlUrl!: string;

  @Prop({
    required: true,
    trim: true,
  })
  baseBranch!: string;

  @Prop({
    type: String,
    required: true,
    enum: ['github-app', 'mock'],
  })
  source!: ChangelogSource;

  @Prop({
    required: true,
    type: Date,
    default: Date.now,
  })
  syncedAt!: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ChangelogEntrySchema =
  SchemaFactory.createForClass(ChangelogEntry);

ChangelogEntrySchema.index(
  { source: 1, owner: 1, repo: 1, prNumber: 1 },
  { unique: true },
);

ChangelogEntrySchema.index({ source: 1, mergedAt: -1 });
