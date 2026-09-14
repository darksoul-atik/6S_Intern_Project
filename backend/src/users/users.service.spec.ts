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
    mockUserModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockUser),
    });

    const result = await service.getProfileById(validId);
    expect(result).toEqual(mockUser);
  });

  it('should throw NotFoundException on getProfileById if user does not exist', async () => {
    const validId = '507f1f77bcf86cd799439011';
    mockUserModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
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
    mockUserModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockUser),
    });

    const result = await service.updateBasicProfile(validId, { name: '  New Name  ' });
    expect(result.name).toBe('New Name');
    expect(mockUser.save).toHaveBeenCalled();
  });

  it('should throw NotFoundException on updateBasicProfile if user does not exist', async () => {
    const validId = '507f1f77bcf86cd799439011';
    mockUserModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });

    await expect(
      service.updateBasicProfile(validId, { name: 'New Name' }),
    ).rejects.toThrow('User profile not found');
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
});
