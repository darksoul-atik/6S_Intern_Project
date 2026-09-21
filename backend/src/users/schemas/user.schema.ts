import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export type UserRole = 'admin' | 'user';

/*
|--------------------------------------------------------------------------
| Experience section
|--------------------------------------------------------------------------
*/

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
export class Experience {
  _id?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  company!: string;

  @Prop({ required: true, trim: true })
  from!: string;

  @Prop({ required: false, trim: true })
  to?: string;

  @Prop({ required: false, trim: true })
  description?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ExperienceSchema = SchemaFactory.createForClass(Experience);

/*
|--------------------------------------------------------------------------
| Portfolio Project section
|--------------------------------------------------------------------------
*/

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
export class PortfolioProject {
  _id?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ type: [String], default: [] })
  urls!: string[];

  @Prop({ type: [String], default: [] })
  technologies!: string[];

  @Prop({ required: true, trim: true })
  startDate!: string;

  @Prop({ required: false, trim: true })
  endDate?: string;

  @Prop({ type: Boolean, default: false })
  isCurrent!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PortfolioProjectSchema =
  SchemaFactory.createForClass(PortfolioProject);

/*
|--------------------------------------------------------------------------
| User document
|--------------------------------------------------------------------------
*/

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      if (ret._id) {
        ret.id = ret._id.toString();
        delete ret._id;
      }

      delete ret.passwordHash;
      delete ret.__v;

      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
    index: true,
  })
  role!: UserRole;

  @Prop({ required: false, trim: true, default: null })
  headline?: string;

  @Prop({ required: false, trim: true, default: null })
  bio?: string;

  @Prop({ required: false, default: null })
  avatarUrl?: string;

  @Prop({ type: Number, default: 0 })
  reactionsCount?: number;

  @Prop({ type: Number, default: 0 })
  commentsCount?: number;

  @Prop({ type: Number, default: 0 })
  postsCount?: number;

  @Prop({ type: Number, default: 0 })
  topRankedCount?: number;

  @Prop({ type: [String], default: [] })
  skills!: string[];

  @Prop({ type: [ExperienceSchema], default: [] })
  experiences!: Experience[];

  @Prop({ type: [PortfolioProjectSchema], default: [] })
  portfolioProjects!: PortfolioProject[];

  @Prop({ type: Boolean, default: false, index: true })
  isDeleted?: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;

  @Prop({ type: String, default: null })
  deletedReason?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
