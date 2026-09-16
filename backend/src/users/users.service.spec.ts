import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserModel: any;

  beforeEach(() => {
    function MockModel(this: any, dto: any) {
      Object.assign(this, dto);
      this.save = vi.fn().mockResolvedValue({
        _id: 'mock-user-id',
        ...dto,
        role: dto.role || 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    mockUserModel = MockModel;
    mockUserModel.findOne = vi.fn();
    mockUserModel.findById = vi.fn();
    mockUserModel.find = vi.fn();
    mockUserModel.countDocuments = vi.fn();

    service = new UsersService(mockUserModel as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a user with default role "user"', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: 'hashedpassword',
    };

    const result = await service.create(userData);
    expect(result).toBeDefined();
    expect(result.email).toBe('test@example.com');
    expect(result.role).toBe('user');
  });

  it('should find user by lowercase trimmed email', async () => {
    const mockExec = vi.fn().mockResolvedValue({
      _id: 'mock-user-id',
      email: 'test@example.com',
      role: 'user',
    });
    mockUserModel.findOne.mockReturnValue({ exec: mockExec });

    const result = await service.findByEmail('  TEST@Example.com  ');
    expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(result).toBeDefined();
    expect(result?.email).toBe('test@example.com');
  });

  it('should return user profile on getMe for valid id', async () => {
    const validId = '507f1f77bcf86cd799439011';
    const mockUser = {
      _id: validId,
      name: 'Alice',
      skills: ['TypeScript'],
      experiences: [],
    };
    mockUserModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockUser),
    });

    const result = await service.getMe(validId);
    expect(result).toEqual(mockUser);
  });

  it('should throw NotFoundException on getMe if user does not exist', async () => {
    const validId = '507f1f77bcf86cd799439011';
    mockUserModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });

    await expect(service.getMe(validId)).rejects.toThrow('User profile not found');
  });

  it('should return public profile on getProfileById', async () => {
    const validId = '507f1f77bcf86cd799439011';
    const mockUser = {
      _id: validId,
      name: 'Bob',
      skills: ['React'],
      experiences: [],
    };
    mockUserModel.findOne.mockReturnValue({
      select: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockUser),
      }),
    });

    const result = await service.getProfileById(validId);
    expect(result).toEqual(mockUser);
  });

  it('should throw NotFoundException on getProfileById if user does not exist', async () => {
    const validId = '507f1f77bcf86cd799439011';
    mockUserModel.findOne.mockReturnValue({
      select: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      }),
    });

    await expect(service.getProfileById(validId)).rejects.toThrow(
      "Developer profile with ID '507f1f77bcf86cd799439011' not found",
    );
  });

  it('should update user name on updateBasicProfile', async () => {
    const validId = '507f1f77bcf86cd799439011';
    const mockUser = {
      _id: validId,
      name: 'Old Name',
      save: vi.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };
    mockUserModel.findOne.mockReturnValue({
      then: (resolve: any) => resolve(mockUser),
      select: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockUser),
      }),
    });

    const result = await service.updateBasicProfile(validId, { name: 'New Name' });
    expect(result.name).toBe('New Name');
    expect(mockUser.save).toHaveBeenCalled();
  });

  it('should throw NotFoundException on updateBasicProfile if user does not exist', async () => {
    const validId = '507f1f77bcf86cd799439011';
    mockUserModel.findOne.mockReturnValue({
      then: (resolve: any) => resolve(null),
      select: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      service.updateBasicProfile(validId, { name: 'New Name' }),
    ).rejects.toThrow('User profile not found');
  });

  it('should add a portfolio project to profile', async () => {
    const validId = '507f1f77bcf86cd799439011';
    const mockUser: any = {
      _id: validId,
      portfolioProjects: [],
      save: vi.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };
    mockUserModel.findOne.mockReturnValue({
      then: (resolve: any) => resolve(mockUser),
      select: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockUser),
      }),
    });

    const projectDto: any = {
      title: 'DevPulse',
      description: 'Developer networking platform',
      urls: ['https://devpulse.io'],
      technologies: ['NestJS', 'React'],
      startDate: '2026-01',
      isCurrent: true,
    };

    const result = await service.addPortfolioProject(validId, projectDto);
    expect(mockUser.save).toHaveBeenCalled();
    expect(mockUser.portfolioProjects.length).toBe(1);
    expect(mockUser.portfolioProjects[0].title).toBe('DevPulse');
    expect(result).toBeDefined();
  });

  it('should add a skill and avoid duplicates', async () => {
    const validId = '507f1f77bcf86cd799439011';
    const mockUser = {
      _id: validId,
      skills: ['TypeScript'],
      save: vi.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };
    mockUserModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockUser),
    });

    const res1 = await service.addSkill(validId, 'React');
    expect(res1.skills).toContain('React');
    expect(mockUser.skills).toHaveLength(2);

    // Duplicate add should be ignored
    const res2 = await service.addSkill(validId, 'typescript');
    expect(res2.skills).toHaveLength(2);
  });

  it('should remove a skill case-insensitively', async () => {
    const validId = '507f1f77bcf86cd799439011';
    const mockUser = {
      _id: validId,
      skills: ['TypeScript', 'Docker', 'NestJS'],
      save: vi.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };
    mockUserModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockUser),
    });

    const res = await service.removeSkill(validId, 'docker');
    expect(res.skills).not.toContain('Docker');
    expect(res.skills).toEqual(['TypeScript', 'NestJS']);
  });

  it('should update and clean skills array', async () => {
    const validId = '507f1f77bcf86cd799439011';
    const mockUser = {
      _id: validId,
      skills: ['Old'],
      save: vi.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };
    mockUserModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockUser),
    });

    const res = await service.updateSkills(validId, [
      ' Go ',
      'Python',
      'go',
      '',
    ]);
    expect(res.skills).toEqual(['Go', 'Python']);
  });

  it('should add a new experience subdocument', async () => {
    const validId = '507f1f77bcf86cd799439011';
    const mockUser = {
      _id: validId,
      experiences: [] as any[],
      save: vi.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };
    mockUserModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockUser),
    });

    const res = await service.addExperience(validId, {
      title: 'Senior Engineer',
      company: '6sense',
      from: '2022-01',
      to: 'Present',
      description: 'Building microservices',
    });

    expect(res.experiences).toHaveLength(1);
    expect(res.experiences[0].title).toBe('Senior Engineer');
    expect(res.experiences[0].company).toBe('6sense');
  });

  it('should update an existing experience subdocument', async () => {
    const validId = '507f1f77bcf86cd799439011';
    const expId = 'exp-123';
    const mockUser = {
      _id: validId,
      experiences: [
        {
          _id: expId,
          title: 'Junior Engineer',
          company: 'Old Co',
          from: '2020-01',
        },
      ],
      save: vi.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };
    mockUserModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockUser),
    });

    const res = await service.updateExperience(validId, expId, {
      title: 'Lead Engineer',
    });

    expect(res.experiences[0].title).toBe('Lead Engineer');
    expect(res.experiences[0].company).toBe('Old Co');
  });

  it('should remove an existing experience subdocument', async () => {
    const validId = '507f1f77bcf86cd799439011';
    const expId = 'exp-123';
    const mockUser = {
      _id: validId,
      experiences: [
        {
          _id: expId,
          title: 'Junior Engineer',
          company: 'Old Co',
          from: '2020-01',
        },
      ],
      save: vi.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };
    mockUserModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockUser),
    });

    const res = await service.removeExperience(validId, expId);
    expect(res.experiences).toHaveLength(0);
  });

  describe('findAllUsers', () => {
    it('should return paginated users list with metadata', async () => {
      mockUserModel.countDocuments.mockReturnValue({
        exec: vi.fn().mockResolvedValue(15),
      });
      const mockUsers = [{ name: 'User 1' }, { name: 'User 2' }];
      mockUserModel.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            skip: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                exec: vi.fn().mockResolvedValue(mockUsers),
              }),
            }),
          }),
        }),
      });

      const result = await service.findAllUsers({ page: 1, limit: 10 });
      expect(result.users).toEqual(mockUsers);
      expect(result.total).toBe(15);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(2);
    });
  });

  describe('deleteUser and restoreUser', () => {
    const adminId = '507f1f77bcf86cd799439011';
    const targetUserId = '507f1f77bcf86cd799439022';

    it('should throw BadRequestException if admin attempts to delete own account', async () => {
      await expect(service.deleteUser(adminId, adminId)).rejects.toThrow(
        'Administrators cannot delete their own account',
      );
    });

    it('should mark target user as deleted', async () => {
      const mockUser = {
        _id: targetUserId,
        name: 'Target User',
        email: 'target@example.com',
        isDeleted: false,
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };
      mockUserModel.findById.mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockUser),
      });

      const result = await service.deleteUser(targetUserId, adminId);
      expect(result.isDeleted).toBe(true);
      expect(mockUser.isDeleted).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should restore a deleted user', async () => {
      const mockUser = {
        _id: targetUserId,
        name: 'Target User',
        email: 'target@example.com',
        isDeleted: true,
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };
      mockUserModel.findById.mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockUser),
      });

      const result = await service.restoreUser(targetUserId);
      expect(result.isDeleted).toBe(false);
      expect(mockUser.isDeleted).toBe(false);
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('adminUpdateUser', () => {
    const validId = '507f1f77bcf86cd799439011';

    it('should update user fields by admin', async () => {
      const mockUser = {
        _id: validId,
        name: 'Old Name',
        email: 'old@example.com',
        role: 'user',
        headline: 'Junior',
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };
      mockUserModel.findById.mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockUser),
      });
      mockUserModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      const result = await service.adminUpdateUser(validId, {
        name: 'New Name',
        email: 'new@example.com',
        role: 'admin',
        headline: 'Senior Engineer',
      });

      expect(result.name).toBe('New Name');
      expect(result.email).toBe('new@example.com');
      expect(result.role).toBe('admin');
      expect(result.headline).toBe('Senior Engineer');
    });
  });
});
