import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service.js';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUsersService: any;
  let mockJwtService: any;

  beforeEach(() => {
    mockUsersService = {
      findByEmail: vi.fn(),
      create: vi.fn(),
    };
    mockJwtService = {
      sign: vi.fn().mockReturnValue('mocked-jwt-token'),
    };
    authService = new AuthService(mockUsersService, mockJwtService);
  });

  describe('signup', () => {
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

      const createArg = mockUsersService.create.mock.calls[0][0];
      expect(createArg.passwordHash).not.toBe('SuperSecret123');
      const isPasswordValid = await bcrypt.compare('SuperSecret123', createArg.passwordHash);
      expect(isPasswordValid).toBe(true);

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

  describe('login', () => {
    it('should authenticate valid credentials and issue signed JWT', async () => {
      const passwordHash = await bcrypt.hash('Secret123', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        _id: 'user-789',
        name: 'Alex Chen',
        email: 'alex.chen@devpulse.io',
        passwordHash,
        role: 'user',
      });

      const loginDto = {
        email: 'Alex.Chen@devpulse.io',
        password: 'Secret123',
      };

      const result = await authService.login(loginDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('alex.chen@devpulse.io');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-789',
        email: 'alex.chen@devpulse.io',
        role: 'user',
      });
      expect(result.data.accessToken).toBe('mocked-jwt-token');
      expect(result.data.user.email).toBe('alex.chen@devpulse.io');
      expect(result.data.user.role).toBe('user');
      expect(result.message).toBe('Login successful');
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      const passwordHash = await bcrypt.hash('CorrectPassword', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        _id: 'user-789',
        name: 'Alex Chen',
        email: 'alex.chen@devpulse.io',
        passwordHash,
        role: 'user',
      });

      const loginDto = {
        email: 'alex.chen@devpulse.io',
        password: 'WrongPassword',
      };

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const loginDto = {
        email: 'nonexistent@devpulse.io',
        password: 'anyPassword',
      };

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
