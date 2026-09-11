import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service.js';
import { SignupDto } from './dto/signup.dto.js';
import { LoginDto } from './dto/login.dto.js';

export interface UserResponseData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginResponseData {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(
    signupDto: SignupDto,
  ): Promise<{ data: UserResponseData; message: string }> {
    const normalizedEmail = signupDto.email.toLowerCase().trim();

    // Check if email is already taken
    const existingUser = await this.usersService.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    // Hash the password with bcrypt (never store or log plain text)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(signupDto.password.trim(), saltRounds);

    // Explicitly enforce role as 'user' for public signup
    const newUser = await this.usersService.create({
      name: signupDto.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user',
    });

    console.log(`[AuthService.signup] User created: "${normalizedEmail}" (${newUser.role})`);

    return {
      data: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
      message: 'User registered successfully',
    };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ data: LoginResponseData; message: string }> {
    const normalizedEmail = loginDto.email?.toLowerCase()?.trim();
    console.log(`[AuthService.login] Login attempt for email: "${normalizedEmail}"`);

    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      console.warn(`[AuthService.login] FAILED: User not found in DB for email "${normalizedEmail}"`);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Compare with exact password first
    let isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    // If exact comparison failed, also test trimmed password (handles accidental copy-paste or mobile keyboard trailing spaces)
    if (!isPasswordValid && loginDto.password && loginDto.password.trim() !== loginDto.password) {
      isPasswordValid = await bcrypt.compare(
        loginDto.password.trim(),
        user.passwordHash,
      );
      if (isPasswordValid) {
        console.log(`[AuthService.login] Password matched via trimmed fallback for "${normalizedEmail}"`);
      }
    }

    if (!isPasswordValid) {
      console.warn(`[AuthService.login] FAILED: Invalid password for email "${normalizedEmail}" (provided password length: ${loginDto.password?.length})`);
      throw new UnauthorizedException('Invalid email or password');
    }

    console.log(`[AuthService.login] SUCCESS: "${normalizedEmail}" (role: ${user.role}) authenticated successfully`);

    // Construct JWT payload containing sub (userId), email, and role
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      data: {
        accessToken,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      message: 'Login successful',
    };
  }
}
