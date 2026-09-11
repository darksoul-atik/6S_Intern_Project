import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service.js';
import { ConflictException } from '@nestjs/common';
import bcrypt from 'bcryptjs';

describe('AuthService - Signup', () => {
  let authService: AuthService;
  let mockUsersService: any;

  beforeEach(() => {
    mockUsersService = {
      findByEmail: vi.fn(),
      create: vi.fn(),
    };
    authService = new AuthService(mockUsersService);
  });

  it('should successfully register a user and hash the password', async () => {
    mockUsersService.findByEmail.mockResolvedValue(null);
    mockUsersService.create.mockImplementation((dto: any) =>
      Promise.resolve({
        _id: 'mock-user-123',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    const signupDto = {
      name: 'Jane Doe',
      email: 'Jane.Doe@devpulse.io',
      password: 'SuperSecret123',
    };

    const result = await authService.signup(signupDto);

    expect(mockUsersService.findByEmail).toHaveBeenCalledWith('jane.doe@devpulse.io');
    expect(mockUsersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Jane Doe',
        email: 'jane.doe@devpulse.io',
        role: 'user',
      }),
    );

    // Verify password is not plain text in create call
    const createArg = mockUsersService.create.mock.calls[0][0];
    expect(createArg.passwordHash).not.toBe('SuperSecret123');
    const isPasswordValid = await bcrypt.compare('SuperSecret123', createArg.passwordHash);
    expect(isPasswordValid).toBe(true);

    // Verify response envelope and omission of passwordHash
    expect(result.data.email).toBe('jane.doe@devpulse.io');
    expect(result.data.role).toBe('user');
    expect((result.data as any).passwordHash).toBeUndefined();
    expect(result.message).toBe('User registered successfully');
  });

  it('should throw ConflictException if email already exists', async () => {
    mockUsersService.findByEmail.mockResolvedValue({
      _id: 'existing-id',
      email: 'taken@devpulse.io',
    });

    const signupDto = {
      name: 'Existing Person',
      email: 'taken@devpulse.io',
      password: 'password123',
    };

    await expect(authService.signup(signupDto)).rejects.toThrow(ConflictException);
  });
});
