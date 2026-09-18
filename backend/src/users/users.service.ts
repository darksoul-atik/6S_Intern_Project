import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { User, UserDocument } from './schemas/user.schema.js';
import { UpdatePortfolioProjectDto } from './dto/update-portfolio-project.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { PortfolioProjectDto } from './dto/portfolio-project.dto.js';
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
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // ---------------------------------------------------------------------------
  // Basic user lookup
  // ---------------------------------------------------------------------------

  async create(userData: Partial<User>): Promise<UserDocument> {
    const createdUser = new this.userModel(userData);

    return createdUser.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        email: email.toLowerCase().trim(),
      })
      .exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return null;
    }

    return this.userModel.findById(id).exec();
  }

  // ---------------------------------------------------------------------------
  // Existing account/current-user lookup
  // ---------------------------------------------------------------------------

  async getMe(userId: string): Promise<UserDocument> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return user;
  }

  // ---------------------------------------------------------------------------
  // Day 7: post count helpers
  // ---------------------------------------------------------------------------

  async incrementPostsCount(userId: string): Promise<void> {
    const result = await this.userModel
      .updateOne(
        {
          _id: userId,
          isDeleted: { $ne: true },
        },
        {
          $inc: { postsCount: 1 },
        },
      )
      .exec();

    if (result.matchedCount === 0) {
      throw new NotFoundException('User profile not found');
    }
  }

  async decrementPostsCount(userId: string): Promise<void> {
    const result = await this.userModel
      .updateOne(
        {
          _id: userId,
        },
        {
          $inc: { postsCount: -1 },
        },
      )
      .exec();

    if (result.matchedCount === 0) {
      throw new NotFoundException('User profile not found');
    }
  }

  // ---------------------------------------------------------------------------
  // Day 5: private profile
  // GET /profile/me will use this
  // ---------------------------------------------------------------------------

  async getMyProfile(userId: string): Promise<UserDocument> {
    const user = await this.userModel
      .findOne({
        _id: userId,
        isDeleted: { $ne: true },
      })
      .select(
        'name headline bio avatarUrl skills experiences portfolioProjects postsCount commentsCount reactionsCount topRankedCount createdAt',
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return user;
  }

  // ---------------------------------------------------------------------------
  // Public developer profile
  // Only explicitly approved public profile fields are returned
  // ---------------------------------------------------------------------------

  async getProfileById(id: string): Promise<UserDocument> {
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new NotFoundException(
        `Developer profile with ID '${id}' not found`,
      );
    }

    const user = await this.userModel
      .findOne({
        _id: id,
        isDeleted: { $ne: true },
      })
      .select(
        'name headline bio avatarUrl skills experiences portfolioProjects postsCount commentsCount reactionsCount topRankedCount createdAt',
      )
      .exec();

    if (!user) {
      throw new NotFoundException(
        `Developer profile with ID '${id}' not found`,
      );
    }

    return user;
  }

  // ---------------------------------------------------------------------------
  // Day 5: basic profile update
  // PATCH /profile/me will use this
  // ---------------------------------------------------------------------------

  async updateBasicProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserDocument> {
    const user = await this.userModel.findOne({
      _id: userId,
      isDeleted: { $ne: true },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    if (updateProfileDto.name !== undefined) {
      user.name = updateProfileDto.name;
    }

    if (updateProfileDto.headline !== undefined) {
      user.headline = updateProfileDto.headline ?? undefined;
    }

    if (updateProfileDto.bio !== undefined) {
      user.bio = updateProfileDto.bio ?? undefined;
    }

    if (updateProfileDto.avatarUrl !== undefined) {
      user.avatarUrl = updateProfileDto.avatarUrl ?? undefined;
    }

    await user.save();

    return this.getMyProfile(userId);
  }

  // ---------------------------------------------------------------------------
  // Skills
  // ---------------------------------------------------------------------------

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
      (existingSkill) => existingSkill.toLowerCase() === trimmed.toLowerCase(),
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
      user.skills = user.skills.filter(
        (existingSkill) => existingSkill.toLowerCase() !== trimmed,
      );

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

  // ---------------------------------------------------------------------------
  // Experiences
  // ---------------------------------------------------------------------------

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
      (experience) => experience._id?.toString() === experienceId,
    );

    if (expIndex === -1) {
      throw new NotFoundException(
        `Experience with ID '${experienceId}' not found`,
      );
    }

    const target = user.experiences[expIndex];

    if (expDto.title !== undefined) {
      target.title = expDto.title.trim();
    }

    if (expDto.company !== undefined) {
      target.company = expDto.company.trim();
    }

    if (expDto.from !== undefined) {
      target.from = expDto.from.trim();
    }

    if (expDto.to !== undefined) {
      target.to = expDto.to.trim();
    }

    if (expDto.description !== undefined) {
      target.description = expDto.description.trim();
    }

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
      (experience) => experience._id?.toString() === experienceId,
    );

    if (expIndex === -1) {
      throw new NotFoundException(
        `Experience with ID '${experienceId}' not found`,
      );
    }

    user.experiences.splice(expIndex, 1);

    return user.save();
  }

  // ---------------------------------------------------------------------------
  // Day 5: Portfolio Projects
  // POST /profile/me/projects will use this
  // ---------------------------------------------------------------------------

  async addPortfolioProject(
    userId: string,
    projectDto: PortfolioProjectDto,
  ): Promise<UserDocument> {
    const user = await this.userModel.findOne({
      _id: userId,
      isDeleted: { $ne: true },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    if (!user.portfolioProjects) {
      user.portfolioProjects = [];
    }

    user.portfolioProjects.push({
      title: projectDto.title,
      description: projectDto.description,
      urls: projectDto.urls ?? [],
      technologies: projectDto.technologies,
      startDate: projectDto.startDate,
      endDate: projectDto.endDate,
      isCurrent: projectDto.isCurrent,
    });

    await user.save();

    return this.getMyProfile(userId);
  }

  async updatePortfolioProject(
    userId: string,
    projectId: string,
    dto: UpdatePortfolioProjectDto,
  ): Promise<UserDocument> {
    const user = await this.userModel.findOne({
      _id: userId,
      isDeleted: { $ne: true },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const project = user.portfolioProjects.find(
      (item) => item._id?.toString() === projectId,
    );

    if (!project) {
      throw new NotFoundException(
        `Portfolio project with ID '${projectId}' not found`,
      );
    }

    /*
     * First calculate what the final project state would be
     * after applying this PATCH.
     */
    const nextStartDate = dto.startDate ?? project.startDate;

    const nextIsCurrent = dto.isCurrent ?? project.isCurrent;

    let nextEndDate = project.endDate;

    /*
     * Current project:
     * endDate must not exist.
     */
    if (nextIsCurrent) {
      if (dto.endDate !== undefined) {
        throw new BadRequestException(
          'endDate must not be provided when isCurrent is true',
        );
      }

      nextEndDate = undefined;
    } else {
      /*
       * Finished project:
       * use new endDate if provided,
       * otherwise keep the existing one.
       */
      nextEndDate = dto.endDate ?? project.endDate;

      if (!nextEndDate) {
        throw new BadRequestException(
          'endDate is required when isCurrent is false',
        );
      }

      if (nextEndDate < nextStartDate) {
        throw new BadRequestException(
          'endDate must be the same as or later than startDate',
        );
      }
    }

    /*
     * Apply only fields actually sent by the client.
     */
    if (dto.title !== undefined) {
      project.title = dto.title;
    }

    if (dto.description !== undefined) {
      project.description = dto.description;
    }

    if (dto.urls !== undefined) {
      project.urls = dto.urls;
    }

    if (dto.technologies !== undefined) {
      project.technologies = dto.technologies;
    }

    if (dto.startDate !== undefined) {
      project.startDate = dto.startDate;
    }

    if (dto.isCurrent !== undefined) {
      project.isCurrent = dto.isCurrent;
    }

    project.endDate = nextEndDate;

    await user.save();

    return this.getMyProfile(userId);
  }

  async removePortfolioProject(
    userId: string,
    projectId: string,
  ): Promise<UserDocument> {
    const user = await this.userModel.findOne({
      _id: userId,
      isDeleted: { $ne: true },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const projectIndex = user.portfolioProjects.findIndex(
      (project) => project._id?.toString() === projectId,
    );

    if (projectIndex === -1) {
      throw new NotFoundException(
        `Portfolio project with ID '${projectId}' not found`,
      );
    }

    user.portfolioProjects.splice(projectIndex, 1);

    await user.save();

    return this.getMyProfile(userId);
  }

  // ---------------------------------------------------------------------------
  // Admin user list
  // ---------------------------------------------------------------------------

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
        {
          name: {
            $regex: term,
            $options: 'i',
          },
        },
        {
          email: {
            $regex: term,
            $options: 'i',
          },
        },
        {
          headline: {
            $regex: term,
            $options: 'i',
          },
        },
        {
          bio: {
            $regex: term,
            $options: 'i',
          },
        },
      ];
    }

    const total = await this.userModel.countDocuments(filter).exec();

    const users = await this.userModel
      .find(filter)
      .select('-passwordHash')
      .sort({
        createdAt: -1,
      })
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

  // ---------------------------------------------------------------------------
  // Admin delete
  // ---------------------------------------------------------------------------

  async deleteUser(
    targetUserId: string,
    currentAdminId: string,
  ): Promise<{
    id: string;
    name: string;
    email: string;
    isDeleted: boolean;
    message: string;
  }> {
    if (targetUserId === currentAdminId) {
      throw new BadRequestException(
        'Administrators cannot delete their own account',
      );
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

  // ---------------------------------------------------------------------------
  // Admin restore
  // ---------------------------------------------------------------------------

  async restoreUser(targetUserId: string): Promise<{
    id: string;
    name: string;
    email: string;
    isDeleted: boolean;
    message: string;
  }> {
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

  // ---------------------------------------------------------------------------
  // Admin update
  // ---------------------------------------------------------------------------

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
        throw new ConflictException(
          'Email is already registered by another user',
        );
      }

      user.email = dto.email.toLowerCase().trim();
    }

    if (dto.name !== undefined) {
      user.name = dto.name.trim();
    }

    if (dto.role !== undefined) {
      user.role = dto.role;
    }

    if (dto.headline !== undefined) {
      user.headline = dto.headline.trim() || undefined;
    }

    if (dto.bio !== undefined) {
      user.bio = dto.bio.trim() || undefined;
    }

    if (dto.avatarUrl !== undefined) {
      user.avatarUrl = dto.avatarUrl || undefined;
    }

    if (dto.isDeleted !== undefined) {
      user.isDeleted = dto.isDeleted;

      user.deletedAt = dto.isDeleted ? new Date() : undefined;
    }

    return user.save();
  }
}
