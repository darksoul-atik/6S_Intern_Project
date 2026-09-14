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
});
