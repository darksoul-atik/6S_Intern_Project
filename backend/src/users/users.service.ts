import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto.js';
import {
  CreateExperienceDto,
  UpdateExperienceDto,
} from './dto/experience.dto.js';

export interface PaginatedUsersResult {
  users: UserDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(userData: Partial<User>): Promise<UserDocument> {
    const createdUser = new this.userModel(userData);
    return createdUser.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return null;
    }
    return this.userModel.findById(id).exec();
  }

  async getMe(userId: string): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }
    return user;
  }

  async getProfileById(id: string): Promise<UserDocument> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`Developer profile with ID '${id}' not found`);
    }
    return user;
  }

  async updateBasicProfile(
    userId: string,
    updateDto: UpdateProfileDto,
  ): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    if (updateDto.name !== undefined) {
      user.name = updateDto.name.trim();
    }
    if (updateDto.title !== undefined) {
      if (updateDto.title && updateDto.title.trim()) {
        user.title = updateDto.title.trim();
      } else {
        user.set('title', undefined);
      }
    }
    if (updateDto.avatarUrl !== undefined) {
      if (updateDto.avatarUrl && updateDto.avatarUrl.trim()) {
        user.avatarUrl = updateDto.avatarUrl.trim();
      } else {
        user.set('avatarUrl', undefined);
      }
    }

    return user.save();

  }

  async addSkill(userId: string, skill: string): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const trimmed = skill.trim();
    if (!trimmed) {
      throw new BadRequestException('Skill name cannot be empty');
    }

    if (!user.skills) {
      user.skills = [];
    }

    const exists = user.skills.some(
      (s) => s.toLowerCase() === trimmed.toLowerCase(),
    );
    if (!exists) {
      user.skills.push(trimmed);
      return user.save();
    }

    return user;
  }

  async removeSkill(userId: string, skill: string): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const trimmed = skill.trim().toLowerCase();
    if (user.skills && user.skills.length > 0) {
      user.skills = user.skills.filter((s) => s.toLowerCase() !== trimmed);
      return user.save();
    }

    return user;
  }

  async updateSkills(userId: string, skills: string[]): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const seen = new Set<string>();
    const cleaned: string[] = [];

    for (const raw of skills) {
      const trimmed = raw.trim();
      const lower = trimmed.toLowerCase();
      if (trimmed.length > 0 && !seen.has(lower)) {
        seen.add(lower);
        cleaned.push(trimmed);
      }
    }

    user.skills = cleaned;
    return user.save();
  }

  async addExperience(
    userId: string,
    expDto: CreateExperienceDto,
  ): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    if (!user.experiences) {
      user.experiences = [];
    }

    user.experiences.push({
      title: expDto.title.trim(),
      company: expDto.company.trim(),
      from: expDto.from.trim(),
      to: expDto.to?.trim() || undefined,
      description: expDto.description?.trim() || undefined,
    } as any);

    return user.save();
  }

  async updateExperience(
    userId: string,
    experienceId: string,
    expDto: UpdateExperienceDto,
  ): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const expIndex = user.experiences.findIndex(
      (e) => e._id?.toString() === experienceId,
    );
    if (expIndex === -1) {
      throw new NotFoundException(`Experience with ID '${experienceId}' not found`);
    }

    const target = user.experiences[expIndex];
    if (expDto.title !== undefined) target.title = expDto.title.trim();
    if (expDto.company !== undefined) target.company = expDto.company.trim();
    if (expDto.from !== undefined) target.from = expDto.from.trim();
    if (expDto.to !== undefined) target.to = expDto.to.trim();
    if (expDto.description !== undefined) target.description = expDto.description.trim();

    return user.save();
  }

  async removeExperience(
    userId: string,
    experienceId: string,
  ): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const expIndex = user.experiences.findIndex(
      (e) => e._id?.toString() === experienceId,
    );
    if (expIndex === -1) {
      throw new NotFoundException(`Experience with ID '${experienceId}' not found`);
    }

    user.experiences.splice(expIndex, 1);
    return user.save();
  }

  async findAllUsers(query: {
    page: number;
    limit: number;
    search?: string;
    includeDeleted?: boolean;
  }): Promise<PaginatedUsersResult> {
    const filter: Record<string, unknown> = {};
    if (!query.includeDeleted) {
      filter.isDeleted = { $ne: true };
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { title: { $regex: term, $options: 'i' } },
      ];
    }

    const total = await this.userModel.countDocuments(filter).exec();
    const users = await this.userModel
      .find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .exec();

    return {
      users,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit) || 1,
    };
  }

  async deleteUser(
    targetUserId: string,
    currentAdminId: string,
  ): Promise<{ id: string; name: string; email: string; isDeleted: boolean; message: string }> {
    if (targetUserId === currentAdminId) {
      throw new BadRequestException('Administrators cannot delete their own account');
    }

    const user = await this.findById(targetUserId);
    if (!user) {
      throw new NotFoundException(`User with ID '${targetUserId}' not found`);
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      isDeleted: true,
      message: 'User account marked as deleted successfully',
    };
  }

  async restoreUser(
    targetUserId: string,
  ): Promise<{ id: string; name: string; email: string; isDeleted: boolean; message: string }> {
    const user = await this.findById(targetUserId);
    if (!user) {
      throw new NotFoundException(`User with ID '${targetUserId}' not found`);
    }

    user.isDeleted = false;
    user.deletedAt = undefined;
    await user.save();

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      isDeleted: false,
      message: 'User account restored successfully',
    };
  }

  async adminUpdateUser(
    targetUserId: string,
    dto: AdminUpdateUserDto,
  ): Promise<UserDocument> {
    const user = await this.findById(targetUserId);
    if (!user) {
      throw new NotFoundException(`User with ID '${targetUserId}' not found`);
    }

    if (dto.email && dto.email.toLowerCase().trim() !== user.email) {
      const existing = await this.findByEmail(dto.email);
      if (existing && existing._id.toString() !== targetUserId) {
        throw new ConflictException('Email is already registered by another user');
      }
      user.email = dto.email.toLowerCase().trim();
    }

    if (dto.name !== undefined) user.name = dto.name.trim();
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.title !== undefined) user.title = dto.title.trim() || undefined;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl || undefined;

    if (dto.isDeleted !== undefined) {
      user.isDeleted = dto.isDeleted;
      user.deletedAt = dto.isDeleted ? new Date() : undefined;
    }

    return user.save();
  }
}
